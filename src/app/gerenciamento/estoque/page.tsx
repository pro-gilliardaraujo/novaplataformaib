"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryOverview } from "@/components/reports/inventory/InventoryOverview"
import InventoryList from "@/components/reports/inventory/InventoryList"
import { InventoryMovements } from "@/components/reports/inventory/InventoryMovements"

export default function EstoquePage() {
  const listSettings = {
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

  const movementsSettings = {
    showFilters: true,
    showExport: true,
    showDateRange: true,
    columns: [
      'data',
      'tipo',
      'motivo',
      'quantidade',
      'item',
      'responsavel'
    ]
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="overview" className="flex-1">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-2">
          <TabsTrigger 
            value="overview" 
            className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground"
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger 
            value="list" 
            className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground"
          >
            Lista Detalhada
          </TabsTrigger>
          <TabsTrigger 
            value="movements" 
            className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground"
          >
            Movimentações
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 p-2">
          <TabsContent value="overview" className="h-full m-0">
            <InventoryOverview settings={overviewSettings} />
          </TabsContent>
          <TabsContent value="list" className="h-full m-0">
            <InventoryList settings={listSettings} />
          </TabsContent>
          <TabsContent value="movements" className="h-full m-0">
            <InventoryMovements settings={movementsSettings} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
} 