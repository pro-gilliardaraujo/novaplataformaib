"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { X, Upload, X as XIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [categoryId, setCategoryId] = useState<string>("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

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

    try {
      setIsLoading(true)

      const { data: itemData, error: itemError } = await supabase
        .from('items_estoque')
        .insert([
          {
            descricao,
            codigo_fabricante: codigoFabricante,
            quantidade_atual: Number(quantidadeAtual),
            observacoes: observacoes || null,
            category_id: categoryId || null,
          }
        ])
        .select()
        .single()

      if (itemError) throw itemError

      // 2. Upload images if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${itemData.id}/${Date.now()}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('itens-estoque')
            .upload(fileName, file)

          if (uploadError) throw uploadError

          // 3. Save image reference
          const { error: imageError } = await supabase
            .from('imagens_item')
            .insert([
              {
                item_id: itemData.id,
                url_imagem: fileName
              }
            ])

          if (imageError) throw imageError
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
        description: "Não foi possível cadastrar o item",
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
      setCategoryId("")
      setSelectedFiles([])
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
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: categoria.cor || '#000' }}
                          />
                          {categoria.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-black hover:bg-black/90">
              {isLoading ? "Cadastrando..." : "Cadastrar Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 