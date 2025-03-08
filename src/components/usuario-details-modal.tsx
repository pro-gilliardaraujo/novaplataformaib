"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { X } from "lucide-react"
import { User } from "@/types/user"

interface UsuarioDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: User
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="text-lg font-semibold mb-2 text-center">{title}</h3>
}

export function UsuarioDetailsModal({
  open,
  onOpenChange,
  usuario,
}: UsuarioDetailsModalProps) {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <div className="flex items-center px-4 h-12 border-b relative">
          <div className="flex-1 text-center">
            <span className="text-base font-medium">Detalhes do Usuário</span>
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

        <div className="px-6 py-4 space-y-6 flex-grow overflow-auto">
          <div>
            <SectionTitle title="Informações do Usuário" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DetailItem label="Nome" value={usuario.profile.nome} />
              <DetailItem label="Email" value={usuario.email} />
              <DetailItem label="Cargo" value={usuario.profile.cargo || "—"} />
              <DetailItem label="Tipo de Perfil" value={usuario.profile.adminProfile} />
              <DetailItem label="Criado em" value={formatDate(usuario.created_at)} />
              <DetailItem label="Último Acesso" value={formatDate(usuario.profile.ultimo_acesso)} />
            </div>
          </div>

          <Separator />

          <div>
            <SectionTitle title="Status da Conta" />
            <div className="grid grid-cols-2 gap-4">
              <DetailItem 
                label="Status do Email" 
                value={usuario.email_confirmed_at ? "Confirmado" : "Pendente"} 
              />
              <DetailItem 
                label="Primeiro Acesso" 
                value={usuario.profile.firstLogin ? "Pendente" : "Realizado"} 
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 