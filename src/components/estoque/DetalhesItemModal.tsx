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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { SectionTitle } from "@/components/ui/section-title"
import { DetailItem } from "@/components/ui/detail-item"

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
    ultima_movimentacao_detalhes?: {
      data: string
      tipo: 'entrada' | 'saida'
      quantidade: number
      motivo: string
      responsavel: string
      destino?: string | null
      frota?: string | null
      nota_fiscal?: string | null
    }
    categoria?: {
      nome: string
    }
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
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMovimentacao, setShowMovimentacao] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imagens, setImagens] = useState<ImagemItem[]>([])

  // Form states
  const [codigoFabricante, setCodigoFabricante] = useState(item.codigo_fabricante)
  const [descricao, setDescricao] = useState(item.descricao)
  const [quantidade, setQuantidade] = useState(String(item.quantidade_atual))
  const [nivelMinimo, setNivelMinimo] = useState(item.nivel_minimo ? String(item.nivel_minimo) : "")
  const [nivelCritico, setNivelCritico] = useState(item.nivel_critico ? String(item.nivel_critico) : "")
  const [alertasAtivos, setAlertasAtivos] = useState(item.alertas_ativos ?? true)
  const [observacoes, setObservacoes] = useState(item.observacoes || "")

  useEffect(() => {
    if (open) {
      setIsEditing(false) // Reset editing mode when modal opens
      loadImagens()
    }
  }, [open, item.id])

  const loadImagens = async () => {
    try {
      const { data: imagensData, error } = await supabase
        .from('imagens_item')
        .select('*')
        .eq('item_id', item.id)

      if (error) throw error

      setImagens(imagensData || [])
      if (imagensData.length > 0) {
        const firstImageUrl = supabase.storage
          .from('itens-estoque')
          .getPublicUrl(imagensData[0].url_imagem).data.publicUrl
        setSelectedImage(firstImageUrl)
      }
    } catch (error) {
      console.error('Erro ao carregar imagens:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as imagens do item",
        variant: "destructive",
      })
    }
  }

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
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('itens-estoque')
        .remove([imagem.url_imagem])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('imagens_item')
        .delete()
        .eq('id', imagem.id)

      if (dbError) throw dbError

      setImagens(prev => prev.filter(img => img.id !== imagem.id))
      
      if (selectedImage === supabase.storage.from('itens-estoque').getPublicUrl(imagem.url_imagem).data.publicUrl) {
        const remainingImages = imagens.filter(img => img.id !== imagem.id)
        if (remainingImages.length > 0) {
          setSelectedImage(supabase.storage.from('itens-estoque').getPublicUrl(remainingImages[0].url_imagem).data.publicUrl)
        } else {
          setSelectedImage(null)
        }
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setIsLoading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileName = `${item.id}/${Date.now()}-${file.name}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('itens-estoque')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: dbData, error: dbError } = await supabase
          .from('imagens_item')
          .insert([{
            item_id: item.id,
            url_imagem: uploadData.path
          }])
          .select()
          .single()

        if (dbError) throw dbError

        const newImagem: ImagemItem = {
          id: dbData.id,
          url_imagem: uploadData.path
        }

        setImagens(prev => [...prev, newImagem])
        setSelectedImage(supabase.storage.from('itens-estoque').getPublicUrl(uploadData.path).data.publicUrl)
      }

      toast({
        title: "Sucesso",
        description: "Imagens carregadas com sucesso",
      })
    } catch (error) {
      console.error('Erro ao carregar imagens:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar uma ou mais imagens",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] h-[90vh] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center h-14 shrink-0 border-b px-4">
            <div className="flex-1" />
            <DialogTitle className="text-xl font-semibold flex-1 text-center">
              {isEditing ? "Editar Item" : "Detalhes do Item"} - {item.descricao}
            </DialogTitle>
            <div className="flex-1 flex justify-end gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md shadow-sm"
                onClick={() => setShowMovimentacao(true)}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md shadow-sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md shadow-sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
              <DialogClose asChild>
                <Button 
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md shadow-sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 min-h-0">
            {/* Left Column - Informações */}
            <div className="w-[30%] overflow-y-auto border-r border-gray-200">
              <div className="p-4 space-y-6">
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="codigoFabricante">Código do Fabricante</Label>
                      <Input
                        id="codigoFabricante"
                        value={codigoFabricante}
                        onChange={(e) => setCodigoFabricante(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Input
                        id="descricao"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantidade">Quantidade Atual</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nivelMinimo">Nível Mínimo</Label>
                      <Input
                        id="nivelMinimo"
                        type="number"
                        value={nivelMinimo}
                        onChange={(e) => setNivelMinimo(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nivelCritico">Nível Crítico</Label>
                      <Input
                        id="nivelCritico"
                        type="number"
                        value={nivelCritico}
                        onChange={(e) => setNivelCritico(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="alertasAtivos"
                        checked={alertasAtivos}
                        onCheckedChange={(checked) => setAlertasAtivos(checked as boolean)}
                      />
                      <Label htmlFor="alertasAtivos">Alertas Ativos</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        className="h-[100px]"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isLoading} className="bg-black hover:bg-black/90">
                        {isLoading ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <SectionTitle title="Informações do Item" />
                      <div className="grid grid-cols-1 gap-4">
                        <DetailItem label="Código do Fabricante" value={item.codigo_fabricante} />
                        <DetailItem label="Descrição" value={item.descricao} />
                        <DetailItem label="Categoria" value={item.categoria?.nome || 'Sem Categoria'} />
                        <DetailItem label="Quantidade Atual" value={item.quantidade_atual} />
                        <DetailItem label="Nível Mínimo" value={item.nivel_minimo || '-'} />
                        <DetailItem label="Nível Crítico" value={item.nivel_critico || '-'} />
                        <DetailItem 
                          label="Alertas Ativos" 
                          value={
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              item.alertas_ativos
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {item.alertas_ativos ? "Sim" : "Não"}
                            </span>
                          }
                        />
                      </div>
                    </div>

                    {item.observacoes && (
                      <div>
                        <SectionTitle title="Observações" />
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{item.observacoes}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Middle Column - Última Movimentação */}
            <div className="w-[30%] overflow-y-auto border-r border-gray-200">
              <div className="p-4">
                {item.ultima_movimentacao_detalhes && (
                  <div>
                    <SectionTitle title="Última Movimentação" />
                    <div className="grid grid-cols-1 gap-4">
                      <DetailItem 
                        label="Data" 
                        value={format(new Date(item.ultima_movimentacao_detalhes.data), "dd/MM/yyyy HH:mm", { locale: ptBR })} 
                      />
                      <DetailItem 
                        label="Tipo" 
                        value={
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            item.ultima_movimentacao_detalhes.tipo === 'entrada'
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {item.ultima_movimentacao_detalhes.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                          </span>
                        }
                      />
                      <DetailItem label="Quantidade" value={item.ultima_movimentacao_detalhes.quantidade} />
                      <DetailItem label="Motivo" value={item.ultima_movimentacao_detalhes.motivo} />
                      <DetailItem label="Responsável" value={item.ultima_movimentacao_detalhes.responsavel} />
                      {item.ultima_movimentacao_detalhes.tipo === 'saida' && (
                        <>
                          <DetailItem 
                            label="Destino" 
                            value={item.ultima_movimentacao_detalhes.destino || '-'} 
                          />
                          <DetailItem 
                            label="Frota" 
                            value={item.ultima_movimentacao_detalhes.frota || '-'} 
                          />
                        </>
                      )}
                      {item.ultima_movimentacao_detalhes.tipo === 'entrada' && (
                        <DetailItem 
                          label="Nota Fiscal" 
                          value={item.ultima_movimentacao_detalhes.nota_fiscal || '-'} 
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Imagens */}
            <div className="w-[40%] overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <SectionTitle title="Imagens" />
                  {isEditing && (
                    <>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        Adicionar Imagens
                      </Button>
                    </>
                  )}
                </div>
                {imagens.length > 0 ? (
                  <div className="space-y-4">
                    {/* Imagem Principal */}
                    <div className="bg-white rounded-lg border border-gray-200 h-[400px] relative">
                      {selectedImage && (
                        <Image
                          src={selectedImage}
                          alt="Imagem principal"
                          fill
                          className="object-contain"
                          sizes="(max-width: 1200px) 40vw"
                        />
                      )}
                      {isEditing && selectedImage && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 bg-white"
                          onClick={() => {
                            const imagemToDelete = imagens.find(img => 
                              supabase.storage.from('itens-estoque').getPublicUrl(img.url_imagem).data.publicUrl === selectedImage
                            )
                            if (imagemToDelete) {
                              handleDeleteImage(imagemToDelete)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    {/* Miniaturas */}
                    <div className="relative">
                      <div
                        id="thumbnails-container"
                        className="flex gap-2 overflow-x-auto scrollbar-hide py-2"
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
                              onClick={() => setSelectedImage(imageUrl)}
                            >
                              <Image
                                src={imageUrl}
                                alt={`Imagem ${imagem.id}`}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-sm text-gray-500">Nenhuma imagem cadastrada</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Excluir Item"
        description="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
      />

      {/* Movimentação Modal */}
      <MovimentacaoEstoqueModal
        open={showMovimentacao}
        onOpenChange={setShowMovimentacao}
        item={item}
        onSuccess={onSuccess}
      />
    </Dialog>
  )
} 