"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import {
  Cog6ToothIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentListIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon
} from "@heroicons/react/24/outline"
import { Badge } from "@/components/ui/badge"
import Image from 'next/image'
import { Category, Page, Tab } from "@/types/pages"
import { Button } from "@/components/ui/button"
import * as HeroIconsOutline from "@heroicons/react/24/outline"
import * as HeroIconsSolid from "@heroicons/react/24/solid"
import * as HeroIconsMini from "@heroicons/react/20/solid"
import * as Pi from "phosphor-react"
import * as Fa from "react-icons/fa"
import * as Md from "react-icons/md"
import * as Io from "react-icons/io"
import * as Ri from "react-icons/ri"
import * as Bi from "react-icons/bi"
import { IconContext as PhosphorIconContext } from "phosphor-react"
import { Plus } from "lucide-react"

// Ícones personalizados como alias
const TruckIcon = DocumentDuplicateIcon
const CavIcon = DocumentDuplicateIcon
const PlantioIcon = DocumentDuplicateIcon
const OleosIcon = DocumentDuplicateIcon
const BonificacoesIcon = DocumentDuplicateIcon

export default function Sidebar({ isCollapsed }: { isCollapsed?: boolean }) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  console.log('Sidebar - Auth State:', { user, loading })
  console.log('Sidebar - isCollapsed:', isCollapsed)

  const { data: menuData = { reports: [], management: [] }, isLoading: isMenuLoading, error, refetch } = useQuery({
    queryKey: ['menu-data'],
    queryFn: async () => {
      console.log('Fetching menu data')
      try {
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select(`
            id,
            name,
            slug,
            section,
            icon,
            order_index,
            pages (
              id,
              name,
              slug,
              icon,
              category_id
            )
          `)
          .order('order_index')

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError)
          throw categoriesError
        }

        if (!categories) {
          console.log('No categories found')
          return { reports: [], management: [] }
        }

        console.log('Categories fetched successfully:', categories.length)
        
        // Transform categories to handle special cases
        const transformedCategories = categories.map(category => {
          // Sort pages by name
          const sortedPages = [...(category.pages || [])].sort((a, b) => 
            a.name.localeCompare(b.name)
          )

          return {
            ...category,
            pages: sortedPages
          }
        })

        const reports = transformedCategories.filter(cat => cat.section === 'reports')
        const management = transformedCategories.filter(cat => cat.section === 'management')

        console.log('Menu data processed:', { reports: reports.length, management: management.length })
        return { reports, management }
      } catch (error) {
        console.error('Error in menu data query:', error)
        throw error
      }
    },
    // Habilitado sempre, não depende mais do usuário
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  // Adiciona um efeito para recarregar os dados quando o componente for montado
  useEffect(() => {
    refetch()
  }, [refetch])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(prev =>
      prev === categoryId ? null : categoryId
    )
  }

  const getIconForCategory = (category: Category) => {
    // Se tiver um ícone personalizado, usa ele
    if (category.icon) {
      const [library, style, name] = category.icon.split('/')
      let iconSet: Record<string, any>

      // Função auxiliar para renderizar ícone do Phosphor
      const renderPhosphorIcon = (Icon: any) => {
        return (
          <PhosphorIconContext.Provider
            value={{
              size: 20,
              weight: style as any,
              mirrored: false,
            }}
          >
            <Icon />
          </PhosphorIconContext.Provider>
        )
      }

      switch (library) {
        case 'heroicons':
          switch (style) {
            case 'solid':
              iconSet = HeroIconsSolid
              break
            case 'mini':
              iconSet = HeroIconsMini
              break
            default:
              iconSet = HeroIconsOutline
          }
          break
        case 'remixicon':
          iconSet = Ri
          break
        case 'boxicons':
          iconSet = Bi
          break
        case 'phosphor':
          const PhosphorIcon = Pi[name as keyof typeof Pi]
          if (PhosphorIcon) {
            return renderPhosphorIcon(PhosphorIcon)
          }
          return <DocumentDuplicateIcon className="h-5 w-5 text-gray-500" />
        case 'fontawesome':
          iconSet = Fa
          break
        case 'material':
          iconSet = Md
          break
        case 'ionicons':
          iconSet = Io
          break
        default:
          iconSet = HeroIconsOutline
      }

      const IconComponent = iconSet[name]
      if (IconComponent) {
        return <IconComponent className="h-5 w-5 text-gray-500" />
      }
    }

    // Se não tiver ícone personalizado, usa os ícones padrão baseados no slug
    switch (category.slug) {
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

  const getIconForPage = (page: Page) => {
    // Se tiver um ícone personalizado, usa ele
    if (page.icon) {
      const [library, style, name] = page.icon.split('/')
      let iconSet: Record<string, any>

      // Função auxiliar para renderizar ícone do Phosphor
      const renderPhosphorIcon = (Icon: any) => {
        return (
          <PhosphorIconContext.Provider
            value={{
              size: 16,
              weight: style as any,
              mirrored: false,
            }}
          >
            <Icon />
          </PhosphorIconContext.Provider>
        )
      }

      switch (library) {
        case 'heroicons':
          switch (style) {
            case 'solid':
              iconSet = HeroIconsSolid
              break
            case 'mini':
              iconSet = HeroIconsMini
              break
            default:
              iconSet = HeroIconsOutline
          }
          break
        case 'remixicon':
          iconSet = Ri
          break
        case 'boxicons':
          iconSet = Bi
          break
        case 'phosphor':
          const PhosphorIcon = Pi[name as keyof typeof Pi]
          if (PhosphorIcon) {
            return renderPhosphorIcon(PhosphorIcon)
          }
          return <DocumentDuplicateIcon className="h-4 w-4 text-gray-500" />
        case 'fontawesome':
          iconSet = Fa
          break
        case 'material':
          iconSet = Md
          break
        case 'ionicons':
          iconSet = Io
          break
        default:
          iconSet = HeroIconsOutline
      }

      const IconComponent = iconSet[name]
      if (IconComponent) {
        return <IconComponent className="h-4 w-4 text-gray-500" />
      }
    }

    // Ícone padrão
    return <DocumentDuplicateIcon className="h-4 w-4 text-gray-500" />
  }

  const handleSignOut = async () => {
    await signOut()
  }

  // Comentando a linha que usa o getLabelClass, pois não queremos o comportamento de hover
  const getLabelClass = () => {
    // Removendo o comportamento de esconder o texto quando colapsado
    // return isCollapsed ? 'opacity-0 group-hover:opacity-100 transition-opacity duration-300' : '';
    return isCollapsed ? 'hidden' : '';
  }

  return (
    <div className={`h-full bg-white shadow-sm flex flex-col ${isCollapsed ? 'overflow-hidden' : 'overflow-y-auto'} scrollbar-thin scrollbar-thumb-black scrollbar-track-transparent`}>
      {/* Logo IB */}
      <div className="p-3 flex justify-center items-center border-b">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
          <Image
            src="https://kjlwqezxzqjfhacmjhbh.supabase.co/storage/v1/object/public/sourcefiles//logo.png"
            alt="IB Logística"
            width={32}
            height={32}
            className="rounded"
          />
          <span className={`ml-2 font-semibold text-lg ${getLabelClass()}`}>
            IB Logística
          </span>
        </div>
      </div>

      {/* Menu */}
      {!isMenuLoading && (
        <div className="flex-1 py-3 flex flex-col gap-3 relative">
          <div className={`px-3 ${isCollapsed ? 'text-center' : ''}`}>
            <h3 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider ${getLabelClass()}`}>
              Relatórios
            </h3>
          </div>

          <div className="px-1">
            {menuData.reports.map((category) => (
              <div key={category.id} className="mb-2">
                <button 
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-md ${
                    expandedCategory === category.id ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center">
                    {expandedCategory === category.id ? 
                      <FolderOpenIcon className="h-5 w-5 text-gray-500" /> : 
                      <FolderIcon className="h-5 w-5 text-gray-500" />
                    }
                    <span className={`ml-2 ${getLabelClass()}`}>
                      {category.name}
                    </span>
                  </div>
                  <div className={`${getLabelClass()}`}>
                    {expandedCategory === category.id ? 
                      <ChevronDownIcon className="h-4 w-4 text-gray-500" /> : 
                      <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                    }
                  </div>
                </button>

                {expandedCategory === category.id && (
                  <div className={`pl-${isCollapsed ? '0' : '4'} mt-1 space-y-1`}>
                    {category.pages?.length === 0 ? (
                      <div className="px-4 py-2 text-sm italic text-gray-500">
                        Nenhum relatório disponível
                      </div>
                    ) : (
                      category.pages?.map((page) => (
                        <Link 
                          key={page.id} 
                          href={`/${category.slug}/${page.slug}`}
                          className={`flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-md ${
                            pathname === `/${category.slug}/${page.slug}` ? 'bg-gray-100' : ''
                          }`}
                        >
                          {getIconForPage(page)}
                          <span className={`ml-2 ${getLabelClass()}`}>
                            {page.name}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={`px-3 pt-5 ${isCollapsed ? 'text-center' : ''}`}>
            <h3 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider ${getLabelClass()}`}>
              Gerenciamento
            </h3>
          </div>

          <div className="px-1">
            {menuData.management.map((category) => (
              <div key={category.id} className="mb-2">
                <button 
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-md ${
                    expandedCategory === category.id ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center">
                    {expandedCategory === category.id ? 
                      <FolderOpenIcon className="h-5 w-5 text-gray-500" /> : 
                      <FolderIcon className="h-5 w-5 text-gray-500" />
                    }
                    <span className={`ml-2 ${getLabelClass()}`}>
                      {category.name}
                    </span>
                  </div>
                  <div className={`${getLabelClass()}`}>
                    {expandedCategory === category.id ? 
                      <ChevronDownIcon className="h-4 w-4 text-gray-500" /> : 
                      <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                    }
                  </div>
                </button>

                {expandedCategory === category.id && (
                  <div className={`pl-${isCollapsed ? '0' : '4'} mt-1 space-y-1`}>
                    {category.pages?.length === 0 ? (
                      <div className="px-4 py-2 text-sm italic text-gray-500">
                        Nenhuma página disponível
                      </div>
                    ) : (
                      category.pages?.map((page) => (
                        <Link 
                          key={page.id} 
                          href={`/${category.slug}/${page.slug}`}
                          className={`flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-md ${
                            pathname === `/${category.slug}/${page.slug}` ? 'bg-gray-100' : ''
                          }`}
                        >
                          {getIconForPage(page)}
                          <span className={`ml-2 ${getLabelClass()}`}>
                            {page.name}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rodapé com usuário */}
      {/* {user && (
        <div className="mt-auto border-t pt-2 pb-3">
          <div className="relative">
            <div className="flex items-center mx-3 justify-between">
              <div className="flex items-center flex-shrink-0">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium uppercase">
                  {user?.profile?.nome?.charAt(0) || "U"}
                </div>
                <div className={`ml-3 ${getLabelClass()}`}>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                    {user.profile?.nome}
                  </p>
                  <p className="text-xs font-medium text-gray-500 truncate max-w-[120px]">
                    {user.profile?.cargo || 'Usuário'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`ml-2 ${isCollapsed ? 'hidden group-hover:flex' : 'flex'} items-center justify-center p-1 rounded-full hover:bg-gray-100`}
              >
                <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {isSettingsOpen && (
              <div className="absolute bottom-full mb-2 w-44 bg-white rounded-md shadow-lg py-1 right-0 z-10">
                <div className="py-1 flex flex-col">
                  <Link
                    href="/alterar-senha"
                    className={`flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-md ${
                      pathname === '/alterar-senha' ? 'bg-gray-100' : ''
                    }`}
                  >
                    <KeyIcon className="h-5 w-5 text-gray-500" />
                    <span className="ml-2">Alterar Senha</span>
                  </Link>
                  <Link
                    href="/gerenciamento/usuarios"
                    className={`flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-md ${
                      pathname === '/gerenciamento/usuarios' ? 'bg-gray-100' : ''
                    }`}
                  >
                    <KeyIcon className="h-5 w-5 text-gray-500" />
                    <span className="ml-2">Usuários</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-md"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-500" />
                    <span className="ml-2">Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )} */}
    </div>
  )
} 