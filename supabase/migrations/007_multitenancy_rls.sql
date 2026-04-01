-- Migration 007: Multi-tenancy — isolate all data per owner account

-- 1. Add owner_id to profiles (null for owner accounts, set for techs/lead_techs)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Update handle_new_user trigger to store owner_id and plan from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, plan, owner_id)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'technician'),
    COALESCE(new.raw_user_meta_data->>'plan', 'basic'),
    CASE
      WHEN new.raw_user_meta_data->>'owner_id' IS NOT NULL
      THEN (new.raw_user_meta_data->>'owner_id')::uuid
      ELSE NULL
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Projects RLS: owners see only their own, techs see only assigned
DROP POLICY IF EXISTS "View projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Admin and managers can create projects" ON public.projects;
DROP POLICY IF EXISTS "Admin and managers can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admin can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Owner creates projects" ON public.projects;
DROP POLICY IF EXISTS "Owner updates projects" ON public.projects;
DROP POLICY IF EXISTS "Owner deletes projects" ON public.projects;

CREATE POLICY "View projects" ON public.projects FOR SELECT USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = projects.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Owner creates projects" ON public.projects FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  AND created_by = auth.uid()
);

CREATE POLICY "Owner updates projects" ON public.projects FOR UPDATE USING (
  created_by = auth.uid()
);

CREATE POLICY "Owner deletes projects" ON public.projects FOR DELETE USING (
  created_by = auth.uid()
);

-- 4. Profiles RLS: scoped to each owner's team
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "View profiles" ON public.profiles;

CREATE POLICY "View profiles" ON public.profiles FOR SELECT USING (
  -- Own profile always visible
  auth.uid() = id
  OR
  -- Owner sees their team members
  owner_id = auth.uid()
  OR
  -- Techs/lead_techs see co-members in shared projects
  EXISTS (
    SELECT 1 FROM public.project_members pm1
    JOIN public.project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.user_id = auth.uid() AND pm2.user_id = profiles.id
  )
  OR
  -- Techs can see their own owner's profile (for Contact Manager)
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.owner_id = profiles.id
  )
);

-- 5. Project members RLS: scoped to owner's projects
DROP POLICY IF EXISTS "Authenticated users can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Admin and managers can manage project members" ON public.project_members;
DROP POLICY IF EXISTS "View project members" ON public.project_members;
DROP POLICY IF EXISTS "Owner manages project members" ON public.project_members;

CREATE POLICY "View project members" ON public.project_members FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.created_by = auth.uid()
  )
);

CREATE POLICY "Owner manages project members" ON public.project_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.created_by = auth.uid()
  )
);
