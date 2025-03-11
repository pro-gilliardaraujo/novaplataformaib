"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
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

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Queries com configurações otimizadas
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, order_index, section, icon')
        .order('order_index')
      if (error) throw error
      return data as Category[]
    },
    staleTime: 30000 // Cache por 30 segundos
  })

  const { data: pages = [], isLoading: isPagesLoading } = useQuery({
    queryKey: ['pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select(`
          *,
          categories!inner (
            id,
            name,
            slug,
            section,
            order_index,
            icon
          ),
          tabs (
            id,
            name,
            content,
            order_index,
            created_at,
            updated_at,
            page_id
          )
        `)
        .order('order_index', { ascending: true })
      if (error) throw error
      
      // Mapeia os dados garantindo que todos os campos necessários estejam presentes
      const mappedData = data.map(item => {
        const mappedTabs = (item.tabs || []).map((tab: any) => ({
          id: tab.id,
          name: tab.name,
          content: tab.content || '',
          order_index: tab.order_index,
          created_at: tab.created_at,
          updated_at: tab.updated_at,
          page_id: tab.page_id || item.id
        })) as Tab[]

        return {
          id: item.id,
          created_at: item.created_at,
          updated_at: item.updated_at,
          name: item.name,
          slug: item.slug,
          category_id: item.category_id,
          category_name: item.categories?.name,
          categories: item.categories,
          icon: item.icon,
          order_index: item.order_index,
          tabs: mappedTabs
        } as Page
      })

      console.log('Dados mapeados:', mappedData) // Para debug
      return mappedData
    },
    staleTime: 30000 // Cache por 30 segundos
  })

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(prev => prev === categoryId ? null : categoryId)
  }

  const getCategoryPages = (categoryId: string) => {
    return pages.filter((page: Page) => page.category_id === categoryId)
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

    // Se não tiver ícone personalizado, usa o ícone padrão
    return <DocumentDuplicateIcon className="h-4 w-4 text-gray-500" />
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const isLoading = isCategoriesLoading || isPagesLoading

  const renderSection = (section: 'reports' | 'management') => {
    const sectionCategories = categories.filter((cat: Category) => cat.section === section)

    return (
      <div className="h-[45%] overflow-y-auto border-t">
        <div className="px-3 py-4">
          <h2 className="text-sm font-semibold text-black uppercase tracking-wider mb-3 px-2">
            {section === 'reports' ? 'Relatórios' : 'Gerenciamento'}
          </h2>
          <nav className="space-y-1">
            {sectionCategories.map((category: Category) => {
              const pages = getCategoryPages(category.id)
              
              // Se for seção de relatórios OU se tiver mais de uma página, mostra como dropdown
              if (section === 'reports' || pages.length > 1) {
                return (
                  <div key={category.id}>
                    <button
                      onClick={() => section === 'reports' ? toggleCategory(category.id) : undefined}
                      className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        {getIconForCategory(category)}
                        <span>{category.name}</span>
                      </div>
                      {(section === 'reports' || pages.length > 1) && (
                        <ChevronDownIcon 
                          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                            (section === 'reports' ? expandedCategory === category.id : true) ? 'transform rotate-180' : ''
                          }`} 
                        />
                      )}
                    </button>
                    {(section === 'reports' ? expandedCategory === category.id : true) && (
                      <div className="ml-7 space-y-1">
                        {pages.map((page: Page) => (
                          <Link
                            key={page.id}
                            href={`/${section === 'reports' ? 'relatorios' : 'gerenciamento'}/${category.slug}/${page.slug}`}
                            className="flex items-center px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100"
                          >
                            {getIconForPage(page)}
                            <span className="ml-2">{page.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              } else {
                // Se for página única no gerenciamento, mostra como link direto
                return (
                  <Link
                    key={category.id}
                    href={`/gerenciamento/${category.slug}`}
                    className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      {getIconForCategory(category)}
                      <span>{category.name}</span>
                    </div>
                  </Link>
                )
              }
            })}
          </nav>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-white border-r w-64">
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
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </div>
    )
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
        {renderSection('reports')}
        {renderSection('management')}

        {/* Configurações - 10% */}
        <div className="h-[10%] border-t mt-auto relative">
          <div className="px-3 py-4">
            <div className="space-y-1">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
                  <span>Configurações</span>
                </div>
                <ChevronDownIcon 
                  className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                    isSettingsOpen ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              {isSettingsOpen && (
                <div className="absolute bottom-full left-2 right-2 bg-white border rounded-t-lg shadow-lg">
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium">{user?.profile?.nome}</span>
                      <Badge variant={user?.profile?.adminProfile ? "default" : "secondary"} className="w-fit">
                        {user?.profile?.adminProfile ? "Administrador" : "Usuário"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mx-2 my-1">
                    <Link
                      href="/alterar-senha"
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-md"
                    >
                      <KeyIcon className="h-5 w-5 text-gray-500" />
                      <span className="ml-2">Trocar Senha</span>
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
        </div>
      </div>
    </div>
  )
} 