"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
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

  // Função para selecionar todo o texto ao focar (equivalente a Ctrl+A)
  const handleFocusSelect = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  // Navegação tipo Excel
  const getInputId = (frotaIndex: number, turnoId: string, campo: 'codigo' | 'lamina' | 'operador' | 'producao') => {
    return `${campo}_${frotaIndex}_${turnoId}`
  }

  const getNextInput = (currentFrotaIndex: number, currentTurnoId: string, currentCampo: 'codigo' | 'lamina' | 'operador' | 'producao', direction: 'down' | 'up' | 'right' | 'left') => {
    const campos = ['codigo', 'lamina', 'operador', 'producao'] as const
    const currentCampoIndex = campos.indexOf(currentCampo)
    
    if (direction === 'right') {
      // Tab: próximo campo na mesma linha
      if (currentCampoIndex < campos.length - 1) {
        return getInputId(currentFrotaIndex, currentTurnoId, campos[currentCampoIndex + 1])
      } else {
        // Se está no último campo, vai para o primeiro campo da próxima linha
        const currentTurnoIndex = formData.frotas[currentFrotaIndex]?.turnos.findIndex(t => t.id === currentTurnoId) ?? -1
        if (currentTurnoIndex < formData.frotas[currentFrotaIndex]?.turnos.length - 1) {
          const nextTurno = formData.frotas[currentFrotaIndex].turnos[currentTurnoIndex + 1]
          return getInputId(currentFrotaIndex, nextTurno.id, 'codigo')
        } else if (currentFrotaIndex < formData.frotas.length - 1) {
          const nextFrota = formData.frotas[currentFrotaIndex + 1]
          return getInputId(currentFrotaIndex + 1, nextFrota.turnos[0].id, 'codigo')
        }
      }
    } else if (direction === 'left') {
      // Shift+Tab: campo anterior na mesma linha
      if (currentCampoIndex > 0) {
        return getInputId(currentFrotaIndex, currentTurnoId, campos[currentCampoIndex - 1])
      } else {
        // Se está no primeiro campo, vai para o último campo da linha anterior
        const currentTurnoIndex = formData.frotas[currentFrotaIndex]?.turnos.findIndex(t => t.id === currentTurnoId) ?? -1
        if (currentTurnoIndex > 0) {
          const prevTurno = formData.frotas[currentFrotaIndex].turnos[currentTurnoIndex - 1]
          return getInputId(currentFrotaIndex, prevTurno.id, 'producao')
        } else if (currentFrotaIndex > 0) {
          const prevFrota = formData.frotas[currentFrotaIndex - 1]
          const lastTurno = prevFrota.turnos[prevFrota.turnos.length - 1]
          return getInputId(currentFrotaIndex - 1, lastTurno.id, 'producao')
        }
      }
    } else if (direction === 'down') {
      // Enter: próximo turno na mesma coluna
      const currentTurnoIndex = formData.frotas[currentFrotaIndex]?.turnos.findIndex(t => t.id === currentTurnoId) ?? -1
      if (currentTurnoIndex < formData.frotas[currentFrotaIndex]?.turnos.length - 1) {
        const nextTurno = formData.frotas[currentFrotaIndex].turnos[currentTurnoIndex + 1]
        return getInputId(currentFrotaIndex, nextTurno.id, currentCampo)
      } else if (currentFrotaIndex < formData.frotas.length - 1) {
        const nextFrota = formData.frotas[currentFrotaIndex + 1]
        return getInputId(currentFrotaIndex + 1, nextFrota.turnos[0].id, currentCampo)
      }
    } else if (direction === 'up') {
      // Shift+Enter: turno anterior na mesma coluna
      const currentTurnoIndex = formData.frotas[currentFrotaIndex]?.turnos.findIndex(t => t.id === currentTurnoId) ?? -1
      if (currentTurnoIndex > 0) {
        const prevTurno = formData.frotas[currentFrotaIndex].turnos[currentTurnoIndex - 1]
        return getInputId(currentFrotaIndex, prevTurno.id, currentCampo)
      } else if (currentFrotaIndex > 0) {
        const prevFrota = formData.frotas[currentFrotaIndex - 1]
        const lastTurno = prevFrota.turnos[prevFrota.turnos.length - 1]
        return getInputId(currentFrotaIndex - 1, lastTurno.id, currentCampo)
      }
    }
    
    return null
  }

  const handleKeyNavigation = (e: React.KeyboardEvent, frotaIndex: number, turnoId: string, campo: 'codigo' | 'lamina' | 'operador' | 'producao') => {
    let nextInputId: string | null = null

    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        nextInputId = getNextInput(frotaIndex, turnoId, campo, 'up')
      } else {
        nextInputId = getNextInput(frotaIndex, turnoId, campo, 'down')
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        nextInputId = getNextInput(frotaIndex, turnoId, campo, 'left')
      } else {
        nextInputId = getNextInput(frotaIndex, turnoId, campo, 'right')
      }
    }

    if (nextInputId) {
      setTimeout(() => {
        const nextInput = document.getElementById(nextInputId!) as HTMLInputElement
        if (nextInput) {
          nextInput.focus()
          // Seleciona todo o texto na nova célula (equivalente a Ctrl+A)
          nextInput.select()
        }
      }, 10)
    }
  }
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
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set())

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
        setValidationErrors(new Set())
        setShowErrorAnimation(false)
        setFuncionarioStates({})
    }
  }, [open])

  // Atualizar frotas quando frente muda
  const handleFrenteChange = (frente: string) => {
    const config = FRENTES_CONFIG.find(f => f.nome === frente)
    const frotasPadrao = config?.frotas_padrao || [0]

    // Criar frotas padrão com turnos - Ouroeste inicia C, A, B; outros A, B, C
    const turnosOrdem = frente.includes('Ouroeste') 
      ? ['C', 'A', 'B'] 
      : ['A', 'B', 'C']
    
    const novasFrotas: CavFrotaData[] = frotasPadrao.map(numeroFrota => ({
      frota: numeroFrota,
      turnos: turnosOrdem.map(turno => ({
        id: uuidv4(), 
        turno, 
        codigo_fazenda: '',
        operador: '', 
        producao: 0,
        lamina_alvo: "" // Valor padrão de lâmina
      }))
    }))

    setFormData(prev => ({
      ...prev,
      frente,
      frotas: novasFrotas
    }))
  }

  // Adicionar nova frota
  const adicionarFrota = () => {
    // Usar mesma ordem de turnos baseada na frente selecionada
    const turnosOrdem = formData.frente.includes('Ouroeste') 
      ? ['C', 'A', 'B'] 
      : ['A', 'B', 'C']
    
    const novaFrota: CavFrotaData = {
      frota: 0,
      turnos: turnosOrdem.map(turno => ({
        id: uuidv4(), 
        turno, 
        codigo_fazenda: '',
        operador: '', 
        producao: 0,
        lamina_alvo: "" // Valor padrão de lâmina
      }))
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
      turno: 'A', // Padrão A
      codigo_fazenda: '',
      operador: '',
      producao: 0,
      lamina_alvo: "" // Valor padrão de lâmina
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
    console.log('🔍 Validando formulário...')
    console.log('📊 Dados do formulário:', formData)
    
    const erros: Record<string, boolean> = {}

    if (!formData.data) {
      console.log('❌ Data não preenchida')
      erros.data = true
    }
    if (!formData.frente) {
      console.log('❌ Frente não preenchida')
      erros.frente = true
    }
    if (formData.total_viagens_feitas <= 0) {
      console.log('❌ Total de viagens feitas inválido:', formData.total_viagens_feitas)
      erros.total_viagens_feitas = true
    }
    if (formData.frotas.length === 0) {
      console.log('❌ Nenhuma frota adicionada')
      erros.frotas = true
    }

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
      console.log('❌ Erros de validação encontrados:', erros)
      setShowErrorAnimation(true)
      setTimeout(() => setShowErrorAnimation(false), 2000)
      return false
    }
    
    console.log('✅ Formulário válido!')
    return true
  }

  // Submeter formulário
  const handleSubmit = async () => {
    console.log('🚀 Iniciando criação do boletim...')
    
    // Validar campos obrigatórios
    if (!validateRequiredFields()) {
      console.log('❌ Validação de campos obrigatórios falhou')
      setShowErrorAnimation(true)
      
      // Remover animação após 2 segundos
      setTimeout(() => {
        setShowErrorAnimation(false)
      }, 2000)
      
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos destacados em vermelho.",
        variant: "destructive"
      })
      return
    }

    if (!validarFormulario()) {
      console.log('❌ Validação do formulário falhou')
      return
    }

    try {
      console.log('✅ Validações passaram, enviando dados...')
      setIsSubmitting(true)

      const response = await fetch('/api/cav/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      console.log('📡 Resposta recebida:', response.status)
      const result = await response.json()
      console.log('📄 Dados da resposta:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar boletim CAV')
      }

      console.log('✅ Boletim criado com sucesso!')
      toast({
        title: "Sucesso!",
        description: `Boletim CAV criado com ${result.dados.registros_granulares} registros granulares`,
      })

      onCavAdded()
      onOpenChange(false)

    } catch (error) {
      console.error('❌ Erro ao submeter CAV:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar boletim CAV",
        variant: "destructive"
      })
    } finally {
      console.log('🔄 Finalizando processo de criação')
      setIsSubmitting(false)
    }
  }

  const getErrorClass = (fieldName: string) => {
    return validationErrors.has(fieldName) && showErrorAnimation 
      ? "border-red-500 border-2 animate-pulse" 
      : ""
  }

  // Validar todos os campos obrigatórios
  const validateRequiredFields = () => {
    const errors = new Set<string>()

    // Campos do cabeçalho
    if (!formData.data || formData.data.trim() === '') {
      errors.add('data')
    }
    if (!formData.frente || formData.frente.trim() === '') {
      errors.add('frente')
    }
    if (!formData.total_viagens_feitas || formData.total_viagens_feitas <= 0) {
      errors.add('total_viagens_feitas')
    }

    // Validar frotas
    if (formData.frotas.length === 0) {
      errors.add('frotas')
    }

    formData.frotas.forEach((frota, frotaIndex) => {
      // Validar número da frota
      if (!frota.frota || frota.frota <= 0) {
        errors.add(`frota_${frotaIndex}_numero`)
      }

      // Verificar se tem pelo menos um turno com operador preenchido
      const temOperadorPreenchido = frota.turnos.some(turno => 
        turno.operador && turno.operador.trim() !== "" && turno.operador !== "Não Op."
      )
      
      if (!temOperadorPreenchido) {
        errors.add(`frota_${frotaIndex}_sem_operador`)
      }

      // Validar cada turno
      frota.turnos.forEach((turno) => {
        const turnoKey = `frota_${frotaIndex}_turno_${turno.id}`
        
        // Se tem operador, deve ter código da fazenda
        if (turno.operador && turno.operador.trim() !== "" && turno.operador !== "Não Op.") {
          if (!turno.codigo_fazenda || turno.codigo_fazenda.trim() === '') {
            errors.add(`${turnoKey}_codigo`)
          }
        }
      })
    })

    setValidationErrors(errors)
    return errors.size === 0
  }

  const { totalProducao, totalFrotas } = calcularTotais()

  return (
    <Dialog open={open} onOpenChange={(open) => open && onOpenChange(open)} modal>
      <DialogContent 
        className="max-w-[75vw] h-[90vh] flex flex-col p-0" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex items-center px-4 h-12 border-b relative">
          <div className="flex-1 text-center">
            <span className="text-base font-medium">Novo Boletim CAV</span>
          </div>
          <DialogClose asChild>
            <Button 
              variant="outline"
              className="h-8 w-8 p-0 absolute right-2 top-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>

        <div className="flex gap-3 flex-1 min-h-0 p-3">
          {/* Seção principal - esquerda */}
          <div className="flex-1 flex flex-col space-y-2 min-h-0 pr-3">
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
                <Label htmlFor="total_viagens_feitas">Viagens Feitas</Label>
                <Input
                  id="total_viagens_feitas"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.total_viagens_feitas}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_viagens_feitas: Number(e.target.value) }))}
                  onFocus={handleFocusSelect}
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

                {validationErrors.has('frotas') && (
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
                        {/* Linha 1: Frota e Botões */}
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-bold">Frota:</Label>
                            <Input
                              type="number"
                              placeholder="Número"
                              value={frota.frota || ""}
                              onChange={(e) => atualizarFrota(frotaIndex, 'frota', Number(e.target.value))}
                              onFocus={handleFocusSelect}
                              className={`w-20 text-center font-semibold ${getErrorClass(`frota_${frotaIndex}_numero`)}`}
                              min="1"
                            />
                          </div>
                          
                          <div className="flex items-center gap-1">
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

                        {/* Linha 2: Labels das Colunas */}
                        <div className="grid grid-cols-[auto_1fr_1fr_1.5fr_1fr] gap-2 mb-2 items-center">
                          {/* Coluna 1: Label Turno */}
                          <div className="flex items-center justify-center text-center font-semibold text-sm">
                            Turno
                          </div>

                          {/* Coluna 2: Label Código */}
                          <div className="flex items-center justify-center text-center font-semibold text-sm">
                            Código (faz)
                          </div>

                          {/* Coluna 3: Label Lâmina */}
                          <div className="flex items-center justify-center text-center font-semibold text-sm">
                            Lâmina (m³)
                          </div>

                          {/* Coluna 4: Label Operador */}
                          <div className="flex items-center justify-center text-center font-semibold text-sm">
                            Operador
                          </div>

                          {/* Coluna 5: Label Produção */}
                          <div className="flex items-center justify-center text-center font-semibold text-sm">
                            Produção (ha)
                          </div>
                        </div>

                        {validationErrors.has(`frota_${frotaIndex}_sem_operador`) && (
                          <div className="text-red-500 text-sm mb-1">
                            Pelo menos um turno deve ter operador preenchido
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
                            <div key={turno.id} className="grid grid-cols-[auto_1fr_1fr_1.5fr_1fr] gap-2 mb-1">
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
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Código da fazenda */}
                              <Input
                                id={getInputId(frotaIndex, turno.id, 'codigo')}
                                placeholder="Código..."
                                value={turno.codigo_fazenda || ""}
                                onChange={(e) => atualizarTurno(frotaIndex, turno.id, 'codigo_fazenda', e.target.value)}
                                onFocus={handleFocusSelect}
                                onKeyDown={(e) => handleKeyNavigation(e, frotaIndex, turno.id, 'codigo')}
                                className={`text-center ${getErrorClass(`frota_${frotaIndex}_turno_${turno.id}_codigo`)}`}
                              />

                              {/* Lâmina */}
                              <Input
                                id={getInputId(frotaIndex, turno.id, 'lamina')}
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="0.00"
                                value={turno.lamina_alvo || ""}
                                onChange={(e) => atualizarTurno(frotaIndex, turno.id, 'lamina_alvo', Number(e.target.value))}
                                onFocus={handleFocusSelect}
                                onKeyDown={(e) => handleKeyNavigation(e, frotaIndex, turno.id, 'lamina')}
                                className="text-center"
                              />

                              {/* Operador com busca dinâmica */}
                              <div className="relative">
                                <div className="flex items-center gap-1">
                                  <Input
                                    id={getInputId(frotaIndex, turno.id, 'operador')}
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
                                    onKeyDown={(e) => {
                                      // Se não está mostrando sugestões, permite navegação
                                      if (!funcionarioState.showSuggestions) {
                                        handleKeyNavigation(e, frotaIndex, turno.id, 'operador')
                                      }
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
                              <div className="flex items-center gap-1">
                                <Input
                                  id={getInputId(frotaIndex, turno.id, 'producao')}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={turno.producao || ""}
                                  onChange={(e) => atualizarTurno(frotaIndex, turno.id, 'producao', Number(e.target.value))}
                                  onFocus={handleFocusSelect}
                                  onKeyDown={(e) => handleKeyNavigation(e, frotaIndex, turno.id, 'producao')}
                                  className="text-center"
                                />
                                {/* Botão de remover turno (somente se mais de 3 turnos) */}
                                {frota.turnos.length > 3 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => confirmarRemoverTurno(frotaIndex, turno.id)}
                                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
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
                                    <div className="text-center text-sm">
                                      {(() => {
                                        const totaisPorCodigo = frota.turnos.reduce((acc, turno) => {
                                          if (turno.codigo_fazenda && turno.producao > 0) {
                                            acc[turno.codigo_fazenda] = (acc[turno.codigo_fazenda] || 0) + turno.producao
                                          }
                                          return acc
                                        }, {} as Record<string, number>)
                                        
                                        const codigosComProducao = Object.entries(totaisPorCodigo)
                                        const totalFrota = frota.turnos.reduce((sum, turno) => sum + turno.producao, 0)
                                        
                                        return (
                                          <div>
                                            {codigosComProducao.map(([codigo, total], index) => (
                                              <span key={codigo} className="text-xs text-gray-600">
                                                Código {codigo}: {total.toFixed(2)} ha
                                                {index < codigosComProducao.length - 1 ? ' | ' : ''}
                                              </span>
                                            ))}
                                            {codigosComProducao.length > 0 && ' | '}
                                            <span className="font-semibold">Total Frota: </span>
                                            <span className="font-bold text-blue-600">{totalFrota.toFixed(2)} ha</span>
                                          </div>
                                        )
                                      })()}
                                    </div>
                                  </div>


                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Resumo parcial - direita */}
          {formData.frente && (
            <div className="w-[25.2rem] flex-shrink-0 flex flex-col max-h-full">
              <Card className="bg-gray-50 flex-1 flex flex-col min-h-0">
                <CardContent className="flex-1 flex flex-col min-h-0 p-2">
                  {/* Resumo em formato texto simples */}
<div id="resumo-cav" className="bg-white p-1 rounded-lg border font-sans text-sm leading-relaxed select-all flex-1 overflow-y-auto">
                    <div className="space-y-1">
                      <div><span className="text-blue-600">📅</span> <strong>Data:</strong> {new Date(formData.data + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                      <div><span className="text-blue-600">🏭</span> <strong>Frente:</strong> {formData.frente}</div>
                      
                      {/* Mostra códigos únicos utilizados */}
                      {(() => {
                        const codigosUnicos = new Set(
                          formData.frotas.flatMap(frota => 
                            frota.turnos
                              .filter(turno => turno.operador && turno.operador.trim() !== "" && turno.operador !== "Não Op.")
                              .map(turno => turno.codigo_fazenda || 'Padrão')
                          )
                        )
                        if (codigosUnicos.size > 0) {
                          return (
                            <div><span className="text-blue-600">🏷️</span> <strong>Códigos:</strong> {Array.from(codigosUnicos).join(', ')}</div>
                          )
                        }
                        return null
                      })()}

                      {/* Mostra lâminas únicas utilizadas */}
                      {(() => {
                        const laminasUnicas = new Set(
                          formData.frotas.flatMap(frota => 
                            frota.turnos
                              .filter(turno => turno.operador && turno.operador.trim() !== "" && turno.operador !== "Não Op.")
                              .map(turno => turno.lamina_alvo?.toString() || '10')
                          )
                        )
                        if (laminasUnicas.size > 0) {
                          return (
                            <div><span className="text-blue-600">💧</span> <strong>Lâminas Alvo:</strong> {Array.from(laminasUnicas).map(l => `${l} m³`).join(', ')}</div>
                          )
                        }
                        return null
                      })()}
                      
                      {formData.frotas.some(frota => frota.turnos.some(turno => turno.producao > 0)) && (
                        <div className="mt-3 pt-2 border-t">
                          <div className="text-green-600 text-center">🚜 <strong>APLICAÇÃO</strong></div>
                        </div>
                      )}

                      {formData.frotas.map((frota, index) => {
                        const totalFrota = frota.turnos.reduce((sum, turno) => sum + turno.producao, 0)
                        const turnosComProducao = frota.turnos.filter(turno => turno.producao > 0)
                        
                        if (turnosComProducao.length === 0) return null
                        
                        return (
                          <div key={index} className="mt-2">
                            <div><span className="text-green-600">🚜</span> <strong>Frota {frota.frota}:</strong></div>
                            {turnosComProducao.map((turno, tIndex) => {
                              // Verifica se há múltiplos códigos para decidir se mostra
                              const todosCodigosUsados = formData.frotas.flatMap(f => 
                                f.turnos
                                  .filter(t => t.operador && t.operador.trim() !== "" && t.operador !== "Não Op.")
                                  .map(t => t.codigo_fazenda || '')
                              )
                              const codigosUnicos = new Set(todosCodigosUsados.filter(c => c.trim() !== ''))
                              const mostrarCodigo = codigosUnicos.size > 1 && turno.codigo_fazenda && turno.codigo_fazenda.trim() !== ''
                              
                              return (
                                <div key={tIndex} className="ml-4">
                                  <div>• Turno {turno.turno}: {turno.operador} - {turno.producao.toFixed(2)} ha</div>
                                  {mostrarCodigo && (
                                    <div className="ml-6 text-xs text-blue-600">
                                      Código: {turno.codigo_fazenda}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                            <div className="ml-4 text-blue-600 mt-2">
                              📊 <strong>Total Frota: {totalFrota.toFixed(2)} ha</strong>
                            </div>
                          </div>
                        )
                      })}

                      {totalProducao > 0 && (
                        <div className="mt-3 pt-2 border-t">
                          {/* Totais por código no resumo geral */}
                          {(() => {
                            const totaisGeraisPorCodigo = formData.frotas.reduce((acc, frota) => {
                              frota.turnos.forEach(turno => {
                                if (turno.codigo_fazenda && turno.producao > 0) {
                                  acc[turno.codigo_fazenda] = (acc[turno.codigo_fazenda] || 0) + turno.producao
                                }
                              })
                              return acc
                            }, {} as Record<string, number>)
                            
                            const codigosComProducao = Object.entries(totaisGeraisPorCodigo)
                            
                            if (codigosComProducao.length > 0) {
                              return (
                                <div className="space-y-1 mb-2">
                                  {codigosComProducao.map(([codigo, total]) => (
                                    <div key={codigo} className="text-blue-600">
                                      📋 <strong>Código {codigo}: {total.toFixed(2)} ha</strong>
                                    </div>
                                  ))}
                                </div>
                              )
                            }
                            return null
                          })()}
                          
                          <div className="text-green-600 text-center">🎯 <strong>TOTAL GERAL: {totalProducao.toFixed(2)} ha</strong></div>
                        </div>
                      )}

                      {(() => {
                        // Calcular lâmina média ponderada pela produção
                        let laminaMediaPonderada = 0
                        let totalViagensOrcadas = 0
                        
                        if (totalProducao > 0) {
                          let somaLaminaProducao = 0
                          
                          formData.frotas.forEach(frota => {
                            frota.turnos.forEach(turno => {
                              if (turno.producao > 0 && turno.lamina_alvo > 0) {
                                somaLaminaProducao += turno.lamina_alvo * turno.producao
                                totalViagensOrcadas += (turno.producao * turno.lamina_alvo) / 60
                              }
                            })
                          })
                          
                          laminaMediaPonderada = somaLaminaProducao / totalProducao
                        }
                        
                        if (totalProducao > 0 && formData.total_viagens_feitas > 0 && laminaMediaPonderada > 0) {
                          const laminaAplicada = (formData.total_viagens_feitas * 60) / totalProducao
                          const diferencaLamina = laminaAplicada - laminaMediaPonderada
                          const percentualLamina = ((laminaAplicada - laminaMediaPonderada) / laminaMediaPonderada) * 100
                          
                          const diferencaViagens = formData.total_viagens_feitas - totalViagensOrcadas
                          const percentualViagens = totalViagensOrcadas > 0 ? (diferencaViagens / totalViagensOrcadas) * 100 : 0
                          
                          return (
                            <>
                              {/* Análise - Lâmina */}
                              <div className="mt-3 pt-2 border-t">
                                <div className="text-blue-600 text-center">💧 <strong>LÂMINA</strong></div>
                                <div className="mt-1 space-y-1">
                                  <div><strong>Lâmina Alvo:</strong> {laminaMediaPonderada.toFixed(2)} m³</div>
                                  <div><strong>Lâmina Aplicada:</strong> {laminaAplicada.toFixed(2)} m³</div>
                                  <div><strong>Diferença:</strong> {diferencaLamina.toFixed(2)} m³ ({percentualLamina >= 0 ? '+' : ''}{percentualLamina.toFixed(1)}%)</div>
                                </div>
                              </div>

                              {/* Análise - Viagens */}
                              <div className="mt-3 pt-2 border-t">
                                <div className="text-orange-600 text-center">🚛 <strong>VIAGENS</strong></div>
                                <div className="mt-1 space-y-1">
                                  <div><strong>Viagens Orçadas:</strong> {totalViagensOrcadas.toFixed(2)}</div>
                                  <div><strong>Viagens Feitas:</strong> {formData.total_viagens_feitas}</div>
                                  <div><strong>Diferença:</strong> {diferencaViagens.toFixed(2)} ({percentualViagens >= 0 ? '+' : ''}{percentualViagens.toFixed(1)}%)</div>
                                </div>
                              </div>
                            </>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>

                  {/* Botão para copiar */}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={async () => {
                      try {
                        // Mostrar toast de processamento
                        toast({
                          title: "Processando...",
                          description: "Capturando o resumo completo",
                        })

                        const resumoElement = document.getElementById('resumo-cav')
                        if (!resumoElement) return
                        
                        // Criar um clone oculto que mantém a formatação exata
                        const clone = resumoElement.cloneNode(true) as HTMLElement
                        
                        // Configurar o clone para ser invisível mas manter a formatação exata
                        clone.style.position = 'absolute'
                        clone.style.left = '-9999px'
                        clone.style.top = '-9999px'
                        clone.style.width = resumoElement.offsetWidth + 'px' // Mesma largura do original
                        clone.style.backgroundColor = '#ffffff'
                        clone.style.padding = window.getComputedStyle(resumoElement).padding
                        clone.style.margin = '0'
                        clone.style.border = window.getComputedStyle(resumoElement).border
                        clone.style.borderRadius = window.getComputedStyle(resumoElement).borderRadius
                        clone.style.fontFamily = window.getComputedStyle(resumoElement).fontFamily
                        clone.style.fontSize = window.getComputedStyle(resumoElement).fontSize
                        clone.style.lineHeight = window.getComputedStyle(resumoElement).lineHeight
                        
                        // Adicionar o clone ao DOM (invisível)
                        document.body.appendChild(clone)
                        
                        // Preservar a estrutura interna exata
                        const originalStyles = new Map<HTMLElement, CSSStyleDeclaration>()
                        
                        // Função para copiar estilos computados
                        const copyComputedStyles = (source: HTMLElement, target: HTMLElement) => {
                          const sourceStyle = window.getComputedStyle(source)
                          
                          // Preservar os estilos importantes
                          target.style.display = sourceStyle.display
                          target.style.padding = sourceStyle.padding
                          target.style.margin = sourceStyle.margin
                          target.style.border = sourceStyle.border
                          target.style.fontFamily = sourceStyle.fontFamily
                          target.style.fontSize = sourceStyle.fontSize
                          target.style.fontWeight = sourceStyle.fontWeight
                          target.style.color = sourceStyle.color
                          target.style.backgroundColor = sourceStyle.backgroundColor
                          target.style.textAlign = sourceStyle.textAlign
                          target.style.lineHeight = sourceStyle.lineHeight
                          
                          // Garantir que o conteúdo seja visível
                          target.style.overflow = 'visible'
                          target.style.maxHeight = 'none'
                          target.style.height = 'auto'
                        }
                        
                        // Copiar estilos de todos os elementos internos
                        const originalElements = resumoElement.querySelectorAll('*')
                        const cloneElements = clone.querySelectorAll('*')
                        
                        for (let i = 0; i < Math.min(originalElements.length, cloneElements.length); i++) {
                          if (originalElements[i] instanceof HTMLElement && cloneElements[i] instanceof HTMLElement) {
                            copyComputedStyles(originalElements[i] as HTMLElement, cloneElements[i] as HTMLElement)
                          }
                        }
                        
                        // Importar html2canvas dinamicamente
                        const html2canvas = (await import('html2canvas')).default
                        
                        // Dar tempo para o DOM renderizar completamente
                        await new Promise(resolve => setTimeout(resolve, 300))
                        
                        try {
                          // Capturar o clone (invisível)
                          const canvas = await html2canvas(clone, {
                            backgroundColor: '#ffffff',
                            scale: 2, // Boa resolução sem exagero
                            useCORS: true,
                            allowTaint: true,
                            logging: false
                          })
                          
                          // Remover o clone
                          document.body.removeChild(clone)
                          
                          // Gerar um nome de arquivo significativo
                          const dataFormatada = new Date(formData.data + 'T00:00:00').toLocaleDateString('pt-BR').replace(/\//g, '-')
                          const frenteFormatada = formData.frente.replace(/\s+/g, '_')
                          const codigoFormatado = formData.frotas
                            .flatMap(f => f.turnos)
                            .find(t => t.codigo_fazenda)?.codigo_fazenda || 'sem-codigo'
                          
                          const nomeArquivo = `Boletim_${frenteFormatada}_${dataFormatada}_${codigoFormatado}.png`
                          
                          // Primeiro copiar para a área de transferência
                          canvas.toBlob(async (blob) => {
                            if (!blob) {
                              console.error("Falha ao gerar blob")
                              return
                            }
                            
                            // Copiar para área de transferência
                            try {
                              // Criar um item de clipboard com a imagem
                              const clipboardItem = new ClipboardItem({ 'image/png': blob })
                              await navigator.clipboard.write([clipboardItem])
                              console.log("Imagem copiada para a área de transferência")
                              
                              // Notificar o usuário
                              toast({
                                title: "Copiado!",
                                description: "Imagem copiada para a área de transferência",
                              })
                            } catch (clipboardError) {
                              console.error("Erro ao copiar para clipboard:", clipboardError)
                            }
                            
                            // Sempre fazer o download também
                            const url = URL.createObjectURL(blob)
                            const link = document.createElement('a')
                            link.href = url
                            link.download = nomeArquivo
                            link.style.display = 'none'
                            document.body.appendChild(link)
                            link.click()
                            
                            // Limpar recursos
                            setTimeout(() => {
                              URL.revokeObjectURL(url)
                              document.body.removeChild(link)
                            }, 100)
                            
                            toast({
                              title: "Download concluído!",
                              description: `Arquivo salvo como ${nomeArquivo}`,
                            })
                          }, 'image/png', 1.0) // Qualidade máxima
                        } catch (renderError) {
                          console.error("Erro na renderização:", renderError)
                          if (clone.parentNode) {
                            document.body.removeChild(clone)
                          }
                          throw renderError
                        }
                      } catch (error) {
                        console.error('Erro ao copiar como PNG:', error)
                        toast({
                          title: "Erro",
                          description: "Não foi possível copiar como imagem",
                          variant: "destructive"
                        })
                      }
                    }}
                    className="w-full"
                  >
                    🖼️ Copiar como PNG
                  </Button>
                </CardContent>
              </Card>
              
              {/* Botões de ação */}
              <div className="flex gap-3 pt-3 flex-shrink-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)} 
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    console.log('🖱️ Botão "Criar Boletim" clicado!')
                    handleSubmit()
                  }} 
                  disabled={isSubmitting} 
                  className="bg-black hover:bg-black/90 text-white flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Criando Boletim...
                    </>
                  ) : (
                    "Criar Boletim CAV"
                  )}
                </Button>
              </div>
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