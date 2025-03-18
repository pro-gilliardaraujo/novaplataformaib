import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { NovaFrotaModal } from "./nova-frota-modal"
import { frotasService } from "@/services/frotasService"
import { Frota } from "@/types/paradas"
import { useToast } from "@/components/ui/use-toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useParadas } from "@/contexts/ParadasContext"

export function FrotasContent() {
  const { unidades } = useParadas()
  const [searchTerm, setSearchTerm] = useState("")
  const [frotas, setFrotas] = useState<Frota[]>([])
  const [editingFrota, setEditingFrota] = useState<Frota | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletingFrota, setDeletingFrota] = useState<Frota | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUnidade, setSelectedUnidade] = useState<string>("todas")
  const { toast } = useToast()

  const carregarFrotas = async () => {
    try {
      setIsLoading(true)
      const frotas = await frotasService.buscarFrotas()
      setFrotas(frotas)
    } catch (error) {
      console.error("Erro ao carregar frotas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as frotas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarFrotas()
  }, [])

  const handleFrotaUpdated = () => {
    carregarFrotas()
  }

  const handleDelete = async () => {
    if (!deletingFrota) return

    try {
      await frotasService.excluirFrota(deletingFrota.id)
      toast({
        title: "Sucesso",
        description: "Frota excluída com sucesso",
      })
      carregarFrotas()
    } catch (error) {
      console.error("Erro ao excluir frota:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a frota",
        variant: "destructive",
      })
    } finally {
      setDeletingFrota(null)
    }
  }

  const frotasFiltradas = frotas.filter(frota => {
    if (selectedUnidade !== "todas" && frota.unidade_id !== selectedUnidade) return false
    if (!searchTerm) return true
    return (
      frota.frota.toLowerCase().includes(searchTerm.toLowerCase()) ||
      frota.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1 relative">
            <Input
              placeholder="Buscar frotas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9"
            />
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
          <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione uma unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as unidades</SelectItem>
              {unidades.map((unidade) => (
                <SelectItem key={unidade.id} value={unidade.id}>
                  {unidade.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Frota
        </Button>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 bg-white rounded-lg border">
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-gray-500">Carregando frotas...</p>
            </div>
          ) : frotasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-gray-500">Nenhuma frota encontrada</p>
              {!searchTerm && selectedUnidade === "todas" && (
                <Button
                  variant="ghost"
                  className="mt-2"
                  onClick={() => setIsModalOpen(true)}
                >
                  Criar nova frota
                </Button>
              )}
            </div>
          ) : (
            frotasFiltradas.map((frota) => {
              const unidade = unidades.find(u => u.id === frota.unidade_id)
              return (
                <div
                  key={frota.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border group hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{frota.frota}</span>
                      <span className="text-sm text-gray-500">{frota.descricao}</span>
                    </div>
                    {unidade && (
                      <span className="text-sm text-gray-500">
                        {unidade.nome}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingFrota(frota)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingFrota(frota)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Modals */}
      <NovaFrotaModal
        open={isModalOpen || !!editingFrota}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) setEditingFrota(null)
        }}
        frota={editingFrota}
        onFrotaUpdated={handleFrotaUpdated}
      />

      <ConfirmDialog
        open={!!deletingFrota}
        onOpenChange={(open) => !open && setDeletingFrota(null)}
        title="Excluir Frota"
        description={`Tem certeza que deseja excluir a frota "${deletingFrota?.frota}"?`}
        onConfirm={handleDelete}
      />
    </div>
  )
} 