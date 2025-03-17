-- Add inventory reports category
INSERT INTO categories (id, name, slug, order_index, section, icon)
VALUES (
  gen_random_uuid(),
  'Relatórios de Estoque',
  'relatorios-estoque',
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM categories WHERE section = 'reports'),
  'reports',
  'ChartBarIcon'
)
ON CONFLICT (slug) DO NOTHING;

-- Add inventory status report page
WITH category AS (
  SELECT id FROM categories WHERE slug = 'relatorios-estoque'
)
INSERT INTO pages (id, name, slug, category_id)
VALUES (
  gen_random_uuid(),
  'Inventário Atual',
  'inventario-atual',
  (SELECT id FROM category)
)
ON CONFLICT (slug, category_id) DO NOTHING;

-- Add page content
WITH page AS (
  SELECT id FROM pages WHERE slug = 'inventario-atual'
)
INSERT INTO page_content (id, page_id, content)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM page),
  jsonb_build_object(
    'tabs', jsonb_build_array(
      jsonb_build_object(
        'title', 'Visão Geral',
        'content', jsonb_build_object(
          'type', 'inventory_overview',
          'settings', jsonb_build_object(
            'showCategories', true,
            'showLowStock', true,
            'showCharts', true
          )
        )
      ),
      jsonb_build_object(
        'title', 'Lista Detalhada',
        'content', jsonb_build_object(
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
        )
      )
    )
  )
)
ON CONFLICT (page_id) DO NOTHING; 