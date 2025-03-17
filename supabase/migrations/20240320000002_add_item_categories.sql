-- Create categorias_item table
CREATE TABLE categorias_item (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    cor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add category_id to items_estoque
ALTER TABLE items_estoque
ADD COLUMN category_id UUID REFERENCES categorias_item(id) ON DELETE SET NULL;

-- Create updated_at trigger for categorias_item
CREATE TRIGGER update_categorias_item_updated_at
    BEFORE UPDATE ON categorias_item
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for categorias_item
ALTER TABLE categorias_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by authenticated users"
    ON categorias_item FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Categories are insertable by authenticated users"
    ON categorias_item FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Categories are updatable by authenticated users"
    ON categorias_item FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Categories are deletable by authenticated users"
    ON categorias_item FOR DELETE
    USING (auth.role() = 'authenticated'); 