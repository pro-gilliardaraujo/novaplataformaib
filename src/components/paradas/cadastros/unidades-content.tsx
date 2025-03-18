import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { NovaUnidadeModal } from "./nova-unidade-modal"
import { useToast } from "@/components/ui/use-toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useParadas } from "@/contexts/ParadasContext"

export function UnidadesContent() {
  const { unidades, carregarUnidades } = useParadas()
  const [searchTerm, setSearchTerm] = useState("")
  const [editingUnidade, setEditingUnidade] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletingUnidade, setDeletingUnidade] = useState<any | null>(null)
  const { toast } = useToast()

  const handleUnidadeUpdated = () => {
    carregarUnidades()
  }

  const handleDelete = async () => {
    if (!deletingUnidade) return

    try {
      await unidadesService.excluirUnidade(deletingUnidade.id)
      toast({
        title: "Sucesso",
        description: "Unidade excluída com sucesso",
      })
      carregarUnidades()
    } catch (error) {
      console.error("Erro ao excluir unidade:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a unidade",
        variant: "destructive",
      })
    } finally {
      setDeletingUnidade(null)
    }
  }

  const unidadesFiltradas = unidades.filter(unidade => {
    if (!searchTerm) return true
    return unidade.nome.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1 relative">
          <Input
            placeholder="Buscar unidades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9"
          />
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Unidade
        </Button>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 bg-white rounded-lg border">
        <div className="p-4 space-y-4">
          {unidadesFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-gray-500">Nenhuma unidade encontrada</p>
              {!searchTerm && (
                <Button
                  variant="ghost"
                  className="mt-2"
                  onClick={() => setIsModalOpen(true)}
                >
                  Criar nova unidade
                </Button>
              )}
            </div>
          ) : (
            unidadesFiltradas.map((unidade) => (
              <div
                key={unidade.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border group hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="font-medium">{unidade.nome}</span>
                    <span className="text-sm text-gray-500">
                      {unidade.frotas?.length || 0} {unidade.frotas?.length === 1 ? 'frota' : 'frotas'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingUnidade(unidade)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingUnidade(unidade)}
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
      <NovaUnidadeModal
        open={isModalOpen || !!editingUnidade}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) setEditingUnidade(null)
        }}
        unidade={editingUnidade}
        onUnidadeUpdated={handleUnidadeUpdated}
      />

      <ConfirmDialog
        open={!!deletingUnidade}
        onOpenChange={(open) => !open && setDeletingUnidade(null)}
        title="Excluir Unidade"
        description={`Tem certeza que deseja excluir a unidade "${deletingUnidade?.nome}"?`}
        onConfirm={handleDelete}
      />
    </div>
  )
} 