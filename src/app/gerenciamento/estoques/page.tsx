"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryOverview } from "@/components/inventory/inventory-overview"
import { InventoryList } from "@/components/inventory/inventory-list"
import { InventoryMovements } from "@/components/inventory/inventory-movements"
import { ConferenciasTable } from "@/components/conferencias/conferencias-table"

export default function EstoquesPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
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
          <TabsTrigger 
            value="conferences" 
            className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground"
          >
            Conferências
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 p-2">
          <TabsContent value="overview" className="h-full m-0">
            <InventoryOverview 
              settings={{
                showCategories: true,
                showLowStock: true,
                showCharts: true
              }} 
            />
          </TabsContent>

          <TabsContent value="list" className="h-full m-0">
            <InventoryList 
              settings={{
                showFilters: true,
                showExport: true,
                columns: [
                  'codigo_fabricante',
                  'descricao',
                  'categoria',
                  'quantidade_atual',
                  'ultima_movimentacao'
                ]
              }} 
            />
          </TabsContent>

          <TabsContent value="movements" className="h-full m-0">
            <InventoryMovements 
              settings={{
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
              }} 
            />
          </TabsContent>

          <TabsContent value="conferences" className="h-full m-0">
            <ConferenciasTable />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
} 