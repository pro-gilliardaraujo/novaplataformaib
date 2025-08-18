import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Obter o formulário enviado pelo frontend
    const formData = await request.formData();
    
    // URL da API do backend
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    
    // Criar nova formData para enviar ao backend (mantendo todos os campos originais)
    const backendFormData = new FormData();
    
    // Transferir todos os campos do formData original
    for (const [key, value] of formData.entries()) {
      backendFormData.append(key, value);
    }
    
    console.log(`⏩ Enviando dados para processamento no backend: ${backendUrl}/api/v1/relatorios/process_and_save`);
    
    // Enviar para o backend
    const response = await fetch(`${backendUrl}/api/v1/relatorios/process_and_save`, {
      method: 'POST',
      body: backendFormData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro do backend [${response.status}]: ${errorText}`);
      
      try {
        const errorData = JSON.parse(errorText);
        return NextResponse.json({ 
          detail: errorData.detail || 'Erro ao processar dados no backend'
        }, { status: response.status });
      } catch {
        return NextResponse.json({ 
          detail: `Erro do backend: ${errorText || response.statusText}`
        }, { status: response.status });
      }
    }
    
    // Apenas repassar a resposta do backend para o frontend
    const result = await response.json();
    console.log('✅ Dados processados pelo backend com sucesso');
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ 
      detail: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 });
  }
} 