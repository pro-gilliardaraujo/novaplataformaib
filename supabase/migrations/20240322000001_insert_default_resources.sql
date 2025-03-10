-- Inserir recursos padrão
INSERT INTO public.resources (name, type)
VALUES 
  -- Categorias principais
  ('Colheita', 'category'),
  ('CAV', 'category'),
  ('Plantio', 'category'),
  ('Operacional', 'category'),
  ('Óleos', 'category'),
  ('Bonificações', 'category'),

  -- Páginas de Gerenciamento
  ('Gerenciamento de Usuários', 'page'),
  ('Gerenciamento de Páginas', 'page'),
  ('Gerenciamento de Permissões', 'page'),
  ('Gerenciamento de Unidades', 'page'),
  ('Gerenciamento de Tratativas', 'page'),

  -- Páginas de Tratativas
  ('Lista de Tratativas', 'page'),
  ('Nova Tratativa', 'page'),
  ('Histórico de Tratativas', 'page'),

  -- Páginas de Equipamentos
  ('Lista de Equipamentos', 'page'),
  ('Novo Equipamento', 'page'),
  ('Histórico de Equipamentos', 'page'),

  -- Painéis de Relatórios
  ('Relatório de Colheita', 'panel'),
  ('Relatório de CAV', 'panel'),
  ('Relatório de Plantio', 'panel'),
  ('Relatório Operacional', 'panel'),
  ('Relatório de Óleos', 'panel'),
  ('Relatório de Bonificações', 'panel')
ON CONFLICT (id) DO NOTHING; 