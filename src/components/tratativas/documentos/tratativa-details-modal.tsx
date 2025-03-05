"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TratativaDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tratativa: {
    numero_tratativa: string
    funcionario: string
    data_infracao: string
    hora_infracao: string
    codigo_infracao: string
    descricao_infracao: string
    penalidade: string
    lider: string
    status: string
    texto_infracao: string
    texto_limite: string
    funcao: string
    setor: string
    medida: string
    valor_praticado: string
  }
}

export default function TratativaDetailsModal({ open, onOpenChange, tratativa }: TratativaDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Tratativa #{tratativa.numero_tratativa}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Funcionário</Label>
                <p className="text-sm">{tratativa.funcionario}</p>
              </div>
              <div className="space-y-2">
                <Label>Função</Label>
                <p className="text-sm">{tratativa.funcao}</p>
              </div>
              <div className="space-y-2">
                <Label>Setor</Label>
                <p className="text-sm">{tratativa.setor}</p>
              </div>
              <div className="space-y-2">
                <Label>Data da Infração</Label>
                <p className="text-sm">
                  {format(new Date(tratativa.data_infracao), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Hora da Infração</Label>
                <p className="text-sm">{tratativa.hora_infracao}</p>
              </div>
              <div className="space-y-2">
                <Label>Código da Infração</Label>
                <p className="text-sm">{tratativa.codigo_infracao}</p>
              </div>
              <div className="space-y-2">
                <Label>Descrição da Infração</Label>
                <p className="text-sm">{tratativa.descricao_infracao}</p>
              </div>
              <div className="space-y-2">
                <Label>Penalidade</Label>
                <p className="text-sm">{tratativa.penalidade}</p>
              </div>
              <div className="space-y-2">
                <Label>Líder</Label>
                <p className="text-sm">{tratativa.lider}</p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <p className="text-sm">{tratativa.status}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Texto da Infração</Label>
              <p className="text-sm whitespace-pre-wrap">{tratativa.texto_infracao}</p>
            </div>
            <div className="space-y-2">
              <Label>Texto do Limite</Label>
              <p className="text-sm whitespace-pre-wrap">{tratativa.texto_limite}</p>
            </div>
            <div className="space-y-2">
              <Label>Medida</Label>
              <p className="text-sm">{tratativa.medida}</p>
            </div>
            <div className="space-y-2">
              <Label>Valor Praticado</Label>
              <p className="text-sm">{tratativa.valor_praticado}</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 