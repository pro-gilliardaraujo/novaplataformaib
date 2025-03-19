-- Início da transação para os demais comandos
BEGIN;

-- Define o timezone padrão para o banco de dados
ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo';

-- Define o timezone para a sessão atual
SET timezone TO 'America/Sao_Paulo';

-- Atualiza a configuração do timezone no PostgreSQL
ALTER SYSTEM SET timezone = 'America/Sao_Paulo';

-- Atualiza todas as colunas timestamp existentes para usar o novo timezone
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Loop através de todas as tabelas do schema public
    FOR r IN SELECT table_name 
             FROM information_schema.tables 
             WHERE table_schema = 'public' 
    LOOP
        -- Verifica e atualiza created_at se existir
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = r.table_name 
              AND column_name = 'created_at'
        ) THEN
            EXECUTE format('
                UPDATE %I 
                SET created_at = created_at AT TIME ZONE ''UTC'' AT TIME ZONE ''America/Sao_Paulo''
                WHERE created_at IS NOT NULL', 
                r.table_name
            );
        END IF;

        -- Verifica e atualiza updated_at se existir
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = r.table_name 
              AND column_name = 'updated_at'
        ) THEN
            EXECUTE format('
                UPDATE %I 
                SET updated_at = updated_at AT TIME ZONE ''UTC'' AT TIME ZONE ''America/Sao_Paulo''
                WHERE updated_at IS NOT NULL', 
                r.table_name
            );
        END IF;
    END LOOP;
END $$;

-- Adiciona um trigger para manter o timezone em novas inserções
CREATE OR REPLACE FUNCTION trigger_set_timezone()
RETURNS TRIGGER AS $$
BEGIN
    -- Verifica se a coluna created_at existe na tabela
    IF TG_OP = 'INSERT' AND EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = TG_TABLE_SCHEMA 
          AND table_name = TG_TABLE_NAME 
          AND column_name = 'created_at'
    ) THEN
        NEW.created_at = COALESCE(NEW.created_at, now()) AT TIME ZONE 'America/Sao_Paulo';
    END IF;

    -- Verifica se a coluna updated_at existe na tabela
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = TG_TABLE_SCHEMA 
          AND table_name = TG_TABLE_NAME 
          AND column_name = 'updated_at'
    ) THEN
        NEW.updated_at = COALESCE(NEW.updated_at, now()) AT TIME ZONE 'America/Sao_Paulo';
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplica o trigger em todas as tabelas que têm as colunas created_at ou updated_at
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT table_name 
             FROM information_schema.tables 
             WHERE table_schema = 'public'
    LOOP
        -- Verifica se a tabela tem pelo menos uma das colunas (created_at ou updated_at)
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = r.table_name 
              AND column_name IN ('created_at', 'updated_at')
        ) THEN
            -- Remove trigger existente se houver
            EXECUTE format('DROP TRIGGER IF EXISTS set_timezone ON %I', r.table_name);
            -- Cria novo trigger
            EXECUTE format('
                CREATE TRIGGER set_timezone
                    BEFORE INSERT OR UPDATE ON %I
                    FOR EACH ROW
                    EXECUTE FUNCTION trigger_set_timezone()', 
                r.table_name
            );
        END IF;
    END LOOP;
END $$;

-- Comentários para documentação
COMMENT ON FUNCTION trigger_set_timezone() IS 'Função para garantir que timestamps sejam salvos no timezone America/Sao_Paulo';

-- Log da alteração
INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
VALUES (
    '20240320000014',
    ARRAY['Timezone configuration set to America/Sao_Paulo'],
    'set_timezone_config'
);

COMMIT; 