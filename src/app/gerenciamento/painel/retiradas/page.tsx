"use client"

import { useState, useEffect } from "react"
import { RetiradaTable } from "@/components/retiradas-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { type Retirada } from "./columns"

// Temporary data for development
const data: Retirada[] = [
  {
    id: "1",
    codigo_patrimonio: "NB001",
    retirado_por: "João Silva",
    data_retirada: "2024-03-20",
    frota_instalada: "FROTA-001",
    entregue_por: "Carlos Santos",
    observacoes: "Equipamento para trabalho remoto",
    status: "Pendente",
    data_devolucao: null,
    devolvido_por: null,
    recebido_por: null
  },
  {
    id: "2",
    codigo_patrimonio: "MN002",
    retirado_por: "Maria Santos",
    data_retirada: "2024-03-15",
    frota_instalada: "FROTA-002",
    entregue_por: "Pedro Lima",
    observacoes: "Monitor para home office",
    status: "Devolvido",
    data_devolucao: "2024-03-18",
    devolvido_por: "Maria Santos",
    recebido_por: "Pedro Lima"
  },
]

export default function RetiradasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="h-screen flex flex-col p-4 bg-white">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-3 bg-white">
        <Input 
          className="max-w-md" 
          placeholder="Buscar retiradas..." 
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          className="bg-black hover:bg-black/90 text-white"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Retirada
        </Button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Table with fixed height */}
        <div className="flex-1">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">Carregando retiradas...</div>
          ) : (
            <RetiradaTable 
              retiradas={data.filter(r => 
                Object.values(r).some(value => 
                  value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
                )
              )} 
            />
          )}
        </div>
      </div>
    </div>
  )
} 