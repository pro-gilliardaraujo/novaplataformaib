"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Search, Settings2, Tag } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ItemEstoqueModal } from "@/components/estoque/ItemEstoqueModal"
import { DetalhesItemModal } from "@/components/estoque/DetalhesItemModal"
import { CategoriaItemModal } from "@/components/estoque/CategoriaItemModal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

interface ItemEstoque {
  id: string
  descricao: string
  codigo_fabricante: string
  quantidade_atual: number
  category_id?: string
  created_at: string
  updated_at: string
}

interface CategoriaItem {
  id: string
  nome: string
  descricao?: string
  cor?: string
}

export default function EstoquePage() {
  const [items, setItems] = useState<ItemEstoque[]>([])
  const [categorias, setCategorias] = useState<CategoriaItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [modalCadastro, setModalCadastro] = useState(false)
  const [modalDetalhes, setModalDetalhes] = useState(false)
  const [modalCategoria, setModalCategoria] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemEstoque | null>(null)
  const [selectedCategoriaEdit, setSelectedCategoriaEdit] = useState<CategoriaItem | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Carregar itens
  const carregarItens = async () => {
    try {
      setIsLoading(true)
      console.log('Iniciando carregamento de itens...')

      // First, let's try a simple query to check if we can access the items_estoque table
      const { data: itemsData, error: itemsError } = await supabase
        .from('items_estoque')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Resposta da query items_estoque:', { itemsData, itemsError })

      if (itemsError) {
        console.error('Erro ao carregar itens:', itemsError)
        throw itemsError
      }

      if (!itemsData || itemsData.length === 0) {
        console.log('Nenhum item encontrado na tabela items_estoque')
        setItems([])
        return
      }

      // If successful, let's try to get the categories for each item
      console.log('Carregando categorias para cada item...')
      const itemsWithCategories = await Promise.all(
        itemsData.map(async (item) => {
          if (item.category_id) {
            console.log(`Buscando categoria para o item ${item.id} (category_id: ${item.category_id})`)
            const { data: categoryData, error: categoryError } = await supabase
              .from('categorias_item')
              .select('*')
              .eq('id', item.category_id)
              .single()

            if (categoryError) {
              console.error(`Erro ao carregar categoria para o item ${item.id}:`, categoryError)
              return item
            }

            console.log(`Categoria encontrada para o item ${item.id}:`, categoryData)
            return {
              ...item,
              categoria: categoryData
            }
          }
          return item
        })
      )

      console.log('Itens processados com categorias:', itemsWithCategories)
      setItems(itemsWithCategories)
    } catch (error: any) {
      console.error('Erro ao carregar itens:', error)
      toast({
        title: "Erro",
        description: `Não foi possível carregar os itens do estoque: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar categorias
  const carregarCategorias = async () => {
    try {
      console.log('Iniciando carregamento de categorias...')
      const { data, error } = await supabase
        .from('categorias_item')
        .select('*')
        .order('nome')

      console.log('Resposta da query categorias_item:', { data, error })

      if (error) {
        console.error('Erro detalhado:', error)
        throw error
      }

      if (!data || data.length === 0) {
        console.log('Nenhuma categoria encontrada')
      } else {
        console.log('Categorias encontradas:', data)
      }

      setCategorias(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error)
      toast({
        title: "Erro",
        description: `Não foi possível carregar as categorias: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    carregarItens()
    carregarCategorias()
  }, [])

  // Filtrar itens baseado na busca e categoria
  const itensFiltrados = items.filter(item =>
    (item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.codigo_fabricante.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedCategory === "all" || item.category_id === selectedCategory)
  )

  const handleItemClick = (item: ItemEstoque) => {
    setSelectedItem(item)
    setModalDetalhes(true)
  }

  const handleEditCategoria = (categoria: CategoriaItem) => {
    setSelectedCategoriaEdit(categoria)
    setModalCategoria(true)
  }

  return (
    <div className="h-screen flex flex-col p-4 bg-white">
      {/* Top bar */}
      <div className="flex flex-col gap-3 mb-3">
        <div className="flex justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              className="pl-9"
              placeholder="Buscar itens..." 
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setModalCategoria(true)}
            >
              <Tag className="mr-2 h-4 w-4" /> Categorias
            </Button>
            <Button
              className="bg-black hover:bg-black/90 text-white"
              onClick={() => setModalCadastro(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Novo Item
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
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

          {selectedCategory !== "all" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const categoria = categorias.find(c => c.id === selectedCategory)
                if (categoria) handleEditCategoria(categoria)
              }}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Items Grid */}
      <ScrollArea className="flex-1 border rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
          {itensFiltrados.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleItemClick(item)}
            >
              <h3 className="font-medium mb-2">{item.descricao}</h3>
              <div className="text-sm text-gray-500">
                <p>Código: {item.codigo_fabricante}</p>
                <p>Quantidade: {item.quantidade_atual}</p>
                {item.category_id && (
                  <div className="flex items-center gap-2 mt-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: (item as any).categoria?.cor || '#000' }}
                    />
                    <span>{(item as any).categoria?.nome}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Modals */}
      <ItemEstoqueModal
        open={modalCadastro}
        onOpenChange={setModalCadastro}
        onSuccess={carregarItens}
        categorias={categorias}
      />

      {selectedItem && (
        <DetalhesItemModal
          open={modalDetalhes}
          onOpenChange={setModalDetalhes}
          item={selectedItem}
          onSuccess={carregarItens}
          categorias={categorias}
        />
      )}

      <CategoriaItemModal
        open={modalCategoria}
        onOpenChange={(open) => {
          setModalCategoria(open)
          if (!open) setSelectedCategoriaEdit(undefined)
        }}
        categoria={selectedCategoriaEdit}
        onSuccess={carregarCategorias}
      />
    </div>
  )
} 