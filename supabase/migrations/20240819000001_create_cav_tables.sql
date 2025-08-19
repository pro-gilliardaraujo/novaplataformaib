-- Criar tabelas para sistema de CAV (Controle de Aplicação de Vinhaça)

-- 1️⃣ Tabela granular: boletins_cav
CREATE TABLE boletins_cav (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    codigo VARCHAR(20) NOT NULL,
    frente VARCHAR(50) NOT NULL,
    frota INT NOT NULL,
    turno CHAR(1) CHECK (turno IN ('A','B','C')) NOT NULL,
    operador VARCHAR(100) NOT NULL,
    producao NUMERIC(10,2) NOT NULL CHECK (producao >= 0),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2️⃣ Tabela agregada: boletins_cav_agregado
CREATE TABLE boletins_cav_agregado (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    codigo VARCHAR(20) NOT NULL,
    frente VARCHAR(50) NOT NULL,
    total_producao NUMERIC(10,2) DEFAULT 0,
    total_viagens_feitas NUMERIC(10,2) DEFAULT 0,
    total_viagens_orcadas NUMERIC(10,2) DEFAULT 0,
    dif_viagens_perc NUMERIC(5,2) DEFAULT 0,
    lamina_alvo NUMERIC(10,2) DEFAULT 0,
    lamina_aplicada NUMERIC(10,2) DEFAULT 0,
    dif_lamina_perc NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(data, frente, codigo)  -- Garante apenas um resumo por frente/dia/código
);

-- 3️⃣ Índices para performance
CREATE INDEX idx_boletins_cav_data_frente ON boletins_cav(data, frente);
CREATE INDEX idx_boletins_cav_frota ON boletins_cav(frota);
CREATE INDEX idx_boletins_cav_agregado_data_frente ON boletins_cav_agregado(data, frente);

-- 4️⃣ Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_boletins_cav_updated_at
    BEFORE UPDATE ON boletins_cav
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boletins_cav_agregado_updated_at
    BEFORE UPDATE ON boletins_cav_agregado
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5️⃣ RLS (Row Level Security)
ALTER TABLE boletins_cav ENABLE ROW LEVEL SECURITY;
ALTER TABLE boletins_cav_agregado ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar conforme necessário)
CREATE POLICY "boletins_cav_select" ON boletins_cav FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "boletins_cav_insert" ON boletins_cav FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "boletins_cav_update" ON boletins_cav FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "boletins_cav_delete" ON boletins_cav FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "boletins_cav_agregado_select" ON boletins_cav_agregado FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "boletins_cav_agregado_insert" ON boletins_cav_agregado FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "boletins_cav_agregado_update" ON boletins_cav_agregado FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "boletins_cav_agregado_delete" ON boletins_cav_agregado FOR DELETE USING (auth.role() = 'authenticated');
