-- Ensure all required tables exist
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

-- Drop all existing policies
DO $$
BEGIN
  -- Drop items_estoque policies
  DROP POLICY IF EXISTS "Items are viewable by everyone" ON items_estoque;
  DROP POLICY IF EXISTS "Items are viewable by authenticated users" ON items_estoque;
  DROP POLICY IF EXISTS "Items are insertable by authenticated users" ON items_estoque;
  DROP POLICY IF EXISTS "Items are updatable by authenticated users" ON items_estoque;
  DROP POLICY IF EXISTS "Items are deletable by authenticated users" ON items_estoque;

  -- Drop categorias_item policies
  DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categorias_item;
  DROP POLICY IF EXISTS "Categories are viewable by authenticated users" ON categorias_item;
  DROP POLICY IF EXISTS "Categories are insertable by authenticated users" ON categorias_item;
  DROP POLICY IF EXISTS "Categories are updatable by authenticated users" ON categorias_item;
  DROP POLICY IF EXISTS "Categories are deletable by authenticated users" ON categorias_item;

  -- Drop historico_estoque policies
  DROP POLICY IF EXISTS "History is viewable by everyone" ON historico_estoque;
  DROP POLICY IF EXISTS "History is viewable by authenticated users" ON historico_estoque;
  DROP POLICY IF EXISTS "History is insertable by authenticated users" ON historico_estoque;
END$$;

-- Enable RLS on all tables
ALTER TABLE items_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_estoque ENABLE ROW LEVEL SECURITY;

-- Create new policies that allow public access for now (for testing)
CREATE POLICY "Items are viewable by everyone"
ON items_estoque FOR SELECT
TO public
USING (true);

CREATE POLICY "Categories are viewable by everyone"
ON categorias_item FOR SELECT
TO public
USING (true);

CREATE POLICY "History is viewable by everyone"
ON historico_estoque FOR SELECT
TO public
USING (true);

-- Grant necessary permissions
GRANT SELECT ON items_estoque TO anon;
GRANT SELECT ON categorias_item TO anon;
GRANT SELECT ON historico_estoque TO anon;

GRANT ALL ON items_estoque TO authenticated;
GRANT ALL ON categorias_item TO authenticated;
GRANT ALL ON historico_estoque TO authenticated;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated; 