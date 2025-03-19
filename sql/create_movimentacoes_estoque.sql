-- Verifica se a tabela já existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'movimentacoes_estoque') THEN
        -- Cria a tabela movimentacoes_estoque
        CREATE TABLE movimentacoes_estoque (
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
        CREATE INDEX idx_movimentacoes_estoque_item_id ON movimentacoes_estoque(item_id);
        CREATE INDEX idx_movimentacoes_estoque_created_at ON movimentacoes_estoque(created_at);
        CREATE INDEX idx_movimentacoes_estoque_tipo ON movimentacoes_estoque(tipo_movimentacao);

        -- Adiciona comentários para documentação
        COMMENT ON TABLE movimentacoes_estoque IS 'Registra todas as movimentações de entrada e saída de itens do estoque';
        COMMENT ON COLUMN movimentacoes_estoque.tipo_movimentacao IS 'Tipo da movimentação: entrada ou saída';
        COMMENT ON COLUMN movimentacoes_estoque.motivo IS 'Motivo da movimentação (ex: compra, uso em operação, etc)';
        COMMENT ON COLUMN movimentacoes_estoque.destino_movimentacao IS 'Nome da unidade de destino para movimentações de saída';
        COMMENT ON COLUMN movimentacoes_estoque.frota_destino IS 'Número da frota de destino para movimentações de saída';
        COMMENT ON COLUMN movimentacoes_estoque.nota_fiscal IS 'Número da nota fiscal para movimentações de entrada';
    END IF;
END $$; 