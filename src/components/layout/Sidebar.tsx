"use client"

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface MenuItem {
  id: string
  name: string
  url: string
}

interface Category {
  id: string
  name: string
  menu_items: MenuItem[]
}

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [showSettings, setShowSettings] = useState(false)

  console.log('[Sidebar] Estado inicial:', {
    hasUser: !!user,
    expandedCategories,
    showSettings
  })

  const { data: categories, isLoading } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      console.log('[Sidebar] Buscando categorias...')
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*, menu_items(*)')
        .order('order', { ascending: true })
        .order('order', { ascending: true, foreignTable: 'menu_items' })

      if (error) {
        console.error('[Sidebar] Erro ao buscar categorias:', error)
        throw error
      }

      console.log('[Sidebar] Categorias encontradas:', data.length)
      return data as Category[]
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  })

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(current =>
      current.includes(categoryId)
        ? current.filter(id => id !== categoryId)
        : [...current, categoryId]
    )
  }

  const toggleSettings = () => {
    setShowSettings(!showSettings)
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-80 flex-col border-r bg-white">
        <div className="flex h-14 items-center border-b px-4">
          <span className="font-semibold">Menu</span>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-80 flex-col border-r bg-white">
      <div className="flex h-14 items-center border-b px-4">
        <span className="font-semibold">Menu</span>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-sm font-medium">
          {categories?.map((category) => (
            <div key={category.id} className="pb-4">
              <button
                onClick={() => toggleCategory(category.id)}
                className="flex w-full items-center justify-between rounded-md p-2 hover:bg-gray-100"
              >
                <span>{category.name}</span>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform ${
                    expandedCategories.includes(category.id) ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedCategories.includes(category.id) && (
                <div className="mt-1 pl-4">
                  {category.menu_items?.map((item) => (
                    <Link
                      key={item.id}
                      href={item.url}
                      className="block rounded-md p-2 hover:bg-gray-100"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="relative">
            <button
              onClick={toggleSettings}
              className="flex w-full items-center justify-between rounded-md p-2 hover:bg-gray-100"
            >
              <span>Configurações</span>
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${
                  showSettings ? 'rotate-180' : ''
                }`}
              />
            </button>
            {showSettings && (
              <div className="mt-1 pl-4">
                <Link
                  href="/admin/pages"
                  className="block rounded-md p-2 hover:bg-gray-100"
                >
                  Páginas
                </Link>
                <Link
                  href="/admin/users"
                  className="block rounded-md p-2 hover:bg-gray-100"
                >
                  Usuários
                </Link>
                <button
                  onClick={() => signOut()}
                  className="w-full text-left rounded-md p-2 hover:bg-gray-100"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  )
} 