-- Limpar dados existentes
TRUNCATE TABLE paradas_registros CASCADE;
TRUNCATE TABLE paradas_frotas CASCADE;
TRUNCATE TABLE paradas_tipos CASCADE;
TRUNCATE TABLE unidades CASCADE;

-- Inserir unidades
INSERT INTO unidades (id, nome, codigo, ativo) VALUES
  ('f0da6af7-8df6-4e46-a45f-e9c4cbe63c01', 'Unidade São Paulo', 'USP', true),
  ('c2e3e9f7-2a8b-4bc3-8a71-89c9e3d1a378', 'Unidade Minas Gerais', 'UMG', true),
  ('b5d2d8c1-6a5f-4b54-9c7d-9e8a3f1c2b45', 'Unidade Goiás', 'UGO', true),
  ('a4c1b7d0-5e4a-3f2b-8d6c-7e9b2a1c0d34', 'Unidade Mato Grosso', 'UMT', true);

-- Inserir tipos de parada
INSERT INTO paradas_tipos (id, nome, ativo) VALUES
  ('d1b2c3a4-5e6f-7g8h-9i0j-k1l2m3n4o5p6', 'Manutenção Preventiva', true),
  ('e2f3g4h5-6i7j-8k9l-0m1n-o2p3q4r5s6t7', 'Manutenção Corretiva', true),
  ('f3g4h5i6-7j8k-9l0m-1n2o-p3q4r5s6t7u8', 'Abastecimento', true),
  ('g4h5i6j7-8k9l-0m1n-2o3p-q4r5s6t7u8v9', 'Troca de Turno', true);

-- Inserir frotas
-- Unidade São Paulo
INSERT INTO paradas_frotas (id, codigo, modelo, unidade_id, tipo, ativo) VALUES
  ('a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', '6100', 'CASE IH PUMA 200', 'f0da6af7-8df6-4e46-a45f-e9c4cbe63c01', 'Transbordo', true),
  ('b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7', '7029', 'JOHN DEERE CH570', 'f0da6af7-8df6-4e46-a45f-e9c4cbe63c01', 'Colhedora', true),
  ('c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8', '8045', 'CASE IH 2566', 'f0da6af7-8df6-4e46-a45f-e9c4cbe63c01', 'Colhedora', true);

-- Unidade Minas Gerais
INSERT INTO paradas_frotas (id, codigo, modelo, unidade_id, tipo, ativo) VALUES
  ('d4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9', '6200', 'CASE IH PUMA 200', 'c2e3e9f7-2a8b-4bc3-8a71-89c9e3d1a378', 'Transbordo', true),
  ('e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0', '7030', 'JOHN DEERE CH570', 'c2e3e9f7-2a8b-4bc3-8a71-89c9e3d1a378', 'Colhedora', true),
  ('f6g7h8i9-j0k1-l2m3-n4o5-p6q7r8s9t0u1', '9001', 'JOHN DEERE DB120', 'c2e3e9f7-2a8b-4bc3-8a71-89c9e3d1a378', 'Plantadeira', true);

-- Unidade Goiás
INSERT INTO paradas_frotas (id, codigo, modelo, unidade_id, tipo, ativo) VALUES
  ('g7h8i9j0-k1l2-m3n4-o5p6-q7r8s9t0u1v2', '6300', 'CASE IH PUMA 200', 'b5d2d8c1-6a5f-4b54-9c7d-9e8a3f1c2b45', 'Transbordo', true),
  ('h8i9j0k1-l2m3-n4o5-p6q7-r8s9t0u1v2w3', '7031', 'JOHN DEERE CH570', 'b5d2d8c1-6a5f-4b54-9c7d-9e8a3f1c2b45', 'Colhedora', true),
  ('i9j0k1l2-m3n4-o5p6-q7r8-s9t0u1v2w3x4', '9002', 'JOHN DEERE DB120', 'b5d2d8c1-6a5f-4b54-9c7d-9e8a3f1c2b45', 'Plantadeira', true);

-- Unidade Mato Grosso
INSERT INTO paradas_frotas (id, codigo, modelo, unidade_id, tipo, ativo) VALUES
  ('j0k1l2m3-n4o5-p6q7-r8s9-t0u1v2w3x4y5', '6400', 'CASE IH PUMA 200', 'a4c1b7d0-5e4a-3f2b-8d6c-7e9b2a1c0d34', 'Transbordo', true),
  ('k1l2m3n4-o5p6-q7r8-s9t0-u1v2w3x4y5z6', '7032', 'JOHN DEERE CH570', 'a4c1b7d0-5e4a-3f2b-8d6c-7e9b2a1c0d34', 'Colhedora', true),
  ('l2m3n4o5-p6q7-r8s9-t0u1-v2w3x4y5z6a7', '9003', 'JOHN DEERE DB120', 'a4c1b7d0-5e4a-3f2b-8d6c-7e9b2a1c0d34', 'Plantadeira', true);

-- Inserir algumas paradas ativas para teste
INSERT INTO paradas_registros (id, frota_id, tipo_id, horario_inicio, previsao_minutos, motivo) VALUES
  ('m3n4o5p6-q7r8-s9t0-u1v2-w3x4y5z6a7b8', 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', 'd1b2c3a4-5e6f-7g8h-9i0j-k1l2m3n4o5p6', NOW() - INTERVAL '2 hours', 180, 'Manutenção preventiva programada'),
  ('n4o5p6q7-r8s9-t0u1-v2w3-x4y5z6a7b8c9', 'e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0', 'e2f3g4h5-6i7j-8k9l-0m1n-o2p3q4r5s6t7', NOW() - INTERVAL '1 hour', 120, 'Reparo no sistema hidráulico'),
  ('o5p6q7r8-s9t0-u1v2-w3x4-y5z6a7b8c9d0', 'i9j0k1l2-m3n4-o5p6-q7r8-s9t0u1v2w3x4', 'f3g4h5i6-7j8k-9l0m-1n2o-p3q4r5s6t7u8', NOW() - INTERVAL '30 minutes', 45, 'Abastecimento e checagem de óleo'); 