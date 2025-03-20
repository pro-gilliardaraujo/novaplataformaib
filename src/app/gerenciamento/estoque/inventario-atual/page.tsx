"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryList } from "@/components/reports/inventory/InventoryList"
import { InventoryOverview } from "@/components/reports/inventory/InventoryOverview"
import { supabase } from "@/lib/supabase"

interface InventorySettings {
  showFilters: boolean
  showExport: boolean
  columns: string[]
}

interface CategoriaItem {
  id: string
  nome: string
  cor?: string
}

export default function InventarioAtualPage() {
  const [categorias, setCategorias] = useState<CategoriaItem[]>([])

  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const { data, error } = await supabase
          .from('categorias_item')
          .select('id, nome, cor')
          .order('nome')

        if (error) throw error
        setCategorias(data || [])
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      }
    }

    loadCategorias()
  }, [])

  const listSettings: InventorySettings = {
    showFilters: true,
    showExport: true,
    columns: [
      'codigo_fabricante',
      'descricao',
      'categoria',
      'quantidade_atual',
      'ultima_movimentacao'
    ]
  }

  const overviewSettings = {
    showCategories: true,
    showLowStock: true,
    showCharts: true
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="overview" className="flex-1">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-2">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="list" className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground">
            Lista Detalhada
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 p-2">
          <TabsContent value="overview" className="h-full m-0">
            <InventoryOverview settings={overviewSettings} />
          </TabsContent>
          <TabsContent value="list" className="h-full m-0">
            <InventoryList settings={listSettings} categorias={categorias} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
} 