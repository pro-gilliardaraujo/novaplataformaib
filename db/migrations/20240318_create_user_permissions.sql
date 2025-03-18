-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  unit_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_slug)
);

-- Add RLS policies
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Users can read their own permissions
CREATE POLICY "Users can read their own permissions"
  ON user_permissions FOR SELECT
  USING (auth.uid() = user_id);

-- Only admins can insert permissions
CREATE POLICY "Only admins can insert permissions"
  ON user_permissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = auth.uid()
        AND category_slug = 'usuarios'
        AND is_admin = true
    )
  );

-- Only admins can update permissions
CREATE POLICY "Only admins can update permissions"
  ON user_permissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = auth.uid()
        AND category_slug = 'usuarios'
        AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = auth.uid()
        AND category_slug = 'usuarios'
        AND is_admin = true
    )
  );

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Insert default admin permission for the first user
-- This needs to be done with security definer function to bypass RLS
CREATE OR REPLACE FUNCTION insert_default_admin_permission()
RETURNS void AS $$
BEGIN
  INSERT INTO user_permissions (user_id, category_slug, is_admin)
  SELECT id, 'paradas', true
  FROM auth.users
  ORDER BY created_at
  LIMIT 1
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT insert_default_admin_permission(); 