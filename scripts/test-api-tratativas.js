/**
 * Script para testar as chamadas da API de tratativas em ambiente local
 * Execução: node scripts/test-api-tratativas.js
 */

// Importar fetch para Node.js (Node 18+ tem fetch nativo)
// Para versões mais antigas: npm install node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// URL base para ambiente local
const BASE_URL = 'http://localhost:3000/api/tratativa';

// Dados de teste para criar uma nova tratativa
const MOCK_TRATATIVA = {
  numero_tratativa: "T" + new Date().getTime(),
  funcionario: "Funcionário Teste",
  setor: "Setor Teste",
  lider: "Líder Teste",
  data_infracao: new Date().toISOString().split('T')[0],
  codigo_infracao: "C001",
  descricao_infracao: "Descrição de teste",
  penalidade: "P1 - Advertência",
  status: "ENVIADA",
  analista_nome: "Analista Teste",
  data_analista: new Date().toISOString().split('T')[0]
};

// Armazenar ID da tratativa criada para uso posterior
let tratativaId;

// Função auxiliar para exibir resultados
async function displayResponse(response, endpoint) {
  const contentType = response.headers.get("content-type");
  let result;
  
  try {
    if (contentType && contentType.indexOf("application/json") !== -1) {
      result = await response.json();
    } else {
      result = await response.text();
    }
  } catch (error) {
    result = "Erro ao processar resposta: " + error.message;
  }
  
  console.log(`\n===== ${endpoint} =====`);
  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log("Resposta:", typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  
  return result;
}

// Funções de teste para cada endpoint
async function testListarTratativas() {
  console.log("\n🔍 Testando LISTAR TRATATIVAS...");
  
  try {
    const response = await fetch(`${BASE_URL}/list`);
    const result = await displayResponse(response, "GET /list");
    
    if (response.ok) {
      console.log(`✅ Listagem OK! ${result.data?.length || 0} tratativas encontradas`);
    } else {
      console.log("❌ Falha na listagem de tratativas");
    }
    
    return response.ok;
  } catch (error) {
    console.error("❌ Erro:", error.message);
    return false;
  }
}

async function testListarTrativaSemPDF() {
  console.log("\n🔍 Testando LISTAR TRATATIVAS SEM PDF...");
  
  try {
    const response = await fetch(`${BASE_URL}/list-without-pdf`);
    const result = await displayResponse(response, "GET /list-without-pdf");
    
    if (response.ok) {
      console.log(`✅ Listagem OK! ${result.data?.length || 0} tratativas sem PDF encontradas`);
    } else {
      console.log("❌ Falha na listagem de tratativas sem PDF");
    }
    
    return response.ok;
  } catch (error) {
    console.error("❌ Erro:", error.message);
    return false;
  }
}

async function testCriarTratativa() {
  console.log("\n🔍 Testando CRIAR TRATATIVA...");
  
  try {
    const response = await fetch(`${BASE_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(MOCK_TRATATIVA),
    });
    
    const result = await displayResponse(response, "POST /create");
    
    if (response.ok && result.status === 'success') {
      tratativaId = result.id;
      console.log(`✅ Tratativa criada com sucesso! ID: ${tratativaId}`);
    } else {
      console.log("❌ Falha na criação de tratativa");
    }
    
    return response.ok;
  } catch (error) {
    console.error("❌ Erro:", error.message);
    return false;
  }
}

async function testGerarPDF() {
  if (!tratativaId) {
    console.log("\n⚠️ Ignorando teste de GERAR PDF: nenhuma tratativa criada anteriormente");
    return false;
  }
  
  console.log(`\n🔍 Testando GERAR PDF para tratativa ID ${tratativaId}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/pdftasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: tratativaId, folhaUnica: false }),
    });
    
    const result = await displayResponse(response, "POST /pdftasks");
    
    if (response.ok && result.status === 'success') {
      console.log(`✅ PDF gerado com sucesso! URL: ${result.url}`);
    } else {
      console.log("❌ Falha na geração de PDF");
    }
    
    return response.ok;
  } catch (error) {
    console.error("❌ Erro:", error.message);
    return false;
  }
}

async function testRegenerarPDF() {
  if (!tratativaId) {
    console.log("\n⚠️ Ignorando teste de REGENERAR PDF: nenhuma tratativa criada anteriormente");
    return false;
  }
  
  console.log(`\n🔍 Testando REGENERAR PDF para tratativa ID ${tratativaId}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/regenerate-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: tratativaId, folhaUnica: false, force: true }),
    });
    
    const result = await displayResponse(response, "POST /regenerate-pdf");
    
    if (response.ok && result.status === 'success') {
      console.log(`✅ PDF regenerado com sucesso! URL: ${result.url}`);
    } else {
      console.log("❌ Falha na regeneração de PDF");
    }
    
    return response.ok;
  } catch (error) {
    console.error("❌ Erro:", error.message);
    return false;
  }
}

async function testExcluirTratativa() {
  if (!tratativaId) {
    console.log("\n⚠️ Ignorando teste de EXCLUIR TRATATIVA: nenhuma tratativa criada anteriormente");
    return false;
  }
  
  console.log(`\n🔍 Testando EXCLUIR TRATATIVA com ID ${tratativaId}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/delete/${tratativaId}`, {
      method: "DELETE",
    });
    
    const result = await displayResponse(response, "DELETE /delete/:id");
    
    if (response.ok) {
      console.log(`✅ Tratativa excluída com sucesso!`);
    } else {
      console.log("❌ Falha na exclusão da tratativa");
    }
    
    return response.ok;
  } catch (error) {
    console.error("❌ Erro:", error.message);
    return false;
  }
}

// Executa todos os testes em sequência
async function runAllTests() {
  console.log("🚀 INICIANDO TESTES DE API PARA TRATATIVAS NO LOCALHOST");
  console.log("=======================================================");
  console.log(`URL base: ${BASE_URL}`);
  console.log("=======================================================\n");
  
  // Tentar listar tratativas para verificar se o servidor está respondendo
  const listagemOk = await testListarTratativas();
  if (!listagemOk) {
    console.error("\n❌ ERRO: Não foi possível conectar ao servidor. Verifique se a API está rodando em localhost:3000");
    return;
  }
  
  // Continuar com os outros testes
  await testListarTrativaSemPDF();
  
  // Criar uma tratativa de teste
  const criacaoOk = await testCriarTratativa();
  
  // Testes que dependem de uma tratativa criada
  if (criacaoOk) {
    await testGerarPDF();
    await testRegenerarPDF();
    await testExcluirTratativa();
  }
  
  console.log("\n=======================================================");
  console.log("✅ TESTES FINALIZADOS!");
  console.log("=======================================================");
}

// Iniciar os testes
runAllTests().catch(error => {
  console.error("Erro fatal nos testes:", error);
});
