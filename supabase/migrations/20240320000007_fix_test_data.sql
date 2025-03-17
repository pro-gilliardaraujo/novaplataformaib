-- First ensure all required tables exist
DO $$
BEGIN
  -- Create categorias_item table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categorias_item') THEN
    CREATE TABLE categorias_item (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      nome TEXT NOT NULL,
      descricao TEXT,
      cor TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );

    -- Create updated_at trigger for categorias_item
    CREATE TRIGGER update_categorias_item_updated_at
      BEFORE UPDATE ON categorias_item
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Create items_estoque table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'items_estoque') THEN
    CREATE TABLE items_estoque (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      descricao TEXT NOT NULL,
      codigo_fabricante TEXT NOT NULL,
      quantidade_atual INTEGER NOT NULL DEFAULT 0,
      category_id UUID REFERENCES categorias_item(id) ON DELETE SET NULL,
      nivel_minimo INTEGER,
      nivel_critico INTEGER,
      alertas_ativos BOOLEAN DEFAULT true,
      observacoes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );

    -- Create updated_at trigger for items_estoque
    CREATE TRIGGER update_items_estoque_updated_at
      BEFORE UPDATE ON items_estoque
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Create historico_estoque table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'historico_estoque') THEN
    CREATE TABLE historico_estoque (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      item_id UUID REFERENCES items_estoque(id) ON DELETE CASCADE,
      tipo_movimentacao TEXT NOT NULL CHECK (tipo_movimentacao IN ('entrada', 'saida', 'ajuste')),
      quantidade INTEGER NOT NULL,
      motivo TEXT NOT NULL,
      observacoes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );
  END IF;
END$$;

-- Now proceed with cleaning up and inserting test data
DO $$
BEGIN
  -- Clean up any potential duplicate test data
  DELETE FROM historico_estoque
  WHERE item_id IN (
    SELECT id FROM items_estoque WHERE descricao LIKE 'TESTE_%'
  );

  DELETE FROM items_estoque
  WHERE descricao LIKE 'TESTE_%';

  DELETE FROM categorias_item
  WHERE nome LIKE 'TESTE_%';

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
  INSERT INTO historico_estoque (
    item_id,
    tipo_movimentacao,
    quantidade,
    motivo,
    observacoes,
    created_at
  )
  SELECT m.*
  FROM (
    SELECT
      -- Consumíveis (movimentações frequentes)
      CASE 
        WHEN random() < 0.33 THEN '00000000-0000-0000-0000-000000000004'::uuid
        WHEN random() < 0.66 THEN '00000000-0000-0000-0000-000000000005'::uuid
        ELSE '00000000-0000-0000-0000-000000000006'::uuid
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
      (date_trunc('day', now() - interval '5 months' + (random() * interval '150 days'))
       + time '08:00:00' 
       + (random() * interval '8 hours'))::timestamp as created_at
    FROM generate_series(1, 500) -- Gerar 500 movimentações aleatórias
    WHERE random() < 0.7 -- 70% chance for consumables

    UNION ALL

    -- Ferramentas e Equipamentos (movimentações esporádicas)
    SELECT
      CASE 
        WHEN random() < 0.33 THEN '00000000-0000-0000-0000-000000000001'::uuid
        WHEN random() < 0.66 THEN '00000000-0000-0000-0000-000000000007'::uuid
        ELSE '00000000-0000-0000-0000-000000000008'::uuid
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
      (date_trunc('day', now() - interval '5 months' + (random() * interval '150 days'))
       + time '08:00:00' 
       + (random() * interval '8 hours'))::timestamp as created_at
    FROM generate_series(1, 200) -- Gerar 200 movimentações aleatórias
    WHERE random() < 0.2 -- 20% chance for tools and equipment
  ) m
  ORDER BY m.created_at;

END$$;

-- Ensure RLS policies are properly set up
DO $$
BEGIN
  -- Enable RLS on all tables
  ALTER TABLE items_estoque ENABLE ROW LEVEL SECURITY;
  ALTER TABLE categorias_item ENABLE ROW LEVEL SECURITY;
  ALTER TABLE historico_estoque ENABLE ROW LEVEL SECURITY;

  -- Create policies for items_estoque
  DROP POLICY IF EXISTS "Items are viewable by authenticated users" ON items_estoque;
  CREATE POLICY "Items are viewable by authenticated users"
    ON items_estoque FOR SELECT
    TO authenticated
    USING (true);

  -- Create policies for categorias_item
  DROP POLICY IF EXISTS "Categories are viewable by authenticated users" ON categorias_item;
  CREATE POLICY "Categories are viewable by authenticated users"
    ON categorias_item FOR SELECT
    TO authenticated
    USING (true);

  -- Create policies for historico_estoque
  DROP POLICY IF EXISTS "History is viewable by authenticated users" ON historico_estoque;
  CREATE POLICY "History is viewable by authenticated users"
    ON historico_estoque FOR SELECT
    TO authenticated
    USING (true);

  -- Grant necessary permissions
  GRANT SELECT, INSERT, UPDATE, DELETE ON items_estoque TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON categorias_item TO authenticated;
  GRANT SELECT, INSERT ON historico_estoque TO authenticated;
  GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error occurred while setting up RLS policies: %', SQLERRM;
END$$; 