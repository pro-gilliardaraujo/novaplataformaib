"use client"

import { useState, useEffect, useCallback } from "react"
import { PageLayout } from "@/components/page-layout"
import { DataTable } from "@/components/data-table"
import { NovoEquipamentoModal } from "@/components/novo-equipamento-modal"
import { EditarEquipamentoModal } from "@/components/editar-equipamento-modal"
import { EquipamentoDetailsModal } from "@/components/equipamento-details-modal"
import { Button } from "@/components/ui/button"
import { Eye, Pencil } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Equipamento, NovoEquipamentoData, UpdateEquipamentoData } from "@/types/equipamento"
import { equipamentoService } from "@/services/equipamentoService"

export default function EquipamentosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
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

  const columns = [
    { key: "codigo_patrimonio" as keyof Equipamento, title: "Código" },
    { key: "descricao" as keyof Equipamento, title: "Descrição" },
    { key: "num_serie" as keyof Equipamento, title: "Número de Série" },
  ]

  const totalPages = Math.ceil(filteredEquipamentos.length / 15)

  return (
    <PageLayout
      title="Novo Equipamento"
      searchPlaceholder="Buscar equipamentos..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      onNewClick={() => setIsModalOpen(true)}
      isLoading={isLoading}
      error={error}
    >
      <DataTable
        data={filteredEquipamentos}
        columns={columns}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        actions={(equipamento) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setSelectedEquipamento(equipamento)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setSelectedEquipamentoForEdit(equipamento)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

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
    </PageLayout>
  )
} 