-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  role text not null default 'technician' check (role in ('admin', 'manager', 'technician')),
  phone text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Projects
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  client text,
  location text,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'cancelled')),
  description text,
  start_date date,
  end_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Project Members
create table public.project_members (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  unique(project_id, user_id)
);

-- Timesheets
create table public.timesheets (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  hours numeric(4,1) not null check (hours > 0 and hours <= 24),
  description text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Documents
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  type text not null default 'other' check (type in ('risk_assessment', 'method_statement', 'inspection_report', 'certificate', 'other')),
  file_url text not null,
  file_size bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.timesheets enable row level security;
alter table public.documents enable row level security;

-- Profiles policies
create policy "Users can view all profiles" on public.profiles for select using (auth.role() = 'authenticated');
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Projects policies
create policy "Authenticated users can view projects" on public.projects for select using (auth.role() = 'authenticated');
create policy "Admin and managers can create projects" on public.projects for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
);
create policy "Admin and managers can update projects" on public.projects for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
);
create policy "Admin can delete projects" on public.projects for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Project members policies
create policy "Authenticated users can view project members" on public.project_members for select using (auth.role() = 'authenticated');
create policy "Admin and managers can manage project members" on public.project_members for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
);

-- Timesheets policies
create policy "Users can view own timesheets" on public.timesheets for select using (
  auth.uid() = user_id or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
);
create policy "Users can insert own timesheets" on public.timesheets for insert with check (auth.uid() = user_id);
create policy "Users can update own pending timesheets" on public.timesheets for update using (
  (auth.uid() = user_id and status = 'pending') or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
);

-- Documents policies
create policy "Authenticated users can view documents" on public.documents for select using (auth.role() = 'authenticated');
create policy "Authenticated users can upload documents" on public.documents for insert with check (auth.uid() = uploaded_by);
create policy "Admin and managers can delete documents" on public.documents for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'role', 'technician'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for documents
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

create policy "Authenticated users can upload documents" on storage.objects
  for insert with check (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "Authenticated users can view documents" on storage.objects
  for select using (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "Admin and managers can delete documents" on storage.objects
  for delete using (
    bucket_id = 'documents' and
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
  );
