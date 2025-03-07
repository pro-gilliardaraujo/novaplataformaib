"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface EditarTratativaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTratativaEdited: () => void
  tratativaData: any // Tipo a ser definido com base nos dados da tratativa
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center mb-4">
      <div className="flex-grow h-px bg-gray-200"></div>
      <h3 className="text-base font-medium px-4">{title}</h3>
      <div className="flex-grow h-px bg-gray-200"></div>
    </div>
  )
}

export function EditarTratativaModal({
  open,
  onOpenChange,
  onTratativaEdited,
  tratativaData,
}: EditarTratativaModalProps) {
  const [formData, setFormData] = useState(tratativaData)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setFormData(tratativaData)
  }, [tratativaData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value || "" }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const uploadFile = async (file: File): Promise<string> => {
    const fileName = `temp/${uuidv4()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from("tratativas").upload(fileName, file)
    if (uploadError) throw uploadError
    const { data: urlData } = supabase.storage.from("tratativas").getPublicUrl(fileName)
    return urlData.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      let fileUrl = ""
      if (file) {
        fileUrl = await uploadFile(file)
      }

      const { id, created_at, ...updatedData } = {
        ...formData,
        url_documento_devolvido: fileUrl || formData.url_documento_devolvido,
      }

      // Atualizar o campo 'advertido' com base na penalidade
      const [penalidade] = updatedData.penalidade.split(" - ")
      let advertidoStatus = ""
      let shouldCallPdfTask = false

      switch (penalidade) {
        case "P1":
          advertidoStatus = "Advertido"
          break
        case "P2":
          advertidoStatus = "Advertido"
          shouldCallPdfTask = true
          break
        case "P3":
        case "P4":
        case "P5":
        case "P6":
          advertidoStatus = "Suspenso"
          shouldCallPdfTask = true
          break
        default:
          advertidoStatus = ""
      }

      updatedData.advertido = advertidoStatus

      const { error } = await supabase.from("tratativas").update(updatedData).eq("id", id)

      if (error) throw error

      if (shouldCallPdfTask) {
        try {
          await callPdfTaskApi(id)
        } catch (pdfError) {
          console.error("Erro ao chamar a API de PDF:", pdfError)
          // Não vamos interromper o fluxo se a geração do PDF falhar
        }
      }

      toast({
        title: "Tratativa Atualizada",
        description: `Tratativa ${formData.numero_tratativa} atualizada com sucesso!`,
      })

      onTratativaEdited()
      onOpenChange(false)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar tratativa. Por favor, tente novamente.",
        variant: "destructive",
      })
      setError(`Erro ao atualizar tratativa: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const callPdfTaskApi = async (id: string | number) => {
    try {
      const response = await fetch("https://iblogistica.ddns.net:3000/api/tratativa/pdftasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id.toString() }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const contentType = response.headers.get("content-type")
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const result = await response.json()
        console.log("PDF task API response:", result)
        return result
      } else {
        const text = await response.text()
        console.log("PDF task API response (non-JSON):", text)
        return { message: "PDF task initiated, but response was not in JSON format" }
      }
    } catch (error) {
      console.error("Error calling PDF task API:", error)
      throw error
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <div className="flex items-center justify-between px-4 h-10 border-b">
          <div className="flex-1 text-center text-base font-medium">
            Editar Tratativa #{tratativaData.numero_tratativa}
          </div>
          <Button 
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-7 w-7 p-0 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-grow">
          <form onSubmit={handleSubmit} className="px-6">
            <SectionTitle title="Informações Básicas" />
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="data_infracao">Data da Infração</Label>
                <Input
                  id="data_infracao"
                  name="data_infracao"
                  type="date"
                  value={formData.data_infracao}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="hora_infracao">Hora da Infração</Label>
                <Input
                  id="hora_infracao"
                  name="hora_infracao"
                  type="time"
                  value={formData.hora_infracao}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" name="cpf" type="text" value={formData.cpf} disabled className="bg-gray-100" />
              </div>
            </div>

            <SectionTitle title="Dados do Funcionário" />
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="funcionario">Nome do Funcionário</Label>
                <Input
                  id="funcionario"
                  name="funcionario"
                  type="text"
                  value={formData.funcionario}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="funcao">Função</Label>
                <Input
                  id="funcao"
                  name="funcao"
                  type="text"
                  value={formData.funcao}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="setor">Setor</Label>
                <Input
                  id="setor"
                  name="setor"
                  type="text"
                  value={formData.setor}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <SectionTitle title="Detalhes da Infração" />
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="lider">Nome do Líder</Label>
                <Input
                  id="lider"
                  name="lider"
                  type="text"
                  value={formData.lider}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="codigo_infracao">Código da Infração</Label>
                <Input
                  id="codigo_infracao"
                  name="codigo_infracao"
                  type="text"
                  value={formData.codigo_infracao}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="descricao_infracao">Infração Cometida</Label>
                <Input
                  id="descricao_infracao"
                  name="descricao_infracao"
                  type="text"
                  value={formData.descricao_infracao}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>

            <SectionTitle title="Penalidade" />
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="penalidade">Penalidade Aplicada</Label>
                <Select
                  value={formData.penalidade}
                  onValueChange={(value) => handleSelectChange("penalidade", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a penalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P1 - Comunicação Verbal">P1 - Comunicação Verbal</SelectItem>
                    <SelectItem value="P2 - Advertência Escrita">P2 - Advertência Escrita</SelectItem>
                    <SelectItem value="P3 - Suspensão 1 dia">P3 - Suspensão 1 dia</SelectItem>
                    <SelectItem value="P4 - Suspensão 2 dias">P4 - Suspensão 2 dias</SelectItem>
                    <SelectItem value="P5 - Suspensão 3 dias">P5 - Suspensão 3 dias</SelectItem>
                    <SelectItem value="P6 - Desligamento">P6 - Desligamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="texto_advertencia">Texto Advertência</Label>
                <Input
                  id="texto_advertencia"
                  name="texto_advertencia"
                  type="text"
                  value={formData.texto_advertencia}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <SectionTitle title="Status" />
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="status">Status da Tratativa</Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENVIADA">Enviada</SelectItem>
                    <SelectItem value="DEVOLVIDA">Devolvida</SelectItem>
                    <SelectItem value="CANCELADA">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.status !== "CANCELADA" && (
                <div>
                  <Label htmlFor="file-upload">Anexar Documento</Label>
                  <div className="flex items-center mt-1">
                    <Button type="button" onClick={handleUploadClick} variant="outline" className="w-full">
                      Anexar documento
                    </Button>
                    <Input
                      id="file-upload"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf"
                      ref={fileInputRef}
                      className="hidden"
                    />
                    {file && <span className="ml-2 text-sm text-muted-foreground">{file.name}</span>}
                  </div>
                </div>
              )}
              {formData.status === "CANCELADA" && (
                <div className="col-span-2">
                  <Label htmlFor="justificativa">Justificativa</Label>
                  <Textarea
                    id="justificativa"
                    name="justificativa"
                    value={formData.justificativa || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}
            </div>

            {error && <div className="text-red-500 mt-4">{error}</div>}
          </form>
        </ScrollArea>
        <div className="border-t bg-gray-50 p-4">
          <Button type="submit" className="w-full" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Atualizando Tratativa..." : "Atualizar Tratativa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

