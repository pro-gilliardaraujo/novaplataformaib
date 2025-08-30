import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase com as credenciais do ambiente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Obter dados da requisição
    const reqData = await request.json();
    const { id, numero_tratativa, folhaUnica = false, force = false } = reqData;
    
    console.log('API Local: Recebida solicitação para regenerar PDF', { id, numero_tratativa, folhaUnica, force });
    
    if (!id && !numero_tratativa) {
      return NextResponse.json(
        { 
          status: "error",
          message: "É necessário fornecer ID ou número da tratativa" 
        },
        { status: 400 }
      );
    }
    
    // Registrar tempo de início para cálculo de performance
    const startTime = Date.now();
    
    // Buscar tratativa por ID ou número
    const query = supabase.from("tratativas").select("*");
    
    if (id) {
      query.eq("id", id);
    } else if (numero_tratativa) {
      query.eq("numero_tratativa", numero_tratativa);
    }
    
    const { data, error } = await query.single();
    
    if (error || !data) {
      console.error('Tratativa não encontrada:', error);
      return NextResponse.json(
        { 
          status: "error",
          message: "Tratativa não encontrada" 
        },
        { status: 404 }
      );
    }
    
    // Verificar se já existe documento e force não está habilitado
    const documentoExistente = folhaUnica ? data.documento_url_single : data.documento_url;
    if (documentoExistente && !force) {
      return NextResponse.json({
        status: "info",
        message: "Documento já existente. Use force=true para regenerar.",
        id: data.id,
        url: documentoExistente
      });
    }
    
    // Em um ambiente local, simularemos a regeneração do PDF
    // Em produção, aqui seria implementada a regeneração real do PDF
    
    // URL simulada do documento
    const mockUrl = `http://localhost:3000/api/mock-pdf/${data.id}?folhaUnica=${folhaUnica}&ts=${Date.now()}`;
    
    // Atualizar a tratativa com a URL do documento
    if (folhaUnica) {
      await supabase
        .from("tratativas")
        .update({ documento_url_single: mockUrl })
        .eq("id", data.id);
    } else {
      await supabase
        .from("tratativas")
        .update({ documento_url: mockUrl })
        .eq("id", data.id);
    }
    
    // Calcular tempo de processamento
    const processingTime = Date.now() - startTime;
    
    console.log(`API Local: PDF regenerado para tratativa ID: ${data.id}`);
    
    // Retornar no formato esperado pela documentação
    return NextResponse.json({
      status: "success",
      message: "Documento PDF gerado com sucesso",
      id: data.id,
      url: mockUrl,
      folhaUnica: folhaUnica,
      processingTime: `${processingTime}ms`
    });
  } catch (error) {
    console.error('Erro na regeneração de PDF:', error);
    return NextResponse.json(
      { 
        status: "error",
        message: 'Erro ao regenerar PDF', 
        details: String(error)
      },
      { status: 500 }
    );
  }
}
