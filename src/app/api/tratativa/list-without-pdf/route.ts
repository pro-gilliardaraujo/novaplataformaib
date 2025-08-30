import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase com as credenciais do ambiente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('API Local: Buscando tratativas sem documento PDF');
    
    // Obter tratativas do banco de dados que não possuem documento PDF
    // Isso é uma simplificação - em produção, haveria uma lógica mais complexa
    // para verificar documentos no storage
    const { data, error } = await supabase
      .from("tratativas")
      .select("*")
      .is("documento_url", null)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar tratativas sem PDF:', error);
      throw error;
    }
    
    console.log(`API Local: ${data?.length || 0} tratativas sem PDF encontradas`);
    
    // Retornar no formato esperado pela documentação
    return NextResponse.json({
      status: "success",
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Erro na API de listagem sem PDF:', error);
    return NextResponse.json(
      { 
        status: "error",
        message: 'Erro ao buscar tratativas sem PDF', 
        details: String(error)
      },
      { status: 500 }
    );
  }
}
