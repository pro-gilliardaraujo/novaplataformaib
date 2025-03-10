-- Função para verificar se uma tabela existe
CREATE OR REPLACE FUNCTION table_exists(schema text, tablename text) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = schema
    AND table_name = tablename
  );
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se uma constraint existe
CREATE OR REPLACE FUNCTION constraint_exists(schema text, tablename text, constraintname text) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.constraint_column_usage 
    WHERE table_schema = schema
    AND table_name = tablename
    AND constraint_name = constraintname
  );
END;
$$ LANGUAGE plpgsql;

-- Criar ou atualizar a tabela units
DO $$ 
BEGIN
  IF NOT table_exists('public', 'units') THEN
    CREATE TABLE units (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE
    );
  ELSE
    -- Garante que as colunas necessárias existem
    BEGIN
      ALTER TABLE units 
        ADD COLUMN IF NOT EXISTS name TEXT,
        ADD COLUMN IF NOT EXISTS code TEXT;
      
      -- Adiciona UNIQUE constraint se não existir
      IF NOT constraint_exists('public', 'units', 'units_code_key') THEN
        ALTER TABLE units ADD CONSTRAINT units_code_key UNIQUE (code);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

-- Criar ou atualizar a tabela user_permissions
DO $$ 
BEGIN
  IF NOT table_exists('public', 'user_permissions') THEN
    CREATE TABLE user_permissions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      base_profile TEXT NOT NULL CHECK (base_profile IN ('global_admin', 'global_viewer', 'regional_admin', 'regional_viewer', 'custom')),
      unit_id UUID REFERENCES units(id) ON DELETE SET NULL
    );
  ELSE
    -- Garante que as colunas necessárias existem
    BEGIN
      ALTER TABLE user_permissions 
        ADD COLUMN IF NOT EXISTS base_profile TEXT,
        ADD COLUMN IF NOT EXISTS unit_id UUID;

      -- Adiciona as constraints se não existirem
      IF NOT constraint_exists('public', 'user_permissions', 'user_permissions_base_profile_check') THEN
        ALTER TABLE user_permissions 
          ADD CONSTRAINT user_permissions_base_profile_check 
          CHECK (base_profile IN ('global_admin', 'global_viewer', 'regional_admin', 'regional_viewer', 'custom'));
      END IF;
      
      -- Remove e recria a foreign key
      ALTER TABLE user_permissions 
        DROP CONSTRAINT IF EXISTS user_permissions_unit_id_fkey;
      
      ALTER TABLE user_permissions 
        ADD CONSTRAINT user_permissions_unit_id_fkey 
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

-- Criar ou atualizar a tabela resources
DO $$ 
BEGIN
  IF NOT table_exists('public', 'resources') THEN
    CREATE TABLE resources (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('category', 'page', 'panel')),
      unit_id UUID REFERENCES units(id) ON DELETE CASCADE
    );
  ELSE
    -- Garante que as colunas necessárias existem
    BEGIN
      ALTER TABLE resources 
        ADD COLUMN IF NOT EXISTS name TEXT,
        ADD COLUMN IF NOT EXISTS type TEXT,
        ADD COLUMN IF NOT EXISTS unit_id UUID;

      -- Adiciona as constraints se não existirem
      IF NOT constraint_exists('public', 'resources', 'resources_type_check') THEN
        ALTER TABLE resources 
          ADD CONSTRAINT resources_type_check 
          CHECK (type IN ('category', 'page', 'panel'));
      END IF;
      
      -- Remove e recria a foreign key
      ALTER TABLE resources 
        DROP CONSTRAINT IF EXISTS resources_unit_id_fkey;
      
      ALTER TABLE resources 
        ADD CONSTRAINT resources_unit_id_fkey 
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

-- Criar ou atualizar a tabela resource_permissions
DO $$ 
BEGIN
  IF NOT table_exists('public', 'resource_permissions') THEN
    CREATE TABLE resource_permissions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      resource_type TEXT NOT NULL CHECK (resource_type IN ('category', 'page', 'panel')),
      permissions TEXT[] NOT NULL CHECK (permissions <@ ARRAY['view', 'edit', 'admin']::TEXT[])
    );
  ELSE
    -- Garante que as colunas necessárias existem
    BEGIN
      ALTER TABLE resource_permissions 
        ADD COLUMN IF NOT EXISTS user_id UUID,
        ADD COLUMN IF NOT EXISTS resource_id UUID,
        ADD COLUMN IF NOT EXISTS resource_type TEXT,
        ADD COLUMN IF NOT EXISTS permissions TEXT[];

      -- Adiciona as constraints se não existirem
      IF NOT constraint_exists('public', 'resource_permissions', 'resource_permissions_resource_type_check') THEN
        ALTER TABLE resource_permissions 
          ADD CONSTRAINT resource_permissions_resource_type_check 
          CHECK (resource_type IN ('category', 'page', 'panel'));
      END IF;
      
      IF NOT constraint_exists('public', 'resource_permissions', 'resource_permissions_permissions_check') THEN
        ALTER TABLE resource_permissions 
          ADD CONSTRAINT resource_permissions_permissions_check 
          CHECK (permissions <@ ARRAY['view', 'edit', 'admin']::TEXT[]);
      END IF;
      
      -- Remove e recria as foreign keys
      ALTER TABLE resource_permissions 
        DROP CONSTRAINT IF EXISTS resource_permissions_user_id_fkey;
      
      ALTER TABLE resource_permissions 
        ADD CONSTRAINT resource_permissions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      
      ALTER TABLE resource_permissions 
        DROP CONSTRAINT IF EXISTS resource_permissions_resource_id_fkey;
      
      ALTER TABLE resource_permissions 
        ADD CONSTRAINT resource_permissions_resource_id_fkey 
        FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

-- Criar ou atualizar a tabela resource_units
DO $$ 
BEGIN
  IF NOT table_exists('public', 'resource_units') THEN
    CREATE TABLE resource_units (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
      resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
      unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
      UNIQUE(resource_id, unit_id)
    );
  ELSE
    -- Garante que as colunas necessárias existem
    BEGIN
      ALTER TABLE resource_units 
        ADD COLUMN IF NOT EXISTS resource_id UUID,
        ADD COLUMN IF NOT EXISTS unit_id UUID;

      -- Remove e recria as constraints
      ALTER TABLE resource_units 
        DROP CONSTRAINT IF EXISTS resource_units_resource_id_fkey;
      
      ALTER TABLE resource_units 
        ADD CONSTRAINT resource_units_resource_id_fkey 
        FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE;
      
      ALTER TABLE resource_units 
        DROP CONSTRAINT IF EXISTS resource_units_unit_id_fkey;
      
      ALTER TABLE resource_units 
        ADD CONSTRAINT resource_units_unit_id_fkey 
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;
      
      IF NOT constraint_exists('public', 'resource_units', 'resource_units_resource_id_unit_id_key') THEN
        ALTER TABLE resource_units 
          ADD CONSTRAINT resource_units_resource_id_unit_id_key 
          UNIQUE (resource_id, unit_id);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace triggers
DO $$ 
BEGIN
  -- Units trigger
  DROP TRIGGER IF EXISTS update_units_updated_at ON units;
  CREATE TRIGGER update_units_updated_at
    BEFORE UPDATE ON units
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  -- User permissions trigger
  DROP TRIGGER IF EXISTS update_user_permissions_updated_at ON user_permissions;
  CREATE TRIGGER update_user_permissions_updated_at
    BEFORE UPDATE ON user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  -- Resources trigger
  DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
  CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  -- Resource permissions trigger
  DROP TRIGGER IF EXISTS update_resource_permissions_updated_at ON resource_permissions;
  CREATE TRIGGER update_resource_permissions_updated_at
    BEFORE UPDATE ON resource_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  -- Resource units trigger
  DROP TRIGGER IF EXISTS update_resource_units_updated_at ON resource_units;
  CREATE TRIGGER update_resource_units_updated_at
    BEFORE UPDATE ON resource_units
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Enable RLS
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_units ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
DO $$ 
BEGIN
  -- Units policies
  DROP POLICY IF EXISTS "Authenticated users can read units" ON units;
  CREATE POLICY "Authenticated users can read units"
    ON units FOR SELECT
    TO authenticated
    USING (true);

  DROP POLICY IF EXISTS "Only admins can modify units" ON units;
  CREATE POLICY "Only admins can modify units"
    ON units FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.base_profile = 'global_admin'
      )
    );

  -- User permissions policies
  DROP POLICY IF EXISTS "Users can read their own permissions" ON user_permissions;
  CREATE POLICY "Users can read their own permissions"
    ON user_permissions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
      AND up.base_profile = 'global_admin'
    ));

  DROP POLICY IF EXISTS "Only admins can modify permissions" ON user_permissions;
  CREATE POLICY "Only admins can modify permissions"
    ON user_permissions FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.base_profile = 'global_admin'
      )
    );

  -- Resources policies
  DROP POLICY IF EXISTS "Authenticated users can read resources" ON resources;
  CREATE POLICY "Authenticated users can read resources"
    ON resources FOR SELECT
    TO authenticated
    USING (true);

  DROP POLICY IF EXISTS "Only admins can modify resources" ON resources;
  CREATE POLICY "Only admins can modify resources"
    ON resources FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.base_profile = 'global_admin'
      )
    );

  -- Resource permissions policies
  DROP POLICY IF EXISTS "Users can read their own resource permissions" ON resource_permissions;
  CREATE POLICY "Users can read their own resource permissions"
    ON resource_permissions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
      AND up.base_profile = 'global_admin'
    ));

  DROP POLICY IF EXISTS "Only admins can modify resource permissions" ON resource_permissions;
  CREATE POLICY "Only admins can modify resource permissions"
    ON resource_permissions FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.base_profile = 'global_admin'
      )
    );

  -- Resource units policies
  DROP POLICY IF EXISTS "Admins globais podem ver todas as associações de recursos" ON resource_units;
  CREATE POLICY "Admins globais podem ver todas as associações de recursos"
    ON resource_units
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.base_profile = 'global_admin'
      )
    );

  DROP POLICY IF EXISTS "Admins regionais podem ver associações de sua unidade" ON resource_units;
  CREATE POLICY "Admins regionais podem ver associações de sua unidade"
    ON resource_units
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM user_permissions up
        WHERE up.user_id = auth.uid()
        AND (up.base_profile = 'regional_admin' OR up.base_profile = 'regional_viewer')
        AND up.unit_id = resource_units.unit_id
      )
    );

  DROP POLICY IF EXISTS "Admins globais podem gerenciar associações" ON resource_units;
  CREATE POLICY "Admins globais podem gerenciar associações"
    ON resource_units
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.base_profile = 'global_admin'
      )
    );
END $$;

-- Insert initial data if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM units WHERE code = 'ITB') THEN
    INSERT INTO units (name, code) VALUES ('Ituiutaba', 'ITB');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM units WHERE code = 'URA') THEN
    INSERT INTO units (name, code) VALUES ('Uberaba', 'URA');
  END IF;
END $$; 