-- Add category_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items_estoque'
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE items_estoque
        ADD COLUMN category_id UUID REFERENCES categorias_item(id) ON DELETE SET NULL;
    END IF;
END$$; 