-- Rope access specific columns for projects
alter table public.projects
  add column if not exists job_category text check (job_category in (
    'window_cleaning', 'brickwork', 'glazing', 'gutter_repair', 'gutter_cleaning',
    'mastic_sealant', 'facade_inspection', 'painting', 'concrete_repair',
    'signage', 'caulking', 'netting', 'other'
  )),
  add column if not exists access_type text check (access_type in (
    'srt', 'work_positioning', 'rope_access', 'bosuns_chair', 'abseiling', 'other'
  )),
  add column if not exists max_height numeric(6,1),
  add column if not exists rigging_details text,
  add column if not exists anchor_points text,
  add column if not exists risk_considerations text,
  add column if not exists site_contact_name text,
  add column if not exists site_contact_role text,
  add column if not exists site_contact_phone text,
  add column if not exists tools_needed jsonb not null default '[]';
