"use client"

import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { Equipamento } from "@/types/equipamento"

interface EquipamentoDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipamento: Equipamento
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}

export function EquipamentoDetailsModal({
  open,
  onOpenChange,
  equipamento,
}: EquipamentoDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="flex items-center h-12 border-b relative">
          <div className="flex-1 text-center">
            <span className="text-base font-medium">Detalhes do Equipamento</span>
          </div>
          <DialogClose asChild>
            <Button 
              variant="outline"
              className="h-8 w-8 p-0 absolute right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>

        <div className="py-4 space-y-4">
          <DetailItem 
            label="Código Patrimônio" 
            value={equipamento.codigo_patrimonio} 
          />
          <DetailItem 
            label="Descrição" 
            value={equipamento.descricao} 
          />
          <DetailItem 
            label="Número de Série" 
            value={equipamento.num_serie} 
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 