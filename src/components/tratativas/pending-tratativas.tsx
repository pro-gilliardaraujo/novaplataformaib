"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Tratativa } from "@/types/tratativas"
import { TratativaDetailsModal } from "./tratativa-details-modal"

interface PendingTratativasProps {
  tratativas: Tratativa[]
  hideTitle?: boolean
}

export function PendingTratativas({ tratativas, hideTitle = false }: PendingTratativasProps) {
  const [selectedTratativa, setSelectedTratativa] = useState<Tratativa | null>(null)

  return (
    <Card className="h-full flex flex-col">
      {!hideTitle && (
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-center">Tratativas Pendentes</CardTitle>
        </CardHeader>
      )}
      <CardContent className="flex-grow">
        <ScrollArea className="h-[250px]">
          <div className="space-y-4 pr-4">
            {tratativas.map((item) => (
              <div
                key={item.id}
                className="cursor-pointer hover:bg-gray-100 rounded p-2"
                onClick={() => setSelectedTratativa(item)}
              >
                <span className="text-sm">
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