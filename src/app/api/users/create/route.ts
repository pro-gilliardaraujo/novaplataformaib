import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { NovoUsuarioData } from "@/types/user"
import { normalizeText } from "@/utils/formatters"

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

const DEFAULT_PASSWORD = "ib2025"

function generateEmail(nome: string): string {
  const normalizedName = normalizeText(nome)
  const [firstName, ...rest] = normalizedName.split(" ")
  const lastName = rest.length > 0 ? rest[rest.length - 1] : ""
  return `${firstName}${lastName ? "." + lastName : ""}@ib.logistica`
}

async function getDefaultPassword(): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin
      .from("system_settings")
      .select("value")
      .eq("key", "default_password")
      .single()

    if (error) {
      console.error("Erro ao buscar senha padrão:", error)
      return DEFAULT_PASSWORD
    }

    return data?.value || DEFAULT_PASSWORD
  } catch (error) {
    console.error("Erro ao buscar senha padrão:", error)
    return DEFAULT_PASSWORD
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { nome, cargo, tipo_usuario } = data as NovoUsuarioData

    if (!nome || tipo_usuario === undefined) {
      return NextResponse.json(
        { error: "Nome e tipo de usuário são obrigatórios" },
        { status: 400 }
      )
    }

    const email = generateEmail(nome)
    const password = await getDefaultPassword()

    // Cria o usuário no auth.users com a senha padrão
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error("Erro ao criar usuário no auth:", authError)
      return NextResponse.json(
        { error: "Erro ao criar usuário" },
        { status: 500 }
      )
    }

    if (!authData.user) {
      console.error("Usuário não foi criado no auth")
      return NextResponse.json(
        { error: "Erro ao criar usuário" },
        { status: 500 }
      )
    }

    // Cria o perfil do usuário
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: authData.user.id,
        nome,
        cargo,
        adminProfile: tipo_usuario,
        firstLogin: true,
        user_email: email,
      })

    if (profileError) {
      console.error("Erro ao criar perfil:", profileError)
      // Tenta deletar o usuário do auth se o perfil falhar
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: "Erro ao criar perfil do usuário" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Usuário criado com sucesso",
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    })
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
} 