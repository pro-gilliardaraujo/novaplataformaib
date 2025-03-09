'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { pageService } from '@/services/pageService'
import { Page, Category } from '@/types/pages'

export default function CategoryPage({
  params,
}: {
  params: { category: string }
}) {
  const [pages, setPages] = useState<Page[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        // Primeiro busca todas as categorias para encontrar o ID da categoria atual
        const categories = await pageService.getCategories()
        const currentCategory = categories.find(cat => cat.slug === params.category)
        
        if (currentCategory) {
          setCategory(currentCategory)
          const categoryPages = await pageService.getPages(currentCategory.id)
          setPages(categoryPages)
        } else {
          setPages([])
        }
      } catch (error) {
        console.error("Erro ao carregar páginas:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.category])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!category || pages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Categoria não encontrada</h2>
          <p className="mt-2 text-gray-600">A categoria que você está procurando não existe.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6 capitalize">{category.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => (
          <Link
            key={page.id}
            href={`/${params.category}/${page.slug}`}
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <h2 className="text-xl font-semibold capitalize">{page.name}</h2>
            <p className="mt-2 text-gray-600">
              Clique para ver os detalhes
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
} 