"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Category, Page } from "@/types/pages"
import { pageService } from "@/services/pageService"
import { PagesTreeView } from "@/components/pages-tree-view"
import { CategoryFormModal } from "@/components/category-form-modal"
import { PageFormModal } from "@/components/page-form-modal"
import { GerenciarPaginaModal } from "@/components/gerenciar-pagina-modal"
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

export default function PaginasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para modais
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isPageModalOpen, setIsPageModalOpen] = useState(false)
  const [isPageContentModalOpen, setIsPageContentModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteType, setDeleteType] = useState<"category" | "page" | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  const { toast } = useToast()

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
      setError("Erro ao carregar dados. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateCategory = async (data: { name: string }) => {
    try {
      await pageService.createCategory({
        name: data.name,
        order_index: categories.length + 1
      })
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso!",
      })
      fetchData()
    } catch (error) {
      console.error("Erro ao criar categoria:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar categoria. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleEditCategory = async (data: { name: string }) => {
    if (!selectedCategory) return

    try {
      await pageService.updateCategory(selectedCategory.id, data)
      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso!",
      })
      fetchData()
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar categoria. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleCreatePage = async (data: { name: string }) => {
    if (!selectedCategoryId) return

    try {
      await pageService.createPage({
        category_id: selectedCategoryId,
        name: data.name
      })
      toast({
        title: "Sucesso",
        description: "Página criada com sucesso!",
      })
      fetchData()
    } catch (error) {
      console.error("Erro ao criar página:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar página. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleEditPage = async (data: { name: string }) => {
    if (!selectedPage) return

    try {
      await pageService.updatePage(selectedPage.id, data)
      toast({
        title: "Sucesso",
        description: "Página atualizada com sucesso!",
      })
      fetchData()
    } catch (error) {
      console.error("Erro ao atualizar página:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar página. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateOrder = async (updatedCategories: Category[]) => {
    try {
      await pageService.updateCategoriesOrder(
        updatedCategories.map((category, index) => ({
          id: category.id,
          order_index: index + 1
        }))
      )
      toast({
        title: "Sucesso",
        description: "Ordem das categorias atualizada com sucesso!",
      })
      fetchData()
    } catch (error) {
      console.error("Erro ao atualizar ordem:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar ordem. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    try {
      if (deleteType === "category" && selectedCategory) {
        await pageService.deleteCategory(selectedCategory.id)
        toast({
          title: "Sucesso",
          description: "Categoria excluída com sucesso!",
        })
      } else if (deleteType === "page" && selectedPage) {
        await pageService.deletePage(selectedPage.id)
        toast({
          title: "Sucesso",
          description: "Página excluída com sucesso!",
        })
      }
      fetchData()
    } catch (error) {
      console.error("Erro ao excluir:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setDeleteType(null)
      setSelectedCategory(null)
      setSelectedPage(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Carregando...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Erro</h2>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-6">
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
          setSelectedCategory(null)
          setIsCategoryModalOpen(true)
        }}
        onUpdateOrder={handleUpdateOrder}
      />

      <CategoryFormModal
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        onSubmit={selectedCategory ? handleEditCategory : handleCreateCategory}
        category={selectedCategory}
      />

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
          onPageUpdated={fetchData}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === "category"
                ? "Esta ação não pode ser desfeita. Isso excluirá permanentemente a categoria e todas as suas páginas."
                : "Esta ação não pode ser desfeita. Isso excluirá permanentemente a página e todo o seu conteúdo."}
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
    </div>
  )
} 