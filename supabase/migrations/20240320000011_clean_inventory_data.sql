-- Limpa os dados das tabelas do sistema de estoque
-- Primeiro limpa as tabelas dependentes para evitar violações de chave estrangeira

-- Limpa o histórico de estoque
TRUNCATE TABLE historico_estoque CASCADE;

-- Limpa os alertas de estoque
TRUNCATE TABLE alertas_estoque CASCADE;

-- Limpa as imagens dos itens
TRUNCATE TABLE imagens_item CASCADE;

-- Limpa os itens do estoque
TRUNCATE TABLE itens_estoque CASCADE;

-- Limpa as categorias de itens
TRUNCATE TABLE categorias_item CASCADE;

-- Reseta as sequências (se houver)
ALTER SEQUENCE IF EXISTS historico_estoque_id_seq RESTART;
ALTER SEQUENCE IF EXISTS alertas_estoque_id_seq RESTART;
ALTER SEQUENCE IF EXISTS imagens_item_id_seq RESTART;
ALTER SEQUENCE IF EXISTS itens_estoque_id_seq RESTART;
ALTER SEQUENCE IF EXISTS categorias_item_id_seq RESTART; 