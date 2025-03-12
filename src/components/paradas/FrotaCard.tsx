"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, History, AlertTriangle } from "lucide-react"
import { FrotaCardProps } from "@/types/paradas"
import { paradasService } from "@/services/paradasService"

export function FrotaCard({ status, onParar, onLiberar, onHistorico }: FrotaCardProps) {
  const { frota, parada_atual, historico_count } = status

  // Calcula se a previsão foi excedida (se houver)
  const previsaoExcedida = useMemo(() => {
    if (!parada_atual?.previsao_minutos) return false
    const duracaoAtual = paradasService.calcularDuracao(parada_atual.inicio)
    return duracaoAtual > parada_atual.previsao_minutos
  }, [parada_atual])

  // Calcula a duração atual da parada
  const duracaoAtual = useMemo(() => {
    if (!parada_atual) return null
    const minutos = paradasService.calcularDuracao(parada_atual.inicio)
    const horas = Math.floor(minutos / 60)
    const minutosRestantes = minutos % 60
    return `${horas}h${minutosRestantes.toString().padStart(2, '0')}`
  }, [parada_atual])

  return (
    <Card className="relative overflow-hidden">
      {/* Barra lateral indicadora de status */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          parada_atual ? 'bg-red-500' : 'bg-green-500'
        }`}
      />

      <CardContent className="p-4">
        {/* Cabeçalho com código e descrição */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg">{frota.codigo_patrimonio}</h3>
          <p className="text-sm text-gray-500">{frota.descricao}</p>
        </div>

        {/* Status atual */}
        <div className="space-y-2 mb-4">
          {parada_atual ? (
            <>
              {/* Tipo de parada com ícone */}
              <div className="flex items-center gap-2">
                {parada_atual.tipo?.icone && (
                  <span className="text-gray-500">{parada_atual.tipo.icone}</span>
                )}
                <span className="text-sm font-medium">{parada_atual.tipo?.nome}</span>
              </div>

              {/* Duração e previsão */}
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 ${
                  previsaoExcedida ? 'text-red-500' : 'text-gray-500'
                }`} />
                <span className="text-sm">
                  {duracaoAtual}
                  {parada_atual.previsao_minutos && (
                    <span className="text-gray-500">
                      {" "}/ {Math.floor(parada_atual.previsao_minutos / 60)}h
                      {(parada_atual.previsao_minutos % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </span>
                {previsaoExcedida && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </div>

              {/* Motivo */}
              <p className="text-sm text-gray-600">{parada_atual.motivo}</p>
            </>
          ) : (
            <p className="text-sm text-gray-600">Em operação</p>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex justify-between items-center">
          <Button
            variant={parada_atual ? "outline" : "default"}
            size="sm"
            onClick={parada_atual ? onLiberar : onParar}
            className={parada_atual ? "border-red-200 hover:border-red-300" : "bg-black hover:bg-black/90"}
          >
            {parada_atual ? "Liberar" : "Parar"}
          </Button>

          {historico_count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onHistorico}
              className="text-gray-500"
            >
              <History className="h-4 w-4 mr-1" />
              {historico_count}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 