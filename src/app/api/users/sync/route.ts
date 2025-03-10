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
    // Busca todos os usuários do auth
    const { data: authUsers, error: authError } = await supabaseAdmin
      .auth.admin.listUsers()

    if (authError) {
      console.error("Erro ao buscar usuários do auth:", authError)
      return NextResponse.json(
        { error: "Erro ao buscar usuários" },
        { status: 500 }
      )
    }

    // Busca todos os perfis
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id")

    if (profilesError) {
      console.error("Erro ao buscar perfis:", profilesError)
      return NextResponse.json(
        { error: "Erro ao buscar perfis" },
        { status: 500 }
      )
    }

    // Encontra usuários que existem no auth mas não têm perfil
    const profileUserIds = new Set(profiles.map(p => p.user_id))
    const orphanedUsers = authUsers.users.filter(user => !profileUserIds.has(user.id))

    // Remove usuários órfãos
    for (const user of orphanedUsers) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      if (deleteError) {
        console.error(`Erro ao deletar usuário ${user.id}:`, deleteError)
      }
    }

    return NextResponse.json({
      message: "Sincronização concluída",
      deletedUsers: orphanedUsers.length
    })
  } catch (error) {
    console.error("Erro durante a sincronização:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
} 