-- Check if conferencias_estoque exists and create if it doesn't
CREATE TABLE IF NOT EXISTS conferencias_estoque (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data_conferencia TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('em_andamento', 'concluida', 'cancelada')) DEFAULT 'em_andamento',
    observacoes TEXT,
    responsaveis TEXT NOT NULL,
    total_itens INTEGER DEFAULT 0,
    itens_conferidos INTEGER DEFAULT 0,
    itens_divergentes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_conferencias_estoque_updated_at ON conferencias_estoque;
CREATE TRIGGER update_conferencias_estoque_updated_at
    BEFORE UPDATE ON conferencias_estoque
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS and create policies
ALTER TABLE conferencias_estoque ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conferencias are viewable by authenticated users" ON conferencias_estoque;
CREATE POLICY "Conferencias are viewable by authenticated users"
    ON conferencias_estoque FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Conferencias are insertable by authenticated users" ON conferencias_estoque;
CREATE POLICY "Conferencias are insertable by authenticated users"
    ON conferencias_estoque FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Conferencias are updatable by authenticated users" ON conferencias_estoque;
CREATE POLICY "Conferencias are updatable by authenticated users"
    ON conferencias_estoque FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Conferencias are deletable by authenticated users" ON conferencias_estoque;
CREATE POLICY "Conferencias are deletable by authenticated users"
    ON conferencias_estoque FOR DELETE
    USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conferencias_estoque_data_conferencia ON conferencias_estoque(data_conferencia);
CREATE INDEX IF NOT EXISTS idx_conferencias_estoque_status ON conferencias_estoque(status);

-- Create itens_conferencia table
CREATE TABLE IF NOT EXISTS itens_conferencia (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conferencia_id UUID REFERENCES conferencias_estoque(id) ON DELETE CASCADE,
    item_id UUID REFERENCES itens_estoque(id) ON DELETE CASCADE,
    quantidade_sistema INTEGER NOT NULL,
    quantidade_conferida INTEGER NOT NULL,
    diferenca INTEGER GENERATED ALWAYS AS (quantidade_conferida - quantidade_sistema) STORED,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create trigger for itens_conferencia
DROP TRIGGER IF EXISTS update_itens_conferencia_updated_at ON itens_conferencia;
CREATE TRIGGER update_itens_conferencia_updated_at
    BEFORE UPDATE ON itens_conferencia
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS and create policies for itens_conferencia
ALTER TABLE itens_conferencia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Itens conferencia are viewable by authenticated users" ON itens_conferencia;
CREATE POLICY "Itens conferencia are viewable by authenticated users"
    ON itens_conferencia FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Itens conferencia are insertable by authenticated users" ON itens_conferencia;
CREATE POLICY "Itens conferencia are insertable by authenticated users"
    ON itens_conferencia FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Itens conferencia are updatable by authenticated users" ON itens_conferencia;
CREATE POLICY "Itens conferencia are updatable by authenticated users"
    ON itens_conferencia FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Itens conferencia are deletable by authenticated users" ON itens_conferencia;
CREATE POLICY "Itens conferencia are deletable by authenticated users"
    ON itens_conferencia FOR DELETE
    USING (auth.role() = 'authenticated');

-- Create indexes for itens_conferencia
CREATE INDEX IF NOT EXISTS idx_itens_conferencia_conferencia_id ON itens_conferencia(conferencia_id);
CREATE INDEX IF NOT EXISTS idx_itens_conferencia_item_id ON itens_conferencia(item_id); 