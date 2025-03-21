"use client"

import { useState, useEffect } from "react"
import { Tab } from "@/types/pages"
import { Tabs as TabsRoot, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { InventoryList } from "@/components/reports/inventory/InventoryList"
import { InventoryOverview } from "@/components/reports/inventory/InventoryOverview"
import { InventoryMovements } from "@/components/reports/inventory/InventoryMovements"
import { supabase } from "@/lib/supabase"

interface CustomTabsProps {
  tabs: Tab[]
}

interface TabContent {
  type?: string;
  settings?: {
    showCategories?: boolean;
    showLowStock?: boolean;
    showCharts?: boolean;
    showFilters?: boolean;
    showExport?: boolean;
    showDateRange?: boolean;
    columns?: string[];
    [key: string]: any;
  };
}

function TabContentRenderer({ content }: { content: string | TabContent }) {
  const [categorias, setCategorias] = useState<{ id: string; nome: string; cor?: string }[]>([])

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

  useEffect(() => {
    if (typeof content === "object" && content.type === "inventory-list") {
      loadCategorias()
    }
  }, [content])

  if (typeof content === "string") {
    return (
      <div 
        className="h-full w-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-none" 
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  // Renderizar componentes baseado no tipo
  switch (content.type) {
    case "inventory-list":
      return <InventoryList 
        settings={{
          showFilters: content.settings?.showFilters ?? true,
          showExport: content.settings?.showExport ?? true,
          columns: content.settings?.columns ?? []
        }}
        categorias={categorias}
        onCategoriaCreated={loadCategorias}
      />
    case "inventory-overview":
      return <InventoryOverview settings={{
        showCategories: content.settings?.showCategories ?? true,
        showLowStock: content.settings?.showLowStock ?? true,
        showCharts: content.settings?.showCharts ?? true
      }} />
    case "inventory-movements":
      return <InventoryMovements settings={{
        showFilters: content.settings?.showFilters ?? true,
        showExport: content.settings?.showExport ?? true,
        showDateRange: content.settings?.showDateRange ?? true,
        columns: content.settings?.columns ?? []
      }} />
    default:
      return <div>Tipo de conteúdo não suportado: {content.type || 'desconhecido'}</div>
  }
}

export function CustomTabs({ tabs }: CustomTabsProps) {
  if (!tabs || tabs.length === 0) {
    return <div>Nenhuma aba configurada</div>
  }

  // Ordenar as abas pelo order_index
  const sortedTabs = [...tabs].sort((a, b) => a.order_index - b.order_index)

  return (
    <TabsRoot defaultValue={sortedTabs[0]?.name} className="w-full h-full flex flex-col">
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
        {sortedTabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.name}
            className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            {tab.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {sortedTabs.map((tab) => (
        <TabsContent
          key={tab.id}
          value={tab.name}
          className="flex-1 m-0 p-4 data-[state=active]:flex h-full"
        >
          <TabContentRenderer content={tab.content} />
        </TabsContent>
      ))}
    </TabsRoot>
  )
} 