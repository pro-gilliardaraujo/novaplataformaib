create table public.scenario_configs (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  column_order jsonb not null default '[]'::jsonb,
  column_colors jsonb not null default '{}'::jsonb,
  minimized_columns jsonb not null default '[]'::jsonb,
  selected_frotas jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.scenario_configs enable row level security;

create policy "Users can view their own scenario configs"
  on public.scenario_configs for select
  using (auth.uid()::text = user_id);

create policy "Users can insert their own scenario configs"
  on public.scenario_configs for insert
  with check (auth.uid()::text = user_id);

create policy "Users can update their own scenario configs"
  on public.scenario_configs for update
  using (auth.uid()::text = user_id);

-- Create index for faster lookups
create index scenario_configs_user_id_idx on public.scenario_configs(user_id); 