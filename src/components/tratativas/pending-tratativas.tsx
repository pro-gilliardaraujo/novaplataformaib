"use client"

import { Tratativa } from "@/types/tratativas"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Clock, AlertCircle } from "lucide-react"
import { useState } from "react"
import TratativaDetailsModal from "@/components/tratativa-details-modal"

interface PendingTratativasProps {
  tratativas: Tratativa[]
  hideTitle?: boolean
  onTratativaDeleted?: () => void
}

export function PendingTratativas({ tratativas, hideTitle = false, onTratativaDeleted }: PendingTratativasProps) {
  const [selectedTratativa, setSelectedTratativa] = useState<Tratativa | null>(null)

  return (
    <div>
      {!hideTitle && (
        <h3 className="text-lg font-semibold">Tratativas Pendentes</h3>
      )}
      <div className="flex flex-col">
        {tratativas.map((tratativa) => (
          <Button
            key={tratativa.id}
            variant="ghost"
            className="flex items-start space-x-4 p-2 rounded-lg bg-muted/50 h-auto justify-start hover:bg-muted"
            onClick={() => setSelectedTratativa(tratativa)}
          >
            {tratativa.status === "À CONFIRMAR" ? (
              <AlertCircle className="h-5 w-5 text-orange-500" />
            ) : (
              <Clock className="h-5 w-5 text-yellow-500" />
            )}
            <div className="flex-1 space-y-1 text-left">
              <p className="text-sm font-medium leading-none">
                Tratativa #{tratativa.numero_tratativa} - {tratativa.funcionario}
              </p>
              <p className="text-xs text-muted-foreground">
                {tratativa.status === "À CONFIRMAR" ? (
                  <>Criado há {formatDistanceToNow(new Date(tratativa.created_at), {
                    locale: ptBR,
                  })}, aguardando confirmação e revisão</>
                ) : (
                  <>Enviada há {formatDistanceToNow(new Date(tratativa.created_at), {
                    locale: ptBR,
                  })}</>
                )}
              </p>
            </div>
          </Button>
        ))}
      </div>

      {selectedTratativa && (
        <TratativaDetailsModal
          open={!!selectedTratativa}
          onOpenChange={(open: boolean) => !open && setSelectedTratativa(null)}
          tratativa={{
            ...selectedTratativa,
            id: selectedTratativa.id.toString()
          }}
          onTratativaDeleted={onTratativaDeleted}
        />
      )}
    </div>
  )
} 