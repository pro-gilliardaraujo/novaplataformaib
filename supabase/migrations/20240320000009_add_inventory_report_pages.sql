-- Get the Estoque category ID and insert pages
DO $$
DECLARE
  v_category_id UUID;
  v_inventario_page_id UUID;
  v_movimentacoes_page_id UUID;
BEGIN
  -- Get the category ID
  SELECT id INTO v_category_id
  FROM categories 
  WHERE slug = 'estoque' AND section = 'management'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_category_id IS NULL THEN
    -- If category doesn't exist, create it
    INSERT INTO categories (id, name, slug, section, icon, order_index)
    VALUES (
      gen_random_uuid(),
      'Estoque',
      'estoque',
      'management',
      'heroicons/outline/BoxIcon',
      (
        SELECT COALESCE(MAX(order_index), 0) + 1
        FROM categories
        WHERE section = 'management'
      )
    )
    RETURNING id INTO v_category_id;
  END IF;

  -- Insert Inventário Atual page
  INSERT INTO pages (id, name, slug, category_id, icon)
  VALUES (
    gen_random_uuid(),
    'Inventário Atual',
    'inventario-atual',
    v_category_id,
    'heroicons/outline/ClipboardDocumentListIcon'
  )
  ON CONFLICT (slug, category_id) 
  DO UPDATE SET 
    name = EXCLUDED.name,
    icon = EXCLUDED.icon
  RETURNING id INTO v_inventario_page_id;

  -- Insert Movimentações page
  INSERT INTO pages (id, name, slug, category_id, icon)
  VALUES (
    gen_random_uuid(),
    'Movimentações',
    'movimentacoes',
    v_category_id,
    'heroicons/outline/ArrowsUpDownIcon'
  )
  ON CONFLICT (slug, category_id) 
  DO UPDATE SET 
    name = EXCLUDED.name,
    icon = EXCLUDED.icon
  RETURNING id INTO v_movimentacoes_page_id;

  -- Add page content for Inventário Atual
  INSERT INTO page_content (id, page_id, content)
  VALUES (
    gen_random_uuid(),
    v_inventario_page_id,
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
  ON CONFLICT (page_id) DO UPDATE
  SET content = EXCLUDED.content;

  -- Add page content for Movimentações
  INSERT INTO page_content (id, page_id, content)
  VALUES (
    gen_random_uuid(),
    v_movimentacoes_page_id,
    jsonb_build_object(
      'tabs', jsonb_build_array(
        jsonb_build_object(
          'title', 'Movimentações',
          'content', jsonb_build_object(
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
  )
  ON CONFLICT (page_id) DO UPDATE
  SET content = EXCLUDED.content;

END$$; 