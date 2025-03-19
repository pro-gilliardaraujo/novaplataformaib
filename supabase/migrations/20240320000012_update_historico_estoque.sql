-- Adiciona novas colunas à tabela historico_estoque
ALTER TABLE historico_estoque
ADD COLUMN IF NOT EXISTS destino_movimentacao text,
ADD COLUMN IF NOT EXISTS frota_destino text,
ADD COLUMN IF NOT EXISTS nota_fiscal text;

-- Adiciona comentários para documentar o propósito das colunas
COMMENT ON COLUMN historico_estoque.destino_movimentacao IS 'Nome da unidade de destino para movimentações de saída';
COMMENT ON COLUMN historico_estoque.frota_destino IS 'Número da frota de destino para movimentações de saída';
COMMENT ON COLUMN historico_estoque.nota_fiscal IS 'Número da nota fiscal para movimentações de entrada'; 