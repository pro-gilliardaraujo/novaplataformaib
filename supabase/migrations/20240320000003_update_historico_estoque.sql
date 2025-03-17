-- Add tipo_movimentacao and motivo columns to historico_estoque
ALTER TABLE historico_estoque
ADD COLUMN tipo_movimentacao TEXT NOT NULL CHECK (tipo_movimentacao IN ('entrada', 'saida', 'ajuste')),
ADD COLUMN motivo TEXT NOT NULL; 