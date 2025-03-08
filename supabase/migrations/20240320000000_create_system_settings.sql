-- Create the system_settings table
create table if not exists public.system_settings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  key text not null unique,
  value text not null
);

-- Add RLS policies
alter table public.system_settings enable row level security;

create policy "Enable read access for authenticated users" on public.system_settings
  for select using (auth.role() = 'authenticated');

create policy "Enable write access for authenticated admin users" on public.system_settings
  for all using (
    auth.role() = 'authenticated' and 
    exists (
      select 1 from public.profiles
      where user_id = auth.uid()
      and admin_profile = true
    )
  );

-- Insert default password
insert into public.system_settings (key, value)
values ('default_password', 'ib2025')
on conflict (key) do nothing; 