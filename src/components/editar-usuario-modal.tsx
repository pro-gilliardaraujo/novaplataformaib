"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User, UpdateUsuarioData } from "@/types/user"
import { formatName } from "@/utils/formatters"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [formData, setFormData] = useState<UpdateUsuarioData>({
    nome: usuarioData.profile.nome,
    cargo: usuarioData.profile.cargo,
    adminProfile: usuarioData.profile.adminProfile,
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

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
      adminProfile: value === "admin"
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const formattedData = {
        ...formData,
        nome: formData.nome ? formatName(formData.nome) : "",
        cargo: formData.cargo ? formatName(formData.cargo) : undefined,
      }

      console.log("Enviando dados para atualização:", formattedData)
      await onUsuarioEdited(formattedData)
      
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
      setIsLoading(false)
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

        <ScrollArea className="flex-grow px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={usuarioData.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="tipo_usuario">Tipo de Usuário</Label>
                <Select
                  value={formData.adminProfile ? "admin" : "user"}
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </ScrollArea>

        <div className="border-t bg-gray-50 p-4 flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 