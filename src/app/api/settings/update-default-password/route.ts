import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  try {
    const { newPassword } = await request.json()

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Senha inválida. A senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      )
    }

    // Aqui você pode adicionar a lógica para salvar a nova senha padrão
    // Por exemplo, salvando em uma tabela de configurações no Supabase
    const { error } = await supabaseAdmin
      .from("system_settings")
      .upsert(
        { 
          key: "default_password", 
          value: newPassword 
        },
        { onConflict: "key" }
      )

    if (error) {
      console.error("Erro ao atualizar senha padrão:", error)
      return NextResponse.json(
        { error: "Erro ao atualizar senha padrão" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Senha padrão atualizada com sucesso"
    })
  } catch (error) {
    console.error("Erro ao atualizar senha padrão:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
} 