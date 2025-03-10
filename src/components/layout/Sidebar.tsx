'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  WrenchScrewdriverIcon, 
  TruckIcon, 
  ClipboardDocumentListIcon, 
  ChevronDownIcon,
  CircleStackIcon,
  UsersIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  KeyIcon
} from '@heroicons/react/24/outline'
import { pageService } from '@/services/pageService'
import { Category, Page } from '@/types/pages'
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'

// Ícones personalizados como componentes
const ComputerIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4H4C2.89543 4 2 4.89543 2 6V15C2 16.1046 2.89543 17 4 17H20C21.1046 17 22 16.1046 22 15V6C22 4.89543 21.1046 4 20 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const BonificacoesIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const DocumentIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PaginasIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 17H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CavIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PlantioIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 16L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 12L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const OleosIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function Sidebar() {
  const { signOut } = useAuth()
  const router = useRouter()
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [categoriesData, pagesData] = await Promise.all([
          pageService.getCategories(),
          pageService.getAllPages()
        ])
        setCategories(categoriesData)
        setPages(pagesData)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const toggleCategory = (category: string) => {
    setOpenCategory(openCategory === category ? null : category)
  }

  const getCategoryPages = (categoryId: string) => {
    return pages.filter(page => page.category_id === categoryId)
  }

  const getIconForCategory = (slug: string) => {
    switch (slug) {
      case 'colheita':
        return <TruckIcon className="h-5 w-5 text-gray-500" />
      case 'cav':
        return <CavIcon className="h-5 w-5 text-gray-500" />
      case 'plantio':
        return <PlantioIcon className="h-5 w-5 text-gray-500" />
      case 'operacional':
        return <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500" />
      case 'oleos':
        return <OleosIcon className="h-5 w-5 text-gray-500" />
      case 'bonificacoes':
        return <BonificacoesIcon className="h-5 w-5 text-gray-500" />
      default:
        return <DocumentDuplicateIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  return (
    <div className="flex flex-col h-screen bg-white border-r w-64">
      {/* Logo - 10% */}
      <div className="flex items-center px-3 py-4 border-b h-[10%]">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Image
            src="https://kjlwqezxzqjfhacmjhbh.supabase.co/storage/v1/object/public/sourcefiles//logo.png"
            alt="IB Logística"
            width={36}
            height={36}
            className="rounded"
          />
          <span className="ml-3 text-base font-medium text-gray-900">
            IB Logística
          </span>
        </Link>
      </div>

      <div className="flex flex-col h-[90%]">
        {/* Relatórios - 45% */}
        <div className="h-[45%] overflow-y-auto">
          <div className="px-3 py-4">
            <h2 className="text-sm font-semibold text-black uppercase tracking-wider mb-3 px-2">
              Relatórios
            </h2>
            <nav className="space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <span className="text-sm text-gray-500">Carregando...</span>
                </div>
              ) : (
                categories.map((category) => (
                  <div key={category.id}>
                    <button
                      onClick={() => toggleCategory(category.slug)}
                      className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        {getIconForCategory(category.slug)}
                        <span className="ml-2">{category.name}</span>
                      </div>
                      <ChevronDownIcon 
                        className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                          openCategory === category.slug ? 'transform rotate-180' : ''
                        }`} 
                      />
                    </button>
                    {openCategory === category.slug && (
                      <div className="ml-7 space-y-1">
                        {getCategoryPages(category.id).map((page) => (
                          <Link
                            key={page.id}
                            href={`/${category.slug}/${page.slug}`}
                            className="flex items-center px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100"
                          >
                            <DocumentIcon className="h-4 w-4 text-gray-500" />
                            <span className="ml-2">{page.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </nav>
          </div>
        </div>

        {/* Gerenciamento - 45% */}
        <div className="h-[45%] overflow-y-auto border-t">
          <div className="px-3 py-4">
            <h2 className="text-sm font-semibold text-black uppercase tracking-wider mb-3 px-2">
              Gerenciamento
            </h2>
            <nav className="space-y-1">
              {/* Usuários */}
              <Link
                href="/gerenciamento/usuarios"
                className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                <UsersIcon className="h-5 w-5 text-gray-500" />
                <span className="ml-2">Usuários</span>
              </Link>

              {/* Páginas */}
              <Link
                href="/gerenciamento/paginas"
                className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                <PaginasIcon className="h-5 w-5 text-gray-500" />
                <span className="ml-2">Páginas</span>
              </Link>

              {/* Tratativas */}
              <div>
                <button
                  onClick={() => toggleCategory('tratativas')}
                  className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500" />
                    <span className="ml-2">Tratativas</span>
                  </div>
                  <ChevronDownIcon 
                    className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                      openCategory === 'tratativas' ? 'transform rotate-180' : ''
                    }`} 
                  />
                </button>
                {openCategory === 'tratativas' && (
                  <div className="ml-7 space-y-1">
                    <Link
                      href="/gerenciamento/tratativas/dashboard"
                      className="flex items-center px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100"
                    >
                      <ChartBarIcon className="h-4 w-4 text-gray-500" />
                      <span className="ml-2">Dashboard</span>
                    </Link>
                    <Link
                      href="/gerenciamento/tratativas/lista"
                      className="flex items-center px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100"
                    >
                      <DocumentIcon className="h-4 w-4 text-gray-500" />
                      <span className="ml-2">Lista</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Retiradas */}
              <Link
                href="/gerenciamento/retiradas"
                className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                <CircleStackIcon className="h-5 w-5 text-gray-500" />
                <span className="ml-2">Retiradas</span>
              </Link>

              {/* Equipamentos */}
              <Link
                href="/gerenciamento/equipamentos"
                className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                <WrenchScrewdriverIcon className="h-5 w-5 text-gray-500" />
                <span className="ml-2">Equipamentos</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Configurações - 10% */}
        <div className="h-[10%] border-t mt-auto relative">
          <div className="px-3 py-4">
            <div className="space-y-1">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
                  <span className="ml-2">Configurações</span>
                </div>
                <ChevronDownIcon 
                  className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                    isSettingsOpen ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              {isSettingsOpen && (
                <div className="absolute bottom-full left-0 w-full bg-white border-t border-l border-r rounded-t-lg shadow-lg">
                  <Link
                    href="/alterar-senha"
                    className="flex items-center px-5 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
                  >
                    <KeyIcon className="h-5 w-5 text-gray-500" />
                    <span className="ml-2">Trocar Senha</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-5 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-500" />
                    <span className="ml-2">Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 