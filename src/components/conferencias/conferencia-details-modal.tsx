"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Conferencia, ItemConferencia } from "@/types/conferencias"
import { Button } from "@/components/ui/button"
import { X, Download } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface ConferenciaDetailsModalProps {
  conferencia: Conferencia
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (conferencia: Conferencia) => void
  onMovimentacao: (conferencia: Conferencia) => void
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
  onMovimentacao
}: ConferenciaDetailsModalProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

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
    if (typeof item.quantidade_conferida === 'string' && item.quantidade_conferida === "--") return ""
    
    // Se tem diferença, retorna vermelho para negativo e azul para positivo
    if (item.diferenca !== 0) {
      return item.diferenca < 0 ? "bg-red-50" : "bg-blue-50"
    }
    
    // Se foi conferido e não tem diferença, retorna verde
    return "bg-green-50"
  }

  const getDiferencaColor = (diferenca: number) => {
    if (diferenca === 0) return ""
    return diferenca < 0 ? "text-red-600" : "text-blue-600"
  }

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    try {
      const modalContent = document.getElementById('conferencia-details-content')
      if (!modalContent) return

      const canvas = await html2canvas(modalContent, {
        useCORS: true,
        logging: false
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (pdfWidth * canvas.height) / canvas.width

      // Adiciona o título centralizado
      pdf.setFontSize(16)
      pdf.text('Relatório de Conferência', pdfWidth / 2, 15, { align: 'center' })
      pdf.setFontSize(12)
      pdf.text(`Data: ${formatDate(conferencia.data_conferencia)}`, pdfWidth / 2, 25, { align: 'center' })

      // Adiciona a imagem do conteúdo abaixo do título
      pdf.addImage(imgData, 'PNG', 0, 35, pdfWidth, pdfHeight)

      // Download direto do PDF
      pdf.save(`conferencia_${conferencia.id}.pdf`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl p-0 flex flex-col h-[90vh]">
        <DialogHeader className="h-12 border-b relative px-4">
          <DialogTitle className="text-base font-medium absolute inset-0 flex items-center justify-center">
            Detalhes da Conferência - {formatDate(conferencia.data_conferencia)}
          </DialogTitle>
          <div className="absolute right-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              <Download className="h-4 w-4" />
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

        <div id="conferencia-details-content" className="flex-1 flex flex-col min-h-0">
          {/* Resumo */}
          <div className="px-6 py-2 border-b">
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
                    typeof item.quantidade_conferida === 'number'
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
                    typeof item.quantidade_conferida === 'string' && item.quantidade_conferida === "--"
                  ).length || 0}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">Sem Alteração</p>
                  <div className="h-3 w-3 rounded bg-green-50 border border-green-600" />
                </div>
                <p className="font-medium">
                  {conferencia.itens?.filter(item => 
                    typeof item.quantidade_conferida === 'number' &&
                    item.diferenca === 0
                  ).length || 0}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">Divergência Negativa</p>
                  <div className="h-3 w-3 rounded bg-red-50 border border-red-600" />
                </div>
                <p className="font-medium">
                  {conferencia.itens?.filter(item => 
                    item.diferenca < 0
                  ).length || 0}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">Divergência Positiva</p>
                  <div className="h-3 w-3 rounded bg-blue-50 border border-blue-600" />
                </div>
                <p className="font-medium">
                  {conferencia.itens?.filter(item => 
                    item.diferenca > 0
                  ).length || 0}
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
                          className={`h-[44px] hover:bg-gray-50/50 border-b border-gray-200 ${getRowBackground(item)}`}
                        >
                          {columns.map((column) => (
                            <TableCell 
                              key={column.key} 
                              className={`py-0 ${column.className} ${
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
  )
} 