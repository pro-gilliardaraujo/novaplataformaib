import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Movimentacao } from "@/types/movimentacoes"
import { formatDate } from "@/lib/utils"
import { MovimentacaoEstoqueModal } from "./MovimentacaoEstoqueModal"
import { useState } from "react"

interface MovimentacoesTableProps {
  movimentacoes: Movimentacao[]
  onMovimentacaoCreated: () => void
}

export function MovimentacoesTable({ movimentacoes, onMovimentacaoCreated }: MovimentacoesTableProps) {
  const [showMovimentacaoModal, setShowMovimentacaoModal] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Movimentações</h2>
        <Button onClick={() => setShowMovimentacaoModal(true)}>
          Nova Movimentação
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Observação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimentacoes.map((movimentacao) => (
              <TableRow key={movimentacao.id}>
                <TableCell>{formatDate(movimentacao.created_at)}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{movimentacao.item?.descricao}</p>
                    <p className="text-sm text-muted-foreground">
                      {movimentacao.item?.categoria?.nome}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{movimentacao.tipo_movimentacao}</TableCell>
                <TableCell>{movimentacao.quantidade}</TableCell>
                <TableCell>{movimentacao.responsavel}</TableCell>
                <TableCell>{movimentacao.observacoes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MovimentacaoEstoqueModal
        open={showMovimentacaoModal}
        onOpenChange={setShowMovimentacaoModal}
        onSuccess={onMovimentacaoCreated}
      />
    </div>
  )
} 