"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Category, Page } from "@/types/pages"
import { pageService } from "@/services/pageService"
import { PagesTreeView } from "@/components/pages-tree-view"
import { CategoryFormModal } from "@/components/category-form-modal"
import { PageFormModal } from "@/components/page-form-modal"
import { GerenciarPaginaModal } from "@/components/gerenciar-pagina-modal"
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query"
import { getDefaultTabContent } from "@/utils/templates"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { supabase } from "@/lib/supabase"

export default function PaginasPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined)
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isPageModalOpen, setIsPageModalOpen] = useState(false)
  const [isPageContentModalOpen, setIsPageContentModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteType, setDeleteType] = useState<"category" | "page" | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Queries
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
        .select(`
          *,
          tabs(*),
          categories:category_id (
            id,
            name,
            slug,
            section,
            order_index
          )
        `)
      
      if (error) throw error

      // Mapeia os resultados para incluir category_name
      return data.map(page => ({
        ...page,
        category_name: page.categories?.name
      })) as Page[]
    }
  })

  // Mutations
  const updateOrderMutation = useMutation({
    mutationFn: async (updatedCategories: Category[]) => {
      const updates = updatedCategories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        order_index: category.order_index,
        section: category.section
      }))

      const { error } = await supabase
        .from('categories')
        .upsert(updates, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })

      if (error) throw error
      return updatedCategories
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast({
        title: "Sucesso",
        description: "Ordem atualizada com sucesso",
      })
    },
    onError: (error) => {
      console.error('Erro ao atualizar ordem:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a ordem",
        variant: "destructive",
      })
    }
  })

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const maxOrderIndex = Math.max(...categories.map(c => c.order_index), 0)
      const { data: newCategory, error } = await supabase
        .from('categories')
        .insert([
          { 
            name: data.name,
            slug: data.name.toLowerCase().replace(/\s+/g, '-'),
            order_index: maxOrderIndex + 1,
            section: 'reports'
          }
        ])
        .select()
        .single()

      if (error) throw error
      return newCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setIsCategoryModalOpen(false)
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso",
      })
    },
    onError: (error) => {
      console.error('Erro ao criar categoria:', error)
      toast({
        title: "Erro",
        description: "Não foi possível criar a categoria",
        variant: "destructive",
      })
    }
  })

  const editCategoryMutation = useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      const { error } = await supabase
        .from('categories')
        .update({ name: data.name })
        .eq('id', data.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setIsCategoryModalOpen(false)
      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso",
      })
    },
    onError: (error) => {
      console.error('Erro ao atualizar categoria:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a categoria",
        variant: "destructive",
      })
    }
  })

  const createPageMutation = useMutation({
    mutationFn: async (data: { name: string; categoryId: string }) => {
      // Primeiro busca a categoria para verificar se é relatório
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('section')
        .eq('id', data.categoryId)
        .single()

      if (categoryError) throw categoryError

      // Cria a página
      const { data: page, error: pageError } = await supabase
        .from('pages')
        .insert([{
          name: data.name,
          slug: data.name.toLowerCase().replace(/\s+/g, '-'),
          category_id: data.categoryId
        }])
        .select()
        .single()

      if (pageError) throw pageError

      // Se for uma categoria de relatórios, cria uma aba inicial
      if (category.section === 'reports') {
        const { error: tabError } = await supabase
          .from('tabs')
          .insert([{
            page_id: page.id,
            name: 'Principal',
            content: getDefaultTabContent(),
            order_index: 0
          }])

        if (tabError) throw tabError
      }

      return page
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      setIsPageModalOpen(false)
      toast({
        title: "Sucesso",
        description: "Página criada com sucesso",
      })
    },
    onError: (error) => {
      console.error('Erro ao criar página:', error)
      toast({
        title: "Erro",
        description: "Não foi possível criar a página",
        variant: "destructive",
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: 'category' | 'page'; id: string }) => {
      const { error } = await supabase
        .from(type === 'category' ? 'categories' : 'pages')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [variables.type === 'category' ? 'categories' : 'pages'] 
      })
      setIsDeleteDialogOpen(false)
      setDeleteType(null)
      setSelectedCategory(undefined)
      setSelectedPage(null)
      toast({
        title: "Sucesso",
        description: `${variables.type === 'category' ? 'Categoria' : 'Página'} excluída com sucesso`,
      })
    },
    onError: (error) => {
      console.error('Erro ao excluir:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item",
        variant: "destructive",
      })
    }
  })

  const renamePageMutation = useMutation({
    mutationFn: async ({ pageId, newName }: { pageId: string; newName: string }) => {
      const { error } = await supabase
        .from('pages')
        .update({ name: newName })
        .eq('id', pageId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      toast({
        title: "Sucesso",
        description: "Página renomeada com sucesso",
      })
    },
    onError: (error) => {
      console.error('Erro ao renomear página:', error)
      toast({
        title: "Erro",
        description: "Não foi possível renomear a página",
        variant: "destructive",
      })
    }
  })

  const updatePageIconMutation = useMutation({
    mutationFn: async ({ pageId, iconName }: { pageId: string; iconName: string }) => {
      const { error } = await supabase
        .from('pages')
        .update({ icon: iconName })
        .eq('id', pageId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      toast({
        title: "Sucesso",
        description: "Ícone atualizado com sucesso",
      })
    },
    onError: (error) => {
      console.error('Erro ao atualizar ícone:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o ícone",
        variant: "destructive",
      })
    }
  })

  const renameCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, newName }: { categoryId: string; newName: string }) => {
      const { error } = await supabase
        .from('categories')
        .update({ name: newName })
        .eq('id', categoryId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast({
        title: "Sucesso",
        description: "Categoria renomeada com sucesso",
      })
    },
    onError: (error) => {
      console.error('Erro ao renomear categoria:', error)
      toast({
        title: "Erro",
        description: "Não foi possível renomear a categoria",
        variant: "destructive",
      })
    }
  })

  const updateCategoryIconMutation = useMutation({
    mutationFn: async ({ categoryId, iconName }: { categoryId: string; iconName: string }) => {
      // Primeiro atualiza o ícone da categoria
      const { error: categoryError } = await supabase
        .from('categories')
        .update({ icon: iconName })
        .eq('id', categoryId)

      if (categoryError) throw categoryError

      // Depois atualiza todas as páginas dessa categoria
      const { error: pagesError } = await supabase
        .from('pages')
        .update({ icon: iconName })
        .eq('category_id', categoryId)

      if (pagesError) throw pagesError
    },
    onSuccess: () => {
      // Invalida tanto as categorias quanto as páginas para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      toast({
        title: "Sucesso",
        description: "Ícone atualizado com sucesso em toda a categoria",
      })
    },
    onError: (error) => {
      console.error('Erro ao atualizar ícone:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os ícones",
        variant: "destructive",
      })
    }
  })

  const handleUpdateOrder = (updatedCategories: Category[]) => {
    updateOrderMutation.mutate(updatedCategories)
  }

  const handleRenamePage = (pageId: string, newName: string) => {
    renamePageMutation.mutate({ pageId, newName })
  }

  const handleUpdatePageIcon = (pageId: string, iconName: string) => {
    updatePageIconMutation.mutate({ pageId, iconName })
  }

  const handleRenameCategory = (categoryId: string, newName: string) => {
    renameCategoryMutation.mutate({ categoryId, newName })
  }

  const handleCreateCategory = async (data: { name: string }) => {
    await createCategoryMutation.mutateAsync(data)
  }

  const handleEditCategory = async (data: { name: string }) => {
    if (!selectedCategory) return
    await editCategoryMutation.mutateAsync({ id: selectedCategory.id, name: data.name })
  }

  const handleCreatePage = async (data: { name: string }) => {
    if (!selectedCategoryId) return
    await createPageMutation.mutateAsync({ name: data.name, categoryId: selectedCategoryId })
  }

  const handleDelete = () => {
    if (deleteType === "category" && selectedCategory) {
      deleteMutation.mutate({ type: 'category', id: selectedCategory.id })
    } else if (deleteType === "page" && selectedPage) {
      deleteMutation.mutate({ type: 'page', id: selectedPage.id })
    }
  }

  const isLoading = isCategoriesLoading || isPagesLoading

  if (isLoading) {
    return <div className="p-8">Carregando...</div>
  }

  return (
    <div className="p-8">
      <PagesTreeView
        categories={categories}
        pages={pages}
        onEditPage={(page) => {
          setSelectedPage(page)
          setIsPageContentModalOpen(true)
        }}
        onDeletePage={(page) => {
          setSelectedPage(page)
          setDeleteType("page")
          setIsDeleteDialogOpen(true)
        }}
        onAddPage={(categoryId) => {
          setSelectedCategoryId(categoryId)
          setIsPageModalOpen(true)
        }}
        onEditCategory={(category) => {
          setSelectedCategory(category)
          setIsCategoryModalOpen(true)
        }}
        onDeleteCategory={(category) => {
          setSelectedCategory(category)
          setDeleteType("category")
          setIsDeleteDialogOpen(true)
        }}
        onAddCategory={() => {
          setSelectedCategory(undefined)
          setIsCategoryModalOpen(true)
        }}
        onUpdateOrder={handleUpdateOrder}
        onRenamePage={handleRenamePage}
        onRenameCategory={handleRenameCategory}
        onUpdatePageIcon={handleUpdatePageIcon}
        onUpdateCategoryIcon={(categoryId, iconName) => {
          updateCategoryIconMutation.mutate({ categoryId, iconName })
        }}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente
              {deleteType === "category" ? " a categoria e todas as suas páginas" : " a página"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedCategory !== undefined && (
        <CategoryFormModal
          open={isCategoryModalOpen}
          onOpenChange={setIsCategoryModalOpen}
          onSubmit={selectedCategory ? handleEditCategory : handleCreateCategory}
          category={selectedCategory}
        />
      )}

      <PageFormModal
        open={isPageModalOpen}
        onOpenChange={setIsPageModalOpen}
        onSubmit={handleCreatePage}
        categoryId={selectedCategoryId}
      />

      {selectedPage && (
        <GerenciarPaginaModal
          open={isPageContentModalOpen}
          onOpenChange={setIsPageContentModalOpen}
          page={selectedPage}
          onPageUpdated={() => queryClient.invalidateQueries({ queryKey: ['pages'] })}
        />
      )}
    </div>
  )
} 