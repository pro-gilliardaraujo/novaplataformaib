"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { User } from "@/types/user"
import { useQueryClient } from "@tanstack/react-query"
import { X, ChevronDown, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { Category, Page } from "@/types/pages"

interface GerenciarPermissoesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  mode: "view" | "edit"
}

interface PagePermission {
  page_id: string
  can_access: boolean
}

export function GerenciarPermissoesModal({
  open,
  onOpenChange,
  user,
  mode
}: GerenciarPermissoesModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [permissions, setPermissions] = useState<PagePermission[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [cargo, setCargo] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (user?.id) {
      loadData()
      setNome(user.profile?.nome || "")
      setEmail(user.email || "")
      setCargo(user.profile?.cargo || "")
      setIsAdmin(user.profile?.adminProfile || false)
    }
  }, [user])

  const loadData = async () => {
    try {
      setIsLoading(true)

      // Busca categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('order_index')

      if (categoriesError) throw categoriesError

      // Busca páginas
      const { data: pagesData, error: pagesError } = await supabase
        .from('pages')
        .select('*')

      if (pagesError) throw pagesError

      // Busca permissões do usuário
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_page_permissions')
        .select('*')
        .eq('user_id', user?.id)

      if (permissionsError) throw permissionsError

      setCategories(categoriesData || [])
      setPages(pagesData || [])
      setPermissions(permissionsData || [])

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const togglePagePermission = (pageId: string) => {
    setPermissions(prev => {
      const existingPermission = prev.find(p => p.page_id === pageId)
      if (existingPermission) {
        return prev.map(p => 
          p.page_id === pageId 
            ? { ...p, can_access: !p.can_access }
            : p
        )
      } else {
        return [...prev, { page_id: pageId, can_access: true }]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      setIsLoading(true)

      // Atualiza o perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome,
          cargo,
          adminProfile: isAdmin
        })
        .eq('user_id', user.id)

      if (profileError) throw profileError

      // Atualiza as permissões
      const { error: permissionsError } = await supabase
        .from('user_page_permissions')
        .upsert(
          permissions.map(p => ({
            user_id: user.id,
            page_id: p.page_id,
            can_access: p.can_access
          })),
          { onConflict: 'user_id,page_id' }
        )

      if (permissionsError) throw permissionsError

      queryClient.invalidateQueries({ queryKey: ['users'] })

      toast({
        title: "Usuário atualizado com sucesso",
        variant: "default",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      toast({
        title: "Erro ao atualizar usuário",
        description: error instanceof Error ? error.message : "Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryPages = (categoryId: string) => {
    return pages.filter(page => page.category_id === categoryId)
  }

  const isPageChecked = (pageId: string) => {
    const permission = permissions.find(p => p.page_id === pageId)
    return permission?.can_access || false
  }

  const renderSection = (section: 'reports' | 'management') => {
    const sectionCategories = categories
      .filter(category => category.section === section)
      .sort((a, b) => a.order_index - b.order_index)

    return (
      <div className="border rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={sectionCategories.every(cat => 
              getCategoryPages(cat.id).every(page => isPageChecked(page.id))
            )}
            onCheckedChange={() => {
              const allPages = sectionCategories.flatMap(cat => getCategoryPages(cat.id))
              const allChecked = allPages.every(page => isPageChecked(page.id))
              setPermissions(prev => {
                const newPermissions = prev.filter(p => 
                  !allPages.some(page => page.id === p.page_id)
                )
                if (!allChecked) {
                  allPages.forEach(page => {
                    newPermissions.push({ page_id: page.id, can_access: true })
                  })
                }
                return newPermissions
              })
            }}
          />
          <div className="text-base font-bold uppercase">
            {section === 'reports' ? 'Relatórios' : 'Gerenciamento'}
          </div>
        </div>
        <div className="space-y-2 mt-2">
          {sectionCategories.map(category => (
            <div key={category.id} className="border rounded-lg">
              <div className="flex items-center p-2">
                <button
                  className="flex items-center justify-between hover:bg-gray-50 rounded p-1"
                  onClick={() => toggleCategory(category.id)}
                >
                  {expandedCategories.has(category.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <div className="flex items-center space-x-2 ml-2">
                  <Checkbox
                    checked={getCategoryPages(category.id).every(page => isPageChecked(page.id))}
                    onCheckedChange={() => {
                      const categoryPages = getCategoryPages(category.id)
                      const allChecked = categoryPages.every(page => isPageChecked(page.id))
                      setPermissions(prev => {
                        const newPermissions = prev.filter(p => 
                          !categoryPages.some(page => page.id === p.page_id)
                        )
                        if (!allChecked) {
                          categoryPages.forEach(page => {
                            newPermissions.push({ page_id: page.id, can_access: true })
                          })
                        }
                        return newPermissions
                      })
                    }}
                  />
                  <span className="font-medium">{category.name}</span>
                </div>
              </div>
              
              {expandedCategories.has(category.id) && (
                <div className="p-2 space-y-2 border-t">
                  {getCategoryPages(category.id).map(page => (
                    <div key={page.id} className="flex items-center space-x-2 pl-6">
                      <Checkbox
                        id={page.id}
                        checked={isPageChecked(page.id)}
                        onCheckedChange={() => togglePagePermission(page.id)}
                      />
                      <label
                        htmlFor={page.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {page.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] p-0 flex flex-col h-[90vh]">
        <div className="flex items-center px-4 h-12 border-b relative">
          <div className="flex-1 text-center">
            <span className="text-base font-medium">Editar Usuário - {user.email}</span>
          </div>
          <DialogClose asChild>
            <Button 
              variant="outline"
              className="h-8 w-8 p-0 absolute right-2 top-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Coluna da esquerda - Informações */}
          <div className="w-1/2 p-6 border-r overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-center">Informações do Usuário</h3>
            <form className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Cargo do usuário"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Usuário</Label>
                  <Select
                    value={isAdmin ? "admin" : "user"}
                    onValueChange={(value) => setIsAdmin(value === "admin")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
          </div>

          {/* Coluna da direita - Permissões */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-center">Permissões de Acesso</h3>
            <div className="space-y-6">
              {renderSection('reports')}
              {renderSection('management')}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="bg-black hover:bg-black/90"
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 