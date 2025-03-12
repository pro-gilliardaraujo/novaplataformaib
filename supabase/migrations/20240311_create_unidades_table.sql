-- Create unidades table
create table if not exists unidades (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  codigo text not null unique,
  ativo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table unidades enable row level security;

create policy "Enable read access for authenticated users" on unidades
  for select
  to authenticated
  using (true);

create policy "Enable insert access for authenticated users" on unidades
  for insert
  to authenticated
  with check (true);

create policy "Enable update access for authenticated users" on unidades
  for update
  to authenticated
  using (true)
  with check (true);

-- Add foreign key to paradas_frotas
alter table paradas_frotas
  add constraint fk_unidade
  foreign key (unidade_id)
  references unidades(id)
  on delete restrict; 