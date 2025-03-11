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

export async function DELETE() {
  try {
    console.log("[API] Iniciando encerramento de sessões")

    // Busca todos os usuários
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      console.error("[API] Erro ao buscar usuários:", usersError)
      throw usersError
    }

    console.log(`[API] Encontrados ${users.length} usuários`)

    // Para cada usuário, invalida todas as suas sessões
    for (const user of users) {
      console.log(`[API] Encerrando sessões do usuário ${user.email}`)
      
      const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(user.id)
      
      if (signOutError) {
        console.error(`[API] Erro ao encerrar sessões do usuário ${user.email}:`, signOutError)
        continue
      }
    }

    // Atualiza o campo firstLogin para true em todos os perfis
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ firstLogin: true })
      .neq("id", "00000000-0000-0000-0000-000000000000") // Evita atualizar registros com ID inválido

    if (updateError) {
      console.error("[API] Erro ao atualizar perfis:", updateError)
      throw updateError
    }

    console.log("[API] Encerramento de sessões concluído com sucesso")

    return NextResponse.json({
      message: "Todas as sessões foram encerradas com sucesso",
      usersAffected: users.length
    })
  } catch (error) {
    console.error("[API] Erro durante o encerramento de sessões:", error)
    return NextResponse.json(
      { error: "Erro ao encerrar sessões" },
      { status: 500 }
    )
  }
} 