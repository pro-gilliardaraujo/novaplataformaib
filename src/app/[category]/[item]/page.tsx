'use client'

import { pagesConfig } from '@/config/pages.config'
import { PagesConfig } from '@/types/pages'
import { CustomTabs } from '@/components/ui/custom-tabs'

interface PageProps {
  params: {
    category: string
    item: string
  }
}

export default function DynamicPage({ params }: PageProps) {
  // Convert URL parameters to match config format
  const category = params.category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  
  const item = params.item
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  console.log('URL Parameters:', { category, item })
  console.log('Available Categories:', Object.keys(pagesConfig))

  // Find the matching category and item
  const foundCategory = Object.keys(pagesConfig).find(
    cat => cat.toLowerCase().replace(/\s+/g, '-') === params.category.toLowerCase()
  )
  const foundItem = foundCategory ? Object.keys(pagesConfig[foundCategory]).find(
    it => it.toLowerCase().replace(/\s+/g, '-') === params.item.toLowerCase()
  ) : null

  console.log('Found Category:', foundCategory)
  console.log('Found Item:', foundItem)

  // Get the page data if both category and item are found
  const pageData = foundCategory && foundItem ? pagesConfig[foundCategory][foundItem] : null

  console.log('Page Data:', pageData)

  if (!pageData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Página não encontrada</h2>
          <p className="mt-2 text-gray-600">O item que você está procurando não existe.</p>
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