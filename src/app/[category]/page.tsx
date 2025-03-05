import Link from 'next/link'
import { pagesConfig } from '@/config/pages.config'
import { getCategoryItems } from '@/utils/pageUtils'

export default function CategoryPage({
  params,
}: {
  params: { category: string }
}) {
  const items = getCategoryItems(pagesConfig, params.category)

  if (items.length === 0) {
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
      <h1 className="text-2xl font-bold mb-6 capitalize">{params.category}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Link
            key={item}
            href={`/${params.category}/${item}`}
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <h2 className="text-xl font-semibold capitalize">{item}</h2>
            <p className="mt-2 text-gray-600">
              Clique para ver os detalhes
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
} 