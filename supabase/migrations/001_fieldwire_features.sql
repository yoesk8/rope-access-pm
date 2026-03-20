-- Tasks
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Photos
create table public.photos (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  url text not null,
  caption text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Checklist templates
create table public.checklist_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null default 'safety' check (type in ('safety', 'pre_job', 'risk_assessment', 'custom')),
  items jsonb not null default '[]',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Checklist submissions (completed checklists per project)
create table public.checklist_submissions (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  template_id uuid references public.checklist_templates(id) on delete set null,
  name text not null,
  responses jsonb not null default '{}',
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Daily logs
create table public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  date date not null,
  weather text,
  crew_count integer,
  notes text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  unique(project_id, date)
);

-- RLS
alter table public.tasks enable row level security;
alter table public.photos enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_submissions enable row level security;
alter table public.daily_logs enable row level security;

-- Tasks policies
create policy "Authenticated users can view tasks" on public.tasks for select using (auth.role() = 'authenticated');
create policy "Authenticated users can create tasks" on public.tasks for insert with check (auth.role() = 'authenticated');
create policy "Assignee or admin/manager can update tasks" on public.tasks for update using (
  auth.uid() = assigned_to or auth.uid() = created_by or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
);
create policy "Admin and managers can delete tasks" on public.tasks for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
);

-- Photos policies
create policy "Authenticated users can view photos" on public.photos for select using (auth.role() = 'authenticated');
create policy "Authenticated users can upload photos" on public.photos for insert with check (auth.uid() = uploaded_by);
create policy "Admin and managers can delete photos" on public.photos for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
);

-- Checklist templates policies
create policy "Authenticated users can view templates" on public.checklist_templates for select using (auth.role() = 'authenticated');
create policy "Admin and managers can manage templates" on public.checklist_templates for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
);

-- Checklist submissions policies
create policy "Authenticated users can view submissions" on public.checklist_submissions for select using (auth.role() = 'authenticated');
create policy "Authenticated users can submit checklists" on public.checklist_submissions for insert with check (auth.role() = 'authenticated');

-- Daily logs policies
create policy "Authenticated users can view daily logs" on public.daily_logs for select using (auth.role() = 'authenticated');
create policy "Authenticated users can create daily logs" on public.daily_logs for insert with check (auth.role() = 'authenticated');
create policy "Creator or admin/manager can update daily logs" on public.daily_logs for update using (
  auth.uid() = created_by or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
);

-- Storage bucket for photos
insert into storage.buckets (id, name, public) values ('photos', 'photos', true);

create policy "Authenticated users can upload photos" on storage.objects
  for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');

create policy "Public can view photos" on storage.objects
  for select using (bucket_id = 'photos');

create policy "Admin and managers can delete photos" on storage.objects
  for delete using (
    bucket_id = 'photos' and
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
  );

-- Seed default checklist templates
insert into public.checklist_templates (name, type, items) values
(
  'Pre-Job Safety Briefing',
  'pre_job',
  '[
    {"id": "1", "label": "Site hazards identified and communicated to all crew"},
    {"id": "2", "label": "Emergency plan reviewed"},
    {"id": "3", "label": "Rescue plan in place"},
    {"id": "4", "label": "All PPE inspected and in good condition"},
    {"id": "5", "label": "Harnesses and lanyards checked"},
    {"id": "6", "label": "Anchor points verified by competent person"},
    {"id": "7", "label": "Weather conditions acceptable"},
    {"id": "8", "label": "Communication devices charged and working"},
    {"id": "9", "label": "First aid kit on site"},
    {"id": "10", "label": "All crew briefed on task scope"}
  ]'
),
(
  'Equipment Inspection',
  'safety',
  '[
    {"id": "1", "label": "Helmets — no cracks or damage"},
    {"id": "2", "label": "Harnesses — stitching and buckles intact"},
    {"id": "3", "label": "Descenders — function tested"},
    {"id": "4", "label": "Ascenders — teeth in good condition"},
    {"id": "5", "label": "Ropes — no cuts, abrasion or kinks"},
    {"id": "6", "label": "Carabiners — gates lock correctly"},
    {"id": "7", "label": "Anchor slings — no fraying"},
    {"id": "8", "label": "Edge protectors on site"},
    {"id": "9", "label": "All equipment within inspection date"}
  ]'
),
(
  'Height Safety Risk Assessment',
  'risk_assessment',
  '[
    {"id": "1", "label": "Fall from height risk assessed"},
    {"id": "2", "label": "Falling objects risk assessed — exclusion zone in place"},
    {"id": "3", "label": "Structural stability of work area confirmed"},
    {"id": "4", "label": "Environmental conditions assessed (wind, rain, temperature)"},
    {"id": "5", "label": "Manual handling risks identified"},
    {"id": "6", "label": "Fatigue management plan in place"},
    {"id": "7", "label": "Third-party risk (public, other trades) managed"},
    {"id": "8", "label": "Permit to work obtained if required"}
  ]'
);
