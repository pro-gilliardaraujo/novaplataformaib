"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useParadas } from "@/contexts/ParadasContext"
import { FrotaCard } from "./FrotaCard"
import { ParadaModal } from "./ParadaModal"
import { HistoricoModal } from "./HistoricoModal"
import { Frota, FrotaCardProps } from "@/types/paradas"
import { RefreshCw } from "lucide-react"

export function SeletorFrotas() {
  const { unidades, statusFrotas, atualizarCenario, isLoading } = useParadas()
  const [frotaSelecionada, setFrotaSelecionada] = useState<Frota | null>(null)
  const [modalParada, setModalParada] = useState(false)
  const [modalHistorico, setModalHistorico] = useState(false)

  // Agrupar frotas por unidade
  const frotasPorUnidade = unidades.reduce((acc, unidade) => {
    acc[unidade.id] = unidade.frotas || []
    return acc
  }, {} as Record<string, Frota[]>)

  // Handlers
  const handleParar = (frota: Frota) => {
    setFrotaSelecionada(frota)
    setModalParada(true)
  }

  const handleLiberar = (frota: Frota) => {
    setFrotaSelecionada(frota)
    setModalParada(true)
  }

  const handleHistorico = (frota: Frota) => {
    setFrotaSelecionada(frota)
    setModalHistorico(true)
  }

  const handleParadaRegistrada = () => {
    setModalParada(false)
    atualizarCenario()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Paradas de Frotas</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={atualizarCenario}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar Cenário
        </Button>
      </div>

      {/* Tabs de Unidades */}
      <Tabs defaultValue={unidades[0]?.id}>
        <TabsList className="w-full">
          {unidades.map((unidade) => (
            <TabsTrigger
              key={unidade.id}
              value={unidade.id}
              className="flex-1"
            >
              {unidade.nome}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Conteúdo das Tabs */}
        {unidades.map((unidade) => (
          <TabsContent
            key={unidade.id}
            value={unidade.id}
            className="mt-6"
          >
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                {frotasPorUnidade[unidade.id]?.map((frota) => {
                  const status = statusFrotas.get(frota.id)
                  if (!status) return null

                  return (
                    <FrotaCard
                      key={frota.id}
                      status={status}
                      onParar={() => handleParar(frota)}
                      onLiberar={() => handleLiberar(frota)}
                      onHistorico={() => handleHistorico(frota)}
                    />
                  )
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>

      {/* Modais */}
      {frotaSelecionada && (
        <>
          <ParadaModal
            open={modalParada}
            onOpenChange={setModalParada}
            frota={frotaSelecionada}
            onParadaRegistrada={handleParadaRegistrada}
          />
          <HistoricoModal
            open={modalHistorico}
            onOpenChange={setModalHistorico}
            frota={frotaSelecionada}
          />
        </>
      )}
    </div>
  )
} 