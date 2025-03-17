-- Add quantidade column to historico_estoque if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'historico_estoque'
        AND column_name = 'quantidade'
    ) THEN
        ALTER TABLE historico_estoque
        ADD COLUMN quantidade INTEGER NOT NULL;
    END IF;
END$$; 