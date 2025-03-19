-- Verifica se a tabela já existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'historico_estoque') THEN
        -- Cria a tabela historico_estoque se não existir
        CREATE TABLE historico_estoque (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            item_id UUID REFERENCES itens_estoque(id) ON DELETE CASCADE,
            tipo_movimentacao TEXT NOT NULL CHECK (tipo_movimentacao IN ('entrada', 'saida')),
            quantidade INTEGER NOT NULL,
            motivo TEXT NOT NULL,
            observacoes TEXT,
            destino_movimentacao TEXT,
            frota_destino TEXT,
            nota_fiscal TEXT,
            responsavel TEXT DEFAULT current_user
        );

        -- Cria índices para melhorar performance
        CREATE INDEX idx_historico_estoque_item_id ON historico_estoque(item_id);
        CREATE INDEX idx_historico_estoque_created_at ON historico_estoque(created_at);
        CREATE INDEX idx_historico_estoque_tipo ON historico_estoque(tipo_movimentacao);
    ELSE
        -- Se a tabela já existe, adiciona as colunas necessárias
        BEGIN
            ALTER TABLE historico_estoque
            ADD COLUMN IF NOT EXISTS destino_movimentacao TEXT,
            ADD COLUMN IF NOT EXISTS frota_destino TEXT,
            ADD COLUMN IF NOT EXISTS nota_fiscal TEXT;
        EXCEPTION
            WHEN duplicate_column THEN
                NULL;
        END;
    END IF;
END $$; 