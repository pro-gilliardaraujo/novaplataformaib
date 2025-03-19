-- Estes comandos devem ser executados fora de qualquer transação
-- e requerem privilégios de superusuário
-- Certifique-se de executar este arquivo separadamente

-- Define o timezone no nível do sistema PostgreSQL
ALTER SYSTEM SET timezone = 'America/Sao_Paulo';

-- Recarrega a configuração do PostgreSQL para aplicar as mudanças
SELECT pg_reload_conf();

-- Nota: Após executar estes comandos, é recomendado reiniciar o serviço do Supabase
-- para garantir que todas as conexões usem a nova configuração de timezone 