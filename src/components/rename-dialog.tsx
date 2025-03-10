"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  currentName: string
  onConfirm: (newName: string) => void
}

export function RenameDialog({
  open,
  onOpenChange,
  title,
  currentName,
  onConfirm
}: RenameDialogProps) {
  const [newName, setNewName] = useState(currentName)

  useEffect(() => {
    setNewName(currentName)
  }, [currentName])

  const handleConfirm = () => {
    onConfirm(newName)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 