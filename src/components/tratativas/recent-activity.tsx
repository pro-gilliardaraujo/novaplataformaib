"use client"

import { Tratativa } from "@/types/tratativas"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"

interface RecentActivityProps {
  recentTratativas: Tratativa[]
  hideTitle?: boolean
}

export function RecentActivity({ recentTratativas, hideTitle = false }: RecentActivityProps) {
  return (
    <div>
      {!hideTitle && (
        <h3 className="text-lg font-semibold">Atividade Recente</h3>
      )}
      <div className="flex flex-col">
        {recentTratativas.map((tratativa) => (
          <Button
            key={tratativa.id}
            variant="ghost"
            className="flex items-start space-x-4 p-2 rounded-lg bg-muted/50 h-auto justify-start hover:bg-muted"
            onClick={() => {}}
          >
            <div className="flex-1 space-y-1 text-left">
              <p className="text-sm font-medium leading-none">
                Tratativa #{tratativa.numero_tratativa}
              </p>
              <p className="text-sm text-muted-foreground">
                {tratativa.setor} - {tratativa.status}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(tratativa.created_at), {
                  addSuffix: true,
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