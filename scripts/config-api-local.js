/**
 * Script para alternar entre ambiente local e de produção para API de tratativas
 * Execução: node scripts/config-api-local.js [local|prod]
 * 
 * - Para configurar para ambiente local: node scripts/config-api-local.js local
 * - Para configurar para ambiente de produção: node scripts/config-api-local.js prod
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configurações
const PROD_URL = 'http://iblogistica.ddns.net:3000/api/tratativa';
const LOCAL_URL = 'http://localhost:3000/api/tratativa';

// Arquivos a serem verificados
const FILES = [
  'src/components/nova-tratativa-modal.tsx',
  'src/components/tratativa-details-modal.tsx',
  'src/components/tratativas/TratativasSemDocumento.tsx',
  'src/components/editar-tratativa-modal.tsx',
  'src/app/gerenciamento/tratativas/page.tsx',
  'src/app/gerenciamento/tratativas/lista/page.tsx',
  'src/app/gerenciamento/tratativas/dashboard/page.tsx',
  'src/components/template-editar-modal.tsx',
  'src/components/tratativas/dashboard/quick-access.tsx'
];

// Verificar argumentos
const args = process.argv.slice(2);
const mode = args[0]?.toLowerCase();

if (!mode || (mode !== 'local' && mode !== 'prod')) {
  console.error(`
  ❌ Modo inválido ou não especificado.
  
  Uso: node scripts/config-api-local.js [local|prod]
  
  - local: Configura a API para usar localhost:3000
  - prod: Configura a API para usar iblogistica.ddns.net:3000
  `);
  process.exit(1);
}

// Inicializar estatísticas
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  replacementsCount: 0
};

// Função para substituir URLs em um arquivo
function processFile(filePath, fromUrl, toUrl) {
  console.log(`Processando ${filePath}...`);
  
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️ Arquivo não encontrado`);
      return;
    }
    
    // Ler o conteúdo do arquivo
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Contar ocorrências
    const regex = new RegExp(escapeRegExp(fromUrl), 'g');
    const matches = content.match(regex);
    
    if (!matches) {
      console.log(`  ℹ️ Nenhuma ocorrência de "${fromUrl}" encontrada`);
      return;
    }
    
    // Substituir URLs
    const newContent = content.replace(regex, toUrl);
    
    // Verificar se houve mudanças
    if (content === newContent) {
      console.log(`  ℹ️ Nenhuma alteração necessária`);
      return;
    }
    
    // Salvar o arquivo
    fs.writeFileSync(filePath, newContent, 'utf8');
    
    // Atualizar estatísticas
    stats.filesModified++;
    stats.replacementsCount += matches.length;
    
    console.log(`  ✅ ${matches.length} ocorrências substituídas de "${fromUrl}" para "${toUrl}"`);
  } catch (error) {
    console.error(`  ❌ Erro ao processar ${filePath}:`, error.message);
  }
  
  stats.filesProcessed++;
}

// Função auxiliar para escapar caracteres especiais em string para regex
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Executar o processamento
console.log(`\n🔄 Configurando ambiente para ${mode.toUpperCase()}...`);

const fromUrl = mode === 'local' ? PROD_URL : LOCAL_URL;
const toUrl = mode === 'local' ? LOCAL_URL : PROD_URL;

console.log(`\nSubstituindo "${fromUrl}" por "${toUrl}" em todos os arquivos...\n`);

FILES.forEach(file => {
  processFile(file, fromUrl, toUrl);
});

// Exibir estatísticas
console.log(`\n📊 Estatísticas:`);
console.log(`  - Arquivos processados: ${stats.filesProcessed}`);
console.log(`  - Arquivos modificados: ${stats.filesModified}`);
console.log(`  - Total de substituições: ${stats.replacementsCount}`);

// Sugerir próximos passos
console.log(`\n🚀 Ambiente configurado para ${mode.toUpperCase()}!`);

if (mode === 'local') {
  console.log(`
  📝 Próximos passos:
  
  1. Verifique se seu servidor local está rodando:
     npm run dev
     
  2. Execute os testes de API:
     node scripts/test-api-tratativas.js
  `);
} else {
  console.log(`
  📝 Próximos passos:
  
  1. Seu aplicativo agora está configurado para usar a API de produção
  2. Reinicie seu servidor de desenvolvimento se estiver rodando
  `);
}
