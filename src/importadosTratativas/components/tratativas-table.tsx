"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Eye, Filter, Pencil } from "lucide-react"
import TratativaDetailsModal from "./tratativa-details-modal"
import { EditarTratativaModal } from "./editar-tratativa-modal"
import { createClient } from "@supabase/supabase-js"
import { NovaTratativaModal } from "@/components/nova-tratativa-modal"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Tratativa {
  id: string
  numero_tratativa: string
  funcionario: string
  data_infracao: string
  hora_infracao: string
  codigo_infracao: string
  descricao_infracao: string
  penalidade: string
  lider: string
  status: string
  created_at: string
  texto_infracao: string
  texto_limite: string
  url_documento_enviado: string
  url_documento_devolvido: string | null
  data_devolvida: string | null
  funcao: string
  setor: string
  medida: string
  valor_praticado: string
  mock: boolean
}

type FilterState = Record<string, Set<string>>

function FilterDropdown({
  title,
  options,
  selectedOptions,
  onOptionToggle,
  onClear,
}: {
  title: string
  options: string[]
  selectedOptions: Set<string>
  onOptionToggle: (option: string) => void
  onClear: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/10 hover:text-white">
          <Filter className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <h4 className="font-medium">Filtrar {title.toLowerCase()}</h4>
          <Input placeholder={`Buscar ${title.toLowerCase()}...`} />
          <div className="space-y-2 max-h-48 overflow-auto">
            {options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={selectedOptions.has(option)}
                  onCheckedChange={() => onOptionToggle(option)}
                />
                <label htmlFor={option} className="text-sm">
                  {option}
                </label>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={onClear}>
              Limpar
            </Button>
            <span className="text-sm text-muted-foreground">{selectedOptions.size} selecionados</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TratativasTable() {
  const [tratativas, setTratativas] = useState<Tratativa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({})
  const [selectedTratativa, setSelectedTratativa] = useState<Tratativa | null>(null)
  const [isNovaTratativaModalOpen, setIsNovaTratativaModalOpen] = useState(false)
  const [lastDocumentNumber, setLastDocumentNumber] = useState("0000")
  const [selectedTratativaForEdit, setSelectedTratativaForEdit] = useState<Tratativa | null>(null)

  const columns = [
    { key: "numero_tratativa", title: "Tratativa" },
    { key: "data_infracao", title: "Data" },
    { key: "funcionario", title: "Funcionário" },
    { key: "setor", title: "Setor" },
    { key: "lider", title: "Líder" },
    { key: "penalidade", title: "Penalidade" },
    { key: "status", title: "Situação" },
  ]

  useEffect(() => {
    const fetchLastDocumentNumber = async () => {
      try {
        const { data, error } = await supabase
          .from("tratativas")
          .select("numero_tratativa")
          .order("created_at", { ascending: false })
          .limit(1)

        if (error) throw error

        if (data && data.length > 0) {
          setLastDocumentNumber(data[0].numero_tratativa)
        }
      } catch (error) {
        console.error("Erro ao buscar o último número de documento:", error)
      }
    }

    fetchLastDocumentNumber()
  }, [])

  const fetchTratativas = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("tratativas").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setTratativas(data)
      setFilters(
        columns.reduce((acc, column) => {
          acc[column.key] = new Set()
          return acc
        }, {} as FilterState),
      )
    } catch (err) {
      console.error("Error fetching tratativas:", err)
      setError(err instanceof Error ? err.message : "An error occurred while fetching tratativas")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTratativas()
  }, [fetchTratativas])

  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        if (column.key === "data_infracao") {
          // Formata as datas para o filtro
          acc[column.key] = Array.from(
            new Set(
              tratativas.map((item) => {
                const [year, month, day] = item.data_infracao.split("-")
                return `${day}/${month}/${year}`
              }),
            ),
          )
        } else {
          acc[column.key] = Array.from(new Set(tratativas.map((item) => item[column.key as keyof Tratativa])))
        }
        return acc
      },
      {} as Record<string, string[]>,
    )
  }, [tratativas])

  const filteredData = useMemo(() => {
    return tratativas.filter((row) =>
      Object.entries(filters).every(([key, selectedOptions]) => {
        if (selectedOptions.size === 0) return true
        if (key === "data_infracao") {
          const [year, month, day] = row.data_infracao.split("-")
          const formattedDate = `${day}/${month}/${year}`
          return selectedOptions.has(formattedDate)
        }
        return selectedOptions.has(row[key as keyof Tratativa])
      }),
    )
  }, [tratativas, filters])

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-")
    return `${day}/${month}/${year}`
  }

  const handleEditClick = (tratativa: Tratativa) => {
    setSelectedTratativaForEdit(tratativa)
  }

  const handleTratativaEdited = () => {
    fetchTratativas()
    setSelectedTratativaForEdit(null)
  }

  const handleFilterToggle = (columnKey: string, option: string) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters }
      const columnFilters = newFilters[columnKey] ? new Set(newFilters[columnKey]) : new Set()

      if (columnFilters.has(option)) {
        columnFilters.delete(option)
      } else {
        columnFilters.add(option)
      }

      newFilters[columnKey] = columnFilters
      return newFilters
    })
  }

  const handleClearFilter = (columnKey: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [columnKey]: new Set(),
    }))
  }

  if (isLoading) {
    return <div className="p-6">Carregando tratativas...</div>
  }

  if (error) {
    return <div className="p-6 text-red-500">Erro: {error}</div>
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader className="bg-black">
          <TableRow className="h-10">
            {columns.map((column) => (
              <TableHead key={column.key} className="text-white font-medium py-2">
                <div className="flex items-center justify-between">
                  <span>{column.title}</span>
                  <FilterDropdown
                    title={column.title}
                    options={filterOptions[column.key]}
                    selectedOptions={filters[column.key]}
                    onOptionToggle={(option) => handleFilterToggle(column.key, option)}
                    onClear={() => handleClearFilter(column.key)}
                  />
                </div>
              </TableHead>
            ))}
            <TableHead className="text-white font-medium text-right py-2">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((row) => (
            <TableRow key={row.id} className="h-12">
              {columns.map((column) => (
                <TableCell key={column.key}>
                  {column.key === "data_infracao" ? formatDate(row.data_infracao) : row[column.key as keyof Tratativa]}
                </TableCell>
              ))}
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedTratativa(row)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(row)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-4 py-2 border-t">
        <p className="text-sm text-gray-500">
          Mostrando 1 a {filteredData.length} de {filteredData.length} resultados
        </p>
        {filteredData.length > 10 && (
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled className="border rounded px-4 py-2">
              Anterior
            </Button>
            <Button variant="outline" size="sm" className="border rounded px-4 py-2">
              Próximo
            </Button>
          </div>
        )}
      </div>
      {selectedTratativa && (
        <TratativaDetailsModal
          open={!!selectedTratativa}
          onOpenChange={(open) => !open && setSelectedTratativa(null)}
          tratativa={selectedTratativa}
        />
      )}
      {selectedTratativaForEdit && (
        <EditarTratativaModal
          open={!!selectedTratativaForEdit}
          onOpenChange={(open) => !open && setSelectedTratativaForEdit(null)}
          onTratativaEdited={handleTratativaEdited}
          tratativaData={selectedTratativaForEdit}
        />
      )}
      <NovaTratativaModal
        open={isNovaTratativaModalOpen}
        onOpenChange={setIsNovaTratativaModalOpen}
        onTratativaAdded={fetchTratativas}
        lastDocumentNumber={lastDocumentNumber}
        mockData={null}
      />
    </div>
  )
}

