"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Conferencia, ItemConferencia } from "@/types/conferencias"
import { Button } from "@/components/ui/button"
import { X, Pencil, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface ConferenciaDetailsModalProps {
  conferencia: Conferencia
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (conferencia: Conferencia) => void
  onDelete: (conferencia: Conferencia) => Promise<void>
}

const columns = [
  {
    key: "codigo_patrimonio",
    title: "Código",
    className: "w-40 border-x",
    getValue: (item: ItemConferencia) => item.codigo_patrimonio
  },
  {
    key: "descricao",
    title: "Descrição",
    className: "w-[350px] border-r",
    getValue: (item: ItemConferencia) => item.descricao
  },
  {
    key: "quantidade_sistema",
    title: "Qtd. Sistema",
    className: "w-28 text-center border-r",
    getValue: (item: ItemConferencia) => item.quantidade_sistema.toString()
  },
  {
    key: "quantidade_conferida",
    title: "Qtd. Conferida",
    className: "w-28 border-r",
    getValue: (item: ItemConferencia) => item.quantidade_conferida.toString()
  },
  {
    key: "diferenca",
    title: "Diferença",
    className: "w-24 text-center border-r",
    getValue: (item: ItemConferencia) => {
      const diferenca = item.diferenca
      if (diferenca === 0) return "0"
      return diferenca > 0 ? `+${diferenca}` : diferenca.toString()
    }
  }
]

export function ConferenciaDetailsModal({ 
  conferencia, 
  open, 
  onOpenChange,
  onEdit,
  onDelete
}: ConferenciaDetailsModalProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getStatusColor = (status: Conferencia["status"]) => {
    const statusColors = {
      em_andamento: "bg-yellow-500",
      concluida: "bg-green-500",
      cancelada: "bg-red-500"
    }
    return statusColors[status]
  }

  const getStatusText = (status: Conferencia["status"]) => {
    const statusMap = {
      em_andamento: "Em Andamento",
      concluida: "Concluída",
      cancelada: "Cancelada"
    }
    return statusMap[status]
  }

  const getRowBackground = (item: ItemConferencia) => {
    // Se não foi conferido (quantidade_conferida é "--"), retorna branco
    if (item.quantidade_conferida === "--") return ""
    
    // Se tem diferença, retorna vermelho para negativo e azul para positivo
    if (item.diferenca !== 0) {
      return item.diferenca < 0 ? "bg-red-50" : "bg-blue-50"
    }
    
    // Se foi conferido e não tem diferença, retorna verde
    return "bg-green-50"
  }

  const getDiferencaColor = (diferenca: number) => {
    if (diferenca === 0) return "text-green-600"
    return diferenca < 0 ? "text-red-600" : "text-blue-600"
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await onDelete(conferencia)
      setShowDeleteDialog(false)
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao excluir conferência:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl p-0 flex flex-col h-[90vh]">
          <DialogHeader className="h-12 border-b relative px-4">
            <DialogTitle className="text-base font-medium absolute inset-0 flex items-center justify-center">
              Detalhes da Conferência - {formatDate(conferencia.data_conferencia)}
            </DialogTitle>
            <div className="absolute right-4 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onEdit(conferencia)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <DialogClose asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0">
            {/* Resumo */}
            <div className="px-6 py-4 border-b">
              <div className="grid grid-cols-7 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">Total de Itens</p>
                  </div>
                  <p className="font-medium">{conferencia.total_itens}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">Conferidos</p>
                  </div>
                  <p className="font-medium">
                    {conferencia.itens?.filter(item => 
                      item.quantidade_conferida !== "--"
                    ).length || 0}/{conferencia.total_itens}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">Não Conferidos</p>
                    <div className="h-3 w-3 rounded bg-white border border-gray-300" />
                  </div>
                  <p className="font-medium">
                    {conferencia.itens?.filter(item => 
                      item.quantidade_conferida === "--"
                    ).length || 0}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">Divergentes</p>
                    <div className="h-3 w-3 rounded bg-red-500" />
                  </div>
                  <p className="font-medium">
                    {conferencia.itens?.filter(item => 
                      item.quantidade_conferida !== "--" &&
                      item.diferenca !== 0
                    ).length || 0}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">Responsáveis</p>
                  </div>
                  <p className="font-medium truncate">
                    {conferencia.responsaveis}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">Status</p>
                  </div>
                  <Badge className={getStatusColor(conferencia.status)}>
                    {getStatusText(conferencia.status)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Tabela de Itens */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader className="bg-black">
                        <TableRow>
                          {columns.map((column) => (
                            <TableHead key={column.key} className={`text-white font-medium h-10 ${column.className}`}>
                              {column.title}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conferencia.itens?.map((item) => (
                          <TableRow 
                            key={item.id} 
                            className={cn(
                              "h-12 hover:bg-gray-50/50",
                              getRowBackground(item)
                            )}
                          >
                            {columns.map((column) => (
                              <TableCell 
                                key={column.key} 
                                className={`py-1 ${column.className} ${
                                  column.key === "diferenca" ? getDiferencaColor(item.diferenca) : ""
                                }`}
                              >
                                {column.getValue(item)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conferência</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta conferência? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 