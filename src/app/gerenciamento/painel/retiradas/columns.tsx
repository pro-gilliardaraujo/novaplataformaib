"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { formatDate } from "@/lib/utils"

export type Retirada = {
  id: string
  codigo_patrimonio: string
  retirado_por: string
  data_retirada: string
  frota_instalada: string
  entregue_por: string
  observacoes: string | null
  status: "Pendente" | "Devolvido"
  data_devolucao: string | null
  devolvido_por: string | null
  recebido_por: string | null
}

export const columns: ColumnDef<Retirada>[] = [
  {
    accessorKey: "codigo_patrimonio",
    header: "Código Patrimônio",
  },
  {
    accessorKey: "retirado_por",
    header: "Retirado por",
  },
  {
    accessorKey: "data_retirada",
    header: "Data de Retirada",
    cell: ({ row }) => {
      const date = row.getValue("data_retirada") as string
      return formatDate(date)
    },
  },
  {
    accessorKey: "frota_instalada",
    header: "Frota Instalada",
  },
  {
    accessorKey: "entregue_por",
    header: "Entregue por",
  },
  {
    accessorKey: "observacoes",
    header: "Observações",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as "Pendente" | "Devolvido"
      return (
        <Badge variant={status === "Pendente" ? "destructive" : "secondary"}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "data_devolucao",
    header: "Data de Devolução",
    cell: ({ row }) => {
      const date = row.getValue("data_devolucao") as string | null
      return date ? formatDate(date) : "-"
    },
  },
  {
    accessorKey: "devolvido_por",
    header: "Devolvido por",
    cell: ({ row }) => {
      const value = row.getValue("devolvido_por") as string | null
      return value || "-"
    },
  },
  {
    accessorKey: "recebido_por",
    header: "Recebido por",
    cell: ({ row }) => {
      const value = row.getValue("recebido_por") as string | null
      return value || "-"
    },
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      const retirada = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(retirada.id)}
            >
              Copiar ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
            <DropdownMenuItem>Editar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 