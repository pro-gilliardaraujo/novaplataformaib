import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { UpdateUsuarioData } from "@/types/user"

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
    const { userId, updates } = await request.json()

    if (!userId || !updates) {
      return NextResponse.json(
        { error: "ID do usuário e atualizações são obrigatórios" },
        { status: 400 }
      )
    }

    // Atualiza o perfil do usuário
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("user_id", userId)

    if (profileError) {
      console.error("Erro ao atualizar perfil:", profileError)
      return NextResponse.json(
        { error: "Erro ao atualizar usuário" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro na rota de atualização:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
} 