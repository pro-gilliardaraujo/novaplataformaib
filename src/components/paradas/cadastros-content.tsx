"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TiposParadaContent } from "./cadastros/tipos-parada-content"
import { FrotasContent } from "./cadastros/frotas-content"
import { UnidadesContent } from "./cadastros/unidades-content"

export function CadastrosContent() {
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="tipos" className="flex-1 flex flex-col">
        <div className="border-b bg-white px-4">
          <TabsList className="h-14">
            <TabsTrigger value="tipos">Tipos de Parada</TabsTrigger>
            <TabsTrigger value="frotas">Frotas</TabsTrigger>
            <TabsTrigger value="unidades">Unidades</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tipos" className="flex-1 m-0">
          <TiposParadaContent />
        </TabsContent>

        <TabsContent value="frotas" className="flex-1 m-0">
          <FrotasContent />
        </TabsContent>

        <TabsContent value="unidades" className="flex-1 m-0">
          <UnidadesContent />
        </TabsContent>
      </Tabs>
    </div>
  )
} 