import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json()

    // Busca o usuário pelo email
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("user_id, firstLogin")
      .eq("user_email", email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    if (!userData.firstLogin) {
      return NextResponse.json(
        { error: "Este não é um primeiro acesso" },
        { status: 400 }
      )
    }

    // Atualiza a senha usando o cliente admin
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.user_id,
      { password: newPassword }
    )

    if (updateError) {
      throw updateError
    }

    // Atualiza o firstLogin para false
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ firstLogin: false })
      .eq("user_email", email)

    if (profileError) {
      throw profileError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao processar primeiro acesso:", error)
    return NextResponse.json(
      { error: "Erro ao processar primeiro acesso" },
      { status: 500 }
    )
  }
} 