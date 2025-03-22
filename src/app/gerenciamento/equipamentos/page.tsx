"use client"

import { useState, useEffect, useCallback } from "react"
import { EquipamentosTable } from "@/components/equipamentos-table"
import { NovoEquipamentoModal } from "@/components/novo-equipamento-modal"
import { EditarEquipamentoModal } from "@/components/editar-equipamento-modal"
import { EquipamentoDetailsModal } from "@/components/equipamento-details-modal"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Equipamento, NovoEquipamentoData, UpdateEquipamentoData } from "@/types/equipamento"
import { equipamentoService } from "@/services/equipamentoService"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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
      setSelectedEquipamentoForEdit(null)
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
      setSelectedEquipamento(null)
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
      value != null && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 space-y-4">
        {/* Top bar */}
        <div className="flex justify-between items-center bg-white">
          <Input 
            className="max-w-md" 
            placeholder="Buscar equipamentos..." 
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
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
            >
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
            <Button
              className="bg-black hover:bg-black/90 text-white"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Novo Equipamento
            </Button>
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Table */}
        <div className="flex-1">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">Carregando equipamentos...</div>
          ) : (
            <EquipamentosTable
              equipamentos={filteredEquipamentos}
              onView={(equipamento) => setSelectedEquipamento(equipamento)}
              onEdit={setSelectedEquipamentoForEdit}
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
          )}
        </div>
      </div>

      {/* Modals */}
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
          onEdit={setSelectedEquipamentoForEdit}
          onDelete={handleDeleteEquipamento}
        />
      )}

      {selectedEquipamentoForEdit && (
        <EditarEquipamentoModal
          open={!!selectedEquipamentoForEdit}
          onOpenChange={(open) => !open && setSelectedEquipamentoForEdit(null)}
          onEquipamentoEdited={(updates) => {
            handleEditEquipamento(selectedEquipamentoForEdit.codigo_patrimonio, updates)
          }}
          equipamentoData={selectedEquipamentoForEdit}
        />
      )}
    </div>
  )
} 