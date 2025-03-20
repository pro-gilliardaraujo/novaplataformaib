"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ConferenciasTable } from "@/components/conferencias/conferencias-table"
import { NovaConferenciaModal } from "@/components/conferencias/nova-conferencia-modal"

export default function ConferenciasPage() {
  const { user } = useAuth()
  const [isNewConferenciaModalOpen, setIsNewConferenciaModalOpen] = useState(false)
  const [key, setKey] = useState(0) // Força o recarregamento da tabela

  const handleConferenciaCreated = () => {
    setKey(prev => prev + 1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Conferências de Estoque</h1>
        <Button 
          onClick={() => setIsNewConferenciaModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Conferência
        </Button>
      </div>

      <ConferenciasTable key={key} />

      <NovaConferenciaModal
        open={isNewConferenciaModalOpen}
        onOpenChange={setIsNewConferenciaModalOpen}
        onConferenciaCreated={handleConferenciaCreated}
      />
    </div>
  )
} 