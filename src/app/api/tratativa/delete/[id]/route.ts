import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase com as credenciais do ambiente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Log para depuração
    console.log('ID recebido para exclusão:', params.id);

    if (!params.id) {
      return NextResponse.json(
        { error: 'ID da tratativa não fornecido' },
        { status: 400 }
      );
    }

    // Verificar se a tratativa existe antes de excluir
    const { data: checkData, error: checkError } = await supabase
      .from("tratativas")
      .select("id")
      .eq("id", params.id)
      .single();

    if (checkError || !checkData) {
      console.error('Tratativa não encontrada:', checkError);
      return NextResponse.json(
        { error: 'Tratativa não encontrada' },
        { status: 404 }
      );
    }

    // Excluir a tratativa
    const { error } = await supabase
      .from("tratativas")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error('Erro ao excluir tratativa:', error);
      throw error;
    }

    console.log('Tratativa excluída com sucesso, ID:', params.id);

    return NextResponse.json(
      { success: true, message: 'Tratativa excluída com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir tratativa:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir tratativa', details: String(error) },
      { status: 500 }
    );
  }
} 