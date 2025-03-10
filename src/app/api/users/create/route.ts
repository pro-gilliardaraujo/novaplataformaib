import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { NovoUsuarioData } from "@/types/user"
import { normalizeText } from "@/utils/formatters"

// Verificação das variáveis de ambiente
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
    const { nome, cargo, tipo_usuario, permissions } = data as NovoUsuarioData

    if (!nome || tipo_usuario === undefined) {
      return NextResponse.json(
        { error: "Nome e tipo de usuário são obrigatórios" },
        { status: 400 }
      )
    }

    const email = generateEmail(nome)

    // Verifica se o usuário já existe
    const { data: existingProfile, error: searchError } = await supabaseAdmin
      .from("profiles")
      .select("user_email")
      .eq("user_email", email)
      .single()

    if (searchError && searchError.code !== "PGRST116") { // Ignora erro "não encontrado"
      console.error("Erro ao buscar usuário:", searchError)
      return NextResponse.json(
        { error: "Erro ao verificar usuário existente" },
        { status: 500 }
      )
    }

    if (existingProfile) {
      return NextResponse.json(
        { error: `Já existe um usuário com o email ${email}` },
        { status: 400 }
      )
    }

    // Cria o usuário no auth.users com a senha padrão
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: "IB@2024",
      email_confirm: true,
    })

    if (authError) {
      console.error("Erro ao criar usuário no auth:", authError)
      return NextResponse.json(
        { error: "Erro ao criar usuário" },
        { status: 500 }
      )
    }

    if (!user) {
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
        user_id: user.id,
        nome,
        cargo,
        adminProfile: tipo_usuario,
        firstLogin: true,
        user_email: email,
      })

    if (profileError) {
      console.error("Erro ao criar perfil:", profileError)
      // Tenta deletar o usuário do auth se o perfil falhar
      await supabaseAdmin.auth.admin.deleteUser(user.id)
      return NextResponse.json(
        { error: "Erro ao criar perfil do usuário" },
        { status: 500 }
      )
    }

    // Se houver permissões definidas e não for admin, insere as permissões
    if (permissions && !tipo_usuario) {
      console.log("Inserindo permissões:", permissions)

      // Primeiro, verifica se a tabela user_page_permissions existe e sua estrutura
      const { error: tableError } = await supabaseAdmin
        .from("user_page_permissions")
        .select()
        .limit(1)

      if (tableError) {
        console.error("Erro ao verificar tabela de permissões:", tableError)
        return NextResponse.json(
          { error: "Erro ao verificar tabela de permissões" },
          { status: 500 }
        )
      }

      // Prepara os dados para inserção
      const permissionsData = permissions.map(permission => ({
        user_id: user.id,
        page_id: permission.page_id,
        can_access: permission.can_access
      }))

      console.log("Dados de permissões preparados:", permissionsData)

      // Insere as permissões
      const { error: permissionsError } = await supabaseAdmin
        .from("user_page_permissions")
        .insert(permissionsData)

      if (permissionsError) {
        console.error("Erro detalhado ao criar permissões:", permissionsError)
        // Tenta deletar o usuário e o perfil se as permissões falharem
        await supabaseAdmin.auth.admin.deleteUser(user.id)
        return NextResponse.json(
          { 
            error: "Erro ao criar permissões do usuário",
            details: permissionsError
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      message: "Usuário criado com sucesso",
      user: {
        id: user.id,
        email: user.email,
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