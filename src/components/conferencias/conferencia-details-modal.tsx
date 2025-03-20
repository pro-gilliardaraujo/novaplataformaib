"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Conferencia, ItemConferencia } from "@/types/conferencias"

interface ConferenciaDetailsModalProps {
  conferencia: Conferencia
  open: boolean
  onOpenChange: (open: boolean) => void
}

const columns = [
  {
    key: "codigo_patrimonio",
    title: "Código",
    getValue: (item: ItemConferencia) => item.codigo_patrimonio
  },
  {
    key: "descricao",
    title: "Descrição",
    getValue: (item: ItemConferencia) => item.descricao
  },
  {
    key: "quantidade_sistema",
    title: "Qtd. Sistema",
    getValue: (item: ItemConferencia) => item.quantidade_sistema.toString()
  },
  {
    key: "quantidade_conferida",
    title: "Qtd. Conferida",
    getValue: (item: ItemConferencia) => item.quantidade_conferida.toString()
  },
  {
    key: "diferenca",
    title: "Diferença",
    getValue: (item: ItemConferencia) => {
      const diferenca = item.diferenca
      if (diferenca === 0) return "0"
      return diferenca > 0 ? `+${diferenca}` : diferenca.toString()
    }
  }
]

export function ConferenciaDetailsModal({ conferencia, open, onOpenChange }: ConferenciaDetailsModalProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR")
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Conferência</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabeçalho com informações gerais */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Data da Conferência</p>
              <p className="font-medium">{formatDate(conferencia.data_conferencia)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge className={getStatusColor(conferencia.status)}>
                {getStatusText(conferencia.status)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Itens</p>
              <p className="font-medium">{conferencia.total_itens}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Itens Divergentes</p>
              <p className="font-medium">{conferencia.itens_divergentes}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Responsáveis</p>
              <p className="font-medium">{conferencia.responsaveis}</p>
            </div>
          </div>

          {/* Tabela de itens */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader className="bg-black">
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.key} className="text-white font-medium h-[49px]">
                      {column.title}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {conferencia.itens?.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className={`h-[49px] hover:bg-gray-50 border-b border-gray-200 ${
                      item.diferenca !== 0 ? "bg-red-50" : ""
                    }`}
                  >
                    {columns.map((column) => (
                      <TableCell 
                        key={column.key} 
                        className={`py-0 ${
                          column.key === "diferenca" && item.diferenca !== 0 
                            ? item.diferenca > 0 
                              ? "text-green-600" 
                              : "text-red-600"
                            : ""
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
      </DialogContent>
    </Dialog>
  )
} 