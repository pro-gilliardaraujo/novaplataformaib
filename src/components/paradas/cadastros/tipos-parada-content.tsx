import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { TipoParadaModal } from "../TipoParadaModal"
import { tiposParadaService } from "@/services/tiposParadaService"
import { TipoParada } from "@/types/paradas"
import { useToast } from "@/components/ui/use-toast"
import { renderIcon } from "@/utils/icon-utils"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export function TiposParadaContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [tiposParada, setTiposParada] = useState<TipoParada[]>([])
  const [editingTipo, setEditingTipo] = useState<TipoParada | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletingTipo, setDeletingTipo] = useState<TipoParada | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const carregarTiposParada = async () => {
    try {
      setIsLoading(true)
      const tipos = await tiposParadaService.buscarTipos()
      setTiposParada(tipos)
    } catch (error) {
      console.error("Erro ao carregar tipos de parada:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tipos de parada",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarTiposParada()
  }, [])

  const handleTipoParadaUpdated = () => {
    carregarTiposParada()
  }

  const handleDelete = async () => {
    if (!deletingTipo) return

    try {
      await tiposParadaService.excluirTipo(deletingTipo.id)
      toast({
        title: "Sucesso",
        description: "Tipo de parada excluído com sucesso",
      })
      carregarTiposParada()
    } catch (error) {
      console.error("Erro ao excluir tipo de parada:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o tipo de parada",
        variant: "destructive",
      })
    } finally {
      setDeletingTipo(null)
    }
  }

  const tiposFiltrados = tiposParada.filter(tipo => {
    if (!searchTerm) return true
    return tipo.nome.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1 relative">
          <Input
            placeholder="Buscar tipos de parada..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9"
          />
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Tipo
        </Button>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 bg-white rounded-lg border">
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-gray-500">Carregando tipos de parada...</p>
            </div>
          ) : tiposFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-gray-500">Nenhum tipo de parada encontrado</p>
              {!searchTerm && (
                <Button
                  variant="ghost"
                  className="mt-2"
                  onClick={() => setIsModalOpen(true)}
                >
                  Criar novo tipo
                </Button>
              )}
            </div>
          ) : (
            tiposFiltrados.map((tipo) => (
              <div
                key={tipo.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border group hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {tipo.icone && renderIcon(tipo.icone, "h-5 w-5 text-gray-500")}
                  <span className="font-medium">{tipo.nome}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingTipo(tipo)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingTipo(tipo)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Modals */}
      <TipoParadaModal
        open={isModalOpen || !!editingTipo}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) setEditingTipo(null)
        }}
        tipoParada={editingTipo}
        onTipoParadaUpdated={handleTipoParadaUpdated}
      />

      <ConfirmDialog
        open={!!deletingTipo}
        onOpenChange={(open) => !open && setDeletingTipo(null)}
        title="Excluir Tipo de Parada"
        description={`Tem certeza que deseja excluir o tipo de parada "${deletingTipo?.nome}"?`}
        onConfirm={handleDelete}
      />
    </div>
  )
} 