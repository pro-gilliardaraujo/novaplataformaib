-- First, drop everything in reverse order
DROP FUNCTION IF EXISTS criar_conferencia;
DROP TYPE IF EXISTS item_conferencia_input;
DROP TRIGGER IF EXISTS update_itens_conferencia_updated_at ON itens_conferencia;
DROP TRIGGER IF EXISTS update_conferencias_estoque_updated_at ON conferencias_estoque;
DROP TABLE IF EXISTS itens_conferencia;
DROP TABLE IF EXISTS conferencias_estoque;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Now recreate everything in the correct order

-- 1. Create the updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Create the conferencias_estoque table
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

-- 3. Create trigger for conferencias_estoque
CREATE TRIGGER update_conferencias_estoque_updated_at
    BEFORE UPDATE ON conferencias_estoque
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Create the itens_conferencia table
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

-- 5. Create trigger for itens_conferencia
CREATE TRIGGER update_itens_conferencia_updated_at
    BEFORE UPDATE ON itens_conferencia
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Create the type for conference items
CREATE TYPE item_conferencia_input AS (
    item_id UUID,
    quantidade_sistema INTEGER,
    quantidade_conferida INTEGER,
    diferenca INTEGER,
    observacoes TEXT
);

-- 7. Create the conference creation function
CREATE OR REPLACE FUNCTION criar_conferencia(
    p_data_conferencia TIMESTAMP WITH TIME ZONE,
    p_status TEXT,
    p_responsaveis TEXT,
    p_total_itens INTEGER,
    p_itens_conferidos INTEGER,
    p_itens_divergentes INTEGER,
    p_itens item_conferencia_input[]
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_conferencia_id UUID;
    v_result jsonb;
BEGIN
    -- Insert conference
    INSERT INTO conferencias_estoque (
        data_conferencia,
        status,
        responsaveis,
        total_itens,
        itens_conferidos,
        itens_divergentes
    ) VALUES (
        p_data_conferencia,
        p_status,
        p_responsaveis,
        p_total_itens,
        p_itens_conferidos,
        p_itens_divergentes
    )
    RETURNING id INTO v_conferencia_id;

    -- Insert items
    INSERT INTO itens_conferencia (
        conferencia_id,
        item_id,
        quantidade_sistema,
        quantidade_conferida,
        observacoes
    )
    SELECT 
        v_conferencia_id,
        item.item_id,
        item.quantidade_sistema,
        item.quantidade_conferida,
        item.observacoes
    FROM unnest(p_itens) AS item;

    -- Prepare result
    v_result := jsonb_build_object(
        'id', v_conferencia_id,
        'status', 'success'
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in criar_conferencia: %', SQLERRM;
    RETURN jsonb_build_object(
        'status', 'error',
        'message', SQLERRM,
        'code', SQLSTATE
    );
END;
$$; 