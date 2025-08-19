"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Calculator, X, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { CavFormData, CavFrotaData, CavTurnoData, FRENTES_CONFIG } from "@/types/cav"
import { funcionariosService } from "@/services/funcionariosService"
import { FuncionarioSearchResult } from "@/types/funcionarios"
import { v4 as uuidv4 } from "uuid"

interface NovoCavModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCavAdded: () => void
}

export function NovoCavModal({ open, onOpenChange, onCavAdded }: NovoCavModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Data padrão: ontem
  const getYesterday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
  }

  // Estados do formulário
  const [formData, setFormData] = useState<CavFormData>({
    data: getYesterday(),
    frente: "",
    lamina_alvo: 2.5,
    total_viagens_feitas: 0,
    frotas: []
  })

  // Estados para validação
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})
  const [showErrorAnimation, setShowErrorAnimation] = useState(false)

  // Estados para busca de funcionários (por turno)
  const [funcionarioStates, setFuncionarioStates] = useState<Record<string, {
    suggestions: FuncionarioSearchResult[]
    showSuggestions: boolean
    isSearching: boolean
    selectedFuncionario: FuncionarioSearchResult | null
  }>>({})

  // Resetar formulário quando modal abre/fecha
  useEffect(() => {
    if (open) {
      setFormData({
        data: getYesterday(),
        frente: "",
        lamina_alvo: 2.5,
        total_viagens_feitas: 0,
        frotas: []
      })
      setFieldErrors({})
      setShowErrorAnimation(false)
      setFuncionarioStates({})
    }
  }, [open])

  // Atualizar frotas quando frente muda
  const handleFrenteChange = (frente: string) => {
    const config = FRENTES_CONFIG.find(f => f.nome === frente)
    const frotasPadrao = config?.frotas_padrao || [0]

    // Criar frotas padrão com turnos A, B, C
    const novasFrotas: CavFrotaData[] = frotasPadrao.map(numeroFrota => ({
      frota: numeroFrota,
      turnos: [
        { id: uuidv4(), turno: 'A', operador: '', producao: 0 },
        { id: uuidv4(), turno: 'B', operador: '', producao: 0 },
        { id: uuidv4(), turno: 'C', operador: '', producao: 0 }
      ]
    }))

    setFormData(prev => ({
      ...prev,
      frente,
      frotas: novasFrotas
    }))
  }

  // Adicionar nova frota
  const adicionarFrota = () => {
    const novaFrota: CavFrotaData = {
      frota: 0,
      turnos: [
        { id: uuidv4(), turno: 'A', operador: '', producao: 0 },
        { id: uuidv4(), turno: 'B', operador: '', producao: 0 },
        { id: uuidv4(), turno: 'C', operador: '', producao: 0 }
      ]
    }

    setFormData(prev => ({
      ...prev,
      frotas: [...prev.frotas, novaFrota]
    }))
  }

  // Remover frota
  const removerFrota = (index: number) => {
    setFormData(prev => ({
      ...prev,
      frotas: prev.frotas.filter((_, i) => i !== index)
    }))
  }

  // Adicionar turno a uma frota
  const adicionarTurno = (frotaIndex: number) => {
    const novoTurno: CavTurnoData = {
      id: uuidv4(),
      turno: 'D', // Padrão para turnos extras
      operador: '',
      producao: 0
    }

    setFormData(prev => ({
      ...prev,
      frotas: prev.frotas.map((frota, index) => 
        index === frotaIndex ? {
          ...frota,
          turnos: [...frota.turnos, novoTurno]
        } : frota
      )
    }))
  }

  // Remover turno
  const removerTurno = (frotaIndex: number, turnoId: string) => {
    setFormData(prev => ({
      ...prev,
      frotas: prev.frotas.map((frota, index) => 
        index === frotaIndex ? {
          ...frota,
          turnos: frota.turnos.filter(turno => turno.id !== turnoId)
        } : frota
      )
    }))
  }

  // Atualizar dados da frota
  const atualizarFrota = (frotaIndex: number, campo: keyof CavFrotaData, valor: any) => {
    setFormData(prev => ({
      ...prev,
      frotas: prev.frotas.map((frota, index) => 
        index === frotaIndex ? { ...frota, [campo]: valor } : frota
      )
    }))
  }

  // Atualizar dados do turno
  const atualizarTurno = (frotaIndex: number, turnoId: string, campo: keyof CavTurnoData, valor: any) => {
    setFormData(prev => ({
      ...prev,
      frotas: prev.frotas.map((frota, fIndex) => 
        fIndex === frotaIndex ? {
          ...frota,
          turnos: frota.turnos.map(turno => 
            turno.id === turnoId ? { ...turno, [campo]: valor } : turno
          )
        } : frota
      )
    }))
  }

  // Busca dinâmica de funcionários
  const handleFuncionarioSearch = async (turnoId: string, query: string) => {
    if (!query || query.trim().length < 2) {
      setFuncionarioStates(prev => ({
        ...prev,
        [turnoId]: {
          suggestions: [],
          showSuggestions: false,
          isSearching: false,
          selectedFuncionario: null
        }
      }))
      return
    }

    setFuncionarioStates(prev => ({
      ...prev,
      [turnoId]: {
        ...prev[turnoId],
        isSearching: true
      }
    }))

    try {
      const suggestions = await funcionariosService.buscarFuncionarios(query)
      setFuncionarioStates(prev => ({
        ...prev,
        [turnoId]: {
          suggestions,
          showSuggestions: suggestions.length > 0,
          isSearching: false,
          selectedFuncionario: prev[turnoId]?.selectedFuncionario || null
        }
      }))
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error)
      setFuncionarioStates(prev => ({
        ...prev,
        [turnoId]: {
          suggestions: [],
          showSuggestions: false,
          isSearching: false,
          selectedFuncionario: null
        }
      }))
    }
  }

  // Selecionar funcionário
  const handleFuncionarioSelect = (frotaIndex: number, turnoId: string, funcionario: FuncionarioSearchResult) => {
    setFuncionarioStates(prev => ({
      ...prev,
      [turnoId]: {
        ...prev[turnoId],
        selectedFuncionario: funcionario,
        showSuggestions: false
      }
    }))

    // Atualizar operador no turno
    atualizarTurno(frotaIndex, turnoId, 'operador', funcionario.nome)
  }

  // Calcular totais para preview
  const calcularTotais = () => {
    const totalProducao = formData.frotas.reduce((total, frota) => 
      total + frota.turnos.reduce((frotaTotal, turno) => frotaTotal + turno.producao, 0), 0
    )
    
    const totalFrotas = formData.frotas.length
    
    return { totalProducao, totalFrotas }
  }

  // Validar formulário
  const validarFormulario = () => {
    const erros: Record<string, boolean> = {}

    if (!formData.data) erros.data = true
    if (!formData.frente) erros.frente = true
    if (formData.lamina_alvo <= 0) erros.lamina_alvo = true
    if (formData.total_viagens_feitas <= 0) erros.total_viagens_feitas = true
    if (formData.frotas.length === 0) erros.frotas = true

    // Validar frotas
    formData.frotas.forEach((frota, fIndex) => {
      if (!frota.frota || frota.frota <= 0) {
        erros[`frota_${fIndex}`] = true
      }
      
      // Verificar se pelo menos um turno tem produção > 0
      const temProducao = frota.turnos.some(turno => turno.producao > 0)
      if (!temProducao) {
        erros[`frota_${fIndex}_sem_producao`] = true
      }
    })

    // Verificar frotas duplicadas
    const frotasNumeros = formData.frotas.map(f => f.frota).filter(f => f > 0)
    const frotasDuplicadas = frotasNumeros.filter((frota, index) => frotasNumeros.indexOf(frota) !== index)
    if (frotasDuplicadas.length > 0) {
      erros.frotas_duplicadas = true
    }

    setFieldErrors(erros)
    
    if (Object.keys(erros).length > 0) {
      setShowErrorAnimation(true)
      setTimeout(() => setShowErrorAnimation(false), 2000)
      return false
    }
    
    return true
  }

  // Submeter formulário
  const handleSubmit = async () => {
    if (!validarFormulario()) return

    try {
      setIsSubmitting(true)

      const response = await fetch('/api/cav/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar boletim CAV')
      }

      toast({
        title: "Sucesso!",
        description: `Boletim CAV criado com ${result.dados.registros_granulares} registros granulares`,
      })

      onCavAdded()
      onOpenChange(false)

    } catch (error) {
      console.error('Erro ao submeter CAV:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar boletim CAV",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getErrorClass = (fieldName: string) => {
    return fieldErrors[fieldName] && showErrorAnimation 
      ? "border-red-500 border-2 animate-pulse" 
      : ""
  }

  const { totalProducao, totalFrotas } = calcularTotais()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Novo Boletim CAV</DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 flex-1 min-h-0">
          {/* Seção principal - esquerda */}
          <div className="flex-1 flex flex-col space-y-4 min-h-0">
            {/* Campos do cabeçalho */}
            <div className="grid grid-cols-4 gap-4 flex-shrink-0">
              <div>
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                  className={getErrorClass("data")}
                  required
                />
              </div>

              <div>
                <Label htmlFor="frente">Frente</Label>
                <Select value={formData.frente} onValueChange={handleFrenteChange} required>
                  <SelectTrigger className={getErrorClass("frente")}>
                    <SelectValue placeholder="Selecione a frente" />
                  </SelectTrigger>
                  <SelectContent>
                    {FRENTES_CONFIG.map((config) => (
                      <SelectItem key={config.nome} value={config.nome}>
                        {config.nome} ({config.frotas_padrao.length} frotas)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="lamina_alvo">Lâmina Alvo</Label>
                <Input
                  id="lamina_alvo"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.lamina_alvo}
                  onChange={(e) => setFormData(prev => ({ ...prev, lamina_alvo: Number(e.target.value) }))}
                  className={getErrorClass("lamina_alvo")}
                  required
                />
              </div>

              <div>
                <Label htmlFor="total_viagens_feitas">Viagens Feitas</Label>
                <Input
                  id="total_viagens_feitas"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.total_viagens_feitas}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_viagens_feitas: Number(e.target.value) }))}
                  className={getErrorClass("total_viagens_feitas")}
                  required
                />
              </div>
            </div>

            {/* Seção de Frotas */}
            {formData.frente && (
              <div className="flex-1 flex flex-col space-y-4 min-h-0">
                <div className="flex items-center justify-between flex-shrink-0">
                  <h3 className="text-lg font-semibold">Dados de Produção</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={adicionarFrota}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Frota
                  </Button>
                </div>

                {fieldErrors.frotas && (
                  <div className="text-red-500 text-sm flex-shrink-0">
                    Adicione pelo menos uma frota
                  </div>
                )}

                {fieldErrors.frotas_duplicadas && (
                  <div className="text-red-500 text-sm flex-shrink-0">
                    Frotas duplicadas não são permitidas
                  </div>
                )}

                <div className="space-y-4 overflow-y-auto flex-1">
                  {formData.frotas.map((frota, frotaIndex) => (
                    <Card key={frotaIndex} className={`${getErrorClass(`frota_${frotaIndex}`)}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Label className="text-base font-semibold">
                              Frota {frotaIndex + 1}
                            </Label>
                            <Input
                              type="number"
                              placeholder="Número da frota"
                              value={frota.frota || ""}
                              onChange={(e) => atualizarFrota(frotaIndex, 'frota', Number(e.target.value))}
                              className="w-32"
                              min="1"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => adicionarTurno(frotaIndex)}
                              className="flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Turno
                            </Button>
                            {formData.frotas.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removerFrota(frotaIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {fieldErrors[`frota_${frotaIndex}_sem_producao`] && (
                          <div className="text-red-500 text-sm">
                            Pelo menos um turno deve ter produção maior que 0
                          </div>
                        )}
                      </CardHeader>
                      <CardContent>
                        {/* Cabeçalho da tabela */}
                        <div className="grid grid-cols-5 gap-2 mb-3 font-semibold text-sm">
                          <div className="text-center">Turno</div>
                          <div className="text-center">Operador</div>
                          <div className="text-center">Produção (ha)</div>
                          <div className="text-center">Total</div>
                          <div className="text-center">Ações</div>
                        </div>
                        
                        {/* Turnos */}
                        {frota.turnos.map((turno, turnoIndex) => {
                          const turnoKey = `${frotaIndex}-${turno.id}`
                          const funcionarioState = funcionarioStates[turnoKey] || {
                            suggestions: [],
                            showSuggestions: false,
                            isSearching: false,
                            selectedFuncionario: null
                          }

                          return (
                            <div key={turno.id} className="grid grid-cols-5 gap-2 mb-2">
                              {/* Turno editável */}
                              <div className="flex items-center justify-center">
                                <Input
                                  value={turno.turno}
                                  onChange={(e) => atualizarTurno(frotaIndex, turno.id, 'turno', e.target.value)}
                                  className="w-12 text-center font-semibold"
                                  maxLength={2}
                                />
                              </div>

                              {/* Operador com busca dinâmica */}
                              <div className="relative">
                                <div className="flex items-center gap-1">
                                  <Input
                                    placeholder="Digite o nome..."
                                    value={turno.operador}
                                    onChange={(e) => {
                                      atualizarTurno(frotaIndex, turno.id, 'operador', e.target.value)
                                      handleFuncionarioSearch(turnoKey, e.target.value)
                                    }}
                                    onFocus={() => {
                                      if (turno.operador.length >= 2) {
                                        setFuncionarioStates(prev => ({
                                          ...prev,
                                          [turnoKey]: {
                                            ...prev[turnoKey],
                                            showSuggestions: funcionarioState.suggestions.length > 0
                                          }
                                        }))
                                      }
                                    }}
                                    onBlur={() => {
                                      setTimeout(() => {
                                        setFuncionarioStates(prev => ({
                                          ...prev,
                                          [turnoKey]: {
                                            ...prev[turnoKey],
                                            showSuggestions: false
                                          }
                                        }))
                                      }, 200)
                                    }}
                                    className="text-center"
                                    autoComplete="off"
                                  />

                                  {/* Botão de limpar */}
                                  {funcionarioState.selectedFuncionario && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        setFuncionarioStates(prev => ({
                                          ...prev,
                                          [turnoKey]: {
                                            suggestions: [],
                                            showSuggestions: false,
                                            isSearching: false,
                                            selectedFuncionario: null
                                          }
                                        }))
                                        atualizarTurno(frotaIndex, turno.id, 'operador', '')
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}

                                  {/* Loading spinner */}
                                  {funcionarioState.isSearching && (
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                  )}
                                </div>

                                {/* Lista de sugestões */}
                                {funcionarioState.showSuggestions && funcionarioState.suggestions.length > 0 && (
                                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                    {funcionarioState.suggestions.map((funcionario) => (
                                      <button
                                        key={funcionario.id}
                                        type="button"
                                        className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                        onClick={() => handleFuncionarioSelect(frotaIndex, turno.id, funcionario)}
                                      >
                                        <div className="font-medium">{funcionario.nome}</div>
                                        <div className="text-sm text-gray-500">{funcionario.funcao} - {funcionario.unidade}</div>
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* Mensagem quando não há resultados */}
                                {funcionarioState.showSuggestions && funcionarioState.suggestions.length === 0 && turno.operador.length >= 2 && !funcionarioState.isSearching && (
                                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                                    <div className="px-4 py-3 text-gray-500 text-center">
                                      Nenhum funcionário encontrado
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Produção */}
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={turno.producao || ""}
                                onChange={(e) => atualizarTurno(frotaIndex, turno.id, 'producao', Number(e.target.value))}
                                className="text-center"
                              />

                              {/* Total */}
                              <div className="flex items-center justify-center font-mono text-sm">
                                {turno.producao.toFixed(2)} ha
                              </div>

                              {/* Ações */}
                              <div className="flex items-center justify-center">
                                {frota.turnos.length > 3 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removerTurno(frotaIndex, turno.id)}
                                    className="h-6 w-6 p-0 text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                        
                        {/* Total da frota */}
                        <div className="border-t pt-3 mt-3">
                          <div className="grid grid-cols-5 gap-2">
                            <div></div>
                            <div></div>
                            <div className="font-semibold text-center">Total Frota:</div>
                            <div className="font-bold text-center text-blue-600">
                              {frota.turnos.reduce((sum, turno) => sum + turno.producao, 0).toFixed(2)} ha
                            </div>
                            <div></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-black hover:bg-black/90 text-white"
              >
                {isSubmitting ? "Processando..." : "Criar Boletim CAV"}
              </Button>
            </div>
          </div>

          {/* Resumo parcial - direita */}
          {formData.frente && (
            <div className="w-80 flex-shrink-0">
              <Card className="bg-blue-50 h-full flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Resumo Parcial
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-4">
                  {/* Valores principais */}
                  <div className="space-y-3">
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{totalFrotas}</div>
                      <div className="text-sm text-gray-600 font-medium">Frotas</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{totalProducao.toFixed(2)}</div>
                      <div className="text-sm text-gray-600 font-medium">Hectares Aplicados</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">{formData.lamina_alvo}</div>
                      <div className="text-sm text-gray-600 font-medium">Lâmina Alvo</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-3xl font-bold text-orange-600">{formData.total_viagens_feitas}</div>
                      <div className="text-sm text-gray-600 font-medium">Viagens Feitas</div>
                    </div>
                  </div>

                  {/* Cálculos de preview */}
                  {totalProducao > 0 && formData.total_viagens_feitas > 0 && (
                    <div className="border-t pt-4 space-y-3 flex-1">
                      <h4 className="font-semibold text-center">Cálculos Preview</h4>
                      
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-lg font-bold text-indigo-600">
                          {((totalProducao * formData.lamina_alvo) / 60).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-600">Viagens Orçadas</div>
                      </div>
                      
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-lg font-bold text-teal-600">
                          {((formData.total_viagens_feitas * 60) / totalProducao).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-600">Lâmina Aplicada</div>
                      </div>
                      
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-lg font-bold text-red-600">
                          {((1 - ((totalProducao * formData.lamina_alvo) / 60) / formData.total_viagens_feitas) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Dif. Viagens %</div>
                      </div>
                      
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-lg font-bold text-amber-600">
                          {((1 - formData.lamina_alvo / ((formData.total_viagens_feitas * 60) / totalProducao)) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Dif. Lâmina %</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}