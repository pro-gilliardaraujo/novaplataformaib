-- Criação da tabela diario_cav
create table if not exists diario_cav (
  id                 uuid primary key default gen_random_uuid(),
  data               date      not null,
  frente             text      not null,
  dados              jsonb     not null, -- chave = frota
  imagem_deslocamento text,              -- obrigatória no UI
  imagem_area         text,              -- opcional
  created_at         timestamptz default now()
);

-- Índice para melhorar a performance de consultas por data e frente
create index if not exists diario_cav_data_frente_idx on diario_cav (data, frente);

-- Políticas RLS para a tabela diario_cav
alter table diario_cav enable row level security;

-- Política para permitir leitura para usuários autenticados
create policy "Usuários autenticados podem ler diario_cav"
  on diario_cav for select
  to authenticated
  using (true);

-- Política para permitir inserção para usuários autenticados
create policy "Usuários autenticados podem inserir em diario_cav"
  on diario_cav for insert
  to authenticated
  with check (true);

-- Política para permitir atualização para usuários autenticados
create policy "Usuários autenticados podem atualizar diario_cav"
  on diario_cav for update
  to authenticated
  using (true);

-- Política para permitir exclusão para usuários autenticados
create policy "Usuários autenticados podem excluir de diario_cav"
  on diario_cav for delete
  to authenticated
  using (true);
