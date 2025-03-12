"use client"

import { useState, useEffect } from "react"
import { CustomTabs } from "@/components/ui/custom-tabs"
import { pageService } from "@/services/pageService"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function DynamicManagementPage() {
  const params = useParams()
  const [pageData, setPageData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setIsLoading(true)
        
        // Primeiro, busca a categoria para obter a única página
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .select(`
            *,
            pages (
              id,
              name,
              slug
            )
          `)
          .eq('slug', params.category)
          .single()

        if (categoryError) throw categoryError

        if (!category || !category.pages || category.pages.length === 0) {
          setError("Categoria não encontrada ou sem páginas.")
          return
        }

        // Se a categoria tem apenas uma página, busca os dados dela
        const page = category.pages[0]
        const data = await pageService.getPageBySlug(params.category as string, page.slug)
        
        if (!data || !data.tabs || data.tabs.length === 0) {
          setError("Página não encontrada ou sem conteúdo.")
          return
        }

        setPageData(data)
      } catch (error) {
        console.error("Erro ao carregar página:", error)
        setError("Erro ao carregar página. Por favor, tente novamente.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPageData()
  }, [params.category])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Carregando...</h2>
        </div>
      </div>
    )
  }

  if (error || !pageData || !pageData.tabs || pageData.tabs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Página não encontrada</h2>
          <p className="mt-2 text-gray-600">{error || "O item que você está procurando não existe."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-2 h-full">
      <div className="h-full bg-white rounded-lg shadow-sm border border-gray-100">
        <CustomTabs tabs={pageData.tabs} />
      </div>
    </div>
  )
} 