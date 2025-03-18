"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useParadas } from "@/contexts/ParadasContext"
import { useToast } from "@/components/ui/use-toast"
import { X, Trash2 } from "lucide-react"
import { frotasService } from "@/services/frotasService"
import { Frota } from "@/types/paradas"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NovaFrotaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  frota: Frota | null
  onFrotaUpdated: () => void
}

export function NovaFrotaModal({
  open,
  onOpenChange,
  frota,
  onFrotaUpdated
}: NovaFrotaModalProps) {
  const { unidades } = useParadas()
  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [unidadeId, setUnidadeId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (frota) {
      setNome(frota.frota)
      setDescricao(frota.descricao)
      setUnidadeId(frota.unidade_id)
    } else {
      setNome("")
      setDescricao("")
      setUnidadeId("")
    }
  }, [frota])

  const handleSubmit = async () => {
    if (!nome || !descricao || !unidadeId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (frota) {
        await frotasService.atualizarFrota(frota.id, nome, descricao, unidadeId)
        toast({
          title: "Sucesso",
          description: "Frota atualizada com sucesso",
        })
      } else {
        await frotasService.criarFrota(nome, descricao, unidadeId)
        toast({
          title: "Sucesso",
          description: "Frota criada com sucesso",
        })
      }

      onFrotaUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao salvar frota:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a frota",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!frota) return

    try {
      await frotasService.excluirFrota(frota.id)
      toast({
        title: "Sucesso",
        description: "Frota excluída com sucesso",
      })
      onFrotaUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao excluir frota:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a frota",
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
              {frota ? "Editar Frota" : "Nova Frota"}
            </DialogTitle>
            <div className="absolute right-4 flex gap-2">
              {frota && (
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
                      <p>Excluir frota</p>
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
                <Label htmlFor="frota">Frota</Label>
                <Input
                  id="frota"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Digite o código da frota"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Digite a descrição da frota"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade</Label>
                <Select value={unidadeId} onValueChange={setUnidadeId}>
                  <SelectTrigger id="unidade">
                    <SelectValue placeholder="Selecione uma unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="border-t px-6 py-4 flex justify-end">
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-black hover:bg-black/90 text-white"
            >
              {frota ? "Salvar Alterações" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Excluir Frota"
        description={`Tem certeza que deseja excluir a frota "${frota?.frota}"?`}
        onConfirm={handleDelete}
      />
    </>
  )
} 