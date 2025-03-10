"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"

export default function ErrorPage() {
  const router = useRouter()

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto" />
        <h1 className="text-2xl font-bold">Erro Inesperado</h1>
        <p className="text-gray-600">
          Ocorreu um erro ao processar sua solicitação.
        </p>
        <Button 
          onClick={() => router.push("/")}
          className="bg-black hover:bg-black/90"
        >
          Voltar para o Início
        </Button>
      </div>
    </div>
  )
} 