-- Add minimum stock level columns to items_estoque
ALTER TABLE items_estoque
ADD COLUMN nivel_minimo INTEGER,
ADD COLUMN nivel_critico INTEGER,
ADD COLUMN alertas_ativos BOOLEAN DEFAULT true;

-- Create table for stock alerts
CREATE TABLE alertas_estoque (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES items_estoque(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('minimo', 'critico')),
    quantidade_atual INTEGER NOT NULL,
    nivel_configurado INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    resolvido BOOLEAN DEFAULT false,
    resolvido_em TIMESTAMP WITH TIME ZONE,
    resolvido_por UUID
);

-- Create RLS policies for alertas_estoque
ALTER TABLE alertas_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alerts are viewable by authenticated users"
    ON alertas_estoque FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Alerts are insertable by authenticated users"
    ON alertas_estoque FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Alerts are updatable by authenticated users"
    ON alertas_estoque FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Create function to check and create stock alerts
CREATE OR REPLACE FUNCTION check_stock_levels()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if alerts are active for this item
    IF NEW.alertas_ativos THEN
        -- Check critical level first
        IF NEW.nivel_critico IS NOT NULL AND NEW.quantidade_atual <= NEW.nivel_critico THEN
            INSERT INTO alertas_estoque (
                item_id,
                tipo,
                quantidade_atual,
                nivel_configurado
            )
            VALUES (
                NEW.id,
                'critico',
                NEW.quantidade_atual,
                NEW.nivel_critico
            )
            ON CONFLICT DO NOTHING;
        -- Then check minimum level
        ELSIF NEW.nivel_minimo IS NOT NULL AND NEW.quantidade_atual <= NEW.nivel_minimo THEN
            INSERT INTO alertas_estoque (
                item_id,
                tipo,
                quantidade_atual,
                nivel_configurado
            )
            VALUES (
                NEW.id,
                'minimo',
                NEW.quantidade_atual,
                NEW.nivel_minimo
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock level checks
CREATE TRIGGER check_stock_levels_trigger
    AFTER INSERT OR UPDATE OF quantidade_atual, nivel_minimo, nivel_critico, alertas_ativos
    ON items_estoque
    FOR EACH ROW
    EXECUTE FUNCTION check_stock_levels(); 