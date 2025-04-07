// Directory: /src/components/nova-tratativa-modal.tsx

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
import { formatCPF } from "@/utils/formatters"
import { ScrollArea } from "@/components/ui/scroll-area"
import { storageService } from "@/services/storageService"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/AuthContext"

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
  const { user } = useAuth()
  console.log("[DEBUG] useAuth hook result:", { user })

  const [documentNumber, setDocumentNumber] = useState("0001")
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [usuarios, setUsuarios] = useState<{id: number, nome: string, email: string}[]>([])

  type FormDataType = {
    numero_tratativa: string
    funcionario: string
    cpf: string
    funcao: string
    setor: string
    data_infracao: string
    hora_infracao: string
    codigo_infracao: string
    descricao_infracao: string
    penalidade: string
    texto_advertencia: string
    lider: string
    status: string
    texto_limite: string
    url_documento_enviado: string
    metrica: string
    valor_praticado: string
    advertido: string
    imagem_evidencia1: string
    data_formatada: string
    mock: boolean
    analista: string
  }

  const [formData, setFormData] = useState<FormDataType>(() => {
    console.log("Initializing formData with user:", user) // Debug log
    return {
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
      analista: user?.profile ? `${user.profile.nome || 'Usuário'} (${user.email})` : ''
    }
  })

  // Debug effect for user changes
  useEffect(() => {
    console.log("[DEBUG] User object changed:", {
      email: user?.email,
      profile: user?.profile,
      formDataAnalista: formData.analista
    })
    
    if (user?.email && user?.profile) {
      const analistaValue = `${user.profile.nome || 'Usuário'} (${user.email})`
      console.log("[DEBUG] Setting analista to:", analistaValue)
      setFormData(prev => ({
        ...prev,
        analista: analistaValue
      }))
    }
  }, [user])

  // Debug effect for formData changes
  useEffect(() => {
    console.log("[DEBUG] FormData changed:", {
      analista: formData.analista,
      hasUser: !!user,
      userEmail: user?.email
    })
  }, [formData, user])

  useEffect(() => {
    if (open) {
      console.log("Modal opened, lastDocNumber:", lastDocumentNumber)
      
      const generateNextDocumentNumber = (lastNumber: string) => {
        const currentNumber = Number.parseInt(lastNumber, 10)
        if (isNaN(currentNumber)) return "0001"
        return (currentNumber + 1).toString().padStart(4, "0")
      }
      
      const nextNumber = generateNextDocumentNumber(lastDocumentNumber)
      setDocumentNumber(nextNumber)
      
      // Atualize o estado do formulário com o número do documento correto
      setFormData(prev => {
        const updatedForm = { ...prev, numero_tratativa: nextNumber };
        
        if (mockData) {
          return { ...updatedForm, ...mockData }
        } else if (user?.profile) {
          return { 
            ...updatedForm, 
            analista: `${user.profile.nome || 'Usuário'} (${user.email})`
          }
        }
        
        return updatedForm;
      });
    }
    
    fetchUsuarios()
  }, [open, lastDocumentNumber, mockData, user])

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email')
        .order('nome', { ascending: true })
      
      if (error) throw error
      
      if (data) {
        console.log("[DEBUG] Usuários carregados:", data.length)
        setUsuarios(data)
        
        // Se não tiver analista definido, define o primeiro usuário como padrão
        if ((!formData.analista || formData.analista === '') && data.length > 0) {
          const defaultAnalista = `${data[0].nome} (${data[0].email})`
          console.log("[DEBUG] Definindo analista padrão:", defaultAnalista)
          setFormData(prev => ({
            ...prev,
            analista: defaultAnalista
          }))
        }
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    }
  }

  // Effect para monitorar quando usuários são carregados e verificar se o analista está definido
  useEffect(() => {
    if (usuarios.length > 0 && (!formData.analista || formData.analista === '')) {
      const defaultAnalista = `${usuarios[0].nome} (${usuarios[0].email})`
      console.log("[DEBUG] Definindo analista após carregar usuários:", defaultAnalista)
      setFormData(prev => ({
        ...prev,
        analista: defaultAnalista
      }))
    }
  }, [usuarios, formData.analista])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsFormDirty(true)
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
    setIsFormDirty(true)
    if (name === "penalidade") {
      const [code, description] = value.split(" - ")
      setFormData((prev) => ({ ...prev, [name]: `${code} - ${description}` }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsFormDirty(true)
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

  const callPdfTaskApi = async (id: string, folhaUnica: boolean = false) => {
    try {
      // Usar rota específica para folha única quando folhaUnica for true
      const endpoint = folhaUnica 
        ? "https://iblogistica.ddns.net:3000/api/tratativa/pdftasks/single"
        : "https://iblogistica.ddns.net:3000/api/tratativa/pdftasks";
      
      const requestBody = folhaUnica ? { id } : { id, folhaUnica };
      
      console.log("[DEBUG] Chamando API PDF", { 
        endpoint, 
        requestBody, 
        folhaUnica,
        usandoRotaSingle: folhaUnica === true
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

    // Verificar se o analista está definido, se não, usar o primeiro usuário
    if (!formData.analista || formData.analista === '') {
      if (usuarios.length > 0) {
        const defaultAnalista = `${usuarios[0].nome} (${usuarios[0].email})`
        console.log("[DEBUG] Definindo analista no momento do submit:", defaultAnalista)
        setFormData(prev => ({
          ...prev,
          analista: defaultAnalista
        }))
        // Como setFormData é assíncrono, precisamos garantir que o valor atualizado seja usado
        const updatedFormData = { ...formData, analista: defaultAnalista };
        // Continuar com o submit usando updatedFormData...
      } else {
        setError("É necessário selecionar um analista.")
        return
      }
    }

    setIsLoading(true)

    try {
      let imageUrls: string[] = []
      for (const file of files) {
        if (file) {
          try {
            const fileName = `${Date.now()}-${file.name}`
            const { url } = await storageService.uploadFile({
              bucket: "tratativas",
              path: fileName,
              file
            })
            
            imageUrls.push(url)
          } catch (uploadError) {
            toast({
              title: "Erro",
              description: "Erro ao fazer upload do arquivo",
              variant: "destructive",
            })
            return
          }
        }
      }

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
        numero_tratativa: documentNumber,
        imagem_evidencia1: imageUrls[0] || "",
        advertido: advertidoStatus,
        data_formatada: formatarData(formData.data_infracao),
        mock: formData.mock,
        analista: formData.analista
      }

      console.log("Submitting tratativa data:", tratativaData)
      console.log("[DEBUG] Número do documento a ser enviado:", documentNumber)
      
      const { data, error } = await supabase.from("tratativas").insert([tratativaData]).select()

      if (error) throw error

      if (data && data.length > 0) {
        const newEntryId = data[0].id
        const [penalidade] = formData.penalidade.split(" - ")
        console.log("Penalidade:", penalidade)

        if (penalidade && ["P1", "P2", "P3", "P4", "P5", "P6"].includes(penalidade.trim())) {
          console.log("Chamando API PDF para tratativa:", newEntryId)
          try {
            // Para P1, enviamos parâmetro adicional indicando que é apenas a folha 1
            const folhaUnica = penalidade.trim() === "P1"
            console.log("[DEBUG] Verificação de penalidade P1:", { 
              penalidade: penalidade.trim(), 
              éP1: penalidade.trim() === "P1", 
              folhaUnica 
            });
            
            const pdfResult = await callPdfTaskApi(newEntryId.toString(), folhaUnica)
            console.log("PDF generation result:", pdfResult)
          } catch (pdfError) {
            console.error("Error in PDF generation:", pdfError)
            toast({
              title: "Atenção",
              description: "Tratativa criada, mas houve um erro ao gerar o PDF. O sistema tentará gerar novamente em breve.",
              variant: "destructive",
              duration: 5000,
            })
          }
        } else {
          console.log("Penalidade não requer geração de PDF:", penalidade)
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
      resetFormAndStates()
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

  const handleSaveTemporary = async () => {
    try {
      setIsLoading(true)
      setError("")

      // Validar campos obrigatórios mínimos
      if (!formData.funcionario || !formData.data_infracao) {
        toast({
          title: "Erro",
          description: "Preencha pelo menos o funcionário e a data da infração.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Determinar status baseado na penalidade
      let advertidoStatus = ""
      if (formData.penalidade) {
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
        }
      }

      // Preparar dados para salvar
      const tratativaData = {
        ...formData,
        numero_tratativa: documentNumber,
        status: "À CONFIRMAR",
        created_at: new Date().toISOString(),
        data_formatada: formatarData(formData.data_infracao),
        advertido: advertidoStatus,
        imagem_evidencia1: "",
        mock: false
      }

      console.log("[DEBUG] Salvando temporariamente:", {
        numero_tratativa: documentNumber,
        status: "À CONFIRMAR"
      });

      // Tentar salvar no Supabase
      const { data, error } = await supabase
        .from("tratativas")
        .insert([tratativaData])
        .select("*")

      if (error) {
        console.error("Erro ao salvar no Supabase:", error)
        throw error
      }

      // Sucesso
      toast({
        title: "Sucesso",
        description: `Tratativa ${documentNumber} salva temporariamente.`,
        duration: 3000,
      })

      // Atualizar a lista e fechar o modal
      await updateTratativasList()
      onTratativaAdded()
      onOpenChange(false)
      resetFormAndStates()

    } catch (error) {
      console.error("Erro ao salvar tratativa:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a tratativa temporariamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileName = `${Date.now()}-${file.name}`
      const { url } = await storageService.uploadFile({
        bucket: "tratativas",
        path: fileName,
        file
      })
      return url
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error)
      return ""
    }
  }

  const handleCloseConfirmed = () => {
    setShowCloseConfirmation(false)
    resetFormAndStates()
    setIsFormDirty(false)
    onOpenChange(false)
  }

  const handleCloseAttempt = () => {
    if (isFormDirty) {
      setShowCloseConfirmation(true)
    } else {
      onOpenChange(false)
    }
  }

  const resetFormAndStates = () => {
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
      analista: user?.profile ? `${user.profile.nome || 'Usuário'} (${user.email})` : ''
    })
    setFiles([])
    setError("")
    setIsFormDirty(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseAttempt}>
        <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
          <div className="flex items-center px-4 h-12 border-b relative">
            <div className="flex-1 text-center">
              <span className="text-base font-medium">Nova Tratativa - Documento {formData.numero_tratativa || documentNumber}</span>
            </div>
            <DialogClose asChild>
              <Button 
                variant="outline"
                className="h-8 w-8 p-0 absolute right-2 top-2"
                onClick={handleCloseAttempt}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
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

                <SectionTitle title="Analista Responsável" />
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="analista">Selecione o Analista</Label>
                    <Select
                      value={formData.analista || ""}
                      onValueChange={(value) => handleSelectChange("analista", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o analista responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {usuarios.map((usuario) => (
                          <SelectItem key={usuario.id} value={`${usuario.nome} (${usuario.email})`}>
                            {usuario.nome} ({usuario.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Debug para mostrar valores */}
                    <div className="text-xs text-gray-500 mt-1">
                      {`Analista selecionado: ${formData.analista || 'Nenhum'}`}
                    </div>
                  </div>
                </div>
              </div>

              <SectionTitle title="Anexo (Máximo 1 imagem)" />
              <div className="space-y-2">
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
                {files.length === 0 && (
                  <p className="text-sm text-red-500">
                    É necessário anexar uma imagem para gerar a tratativa definitiva
                  </p>
                )}
              </div>

              {error && <div className="text-red-500">{error}</div>}
            </form>
          </ScrollArea>
          <div className="border-t bg-gray-50 p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                Analista: {formData.analista || 'Não definido'}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="bg-orange-500 hover:bg-orange-600 text-white hover:text-white"
                  onClick={handleSaveTemporary}
                  disabled={isLoading || !formData.funcionario || !formData.data_infracao}
                >
                  {isLoading ? "Salvando..." : "Salvar Temporariamente"}
                </Button>
                <Button 
                  type="submit" 
                  className="bg-black hover:bg-black/90"
                  onClick={handleSubmit} 
                  disabled={isLoading || files.length === 0}
                >
                  {isLoading ? "Gerando Tratativa..." : "Gerar Tratativa"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCloseConfirmation} onOpenChange={setShowCloseConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Tem certeza que deseja fechar? Todas as alterações serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseConfirmed}>
              Sim, descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

