// Directory: /src/components/retirada-details-modal.tsx

"use client"

import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type Retirada } from "@/app/gerenciamento/painel/retiradas/columns"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface RetiradaDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  retirada: Retirada
}

export default function RetiradaDetailsModal({
  open,
  onOpenChange,
  retirada,
}: RetiradaDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <div className="flex items-center px-4 h-12 border-b relative">
          <div className="flex-1 text-center">
            <span className="text-xs text-muted-foreground block mb-0.5">/src/components/retirada-details-modal.tsx</span>
            <span className="text-base font-medium">Detalhes da Retirada #{retirada.codigo_patrimonio}</span>
          </div>
          <DialogClose asChild>
            <Button 
              variant="outline"
              className="h-8 w-8 p-0 absolute right-2 top-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>
        <ScrollArea className="flex-grow px-6 py-4">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Código Patrimônio</h3>
                <p className="text-sm text-gray-600">{retirada.codigo_patrimonio}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Retirado por</h3>
                <p className="text-sm text-gray-600">{retirada.retirado_por}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Data de Retirada</h3>
                <p className="text-sm text-gray-600">{formatDate(retirada.data_retirada)}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Frota Instalada</h3>
                <p className="text-sm text-gray-600">{retirada.frota_instalada}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Entregue por</h3>
                <p className="text-sm text-gray-600">{retirada.entregue_por}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Status</h3>
                <p className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  retirada.status === "Pendente" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                }`}>
                  {retirada.status}
                </p>
              </div>
            </div>

            {retirada.observacoes && (
              <div>
                <h3 className="font-medium mb-2">Observações</h3>
                <p className="text-sm text-gray-600">{retirada.observacoes}</p>
              </div>
            )}

            {retirada.status === "Devolvido" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Data de Devolução</h3>
                    <p className="text-sm text-gray-600">{formatDate(retirada.data_devolucao || "")}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Devolvido por</h3>
                    <p className="text-sm text-gray-600">{retirada.devolvido_por}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Recebido por</h3>
                  <p className="text-sm text-gray-600">{retirada.recebido_por}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 