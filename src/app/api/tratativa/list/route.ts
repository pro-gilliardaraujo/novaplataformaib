import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase com as credenciais do ambiente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('API Local: Buscando lista de tratativas');
    
    // Obter tratativas do banco de dados
    const { data, error } = await supabase
      .from("tratativas")
      .select("*")
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar tratativas:', error);
      throw error;
    }
    
    console.log(`API Local: ${data?.length || 0} tratativas encontradas`);
    
    // Retornar no formato esperado pela documentação
    return NextResponse.json({
      status: "success",
      data: data || []
    });
  } catch (error) {
    console.error('Erro na API de listagem:', error);
    return NextResponse.json(
      { 
        status: "error",
        message: 'Erro ao buscar tratativas', 
        details: String(error)
      },
      { status: 500 }
    );
  }
}
