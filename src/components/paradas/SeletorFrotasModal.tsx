"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Unidade, Frota } from "@/types/paradas"

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

  // Agrupar frotas por unidade
  const frotasPorUnidade = unidades.reduce((acc, unidade) => {
    acc[unidade.id] = unidade.frotas || []
    return acc
  }, {} as Record<string, Frota[]>)

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
    const frotas = frotasPorUnidade[unidadeId]
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

  const handleSave = () => {
    onSelectionChange(selectedFrotas)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setSelectedFrotas(new Set(frotasSelecionadas))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Selecionar Frotas</DialogTitle>
        </DialogHeader>

        <div className="py-4">
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

            {unidades.map((unidade) => (
              <TabsContent
                key={unidade.id}
                value={unidade.id}
                className="mt-4"
              >
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {/* Checkbox da unidade */}
                    <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-md">
                      <Checkbox
                        id={`unidade-${unidade.id}`}
                        checked={frotasPorUnidade[unidade.id]?.every(
                          frota => selectedFrotas.has(frota.id)
                        )}
                        onCheckedChange={() => handleToggleUnidade(unidade.id)}
                      />
                      <label
                        htmlFor={`unidade-${unidade.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Selecionar todas as frotas
                      </label>
                    </div>

                    {/* Lista de frotas */}
                    <div className="space-y-2">
                      {frotasPorUnidade[unidade.id]?.map((frota) => (
                        <div
                          key={frota.id}
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 rounded-md"
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
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 