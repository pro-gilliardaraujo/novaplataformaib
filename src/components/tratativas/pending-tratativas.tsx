"use client"

import { Tratativa } from "@/types/tratativas"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"

interface PendingTratativasProps {
  tratativas: Tratativa[]
  hideTitle?: boolean
}

export function PendingTratativas({ tratativas, hideTitle = false }: PendingTratativasProps) {
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
            onClick={() => {}}
          >
            <Clock className="h-5 w-5 text-yellow-500" />
            <div className="flex-1 space-y-1 text-left">
              <p className="text-sm font-medium leading-none">
                Tratativa #{tratativa.numero_tratativa}
              </p>
              <p className="text-sm text-muted-foreground">
                {tratativa.setor}
              </p>
              <p className="text-xs text-muted-foreground">
                Enviada há {formatDistanceToNow(new Date(tratativa.created_at), {
                  locale: ptBR,
                })}
              </p>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
} 