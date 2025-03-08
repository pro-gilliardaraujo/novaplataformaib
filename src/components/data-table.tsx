import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { FilterDropdown } from "./filter-dropdown"

export interface Column<T> {
  key: keyof T
  title: string
  render?: (value: T[keyof T], item: T) => React.ReactNode
}

interface FilterState {
  [key: string]: Set<string>
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  actions?: (item: T) => React.ReactNode
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  rowsPerPage?: number
  filters?: {
    [key: string]: Set<string>
  }
  filterOptions?: {
    [key: string]: string[]
  }
  onFilterToggle?: (columnKey: string, option: string) => void
  onFilterClear?: (columnKey: string) => void
}

export function DataTable<T>({
  data,
  columns,
  actions,
  currentPage,
  totalPages,
  onPageChange,
  rowsPerPage = 15,
  filters = {},
  filterOptions = {},
  onFilterToggle,
  onFilterClear
}: DataTableProps<T>) {
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, data.length)
  const paginatedData = data.slice(startIndex, endIndex)

  return (
    <div className="border border-gray-200 rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-black hover:bg-black">
            {columns.map((column) => (
              <TableHead key={String(column.key)} className="text-white font-medium h-12">
                <div className="flex items-center justify-between">
                  <span>{column.title}</span>
                  {onFilterToggle && onFilterClear && filterOptions[String(column.key)] && (
                    <FilterDropdown
                      title={column.title}
                      options={filterOptions[String(column.key)] || []}
                      selectedOptions={filters[String(column.key)] || new Set()}
                      onOptionToggle={(option) => onFilterToggle(String(column.key), option)}
                      onClear={() => onFilterClear(String(column.key))}
                    />
                  )}
                </div>
              </TableHead>
            ))}
            {actions && (
              <TableHead className="text-white font-medium h-12">Ações</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((item, index) => (
            <TableRow key={index} className="h-[49px] hover:bg-gray-50 border-b border-gray-200">
              {columns.map((column) => (
                <TableCell key={String(column.key)} className="py-0">
                  {column.render 
                    ? column.render(item[column.key], item)
                    : String(item[column.key] ?? '')}
                </TableCell>
              ))}
              {actions && (
                <TableCell className="py-0 whitespace-nowrap">
                  {actions(item)}
                </TableCell>
              )}
            </TableRow>
          ))}
          {/* Fill empty rows to maintain fixed height */}
          {paginatedData.length < rowsPerPage && (
            Array(rowsPerPage - paginatedData.length).fill(0).map((_, index) => (
              <TableRow key={`empty-${index}`} className="h-[49px] border-b border-gray-200">
                {Array(columns.length + (actions ? 1 : 0)).fill(0).map((_, colIndex) => (
                  <TableCell key={`empty-cell-${colIndex}`} className="py-0">&nbsp;</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination controls */}
      <div className="border-t flex items-center justify-between bg-white px-6 py-2">
        <div className="text-sm text-gray-500">
          Mostrando {data.length > 0 ? startIndex + 1 : 0} a {endIndex} de {data.length} resultados
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Página {currentPage} de {Math.max(1, totalPages)}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 