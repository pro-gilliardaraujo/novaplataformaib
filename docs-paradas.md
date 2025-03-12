# Módulo de Paradas - Planejamento

## 1. Estrutura de Arquivos
```
app/(authenticated)/gerenciamento/paradas/
├── cadastros/
│   ├── page.tsx                 # Página de cadastro de frotas
│   ├── columns.tsx              # Definição das colunas da tabela
│   └── create-edit-modal.tsx    # Modal de criação/edição de frotas
└── paradas/
    ├── page.tsx                 # Página principal de paradas
    ├── frota-card.tsx          # Componente de card da frota
    ├── registrar-parada-modal.tsx  # Modal para registrar/liberar parada
    └── atualizar-cenarios-modal.tsx # Modal para atualizar cenários
```

## 2. Banco de Dados (Supabase)

### Tabelas
- `paradas_frotas`
  - id (uuid)
  - codigo (text)
  - modelo (text)
  - unidade_id (uuid, ref: unidades.id)
  - tipo (text) ['Transbordo', 'Colhedora', 'Plantadeira']
  - ativo (boolean)
  - created_at (timestamp)
  - updated_at (timestamp)

- `paradas_tipos`
  - id (uuid)
  - nome (text)
  - ativo (boolean)
  - created_at (timestamp)
  - updated_at (timestamp)

- `paradas_registros`
  - id (uuid)
  - frota_id (uuid, ref: paradas_frotas.id)
  - tipo_id (uuid, ref: paradas_tipos.id)
  - horario_inicio (timestamp)
  - horario_fim (timestamp)
  - previsao_minutos (integer)
  - motivo (text)
  - created_at (timestamp)
  - updated_at (timestamp)

- `paradas_cenario_diario`
  - id (uuid)
  - frota_id (uuid, ref: paradas_frotas.id)
  - data (date)
  - created_at (timestamp)
  - updated_at (timestamp)

## 3. Funcionalidades

### 3.1 Cadastro de Frotas
- CRUD completo de frotas
- Filtros por:
  - Código/Modelo (busca textual)
  - Unidade (select)
  - Tipo (select)
- Campos do formulário:
  - Código (obrigatório)
  - Modelo (obrigatório)
  - Unidade (obrigatório)
  - Tipo (obrigatório)

### 3.2 Gestão de Paradas
- Visualização em cards
- Filtros por:
  - Código/Modelo (busca textual)
  - Unidade (select)
  - Tipo (select)
- Status visual:
  - Verde: Em operação
  - Vermelho: Parado
- Informações do card:
  - Código e modelo da frota
  - Status atual
  - Unidade e tipo
  - Se parado:
    - Motivo da parada
    - Tempo parado
    - Previsão de liberação
  - Histórico das últimas 5 paradas

### 3.3 Registro de Paradas
- Modal com formulário
- Se registrando parada:
  - Tipo de parada (select)
  - Previsão em minutos
  - Motivo (textarea)
- Se liberando:
  - Apenas confirmação

### 3.4 Atualização de Cenários
- Modal com lista de frotas
- Filtros por:
  - Código/Modelo (busca textual)
  - Unidade (select)
  - Tipo (select)
- Seleção múltipla de frotas
- Botão "Selecionar Todos"
- Atualização em lote

## 4. Regras de Negócio
1. Uma frota só pode ter uma parada ativa por vez
2. Ao liberar uma frota, registrar o horário_fim
3. Ao registrar nova parada, verificar se não existe parada ativa
4. Cenários são atualizados por data (um registro por frota/dia)
5. Apenas frotas ativas podem ser visualizadas/editadas

## 5. Melhorias Futuras
- [ ] Relatórios de paradas por período
- [ ] Dashboard com indicadores
- [ ] Notificações de atrasos
- [ ] Integração com outros módulos
- [ ] Exportação de dados
- [ ] Histórico completo de paradas 