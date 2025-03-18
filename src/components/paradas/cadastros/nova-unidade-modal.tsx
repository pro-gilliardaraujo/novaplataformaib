"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { X, Trash2 } from "lucide-react"
import { unidadesService } from "@/services/unidadesService"
import { Unidade } from "@/types/unidades"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NovaUnidadeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unidade?: Unidade | null
  onUnidadeUpdated: () => void
}

export function NovaUnidadeModal({
  open,
  onOpenChange,
  unidade,
  onUnidadeUpdated,
}: NovaUnidadeModalProps) {
  const [nome, setNome] = useState(unidade?.nome || "")
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return

    setIsLoading(true)
    try {
      if (unidade) {
        await unidadesService.atualizarUnidade(unidade.id, { nome: nome.trim() })
        toast({
          title: "Sucesso",
          description: "Unidade atualizada com sucesso",
        })
      } else {
        await unidadesService.criarUnidade({ nome: nome.trim() })
        toast({
          title: "Sucesso",
          description: "Unidade criada com sucesso",
        })
      }

      onUnidadeUpdated()
      onOpenChange(false)
      setNome("")
    } catch (error) {
      console.error("Erro ao salvar unidade:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a unidade",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!unidade) return

    try {
      await unidadesService.excluirUnidade(unidade.id)
      toast({
        title: "Sucesso",
        description: "Unidade excluída com sucesso",
      })
      onUnidadeUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao excluir unidade:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a unidade",
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
              {unidade ? "Editar Unidade" : "Nova Unidade"}
            </DialogTitle>
            <div className="absolute right-4 flex gap-2">
              {unidade && (
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
                      <p>Excluir unidade</p>
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

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="Nome da unidade"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-black hover:bg-black/90 text-white"
              >
                {isLoading ? "Salvando..." : unidade ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Excluir Unidade"
        description={`Tem certeza que deseja excluir a unidade "${unidade?.nome}"?`}
        onConfirm={handleDelete}
      />
    </>
  )
} 