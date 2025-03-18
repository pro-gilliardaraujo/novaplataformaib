"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { User, UpdateUsuarioData } from "@/types/user"
import { supabase } from "@/lib/supabase"
import { useQueryClient } from "@tanstack/react-query"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { userService } from "@/services/userService"
import { useQuery } from "@tanstack/react-query"
import { ChevronRight, X } from "lucide-react"

interface EditarUsuarioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: User
  onSuccess: () => void
}

interface Permission {
  id: string
  label: string
  children?: Permission[]
  isSection?: boolean
  isCategory?: boolean
}

function PermissionTree({ 
  permissions, 
  selectedPermissions, 
  onToggle,
  level = 0,
  onSelectAll,
  onUnselectAll,
  expandedSections,
  expandedCategories,
  setExpandedSections,
  setExpandedCategories
}: { 
  permissions: Permission[]
  selectedPermissions: Set<string>
  onToggle: (id: string) => void
  level?: number
  onSelectAll?: () => void
  onUnselectAll?: () => void
  expandedSections: Set<string>
  expandedCategories: Set<string>
  setExpandedSections: React.Dispatch<React.SetStateAction<Set<string>>>
  setExpandedCategories: React.Dispatch<React.SetStateAction<Set<string>>>
}) {
  const [isAllExpanded, setIsAllExpanded] = useState(false)

  const toggleExpand = (id: string, type: 'section' | 'category') => {
    const set = type === 'section' ? expandedSections : expandedCategories
    const setFn = type === 'section' ? setExpandedSections : setExpandedCategories
    const newSet = new Set(set)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setFn(newSet)
  }

  const toggleExpandAll = () => {
    setIsAllExpanded(prev => {
      if (!prev) {
        // Expand all
        const allSections = new Set<string>()
        const allCategories = new Set<string>()
        
        const collectIds = (items: Permission[]) => {
          items.forEach(item => {
            if (item.isSection) {
              allSections.add(item.id)
            } else if (item.isCategory) {
              allCategories.add(item.id)
            }
            if (item.children) {
              collectIds(item.children)
            }
          })
        }
        
        collectIds(permissions)
        setExpandedSections(allSections)
        setExpandedCategories(allCategories)
      } else {
        // Collapse all
        setExpandedSections(new Set())
        setExpandedCategories(new Set())
      }
      return !prev
    })
  }

  return (
    <div className="space-y-4">
      {level === 0 && onSelectAll && onUnselectAll && (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            className="text-xs"
          >
            Selecionar Todos
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onUnselectAll}
            className="text-xs"
          >
            Limpar Todos
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleExpandAll}
            className="text-xs"
          >
            {isAllExpanded ? "Recolher tudo" : "Expandir tudo"}
          </Button>
        </div>
      )}
      <div className="space-y-2">
        {permissions.map((permission) => {
          const isExpanded = permission.isSection 
            ? expandedSections.has(permission.id)
            : expandedCategories.has(permission.id)

          return (
            <div key={permission.id}>
              <div 
                className="flex items-center space-x-2" 
                style={{ marginLeft: `${level * 16}px` }}
              >
                {permission.children && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => toggleExpand(
                      permission.id, 
                      permission.isSection ? 'section' : 'category'
                    )}
                  >
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </Button>
                )}
                <Checkbox
                  id={permission.id}
                  checked={selectedPermissions.has(permission.id)}
                  onCheckedChange={() => onToggle(permission.id)}
                />
                <label
                  htmlFor={permission.id}
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                    permission.isSection ? 'text-gray-900' : 
                    permission.isCategory ? 'text-gray-700' : 'text-gray-600'
                  }`}
                >
                  {permission.label}
                </label>
              </div>
              {permission.children && isExpanded && (
                <div className="mt-2">
                  <PermissionTree
                    permissions={permission.children}
                    selectedPermissions={selectedPermissions}
                    onToggle={onToggle}
                    level={level + 1}
                    onSelectAll={onSelectAll}
                    onUnselectAll={onUnselectAll}
                    expandedSections={expandedSections}
                    expandedCategories={expandedCategories}
                    setExpandedSections={setExpandedSections}
                    setExpandedCategories={setExpandedCategories}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function EditarUsuarioModal({
  open,
  onOpenChange,
  usuario,
  onSuccess
}: EditarUsuarioModalProps) {
  const [formData, setFormData] = useState({
    nome: usuario.profile.nome,
    email: usuario.email,
    cargo: usuario.profile.cargo || "",
    tipo: usuario.profile.adminProfile ? "administrador" : "usuario"
  })
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isAllExpanded, setIsAllExpanded] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch categories and pages
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order_index')
      if (error) throw error
      return data
    }
  })

  const { data: pages = [] } = useQuery({
    queryKey: ['pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug,
            section,
            order_index
          )
        `)
      if (error) throw error
      return data
    }
  })

  // Transform categories and pages into permissions tree
  const permissionsTree = useMemo(() => {
    // Group categories by section
    const sections = {
      management: {
        id: 'management',
        label: 'Gerenciamento',
        isSection: true,
        children: [] as Permission[]
      },
      reports: {
        id: 'reports',
        label: 'Visualizações',
        isSection: true,
        children: [] as Permission[]
      }
    }

    // Group categories by section
    categories.forEach(category => {
      const section = category.section as keyof typeof sections
      if (sections[section]) {
        sections[section].children.push({
          id: category.slug,
          label: category.name,
          isCategory: true,
          children: pages
            .filter(page => page.category_id === category.id)
            .map(page => ({
              id: page.slug,
              label: page.name
            }))
        })
      }
    })

    return Object.values(sections)
  }, [categories, pages])

  useEffect(() => {
    if (usuario && usuario.profile) {
      setFormData({
        nome: usuario.profile.nome || "",
        email: usuario.email || "",
        cargo: usuario.profile.cargo || "",
        tipo: usuario.profile.adminProfile ? "administrador" : "usuario"
      })
      setSelectedPermissions(new Set(usuario.profile.permissions as string[] || []))
    }
  }, [usuario])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const updateData: UpdateUsuarioData = {
        nome: formData.nome,
        cargo: formData.cargo,
        tipo_usuario: formData.tipo === "administrador",
        permissions: Array.from(selectedPermissions).map(id => ({
          page_id: id,
          can_access: true
        }))
      }
      
      await userService.updateUser(usuario.id, updateData)
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar usuário. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleSelectAll = () => {
    const allPermissions = new Set<string>()
    const addPermissions = (permissions: Permission[]) => {
      permissions.forEach(permission => {
        allPermissions.add(permission.id)
        if (permission.children) {
          addPermissions(permission.children)
        }
      })
    }
    addPermissions(permissionsTree)
    setSelectedPermissions(allPermissions)
  }

  const handleUnselectAll = () => {
    setSelectedPermissions(new Set())
  }

  const handleTogglePermission = (id: string) => {
    const newPermissions = new Set(selectedPermissions)
    if (newPermissions.has(id)) {
      newPermissions.delete(id)
    } else {
      newPermissions.add(id)
    }
    setSelectedPermissions(newPermissions)
  }

  const handleTipoChange = (value: string) => {
    setFormData(prev => ({ ...prev, tipo: value }))
    if (value === "administrador") {
      handleSelectAll()
    } else {
      // For regular users, select only items from "Visualizações" section
      const newPermissions = new Set<string>()
      const addReportsPermissions = (permissions: Permission[]) => {
        permissions.forEach(permission => {
          if (permission.isSection && permission.id === 'reports') {
            // Add the section itself
            newPermissions.add(permission.id)
            if (permission.children) {
              permission.children.forEach(category => {
                newPermissions.add(category.id)
                if (category.children) {
                  category.children.forEach(page => {
                    newPermissions.add(page.id)
                  })
                }
              })
            }
          }
        })
      }
      addReportsPermissions(permissionsTree)
      setSelectedPermissions(newPermissions)
    }
  }

  const toggleExpandAll = () => {
    setIsAllExpanded(prev => {
      if (!prev) {
        // Expand all
        const allSections = new Set<string>()
        const allCategories = new Set<string>()
        
        const collectIds = (items: Permission[]) => {
          items.forEach(item => {
            if (item.isSection) {
              allSections.add(item.id)
            } else if (item.isCategory) {
              allCategories.add(item.id)
            }
            if (item.children) {
              collectIds(item.children)
            }
          })
        }
        
        collectIds(permissionsTree)
        setExpandedSections(allSections)
        setExpandedCategories(allCategories)
      } else {
        // Collapse all
        setExpandedSections(new Set())
        setExpandedCategories(new Set())
      }
      return !prev
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 flex flex-col h-[90vh]">
        <div className="flex items-center px-6 h-14 border-b relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-medium">Editar Usuário</span>
          </div>
          <div className="absolute right-4 top-3">
            <Button 
              variant="outline"
              className="h-8 w-8 p-0 rounded-md shadow-sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-6 p-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-center">Informações</h3>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      value={formData.cargo}
                      onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Usuário</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={handleTipoChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usuario">Usuário</SelectItem>
                        <SelectItem value="administrador">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-center">Permissões</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="text-xs"
                    >
                      Selecionar Todos
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUnselectAll}
                      className="text-xs"
                    >
                      Limpar Todos
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleExpandAll}
                      className="text-xs"
                    >
                      {isAllExpanded ? "Recolher tudo" : "Expandir tudo"}
                    </Button>
                  </div>
                </div>
                <div className="border rounded-md p-4 h-[400px] overflow-y-auto">
                  <PermissionTree
                    permissions={permissionsTree}
                    selectedPermissions={selectedPermissions}
                    onToggle={handleTogglePermission}
                    expandedSections={expandedSections}
                    expandedCategories={expandedCategories}
                    setExpandedSections={setExpandedSections}
                    setExpandedCategories={setExpandedCategories}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex items-center justify-end gap-2 p-6 border-t bg-white">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-black hover:bg-black/90">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 