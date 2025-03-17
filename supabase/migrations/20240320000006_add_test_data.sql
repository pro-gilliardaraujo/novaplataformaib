-- Create test categories
INSERT INTO categorias_item (id, nome, descricao, cor)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'TESTE_Ferramentas', 'Categoria de teste para ferramentas', '#FF0000'),
  ('00000000-0000-0000-0000-000000000002', 'TESTE_Consumíveis', 'Categoria de teste para itens consumíveis', '#00FF00'),
  ('00000000-0000-0000-0000-000000000003', 'TESTE_Equipamentos', 'Categoria de teste para equipamentos', '#0000FF');

-- Create test items
INSERT INTO items_estoque (
  id,
  descricao,
  codigo_fabricante,
  quantidade_atual,
  category_id,
  nivel_minimo,
  nivel_critico,
  alertas_ativos,
  observacoes
)
VALUES
  -- Ferramentas (alguns com estoque baixo)
  (
    '00000000-0000-0000-0000-000000000001',
    'TESTE_Chave de Fenda',
    'TESTE_CF001',
    3,
    '00000000-0000-0000-0000-000000000001',
    5,
    2,
    true,
    'Item de teste para alerta de estoque baixo'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'TESTE_Martelo',
    'TESTE_MT001',
    1,
    '00000000-0000-0000-0000-000000000001',
    3,
    1,
    true,
    'Item de teste para alerta de estoque crítico'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'TESTE_Alicate',
    'TESTE_AL001',
    10,
    '00000000-0000-0000-0000-000000000001',
    5,
    2,
    true,
    'Item de teste com estoque normal'
  ),

  -- Consumíveis (para teste de movimentações frequentes)
  (
    '00000000-0000-0000-0000-000000000004',
    'TESTE_Parafuso 10mm',
    'TESTE_PF001',
    50,
    '00000000-0000-0000-0000-000000000002',
    100,
    50,
    true,
    'Item de teste para movimentações frequentes'
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'TESTE_Porca 10mm',
    'TESTE_PC001',
    45,
    '00000000-0000-0000-0000-000000000002',
    100,
    50,
    true,
    'Item de teste para movimentações frequentes'
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'TESTE_Arruela 10mm',
    'TESTE_AR001',
    150,
    '00000000-0000-0000-0000-000000000002',
    100,
    50,
    true,
    'Item de teste para movimentações frequentes'
  ),

  -- Equipamentos (para teste de movimentações esporádicas)
  (
    '00000000-0000-0000-0000-000000000007',
    'TESTE_Furadeira',
    'TESTE_FD001',
    2,
    '00000000-0000-0000-0000-000000000003',
    2,
    1,
    true,
    'Item de teste para movimentações esporádicas'
  ),
  (
    '00000000-0000-0000-0000-000000000008',
    'TESTE_Serra Circular',
    'TESTE_SC001',
    1,
    '00000000-0000-0000-0000-000000000003',
    2,
    1,
    true,
    'Item de teste para movimentações esporádicas'
  ),
  (
    '00000000-0000-0000-0000-000000000009',
    'TESTE_Lixadeira',
    'TESTE_LX001',
    3,
    '00000000-0000-0000-0000-000000000003',
    2,
    1,
    true,
    'Item de teste para movimentações esporádicas'
  );

-- Create test movements (last 6 months)
WITH dates AS (
  SELECT generate_series(
    date_trunc('month', current_date - interval '5 months'),
    current_date,
    '1 day'
  )::date as movement_date
)
INSERT INTO historico_estoque (
  item_id,
  tipo_movimentacao,
  quantidade,
  motivo,
  observacoes,
  created_at
)
SELECT
  -- Consumíveis (movimentações frequentes)
  CASE 
    WHEN random() < 0.33 THEN '00000000-0000-0000-0000-000000000004'
    WHEN random() < 0.66 THEN '00000000-0000-0000-0000-000000000005'
    ELSE '00000000-0000-0000-0000-000000000006'
  END as item_id,
  CASE 
    WHEN random() < 0.6 THEN 'saida'
    WHEN random() < 0.9 THEN 'entrada'
    ELSE 'ajuste'
  END as tipo_movimentacao,
  floor(random() * 20 + 1)::int as quantidade,
  CASE 
    WHEN tipo_movimentacao = 'saida' THEN 
      CASE 
        WHEN random() < 0.7 THEN 'uso'
        ELSE 'perda'
      END
    WHEN tipo_movimentacao = 'entrada' THEN
      CASE 
        WHEN random() < 0.7 THEN 'compra'
        ELSE 'devolucao'
      END
    ELSE 'inventario'
  END as motivo,
  'Movimentação de teste gerada automaticamente' as observacoes,
  movement_date + time '08:00:00' + (random() * interval '8 hours') as created_at
FROM dates
WHERE random() < 0.7 -- 70% chance of movement per day for consumables

UNION ALL

-- Ferramentas e Equipamentos (movimentações esporádicas)
SELECT
  CASE 
    WHEN random() < 0.33 THEN '00000000-0000-0000-0000-000000000001'
    WHEN random() < 0.66 THEN '00000000-0000-0000-0000-000000000007'
    ELSE '00000000-0000-0000-0000-000000000008'
  END as item_id,
  CASE 
    WHEN random() < 0.6 THEN 'saida'
    WHEN random() < 0.9 THEN 'entrada'
    ELSE 'ajuste'
  END as tipo_movimentacao,
  floor(random() * 3 + 1)::int as quantidade,
  CASE 
    WHEN tipo_movimentacao = 'saida' THEN 
      CASE 
        WHEN random() < 0.7 THEN 'uso'
        ELSE 'perda'
      END
    WHEN tipo_movimentacao = 'entrada' THEN
      CASE 
        WHEN random() < 0.7 THEN 'compra'
        ELSE 'devolucao'
      END
    ELSE 'inventario'
  END as motivo,
  'Movimentação de teste gerada automaticamente' as observacoes,
  movement_date + time '08:00:00' + (random() * interval '8 hours') as created_at
FROM dates
WHERE random() < 0.2; -- 20% chance of movement per day for tools and equipment 