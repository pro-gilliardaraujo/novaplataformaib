"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

interface EditarTratativaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTratativaEdited: () => void
  tratativaData: {
    id: string
    numero_tratativa: string
    funcionario: string
    data_infracao: string
    hora_infracao: string
    codigo_infracao: string
    descricao_infracao: string
    penalidade: string
    lider: string
    status: string
    texto_infracao: string
    texto_limite: string
    funcao: string
    setor: string
    medida: string
    valor_praticado: string
  }
}

export function EditarTratativaModal({
  open,
  onOpenChange,
  onTratativaEdited,
  tratativaData,
}: EditarTratativaModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const data = {
        numero_tratativa: formData.get("numero_tratativa"),
        funcionario: formData.get("funcionario"),
        data_infracao: formData.get("data_infracao"),
        hora_infracao: formData.get("hora_infracao"),
        codigo_infracao: formData.get("codigo_infracao"),
        descricao_infracao: formData.get("descricao_infracao"),
        penalidade: formData.get("penalidade"),
        lider: formData.get("lider"),
        texto_infracao: formData.get("texto_infracao"),
        texto_limite: formData.get("texto_limite"),
        funcao: formData.get("funcao"),
        setor: formData.get("setor"),
        medida: formData.get("medida"),
        valor_praticado: formData.get("valor_praticado"),
      }

      const { error } = await supabase
        .from("tratativas")
        .update(data)
        .eq("id", tratativaData.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Tratativa atualizada com sucesso!",
      })

      onTratativaEdited()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar tratativa. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Tratativa #{tratativaData.numero_tratativa}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_tratativa">Número da Tratativa</Label>
                  <Input
                    id="numero_tratativa"
                    name="numero_tratativa"
                    defaultValue={tratativaData.numero_tratativa}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="funcionario">Funcionário</Label>
                  <Input
                    id="funcionario"
                    name="funcionario"
                    defaultValue={tratativaData.funcionario}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="funcao">Função</Label>
                  <Input
                    id="funcao"
                    name="funcao"
                    defaultValue={tratativaData.funcao}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setor">Setor</Label>
                  <Input
                    id="setor"
                    name="setor"
                    defaultValue={tratativaData.setor}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_infracao">Data da Infração</Label>
                  <Input
                    id="data_infracao"
                    name="data_infracao"
                    type="date"
                    defaultValue={tratativaData.data_infracao}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora_infracao">Hora da Infração</Label>
                  <Input
                    id="hora_infracao"
                    name="hora_infracao"
                    type="time"
                    defaultValue={tratativaData.hora_infracao}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo_infracao">Código da Infração</Label>
                  <Input
                    id="codigo_infracao"
                    name="codigo_infracao"
                    defaultValue={tratativaData.codigo_infracao}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao_infracao">Descrição da Infração</Label>
                  <Input
                    id="descricao_infracao"
                    name="descricao_infracao"
                    defaultValue={tratativaData.descricao_infracao}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="penalidade">Penalidade</Label>
                  <Input
                    id="penalidade"
                    name="penalidade"
                    defaultValue={tratativaData.penalidade}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lider">Líder</Label>
                  <Input
                    id="lider"
                    name="lider"
                    defaultValue={tratativaData.lider}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medida">Medida</Label>
                  <Input
                    id="medida"
                    name="medida"
                    defaultValue={tratativaData.medida}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_praticado">Valor Praticado</Label>
                  <Input
                    id="valor_praticado"
                    name="valor_praticado"
                    defaultValue={tratativaData.valor_praticado}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="texto_infracao">Texto da Infração</Label>
                <Textarea
                  id="texto_infracao"
                  name="texto_infracao"
                  defaultValue={tratativaData.texto_infracao}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="texto_limite">Texto do Limite</Label>
                <Textarea
                  id="texto_limite"
                  name="texto_limite"
                  defaultValue={tratativaData.texto_limite}
                  required
                />
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 