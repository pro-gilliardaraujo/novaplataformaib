"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MovimentacoesTable } from "@/components/estoque/movimentacoes-table"
import { MovimentacoesDashboard } from "@/components/estoque/movimentacoes/dashboard"
import { Movimentacao } from "@/types/movimentacoes"
import { supabase } from "@/lib/supabase"

export default function MovimentacoesPage() {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchMovimentacoes = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('historico_estoque')
        .select(`
          *,
          item:item_id (
            id,
            descricao,
            codigo_fabricante,
            quantidade_atual,
            categoria:categorias_item (
              id,
              nome
            )
          ),
          responsavel:responsavel_id (
            nome:raw_user_meta_data->nome
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedData = data.map(item => ({
        ...item,
        item: item.item,
        responsavel: item.responsavel?.[0]?.nome || null
      }))

      setMovimentacoes(formattedData)
    } catch (error) {
      console.error('Error fetching movimentacoes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMovimentacoes()
  }, [])

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
            <MovimentacoesDashboard movimentacoes={movimentacoes} />
          </TabsContent>
          <TabsContent value="list" className="h-full m-0">
            <MovimentacoesTable 
              movimentacoes={movimentacoes}
              onMovimentacaoCreated={fetchMovimentacoes}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
} 