"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { z } from "zod"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  numero_tratativa: z.string().min(1, "Campo obrigatório"),
  funcionario: z.string().min(1, "Campo obrigatório"),
  data_infracao: z.string().min(1, "Campo obrigatório"),
  hora_infracao: z.string().min(1, "Campo obrigatório"),
  setor: z.string().min(1, "Campo obrigatório"),
  lider: z.string().min(1, "Campo obrigatório"),
  codigo_infracao: z.string().min(1, "Campo obrigatório"),
  infracao_cometida: z.string().min(1, "Campo obrigatório"),
  penalidade: z.string().min(1, "Campo obrigatório"),
  penalidade_aplicada: z.string().min(1, "Campo obrigatório"),
  observacoes: z.string().optional(),
  justificativa: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface NovaTratativaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTratativaAdded: () => void
}

export function NovaTratativaModal({
  open,
  onOpenChange,
  onTratativaAdded,
}: NovaTratativaModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero_tratativa: "",
      funcionario: "",
      data_infracao: format(new Date(), "yyyy-MM-dd"),
      hora_infracao: format(new Date(), "HH:mm"),
      setor: "",
      lider: "",
      codigo_infracao: "",
      infracao_cometida: "",
      penalidade: "",
      penalidade_aplicada: "",
      observacoes: "",
      justificativa: "",
    },
  })

  async function onSubmit(data: FormValues) {
    try {
      setIsSubmitting(true)
      const response = await fetch("/api/tratativas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          status: "ENVIADA",
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao criar tratativa")
      }

      form.reset()
      onOpenChange(false)
      onTratativaAdded()
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tratativa</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para criar uma nova tratativa.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numero_tratativa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da Tratativa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="funcionario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funcionário</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do funcionário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_infracao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Infração</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hora_infracao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora da Infração</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="setor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PRODUCAO">Produção</SelectItem>
                        <SelectItem value="MANUTENCAO">Manutenção</SelectItem>
                        <SelectItem value="QUALIDADE">Qualidade</SelectItem>
                        <SelectItem value="LOGISTICA">Logística</SelectItem>
                        <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Líder</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do líder" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="codigo_infracao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código da Infração</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: INF-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="infracao_cometida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Infração Cometida</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição da infração" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="penalidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Penalidade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a penalidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADVERTENCIA_VERBAL">Advertência Verbal</SelectItem>
                        <SelectItem value="ADVERTENCIA_ESCRITA">Advertência Escrita</SelectItem>
                        <SelectItem value="SUSPENSAO">Suspensão</SelectItem>
                        <SelectItem value="DEMISSAO">Demissão</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="penalidade_aplicada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Penalidade Aplicada</FormLabel>
                    <FormControl>
                      <Input placeholder="Detalhes da penalidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="justificativa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Justificativa do funcionário"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Tratativa"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 