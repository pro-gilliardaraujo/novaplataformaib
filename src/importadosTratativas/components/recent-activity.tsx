import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import TratativaDetailsModal from "./tratativa-details-modal"

interface Tratativa {
  id: string
  numero_tratativa: string
  funcionario: string
  data_infracao: string
  status: string
  // Adicione outros campos necessários para o modal de detalhes
}

interface RecentActivityProps {
  recentTratativas: Tratativa[]
}

export function RecentActivity({ recentTratativas }: RecentActivityProps) {
  const [selectedTratativa, setSelectedTratativa] = useState<Tratativa | null>(null)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const filteredTratativas = recentTratativas.filter((item) => {
    const itemDate = new Date(item.data_infracao)
    return itemDate >= sevenDaysAgo
  })

  const handleTratativaClick = (tratativa: Tratativa) => {
    setSelectedTratativa(tratativa)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-center">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <ScrollArea className="h-full">
          <div className="space-y-4 pr-4">
            {filteredTratativas.map((item) => (
              <div
                key={item.id}
                className="cursor-pointer hover:bg-gray-100 rounded p-2"
                onClick={() => handleTratativaClick(item)}
              >
                <span className="text-sm font-medium">
                  Tratativa {item.numero_tratativa} - {item.funcionario}{" "}
                  {new Date(item.data_infracao).toLocaleDateString("pt-BR")}
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

