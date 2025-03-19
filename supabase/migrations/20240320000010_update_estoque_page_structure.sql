-- Delete child pages from Estoque category
DELETE FROM pages 
WHERE category_id = (
  SELECT id 
  FROM categories 
  WHERE slug = 'estoque' 
  AND section = 'management'
)
AND slug != 'estoque';

-- Update the existing Estoque page content
WITH estoque_page AS (
  SELECT id 
  FROM pages 
  WHERE slug = 'estoque' 
  AND category_id = (
    SELECT id 
    FROM categories 
    WHERE slug = 'estoque' 
    AND section = 'management'
  )
)
INSERT INTO page_content (id, page_id, content)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM estoque_page),
  jsonb_build_object(
    'type', 'tabbed_page',
    'settings', jsonb_build_object(
      'defaultTab', 'overview',
      'showHeader', true
    ),
    'content', jsonb_build_object(
      'overview', jsonb_build_object(
        'title', 'Visão Geral',
        'type', 'inventory_overview',
        'settings', jsonb_build_object(
          'showCategories', true,
          'showLowStock', true,
          'showCharts', true
        )
      ),
      'list', jsonb_build_object(
        'title', 'Lista Detalhada',
        'type', 'inventory_list',
        'settings', jsonb_build_object(
          'showFilters', true,
          'showExport', true,
          'columns', jsonb_build_array(
            'codigo_fabricante',
            'descricao',
            'categoria',
            'quantidade_atual',
            'ultima_movimentacao'
          )
        )
      ),
      'movements', jsonb_build_object(
        'title', 'Movimentações',
        'type', 'inventory_movements',
        'settings', jsonb_build_object(
          'showFilters', true,
          'showExport', true,
          'showDateRange', true,
          'columns', jsonb_build_array(
            'data',
            'tipo',
            'motivo',
            'quantidade',
            'item',
            'responsavel'
          )
        )
      )
    )
  )
)
ON CONFLICT (page_id) 
DO UPDATE SET content = EXCLUDED.content; 