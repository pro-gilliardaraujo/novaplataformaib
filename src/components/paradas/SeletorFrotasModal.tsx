"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Unidade, Frota } from "@/types/paradas"
import { ChevronDown, ChevronRight, X, ChevronDownSquare, ChevronRightSquare, CheckSquare, Square } from "lucide-react"

interface SeletorFrotasModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unidades: Unidade[]
  frotasSelecionadas: Set<string>
  onSelectionChange: (frotaIds: Set<string>) => void
}

export function SeletorFrotasModal({
  open,
  onOpenChange,
  unidades,
  frotasSelecionadas,
  onSelectionChange,
}: SeletorFrotasModalProps) {
  const [selectedFrotas, setSelectedFrotas] = useState<Set<string>>(new Set(frotasSelecionadas))
  const [expandedUnidades, setExpandedUnidades] = useState<Set<string>>(new Set())

  // Agrupar frotas por unidade
  const frotasPorUnidade = unidades.reduce((acc, unidade) => {
    acc[unidade.id] = unidade.frotas || []
    return acc
  }, {} as Record<string, Frota[]>)

  // Get all frotas
  const allFrotas = unidades.flatMap(unidade => unidade.frotas || [])

  const handleToggleFrota = (frotaId: string) => {
    const newSelection = new Set(selectedFrotas)
    if (newSelection.has(frotaId)) {
      newSelection.delete(frotaId)
    } else {
      newSelection.add(frotaId)
    }
    setSelectedFrotas(newSelection)
  }

  const handleToggleUnidade = (unidadeId: string) => {
    const frotas = frotasPorUnidade[unidadeId] || []
    if (frotas.length === 0) return // Don't handle empty unidades
    
    const newSelection = new Set(selectedFrotas)
    const allSelected = frotas.every(frota => selectedFrotas.has(frota.id))

    if (allSelected) {
      // Remove todas as frotas da unidade
      frotas.forEach(frota => newSelection.delete(frota.id))
    } else {
      // Adiciona todas as frotas da unidade
      frotas.forEach(frota => newSelection.add(frota.id))
    }

    setSelectedFrotas(newSelection)
  }

  const toggleExpand = (unidadeId: string) => {
    const newExpanded = new Set(expandedUnidades)
    if (newExpanded.has(unidadeId)) {
      newExpanded.delete(unidadeId)
    } else {
      newExpanded.add(unidadeId)
    }
    setExpandedUnidades(newExpanded)
  }

  const handleExpandAll = () => {
    const allExpanded = unidades.length === expandedUnidades.size
    if (allExpanded) {
      setExpandedUnidades(new Set())
    } else {
      setExpandedUnidades(new Set(unidades.map(u => u.id)))
    }
  }

  const handleSelectAll = () => {
    const allFrotas = unidades.flatMap(unidade => unidade.frotas || [])
    const allSelected = allFrotas.every(frota => selectedFrotas.has(frota.id))
    
    if (allSelected) {
      setSelectedFrotas(new Set())
    } else {
      setSelectedFrotas(new Set(allFrotas.map(f => f.id)))
    }
  }

  const handleSave = () => {
    onSelectionChange(selectedFrotas)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setSelectedFrotas(new Set(frotasSelecionadas))
    onOpenChange(false)
  }

  // Check if all items are expanded/selected
  const allExpanded = unidades.length === expandedUnidades.size
  const allSelected = allFrotas.every(frota => selectedFrotas.has(frota.id))

  // Only show unidades with frotas
  const unidadesWithFrotas = unidades.filter(unidade => 
    (unidade.frotas || []).length > 0
  )

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-3xl">
        <div>
          <div className="flex items-center">
            <div className="flex-1" />
            <DialogTitle className="flex-1 text-center">Atualizar Cenário</DialogTitle>
            <div className="flex-1 flex justify-end">
              <DialogClose asChild>
                <Button 
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
          <div className="border-b mt-4" />
        </div>

        <div className="space-y-4">
          {/* Helper buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={handleExpandAll}
            >
              {allExpanded ? (
                <ChevronRightSquare className="h-4 w-4 mr-2" />
              ) : (
                <ChevronDownSquare className="h-4 w-4 mr-2" />
              )}
              {allExpanded ? "Recolher todos" : "Expandir todos"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={handleSelectAll}
            >
              {allSelected ? (
                <Square className="h-4 w-4 mr-2" />
              ) : (
                <CheckSquare className="h-4 w-4 mr-2" />
              )}
              {allSelected ? "Desmarcar todos" : "Selecionar todos"}
            </Button>
          </div>

          <ScrollArea className="h-[60vh]">
            <div className="border rounded-lg divide-y">
              {unidadesWithFrotas.map((unidade) => {
                const isExpanded = expandedUnidades.has(unidade.id)
                const frotas = frotasPorUnidade[unidade.id]
                const allSelected = frotas.every(frota => selectedFrotas.has(frota.id))
                const someSelected = frotas.some(frota => selectedFrotas.has(frota.id))

                return (
                  <div key={unidade.id}>
                    {/* Unidade header */}
                    <div
                      className="flex items-center space-x-2 px-4 py-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleExpand(unidade.id)}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <Checkbox
                        id={`unidade-${unidade.id}`}
                        checked={allSelected}
                        className={someSelected && !allSelected ? "data-[state=checked]:bg-gray-500" : ""}
                        onCheckedChange={() => handleToggleUnidade(unidade.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <label
                        htmlFor={`unidade-${unidade.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {unidade.nome}
                      </label>
                    </div>

                    {/* Frotas list */}
                    {isExpanded && (
                      <div className="bg-gray-50/50">
                        {frotas.map((frota) => (
                          <div
                            key={frota.id}
                            className="flex items-center space-x-2 px-4 py-3 pl-10 hover:bg-gray-100/50"
                          >
                            <Checkbox
                              id={`frota-${frota.id}`}
                              checked={selectedFrotas.has(frota.id)}
                              onCheckedChange={() => handleToggleFrota(frota.id)}
                            />
                            <label
                              htmlFor={`frota-${frota.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {frota.frota} - {frota.descricao}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 