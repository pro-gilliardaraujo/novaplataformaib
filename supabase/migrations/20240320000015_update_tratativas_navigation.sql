-- First, delete any existing tratativas categories and pages
DELETE FROM pages WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%tratativa%');
DELETE FROM categories WHERE name ILIKE '%tratativa%';

-- Create a single category for Tratativas
INSERT INTO categories (name, slug, section, icon, order_index)
VALUES ('Tratativas', 'tratativas', 'management', 'phosphor/regular/ClipboardText', (
  SELECT COALESCE(MAX(order_index), 0) + 1
  FROM categories
  WHERE section = 'management'
));

-- Add a single page for the combined view
INSERT INTO pages (name, slug, category_id, icon, order_index)
SELECT 
  'Tratativas',
  'tratativas',
  id,
  'phosphor/regular/ClipboardText',
  1
FROM categories 
WHERE slug = 'tratativas';

-- Set permissions for the new page
INSERT INTO page_permissions (page_id, role)
SELECT 
  p.id,
  'admin'
FROM pages p
JOIN categories c ON p.category_id = c.id
WHERE c.slug = 'tratativas'; 