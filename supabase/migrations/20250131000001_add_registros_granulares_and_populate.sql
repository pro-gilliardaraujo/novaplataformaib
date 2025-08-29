-- Migração para adicionar coluna registros_granulares e popular dados existentes
-- Data: 2025-01-31
-- Descrição: Adiciona coluna JSONB para armazenar UUIDs dos registros granulares 
--            que compõem cada registro agregado e popula dados existentes

-- 1. Adicionar a nova coluna
ALTER TABLE boletins_cav_agregado 
ADD COLUMN IF NOT EXISTS registros_granulares JSONB;

-- 2. Popular dados existentes usando lógica temporal e critérios de match
UPDATE boletins_cav_agregado 
SET registros_granulares = (
  SELECT jsonb_build_object(
    'uuids', 
    jsonb_agg(bc.id ORDER BY bc.created_at)
  )
  FROM boletins_cav bc
  WHERE 1=1
    -- Match por data, frente
    AND bc.data = boletins_cav_agregado.data
    AND bc.frente = boletins_cav_agregado.frente
    
    -- Match por codigo (ambos são TEXT)
    AND bc.codigo = boletins_cav_agregado.codigo
    
    -- Critério temporal: granulares criados ANTES do agregado, com max 2 segundos de diferença
    AND bc.created_at <= boletins_cav_agregado.created_at
    AND bc.created_at >= (boletins_cav_agregado.created_at - INTERVAL '2 seconds')
)
WHERE registros_granulares IS NULL;

-- 3. Verificar resultados - mostrar estatísticas
DO $$
DECLARE
    total_agregados INTEGER;
    agregados_com_granulares INTEGER;
    agregados_sem_granulares INTEGER;
BEGIN
    -- Contar totais
    SELECT COUNT(*) INTO total_agregados FROM boletins_cav_agregado;
    
    SELECT COUNT(*) INTO agregados_com_granulares 
    FROM boletins_cav_agregado 
    WHERE registros_granulares IS NOT NULL 
      AND registros_granulares ? 'uuids'
      AND jsonb_typeof(registros_granulares->'uuids') = 'array';
    
    SELECT COUNT(*) INTO agregados_sem_granulares 
    FROM boletins_cav_agregado 
    WHERE registros_granulares IS NULL 
       OR NOT (registros_granulares ? 'uuids')
       OR jsonb_typeof(registros_granulares->'uuids') != 'array';

    -- Log dos resultados
    RAISE NOTICE '=== RESULTADOS DA MIGRAÇÃO ===';
    RAISE NOTICE 'Total de registros agregados: %', total_agregados;
    RAISE NOTICE 'Agregados COM granulares vinculados: %', agregados_com_granulares;
    RAISE NOTICE 'Agregados SEM granulares vinculados: %', agregados_sem_granulares;
    
    IF agregados_sem_granulares > 0 THEN
        RAISE NOTICE 'ATENÇÃO: % registros agregados não foram vinculados!', agregados_sem_granulares;
    END IF;
END $$;

-- 4. Criar índice para melhorar performance nas consultas futuras
CREATE INDEX IF NOT EXISTS idx_boletins_cav_agregado_registros_granulares 
ON boletins_cav_agregado USING GIN (registros_granulares);

-- 5. Queries de verificação manual (comentadas, descomente para debug)
/*
-- Verificar alguns exemplos de vinculação
SELECT 
    bca.id as agregado_id,
    bca.data,
    bca.frente,
    bca.codigo as agregado_codigo,
    bca.created_at as agregado_created,
    bca.registros_granulares->'uuids' as uuids_granulares,
    jsonb_array_length(bca.registros_granulares->'uuids') as qtd_granulares
FROM boletins_cav_agregado bca
WHERE bca.registros_granulares IS NOT NULL
ORDER BY bca.created_at DESC
LIMIT 5;

-- Verificar registros granulares de um agregado específico
SELECT 
    bc.id,
    bc.frota,
    bc.turno,
    bc.operador,
    bc.producao,
    bc.created_at
FROM boletins_cav bc
WHERE bc.id = ANY(
    SELECT jsonb_array_elements_text(registros_granulares->'uuids')::uuid
    FROM boletins_cav_agregado 
    WHERE id = 'UUID_DO_AGREGADO_AQUI'
);
*/

-- Comentário final
COMMENT ON COLUMN boletins_cav_agregado.registros_granulares IS 
'JSONB contendo array de UUIDs dos registros granulares (boletins_cav) que compõem este registro agregado. Formato: {"uuids": ["uuid1", "uuid2", ...]}';
