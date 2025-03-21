"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HistoricoMovimentacoes as MovimentacoesTable } from "@/components/estoque/HistoricoMovimentacoes"
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
      <Tabs defaultValue="list" className="flex-1">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-2">
          <TabsTrigger value="list" className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground">
            Lista Detalhada
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 p-2">
          <TabsContent value="list" className="h-full m-0">
            <MovimentacoesTable 
              itemId=""
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
} 