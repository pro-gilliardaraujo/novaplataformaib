"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Trash2 } from "lucide-react"
import { tiposParadaService } from "@/services/tiposParadaService"
import { TipoParada } from "@/types/paradas"
import { useToast } from "@/components/ui/use-toast"
import { renderIcon } from "@/utils/icon-utils"
import { IconSelectorDialog } from "@/components/icon-selector-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TipoParadaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipoParada: TipoParada | null
  onTipoParadaUpdated: () => void
}

export function TipoParadaModal({
  open,
  onOpenChange,
  tipoParada,
  onTipoParadaUpdated
}: TipoParadaModalProps) {
  const [nome, setNome] = useState("")
  const [icone, setIcone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showIconSelector, setShowIconSelector] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (tipoParada) {
      setNome(tipoParada.nome)
      setIcone(tipoParada.icone || "")
    } else {
      setNome("")
      setIcone("")
    }
  }, [tipoParada])

  const handleSubmit = async () => {
    if (!nome) {
      toast({
        title: "Erro",
        description: "Digite o nome do tipo de parada",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (tipoParada) {
        await tiposParadaService.atualizarTipo(tipoParada.id, nome, icone)
        toast({
          title: "Sucesso",
          description: "Tipo de parada atualizado com sucesso",
        })
      } else {
        await tiposParadaService.criarTipo(nome, icone)
        toast({
          title: "Sucesso",
          description: "Tipo de parada criado com sucesso",
        })
      }

      onTipoParadaUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao salvar tipo de parada:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o tipo de parada",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!tipoParada) return

    try {
      await tiposParadaService.excluirTipo(tipoParada.id)
      toast({
        title: "Sucesso",
        description: "Tipo de parada excluído com sucesso",
      })
      onTipoParadaUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao excluir tipo de parada:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o tipo de parada",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <DialogHeader className="h-12 border-b relative">
            <DialogTitle className="absolute inset-0 flex items-center justify-center text-base font-medium">
              {tipoParada ? "Editar Tipo de Parada" : "Novo Tipo de Parada"}
            </DialogTitle>
            <div className="absolute right-4 flex gap-2">
              {tipoParada && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-md shadow-sm"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Excluir tipo de parada</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <DialogClose asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-md shadow-sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Digite o nome do tipo de parada"
                />
              </div>

              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 border rounded-md flex items-center justify-center">
                    {icone ? renderIcon(icone, "h-5 w-5") : "—"}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowIconSelector(true)}
                  >
                    Selecionar Ícone
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t px-6 py-4 flex justify-end">
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-black hover:bg-black/90 text-white"
            >
              {tipoParada ? "Salvar Alterações" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <IconSelectorDialog
        open={showIconSelector}
        onOpenChange={setShowIconSelector}
        onSelectIcon={setIcone}
        itemName={nome || "Novo Tipo"}
        itemType="tipo"
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Excluir Tipo de Parada"
        description={`Tem certeza que deseja excluir o tipo de parada "${tipoParada?.nome}"?`}
        onConfirm={handleDelete}
      />
    </>
  )
} 