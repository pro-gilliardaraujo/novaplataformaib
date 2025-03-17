-- Create page_content table
CREATE TABLE page_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE UNIQUE,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create updated_at trigger for page_content
CREATE TRIGGER update_page_content_updated_at
    BEFORE UPDATE ON page_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for page_content
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Page content is viewable by authenticated users"
    ON page_content FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Page content is insertable by authenticated users"
    ON page_content FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Page content is updatable by authenticated users"
    ON page_content FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Page content is deletable by authenticated users"
    ON page_content FOR DELETE
    USING (auth.role() = 'authenticated');

-- Add inventory reports pages to Estoque category
WITH estoque_category AS (
  SELECT id FROM categories WHERE slug = 'estoque'
)
INSERT INTO pages (id, name, slug, category_id)
VALUES
  (
    gen_random_uuid(),
    'Inventário Atual',
    'inventario-atual',
    (SELECT id FROM estoque_category)
  ),
  (
    gen_random_uuid(),
    'Movimentações',
    'movimentacoes',
    (SELECT id FROM estoque_category)
  )
ON CONFLICT (slug, category_id) DO NOTHING;

-- Add page content for Inventário Atual
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

-- Add page content for Movimentações
WITH page AS (
  SELECT id FROM pages WHERE slug = 'movimentacoes'
)
INSERT INTO page_content (id, page_id, content)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM page),
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
ON CONFLICT (page_id) DO NOTHING; 