import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ArrowUpDown, Filter } from "lucide-react"

export interface Column<T> {
  key: keyof T | string
  title: string
  render?: (value: any) => React.ReactNode
  renderHeader?: (title: string) => React.ReactNode
}

interface Props<T> {
  data: T[]
  columns: Column<T>[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  actions?: (item: T) => React.ReactNode
}

export function DataTable<T>({ data, columns, currentPage, totalPages, onPageChange, actions }: Props<T>) {
  const startIndex = (currentPage - 1) * 15
  const endIndex = startIndex + 15
  const currentData = data.slice(startIndex, endIndex)

  return (
    <div className="flex flex-col">
      <div className="overflow-auto flex-1">
        <Table>
          <TableHeader className="bg-black sticky top-0">
            <TableRow className="h-[47px]">
              {columns.map((column) => (
                <TableHead key={column.key as string} className="text-white font-medium px-3">
                  {column.renderHeader ? column.renderHeader(column.title) : column.title}
                </TableHead>
              ))}
              {actions && <TableHead className="text-white font-medium w-[100px] px-3">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((item, index) => (
              <TableRow key={index} className="h-[47px] hover:bg-gray-50 border-b border-gray-200">
                {columns.map((column) => (
                  <TableCell key={column.key as string} className="px-3 py-0 border-x border-gray-100">
                    {column.render
                      ? column.render(item[column.key as keyof T])
                      : String(item[column.key as keyof T] ?? "")}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell className="px-3 py-0 border-x border-gray-100">
                    {actions(item)}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {/* Fill empty rows */}
            {currentData.length < 15 && (
              Array(15 - currentData.length).fill(0).map((_, index) => (
                <TableRow key={`empty-${index}`} className="h-[47px] border-b border-gray-200">
                  {Array(columns.length + (actions ? 1 : 0)).fill(0).map((_, colIndex) => (
                    <TableCell key={`empty-cell-${colIndex}`} className="px-3 py-0 border-x border-gray-100">&nbsp;</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="border-t py-2 px-3 flex items-center justify-between bg-white">
        <div className="text-sm text-gray-500">
          Mostrando {startIndex + 1} a {Math.min(startIndex + 15, data.length)} de {data.length} resultados
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
} 