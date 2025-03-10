import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  try {
    console.log('=== INÍCIO DO PROCESSAMENTO DA API ===');
    
    const body = await request.json();
    console.log('Corpo da requisição recebido:', body);
    
    const { categories } = body;
    console.log('Categorias extraídas:', categories);

    if (!Array.isArray(categories)) {
      console.log('Erro: categories não é um array');
      return NextResponse.json(
        { error: "Categories deve ser um array" },
        { status: 400 }
      )
    }

    // Verifica se todas as categorias têm ID e order_index
    const invalidCategories = categories.filter(cat => !cat.id || !cat.order_index);
    if (invalidCategories.length > 0) {
      console.log('Categorias inválidas encontradas:', invalidCategories);
      return NextResponse.json(
        { 
          error: "Todas as categorias devem ter ID e order_index",
          invalidCategories
        },
        { status: 400 }
      )
    }

    // Pega a seção da primeira categoria
    const section = categories[0].section;
    console.log('Seção detectada:', section);

    // Prepara os dados para atualização
    const updateData = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      order_index: cat.order_index,
      section: cat.section
    }));
    console.log('Dados preparados para atualização:', updateData);

    // Atualiza todas as categorias de uma vez
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('categories')
      .upsert(updateData, { 
        onConflict: 'id',
        ignoreDuplicates: false
      });

    console.log('Resultado da atualização:', updateResult);
    
    if (updateError) {
      console.error('Erro do Supabase:', updateError);
      return NextResponse.json(
        { 
          error: updateError.message,
          details: updateError
        },
        { status: 500 }
      )
    }

    console.log('=== ATUALIZAÇÃO CONCLUÍDA COM SUCESSO ===');
    return NextResponse.json({ 
      message: "Ordem atualizada com sucesso",
      updates: categories
    })
  } catch (error) {
    console.error('=== ERRO NO PROCESSAMENTO DA API ===');
    console.error('Erro completo:', error);
    return NextResponse.json(
      { 
        error: "Erro ao atualizar ordem",
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 