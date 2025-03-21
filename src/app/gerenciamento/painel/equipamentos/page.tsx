"use client"

import { useState, useEffect } from "react"
import { EquipamentosTable } from "@/components/equipamentos-table"
import { NovoEquipamentoModal } from "@/components/novo-equipamento-modal"
import { EditarEquipamentoModal } from "@/components/editar-equipamento-modal"
import { EquipamentoDetailsModal } from "@/components/equipamento-details-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Equipamento, NovoEquipamentoData, UpdateEquipamentoData } from "@/types/equipamento"
import { equipamentoService } from "@/services/equipamentoService"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function EquipamentosPage() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isNovoEquipamentoModalOpen, setIsNovoEquipamentoModalOpen] = useState(false)
  const [selectedEquipamento, setSelectedEquipamento] = useState<Equipamento | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const fetchEquipamentos = async () => {
    try {
      const data = await equipamentoService.getEquipamentos()
      setEquipamentos(data)
      setError("")
    } catch (error) {
      console.error("Error fetching equipamentos:", error)
      setError("Erro ao carregar equipamentos")
      toast({
        title: "Erro",
        description: "Não foi possível carregar os equipamentos. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEquipamentos()
  }, [])

  const handleCreateEquipamento = async (equipamentoData: NovoEquipamentoData) => {
    try {
      await equipamentoService.createEquipamento(equipamentoData)
      await fetchEquipamentos()
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchEquipamentos}>Tentar Novamente</Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando equipamentos...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col p-4 bg-white">
      <div className="flex justify-between items-center mb-4">
        <Input 
          placeholder="Buscar equipamentos..." 
          className="max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          onClick={() => setIsNovoEquipamentoModalOpen(true)}
          className="bg-black hover:bg-black/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Equipamento
        </Button>
      </div>

      <div className="flex-1 min-h-0">
        <div className="border border-gray-200 rounded-lg overflow-hidden h-full">
          <EquipamentosTable
            equipamentos={filteredEquipamentos}
            onView={(equipamento) => {
              setSelectedEquipamento(equipamento)
              setIsDetailsModalOpen(true)
            }}
            onEdit={(equipamento) => {
              setSelectedEquipamento(equipamento)
              setIsEditModalOpen(true)
            }}
            onDelete={handleDeleteEquipamento}
            searchTerm={searchTerm}
            onExport={() => {
              const BOM = '\uFEFF'
              const headers = {
                codigo_patrimonio: 'Código',
                descricao: 'Descrição',
                num_serie: 'Número de Série',
                created_at: 'Data de Cadastro'
              }
              
              const escapeCsvCell = (cell: string | number) => {
                cell = String(cell).replace(/"/g, '""')
                return /[;\n"]/.test(cell) ? `"${cell}"` : cell
              }

              const csvRows = [
                Object.values(headers).join(';'),
                ...filteredEquipamentos.map(equipamento => [
                  escapeCsvCell(equipamento.codigo_patrimonio),
                  escapeCsvCell(equipamento.descricao),
                  escapeCsvCell(equipamento.num_serie || 'N/A'),
                  escapeCsvCell(format(new Date(equipamento.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }))
                ].join(';'))
              ].join('\r\n')

              const blob = new Blob([BOM + csvRows], { type: 'text/csv;charset=utf-8' })
              const link = document.createElement('a')
              link.href = URL.createObjectURL(blob)
              link.download = `equipamentos_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.csv`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }}
          />
        </div>
      </div>

      <NovoEquipamentoModal
        open={isNovoEquipamentoModalOpen}
        onOpenChange={setIsNovoEquipamentoModalOpen}
        onSubmit={handleCreateEquipamento}
      />

      {selectedEquipamento && (
        <>
          <EditarEquipamentoModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            onEquipamentoEdited={(updates) => handleEditEquipamento(selectedEquipamento.codigo_patrimonio, updates)}
            equipamentoData={selectedEquipamento}
          />

          <EquipamentoDetailsModal
            open={isDetailsModalOpen}
            onOpenChange={setIsDetailsModalOpen}
            equipamento={selectedEquipamento}
            onEdit={(equipamento) => {
              setSelectedEquipamento(equipamento)
              setIsEditModalOpen(true)
            }}
            onDelete={handleDeleteEquipamento}
          />
        </>
      )}
    </div>
  )
} 