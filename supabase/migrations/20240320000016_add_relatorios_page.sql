-- First, delete any existing relatorios categories and pages
DELETE FROM pages WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%relatorios%');
DELETE FROM categories WHERE name ILIKE '%relatorios%';

-- Create a single category for Relatórios
INSERT INTO categories (name, slug, section, icon, order_index)
VALUES ('Relatórios', 'relatorios', 'management', 'heroicons/outline/DocumentChartBarIcon', (
  SELECT COALESCE(MAX(order_index), 0) + 1
  FROM categories
  WHERE section = 'management'
));

-- Add a single page for the combined view
INSERT INTO pages (name, slug, category_id, icon, order_index)
SELECT 
  'Relatórios',
  'relatorios',
  id,
  'heroicons/outline/DocumentChartBarIcon',
  1
FROM categories 
WHERE slug = 'relatorios';

-- Set permissions for the new page
INSERT INTO page_permissions (page_id, role)
SELECT 
  p.id,
  'admin'
FROM pages p
JOIN categories c ON p.category_id = c.id
WHERE c.slug = 'relatorios'; 