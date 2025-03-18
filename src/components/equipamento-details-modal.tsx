"use client"

import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { X, Pencil, Trash } from "lucide-react"
import { Equipamento } from "@/types/equipamento"
import { formatDateTime } from "@/utils/formatters"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"

interface EquipamentoDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipamento: Equipamento
  onEdit: (equipamento: Equipamento) => void
  onDelete: (codigoPatrimonio: string) => void
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="text-lg font-semibold mb-2 text-center">{title}</h3>
}

export function EquipamentoDetailsModal({
  open,
  onOpenChange,
  equipamento,
  onEdit,
  onDelete,
}: EquipamentoDetailsModalProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] p-0 flex flex-col h-[90vh]">
          <div className="flex items-center px-6 h-14 border-b relative">
            <div className="flex-1 text-center">
              <span className="text-lg font-medium">Detalhes do Equipamento</span>
            </div>
            <div className="absolute right-4 top-3 flex items-center gap-2">
              <Button 
                variant="outline"
                className="h-8 w-8 p-0 rounded-md shadow-sm"
                onClick={() => onEdit(equipamento)}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline"
                className="h-8 w-8 p-0 rounded-md shadow-sm"
                onClick={() => setShowDeleteDialog(true)}
                title="Excluir"
              >
                <Trash className="h-4 w-4 text-red-500" />
              </Button>
              <DialogClose asChild>
                <Button 
                  variant="outline"
                  className="h-8 w-8 p-0 rounded-md shadow-sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>

          <div className="px-8 py-6 space-y-8 flex-grow overflow-auto">
            <div>
              <SectionTitle title="Informações Gerais" />
              <div className="grid grid-cols-2 gap-6">
                <DetailItem 
                  label="Código do Patrimônio" 
                  value={equipamento.codigo_patrimonio} 
                />
                <DetailItem 
                  label="Número de Série" 
                  value={equipamento.num_serie || "—"} 
                />
                <div className="col-span-2">
                  <DetailItem 
                    label="Descrição" 
                    value={equipamento.descricao} 
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <SectionTitle title="Datas" />
              <div className="grid grid-cols-2 gap-6">
                <DetailItem 
                  label="Data de Cadastro" 
                  value={formatDateTime(equipamento.created_at)} 
                />
                <DetailItem 
                  label="Última Atualização" 
                  value={formatDateTime(equipamento.updated_at)} 
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o equipamento {equipamento.codigo_patrimonio}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(equipamento.codigo_patrimonio)
                setShowDeleteDialog(false)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 