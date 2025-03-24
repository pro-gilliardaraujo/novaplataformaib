"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ParadasProvider } from "@/contexts/ParadasContext"
import { TiposParadaContent } from "@/components/paradas/cadastros/tipos-parada-content"
import { FrotasContent } from "@/components/paradas/cadastros/frotas-content"
import { UnidadesContent } from "@/components/paradas/cadastros/unidades-content"

export default function ParadasPage() {
  const [activeTab, setActiveTab] = useState("tipos")

  return (
    <ParadasProvider>
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex flex-col">
          <Tabs 
            defaultValue="tipos" 
            className="flex-1"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <div className="border-b px-4">
              <TabsList className="border-0">
                <TabsTrigger value="tipos">Tipos de Parada</TabsTrigger>
                <TabsTrigger value="frotas">Frotas</TabsTrigger>
                <TabsTrigger value="unidades">Unidades</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 p-2">
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