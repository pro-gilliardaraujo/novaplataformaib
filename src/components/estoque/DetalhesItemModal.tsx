"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { X, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

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
  const [imagens, setImagens] = useState<ImagemItem[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Load images when modal opens
  useEffect(() => {
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

    if (open) {
      carregarImagens()
    }
  }, [open, item.id, toast])

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
      const { error } = await supabase
        .from('items_estoque')
        .update({
          descricao,
          codigo_fabricante: codigoFabricante,
          quantidade_atual: Number(quantidade),
          observacoes
        })
        .eq('id', item.id)

      if (error) throw error
      
      toast({
        title: "Sucesso",
        description: "Item atualizado com sucesso",
      })

      onSuccess()
      setIsEditing(false)
    } catch (error) {
      console.error('Erro ao atualizar item:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o item",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return

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
        .from('items_estoque')
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsEditing(false)
      setSelectedImage(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[900px]">
        <div>
          <div className="flex items-center">
            <div className="flex-1" />
            <DialogTitle className="text-xl font-semibold flex-1 text-center">Detalhes do Item</DialogTitle>
            <div className="flex-1 flex justify-end gap-2">
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleDelete}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Left Column - Item Info */}
          <div className="space-y-4">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  {isEditing ? (
                    <Input
                      id="descricao"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-600">{descricao}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo">Código do Fabricante</Label>
                  {isEditing ? (
                    <Input
                      id="codigo"
                      value={codigoFabricante}
                      onChange={(e) => setCodigoFabricante(e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-600">{codigoFabricante}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade</Label>
                  {isEditing ? (
                    <Input
                      id="quantidade"
                      type="number"
                      min="0"
                      value={quantidade}
                      onChange={(e) => setQuantidade(e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-600">{quantidade}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  {isEditing ? (
                    <Textarea
                      id="observacoes"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      className="resize-none h-[120px]"
                    />
                  ) : (
                    <p className="text-gray-600 whitespace-pre-wrap">{observacoes || "Nenhuma observação"}</p>
                  )}
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading} className="bg-black hover:bg-black/90">
                      {isLoading ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Right Column - Images */}
          <div className="space-y-4">
            <Label>Imagens</Label>
            {imagens.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {imagens.map((imagem) => {
                  const imageUrl = supabase.storage
                    .from('itens-estoque')
                    .getPublicUrl(imagem.url_imagem).data.publicUrl

                  return (
                    <div
                      key={imagem.id}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => setSelectedImage(imageUrl)}
                    >
                      <Image
                        src={imageUrl}
                        alt={`Imagem ${imagem.id}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhuma imagem cadastrada</p>
            )}
          </div>
        </div>

        {/* Image Preview Modal */}
        {selectedImage && (
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-[90vw] max-h-[90vh]">
              <div className="relative w-full h-full">
                <Image
                  src={selectedImage}
                  alt="Preview"
                  fill
                  className="object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
} 