"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CavVisaoGeral } from "@/components/cav/visao-geral"
import { CavListaDetalhada } from "@/components/cav/lista-detalhada"
import { DiarioCav } from "@/components/cav/diario-cav"

export default function CavPage() {
  const [activeTab, setActiveTab] = useState("visao-geral")

  return (
    <div className="h-full flex flex-col">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex-1"
      >
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-2">
          <TabsTrigger 
            value="visao-geral" 
            className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground"
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger 
            value="lista-detalhada" 
            className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground"
          >
            Lista Detalhada
          </TabsTrigger>
          <TabsTrigger 
            value="diario-cav" 
            className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground"
          >
            Diário CAV
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 p-2">
          <TabsContent value="visao-geral" className="h-full m-0">
            <CavVisaoGeral />
          </TabsContent>
          
          <TabsContent value="lista-detalhada" className="h-full m-0">
            <CavListaDetalhada />
          </TabsContent>
          
          <TabsContent value="diario-cav" className="h-full m-0">
            <DiarioCav />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
