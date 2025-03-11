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

export async function POST() {
  try {
    // Adiciona a coluna icon na tabela categories se ela não existir
    const { error } = await supabaseAdmin.from('categories').alter('icon', { type: 'text' })

    if (error) {
      console.error('Erro ao adicionar coluna:', error)
      return NextResponse.json(
        { error: "Erro ao atualizar banco de dados" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Banco de dados atualizado com sucesso"
    })
  } catch (error) {
    console.error('Erro durante atualização do banco:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
} 