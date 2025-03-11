"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Page } from "@/types/pages"
import { IconSelectorDialog } from "./icon-selector-dialog"
import { RenameDialog } from "./rename-dialog"

interface EditPageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  page: Page
  onUpdatePage: (pageId: string, updates: { name?: string; icon?: string }) => void
}

export function EditPageModal({
  open,
  onOpenChange,
  page,
  onUpdatePage
}: EditPageModalProps) {
  const [showIconSelector, setShowIconSelector] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Página: {page.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowRenameDialog(true)}
            >
              Renomear Página
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowIconSelector(true)}
            >
              Alterar Ícone
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RenameDialog
        open={showRenameDialog}
        onOpenChange={setShowRenameDialog}
        title="Renomear Página"
        currentName={page.name}
        onConfirm={(newName) => onUpdatePage(page.id, { name: newName })}
      />

      <IconSelectorDialog
        open={showIconSelector}
        onOpenChange={setShowIconSelector}
        onSelectIcon={(iconName) => onUpdatePage(page.id, { icon: iconName })}
        itemName={page.name}
        itemType="página"
        parentName={page.category_name}
      />
    </>
  )
} 