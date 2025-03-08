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

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("system_settings")
      .select("value")
      .eq("key", "default_password")
      .single()

    if (error) {
      console.error("Erro ao buscar senha padrão:", error)
      return NextResponse.json(
        { error: "Erro ao buscar senha padrão" },
        { status: 500 }
      )
    }

    // Se não encontrar configuração, retorna a senha padrão inicial
    const defaultPassword = data?.value || "ib2025"

    return NextResponse.json({
      defaultPassword
    })
  } catch (error) {
    console.error("Erro ao buscar senha padrão:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
} 