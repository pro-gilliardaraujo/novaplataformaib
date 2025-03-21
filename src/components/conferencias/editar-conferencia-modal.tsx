import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { Conferencia } from "@/types/conferencias"

interface EditarConferenciaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conferencia: Conferencia
  onConferenciaEdited: (conferencia: Conferencia) => Promise<void>
}

export function EditarConferenciaModal({
  open,
  onOpenChange,
  conferencia,
  onConferenciaEdited
}: EditarConferenciaModalProps) {
  const [responsaveis, setResponsaveis] = useState(conferencia.responsaveis)
  const [observacoes, setObservacoes] = useState(conferencia.observacoes || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      await onConferenciaEdited({
        ...conferencia,
        responsaveis,
        observacoes
      })
    } catch (error) {
      console.error("Erro ao editar conferência:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="h-12 border-b relative px-4">
          <DialogTitle className="text-base font-medium absolute inset-0 flex items-center justify-center">
            Editar Conferência
          </DialogTitle>
          <div className="absolute right-4">
            <DialogClose asChild>
              <Button 
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="responsaveis">Responsáveis</Label>
            <Input
              id="responsaveis"
              value={responsaveis}
              onChange={(e) => setResponsaveis(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 