"use client"

import { Tratativa } from "@/types/tratativas"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import TratativaDetailsModal from "@/components/tratativa-details-modal"

interface RecentActivityProps {
  recentTratativas: Tratativa[]
  hideTitle?: boolean
  onTratativaDeleted?: () => void
}

export function RecentActivity({ recentTratativas, hideTitle = false, onTratativaDeleted }: RecentActivityProps) {
  const [selectedTratativa, setSelectedTratativa] = useState<Tratativa | null>(null)

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
            onClick={() => setSelectedTratativa(tratativa)}
          >
            <div className="flex-1 space-y-1 text-left">
              <p className="text-sm font-medium leading-none">
                Tratativa #{tratativa.numero_tratativa} - {tratativa.funcionario}
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