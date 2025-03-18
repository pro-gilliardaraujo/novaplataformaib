"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ParadasProvider } from "@/contexts/ParadasContext"
import { ParadasContent } from "@/components/paradas/paradas-content"
import { HistoricoParadasContent } from "@/components/paradas/historico-content"
import { CadastrosContent } from "@/components/paradas/cadastros-content"

export default function ParadasPage() {
  return (
    <ParadasProvider>
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="paradas" className="flex-1 flex flex-col">
            <div className="border-b bg-white px-4">
              <TabsList className="h-14">
                <TabsTrigger value="paradas">Paradas</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
                <TabsTrigger value="cadastros">Cadastros</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="paradas" className="flex-1 m-0">
              <ParadasContent />
            </TabsContent>

            <TabsContent value="historico" className="flex-1 m-0">
              <HistoricoParadasContent />
            </TabsContent>

            <TabsContent value="cadastros" className="flex-1 m-0">
              <CadastrosContent />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ParadasProvider>
  )
} 