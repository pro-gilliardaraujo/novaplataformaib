-- Create items_estoque table
CREATE TABLE items_estoque (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    descricao TEXT NOT NULL,
    codigo_fabricante TEXT NOT NULL,
    quantidade_atual INTEGER NOT NULL DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create imagens_item table
CREATE TABLE imagens_item (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES items_estoque(id) ON DELETE CASCADE,
    url_imagem TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create historico_estoque table
CREATE TABLE historico_estoque (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES items_estoque(id) ON DELETE CASCADE,
    quantidade_verificada INTEGER NOT NULL,
    data_verificacao TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    responsavel_id UUID,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for items_estoque
CREATE TRIGGER update_items_estoque_updated_at
    BEFORE UPDATE ON items_estoque
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE items_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagens_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_estoque ENABLE ROW LEVEL SECURITY;

-- Create policies for items_estoque
CREATE POLICY "Items are viewable by authenticated users"
    ON items_estoque FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Items are insertable by authenticated users"
    ON items_estoque FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Items are updatable by authenticated users"
    ON items_estoque FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Items are deletable by authenticated users"
    ON items_estoque FOR DELETE
    USING (auth.role() = 'authenticated');

-- Create policies for imagens_item
CREATE POLICY "Images are viewable by authenticated users"
    ON imagens_item FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Images are insertable by authenticated users"
    ON imagens_item FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Images are deletable by authenticated users"
    ON imagens_item FOR DELETE
    USING (auth.role() = 'authenticated');

-- Create policies for historico_estoque
CREATE POLICY "History is viewable by authenticated users"
    ON historico_estoque FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "History is insertable by authenticated users"
    ON historico_estoque FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
