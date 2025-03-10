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
    const { userId, permissions, profile } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      )
    }

    // Se houver atualizações de perfil, atualiza primeiro
    if (profile) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update(profile)
        .eq("user_id", userId)

      if (profileError) throw profileError
    }

    // Se houver permissões para atualizar
    if (permissions) {
      const { error: permissionsError } = await supabaseAdmin
        .from("user_page_permissions")
        .upsert(
          permissions.map((p: any) => ({
            user_id: userId,
            page_id: p.page_id,
            can_access: p.can_access
          })),
          { onConflict: 'user_id,page_id' }
        )

      if (permissionsError) throw permissionsError
    }

    return NextResponse.json({ message: "Atualizações realizadas com sucesso" })
  } catch (error) {
    console.error('Erro ao atualizar permissões:', error)
    return NextResponse.json(
      { error: "Erro ao atualizar permissões" },
      { status: 500 }
    )
  }
} 