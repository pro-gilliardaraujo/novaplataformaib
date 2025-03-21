-- Drop only the function and type that will be recreated
DROP FUNCTION IF EXISTS criar_conferencia;
DROP TYPE IF EXISTS item_conferencia_input;

-- Remove base_profile and permissions from profiles table
ALTER TABLE profiles
    DROP COLUMN IF EXISTS base_profile,
    DROP COLUMN IF EXISTS permissions,
    DROP COLUMN IF EXISTS unit_id;

-- Alter the itens_conferencia table to allow NULL in quantidade_conferida
ALTER TABLE itens_conferencia 
    ALTER COLUMN quantidade_conferida DROP NOT NULL,
    DROP COLUMN diferenca,
    ADD COLUMN diferenca INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN quantidade_conferida IS NULL THEN 0
            ELSE quantidade_conferida - quantidade_sistema 
        END
    ) STORED;

-- Create the type for conference items
CREATE TYPE item_conferencia_input AS (
    item_id UUID,
    quantidade_sistema INTEGER,
    quantidade_conferida INTEGER,
    observacoes TEXT
);

-- Create the conference creation function
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