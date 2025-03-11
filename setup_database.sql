-- Adicionar coluna section na tabela categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT 'reports';

-- Adicionar coluna icon na tabela pages
ALTER TABLE pages ADD COLUMN IF NOT EXISTS icon text;

-- Adicionar coluna icon na tabela categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon text;

-- Atualizar categorias existentes para a seção 'reports'
UPDATE categories SET section = 'reports' WHERE section IS NULL;

-- Atualizar categorias de gerenciamento existentes
UPDATE categories 
SET section = 'management' 
WHERE slug IN (
  'usuarios',
  'paginas',
  'tratativas',
  'retiradas',
  'equipamentos'
);

-- Inserir ou atualizar categorias de gerenciamento
INSERT INTO categories (name, slug, order_index, section)
VALUES 
  ('Usuários', 'usuarios', (SELECT COALESCE(MAX(order_index), 0) + 1 FROM categories), 'management'),
  ('Páginas', 'paginas', (SELECT COALESCE(MAX(order_index), 0) + 2 FROM categories), 'management'),
  ('Tratativas', 'tratativas', (SELECT COALESCE(MAX(order_index), 0) + 3 FROM categories), 'management'),
  ('Retiradas', 'retiradas', (SELECT COALESCE(MAX(order_index), 0) + 4 FROM categories), 'management'),
  ('Equipamentos', 'equipamentos', (SELECT COALESCE(MAX(order_index), 0) + 5 FROM categories), 'management')
ON CONFLICT (slug) 
DO UPDATE SET 
  section = 'management',
  name = EXCLUDED.name;

-- Inserir páginas de gerenciamento
WITH management_categories AS (
  SELECT id, name, slug FROM categories WHERE section = 'management'
)
INSERT INTO pages (name, slug, category_id)
SELECT
  CASE 
    WHEN c.slug = 'tratativas' THEN 'Dashboard'
    ELSE c.name
  END,
  CASE 
    WHEN c.slug = 'tratativas' THEN 'dashboard'
    ELSE c.slug
  END,
  c.id
FROM management_categories c
WHERE NOT EXISTS (
  SELECT 1 FROM pages p WHERE p.category_id = c.id AND p.slug = CASE 
    WHEN c.slug = 'tratativas' THEN 'dashboard'
    ELSE c.slug
  END
);

-- Adicionar a página "Lista" para a categoria Tratativas
INSERT INTO pages (name, slug, category_id)
SELECT 'Lista', 'lista', c.id
FROM categories c
WHERE c.slug = 'tratativas'
AND NOT EXISTS (
  SELECT 1 FROM pages p 
  WHERE p.category_id = c.id AND p.slug = 'lista'
); 