import type React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FilterBarProps {
  filters: {
    setor: string
    status: string
  }
  setFilters: React.Dispatch<React.SetStateAction<{ setor: string; status: string }>>
  setores: string[]
  statusOptions: string[]
}

export function FilterBar({ filters, setFilters, setores, statusOptions }: FilterBarProps) {
  return (
    <div className="flex space-x-4 mb-4">
      <Select value={filters.setor} onValueChange={(value) => setFilters((prev) => ({ ...prev, setor: value }))}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrar por Setor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Setores</SelectItem>
          {setores.map((setor) => (
            <SelectItem key={setor} value={setor}>
              {setor}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrar por Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Status</SelectItem>
          {statusOptions.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

