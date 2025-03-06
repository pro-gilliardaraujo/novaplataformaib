"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Tratativa } from "@/types/tratativas"

interface TratativaDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tratativa: Tratativa
}

export function TratativaDetailsModal({
  open,
  onOpenChange,
  tratativa,
}: TratativaDetailsModalProps) {
  const statusColors = {
    ENVIADA: "text-yellow-600",
    DEVOLVIDA: "text-green-600",
    CANCELADA: "text-red-600",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Tratativa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Número da Tratativa</h4>
              <p className="text-sm">{tratativa.numero_tratativa}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
              <p className={`text-sm ${statusColors[tratativa.status]}`}>{tratativa.status}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Funcionário</h4>
              <p className="text-sm">{tratativa.funcionario}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Data e Hora da Infração</h4>
              <p className="text-sm">
                {format(new Date(tratativa.data_infracao), "dd/MM/yyyy", { locale: ptBR })} às{" "}
                {tratativa.hora_infracao}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Setor</h4>
              <p className="text-sm">{tratativa.setor}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Líder</h4>
              <p className="text-sm">{tratativa.lider}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Código da Infração</h4>
              <p className="text-sm">{tratativa.codigo_infracao}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Infração Cometida</h4>
              <p className="text-sm">{tratativa.infracao_cometida}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Penalidade</h4>
              <p className="text-sm">{tratativa.penalidade}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Penalidade Aplicada</h4>
              <p className="text-sm">{tratativa.penalidade_aplicada}</p>
            </div>
          </div>
          {tratativa.observacoes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Observações</h4>
              <p className="text-sm whitespace-pre-wrap">{tratativa.observacoes}</p>
            </div>
          )}
          {tratativa.justificativa && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Justificativa</h4>
              <p className="text-sm whitespace-pre-wrap">{tratativa.justificativa}</p>
            </div>
          )}
          {tratativa.documento_url && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Documento</h4>
              <a
                href={tratativa.documento_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Visualizar documento
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 