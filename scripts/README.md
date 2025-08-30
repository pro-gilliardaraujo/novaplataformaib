# Scripts para Testes de API de Tratativas

Este diretório contém scripts para auxiliar no teste e configuração da API de tratativas.

## Scripts Disponíveis

### 1. `test-api-tratativas.js`

Script para testar todas as chamadas da API de tratativas no ambiente local.

**Funcionalidades:**
- Testa todos os endpoints da API de tratativas
- Cria, lista, gera PDFs e exclui tratativas para verificar o funcionamento
- Exibe respostas detalhadas de cada chamada

**Como usar:**
```bash
node scripts/test-api-tratativas.js
```

**Requisitos:**
- Node.js v18+ (tem fetch nativo)
- Servidor API rodando em localhost:3000

### 2. `config-api-local.js`

Script para alternar as chamadas de API entre ambiente local e de produção.

**Funcionalidades:**
- Altera todas as URLs de API nos arquivos do projeto
- Configura para ambiente local (localhost) ou produção (iblogistica.ddns.net)

**Como usar:**

Para configurar para ambiente local:
```bash
node scripts/config-api-local.js local
```

Para configurar para ambiente de produção:
```bash
node scripts/config-api-local.js prod
```

## Fluxo de Trabalho Recomendado

1. Inicie o servidor de desenvolvimento local
   ```bash
   npm run dev
   ```

2. Configure o aplicativo para usar a API local
   ```bash
   node scripts/config-api-local.js local
   ```

3. Execute os testes de API para verificar o funcionamento
   ```bash
   node scripts/test-api-tratativas.js
   ```

4. Quando terminar os testes, reconfigure para produção
   ```bash
   node scripts/config-api-local.js prod
   ```

## Observações

- Os testes criam registros temporários no banco de dados que são excluídos ao final do processo
- Certifique-se de que seu servidor local está rodando antes de executar os testes
- O script de teste imprime informações detalhadas sobre cada chamada para auxiliar na depuração
