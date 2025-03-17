# Padrões de Interface - Nova Plataforma IB

## Ações em Tabelas

### Botão de Detalhes
- Todas as tabelas devem ter apenas um botão de ação: "Detalhes" (ícone de olho)
- Este botão deve estar centralizado na coluna de ações
- Este botão abre um modal com os detalhes completos do item
- O modal de detalhes contém todas as ações possíveis para aquele item

### Cabeçalho da Tabela
- Altura fixa de 47px para todas as linhas da tabela
- Fundo preto com texto branco
- Cada coluna deve ter:
  1. Título da coluna
  2. Botão de ordenação (ícone de setas para cima/baixo)
  3. Botão de filtro (ícone de funil)
- A ordenação é ativada clicando no título ou no ícone de setas
- O filtro abre um dropdown com opções de busca e seleção múltipla

### Modal de Detalhes
O modal de detalhes deve seguir o seguinte padrão:

1. **Cabeçalho**
   - Título "Detalhes do [Item]"
   - Barra de ações no topo direito contendo todos os botões de ação disponíveis:
     - Download (quando aplicável)
     - Editar
     - Excluir
     - Fechar

2. **Conteúdo**
   - Informações organizadas em seções lógicas
   - Campos somente leitura
   - Botões de ação específicos do contexto (ex: "Registrar Movimentação" para itens de estoque)

3. **Ações Específicas**
   - Botões de ação específicos devem estar em local apropriado dentro do conteúdo
   - Ações que alteram dados devem abrir modais próprios
   - Confirmações destrutivas (ex: exclusão) devem usar AlertDialog

## Lista de Páginas para Atualização

### Gerenciamento
#### Estoque
- [x] Inventário Atual
- [ ] Movimentações
- [ ] Categorias de Item

#### Paradas
- [ ] Cadastros de Paradas
- [ ] Programação
- [x] Tratativas

#### Equipamentos
- [ ] Cadastro de Equipamentos
- [ ] Manutenções
- [ ] Componentes

#### Usuários
- [ ] Cadastro de Usuários
- [ ] Permissões
- [ ] Grupos

### Relatórios
#### Estoque
- [ ] Inventário Atual
- [ ] Movimentações
- [ ] Análise de Consumo

#### Paradas
- [ ] Histórico de Paradas
- [ ] Análise de Causas
- [ ] Indicadores

#### Equipamentos
- [ ] Status de Manutenções
- [ ] Histórico de Intervenções
- [ ] Indicadores de Desempenho 