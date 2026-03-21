-- Migration 005: Three-role model (owner, lead_tech, technician) + plan/tier system

-- 1. Migrate existing admin/manager roles → owner
UPDATE public.profiles SET role = 'owner' WHERE role IN ('admin', 'manager');

-- 2. Update role constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'lead_tech', 'technician'));

-- 3. Add plan column (applies to owner accounts)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'basic'
  CHECK (plan IN ('basic', 'field', 'operations'));

-- 4. Update handle_new_user: default new direct signups to 'owner'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'owner')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Projects — view
DROP POLICY IF EXISTS "View projects" ON public.projects;
CREATE POLICY "View projects" ON public.projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  OR
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid())
);

-- Projects — insert (owner only)
DROP POLICY IF EXISTS "Admin and managers can create projects" ON public.projects;
DROP POLICY IF EXISTS "owner_create_projects" ON public.projects;
CREATE POLICY "owner_create_projects" ON public.projects
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Projects — update (owner or lead_tech on assigned project)
DROP POLICY IF EXISTS "admin_manager_lead_tech_update_projects" ON public.projects;
DROP POLICY IF EXISTS "owner_lead_tech_update_projects" ON public.projects;
CREATE POLICY "owner_lead_tech_update_projects" ON public.projects
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner') OR
    (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'lead_tech') AND
      EXISTS (SELECT 1 FROM public.project_members WHERE project_id = id AND user_id = auth.uid())
    )
  );

-- Projects — delete (owner only)
DROP POLICY IF EXISTS "Admin can delete projects" ON public.projects;
DROP POLICY IF EXISTS "owner_delete_projects" ON public.projects;
CREATE POLICY "owner_delete_projects" ON public.projects
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- 6. Project members
DROP POLICY IF EXISTS "Admin and managers can manage project members" ON public.project_members;
DROP POLICY IF EXISTS "admin_manager_lead_tech_manage_project_members" ON public.project_members;
DROP POLICY IF EXISTS "owner_lead_tech_manage_project_members" ON public.project_members;
CREATE POLICY "owner_lead_tech_manage_project_members" ON public.project_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'lead_tech'))
  );

-- 7. Tasks — view
DROP POLICY IF EXISTS "View tasks" ON public.tasks;
CREATE POLICY "View tasks" ON public.tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  OR
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = tasks.project_id AND user_id = auth.uid())
);

-- 8. Photos — view
DROP POLICY IF EXISTS "View photos" ON public.photos;
CREATE POLICY "View photos" ON public.photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  OR
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = photos.project_id AND user_id = auth.uid())
);

-- 9. Daily logs — view
DROP POLICY IF EXISTS "View daily logs" ON public.daily_logs;
CREATE POLICY "View daily logs" ON public.daily_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  OR
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = daily_logs.project_id AND user_id = auth.uid())
);

-- 10. Checklist submissions — view
DROP POLICY IF EXISTS "View checklist submissions" ON public.checklist_submissions;
CREATE POLICY "View checklist submissions" ON public.checklist_submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  OR
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = checklist_submissions.project_id AND user_id = auth.uid())
);

-- 11. Documents — view
DROP POLICY IF EXISTS "View documents" ON public.documents;
CREATE POLICY "View documents" ON public.documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  OR
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = documents.project_id AND user_id = auth.uid())
);

-- Documents — insert (owner or lead_tech)
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON public.documents;
DROP POLICY IF EXISTS "owner_lead_tech_upload_documents" ON public.documents;
CREATE POLICY "owner_lead_tech_upload_documents" ON public.documents
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'lead_tech'))
  );

-- Documents — delete (owner only)
DROP POLICY IF EXISTS "Admin and managers can delete documents" ON public.documents;
DROP POLICY IF EXISTS "owner_delete_documents" ON public.documents;
CREATE POLICY "owner_delete_documents" ON public.documents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- 12. Timesheets
DROP POLICY IF EXISTS "Users can view own timesheets" ON public.timesheets;
CREATE POLICY "timesheets_view" ON public.timesheets
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  );

DROP POLICY IF EXISTS "Users can update own pending timesheets" ON public.timesheets;
CREATE POLICY "timesheets_update" ON public.timesheets
  FOR UPDATE USING (
    (auth.uid() = user_id AND status = 'pending') OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- 13. Teams
DROP POLICY IF EXISTS "admin_manager_all_teams" ON public.teams;
DROP POLICY IF EXISTS "owner_all_teams" ON public.teams;
CREATE POLICY "owner_all_teams" ON public.teams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  );

DROP POLICY IF EXISTS "admin_manager_all_team_members" ON public.team_members;
DROP POLICY IF EXISTS "owner_all_team_members" ON public.team_members;
CREATE POLICY "owner_all_team_members" ON public.team_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- 14. Task photos — update to use 'owner'
DROP POLICY IF EXISTS "project_members_view_task_photos" ON public.task_photos;
CREATE POLICY "project_members_view_task_photos" ON public.task_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.project_members pm ON pm.project_id = t.project_id
      WHERE t.id = task_id AND pm.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'lead_tech'))
  );

-- 15. Storage: documents (owner and lead_tech can upload)
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin and managers can delete documents" ON storage.objects;

CREATE POLICY "owner_lead_tech_upload_storage_docs" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'documents' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'lead_tech'))
  );

CREATE POLICY "owner_delete_storage_docs" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'documents' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  );
