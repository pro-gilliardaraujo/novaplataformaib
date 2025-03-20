-- Update the existing Estoque page content to include the conferences tab
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
UPDATE page_content 
SET content = jsonb_set(
  content,
  '{content}',
  content->'content' || jsonb_build_object(
    'conferences', jsonb_build_object(
      'title', 'Conferências',
      'type', 'inventory_conferences',
      'settings', jsonb_build_object(
        'showFilters', true,
        'showExport', true,
        'columns', jsonb_build_array(
          'data_conferencia',
          'status',
          'total_itens',
          'itens_conferidos',
          'itens_divergentes',
          'responsaveis'
        )
      )
    )
  )
)
WHERE page_id = (SELECT id FROM estoque_page); 