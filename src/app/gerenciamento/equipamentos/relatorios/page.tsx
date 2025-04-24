"use client"

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload } from "lucide-react"
import config from '@/config/relatorios-config.json'

interface Visualizacoes {
  disponibilidadeMecanica: boolean
  eficienciaEnergetica: boolean
  horaElevador?: boolean
  motorOcioso: boolean
  usoGPS: boolean
  faltaApontamento?: boolean
}

interface Frente {
  id: string
  nome: string
  visualizacoes: {
    colheita: Visualizacoes
    transbordo: Visualizacoes
  }
}

interface TipoRelatorio {
  id: string
  nome: string
  frentes: Frente[]
}

export default function RelatoriosPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState(1)
  const [tipoRelatorio, setTipoRelatorio] = useState<string>('')
  const [frenteSelecionada, setFrenteSelecionada] = useState<string>('')
  const [visualizacoes, setVisualizacoes] = useState<{
    colheita: Visualizacoes
    transbordo: Visualizacoes
  }>({
    colheita: {
      disponibilidadeMecanica: false,
      eficienciaEnergetica: false,
      horaElevador: false,
      motorOcioso: false,
      usoGPS: false
    },
    transbordo: {
      disponibilidadeMecanica: false,
      eficienciaEnergetica: false,
      motorOcioso: false,
      faltaApontamento: false,
      usoGPS: false
    }
  })

  // Atualiza as frentes disponíveis quando o tipo de relatório muda
  const frentesDisponiveis = config.tiposRelatorio
    .find(tipo => tipo.id === tipoRelatorio)
    ?.frentes || []

  // Atualiza as visualizações quando a frente é selecionada
  useEffect(() => {
    if (tipoRelatorio && frenteSelecionada) {
      const tipoSelecionado = config.tiposRelatorio.find(tipo => tipo.id === tipoRelatorio)
      const frenteSelecionadaConfig = tipoSelecionado?.frentes.find(
        frente => frente.id === frenteSelecionada
      )

      if (frenteSelecionadaConfig) {
        setVisualizacoes(frenteSelecionadaConfig.visualizacoes)
      }
    }
  }, [tipoRelatorio, frenteSelecionada])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Aqui você iniciaria o processo de upload
    }
  }

  const handleVisualizacaoChange = (
    tipo: 'colheita' | 'transbordo',
    campo: keyof Visualizacoes,
    valor: boolean
  ) => {
    setVisualizacoes(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [campo]: valor
      }
    }))
  }

  return (
    <div className="p-2 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Seção de Opções */}
        <Card className="p-2">
          <h2 className="text-lg font-semibold mb-2 text-center">Opções</h2>
          <div className="space-y-4">
            <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Relatório" />
              </SelectTrigger>
              <SelectContent>
                {config.tiposRelatorio.map(tipo => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={frenteSelecionada} 
              onValueChange={setFrenteSelecionada}
              disabled={!tipoRelatorio}
            >
              <SelectTrigger>
                <SelectValue placeholder="Frente" />
              </SelectTrigger>
              <SelectContent>
                {frentesDisponiveis.map(frente => (
                  <SelectItem key={frente.id} value={frente.id}>
                    {frente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="ontem">Ontem</SelectItem>
                <SelectItem value="personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Seção de Visualização */}
        <Card className="p-2">
          <h2 className="text-lg font-semibold mb-2 text-center">Visualização</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Colheita</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="colheita-disp"
                    checked={visualizacoes.colheita.disponibilidadeMecanica}
                    onCheckedChange={(checked) => 
                      handleVisualizacaoChange('colheita', 'disponibilidadeMecanica', checked as boolean)
                    }
                  />
                  <label htmlFor="colheita-disp">Disponibilidade Mecânica</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="colheita-efic"
                    checked={visualizacoes.colheita.eficienciaEnergetica}
                    onCheckedChange={(checked) => 
                      handleVisualizacaoChange('colheita', 'eficienciaEnergetica', checked as boolean)
                    }
                  />
                  <label htmlFor="colheita-efic">Eficiência Energética</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="colheita-hora"
                    checked={visualizacoes.colheita.horaElevador}
                    onCheckedChange={(checked) => 
                      handleVisualizacaoChange('colheita', 'horaElevador', checked as boolean)
                    }
                  />
                  <label htmlFor="colheita-hora">Hora Elevador</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="colheita-motor"
                    checked={visualizacoes.colheita.motorOcioso}
                    onCheckedChange={(checked) => 
                      handleVisualizacaoChange('colheita', 'motorOcioso', checked as boolean)
                    }
                  />
                  <label htmlFor="colheita-motor">Motor Ocioso</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="colheita-gps"
                    checked={visualizacoes.colheita.usoGPS}
                    onCheckedChange={(checked) => 
                      handleVisualizacaoChange('colheita', 'usoGPS', checked as boolean)
                    }
                  />
                  <label htmlFor="colheita-gps">Uso GPS</label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Transbordo</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="transb-disp"
                    checked={visualizacoes.transbordo.disponibilidadeMecanica}
                    onCheckedChange={(checked) => 
                      handleVisualizacaoChange('transbordo', 'disponibilidadeMecanica', checked as boolean)
                    }
                  />
                  <label htmlFor="transb-disp">Disponibilidade Mecânica</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="transb-efic"
                    checked={visualizacoes.transbordo.eficienciaEnergetica}
                    onCheckedChange={(checked) => 
                      handleVisualizacaoChange('transbordo', 'eficienciaEnergetica', checked as boolean)
                    }
                  />
                  <label htmlFor="transb-efic">Eficiência Energética</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="transb-motor"
                    checked={visualizacoes.transbordo.motorOcioso}
                    onCheckedChange={(checked) => 
                      handleVisualizacaoChange('transbordo', 'motorOcioso', checked as boolean)
                    }
                  />
                  <label htmlFor="transb-motor">Motor Ocioso</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="transb-falta"
                    checked={visualizacoes.transbordo.faltaApontamento}
                    onCheckedChange={(checked) => 
                      handleVisualizacaoChange('transbordo', 'faltaApontamento', checked as boolean)
                    }
                  />
                  <label htmlFor="transb-falta">Falta de Apontamento</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="transb-gps"
                    checked={visualizacoes.transbordo.usoGPS}
                    onCheckedChange={(checked) => 
                      handleVisualizacaoChange('transbordo', 'usoGPS', checked as boolean)
                    }
                  />
                  <label htmlFor="transb-gps">Uso GPS</label>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Seção de Upload */}
        <Card className="p-2">
          <h2 className="text-lg font-semibold mb-2 text-center">Upload do arquivo Monit</h2>
          <div 
            className="border-2 border-dashed rounded-lg p-2 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".zip"
              onChange={handleFileChange}
            />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {selectedFile ? (
              <p className="text-sm text-gray-600">{selectedFile.name}</p>
            ) : (
              <p className="text-sm text-gray-600">Clique ou arraste o arquivo aqui</p>
            )}
          </div>
        </Card>
      </div>

      {/* Seção de Progresso */}
      <Card className="p-2">
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div className="text-center">
            <div className={`font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>
              1 - Processando Zip
            </div>
            <div className="text-sm text-gray-500">colhedorasFrenteX-2304.zip</div>
          </div>
          <div className="text-center">
            <div className={`font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>
              2 - Processando .xlsx
            </div>
            <div className="text-sm text-gray-500">colhedorasFrenteX-2304.xlsx</div>
          </div>
          <div className="text-center">
            <div className={`font-medium ${step >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>
              3 - Registrando dados
            </div>
            <div className="text-sm text-gray-500">gravando dados na base</div>
          </div>
          <div className="text-center">
            <div className={`font-medium ${step >= 4 ? 'text-blue-600' : 'text-gray-500'}`}>
              4 - Gerando relatório
            </div>
            <div className="text-sm text-gray-500">Preenchendo cards, gráficos e tabelas</div>
          </div>
        </div>
        <Progress value={progress} className="w-full" />
      </Card>
    </div>
  )
} 