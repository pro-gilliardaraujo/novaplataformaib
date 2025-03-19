"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { X, Edit, Trash2, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import { MovimentacaoEstoqueModal } from "./MovimentacaoEstoqueModal"
import { HistoricoMovimentacoes } from "./HistoricoMovimentacoes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface DetalhesItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: {
    id: string
    descricao: string
    codigo_fabricante: string
    quantidade_atual: number
    observacoes?: string
    category_id?: string
    nivel_minimo?: number
    nivel_critico?: number
    alertas_ativos?: boolean
  }
  onSuccess: () => void
  categorias: {
    id: string
    nome: string
    descricao?: string
    cor?: string
  }[]
}

interface ImagemItem {
  id: string
  url_imagem: string
}

export function DetalhesItemModal({ open, onOpenChange, item, onSuccess, categorias }: DetalhesItemModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [descricao, setDescricao] = useState(item.descricao)
  const [codigoFabricante, setCodigoFabricante] = useState(item.codigo_fabricante)
  const [quantidade, setQuantidade] = useState(String(item.quantidade_atual))
  const [observacoes, setObservacoes] = useState(item.observacoes || "")
  const [categoryId, setCategoryId] = useState(item.category_id || "")
  const [nivelMinimo, setNivelMinimo] = useState(item.nivel_minimo ? String(item.nivel_minimo) : "")
  const [nivelCritico, setNivelCritico] = useState(item.nivel_critico ? String(item.nivel_critico) : "")
  const [alertasAtivos, setAlertasAtivos] = useState(item.alertas_ativos ?? true)
  const [imagens, setImagens] = useState<ImagemItem[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showMovimentacao, setShowMovimentacao] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  // Load images when modal opens
  const carregarImagens = async () => {
    try {
      const { data, error } = await supabase
        .from('imagens_item')
        .select('*')
        .eq('item_id', item.id)

      if (error) throw error

      setImagens(data || [])
    } catch (error) {
      console.error('Erro ao carregar imagens:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as imagens do item",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (open) {
      setIsEditing(false) // Reset editing mode when modal opens
      carregarImagens()
    }
  }, [open, item.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!descricao || !codigoFabricante || !quantidade) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('itens_estoque')
        .update({
          descricao,
          codigo_fabricante: codigoFabricante,
          quantidade_atual: Number(quantidade),
          observacoes,
          category_id: categoryId || null,
          nivel_minimo: nivelMinimo ? Number(nivelMinimo) : null,
          nivel_critico: nivelCritico ? Number(nivelCritico) : null,
          alertas_ativos: alertasAtivos
        })
        .eq('id', item.id)
        .select()
        .single()

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o item: " + error.message,
          variant: "destructive",
        })
        return
      }
      
      toast({
        title: "Sucesso",
        description: "Item atualizado com sucesso",
      })

      onSuccess()
      setIsEditing(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao atualizar item:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar o item",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      // 1. Delete images from storage
      for (const imagem of imagens) {
        const { error: storageError } = await supabase.storage
          .from('itens-estoque')
          .remove([imagem.url_imagem])

        if (storageError) throw storageError
      }

      // 2. Delete image references
      const { error: imageError } = await supabase
        .from('imagens_item')
        .delete()
        .eq('item_id', item.id)

      if (imageError) throw imageError

      // 3. Delete item
      const { error: itemError } = await supabase
        .from('itens_estoque')
        .delete()
        .eq('id', item.id)

      if (itemError) throw itemError
      
      toast({
        title: "Sucesso",
        description: "Item excluído com sucesso",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao excluir item:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteImage = async (imagem: ImagemItem) => {
    try {
      // 1. Delete from storage
      const { error: storageError } = await supabase.storage
        .from('itens-estoque')
        .remove([imagem.url_imagem])

      if (storageError) throw storageError

      // 2. Delete from database
      const { error: dbError } = await supabase
        .from('imagens_item')
        .delete()
        .eq('id', imagem.id)

      if (dbError) throw dbError

      // 3. Reload images from database
      await carregarImagens()

      // 4. Clear selected image if it was deleted
      if (selectedImage === supabase.storage.from('itens-estoque').getPublicUrl(imagem.url_imagem).data.publicUrl) {
        setSelectedImage(null)
      }

      toast({
        title: "Sucesso",
        description: "Imagem excluída com sucesso",
      })
    } catch (error) {
      console.error('Erro ao excluir imagem:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a imagem",
        variant: "destructive",
      })
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsEditing(false)
      setSelectedImage(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      // Só fecha o modal se clicar fora dele ou no X
      if (!open) {
        handleOpenChange(false)
      }
    }}>
      <DialogContent className="max-w-[1200px] h-[90vh] p-0">
        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center h-14 border-b px-4">
            <div className="flex-1" />
            <DialogTitle className="text-xl font-semibold flex-1 text-center">
              {isEditing ? `Editar - ${item.descricao}` : `Detalhes - ${item.descricao}`}
            </DialogTitle>
            <div className="flex-1 flex justify-end gap-2">
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowMovimentacao(true)}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isLoading}
                title="Excluir item"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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

          {/* Main Content Container */}
          <div className="flex-1 flex">
            {/* Left Container - Fields */}
            <div className="w-[40%] border-r p-4">
              <div className="h-full overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="descricao" className="text-sm font-medium text-gray-500">Descrição</Label>
                    {isEditing ? (
                      <Input
                        id="descricao"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        className="mt-1 w-full"
                      />
                    ) : (
                      <p className="mt-1">{descricao}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="codigo" className="text-sm font-medium text-gray-500">Código do Fabricante</Label>
                    {isEditing ? (
                      <Input
                        id="codigo"
                        value={codigoFabricante}
                        onChange={(e) => setCodigoFabricante(e.target.value)}
                        className="mt-1 w-full"
                      />
                    ) : (
                      <p className="mt-1">{codigoFabricante}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="quantidade" className="text-sm font-medium text-gray-500">Quantidade</Label>
                    {isEditing ? (
                      <Input
                        id="quantidade"
                        type="number"
                        min="0"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        className="mt-1 w-full"
                      />
                    ) : (
                      <p className="mt-1">{quantidade}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="nivelMinimo" className="text-sm font-medium text-gray-500">Nível Mínimo</Label>
                    {isEditing ? (
                      <Input
                        id="nivelMinimo"
                        type="number"
                        min="0"
                        value={nivelMinimo}
                        onChange={(e) => setNivelMinimo(e.target.value)}
                        className="mt-1 w-full"
                      />
                    ) : (
                      <p className="mt-1">{nivelMinimo || "Não definido"}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="nivelCritico" className="text-sm font-medium text-gray-500">Nível Crítico</Label>
                    {isEditing ? (
                      <Input
                        id="nivelCritico"
                        type="number"
                        min="0"
                        value={nivelCritico}
                        onChange={(e) => setNivelCritico(e.target.value)}
                        className="mt-1 w-full"
                      />
                    ) : (
                      <p className="mt-1">{nivelCritico || "Não definido"}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <>
                        <Checkbox
                          id="alertasAtivos"
                          checked={alertasAtivos}
                          onCheckedChange={(checked) => setAlertasAtivos(checked as boolean)}
                        />
                        <Label htmlFor="alertasAtivos" className="cursor-pointer">
                          Ativar alertas de estoque baixo
                        </Label>
                      </>
                    ) : (
                      <p className="text-gray-600">
                        Alertas: {alertasAtivos ? "Ativos" : "Inativos"}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="observacoes" className="text-sm font-medium text-gray-500">Observações</Label>
                    {isEditing ? (
                      <Textarea
                        id="observacoes"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        className="mt-1 resize-none h-[120px] w-full"
                      />
                    ) : (
                      <p className="mt-1 whitespace-pre-wrap">{observacoes || "Nenhuma observação"}</p>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex justify-end pt-4">
                      <Button 
                        onClick={handleSubmit} 
                        disabled={isLoading} 
                        className="bg-black hover:bg-black/90 w-full"
                      >
                        {isLoading ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Container - Images */}
            <div className="w-[60%] p-4">
              <div className="h-full flex flex-col">
                {imagens.length > 0 ? (
                  <>
                    {/* Main Image Container */}
                    <div className="flex-1 bg-white rounded-lg border border-gray-200">
                      <div className="relative w-full h-full">
                        <Image
                          src={selectedImage || supabase.storage
                            .from('itens-estoque')
                            .getPublicUrl(imagens[0].url_imagem).data.publicUrl}
                          alt="Imagem principal"
                          fill
                          className="object-contain"
                          sizes="(max-width: 1200px) 75vw, 50vw"
                        />
                      </div>
                    </div>

                    {/* Thumbnails Container */}
                    <div className="h-24 mt-3 bg-white rounded-lg border border-gray-200">
                      <div className="relative h-full px-2">
                        {imagens.length > 4 && (
                          <>
                            <button
                              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow-md border border-gray-200"
                              onClick={() => {
                                const container = document.getElementById('thumbnails-container')
                                if (container) {
                                  container.scrollLeft -= 80
                                }
                              }}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow-md border border-gray-200"
                              onClick={() => {
                                const container = document.getElementById('thumbnails-container')
                                if (container) {
                                  container.scrollLeft += 80
                                }
                              }}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <div 
                          id="thumbnails-container"
                          className="flex gap-2 overflow-x-auto scrollbar-hide h-full items-center px-1"
                        >
                          {imagens.map((imagem) => {
                            const imageUrl = supabase.storage
                              .from('itens-estoque')
                              .getPublicUrl(imagem.url_imagem).data.publicUrl

                            return (
                              <div
                                key={imagem.id}
                                className={`relative h-[80px] w-[80px] flex-shrink-0 rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                                  selectedImage === imageUrl 
                                    ? 'border-black' 
                                    : 'border-gray-200 hover:border-gray-400'
                                }`}
                              >
                                {isEditing && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="absolute top-1 right-1 h-5 w-5 bg-white/80 hover:bg-white border-none p-0 z-10"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteImage(imagem)
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                                <div onClick={() => setSelectedImage(imageUrl)}>
                                  <Image
                                    src={imageUrl}
                                    alt={`Imagem ${imagem.id}`}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500">Nenhuma imagem cadastrada</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Movimentação Modal */}
        <MovimentacaoEstoqueModal
          open={showMovimentacao}
          onOpenChange={setShowMovimentacao}
          item={item}
          onSuccess={onSuccess}
        />

        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Excluir Item"
          description={`Tem certeza que deseja excluir o item "${item.descricao}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDelete}
          variant="destructive"
        />
      </DialogContent>
    </Dialog>
  )
} 