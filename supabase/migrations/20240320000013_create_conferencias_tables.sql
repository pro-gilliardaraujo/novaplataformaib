-- Verifica se as tabelas já existem e remove
DROP TABLE IF EXISTS itens_conferencia;
DROP TABLE IF EXISTS conferencias_estoque;

-- Cria a tabela principal de conferências
CREATE TABLE conferencias_estoque (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    data_conferencia TIMESTAMP WITH TIME ZONE NOT NULL,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('em_andamento', 'concluida', 'cancelada')),
    responsavel TEXT NOT NULL,
    observacoes TEXT,
    total_itens INTEGER DEFAULT 0,
    itens_conferidos INTEGER DEFAULT 0,
    itens_divergentes INTEGER DEFAULT 0
);

-- Cria a tabela de itens da conferência
CREATE TABLE itens_conferencia (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conferencia_id UUID REFERENCES conferencias_estoque(id) ON DELETE CASCADE,
    item_id UUID REFERENCES itens_estoque(id) ON DELETE CASCADE,
    quantidade_sistema NUMERIC NOT NULL,
    quantidade_conferida NUMERIC,
    diferenca NUMERIC GENERATED ALWAYS AS (COALESCE(quantidade_conferida, 0) - quantidade_sistema) STORED,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cria índices para melhorar performance
CREATE INDEX idx_conferencias_status ON conferencias_estoque(status);
CREATE INDEX idx_conferencias_data ON conferencias_estoque(data_conferencia);
CREATE INDEX idx_itens_conferencia_conferencia ON itens_conferencia(conferencia_id);
CREATE INDEX idx_itens_conferencia_item ON itens_conferencia(item_id);

-- Cria função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Cria trigger para atualizar updated_at
CREATE TRIGGER update_itens_conferencia_updated_at
    BEFORE UPDATE ON itens_conferencia
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Cria função para atualizar contadores da conferência
CREATE OR REPLACE FUNCTION update_conferencia_counters()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualiza os contadores na tabela conferencias_estoque
    UPDATE conferencias_estoque
    SET 
        itens_conferidos = (
            SELECT COUNT(*) 
            FROM itens_conferencia 
            WHERE conferencia_id = NEW.conferencia_id 
            AND quantidade_conferida IS NOT NULL
        ),
        itens_divergentes = (
            SELECT COUNT(*) 
            FROM itens_conferencia 
            WHERE conferencia_id = NEW.conferencia_id 
            AND diferenca != 0
        )
    WHERE id = NEW.conferencia_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Cria trigger para atualizar contadores
CREATE TRIGGER update_conferencia_counters_trigger
    AFTER INSERT OR UPDATE ON itens_conferencia
    FOR EACH ROW
    EXECUTE FUNCTION update_conferencia_counters();

-- Adiciona comentários nas tabelas e colunas
COMMENT ON TABLE conferencias_estoque IS 'Tabela que armazena as conferências de estoque';
COMMENT ON TABLE itens_conferencia IS 'Tabela que armazena os itens conferidos em cada conferência';

COMMENT ON COLUMN conferencias_estoque.status IS 'Status da conferência: em_andamento, concluida ou cancelada';
COMMENT ON COLUMN conferencias_estoque.total_itens IS 'Total de itens incluídos na conferência';
COMMENT ON COLUMN conferencias_estoque.itens_conferidos IS 'Número de itens já conferidos';
COMMENT ON COLUMN conferencias_estoque.itens_divergentes IS 'Número de itens com divergência';

COMMENT ON COLUMN itens_conferencia.quantidade_sistema IS 'Quantidade que estava no sistema no momento da conferência';
COMMENT ON COLUMN itens_conferencia.quantidade_conferida IS 'Quantidade encontrada na conferência física';
COMMENT ON COLUMN itens_conferencia.diferenca IS 'Diferença entre quantidade conferida e do sistema'; 