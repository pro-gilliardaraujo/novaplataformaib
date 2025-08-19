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
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
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
    lamina_alvo: 0,
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

  // Estados para confirmação de exclusão
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    type: 'frota' | 'turno'
    frotaIndex?: number
    turnoId?: string
    frotaNumero?: number
  }>({
    open: false,
    type: 'frota'
  })

  // Resetar formulário quando modal abre/fecha
  useEffect(() => {
    if (open) {
      const newFormData = {
        data: getYesterday(),
        frente: "",
        lamina_alvo: 0,
        total_viagens_feitas: 0,
        frotas: []
      }
      console.log("Resetando formulário com lamina_alvo:", newFormData.lamina_alvo)
      setFormData(newFormData)
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

  // Confirmar remoção de frota
  const confirmarRemoverFrota = (index: number) => {
    const frota = formData.frotas[index]
    setDeleteDialog({
      open: true,
      type: 'frota',
      frotaIndex: index,
      frotaNumero: frota.frota
    })
  }

  // Remover frota
  const removerFrota = () => {
    if (deleteDialog.frotaIndex !== undefined) {
      setFormData(prev => ({
        ...prev,
        frotas: prev.frotas.filter((_, i) => i !== deleteDialog.frotaIndex)
      }))
    }
    setDeleteDialog({ open: false, type: 'frota' })
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

  // Confirmar remoção de turno
  const confirmarRemoverTurno = (frotaIndex: number, turnoId: string) => {
    const frota = formData.frotas[frotaIndex]
    const turno = frota.turnos.find(t => t.id === turnoId)
    setDeleteDialog({
      open: true,
      type: 'turno',
      frotaIndex,
      turnoId,
      frotaNumero: frota.frota
    })
  }

  // Remover turno
  const removerTurno = () => {
    if (deleteDialog.frotaIndex !== undefined && deleteDialog.turnoId) {
      setFormData(prev => ({
        ...prev,
        frotas: prev.frotas.map((frota, index) => 
          index === deleteDialog.frotaIndex ? {
            ...frota,
            turnos: frota.turnos.filter(turno => turno.id !== deleteDialog.turnoId)
          } : frota
        )
      }))
    }
    setDeleteDialog({ open: false, type: 'turno' })
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
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-3">
        <DialogHeader className="flex-shrink-0 pb-1">
          <DialogTitle>Novo Boletim CAV</DialogTitle>
        </DialogHeader>

        <div className="flex gap-3 flex-1 min-h-0">
          {/* Seção principal - esquerda */}
          <div className="flex-1 flex flex-col space-y-2 min-h-0">
            {/* Campos do cabeçalho */}
            <div className="grid grid-cols-4 gap-2 flex-shrink-0">
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
                        {config.nome}
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
              <div className="flex-1 flex flex-col space-y-2 min-h-0">
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

                <div className="space-y-2 overflow-y-auto flex-1">
                  {formData.frotas.map((frota, frotaIndex) => (
                    <Card key={frotaIndex} className={`${getErrorClass(`frota_${frotaIndex}`)}`}>
                      <CardContent className="pt-2 pb-2">
                        {/* Cabeçalho da frota integrado com os inputs */}
                        <div className="grid grid-cols-[auto_1.5fr_1fr_auto] gap-2 mb-1">
                          {/* Coluna 1: Label + Input da Frota */}
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-semibold whitespace-nowrap">
                              Frota {frotaIndex + 1}:
                            </Label>
                            <Input
                              type="number"
                              placeholder="Número"
                              value={frota.frota || ""}
                              onChange={(e) => atualizarFrota(frotaIndex, 'frota', Number(e.target.value))}
                              className="w-20 text-center font-semibold"
                              min="1"
                            />
                          </div>

                          {/* Coluna 2: Label Operador (50% maior) */}
                          <div className="text-center font-semibold text-sm">
                            Operador
                          </div>

                          {/* Coluna 3: Label Produção (50% menor) */}
                          <div className="text-center font-semibold text-sm">
                            Produção (ha)
                          </div>

                          {/* Coluna 4: Botões */}
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => adicionarTurno(frotaIndex)}
                              className="flex items-center gap-1 text-xs px-2 py-1"
                            >
                              <Plus className="h-3 w-3" />
                              Turno
                            </Button>
                            {formData.frotas.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => confirmarRemoverFrota(frotaIndex)}
                                className="px-2 py-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {fieldErrors[`frota_${frotaIndex}_sem_producao`] && (
                          <div className="text-red-500 text-sm mb-1">
                            Pelo menos um turno deve ter produção maior que 0
                          </div>
                        )}
                        
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
                            <div key={turno.id} className="grid grid-cols-[auto_1.5fr_1fr_auto] gap-2 mb-1">
                              {/* Turno selecionável - alinhado com label da frota */}
                              <div className="flex items-center justify-start pl-2">
                                <Select
                                  value={turno.turno}
                                  onValueChange={(value) => atualizarTurno(frotaIndex, turno.id, 'turno', value)}
                                >
                                  <SelectTrigger className="w-16 text-center font-semibold">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="A">A</SelectItem>
                                    <SelectItem value="B">B</SelectItem>
                                    <SelectItem value="C">C</SelectItem>
                                    <SelectItem value="D">D</SelectItem>
                                    <SelectItem value="E">E</SelectItem>
                                    <SelectItem value="F">F</SelectItem>
                                  </SelectContent>
                                </Select>
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

                                {/* Lista de sugestões com largura flexível */}
                                {funcionarioState.showSuggestions && funcionarioState.suggestions.length > 0 && (
                                  <div className="absolute z-50 left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto min-w-[300px] max-w-[400px]">
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
                                  <div className="absolute z-50 left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-[300px]">
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

                              {/* Ações */}
                              <div className="flex items-center justify-center">
                                {frota.turnos.length > 3 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => confirmarRemoverTurno(frotaIndex, turno.id)}
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
                        <div className="border-t pt-1 mt-1">
                          <div className="grid grid-cols-[auto_1.5fr_1fr_auto] gap-2">
                            <div></div>
                            <div className="font-semibold text-center text-sm">Total Frota:</div>
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
            <div className="flex justify-end gap-3 pt-2 border-t flex-shrink-0">
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
            <div className="w-80 flex-shrink-0 flex flex-col max-h-full">
              <Card className="bg-blue-50 flex-1 flex flex-col min-h-0">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Resumo Parcial
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-3 min-h-0">
                  {/* Resumo em formato texto */}
                  <div className="bg-white p-3 rounded-lg border font-mono text-xs leading-relaxed select-all flex-1 overflow-y-auto">
                    <div className="font-bold text-center mb-2 text-sm">📋 BOLETIM CAV</div>
                    
                    {/* Cabeçalho */}
                    <div className="mb-2">
                      <strong>📅 Data:</strong> {new Date(formData.data + 'T00:00:00').toLocaleDateString('pt-BR')}<br/>
                      <strong>🏭 Frente:</strong> {formData.frente}<br/>
                      <strong>💧 Lâmina Alvo:</strong> {formData.lamina_alvo} mm
                    </div>

                    {/* Frotas */}
                    {formData.frotas.map((frota, index) => {
                      const totalFrota = frota.turnos.reduce((sum, turno) => sum + turno.producao, 0)
                      return (
                        <div key={index} className="mb-2 border-l-2 border-blue-300 pl-2">
                          <strong>🚜 Frota {frota.frota}:</strong><br/>
                          {frota.turnos.map((turno, tIndex) => (
                            turno.producao > 0 && (
                              <div key={tIndex} className="ml-2">
                                • Turno {turno.turno}: {turno.operador} - {turno.producao.toFixed(2)} ha<br/>
                              </div>
                            )
                          ))}
                          <div className="ml-2 font-semibold text-blue-600">
                            📊 Total Frota: {totalFrota.toFixed(2)} ha
                          </div>
                        </div>
                      )
                    })}

                    {/* Total Geral */}
                    <div className="border-t pt-2 mt-2">
                      <strong className="text-green-600">🎯 TOTAL GERAL: {totalProducao.toFixed(2)} ha</strong>
                    </div>

                    {/* Cálculos */}
                    {totalProducao > 0 && formData.total_viagens_feitas > 0 && formData.lamina_alvo > 0 && (
                      <div className="border-t pt-2 mt-2">
                        <div className="font-bold mb-1">📈 ANÁLISE:</div>
                        
                        {/* Lâminas */}
                        <div className="mb-1">
                          <strong>Lâmina Orçada:</strong> {formData.lamina_alvo} mm<br/>
                          <strong>Lâmina Aplicada:</strong> {((formData.total_viagens_feitas * 60) / totalProducao).toFixed(2)} mm<br/>
                          <strong>Diferença:</strong> {(((formData.total_viagens_feitas * 60) / totalProducao) - formData.lamina_alvo).toFixed(2)} mm ({((1 - formData.lamina_alvo / ((formData.total_viagens_feitas * 60) / totalProducao)) * 100).toFixed(1)}%)
                        </div>
                        
                        {/* Viagens */}
                        <div>
                          <strong>Viagens Orçadas:</strong> {((totalProducao * formData.lamina_alvo) / 60).toFixed(2)}<br/>
                          <strong>Viagens Feitas:</strong> {formData.total_viagens_feitas}<br/>
                          <strong>Diferença:</strong> {(formData.total_viagens_feitas - ((totalProducao * formData.lamina_alvo) / 60)).toFixed(2)} ({((1 - ((totalProducao * formData.lamina_alvo) / 60) / formData.total_viagens_feitas) * 100).toFixed(1)}%)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botão para copiar */}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const resumoElement = document.querySelector('.select-all')
                      if (resumoElement) {
                        navigator.clipboard.writeText(resumoElement.textContent || '')
                        toast({
                          title: "Copiado!",
                          description: "Resumo copiado para a área de transferência",
                        })
                      }
                    }}
                    className="w-full"
                  >
                    📋 Copiar Resumo
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Modal de confirmação de exclusão */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        title={deleteDialog.type === 'frota' ? 'Excluir Frota' : 'Excluir Turno'}
        description={
          deleteDialog.type === 'frota' 
            ? `Tem certeza que deseja excluir a Frota ${deleteDialog.frotaNumero || ''}? Todos os turnos desta frota serão removidos.`
            : `Tem certeza que deseja excluir este turno da Frota ${deleteDialog.frotaNumero || ''}?`
        }
        onConfirm={deleteDialog.type === 'frota' ? removerFrota : removerTurno}
        confirmText="Excluir"
        variant="destructive"
      />
    </Dialog>
  )
}