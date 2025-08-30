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
    const tratativaData = await request.json();
    
    console.log('API Local: Recebida solicitação para criar tratativa', tratativaData);
    
    // Registrar tempo de início para cálculo de performance
    const startTime = Date.now();
    
    // Inserir no banco de dados
    const { data, error } = await supabase
      .from("tratativas")
      .insert([tratativaData])
      .select();
    
    if (error) {
      console.error('Erro ao criar tratativa:', error);
      throw error;
    }
    
    const id = data?.[0]?.id;
    console.log(`API Local: Tratativa criada com ID: ${id}`);
    
    // Calcular tempo de processamento
    const processingTime = Date.now() - startTime;
    
    // Retornar no formato esperado pela documentação
    return NextResponse.json({
      status: "success",
      message: "Tratativa criada com sucesso",
      id: id,
      processingTime: `${processingTime}ms`
    });
  } catch (error) {
    console.error('Erro na API de criação:', error);
    return NextResponse.json(
      { 
        status: "error",
        message: 'Erro ao criar tratativa', 
        details: String(error)
      },
      { status: 500 }
    );
  }
}
