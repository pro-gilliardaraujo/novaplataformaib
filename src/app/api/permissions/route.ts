import { NextResponse } from "next/server"
import { permissionService } from "@/services/permissionService"
import { createClient } from "@supabase/supabase-js"

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      )
    }

    const permissions = await permissionService.getUserPermissions(userId)
    return NextResponse.json(permissions)
  } catch (error) {
    console.error('Erro ao buscar permissões:', error)
    return NextResponse.json(
      { error: "Erro ao buscar permissões" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, isAdmin, permissions } = body

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      )
    }

    // Se for uma inicialização de permissões
    if (isAdmin !== undefined) {
      await permissionService.initializeUserPermissions(userId, isAdmin)
      return NextResponse.json({ message: "Permissões inicializadas com sucesso" })
    }

    // Se for uma atualização de permissões
    if (permissions) {
      await permissionService.updateMultiplePermissions(userId, permissions)
      return NextResponse.json({ message: "Permissões atualizadas com sucesso" })
    }

    return NextResponse.json(
      { error: "Operação inválida" },
      { status: 400 }
    )
  } catch (error) {
    console.error('Erro ao atualizar permissões:', error)
    return NextResponse.json(
      { error: "Erro ao atualizar permissões" },
      { status: 500 }
    )
  }
} 