-- ============================================================
-- Messages table
-- ============================================================
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  from_user uuid references public.profiles(id) on delete cascade not null,
  to_user uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Users can view their own messages" on public.messages
  for select using (auth.uid() = from_user or auth.uid() = to_user);

create policy "Authenticated users can send messages" on public.messages
  for insert with check (auth.uid() = from_user);

create policy "Recipient can mark as read" on public.messages
  for update using (auth.uid() = to_user);

-- ============================================================
-- Update RLS: Projects — techs only see assigned projects
-- ============================================================
drop policy if exists "Authenticated users can view projects" on public.projects;

create policy "View projects" on public.projects for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
  or
  exists (select 1 from public.project_members where project_id = projects.id and user_id = auth.uid())
);

-- ============================================================
-- Update RLS: Tasks — techs only see tasks in their projects
-- ============================================================
drop policy if exists "Authenticated users can view tasks" on public.tasks;

create policy "View tasks" on public.tasks for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
  or
  exists (select 1 from public.project_members where project_id = tasks.project_id and user_id = auth.uid())
);

-- ============================================================
-- Update RLS: Photos — same as tasks
-- ============================================================
drop policy if exists "Authenticated users can view photos" on public.photos;

create policy "View photos" on public.photos for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
  or
  exists (select 1 from public.project_members where project_id = photos.project_id and user_id = auth.uid())
);

-- ============================================================
-- Update RLS: Daily logs — same as tasks
-- ============================================================
drop policy if exists "Authenticated users can view daily logs" on public.daily_logs;

create policy "View daily logs" on public.daily_logs for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
  or
  exists (select 1 from public.project_members where project_id = daily_logs.project_id and user_id = auth.uid())
);

-- ============================================================
-- Update RLS: Checklist submissions — same as tasks
-- ============================================================
drop policy if exists "Authenticated users can view submissions" on public.checklist_submissions;

create policy "View checklist submissions" on public.checklist_submissions for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
  or
  exists (select 1 from public.project_members where project_id = checklist_submissions.project_id and user_id = auth.uid())
);

-- ============================================================
-- Update RLS: Documents — techs can only see docs in their projects
-- ============================================================
drop policy if exists "Authenticated users can view documents" on public.documents;

create policy "View documents" on public.documents for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
  or
  exists (select 1 from public.project_members where project_id = documents.project_id and user_id = auth.uid())
);
