"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { User } from "@/types/user"
import { supabase } from "@/lib/supabase"
import { useQueryClient } from "@tanstack/react-query"
import { PermissionsTree } from "@/components/permissions/permissions-tree"

interface EditarUsuarioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: User
  onSuccess: () => void
}

export function EditarUsuarioModal({
  open,
  onOpenChange,
  usuario,
  onSuccess
}: EditarUsuarioModalProps) {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (usuario && usuario.profile) {
      setNome(usuario.profile.nome || "")
      setEmail(usuario.email || "")
      setIsAdmin(usuario.profile.adminProfile || false)
    }
  }, [usuario])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Atualiza o perfil do usuário
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          nome,
          adminProfile: isAdmin 
        })
        .eq("id", usuario.id)

      if (profileError) throw profileError

      // Atualiza o email do usuário
      const { error: userError } = await supabase.auth.admin.updateUserById(
        usuario.id,
        { email }
      )

      if (userError) throw userError

      // Inicializa as permissões baseadas no novo tipo de usuário
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: usuario.id,
          isAdmin
        })
      })

      if (!response.ok) throw new Error('Erro ao inicializar permissões')

      queryClient.invalidateQueries({ queryKey: ['users'] })
      
      toast({
        title: "Usuário atualizado com sucesso",
        variant: "default",
      })
      
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      toast({
        title: "Erro ao atualizar usuário",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="permissions">Permissões</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isAdmin">Usuário Administrador</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="permissions">
            <PermissionsTree 
              userId={usuario.id} 
              isAdmin={isAdmin}
              onSave={onSuccess}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 