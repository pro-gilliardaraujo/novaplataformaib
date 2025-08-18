import { NextResponse } from 'next/server';

// Esta rota simplesmente retorna um 200 OK para qualquer requisição
// Usado para silenciar chamadas indesejadas ao servidor
export async function GET() {
  return NextResponse.json({ success: true }, { status: 200 });
}

export async function POST() {
  return NextResponse.json({ success: true }, { status: 200 });
} 