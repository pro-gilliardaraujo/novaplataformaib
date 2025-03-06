"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Tratativa } from "@/types/tratativas"
import { TratativaDetailsModal } from "./tratativa-details-modal"

interface RecentActivityProps {
  recentTratativas: Tratativa[]
  hideTitle?: boolean
}

export function RecentActivity({ recentTratativas, hideTitle = false }: RecentActivityProps) {
  const [selectedTratativa, setSelectedTratativa] = useState<Tratativa | null>(null)

  return (
    <Card className="h-full flex flex-col">
      {!hideTitle && (
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-center">Atividade Recente</CardTitle>
        </CardHeader>
      )}
      <CardContent className="flex-grow">
        <ScrollArea className="h-[250px]">
          <div className="space-y-4 pr-4">
            {recentTratativas.map((item) => (
              <div
                key={item.id}
                className="cursor-pointer hover:bg-gray-100 rounded p-2"
                onClick={() => setSelectedTratativa(item)}
              >
                <span className="text-sm font-medium">
                  Tratativa {item.numero_tratativa} - {item.funcionario}{" "}
                  {format(new Date(item.data_infracao), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      {selectedTratativa && (
        <TratativaDetailsModal
          open={!!selectedTratativa}
          onOpenChange={(open: boolean) => !open && setSelectedTratativa(null)}
          tratativa={selectedTratativa}
        />
      )}
    </Card>
  )
} 