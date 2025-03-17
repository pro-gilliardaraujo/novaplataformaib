-- Insert the Estoque category
INSERT INTO categories (name, slug, section, icon, order_index)
VALUES ('Estoque', 'estoque', 'management', 'BoxIcon', (
  SELECT COALESCE(MAX(order_index), 0) + 1
  FROM categories
  WHERE section = 'management'
)); 