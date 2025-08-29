-- Script de teste para verificar se a coluna registros_granulares existe
-- Execute este script para verificar se a migração foi aplicada

-- Verificar se a coluna existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'boletins_cav_agregado' 
  AND column_name = 'registros_granulares';

-- Se retornar resultado vazio, a coluna não existe e a migração precisa ser aplicada
