"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { User, UserPermissions, ResourcePermission, PermissionType } from "@/types/user"
import { permissionService } from "@/services/permissionService"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface GerenciarPermissoesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  mode: "view" | "edit"
}

export function GerenciarPermissoesModal({
  open,
  onOpenChange,
  user,
  mode
}: GerenciarPermissoesModalProps) {
  const [activeTab, setActiveTab] = useState("perfil")
  const [isLoading, setIsLoading] = useState(true)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchPermissions()
    }
  }, [open, user.id])

  const fetchPermissions = async () => {
    try {
      console.log("Iniciando busca de permissões para:", user.email)
      setIsLoading(true)
      setError(null)
      const data = await permissionService.getUserPermissions(user.id)
      console.log("Permissões recebidas:", data)
      setPermissions(data)
    } catch (error) {
      console.error("Erro ao carregar permissões:", error)
      setError("Não foi possível carregar as permissões. Por favor, tente novamente.")
      toast({
        title: "Erro",
        description: "Não foi possível carregar as permissões.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBaseProfileChange = async (value: string) => {
    if (mode === "view" || !permissions) return
    
    try {
      await permissionService.updateUserPermissions(user.id, {
        ...permissions,
        base_profile: value as UserPermissions["base_profile"]
      })
      
      setPermissions(prev => prev ? {
        ...prev,
        base_profile: value as UserPermissions["base_profile"]
      } : null)

      toast({
        title: "Sucesso",
        description: "Perfil base atualizado com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao atualizar perfil base:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil base.",
        variant: "destructive",
      })
    }
  }

  const handleUnitChange = async (unitId: string) => {
    if (mode === "view" || !permissions) return

    try {
      await permissionService.updateUserPermissions(user.id, {
        ...permissions,
        unit_id: unitId
      })
      
      setPermissions(prev => prev ? {
        ...prev,
        unit_id: unitId
      } : null)

      toast({
        title: "Sucesso",
        description: "Unidade atualizada com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao atualizar unidade:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a unidade.",
        variant: "destructive",
      })
    }
  }

  const handlePermissionToggle = async (resourceId: string, permission: PermissionType) => {
    if (mode === "view" || !permissions) return

    const resourceIndex = permissions.resources.findIndex(r => r.id === resourceId)
    if (resourceIndex === -1) return

    const resource = permissions.resources[resourceIndex]
    const newPermissions = resource.permissions.includes(permission)
      ? resource.permissions.filter(p => p !== permission)
      : [...resource.permissions, permission]

    const updatedResources = [...permissions.resources]
    updatedResources[resourceIndex] = {
      ...resource,
      permissions: newPermissions
    }

    try {
      await permissionService.updateUserPermissions(user.id, {
        ...permissions,
        resources: updatedResources
      })

      setPermissions(prev => prev ? {
        ...prev,
        resources: updatedResources
      } : null)

      toast({
        title: "Sucesso",
        description: "Permissões atualizadas com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao atualizar permissões:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as permissões.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <div className="flex items-center px-4 h-12 border-b relative">
          <div className="flex-1 text-center">
            <span className="text-base font-medium">
              {mode === "view" ? "Visualizar" : "Editar"} Permissões - {user.profile.nome}
            </span>
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

        {error ? (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <p>Carregando...</p>
          </div>
        ) : !permissions ? (
          <div className="flex items-center justify-center h-[300px]">
            <p>Erro ao carregar permissões</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="perfil">Perfil Base</TabsTrigger>
              <TabsTrigger value="recursos">Recursos</TabsTrigger>
            </TabsList>

            <TabsContent value="perfil" className="space-y-4 mt-4 px-4">
              <div className="space-y-2">
                <Label>Perfil Base</Label>
                <Select
                  value={permissions.base_profile}
                  onValueChange={handleBaseProfileChange}
                  disabled={mode !== "edit"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil base" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global_admin">Administrador Global</SelectItem>
                    <SelectItem value="global_viewer">Visualizador Global</SelectItem>
                    <SelectItem value="regional_admin">Administrador Regional</SelectItem>
                    <SelectItem value="regional_viewer">Visualizador Regional</SelectItem>
                    <SelectItem value="custom">Customizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(permissions.base_profile === "regional_admin" || 
                permissions.base_profile === "regional_viewer") && (
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Select
                    value={permissions.unit_id || ""}
                    onValueChange={handleUnitChange}
                    disabled={mode === "view"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ITB">Ituiutaba</SelectItem>
                      <SelectItem value="URA">Uberaba</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recursos" className="mt-4 px-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p>Carregando...</p>
                </div>
              ) : !permissions ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p>Erro ao carregar permissões</p>
                </div>
              ) : permissions.resources.length === 0 ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p>Nenhum recurso disponível para configuração</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Categorias */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Categorias</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead className="w-[100px] text-center">Visualizar</TableHead>
                          <TableHead className="w-[100px] text-center">Editar</TableHead>
                          <TableHead className="w-[100px] text-center">Admin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {permissions.groupedResources?.category?.map((resource) => (
                          <TableRow key={resource.id}>
                            <TableCell>{resource.name}</TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={resource.permissions.includes("view")}
                                onCheckedChange={() => handlePermissionToggle(resource.id, "view")}
                                disabled={mode === "view"}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={resource.permissions.includes("edit")}
                                onCheckedChange={() => handlePermissionToggle(resource.id, "edit")}
                                disabled={mode === "view"}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={resource.permissions.includes("admin")}
                                onCheckedChange={() => handlePermissionToggle(resource.id, "admin")}
                                disabled={mode === "view"}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Páginas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Páginas</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead className="w-[100px] text-center">Visualizar</TableHead>
                          <TableHead className="w-[100px] text-center">Editar</TableHead>
                          <TableHead className="w-[100px] text-center">Admin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {permissions.groupedResources?.page?.map((resource) => (
                          <TableRow key={resource.id}>
                            <TableCell>{resource.name}</TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={resource.permissions.includes("view")}
                                onCheckedChange={() => handlePermissionToggle(resource.id, "view")}
                                disabled={mode === "view"}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={resource.permissions.includes("edit")}
                                onCheckedChange={() => handlePermissionToggle(resource.id, "edit")}
                                disabled={mode === "view"}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={resource.permissions.includes("admin")}
                                onCheckedChange={() => handlePermissionToggle(resource.id, "admin")}
                                disabled={mode === "view"}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Painéis */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Painéis</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead className="w-[100px] text-center">Visualizar</TableHead>
                          <TableHead className="w-[100px] text-center">Editar</TableHead>
                          <TableHead className="w-[100px] text-center">Admin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {permissions.groupedResources?.panel?.map((resource) => (
                          <TableRow key={resource.id}>
                            <TableCell>{resource.name}</TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={resource.permissions.includes("view")}
                                onCheckedChange={() => handlePermissionToggle(resource.id, "view")}
                                disabled={mode === "view"}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={resource.permissions.includes("edit")}
                                onCheckedChange={() => handlePermissionToggle(resource.id, "edit")}
                                disabled={mode === "view"}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={resource.permissions.includes("admin")}
                                onCheckedChange={() => handlePermissionToggle(resource.id, "admin")}
                                disabled={mode === "view"}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
} 