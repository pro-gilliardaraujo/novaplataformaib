import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json()

    // Primeiro verifica a senha atual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      return NextResponse.json(
        { error: "Senha atual incorreta" },
        { status: 400 }
      )
    }

    // Atualiza a senha usando o cliente admin
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao alterar senha:", error)
    return NextResponse.json(
      { error: "Erro ao alterar senha" },
      { status: 500 }
    )
  }
} 