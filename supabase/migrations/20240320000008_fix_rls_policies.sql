-- Drop existing policies
DROP POLICY IF EXISTS "Items are viewable by authenticated users" ON items_estoque;
DROP POLICY IF EXISTS "Items are insertable by authenticated users" ON items_estoque;
DROP POLICY IF EXISTS "Items are updatable by authenticated users" ON items_estoque;
DROP POLICY IF EXISTS "Items are deletable by authenticated users" ON items_estoque;

DROP POLICY IF EXISTS "Categories are viewable by authenticated users" ON categorias_item;
DROP POLICY IF EXISTS "Categories are insertable by authenticated users" ON categorias_item;
DROP POLICY IF EXISTS "Categories are updatable by authenticated users" ON categorias_item;
DROP POLICY IF EXISTS "Categories are deletable by authenticated users" ON categorias_item;

DROP POLICY IF EXISTS "History is viewable by authenticated users" ON historico_estoque;
DROP POLICY IF EXISTS "History is insertable by authenticated users" ON historico_estoque;

-- Enable RLS on all tables
ALTER TABLE items_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_estoque ENABLE ROW LEVEL SECURITY;

-- Create policies for items_estoque
CREATE POLICY "Items are viewable by authenticated users"
ON items_estoque FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Items are insertable by authenticated users"
ON items_estoque FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Items are updatable by authenticated users"
ON items_estoque FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Items are deletable by authenticated users"
ON items_estoque FOR DELETE
TO authenticated
USING (true);

-- Create policies for categorias_item
CREATE POLICY "Categories are viewable by authenticated users"
ON categorias_item FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Categories are insertable by authenticated users"
ON categorias_item FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Categories are updatable by authenticated users"
ON categorias_item FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Categories are deletable by authenticated users"
ON categorias_item FOR DELETE
TO authenticated
USING (true);

-- Create policies for historico_estoque
CREATE POLICY "History is viewable by authenticated users"
ON historico_estoque FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "History is insertable by authenticated users"
ON historico_estoque FOR INSERT
TO authenticated
WITH CHECK (true);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON items_estoque TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON categorias_item TO authenticated;
GRANT SELECT, INSERT ON historico_estoque TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated; 