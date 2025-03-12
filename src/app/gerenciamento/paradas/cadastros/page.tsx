"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TiposParadaTable } from "@/components/paradas/cadastros/tipos-parada-table"
import { UnidadesTable } from "@/components/paradas/cadastros/unidades-table"
import { FrotasTable } from "@/components/paradas/cadastros/frotas-table"

export default function CadastrosPage() {
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="tipos" className="flex-1">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-2">
          <TabsTrigger value="tipos" className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground">
            Tipos de Parada
          </TabsTrigger>
          <TabsTrigger value="unidades" className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground">
            Unidades
          </TabsTrigger>
          <TabsTrigger value="frotas" className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground">
            Frotas
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 p-2">
          <TabsContent value="tipos" className="h-full m-0">
            <TiposParadaTable />
          </TabsContent>
          <TabsContent value="unidades" className="h-full m-0">
            <UnidadesTable />
          </TabsContent>
          <TabsContent value="frotas" className="h-full m-0">
            <FrotasTable />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
} 