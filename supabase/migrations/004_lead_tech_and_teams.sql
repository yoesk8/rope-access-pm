-- Migration 004: Lead Technician role, Teams, and Task Photos

-- 1. Update profiles role constraint to include lead_tech
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'manager', 'lead_tech', 'technician'));

-- 2. Teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  lead_tech_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 3. Team members join table
CREATE TABLE public.team_members (
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, user_id)
);

-- 4. Task photos table
CREATE TABLE public.task_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 5. Storage bucket for task photos (public so thumbnails load easily)
INSERT INTO storage.buckets (id, name, public) VALUES ('task-photos', 'task-photos', true)
ON CONFLICT DO NOTHING;

-- 6. RLS for teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_photos ENABLE ROW LEVEL SECURITY;

-- Admins/managers can do everything with teams
CREATE POLICY "admin_manager_all_teams" ON public.teams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Lead techs can view teams they lead
CREATE POLICY "lead_tech_view_own_team" ON public.teams
  FOR SELECT USING (lead_tech_id = auth.uid());

-- Admins/managers manage team members
CREATE POLICY "admin_manager_all_team_members" ON public.team_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Users can view teams they belong to, lead techs can view their team's members
CREATE POLICY "members_view_team_members" ON public.team_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND lead_tech_id = auth.uid())
  );

-- 7. Task photos RLS
CREATE POLICY "project_members_view_task_photos" ON public.task_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.project_members pm ON pm.project_id = t.project_id
      WHERE t.id = task_id AND pm.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'lead_tech'))
  );

CREATE POLICY "authenticated_insert_task_photos" ON public.task_photos
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "uploader_delete_task_photos" ON public.task_photos
  FOR DELETE USING (auth.uid() = uploaded_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- 8. Storage policies for task-photos bucket
CREATE POLICY "authenticated_view_task_photos" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'task-photos');

CREATE POLICY "authenticated_upload_task_photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'task-photos');

CREATE POLICY "uploader_delete_task_photo_objects" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'task-photos');

-- 9. Allow lead_tech to update projects they are assigned to (e.g. mark complete)
DROP POLICY IF EXISTS "Admin and managers can update projects" ON public.projects;
CREATE POLICY "admin_manager_lead_tech_update_projects" ON public.projects
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')) OR
    (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'lead_tech') AND
      EXISTS (SELECT 1 FROM public.project_members WHERE project_id = id AND user_id = auth.uid())
    )
  );

-- 10. Allow lead_tech to manage project members (add/remove techs from their jobs)
DROP POLICY IF EXISTS "Admin and managers can manage project members" ON public.project_members;
CREATE POLICY "admin_manager_lead_tech_manage_project_members" ON public.project_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'lead_tech'))
  );
