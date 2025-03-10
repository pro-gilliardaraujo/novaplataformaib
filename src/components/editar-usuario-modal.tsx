"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { User, UpdateUsuarioData, UserPermissions, ResourcePermission, PermissionType } from "@/types/user"
import { permissionService } from "@/services/permissionService"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface EditarUsuarioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUsuarioEdited: (updates: UpdateUsuarioData) => void
  usuarioData: User
}

export function EditarUsuarioModal({
  open,
  onOpenChange,
  onUsuarioEdited,
  usuarioData,
}: EditarUsuarioModalProps) {
  const [activeTab, setActiveTab] = useState("informacoes")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [units, setUnits] = useState<{ id: string; name: string }[]>([])
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    nome: usuarioData.profile.nome,
    cargo: usuarioData.profile.cargo || "",
    base_profile: usuarioData.profile.base_profile || "custom",
    unit_id: usuarioData.profile.unit_id || "",
  })

  useEffect(() => {
    if (open) {
      setError(null)
      fetchPermissions()
      fetchUnits()
    }
  }, [open, usuarioData.id])

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('id, name')
        .order('name')

      if (error) throw error
      setUnits(data || [])
    } catch (error) {
      console.error('Erro ao carregar unidades:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as unidades.",
        variant: "destructive"
      })
    }
  }

  const fetchPermissions = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await permissionService.getUserPermissions(usuarioData.id)
      
      if (!data) {
        throw new Error("Não foi possível carregar as permissões do usuário.")
      }

      setPermissions(data)
      setFormData(prev => ({
        ...prev,
        base_profile: data.base_profile,
        unit_id: data.unit_id || ""
      }))
    } catch (error) {
      console.error("Erro ao carregar permissões:", error)
      setError("Não foi possível carregar as permissões do usuário.")
      toast({
        title: "Erro",
        description: "Erro ao carregar permissões do usuário.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleBaseProfileChange = async (value: string) => {
    try {
      setIsLoading(true)
      await permissionService.updateUserPermissions(usuarioData.id, {
        base_profile: value as UserPermissions["base_profile"],
        unit_id: formData.unit_id,
        resources: permissions?.resources || []
      })
      
      await fetchPermissions() // Recarrega as permissões atualizadas
      toast({ title: "Sucesso", description: "Perfil base atualizado com sucesso!" })
    } catch (error) {
      console.error("Erro ao atualizar perfil base:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil base.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnitChange = async (unitId: string) => {
    try {
      setIsLoading(true)
      setFormData(prev => ({ ...prev, unit_id: unitId }))
      
      if (permissions) {
        await permissionService.updateUserPermissions(usuarioData.id, {
          ...permissions,
          unit_id: unitId
        })
      }

      toast({ title: "Sucesso", description: "Unidade atualizada com sucesso!" })
    } catch (error) {
      console.error("Erro ao atualizar unidade:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar unidade.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePermissionToggle = async (resourceId: string, permission: PermissionType) => {
    if (!permissions) return

    try {
      setIsLoading(true)
      const resourceIndex = permissions.resources.findIndex(r => r.id === resourceId)
      
      if (resourceIndex === -1) return

      const updatedResources = [...permissions.resources]
      const resource = updatedResources[resourceIndex]
      
      const newPermissions = resource.permissions.includes(permission)
        ? resource.permissions.filter(p => p !== permission)
        : [...resource.permissions, permission]

      updatedResources[resourceIndex] = {
        ...resource,
        permissions: newPermissions
      }

      await permissionService.updateUserPermissions(usuarioData.id, {
        ...permissions,
        resources: updatedResources
      })

      setPermissions(prev => prev ? {
        ...prev,
        resources: updatedResources
      } : null)

      toast({ title: "Sucesso", description: "Permissões atualizadas com sucesso!" })
    } catch (error) {
      console.error("Erro ao atualizar permissões:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar permissões.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUsuarioEdited(formData)
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar usuário. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <div className="flex items-center px-4 h-12 border-b relative">
          <div className="flex-1 text-center">
            <span className="text-base font-medium">Editar Usuário</span>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
          <div className="-mt-[14px]">
            <TabsList className="w-full h-10 bg-gray-50 rounded-none border-b">
              <TabsTrigger 
                value="informacoes" 
                className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-[inset_0_-2px_0_0_#000000]"
              >
                Informações Básicas
              </TabsTrigger>
              <TabsTrigger 
                value="permissoes" 
                className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-[inset_0_-2px_0_0_#000000]"
              >
                Permissões
              </TabsTrigger>
              <TabsTrigger 
                value="recursos" 
                className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-[inset_0_-2px_0_0_#000000]"
              >
                Recursos
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <TabsContent value="informacoes" className="mt-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    placeholder="Nome do usuário"
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
              </div>
            </TabsContent>

            <TabsContent value="permissoes" className="mt-0">
              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Perfil Base</Label>
                    <Select
                      value={formData.base_profile}
                      onValueChange={handleBaseProfileChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o perfil base" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global_admin">Administrador Global</SelectItem>
                        <SelectItem value="global_viewer">Visualizador Global</SelectItem>
                        <SelectItem value="regional_admin">Administrador Regional</SelectItem>
                        <SelectItem value="regional_viewer">Visualizador Regional</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(formData.base_profile === "regional_admin" || formData.base_profile === "regional_viewer") && (
                    <div className="space-y-2">
                      <Label>Unidade</Label>
                      <Select
                        value={formData.unit_id}
                        onValueChange={handleUnitChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recursos" className="mt-0">
              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : permissions?.resources && permissions.resources.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Visualizar</TableHead>
                      <TableHead>Editar</TableHead>
                      <TableHead>Administrar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.resources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell>{resource.name || resource.id}</TableCell>
                        <TableCell>
                          <Checkbox
                            checked={resource.permissions.includes("view")}
                            onCheckedChange={() => handlePermissionToggle(resource.id, "view")}
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={resource.permissions.includes("edit")}
                            onCheckedChange={() => handlePermissionToggle(resource.id, "edit")}
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={resource.permissions.includes("admin")}
                            onCheckedChange={() => handlePermissionToggle(resource.id, "admin")}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Nenhum recurso disponível para configuração.
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 