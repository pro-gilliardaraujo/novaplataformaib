"use client"

import { useState, useEffect } from "react"
import { ParadasProvider } from "@/contexts/ParadasContext"
import { useParadas } from "@/contexts/ParadasContext"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { RefreshCw, Settings, Search, Calendar } from "lucide-react"
import { FrotaCard } from "@/components/paradas/FrotaCard"
import { ParadaModal } from "@/components/paradas/ParadaModal"
import { HistoricoModal } from "@/components/paradas/HistoricoModal"
import { SeletorFrotasModal } from "@/components/paradas/SeletorFrotasModal"
import { ColorPicker } from "@/components/paradas/ColorPicker"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Frota } from "@/types/paradas"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Lista de cores disponíveis para seleção aleatória inicial
const availableColors = [
  'bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-purple-100',
  'bg-pink-100', 'bg-orange-100', 'bg-teal-100', 'bg-red-100',
  'bg-indigo-100', 'bg-cyan-100'
]

function getRandomColor() {
  const randomIndex = Math.floor(Math.random() * availableColors.length)
  return availableColors[randomIndex]
}

function ParadasContent() {
  const { 
    unidades, 
    statusFrotas, 
    atualizarCenario, 
    isLoading,
    frotasSelecionadas,
    setFrotasSelecionadas,
    data,
    setData
  } = useParadas()

  const [frotaSelecionada, setFrotaSelecionada] = useState<Frota | null>(null)
  const [modalParada, setModalParada] = useState(false)
  const [modalHistorico, setModalHistorico] = useState(false)
  const [modalSeletor, setModalSeletor] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUnidade, setSelectedUnidade] = useState<string>("todas")
  const [unidadeColors, setUnidadeColors] = useState<Record<string, string>>({})

  // Load saved colors on mount or generate random ones
  useEffect(() => {
    const savedColors = localStorage.getItem('unidadeColors')
    if (savedColors) {
      setUnidadeColors(JSON.parse(savedColors))
    } else {
      // Generate random colors for units that don't have one
      const newColors = unidades.reduce((acc, unidade) => {
        if (!acc[unidade.id]) {
          acc[unidade.id] = getRandomColor()
        }
        return acc
      }, {} as Record<string, string>)
      setUnidadeColors(newColors)
      localStorage.setItem('unidadeColors', JSON.stringify(newColors))
    }
  }, [unidades])

  // Save colors when they change
  const updateUnidadeColor = (unidadeId: string, color: string) => {
    const newColors = { ...unidadeColors, [unidadeId]: color }
    setUnidadeColors(newColors)
    localStorage.setItem('unidadeColors', JSON.stringify(newColors))
  }

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

  // Agrupar e filtrar frotas por unidade
  const frotasPorUnidade = unidades.reduce((acc, unidade) => {
    if (selectedUnidade !== "todas" && unidade.id !== selectedUnidade) {
      acc[unidade.id] = []
      return acc
    }

    const frotasFiltradas = (unidade.frotas || [])
      .filter(frota => frotasSelecionadas.has(frota.id))
      .filter(frota => 
        searchTerm === "" || 
        frota.frota.toLowerCase().includes(searchTerm.toLowerCase()) ||
        frota.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      )

    acc[unidade.id] = frotasFiltradas
    return acc
  }, {} as Record<string, Frota[]>)

  const hoje = new Date().toISOString().split('T')[0]
  const dataFormatada = format(new Date(data), "dd 'de' MMMM", { locale: ptBR })

  return (
    <div className="h-screen flex flex-col">
      {/* Header com controles - mesma altura do logo */}
      <div className="h-[64px] bg-white border-b flex items-center px-2">
        <div className="flex items-center gap-6 w-full">
          {/* Barra de pesquisa - estilo Tratativas */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar frota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-gray-50 border-0 focus-visible:ring-0 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:ring-black/10"
            />
          </div>

          {/* Filtro de data */}
          <Select value={data} onValueChange={setData}>
            <SelectTrigger className="h-10 w-[200px]">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <SelectValue>{data === hoje ? "Hoje" : dataFormatada}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={hoje}>Hoje</SelectItem>
              {/* Adicionar mais opções de data conforme necessário */}
            </SelectContent>
          </Select>

          {/* Filtro de unidade */}
          <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
            <SelectTrigger className="h-10 w-[200px]">
              <SelectValue placeholder="Todas as unidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as unidades</SelectItem>
              {unidades.map((unidade) => (
                <SelectItem key={unidade.id} value={unidade.id}>
                  {unidade.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Botões de ação */}
          <Button
            variant="outline"
            className="h-10 w-[200px]"
            onClick={() => setModalSeletor(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
          <Button
            variant="outline"
            className="h-10 w-[200px]"
            onClick={atualizarCenario}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Área de conteúdo com colunas */}
      <div className="flex-1 px-2 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 h-full">
          {unidades.map((unidade, index) => {
            const frotasUnidade = frotasPorUnidade[unidade.id]
            if (!frotasUnidade?.length) return null

            const bgColor = unidadeColors[unidade.id] || getRandomColor()

            return (
              <div
                key={unidade.id}
                className={`flex flex-col rounded-lg ${bgColor} min-h-0`}
              >
                {/* Cabeçalho da coluna */}
                <div className="p-4 border-b bg-white/50 backdrop-blur-sm rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <ColorPicker
                      color={unidadeColors[unidade.id] || getRandomColor()}
                      onChange={(color) => updateUnidadeColor(unidade.id, color)}
                    />
                    <h3 className="font-semibold flex-1">{unidade.nome}</h3>
                    <span className="text-sm text-gray-500">
                      {frotasUnidade.length} {frotasUnidade.length === 1 ? 'frota' : 'frotas'}
                    </span>
                  </div>
                </div>

                {/* Lista de frotas */}
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-2">
                    {frotasUnidade.map((frota) => {
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
                  <ScrollBar />
                </ScrollArea>
              </div>
            )
          })}
        </div>
      </div>

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

      <SeletorFrotasModal
        open={modalSeletor}
        onOpenChange={setModalSeletor}
        unidades={unidades}
        frotasSelecionadas={frotasSelecionadas}
        onSelectionChange={setFrotasSelecionadas}
      />
    </div>
  )
}

export default function ParadasPage() {
  return (
    <ParadasProvider>
      <ParadasContent />
    </ParadasProvider>
  )
} 