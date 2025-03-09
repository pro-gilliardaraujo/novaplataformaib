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

// Ícones personalizados como componentes
const ComputerIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
  </svg>
)

const BonificacoesIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
)

const DocumentIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
)

const PaginasIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
  </svg>
)

const PermissoesIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
  </svg>
)

const CavIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14" className={className}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6.5c0 -1.06087 0.42143 -2.07828 1.17157 -2.82843C4.92172 2.92143 5.93913 2.5 7 2.5s2.07828 0.42143 2.82843 1.17157C10.5786 4.42172 11 5.43913 11 6.5H3Z" />
      <path d="M5 9.5v1M3.5 12.5v1M7 12.5v1M10.5 12.5v1M9 9.5v1M7 2.5v-2" />
    </g>
  </svg>
)

const PlantioIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14" className={className}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5109 5.39149c2 2.81645 0.47 6.04241 -0.27 7.30081 -0.1085 0.176 -0.2543 0.3262 -0.427 0.4401 -0.1728 0.1138 -0.3683 0.1886 -0.573 0.219 -1.45003 0.2497 -5.06003 0.5294 -7.00003 -2.2871 -1.91 -2.65661 -1.83 -7.33071 -1.66 -9.5579 0.0067 -0.16593 0.05276 -0.3279 0.1344 -0.47258 0.08164 -0.144674 0.19651 -0.267918 0.33516 -0.359585 0.13865 -0.091668 0.29711 -0.149137 0.46235 -0.167678 0.16524 -0.018541 0.33253 0.002376 0.48809 0.06103 2.15 0.619223 6.63 2.167263 8.51003 4.823903Z" />
      <path d="M4.77087 4.46265C7.0614 7.15851 9.07173 10.0798 10.7709 13.1816" />
    </g>
  </svg>
)

const OleosIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14" className={className}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.83494 11.4731V4c-0.99499 0.90245 -2.98496 2.61467 -2.98496 5.08099 0 1.82471 1.98997 2.41681 2.98496 2.39211Z" />
      <path d="M12 8.99614C12 5.49773 7 0.5 7 0.5S2 5.49773 2 8.99614c0.06978 1.25796 0.63485 2.43716 1.57172 3.27996C4.5086 13.1189 6 13.4941 7 13.4941s2.4914 -0.3752 3.4283 -1.218c0.9369 -0.8428 1.5019 -2.022 1.5717 -3.27996Z" />
    </g>
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

              {/* Permissões */}
              <Link
                href="/gerenciamento/permissoes"
                className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                <PermissoesIcon className="h-5 w-5 text-gray-500" />
                <span className="ml-2">Permissões</span>
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