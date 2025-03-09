-- Cria a tabela de unidades
CREATE TABLE units (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE
);

-- Cria a tabela de permissões de usuário
CREATE TABLE user_permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_profile TEXT NOT NULL CHECK (base_profile IN ('global_admin', 'global_viewer', 'regional_admin', 'regional_viewer', 'custom')),
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL
);

-- Cria a tabela de recursos (categorias, páginas, painéis)
CREATE TABLE resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('category', 'page', 'panel')),
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL
);

-- Cria a tabela de permissões de recursos
CREATE TABLE resource_permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('category', 'page', 'panel')),
  permissions TEXT[] NOT NULL CHECK (permissions <@ ARRAY['view', 'edit', 'admin']::TEXT[]),
  UNIQUE(user_id, resource_id)
);

-- Adiciona trigger para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_permissions_updated_at
  BEFORE UPDATE ON resource_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insere algumas unidades iniciais
INSERT INTO units (name, code) VALUES
  ('Ituiutaba', 'ituiutaba'),
  ('Uberaba', 'uberaba');

-- Cria políticas de segurança
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas para units
CREATE POLICY "Units são visíveis para todos os usuários autenticados"
  ON units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas administradores podem gerenciar units"
  ON units FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND "adminProfile" = true
    )
  );

-- Políticas para user_permissions
CREATE POLICY "Usuários podem ver suas próprias permissões"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Apenas administradores podem gerenciar permissões"
  ON user_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND "adminProfile" = true
    )
  );

-- Políticas para resources
CREATE POLICY "Resources são visíveis para todos os usuários autenticados"
  ON resources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas administradores podem gerenciar resources"
  ON resources FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND "adminProfile" = true
    )
  );

-- Políticas para resource_permissions
CREATE POLICY "Usuários podem ver suas próprias permissões de recursos"
  ON resource_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Apenas administradores podem gerenciar permissões de recursos"
  ON resource_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND "adminProfile" = true
    )
  ); 