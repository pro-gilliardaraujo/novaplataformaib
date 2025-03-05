import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import TratativaDetailsModal from "./tratativa-details-modal"

interface Tratativa {
  id: string
  numero_tratativa: string
  funcionario: string
  data_infracao: string
  lider: string
}

interface PendingTratativasProps {
  tratativas: Tratativa[]
}

export function PendingTratativas({ tratativas }: PendingTratativasProps) {
  const [selectedTratativa, setSelectedTratativa] = useState<Tratativa | null>(null)

  const handleTratativaClick = (tratativa: Tratativa) => {
    setSelectedTratativa(tratativa)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-center">Tratativas Pendentes</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <ScrollArea className="h-full">
          <div className="space-y-4 pr-4">
            {tratativas.map((t) => (
              <div
                key={t.id}
                className="cursor-pointer hover:bg-gray-100 rounded p-2"
                onClick={() => handleTratativaClick(t)}
              >
                <span className="text-sm">
                  Tratativa {t.numero_tratativa} {t.funcionario} {new Date(t.data_infracao).toLocaleDateString("pt-BR")}{" "}
                  está pendente, cobre o líder {t.lider}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      {selectedTratativa && (
        <TratativaDetailsModal
          open={!!selectedTratativa}
          onOpenChange={(open) => !open && setSelectedTratativa(null)}
          tratativa={selectedTratativa}
        />
      )}
    </Card>
  )
}

