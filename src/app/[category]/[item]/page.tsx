"use client"

import { useState, useEffect } from "react"
import { CustomTabs } from "@/components/ui/custom-tabs"
import { pageService } from "@/services/pageService"

interface PageProps {
  params: {
    category: string
    item: string
  }
}

export default function DynamicPage({ params }: PageProps) {
  const [pageData, setPageData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setIsLoading(true)
        console.log("Buscando página:", params.category, params.item)
        const data = await pageService.getPageBySlug(params.category, params.item)
        console.log("Dados recebidos:", data)
        
        if (!data || !data.tabs || data.tabs.length === 0) {
          console.error("Dados inválidos ou sem abas:", data)
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
  }, [params.category, params.item])

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