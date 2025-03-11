"use client"

import { useState, useEffect, useCallback } from "react"
import { PageLayout } from "@/components/page-layout"
import { EquipamentosTable } from "@/components/equipamentos-table"
import { NovoEquipamentoModal } from "@/components/novo-equipamento-modal"
import { EditarEquipamentoModal } from "@/components/editar-equipamento-modal"
import { EquipamentoDetailsModal } from "@/components/equipamento-details-modal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Equipamento, NovoEquipamentoData, UpdateEquipamentoData } from "@/types/equipamento"
import { equipamentoService } from "@/services/equipamentoService"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function EquipamentosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEquipamento, setSelectedEquipamento] = useState<Equipamento | null>(null)
  const [selectedEquipamentoForEdit, setSelectedEquipamentoForEdit] = useState<Equipamento | null>(null)
  const { toast } = useToast()

  const fetchEquipamentos = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await equipamentoService.getEquipamentos()
      setEquipamentos(data)
    } catch (err) {
      console.error("Error fetching equipamentos:", err)
      setError(err instanceof Error ? err.message : "Erro ao carregar equipamentos")
      toast({
        title: "Erro",
        description: "Não foi possível carregar os equipamentos. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchEquipamentos()
  }, [fetchEquipamentos])

  const handleCreateEquipamento = async (formData: NovoEquipamentoData) => {
    try {
      await equipamentoService.createEquipamento(formData)
      await fetchEquipamentos()
      setIsModalOpen(false)
      toast({
        title: "Sucesso",
        description: "Equipamento criado com sucesso!",
      })
    } catch (error) {
      console.error("Error creating equipamento:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar equipamento. Por favor, tente novamente.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleEditEquipamento = async (codigoPatrimonio: string, updates: UpdateEquipamentoData) => {
    try {
      await equipamentoService.updateEquipamento(codigoPatrimonio, updates)
      await fetchEquipamentos()
      toast({
        title: "Sucesso",
        description: "Equipamento atualizado com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao editar equipamento:", error)
      toast({
        title: "Erro",
        description: "Erro ao editar equipamento. Por favor, tente novamente.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleDeleteEquipamento = async (codigoPatrimonio: string) => {
    try {
      await equipamentoService.deleteEquipamento(codigoPatrimonio)
      await fetchEquipamentos()
      toast({
        title: "Sucesso",
        description: "Equipamento excluído com sucesso!",
      })
    } catch (error) {
      console.error("Error deleting equipamento:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir equipamento. Por favor, tente novamente.",
        variant: "destructive",
      })
      throw error
    }
  }

  const filteredEquipamentos = equipamentos.filter(e => 
    Object.values(e).some(value => 
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <div className="h-screen flex flex-col p-4 bg-white">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-3 bg-white">
        <Input 
          className="max-w-md" 
          placeholder="Buscar equipamentos..." 
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          className="bg-black hover:bg-black/90 text-white"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Equipamento
        </Button>
      </div>

      {/* Main content area */}
      <div className="flex-1">
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Table with fixed height */}
        <div className="flex-1">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">Carregando equipamentos...</div>
          ) : (
            <EquipamentosTable
              equipamentos={filteredEquipamentos}
              onView={(equipamento) => setSelectedEquipamento(equipamento)}
              onEdit={(equipamento) => setSelectedEquipamentoForEdit(equipamento)}
              onDelete={handleDeleteEquipamento}
            />
          )}
        </div>
      </div>

      <NovoEquipamentoModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateEquipamento}
      />

      {selectedEquipamento && (
        <EquipamentoDetailsModal
          open={!!selectedEquipamento}
          onOpenChange={(open) => !open && setSelectedEquipamento(null)}
          equipamento={selectedEquipamento}
        />
      )}

      {selectedEquipamentoForEdit && (
        <EditarEquipamentoModal
          open={!!selectedEquipamentoForEdit}
          onOpenChange={(open) => !open && setSelectedEquipamentoForEdit(null)}
          onEquipamentoEdited={(updates) => {
            handleEditEquipamento(selectedEquipamentoForEdit.codigo_patrimonio, updates)
            setSelectedEquipamentoForEdit(null)
          }}
          equipamentoData={selectedEquipamentoForEdit}
        />
      )}
    </div>
  )
} 