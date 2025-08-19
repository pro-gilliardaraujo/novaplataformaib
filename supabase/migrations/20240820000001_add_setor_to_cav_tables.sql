-- Adicionar coluna "setor" nas tabelas CAV e ajustar constraints de frente

-- 1️⃣ Adicionar colunas na tabela boletins_cav
ALTER TABLE boletins_cav 
ADD COLUMN setor VARCHAR(10) CHECK (setor IN ('GUA', 'MOE', 'ALE')),
ADD COLUMN lamina_alvo NUMERIC(5,2) DEFAULT 2.5;

-- 2️⃣ Adicionar coluna setor na tabela boletins_cav_agregado
ALTER TABLE boletins_cav_agregado 
ADD COLUMN setor VARCHAR(10) CHECK (setor IN ('GUA', 'MOE', 'ALE'));

-- 3️⃣ Atualizar constraint de frente para valores padronizados
ALTER TABLE boletins_cav 
ADD CONSTRAINT check_frente_values 
CHECK (frente IN ('Frente 1', 'Frente 2', 'Frente 3', 'Iturama', 'Ouroeste'));

ALTER TABLE boletins_cav_agregado 
ADD CONSTRAINT check_frente_values_agregado 
CHECK (frente IN ('Frente 1', 'Frente 2', 'Frente 3', 'Iturama', 'Ouroeste'));

-- 4️⃣ Criar índices para performance
CREATE INDEX idx_boletins_cav_setor ON boletins_cav(setor);
CREATE INDEX idx_boletins_cav_agregado_setor ON boletins_cav_agregado(setor);
CREATE INDEX idx_boletins_cav_setor_frente ON boletins_cav(setor, frente);
CREATE INDEX idx_boletins_cav_agregado_setor_frente ON boletins_cav_agregado(setor, frente);

-- 5️⃣ Atualizar constraint unique da tabela agregada para incluir setor
ALTER TABLE boletins_cav_agregado 
DROP CONSTRAINT IF EXISTS boletins_cav_agregado_data_frente_codigo_key;

ALTER TABLE boletins_cav_agregado 
ADD CONSTRAINT boletins_cav_agregado_data_frente_codigo_setor_key 
UNIQUE(data, frente, codigo, setor);

-- 6️⃣ Comentários nas colunas
COMMENT ON COLUMN boletins_cav.setor IS 'Setor operacional: GUA (Guarani), MOE (Moema), ALE (Alegria)';
COMMENT ON COLUMN boletins_cav_agregado.setor IS 'Setor operacional: GUA (Guarani), MOE (Moema), ALE (Alegria)';
COMMENT ON COLUMN boletins_cav.frente IS 'Frente operacional: Frente 1, Frente 2, Frente 3, Iturama, Ouroeste';
COMMENT ON COLUMN boletins_cav_agregado.frente IS 'Frente operacional: Frente 1, Frente 2, Frente 3, Iturama, Ouroeste';
