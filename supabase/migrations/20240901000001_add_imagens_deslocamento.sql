-- Adicionar coluna para múltiplas imagens de deslocamento
alter table diario_cav 
add column if not exists imagens_deslocamento text[];

-- Comentário explicativo
comment on column diario_cav.imagens_deslocamento is 'Array de URLs das imagens de deslocamento (suporte a múltiplas imagens)';
