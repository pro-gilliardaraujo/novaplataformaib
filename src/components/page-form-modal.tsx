"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Page } from "@/types/pages"

interface PageFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string }) => Promise<void>
  categoryId?: string
  page?: Page
}

export function PageFormModal({
  open,
  onOpenChange,
  onSubmit,
  categoryId,
  page
}: PageFormModalProps) {
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (page) {
      setName(page.name)
    } else {
      setName("")
    }
  }, [page])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSubmit({ name })
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao salvar página:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {page ? "Editar Página" : "Nova Página"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Digite o nome da página"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 