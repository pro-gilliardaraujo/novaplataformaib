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
import { formatCPF } from "@/utils/formatters"
import { ScrollArea } from "@/components/ui/scroll-area"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const formatarData = (data: string): string => {
  const diasSemana = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ]
  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ]

  const dataObj = new Date(data)
  const diaSemana = diasSemana[dataObj.getDay()]
  const dia = dataObj.getDate().toString().padStart(2, "0")
  const mes = meses[dataObj.getMonth()]
  const ano = dataObj.getFullYear()

  return `${diaSemana}, ${dia} de ${mes} de ${ano}`
}

interface NovaTratativaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTratativaAdded: () => void
  lastDocumentNumber: string
  mockData?: Record<string, string> | null
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center space-x-2 mb-2">
      <div className="flex-grow h-px bg-gray-200"></div>
      <h3 className="text-base font-semibold px-4">{title}</h3>
      <div className="flex-grow h-px bg-gray-200"></div>
    </div>
  )
}

export function NovaTratativaModal({
  open,
  onOpenChange,
  onTratativaAdded,
  lastDocumentNumber,
  mockData,
}: NovaTratativaModalProps) {
  const [documentNumber, setDocumentNumber] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    numero_tratativa: "",
    funcionario: "",
    cpf: "",
    funcao: "",
    setor: "",
    data_infracao: "",
    hora_infracao: "",
    codigo_infracao: "",
    descricao_infracao: "",
    penalidade: "",
    texto_advertencia: "",
    lider: "",
    status: "ENVIADA",
    texto_limite: "",
    url_documento_enviado: "",
    metrica: "",
    valor_praticado: "",
    advertido: "",
    imagem_evidencia1: "",
    data_formatada: "",
    mock: false,
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const generateNextDocumentNumber = (lastNumber: string) => {
      const currentNumber = Number.parseInt(lastNumber, 10)
      if (isNaN(currentNumber)) return "1000"
      return (currentNumber + 1).toString().padStart(4, "0")
    }

    const nextNumber = generateNextDocumentNumber(lastDocumentNumber)
    setDocumentNumber(nextNumber)

    if (mockData) {
      setFormData((prev) => ({
        ...prev,
        ...mockData,
        numero_tratativa: nextNumber,
        status: "ENVIADA",
        mock: true,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        numero_tratativa: nextNumber,
        status: "ENVIADA",
        mock: false,
      }))
    }
  }, [lastDocumentNumber, mockData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const newData = { ...prev, [name]: value || "" }
      if (name === "data_infracao") {
        newData.data_formatada = formatarData(value)
      }
      if (name === "cpf") {
        newData.cpf = formatCPF(value)
      }
      return newData
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === "penalidade") {
      const [code, description] = value.split(" - ")
      setFormData((prev) => ({ ...prev, [name]: `${code} - ${description}` }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const imageFile = selectedFiles.find((file) => file.type.startsWith("image/"))
    if (imageFile) {
      setFiles([imageFile])
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index))
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileName = `temp/${uuidv4()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from("tratativas").upload(fileName, file)
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from("tratativas").getPublicUrl(fileName)
      return urlData.publicUrl
    })
    return Promise.all(uploadPromises)
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
        console.error("PDF API Error Response:", errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("PDF task API response:", result)
      return result
    } catch (error) {
      console.error("Error calling PDF task API:", error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (files.length === 0) {
      setError("É necessário anexar uma imagem para criar a tratativa.")
      return
    }

    setIsLoading(true)

    try {
      let imageUrls: string[] = []
      imageUrls = await uploadImages(files)

      let advertidoStatus = ""
      const [penalidade] = formData.penalidade.split(" - ")
      switch (penalidade) {
        case "P1":
        case "P2":
          advertidoStatus = "Advertido"
          break
        case "P3":
        case "P4":
        case "P5":
          advertidoStatus = "Suspenso"
          break
        case "P6":
          advertidoStatus = "Desligado"
          break
        default:
          advertidoStatus = ""
      }

      const tratativaData = {
        ...formData,
        imagem_evidencia1: imageUrls[0] || "",
        advertido: advertidoStatus,
        data_formatada: formatarData(formData.data_infracao),
        mock: formData.mock,
      }

      console.log("Submitting tratativa data:", tratativaData)
      const { data, error } = await supabase.from("tratativas").insert([tratativaData]).select()

      if (error) throw error

      if (data && data.length > 0) {
        const newEntryId = data[0].id
        const [penalidade] = formData.penalidade.split(" - ")

        if (["P2", "P3", "P4", "P5", "P6"].includes(penalidade)) {
          try {
            const pdfResult = await callPdfTaskApi(newEntryId.toString())
            console.log("PDF generation result:", pdfResult)
          } catch (pdfError) {
            console.error("Error in PDF generation:", pdfError)
          }
        }
      }

      toast({
        title: "Tratativa Gerada",
        description: `Tratativa ${formData.numero_tratativa} criada com sucesso!`,
        duration: 5000,
      })

      // Chama a API de listagem para atualizar a visão da plataforma
      await updateTratativasList()

      onTratativaAdded()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error:", error)
      setError("Erro ao criar tratativa. Tente novamente.")
      toast({
        title: "Erro",
        description: "Erro ao criar tratativa. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateTratativasList = async () => {
    try {
      const response = await fetch("https://iblogistica.ddns.net:3000/api/tratativa/list")
      if (!response.ok) {
        throw new Error("Failed to fetch tratativas")
      }
      const data = await response.json()
      if (data.status === "success" && Array.isArray(data.data)) {
        // Aqui você pode atualizar o estado global ou chamar uma função para atualizar a lista de tratativas
        // Por exemplo, se você estiver usando um contexto ou estado global:
        // updateGlobalTratativasList(data.data)
        console.log("Tratativas list updated successfully")
      } else {
        console.error("Unexpected response structure:", data)
      }
    } catch (error) {
      console.error("Error updating tratativas list:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      numero_tratativa: "",
      funcionario: "",
      cpf: "",
      funcao: "",
      setor: "",
      data_infracao: "",
      hora_infracao: "",
      codigo_infracao: "",
      descricao_infracao: "",
      penalidade: "",
      texto_advertencia: "",
      lider: "",
      status: "ENVIADA",
      texto_limite: "",
      url_documento_enviado: "",
      metrica: "",
      valor_praticado: "",
      advertido: "",
      imagem_evidencia1: "",
      data_formatada: "",
      mock: false,
    })
    setFiles([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <div className="flex items-center justify-between px-4 h-12 border-b">
          <div className="flex-1 text-center text-base font-medium">
            Nova Tratativa #{documentNumber}
          </div>
          <Button 
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-7 w-7 p-0 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-grow px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <SectionTitle title="Informações Básicas" />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="data_infracao">Data da Infração</Label>
                  <Input
                    id="data_infracao"
                    name="data_infracao"
                    type="date"
                    value={formData.data_infracao}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hora_infracao">Hora da Infração</Label>
                  <Input
                    id="hora_infracao"
                    name="hora_infracao"
                    type="time"
                    value={formData.hora_infracao}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    type="text"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    required
                    maxLength={14}
                  />
                </div>
              </div>

              <SectionTitle title="Dados do Funcionário" />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="funcionario">Nome do Funcionário</Label>
                  <Input
                    id="funcionario"
                    name="funcionario"
                    type="text"
                    value={formData.funcionario}
                    onChange={handleInputChange}
                    required
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
              <div className="grid grid-cols-3 gap-4">
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
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="descricao_infracao">Infração Cometida</Label>
                  <Input
                    id="descricao_infracao"
                    name="descricao_infracao"
                    type="text"
                    value={formData.descricao_infracao}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <SectionTitle title="Penalidade" />
              <div className="grid grid-cols-3 gap-4">
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
            </div>

            <SectionTitle title="Anexo (Máximo 1 imagem)" />
            <div className="flex items-center space-x-4">
              <div
                className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer ${
                  files.length >= 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={files.length < 1 ? handleUploadClick : undefined}
              >
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  disabled={files.length >= 1}
                />
                <span className="text-gray-500">{files.length < 1 ? "Procurar imagem" : "Imagem selecionada"}</span>
              </div>
              {files.length > 0 && (
                <div className="flex-1">
                  <p className="font-medium">Arquivos anexados:</p>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between mt-1">
                      <span>{file.name}</span>
                      <Button type="button" onClick={() => handleRemoveFile(index)} variant="destructive" size="sm">
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <div className="text-red-500">{error}</div>}
          </form>
        </ScrollArea>
        <div className="border-t bg-gray-50 p-4">
          <Button 
            type="submit" 
            className="w-full" 
            onClick={handleSubmit} 
            disabled={isLoading || files.length === 0}
          >
            {isLoading ? "Gerando Tratativa..." : "Gerar Tratativa"}
          </Button>
          {files.length === 0 && (
            <p className="text-sm text-red-500 mt-2 text-center">
              É necessário anexar uma imagem para criar a tratativa
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

