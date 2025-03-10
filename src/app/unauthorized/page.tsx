import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Acesso Negado</h1>
        <p className="text-lg text-gray-600">
          Você não tem permissão para acessar este recurso.
        </p>
        <Button asChild>
          <Link href="/">Voltar para o início</Link>
        </Button>
      </div>
    </div>
  )
} 