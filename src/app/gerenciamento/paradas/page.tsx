"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ParadasProvider } from "@/contexts/ParadasContext"
import { ParadasContent } from "@/components/paradas/paradas-content"
import { TiposParadaContent } from "@/components/paradas/cadastros/tipos-parada-content"
import { FrotasContent } from "@/components/paradas/cadastros/frotas-content"
import { UnidadesContent } from "@/components/paradas/cadastros/unidades-content"

export default function ParadasPage() {
  return (
    <ParadasProvider>
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="paradas" className="flex-1">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-2">
              <TabsTrigger 
                value="paradas" 
                className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground"
              >
                Paradas
              </TabsTrigger>
              <TabsTrigger 
                value="tipos" 
                className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground"
              >
                Tipos de Parada
              </TabsTrigger>
              <TabsTrigger 
                value="frotas" 
                className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground"
              >
                Frotas
              </TabsTrigger>
              <TabsTrigger 
                value="unidades" 
                className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground"
              >
                Unidades
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 p-2 bg-white">
              <TabsContent value="paradas" className="h-full m-0">
                <ParadasContent />
              </TabsContent>

              <TabsContent value="tipos" className="h-full m-0">
                <TiposParadaContent />
              </TabsContent>

              <TabsContent value="frotas" className="h-full m-0">
                <FrotasContent />
              </TabsContent>

              <TabsContent value="unidades" className="h-full m-0">
                <UnidadesContent />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </ParadasProvider>
  )
} 