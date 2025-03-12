"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export default function DynamicReportPage() {
  const params = useParams()
  const { category } = params

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['report-page-data', category],
    queryFn: async () => {
      try {
        const { data: categoryInfo, error } = await supabase
          .from('categories')
          .select(`
            *,
            pages (
              id,
              name,
              slug,
              icon
            )
          `)
          .eq('slug', category)
          .single()

        if (error) throw error
        return categoryInfo
      } catch (error) {
        console.error('Erro ao buscar dados da categoria:', error)
        return null
      }
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!pageData) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-2">Categoria não encontrada</h1>
        <p className="text-gray-600">A categoria que você está procurando não existe.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{pageData.name}</h1>
        <p className="text-gray-600">Relatórios disponíveis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pageData.pages?.map((page) => (
          <div key={page.id} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">{page.name}</h2>
            <p className="text-gray-600">
              Clique para visualizar o relatório.
            </p>
          </div>
        ))}
      </div>
    </div>
  )
} 