// Directory: /src/components/nova-tratativa-modal.tsx

"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { ArrowsPointingOutIcon } from "@heroicons/react/24/outline"
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
import analistasData from "@/data/analistas.json"
import { funcionariosService } from "@/services/funcionariosService"
import { FuncionarioSearchResult } from "@/types/funcionarios"

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
  const [showAnalistaConfirmation, setShowAnalistaConfirmation] = useState(false)
  const [confirmationNome, setConfirmationNome] = useState("")
  const [confirmationError, setConfirmationError] = useState("")
  const [selectedAnalista, setSelectedAnalista] = useState<typeof analistasData[0] | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set())
  const [showErrorAnimation, setShowErrorAnimation] = useState(false)
  
  // Estados para autocomplete de funcionários
  const [funcionarioSuggestions, setFuncionarioSuggestions] = useState<FuncionarioSearchResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedFuncionario, setSelectedFuncionario] = useState<FuncionarioSearchResult | null>(null)
  
  // Estado para URLs das imagens
  const [imageUrls, setImageUrls] = useState<string[]>([])

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
      data_infracao: new Date().toISOString().split('T')[0],
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
      analista: ""
    }
  })

  // Debug effect for user changes
  useEffect(() => {
    console.log("[DEBUG] User object changed:", {
      email: user?.email,
      profile: user?.profile
    })
  }, [user])

  // Debug effect for formData changes
  useEffect(() => {
    console.log("[DEBUG] FormData changed:", {
      analista: formData.analista,
      hasUser: !!user,
      userEmail: user?.email
    })
  }, [formData, user])

  // Cleanup das URLs quando o componente é desmontado
  useEffect(() => {
    return () => {
      imageUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [imageUrls])

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
        }
        
        return updatedForm;
      });
    }
  }, [open, lastDocumentNumber, mockData])

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

    // Busca dinâmica para o campo funcionário
    if (name === "funcionario") {
      handleFuncionarioSearch(value)
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setIsFormDirty(true)
    

    
    if (name === "penalidade") {
      const [code, description] = value.split(" - ")
      setFormData((prev) => ({ ...prev, [name]: `${code} - ${description}` }))
    } else if (name === "analista") {
      const analista = analistasData.find(a => a.value === value)
      if (analista) {
        // Apenas armazenar temporariamente o analista selecionado
        setSelectedAnalista(analista)
        // Mostrar o modal de confirmação imediatamente
        setShowAnalistaConfirmation(true)
        // Não atualizamos o formData aqui, isso será feito após a confirmação
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Função para buscar funcionários
  const handleFuncionarioSearch = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setFuncionarioSuggestions([])
      setShowSuggestions(false)
      setSelectedFuncionario(null)
      return
    }

    setIsSearching(true)
    try {
      const suggestions = await funcionariosService.buscarFuncionarios(query)
      setFuncionarioSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0)
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error)
      setFuncionarioSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsSearching(false)
    }
  }

  // Função para selecionar um funcionário
  const handleFuncionarioSelect = (funcionario: FuncionarioSearchResult) => {
    setSelectedFuncionario(funcionario)
    setShowSuggestions(false)
    
    // Preencher todos os campos relacionados
    setFormData((prev) => ({
      ...prev,
      funcionario: funcionario.nome,
      cpf: funcionario.cpf,
      funcao: funcionario.funcao,
      setor: funcionario.unidade
    }))
  }

  // Função para limpar a busca
  const handleClearFuncionarioSearch = () => {
    setSelectedFuncionario(null)
    setFuncionarioSuggestions([])
    setShowSuggestions(false)
    setFormData((prev) => ({
      ...prev,
      funcionario: "",
      cpf: "",
      funcao: "",
      setor: ""
    }))
  }

  const handleAnalistaConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmationNome(e.target.value)
    if (confirmationError) setConfirmationError("")
  }

  const handleAnalistaConfirm = () => {
    if (!selectedAnalista) {
      setConfirmationError("Nenhum analista selecionado")
      return false
    }

    if (confirmationNome !== selectedAnalista.displayName) {
      setConfirmationError("O nome digitado não corresponde ao seu nome completo cadastrado no sistema")
      return false
    }

    return true
  }

  // Função para confirmar a seleção do analista após digitar o nome completo
  const confirmAnalistaSelection = () => {
    if (!selectedAnalista) return false
    
    if (!handleAnalistaConfirm()) {
      return false // Se a validação falhar, não prossegue e não fecha o modal
    }
    
    // Atualizar o formData com o analista selecionado após confirmação
    setFormData((prev) => ({ 
      ...prev, 
      analista: selectedAnalista.value 
    }))
    
    setShowAnalistaConfirmation(false) // Fecha o modal apenas após sucesso
    return true
  }



  const handleRemoveFile = (index: number) => {
    // Liberar URL object para evitar memory leak
    if (imageUrls[index]) {
      URL.revokeObjectURL(imageUrls[index])
    }
    
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index))
    setImageUrls((prevUrls) => prevUrls.filter((_, i) => i !== index))
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (files.length < 1) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsFormDirty(true)
    const uploadedFiles = e.target.files
    if (uploadedFiles && uploadedFiles.length > 0) {
      const imageFile = uploadedFiles[0]
      if (imageFile.type.startsWith("image/")) {
        // Limpar URLs anteriores
        imageUrls.forEach(url => URL.revokeObjectURL(url))
        
        // Criar nova URL para o arquivo
        const newUrl = URL.createObjectURL(imageFile)
        
        setFiles([imageFile])
        setImageUrls([newUrl])
      } else {
        toast({
          title: "Erro",
          description: "Por favor, anexe apenas arquivos de imagem.",
          variant: "destructive",
        })
      }
    }
    
    // Resetar o input para permitir upload do mesmo arquivo novamente
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setIsFormDirty(true)

    if (files.length >= 1) return

    const droppedFiles = Array.from(e.dataTransfer.files)
    const imageFile = droppedFiles.find((file) => file.type.startsWith("image/"))
    
    if (imageFile) {
      // Limpar URLs anteriores
      imageUrls.forEach(url => URL.revokeObjectURL(url))
      
      // Criar nova URL para o arquivo
      const newUrl = URL.createObjectURL(imageFile)
      
      setFiles([imageFile])
      setImageUrls([newUrl])
    } else {
      toast({
        title: "Erro",
        description: "Por favor, anexe apenas arquivos de imagem.",
        variant: "destructive",
      })
    }
  }

  const callPdfTaskApi = async (id: string, folhaUnica: boolean = false) => {
    try {
      // Todas as penalidades usam o endpoint padrão para duas folhas
      const endpoint = "https://iblogistica.ddns.net:3000/api/tratativa/pdftasks";
      
      const requestBody = { id, folhaUnica: false };
      
      console.log("[DEBUG] Chamando API PDF", { 
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

  const getErrorClass = (fieldName: string) => {
    if (!showErrorAnimation || !fieldErrors.has(fieldName)) return ''
    return 'border-red-500 border-2 animate-pulse'
  }

  const validateRequiredFields = () => {
    const errors = new Set<string>()
    const requiredFields = [
      'data_infracao', 'hora_infracao', 'cpf', 'funcionario', 'funcao', 'setor',
      'lider', 'codigo_infracao', 'descricao_infracao', 'penalidade', 'analista'
    ]

    requiredFields.forEach(field => {
      const value = formData[field as keyof typeof formData]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.add(field)
      }
    })

    if (files.length === 0) {
      errors.add('anexo')
    }

    setFieldErrors(errors)
    
    // Se houver erros, ativar a animação por 2 segundos
    if (errors.size > 0) {
      setShowErrorAnimation(true)
      setTimeout(() => {
        setShowErrorAnimation(false)
        setFieldErrors(new Set()) // Limpar os erros após a animação
      }, 2000)
    }
    
    return errors.size === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validar todos os campos obrigatórios
    if (!validateRequiredFields()) {
      setError("Por favor, preencha todos os campos obrigatórios destacados em vermelho.")
      return
    }

    // Processar o envio diretamente
    await processSubmit()
  }

  // Função para processar o envio após a confirmação do analista
  const processSubmit = async () => {
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
        mock: formData.mock
      }

      console.log("Submitting tratativa data:", tratativaData)
      console.log("[DEBUG] Número do documento a ser enviado:", documentNumber)
      
      // Usar API do backend conforme especificação
      const response = await fetch("https://iblogistica.ddns.net:3000/api/tratativa/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tratativaData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.status !== 'success') {
        throw new Error(result.message || 'Erro na criação da tratativa')
      }

      const data = [{ id: result.id }] // Simular estrutura esperada pelo código seguinte

      if (data && data.length > 0) {
        const newEntryId = data[0].id
        const [penalidade] = formData.penalidade.split(" - ")
        console.log("Penalidade:", penalidade)

        if (penalidade && ["P1", "P2", "P3", "P4", "P5", "P6"].includes(penalidade.trim())) {
          console.log("Chamando API PDF para tratativa:", newEntryId)
          try {
            // Todas as penalidades geram duas folhas - P1 terá "Advertido" na segunda folha
            console.log("[DEBUG] Gerando PDF para penalidade:", { 
              penalidade: penalidade.trim()
            });
            
            const pdfResult = await callPdfTaskApi(newEntryId.toString(), false)
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
        status: "À CONFIRMAR",
        analista: formData.analista
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
    // Limpar URLs de preview para evitar memory leaks
    imageUrls.forEach(url => {
      URL.revokeObjectURL(url)
    })
    
    setFormData({
      numero_tratativa: "",
      funcionario: "",
      cpf: "",
      funcao: "",
      setor: "",
      data_infracao: new Date().toISOString().split('T')[0],
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
      analista: ""
    })
    setFiles([])
    setError("")
    setIsFormDirty(false)
    setSelectedAnalista(null)
    setConfirmationNome("")
    setConfirmationError("")
    setIsDragOver(false)
    setFieldErrors(new Set())
    setShowErrorAnimation(false)
    setFuncionarioSuggestions([])
    setShowSuggestions(false)
    setSelectedFuncionario(null)
    setIsSearching(false)
    setImageUrls([])
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseAttempt}>
        <DialogContent className="sm:max-w-[1400px] p-0 flex flex-col h-[90vh]">
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
          <div className="flex flex-grow">
            {/* Coluna da esquerda - Formulário */}
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
                      className={getErrorClass('data_infracao')}
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
                      className={getErrorClass('hora_infracao')}
                    />
                  </div>
                  <div className="relative">
                    <Label htmlFor="funcionario">Nome do Funcionário</Label>
                    <div className="relative">
                      <Input
                        id="funcionario"
                        name="funcionario"
                        type="text"
                        value={formData.funcionario}
                        onChange={handleInputChange}
                        onFocus={() => {
                          if (formData.funcionario.length >= 2) {
                            setShowSuggestions(funcionarioSuggestions.length > 0)
                          }
                        }}
                        onBlur={() => {
                          // Delay para permitir clique nas sugestões
                          setTimeout(() => setShowSuggestions(false), 200)
                        }}
                        placeholder="Digite o nome do funcionário..."
                        required
                        className={getErrorClass('funcionario')}
                        autoComplete="off"
                      />
                      
                      {/* Botão para limpar quando há funcionário selecionado */}
                      {selectedFuncionario && (
                        <button
                          type="button"
                          onClick={handleClearFuncionarioSearch}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}

                      {/* Loading indicator */}
                      {isSearching && (
                        <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                      )}

                      {/* Lista de sugestões */}
                      {showSuggestions && funcionarioSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {funcionarioSuggestions.map((funcionario) => (
                            <button
                              key={funcionario.id}
                              type="button"
                              onClick={() => handleFuncionarioSelect(funcionario)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
                            >
                              <div className="font-medium text-gray-900">{funcionario.nome}</div>
                              <div className="text-sm text-gray-500">
                                CPF: {funcionario.cpf} • {funcionario.funcao}
                              </div>
                              <div className="text-xs text-gray-400">{funcionario.unidade}</div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Mensagem quando não há resultados */}
                      {showSuggestions && funcionarioSuggestions.length === 0 && formData.funcionario.length >= 2 && !isSearching && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                          <div className="px-4 py-3 text-gray-500 text-center">
                            Nenhum funcionário encontrado
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <SectionTitle title="Dados do Funcionário" />
                <div className="grid grid-cols-3 gap-4">
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
                      className={getErrorClass('cpf')}
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
                      className={getErrorClass('funcao')}
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
                      className={getErrorClass('setor')}
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
                      className={getErrorClass('lider')}
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
                      className={getErrorClass('codigo_infracao')}
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
                      className={getErrorClass('descricao_infracao')}
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
                      <SelectTrigger className={getErrorClass('penalidade')}>
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
                      value={formData.analista}
                      onValueChange={(value) => handleSelectChange("analista", value)}
                      required
                    >
                      <SelectTrigger className={getErrorClass('analista')}>
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
                    {selectedAnalista && (
                      <p className="text-sm text-gray-500 mt-1">
                        Analista selecionado: {selectedAnalista.displayName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {error && <div className="text-red-500">{error}</div>}
            </form>
          </ScrollArea>
          
          {/* Coluna da direita - Anexo */}
          <div className="w-[400px] border-l bg-white p-4 flex flex-col">
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-center">Anexo</h3>
              
              {/* Botão de Upload Compacto */}
              <div className="flex flex-col items-center space-y-2">
                <div
                  className={`border-2 border-dashed rounded-lg p-2 cursor-pointer transition-colors ${
                    files.length >= 1 
                      ? "opacity-50 cursor-not-allowed border-gray-300" 
                      : showErrorAnimation && fieldErrors.has('anexo')
                        ? "border-red-500 bg-red-50 animate-pulse"
                        : isDragOver 
                          ? "border-blue-400 bg-blue-50" 
                          : "border-gray-300 hover:border-blue-300"
                  }`}
                  onClick={files.length < 1 ? handleUploadClick : undefined}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="pointer-events-none"
                    disabled={files.length >= 1}
                  >
                    📎 {files.length > 0 ? "Anexado" : "Anexar Imagem"}
                  </Button>
                </div>
                
                {files.length === 0 && (
                  <p className="text-xs text-gray-500 text-center">
                    {isDragOver ? "Solte aqui" : "Clique ou arraste"}
                  </p>
                )}
              </div>
            </div>
            
            {/* Preview da Imagem */}
            {files.length > 0 && (
              <div className="space-y-3 mt-4">
                {files.map((file, index) => (
                  <div key={index} className="space-y-2">
                    <div className="relative group">
                      <img
                        src={imageUrls[index]}
                        alt="Preview"
                        className="w-full max-h-[500px] object-contain rounded-lg border bg-white shadow-sm"
                      />
                      {/* Botão Fullscreen */}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                        onClick={() => setShowFullscreen(true)}
                      >
                        <ArrowsPointingOutIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 truncate flex-1">{file.name}</span>
                      <Button 
                        type="button" 
                        onClick={() => handleRemoveFile(index)} 
                        variant="destructive" 
                        size="sm"
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {files.length === 0 && (
              <p className="text-xs text-red-500 text-center mt-4">
                Imagem obrigatória para gerar tratativa
              </p>
            )}
          </div>
          </div>
          <div className="border-t bg-gray-50 p-4">
            <div className="flex justify-between items-center">
              {selectedAnalista && (
                <span className="text-sm text-gray-600 flex items-center">
                  Analista: {selectedAnalista.shortName} ({selectedAnalista.email})
                </span>
              )}
              {!selectedAnalista && (
                <span className="text-sm text-gray-500 flex items-center">
                  Selecione um analista responsável
                </span>
              )}
              <div className="flex gap-2">
                {/* Botão Salvar Temporariamente - Temporariamente comentado
                <Button
                  variant="outline"
                  className="bg-orange-500 hover:bg-orange-600 text-white hover:text-white"
                  onClick={handleSaveTemporary}
                  disabled={isLoading || !formData.funcionario || !formData.data_infracao}
                >
                  {isLoading ? "Salvando..." : "Salvar Temporariamente"}
                </Button>
                */}
                <Button 
                  type="submit" 
                  className="bg-black hover:bg-black/90"
                  onClick={handleSubmit}

                  disabled={isLoading}
                >
                  {isLoading ? "Gerando Tratativa..." : "Gerar Tratativa"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de fechamento */}
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
            setSelectedAnalista(null);
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
                      disabled={isLoading}
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
            <AlertDialogCancel disabled={isLoading}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Previne o comportamento padrão que fecha o modal automaticamente
                e.preventDefault()
                if (handleAnalistaConfirm()) {
                  confirmAnalistaSelection();
                }
              }}
              disabled={isLoading || !confirmationNome}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-600"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Fullscreen para Imagem */}
      {showFullscreen && files.length > 0 && (
        <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
          <DialogContent className="max-w-fit max-h-[95vh] p-2">
            <DialogHeader className="sr-only">
              <DialogTitle>Preview da Imagem</DialogTitle>
            </DialogHeader>
            <div className="relative flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white"
                onClick={() => setShowFullscreen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <img
                src={imageUrls[0]}
                alt="Preview Fullscreen"
                className="max-w-[90vw] max-h-[calc(90vh-4rem)] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

