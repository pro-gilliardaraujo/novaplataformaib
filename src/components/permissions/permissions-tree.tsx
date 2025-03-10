"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { PagePermission } from "@/services/permissionService"
import { ChevronDown, ChevronRight } from "lucide-react"

interface CategoryGroup {
  category_id: string
  category_name: string
  category_order: number
  pages: PagePermission[]
}

interface PermissionsTreeProps {
  userId: string
  isAdmin: boolean
  onSave?: () => void
}

export function PermissionsTree({ userId, isAdmin, onSave }: PermissionsTreeProps) {
  const [permissions, setPermissions] = useState<PagePermission[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadPermissions()
  }, [userId])

  const loadPermissions = async () => {
    try {
      const response = await fetch(`/api/permissions?userId=${userId}`)
      if (!response.ok) throw new Error('Erro ao carregar permissões')
      const data = await response.json()
      setPermissions(data)
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as permissões",
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
    setPermissions(prev => 
      prev.map(p => 
        p.page_id === pageId 
          ? { ...p, can_access: !p.can_access }
          : p
      )
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          permissions: permissions.map(p => ({
            page_id: p.page_id,
            can_access: p.can_access
          }))
        })
      })

      if (!response.ok) throw new Error('Erro ao salvar permissões')

      toast({
        title: "Sucesso",
        description: "Permissões atualizadas com sucesso",
      })

      onSave?.()
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar as permissões",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const groupByCategory = (): CategoryGroup[] => {
    const groups = permissions.reduce((acc, page) => {
      if (!acc[page.category_id]) {
        acc[page.category_id] = {
          category_id: page.category_id,
          category_name: page.category_name,
          category_order: page.category_order,
          pages: []
        }
      }
      acc[page.category_id].pages.push(page)
      return acc
    }, {} as Record<string, CategoryGroup>)

    return Object.values(groups).sort((a, b) => a.category_order - b.category_order)
  }

  if (isLoading) {
    return <div className="p-4">Carregando permissões...</div>
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {groupByCategory().map(category => (
          <div key={category.category_id} className="border rounded-lg">
            <button
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50"
              onClick={() => toggleCategory(category.category_id)}
            >
              <span className="font-medium">{category.category_name}</span>
              {expandedCategories.has(category.category_id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {expandedCategories.has(category.category_id) && (
              <div className="p-2 space-y-2">
                {category.pages.map(page => (
                  <div key={page.page_id} className="flex items-center space-x-2">
                    <Checkbox
                      id={page.page_id}
                      checked={page.can_access}
                      onCheckedChange={() => togglePagePermission(page.page_id)}
                    />
                    <label
                      htmlFor={page.page_id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {page.page_name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar Permissões"}
        </Button>
      </div>
    </div>
  )
} 