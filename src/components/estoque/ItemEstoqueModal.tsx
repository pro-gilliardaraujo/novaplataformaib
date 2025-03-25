"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { X, Upload, X as XIcon, Check } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CategoriaItem {
  id: string
  nome: string
  descricao?: string
  cor?: string
}

interface ItemEstoqueModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  categorias: CategoriaItem[]
}

export function ItemEstoqueModal({ open, onOpenChange, onSuccess, categorias }: ItemEstoqueModalProps) {
  const [descricao, setDescricao] = useState("")
  const [codigoFabricante, setCodigoFabricante] = useState("")
  const [quantidadeAtual, setQuantidadeAtual] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [categoryInput, setCategoryInput] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CategoriaItem | null>(null)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [nivelMinimo, setNivelMinimo] = useState<string>("")
  const [nivelCritico, setNivelCritico] = useState<string>("")
  const [alertasAtivos, setAlertasAtivos] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Função para gerar uma cor aleatória em formato hexadecimal
  const generateRandomColor = () => {
    const letters = '0123456789ABCDEF'
    let color = '#'
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)]
    }
    return color
  }

  // Função para criar uma nova categoria
  const createCategory = async (nome: string) => {
    try {
      const { data, error } = await supabase
        .from('categorias_item')
        .insert([
          {
            nome,
            cor: generateRandomColor()
          }
        ])
        .select()
        .single()

      if (error) throw error

      const newCategory = data as CategoriaItem
      setSelectedCategory(newCategory)
      return newCategory
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      throw error
    }
  }

  // Filtra categorias baseado no input
  const filteredCategories = categorias.filter(categoria =>
    categoria.nome.toLowerCase().includes(categoryInput.toLowerCase())
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descricao || !codigoFabricante || !quantidadeAtual) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Se temos um input de categoria mas não uma categoria selecionada, cria uma nova
      let categoryId = selectedCategory?.id
      if (categoryInput && !selectedCategory) {
        try {
          const newCategory = await createCategory(categoryInput)
          categoryId = newCategory.id
        } catch (error) {
          console.error('Erro ao criar categoria:', error)
          toast({
            title: "Erro",
            description: "Não foi possível criar a categoria",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
      }

      // 1. Inserir o item
      const { data: itemData, error: itemError } = await supabase
        .from('itens_estoque')
        .insert([
          {
            descricao,
            codigo_fabricante: codigoFabricante,
            quantidade_atual: Number(quantidadeAtual),
            observacoes: observacoes || null,
            category_id: categoryId || null,
            nivel_minimo: nivelMinimo ? Number(nivelMinimo) : null,
            nivel_critico: nivelCritico ? Number(nivelCritico) : null,
            alertas_ativos: alertasAtivos,
          }
        ])
        .select()
        .single()

      if (itemError) {
        throw itemError
      }

      if (!itemData) {
        throw new Error("Não foi possível obter os dados do item após a inserção")
      }

      // 2. Upload images if any
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${itemData.id}/${Date.now()}.${fileExt}`
            
            const { error: uploadError } = await supabase.storage
              .from('itens-estoque')
              .upload(fileName, file)

            if (uploadError) {
              throw uploadError
            }

            // Save image reference
            const { error: imageError } = await supabase
              .from('imagens_item')
              .insert([{
                item_id: itemData.id,
                url_imagem: fileName
              }])

            if (imageError) {
              throw imageError
            }

            return fileName
          } catch (error) {
            console.error('Erro ao processar imagem:', error)
            return null
          }
        })

        const results = await Promise.allSettled(uploadPromises)
        const failedUploads = results.filter(r => r.status === 'rejected').length

        if (failedUploads > 0) {
          toast({
            title: "Aviso",
            description: `Item cadastrado, mas ${failedUploads} ${failedUploads === 1 ? 'imagem falhou' : 'imagens falharam'} ao ser enviada.`,
            variant: "destructive",
          })
        }
      }
      
      toast({
        title: "Sucesso",
        description: "Item cadastrado com sucesso",
      })

      handleOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Erro ao cadastrar item:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível cadastrar o item",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setDescricao("")
      setCodigoFabricante("")
      setQuantidadeAtual("")
      setObservacoes("")
      setCategoryInput("")
      setSelectedCategory(null)
      setSelectedFiles([])
      setNivelMinimo("")
      setNivelCritico("")
      setAlertasAtivos(true)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[900px]">
        <div>
          <div className="flex items-center">
            <div className="flex-1" />
            <DialogTitle className="text-xl font-semibold flex-1 text-center">Cadastrar Novo Item</DialogTitle>
            <div className="flex-1 flex justify-end">
              <DialogClose asChild>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline"
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Fechar</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </DialogClose>
            </div>
          </div>
          <div className="border-b mt-4" />
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Digite a descrição do item"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigoFabricante">Código do Fabricante *</Label>
                <Input
                  id="codigoFabricante"
                  value={codigoFabricante}
                  onChange={(e) => setCodigoFabricante(e.target.value)}
                  placeholder="Digite o código do fabricante"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantidadeAtual">Quantidade Atual *</Label>
                <Input
                  id="quantidadeAtual"
                  type="number"
                  value={quantidadeAtual}
                  onChange={(e) => setQuantidadeAtual(e.target.value)}
                  placeholder="Digite a quantidade atual"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria (opcional)</Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between"
                    >
                      {selectedCategory ? (
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: selectedCategory.cor || '#000' }}
                          />
                          {selectedCategory.nome}
                        </div>
                      ) : categoryInput || "Selecione ou digite para criar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Busque ou crie uma categoria..."
                        value={categoryInput}
                        onValueChange={setCategoryInput}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && categoryInput && !filteredCategories.length) {
                            e.preventDefault()
                            createCategory(categoryInput).then(() => {
                              setOpenCombobox(false)
                            })
                          }
                        }}
                      />
                      <CommandEmpty>
                        {categoryInput ? (
                          <div className="px-2 py-3 text-sm">
                            Pressione Enter para criar "{categoryInput}"
                          </div>
                        ) : (
                          "Nenhuma categoria encontrada"
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredCategories.map((categoria) => (
                          <CommandItem
                            key={categoria.id}
                            value={categoria.nome}
                            onSelect={() => {
                              setSelectedCategory(categoria)
                              setCategoryInput(categoria.nome)
                              setOpenCombobox(false)
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: categoria.cor || '#000' }}
                              />
                              {categoria.nome}
                            </div>
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                selectedCategory?.id === categoria.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-4">
                <Label>Níveis de Estoque</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nivelMinimo">Nível Mínimo</Label>
                    <Input
                      id="nivelMinimo"
                      type="number"
                      min="0"
                      value={nivelMinimo}
                      onChange={(e) => setNivelMinimo(e.target.value)}
                      placeholder="Digite o nível mínimo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nivelCritico">Nível Crítico</Label>
                    <Input
                      id="nivelCritico"
                      type="number"
                      min="0"
                      value={nivelCritico}
                      onChange={(e) => setNivelCritico(e.target.value)}
                      placeholder="Digite o nível crítico"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="alertasAtivos"
                    checked={alertasAtivos}
                    onCheckedChange={(checked) => setAlertasAtivos(checked as boolean)}
                  />
                  <Label htmlFor="alertasAtivos" className="cursor-pointer">
                    Ativar alertas de estoque baixo
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Digite observações sobre o item"
                  className="resize-none h-[120px]"
                />
              </div>
            </div>

            {/* Right Column - Images */}
            <div className="space-y-4">
              <Label>Imagens</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500">Arraste imagens ou clique para selecionar</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Selecionar Arquivos
                  </Button>
                </div>
              </div>

              {/* Selected files preview */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Arquivos Selecionados</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeFile(index)}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={isLoading} className="bg-black hover:bg-black/90">
              {isLoading ? "Cadastrando..." : "Cadastrar Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 