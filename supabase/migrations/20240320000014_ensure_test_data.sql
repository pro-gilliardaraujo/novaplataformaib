-- First, ensure the quantidade column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'historico_estoque'
        AND column_name = 'quantidade'
    ) THEN
        RAISE EXCEPTION 'Column quantidade does not exist in historico_estoque table. Please run the previous migration first.';
    END IF;
END$$;

-- Check if we have any test data and insert if needed
DO $$
DECLARE
    item_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO item_count FROM items_estoque WHERE descricao LIKE 'TESTE_%';
    
    -- If no test data exists, insert it
    IF item_count = 0 THEN
        -- Insert test categories
        INSERT INTO categorias_item (id, nome, descricao, cor)
        VALUES
            ('00000000-0000-0000-0000-000000000001', 'TESTE_Ferramentas', 'Categoria de teste para ferramentas', '#FF0000'),
            ('00000000-0000-0000-0000-000000000002', 'TESTE_Consumíveis', 'Categoria de teste para itens consumíveis', '#00FF00'),
            ('00000000-0000-0000-0000-000000000003', 'TESTE_Equipamentos', 'Categoria de teste para equipamentos', '#0000FF')
        ON CONFLICT (id) DO UPDATE SET
            nome = EXCLUDED.nome,
            descricao = EXCLUDED.descricao,
            cor = EXCLUDED.cor;

        -- Insert test items
        INSERT INTO items_estoque (
            id,
            descricao,
            codigo_fabricante,
            quantidade_atual,
            category_id,
            nivel_minimo,
            nivel_critico,
            alertas_ativos,
            observacoes
        )
        VALUES
            -- Ferramentas (alguns com estoque baixo)
            (
                '00000000-0000-0000-0000-000000000001',
                'TESTE_Chave de Fenda',
                'TESTE_CF001',
                3,
                '00000000-0000-0000-0000-000000000001',
                5,
                2,
                true,
                'Item de teste para alerta de estoque baixo'
            ),
            (
                '00000000-0000-0000-0000-000000000002',
                'TESTE_Martelo',
                'TESTE_MT001',
                1,
                '00000000-0000-0000-0000-000000000001',
                3,
                1,
                true,
                'Item de teste para alerta de estoque crítico'
            ),
            (
                '00000000-0000-0000-0000-000000000003',
                'TESTE_Alicate',
                'TESTE_AL001',
                10,
                '00000000-0000-0000-0000-000000000001',
                5,
                2,
                true,
                'Item de teste com estoque normal'
            ),
            -- Consumíveis (para teste de movimentações frequentes)
            (
                '00000000-0000-0000-0000-000000000004',
                'TESTE_Parafuso 10mm',
                'TESTE_PF001',
                50,
                '00000000-0000-0000-0000-000000000002',
                100,
                50,
                true,
                'Item de teste para movimentações frequentes'
            ),
            (
                '00000000-0000-0000-0000-000000000005',
                'TESTE_Porca 10mm',
                'TESTE_PC001',
                45,
                '00000000-0000-0000-0000-000000000002',
                100,
                50,
                true,
                'Item de teste para movimentações frequentes'
            ),
            (
                '00000000-0000-0000-0000-000000000006',
                'TESTE_Arruela 10mm',
                'TESTE_AR001',
                150,
                '00000000-0000-0000-0000-000000000002',
                100,
                50,
                true,
                'Item de teste para movimentações frequentes'
            ),
            -- Equipamentos (para teste de movimentações esporádicas)
            (
                '00000000-0000-0000-0000-000000000007',
                'TESTE_Furadeira',
                'TESTE_FD001',
                2,
                '00000000-0000-0000-0000-000000000003',
                2,
                1,
                true,
                'Item de teste para movimentações esporádicas'
            ),
            (
                '00000000-0000-0000-0000-000000000008',
                'TESTE_Serra Circular',
                'TESTE_SC001',
                1,
                '00000000-0000-0000-0000-000000000003',
                2,
                1,
                true,
                'Item de teste para movimentações esporádicas'
            ),
            (
                '00000000-0000-0000-0000-000000000009',
                'TESTE_Lixadeira',
                'TESTE_LX001',
                3,
                '00000000-0000-0000-0000-000000000003',
                2,
                1,
                true,
                'Item de teste para movimentações esporádicas'
            );

        -- Create test movements for the last 6 months
        WITH movement_data AS (
            SELECT
                CASE 
                    WHEN random() < 0.33 THEN '00000000-0000-0000-0000-000000000004'::uuid
                    WHEN random() < 0.66 THEN '00000000-0000-0000-0000-000000000005'::uuid
                    ELSE '00000000-0000-0000-0000-000000000006'::uuid
                END as item_id,
                CASE 
                    WHEN random() < 0.6 THEN 'saida'
                    WHEN random() < 0.9 THEN 'entrada'
                    ELSE 'ajuste'
                END as tipo_movimentacao,
                floor(random() * 20 + 1)::int as quantidade,
                (date_trunc('day', now() - interval '5 months' + (random() * interval '150 days'))
                + time '08:00:00' 
                + (random() * interval '8 hours'))::timestamp as created_at
            FROM generate_series(1, 500)
            WHERE random() < 0.7

            UNION ALL

            SELECT
                CASE 
                    WHEN random() < 0.33 THEN '00000000-0000-0000-0000-000000000001'::uuid
                    WHEN random() < 0.66 THEN '00000000-0000-0000-0000-000000000007'::uuid
                    ELSE '00000000-0000-0000-0000-000000000008'::uuid
                END as item_id,
                CASE 
                    WHEN random() < 0.6 THEN 'saida'
                    WHEN random() < 0.9 THEN 'entrada'
                    ELSE 'ajuste'
                END as tipo_movimentacao,
                floor(random() * 3 + 1)::int as quantidade,
                (date_trunc('day', now() - interval '5 months' + (random() * interval '150 days'))
                + time '08:00:00' 
                + (random() * interval '8 hours'))::timestamp as created_at
            FROM generate_series(1, 200)
            WHERE random() < 0.2
        )
        INSERT INTO historico_estoque (
            item_id,
            tipo_movimentacao,
            quantidade,
            quantidade_verificada,
            motivo,
            observacoes,
            created_at
        )
        SELECT
            item_id,
            tipo_movimentacao,
            quantidade,
            quantidade as quantidade_verificada,
            CASE 
                WHEN tipo_movimentacao = 'saida' THEN 
                    CASE 
                        WHEN random() < 0.7 THEN 'uso'
                        ELSE 'perda'
                    END
                WHEN tipo_movimentacao = 'entrada' THEN
                    CASE 
                        WHEN random() < 0.7 THEN 'compra'
                        ELSE 'devolucao'
                    END
                ELSE 'inventario'
            END as motivo,
            'Movimentação de teste gerada automaticamente' as observacoes,
            created_at
        FROM movement_data
        ORDER BY created_at;
    END IF;
END$$; 