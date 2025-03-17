# Padrões de Interface - Nova Plataforma IB

## Layout de Páginas

### Estrutura Geral
- Todas as páginas devem usar o componente `Tabs` com duas abas:
  1. "Visão Geral"
  2. "Lista Detalhada"
- Não deve haver título na página
- O layout deve ser flexível para ocupar toda a altura disponível

### Cabeçalho das Abas
- Usar `TabsList` com fundo transparente e borda inferior
- Triggers devem ter:
  - Padding: px-4 pb-3 pt-2
  - Fonte: semibold, text-muted-foreground
  - Hover: text-foreground
  - Estado ativo: border-b-black text-foreground

## Tabelas

### Cabeçalho da Tabela
- Altura fixa de 47px para todas as linhas da tabela
- Fundo preto com texto branco
- Cada coluna deve ter:
  1. Título da coluna
  2. Botão de ordenação (ícone de setas para cima/baixo)
  3. Botão de filtro (ícone de funil)
- A ordenação é ativada clicando no título ou no ícone de setas
- O filtro abre um dropdown com opções de busca e seleção múltipla

### Cabeçalho da Lista
- Deve conter em uma única linha:
  1. Barra de busca à esquerda (max-w-[400px])
  2. Botão de ação principal à direita (ex: "Nova Retirada")
- Botão de ação deve ter:
  - Fundo preto (bg-black)
  - Hover: bg-black/90
  - Texto branco
  - Ícone à esquerda do texto

### Ações em Tabelas
- Todas as tabelas devem ter apenas um botão de ação: "Detalhes" (ícone de olho)
- Este botão deve estar centralizado na coluna de ações
- Este botão abre um modal com os detalhes completos do item
- Não deve haver botões de edição diretamente na tabela
- Todas as ações de edição devem estar dentro do modal de detalhes

### Modal de Detalhes
O modal de detalhes deve seguir o seguinte padrão:

1. **Cabeçalho**
   - Título "Detalhes do [Item]"
   - Barra de ações no topo direito contendo todos os botões de ação disponíveis:
     - Download (quando aplicável)
     - Editar
     - Excluir
     - Fechar
   - Todos os botões de ação devem ter:
     - Variante "outline"
     - Tamanho "sm" (h-8 w-8)
     - Sombra e borda arredondada (rounded-md shadow-sm)
     - Ícone centralizado (h-4 w-4)

2. **Conteúdo**
   - Informações organizadas em seções lógicas
   - Campos somente leitura
   - Botões de ação específicos do contexto (ex: "Registrar Movimentação" para itens de estoque)

3. **Ações Específicas**
   - Botões de ação específicos devem estar em local apropriado dentro do conteúdo
   - Ações que alteram dados devem abrir modais próprios
   - Confirmações destrutivas (ex: exclusão) devem usar AlertDialog

### Table Row Height
- All table rows (including header, data rows, and empty rows) must have a fixed height of 47px using the class `h-[47px]`
- This applies to both regular and empty rows used for maintaining consistent table height
- Table cells should use `py-0` to ensure the row height is maintained

### Table Headers
- Each column header must include:
  1. Column title (text-white font-medium)
  2. Sort button (ArrowUpDown icon, h-7 w-7 ghost variant)
  3. Filter button (Filter icon, h-7 w-7 ghost variant)
- Sort and filter buttons should be aligned in a row with gap-1
- Filter dropdown should include:
  - Search input for options
  - Checkbox list for multiple selection
  - Clear button and selection count
  - Width: w-80
  - Padding: p-4

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