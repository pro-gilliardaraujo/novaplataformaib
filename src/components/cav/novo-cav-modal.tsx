"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Calculator } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { CavFormData, CavFrotaData, CavTurnoData, FRENTES_CONFIG } from "@/types/cav"

interface NovoCavModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCavAdded: () => void
}

export function NovoCavModal({ open, onOpenChange, onCavAdded }: NovoCavModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estados do formulário
  const [formData, setFormData] = useState<CavFormData>({
    data: new Date().toISOString().split('T')[0], // Data atual
    codigo: "",
    frente: "",
    lamina_alvo: 2.5, // Valor padrão, usuário pode alterar
    total_viagens_feitas: 0,
    frotas: []
  })

  // Estados para validação
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})
  const [showErrorAnimation, setShowErrorAnimation] = useState(false)

  // Resetar formulário quando modal abre/fecha
  useEffect(() => {
    if (open) {
      setFormData({
        data: new Date().toISOString().split('T')[0],
        codigo: "",
        frente: "",
        lamina_alvo: 2.5,
        total_viagens_feitas: 0,
        frotas: []
      })
      setFieldErrors({})
      setShowErrorAnimation(false)
    }
  }, [open])

  // Atualizar frotas quando frente muda
  const handleFrenteChange = (frente: string) => {
    const config = FRENTES_CONFIG.find(f => f.nome === frente)
    const frotasPadrao = config?.frotas_padrao || 1

    // Criar frotas padrão com turnos vazios
    const novasFrotas: CavFrotaData[] = Array.from({ length: frotasPadrao }, (_, index) => ({
      frota: 0, // Usuário vai preencher
      turnos: [
        { turno: 'A', operador: '', producao: 0 },
        { turno: 'B', operador: '', producao: 0 },
        { turno: 'C', operador: '', producao: 0 }
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
        { turno: 'A', operador: '', producao: 0 },
        { turno: 'B', operador: '', producao: 0 },
        { turno: 'C', operador: '', producao: 0 }
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
  const atualizarTurno = (frotaIndex: number, turnoIndex: number, campo: keyof CavTurnoData, valor: any) => {
    setFormData(prev => ({
      ...prev,
      frotas: prev.frotas.map((frota, fIndex) => 
        fIndex === frotaIndex ? {
          ...frota,
          turnos: frota.turnos.map((turno, tIndex) => 
            tIndex === turnoIndex ? { ...turno, [campo]: valor } : turno
          )
        } : frota
      )
    }))
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
    if (!formData.codigo.trim()) erros.codigo = true
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
            {/* Campos principais */}
            <div className="grid grid-cols-5 gap-4 flex-shrink-0">
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
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  placeholder="12345-6789"
                  value={formData.codigo}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                  className={getErrorClass("codigo")}
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
                        {config.nome} ({config.frotas_padrao} frotas)
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
                <Label htmlFor="total_viagens_feitas">Total Viagens Feitas</Label>
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
                  <h3 className="text-lg font-semibold">Frotas da {formData.frente}</h3>
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
                          <CardTitle className="text-base">
                            Frota {frotaIndex + 1}
                            {frota.frota > 0 && (
                              <Badge variant="outline" className="ml-2">
                                #{frota.frota}
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="Número da frota"
                              value={frota.frota || ""}
                              onChange={(e) => atualizarFrota(frotaIndex, 'frota', Number(e.target.value))}
                              className="w-32"
                              min="1"
                            />
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
                        {/* Tabela de turnos */}
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          <div className="font-semibold text-center">Turno</div>
                          <div className="font-semibold text-center">Operador</div>
                          <div className="font-semibold text-center">Produção (ha)</div>
                          <div className="font-semibold text-center">Total Turno</div>
                        </div>
                        
                        {frota.turnos.map((turno, turnoIndex) => (
                          <div key={turno.turno} className="grid grid-cols-4 gap-2 mb-2">
                            <div className="flex items-center justify-center">
                              <Badge variant="outline">{turno.turno}</Badge>
                            </div>
                            <Input
                              placeholder="Nome do operador"
                              value={turno.operador}
                              onChange={(e) => atualizarTurno(frotaIndex, turnoIndex, 'operador', e.target.value)}
                              className="text-center"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={turno.producao || ""}
                              onChange={(e) => atualizarTurno(frotaIndex, turnoIndex, 'producao', Number(e.target.value))}
                              className="text-center"
                            />
                            <div className="flex items-center justify-center font-mono">
                              {turno.producao.toFixed(2)} ha
                            </div>
                          </div>
                        ))}
                        
                        {/* Total da frota */}
                        <div className="border-t pt-2 mt-2">
                          <div className="grid grid-cols-4 gap-2">
                            <div></div>
                            <div></div>
                            <div className="font-semibold text-center">Total Frota:</div>
                            <div className="font-bold text-center text-blue-600">
                              {frota.turnos.reduce((sum, turno) => sum + turno.producao, 0).toFixed(2)} ha
                            </div>
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