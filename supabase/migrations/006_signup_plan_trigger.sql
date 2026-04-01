-- Migration 006: Update handle_new_user trigger to read plan from signup metadata

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, plan)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'technician'),
    coalesce(new.raw_user_meta_data->>'plan', 'basic')
  );
  return new;
end;
$$ language plpgsql security definer;
