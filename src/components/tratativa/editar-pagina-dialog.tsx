import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { IconSelectorDialog } from "../icon-selector-dialog"

interface EditarPaginaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: {
    nome: string
    icone: string
  }
  onSave: (nome: string, icone: string) => void
  tipo: "tipo" | "página"
}

export function EditarPaginaDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
  tipo,
}: EditarPaginaDialogProps) {
  const [nome, setNome] = useState(initialData.nome)
  const [icone, setIcone] = useState(initialData.icone)
  const [showIconSelector, setShowIconSelector] = useState(false)

  const handleSave = () => {
    onSave(nome, icone)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {tipo}</DialogTitle>
            <DialogDescription>
              Altere o nome e o ícone do {tipo}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">
                Nome
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="icone" className="text-right">
                Ícone
              </Label>
              <div className="col-span-3 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowIconSelector(true)}
                >
                  Selecionar Ícone
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <IconSelectorDialog
        open={showIconSelector}
        onOpenChange={setShowIconSelector}
        onSelectIcon={setIcone}
        itemName={nome}
        itemType={tipo}
      />
    </>
  )
} 