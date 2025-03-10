"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { pageService } from "@/services/pageService"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import {
  Cog6ToothIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  DocumentIcon,
  CircleStackIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline"
import { Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Image from 'next/image'
import { Category, Page } from "@/types/pages"
import { Button } from "@/components/ui/button"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

// Ícones personalizados como alias
const TruckIcon = DocumentDuplicateIcon
const CavIcon = DocumentDuplicateIcon
const PlantioIcon = DocumentDuplicateIcon
const OleosIcon = DocumentDuplicateIcon
const BonificacoesIcon = DocumentDuplicateIcon
const PaginasIcon = DocumentDuplicateIcon

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [localCategories, setLocalCategories] = useState<Category[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  // Use React Query to fetch categories and pages
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order_index')
      if (error) throw error
      return data as Category[]
    }
  })

  const { data: pages = [], isLoading: isPagesLoading } = useQuery({
    queryKey: ['pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
      if (error) throw error
      return data as Page[]
    }
  })

  useEffect(() => {
    setLocalCategories(categories)
  }, [categories])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
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

  const isLoading = isCategoriesLoading || isPagesLoading

  const handleUpdateOrder = async () => {
    try {
      const categoriesToSend = localCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        order_index: cat.order_index,
        section: cat.section
      }))

      const response = await fetch("/api/categories/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: categoriesToSend })
      })

      console.log('Status da resposta:', response.status)
      const data = await response.json()
      console.log('Dados da resposta:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar ordem')
      }

      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      setHasChanges(false)

      toast({
        title: "Sucesso",
        description: "Ordem atualizada com sucesso",
      })
    } catch (error) {
      console.error('=== ERRO NA ATUALIZAÇÃO DE ORDEM ===')
      console.error('Detalhes do erro:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar a ordem",
        variant: "destructive",
      })
    }
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return
    if (result.source.index === result.destination.index) return

    const section = result.source.droppableId as "reports" | "management"
    const sectionCategories = localCategories.filter(cat => cat.section === section)
    const otherCategories = localCategories.filter(cat => cat.section !== section)
    
    const items = Array.from(sectionCategories)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Atualiza order_index para os itens reordenados
    const updatedSectionCategories = items.map((cat, index) => ({
      ...cat,
      order_index: index + 1
    }))

    // Combina as categorias atualizadas com as outras categorias
    setLocalCategories([...updatedSectionCategories, ...otherCategories])
    setHasChanges(true)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-white border-r w-64">
        <div className="flex items-center px-3 py-4 border-b h-[10%]">
          <span>Carregando...</span>
        </div>
      </div>
    )
  }

  // Filter categories by section
  const reportCategories = categories.filter(cat => cat.section === 'reports')
  const managementCategories = categories.filter(cat => cat.section === 'management')

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
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="reports">
                {(provided) => (
                  <nav 
                    className="space-y-1"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {reportCategories.map((category, index) => (
                      <Draggable 
                        key={category.id} 
                        draggableId={category.id} 
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <button
                              onClick={() => toggleCategory(category.id)}
                              className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
                            >
                              <div className="flex items-center">
                                {getIconForCategory(category.slug)}
                                <span className="ml-2">{category.name}</span>
                              </div>
                              <ChevronDownIcon 
                                className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                                  openCategory === category.id ? 'transform rotate-180' : ''
                                }`} 
                              />
                            </button>
                            {openCategory === category.id && (
                              <div className="ml-7 space-y-1">
                                {getCategoryPages(category.id).map((page) => (
                                  <Link
                                    key={page.id}
                                    href={`/relatorios/${category.slug}/${page.slug}`}
                                    className="flex items-center px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100"
                                  >
                                    <DocumentDuplicateIcon className="h-4 w-4 text-gray-500" />
                                    <span className="ml-2">{page.name}</span>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </nav>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>

        {/* Gerenciamento - 45% */}
        <div className="h-[45%] overflow-y-auto border-t">
          <div className="px-3 py-4">
            <h2 className="text-sm font-semibold text-black uppercase tracking-wider mb-3 px-2">
              Gerenciamento
            </h2>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="management">
                {(provided) => (
                  <nav 
                    className="space-y-1"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {managementCategories.map((category, index) => {
                      const pages = getCategoryPages(category.id)
                      return (
                        <Draggable 
                          key={category.id} 
                          draggableId={category.id} 
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              {pages.length > 1 ? (
                                <>
                                  <button
                                    onClick={() => toggleCategory(category.id)}
                                    className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
                                  >
                                    <div className="flex items-center">
                                      {getIconForCategory(category.slug)}
                                      <span className="ml-2">{category.name}</span>
                                    </div>
                                    <ChevronDownIcon 
                                      className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                                        openCategory === category.id ? 'transform rotate-180' : ''
                                      }`} 
                                    />
                                  </button>
                                  {openCategory === category.id && (
                                    <div className="ml-7 space-y-1">
                                      {pages.map((page) => (
                                        <Link
                                          key={page.id}
                                          href={`/gerenciamento/${category.slug}/${page.slug}`}
                                          className="flex items-center px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100"
                                        >
                                          <DocumentDuplicateIcon className="h-4 w-4 text-gray-500" />
                                          <span className="ml-2">{page.name}</span>
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <Link
                                  href={pages[0] ? `/gerenciamento/${category.slug}` : '#'}
                                  className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
                                >
                                  {getIconForCategory(category.slug)}
                                  <span className="ml-2">{category.name}</span>
                                </Link>
                              )}
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </nav>
                )}
              </Droppable>
            </DragDropContext>
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

      {hasChanges && (
        <div className="p-4 border-t">
          <Button 
            onClick={handleUpdateOrder}
            className="w-full bg-black hover:bg-black/90"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Ordenação
          </Button>
        </div>
      )}
    </div>
  )
} 