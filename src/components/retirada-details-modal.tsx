"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { X, Pencil } from "lucide-react"
import { Retirada } from "@/types/retirada"
import { formatDate } from "@/lib/utils"

interface RetiradaDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  retirada: Retirada
  onEdit?: (retirada: Retirada) => void
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm mt-1">{value}</span>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center mb-4">
      <div className="flex-grow h-px bg-gray-200"></div>
      <h3 className="text-base font-medium px-4">{title}</h3>
      <div className="flex-grow h-px bg-gray-200"></div>
    </div>
  )
}

export default function RetiradaDetailsModal({ open, onOpenChange, retirada, onEdit }: RetiradaDetailsModalProps) {
  const [currentRetirada, setCurrentRetirada] = useState<Retirada>(retirada)

  // Atualiza o estado local quando a retirada prop mudar
  useEffect(() => {
    setCurrentRetirada(retirada)
  }, [retirada])

  const handleEdit = (retirada: Retirada) => {
    if (onEdit) {
      onEdit(retirada)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <div className="flex items-center px-4 h-12 border-b relative">
          <div className="flex-1 text-center">
            <span className="text-base font-medium">Detalhes da Retirada {currentRetirada.codigo_patrimonio}</span>
          </div>
          <div className="absolute right-2 top-2 flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md shadow-sm"
                onClick={() => handleEdit(currentRetirada)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <DialogClose asChild>
              <Button 
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md shadow-sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </div>

        <ScrollArea className="flex-grow px-6 py-4">
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <SectionTitle title="Informações da Retirada" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <DetailItem label="Código Patrimônio" value={currentRetirada.codigo_patrimonio} />
                <DetailItem label="Retirado por" value={currentRetirada.retirado_por} />
                <DetailItem label="Data de Retirada" value={formatDate(currentRetirada.data_retirada)} />
                <DetailItem label="Frota Instalada" value={currentRetirada.frota_instalada} />
                <DetailItem label="Entregue por" value={currentRetirada.entregue_por} />
                <DetailItem label="Status" value={
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      currentRetirada.retirado
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {currentRetirada.retirado ? "Retirado" : "Devolvido"}
                  </span>
                } />
              </div>
            </div>

            <div>
              <SectionTitle title="Observações" />
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{currentRetirada.observacoes || "Nenhuma observação registrada."}</p>
              </div>
            </div>

            <div>
              <SectionTitle title="Informações da Devolução" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <DetailItem label="Data de Devolução" value={formatDate(currentRetirada.data_devolucao)} />
                <DetailItem label="Devolvido por" value={currentRetirada.devolvido_por || "-"} />
                <DetailItem label="Recebido por" value={currentRetirada.recebido_por || "-"} />
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 