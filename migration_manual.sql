-- Migration manual para adicionar colunas em desenvolvimento
-- Execute este SQL diretamente no seu banco de dados Supabase

-- 1. Adicionar coluna setor na tabela boletins_cav (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'boletins_cav' AND column_name = 'setor') THEN
        ALTER TABLE boletins_cav ADD COLUMN setor VARCHAR(10) CHECK (setor IN ('GUA', 'MOE', 'ALE'));
    END IF;
END $$;

-- 2. Adicionar coluna lamina_alvo na tabela boletins_cav (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'boletins_cav' AND column_name = 'lamina_alvo') THEN
        ALTER TABLE boletins_cav ADD COLUMN lamina_alvo NUMERIC(5,2) DEFAULT 2.5;
    END IF;
END $$;

-- 3. Adicionar coluna setor na tabela boletins_cav_agregado (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'boletins_cav_agregado' AND column_name = 'setor') THEN
        ALTER TABLE boletins_cav_agregado ADD COLUMN setor VARCHAR(10) CHECK (setor IN ('GUA', 'MOE', 'ALE'));
    END IF;
END $$;

-- 4. Criar índices (se não existirem)
CREATE INDEX IF NOT EXISTS idx_boletins_cav_setor ON boletins_cav(setor);
CREATE INDEX IF NOT EXISTS idx_boletins_cav_agregado_setor ON boletins_cav_agregado(setor);
CREATE INDEX IF NOT EXISTS idx_boletins_cav_setor_frente ON boletins_cav(setor, frente);
CREATE INDEX IF NOT EXISTS idx_boletins_cav_agregado_setor_frente ON boletins_cav_agregado(setor, frente);

-- 5. Comentários nas colunas
COMMENT ON COLUMN boletins_cav.setor IS 'Setor operacional: GUA (Guarani), MOE (Moema), ALE (Alegria)';
COMMENT ON COLUMN boletins_cav_agregado.setor IS 'Setor operacional: GUA (Guarani), MOE (Moema), ALE (Alegria)';
COMMENT ON COLUMN boletins_cav.lamina_alvo IS 'Lâmina alvo específica do operador em m³';

SELECT 'Migration concluída com sucesso!' as status;
