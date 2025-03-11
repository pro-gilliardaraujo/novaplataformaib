"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { X, ChevronDown, ChevronRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NovoUsuarioData } from "@/types/user"
import { formatName } from "@/utils/formatters"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"

interface NovoUsuarioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: NovoUsuarioData) => void
}

interface PagePermission {
  page_id: string
  can_access: boolean
}

interface Category {
  id: string
  name: string
  order_index: number
  section: 'reports' | 'management'
}

interface Page {
  id: string
  name: string
  category_id: string
}

export function NovoUsuarioModal({
  open,
  onOpenChange,
  onSubmit,
}: NovoUsuarioModalProps) {
  const [formData, setFormData] = useState<NovoUsuarioData>({
    nome: "",
    cargo: "",
    tipo_usuario: false
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [permissions, setPermissions] = useState<PagePermission[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [generatedEmail, setGeneratedEmail] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Gera o email sempre que o nome mudar
    if (formData.nome) {
      const normalizedName = formData.nome
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
      const [firstName, ...rest] = normalizedName.split(" ")
      const lastName = rest.length > 0 ? rest[rest.length - 1] : ""
      setGeneratedEmail(`${firstName}${lastName ? "." + lastName : ""}@ib.logistica`)
    } else {
      setGeneratedEmail("")
    }
  }, [formData.nome])

  const resetForm = () => {
    setFormData({
      nome: "",
      cargo: "",
      tipo_usuario: false
    })
    setPermissions([])
    setExpandedCategories(new Set())
    setError("")
  }

  const loadData = async () => {
    try {
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

      setCategories(categoriesData || [])
      setPages(pagesData || [])

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      tipo_usuario: value === "admin"
    }))

    // Se for admin, dá acesso a todas as páginas
    if (value === "admin") {
      const allPermissions = pages.map(page => ({
        page_id: page.id,
        can_access: true
      }))
      setPermissions(allPermissions)
    } else {
      setPermissions([])
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
    setError("")
    setIsLoading(true)

    try {
      const formattedData = {
        ...formData,
        nome: formatName(formData.nome),
        cargo: formData.cargo ? formatName(formData.cargo) : undefined,
        permissions: permissions
      }

      await onSubmit(formattedData)
      resetForm()
      onOpenChange(false)
      
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      })
    } catch (error) {
      console.error("Error details:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar usuário. Por favor, tente novamente.",
        variant: "destructive",
      })
      setError(`Erro ao criar usuário: ${error instanceof Error ? error.message : String(error)}`)
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
                  type="button"
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        resetForm()
      }
      onOpenChange(isOpen)
    }}>
      <DialogContent className="sm:max-w-[1200px] p-0 flex flex-col h-[90vh]">
        <div className="flex items-center px-4 h-12 border-b relative">
          <div className="flex-1 text-center">
            <span className="text-base font-medium">Novo Usuário</span>
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
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (gerado automaticamente)</Label>
                  <Input
                    id="email"
                    value={generatedEmail}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    name="cargo"
                    value={formData.cargo}
                    onChange={handleInputChange}
                    placeholder="Cargo do usuário"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Usuário</Label>
                  <Select
                    value={formData.tipo_usuario ? "admin" : "user"}
                    onValueChange={handleSelectChange}
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
            {isLoading ? "Criando..." : "Criar Usuário"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 