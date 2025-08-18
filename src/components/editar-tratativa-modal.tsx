// Directory: /src/components/editar-tratativa-modal.tsx

"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { formatCPF } from "@/utils/formatters"
import analistasData from "@/data/analistas.json"

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

function normalizeFileName(fileName: string): string {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9.-]/g, '-') // Substitui caracteres especiais por hífen
}

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
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSavingTemp, setIsSavingTemp] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedAnalista, setSelectedAnalista] = useState<typeof analistasData[0] | null>(null)
  const [showAnalistaConfirmation, setShowAnalistaConfirmation] = useState(false)
  const [confirmationNome, setConfirmationNome] = useState("")
  const [confirmationError, setConfirmationError] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    console.log("[DEBUG] TratativaData recebida na edição:", tratativaData)
    setFormData(tratativaData)
    
    // Encontrar o analista correspondente ao valor salvo na tratativa
    if (tratativaData.analista) {
      const analista = analistasData.find(a => a.value === tratativaData.analista)
      if (analista) {
        setSelectedAnalista(analista)
      }
    }
  }, [tratativaData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => {
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
      setFormData((prev: any) => ({ ...prev, [name]: `${code} - ${description}` }))
    } else if (name === "analista") {
      const analista = analistasData.find(a => a.value === value)
      if (analista) {
        // Armazenar o analista selecionado
        setSelectedAnalista(analista)
        // Atualizar diretamente o formData sem pedir confirmação
        setFormData((prev: any) => ({ ...prev, [name]: value }))
      }
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (formData.status === "À CONFIRMAR" && !selectedFile.type.startsWith("image/")) {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive",
        })
        return
      }
      if (formData.status === "DEVOLVIDA" && selectedFile.type !== "application/pdf") {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos PDF.",
          variant: "destructive",
        })
        return
      }
      setFile(selectedFile)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const normalizedName = normalizeFileName(file.name)
    const fileName = `tratativas/devolvidas/${uuidv4()}-${normalizedName}`
    const { error: uploadError } = await supabase.storage.from("tratativas").upload(fileName, file)
    if (uploadError) throw uploadError
    const { data: urlData } = supabase.storage.from("tratativas").getPublicUrl(fileName)
    return urlData.publicUrl
  }

  const handleSubmit = async () => {
    setError("")
    setIsUpdating(true)

    try {
      let fileUrl = ""
      if (file) {
        fileUrl = await uploadFile(file)
      }

      const [penalidade] = formData.penalidade.split(" - ")
      let advertidoStatus = ""
      let shouldCallPdfTask = false

      switch (penalidade) {
        case "P1":
          advertidoStatus = "Advertido"
          shouldCallPdfTask = formData.status !== "À CONFIRMAR"
          break
        case "P2":
          advertidoStatus = "Advertido"
          shouldCallPdfTask = formData.status !== "À CONFIRMAR"
          break
        case "P3":
        case "P4":
        case "P5":
        case "P6":
          advertidoStatus = "Suspenso"
          shouldCallPdfTask = formData.status !== "À CONFIRMAR"
          break
        default:
          advertidoStatus = ""
      }

      const updatedData = {
        ...formData,
        advertido: advertidoStatus,
        imagem_evidencia1: formData.status === "À CONFIRMAR" ? (fileUrl || formData.imagem_evidencia1) : formData.imagem_evidencia1,
        url_documento_devolvido: formData.status === "DEVOLVIDA" ? fileUrl : formData.url_documento_devolvido,
        data_devolvida: formData.status === "DEVOLVIDA" ? new Date().toISOString().split('T')[0] : formData.data_devolvida
      }

      // Remove o campo id dos dados antes de fazer o update
      const { id, created_at, updated_at, ...dataToUpdate } = updatedData

      const { error } = await supabase
        .from("tratativas")
        .update(dataToUpdate)
        .eq("id", formData.id)

      if (error) throw error

      if (shouldCallPdfTask && formData.status === "DEVOLVIDA") {
        try {
          // Todas as penalidades geram duas folhas - P1 terá "Advertido" na segunda folha
          console.log("[DEBUG] Gerando PDF para penalidade na edição:", { 
            penalidade: penalidade.trim()
          });
          
          await callPdfTaskApi(formData.id, false)
        } catch (pdfError) {
          console.error("Erro ao gerar PDF:", pdfError)
        }
      }

      toast({
        title: "Sucesso",
        description: `Tratativa ${formData.numero_tratativa} atualizada com sucesso!`,
      })

      onTratativaEdited()
      onOpenChange(false)
    } catch (error) {
      console.error("Error:", error)
      setError(`Erro ao atualizar tratativa: ${error instanceof Error ? error.message : String(error)}`)
      toast({
        title: "Erro",
        description: "Erro ao atualizar tratativa. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
      setShowConfirmDialog(false)
    }
  }

  const handleSaveTemporary = async () => {
    setError("")
    setIsSavingTemp(true)

    try {
      let fileUrl = ""
      if (file) {
        fileUrl = await uploadFile(file)
      }

      const updatedData = {
        ...formData,
        imagem_evidencia1: formData.status === "À CONFIRMAR" ? (fileUrl || formData.imagem_evidencia1) : formData.imagem_evidencia1,
        url_documento_devolvido: formData.status === "DEVOLVIDA" ? fileUrl : formData.url_documento_devolvido,
        data_devolvida: formData.status === "DEVOLVIDA" ? new Date().toISOString().split('T')[0] : formData.data_devolvida,
        status: "À CONFIRMAR"
      }

      // Remove o campo id dos dados antes de fazer o update
      const { id, created_at, updated_at, ...dataToUpdate } = updatedData

      const { error } = await supabase
        .from("tratativas")
        .update(dataToUpdate)
        .eq("id", formData.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `Tratativa ${formData.numero_tratativa} salva temporariamente!`,
      })

      onTratativaEdited()
      onOpenChange(false)
    } catch (error) {
      console.error("Error:", error)
      setError(`Erro ao salvar tratativa: ${error instanceof Error ? error.message : String(error)}`)
      toast({
        title: "Erro",
        description: "Erro ao salvar tratativa. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSavingTemp(false)
    }
  }

  const callPdfTaskApi = async (id: string | number, folhaUnica: boolean = false) => {
    try {
      // Todas as penalidades usam o endpoint padrão para duas folhas
      const endpoint = "https://iblogistica.ddns.net:3000/api/tratativa/pdftasks";
      
      const requestBody = { id: id.toString(), folhaUnica: false };
      console.log('[DEBUG] Chamando API PDF na edição:', { 
        endpoint, 
        requestBody
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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

  const handleAnalistaConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmationNome(e.target.value)
    if (confirmationError) setConfirmationError("")
  }

  const handleAnalistaConfirm = () => {
    if (!selectedAnalista) {
      // Não exigir mais um analista, retornar true mesmo sem analista
      return true
    }

    if (confirmationNome !== selectedAnalista.displayName) {
      setConfirmationError("O nome digitado não corresponde ao seu nome completo cadastrado no sistema")
      return false
    }

    return true
  }

  // Função para confirmar a seleção do analista após digitar o nome completo
  const confirmAnalistaSelection = () => {
    if (!selectedAnalista) {
      // Se não há analista selecionado, apenas fechar o modal e retornar true
      setShowAnalistaConfirmation(false);
      return true;
    }
    
    if (!handleAnalistaConfirm()) {
      return false // Se a validação falhar, não prossegue e não fecha o modal
    }
    
    // Atualizar o formData com o analista selecionado após confirmação
    setFormData((prev: any) => ({ 
      ...prev, 
      analista: selectedAnalista.value 
    }))
    
    setShowAnalistaConfirmation(false) // Fecha o modal apenas após sucesso
    return true
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
          <div className="flex items-center px-6 h-14 border-b relative">
            <div className="flex-1 text-center">
              <span className="text-lg font-medium">Editar Tratativa {tratativaData.numero_tratativa}</span>
            </div>
            <DialogClose asChild>
              <Button 
                variant="outline"
                className="h-8 w-8 p-0 absolute right-4 top-3"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>

          <div className="flex-1 p-4 overflow-auto">
            <form className="space-y-4">
              <div>
                <SectionTitle title="Informações Básicas" />
                <div className="grid grid-cols-3 gap-4 mt-4">
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
              </div>

              <div>
                <SectionTitle title="Dados do Funcionário" />
                <div className="grid grid-cols-3 gap-4 mt-4">
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
              </div>

              <div>
                <SectionTitle title="Detalhes da Infração" />
                <div className="grid grid-cols-3 gap-4 mt-4">
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
              </div>

              <div>
                <SectionTitle title="Penalidade" />
                <div className="grid grid-cols-3 gap-4 mt-4">
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
                        <SelectItem value="P1 - Orientação Verbal">P1 - Orientação Verbal</SelectItem>
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

              <div>
                <SectionTitle title="Analista Responsável" />
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div>
                    <Label htmlFor="analista">Selecione o Analista</Label>
                    <Select
                      value={formData.analista}
                      onValueChange={(value) => handleSelectChange("analista", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o analista responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {analistasData.map((analista) => (
                          <SelectItem key={analista.id} value={analista.value}>
                            {analista.shortName} - {analista.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-gray-500 mt-1">
                      {selectedAnalista ? `Analista selecionado: ${selectedAnalista.displayName}` : 'Nenhum analista selecionado'}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <SectionTitle title="Status" />
                <div className="grid grid-cols-3 gap-4 mt-4">
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
                        <SelectItem value="À CONFIRMAR">À Confirmar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="file-upload">
                      {formData.status === "À CONFIRMAR" ? "Anexar Nova Imagem" : "Anexar Novo Documento"}
                    </Label>
                    <div
                      className={`border-2 border-dashed border-gray-300 rounded-lg p-2 text-center cursor-pointer mt-1 ${
                        file ? "opacity-50" : ""
                      }`}
                      onClick={handleUploadClick}
                    >
                      <Input
                        id="file-upload"
                        type="file"
                        onChange={handleFileChange}
                        accept={formData.status === "À CONFIRMAR" ? "image/*" : ".pdf"}
                        ref={fileInputRef}
                        className="hidden"
                      />
                      <span className="text-gray-500 text-sm">
                        {formData.status === "À CONFIRMAR" ? "Procurar imagem" : "Procurar documento"}
                      </span>
                    </div>
                  </div>
                  {file && (
                    <div>
                      <Label>Arquivo Selecionado</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600 break-all line-clamp-2">{file.name}</span>
                        <Button 
                          type="button" 
                          onClick={handleRemoveFile} 
                          variant="destructive" 
                          size="sm"
                          className="h-7 px-2 shrink-0"
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  )}
                  {formData.status === "CANCELADA" && (
                    <div className="col-span-2">
                      <Label htmlFor="texto_limite">Justificativa</Label>
                      <Input
                        id="texto_limite"
                        name="texto_limite"
                        value={formData.texto_limite || ""}
                        onChange={handleInputChange}
                        required={formData.status === "CANCELADA"}
                      />
                    </div>
                  )}
                </div>
              </div>
            </form>

            {error && <div className="text-red-500 mt-4">{error}</div>}
          </div>

          <div className="border-t bg-gray-50 p-4">
            <div className="flex justify-end gap-2">
              {formData.status === "À CONFIRMAR" && (
                <>
                  <Button
                    variant="outline"
                    className="bg-orange-500 hover:bg-orange-600 text-white hover:text-white"
                    onClick={handleSaveTemporary}
                    disabled={isSavingTemp}
                  >
                    {isSavingTemp ? "Salvando..." : "Salvar Temporariamente"}
                  </Button>
                  {formData.imagem_evidencia1 || file ? (
                    <Button
                      variant="outline"
                      className="bg-green-600 hover:bg-green-700 text-white hover:text-white"
                      onClick={() => {
                        setFormData((prev: any) => ({...prev, status: "ENVIADA"}));
                        // Não precisa confirmar o analista de novo, vamos direto para o diálogo de confirmação
                        setShowConfirmDialog(true);
                      }}
                      disabled={isUpdating || isSavingTemp}
                    >
                      Gerar Tratativa
                    </Button>
                  ) : null}
                </>
              )}
              <Button 
                type="button" 
                className="bg-black hover:bg-black/90"
                onClick={() => setShowConfirmDialog(true)} 
                disabled={isUpdating || isSavingTemp}
              >
                {isUpdating ? "Atualizando Tratativa..." : "Atualizar Tratativa"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Alterações</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja salvar as alterações nesta tratativa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de confirmação do analista */}
      <AlertDialog open={showAnalistaConfirmation} onOpenChange={(open) => {
        if (!open) {
          setConfirmationNome("");
          setConfirmationError("");
          // Se foi fechado sem confirmar, consideramos que o usuário cancelou a seleção
          if (formData.analista !== selectedAnalista?.value) {
            // Exibe um toast informando que a seleção foi cancelada
            toast({
              title: "Seleção cancelada",
              description: "Você cancelou a seleção do analista",
              duration: 3000,
            });
            setSelectedAnalista(analistasData.find(a => a.value === formData.analista) || null);
          }
        }
        setShowAnalistaConfirmation(open);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Responsabilidade</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAnalista && (
                <div className="mt-4">
                  <p className="mb-4">Confirmando a tratativa, está ciente de que se torna sua responsabilidade acompanhar o mesmo.</p>
                  <p>Digite seu nome completo abaixo para te confirmar como analista responsável:</p>
                  <div className="mt-2">
                    <input
                      type="text"
                      value={confirmationNome}
                      onChange={handleAnalistaConfirmChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite seu nome completo"
                      disabled={isUpdating}
                      autoFocus
                    />
                  </div>
                  {confirmationError && (
                    <p className="text-red-500 text-sm mt-2">{confirmationError}</p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Previne o comportamento padrão que fecha o modal automaticamente
                e.preventDefault()
                if (handleAnalistaConfirm()) {
                  confirmAnalistaSelection();
                }
              }}
              disabled={isUpdating || !confirmationNome}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-600"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

