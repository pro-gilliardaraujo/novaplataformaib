"use client"

import { useMemo, useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Eye, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Plus, Download, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Função auxiliar para cores de status
const getStatusColor = (status: string) => {
  switch (status) {
    case "Ativo":
      return "bg-green-100 text-green-800"
    case "Inativo":
      return "bg-red-100 text-red-800"
    case "Pendente":
      return "bg-yellow-100 text-yellow-800"
    case "Concluído":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// Interface temporária - será substituída pela interface real
interface Cav {
  id: string
  numero: string
  data_criacao: string
  funcionario: string
  setor: string
  tipo: string
  status: "Ativo" | "Inativo" | "Pendente" | "Concluído"
  observacoes?: string
  criado_por: string
}

interface FilterState {
  [key: string]: Set<string>
}

interface CavListaDetalhadaProps {
  cavs?: Cav[]
  onCavEdited?: () => void
}

export function CavListaDetalhada({ cavs = [], onCavEdited = () => {} }: CavListaDetalhadaProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<FilterState>({})
  const [sorting, setSorting] = useState<{ column: string; direction: 'asc' | 'desc' | null } | null>(null)
  const [selectedCav, setSelectedCav] = useState<Cav | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cavToDelete, setCavToDelete] = useState<Cav | null>(null)
  const [cavsData, setCavsData] = useState<Cav[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const rowsPerPage = 15
  const { toast } = useToast()

  // Mock data - será substituído por dados reais
  useEffect(() => {
    const fetchCavs = async () => {
      try {
        setIsLoading(true)
        // TODO: Implementar busca real de dados
        const mockCavs: Cav[] = [
          {
            id: "1",
            numero: "CAV-001",
            data_criacao: "2024-01-15",
            funcionario: "João Silva",
            setor: "Colheita",
            tipo: "Operacional",
            status: "Ativo",
            observacoes: "CAV de teste",
            criado_por: "Admin"
          },
          {
            id: "2",
            numero: "CAV-002",
            data_criacao: "2024-01-14",
            funcionario: "Maria Santos",
            setor: "Transbordo",
            tipo: "Segurança",
            status: "Concluído",
            observacoes: "",
            criado_por: "Supervisor"
          },
          {
            id: "3",
            numero: "CAV-003",
            data_criacao: "2024-01-16",
            funcionario: "Pedro Costa",
            setor: "Plantio",
            tipo: "Qualidade",
            status: "Pendente",
            observacoes: "Aguardando aprovação",
            criado_por: "Analista"
          }
        ]
        setCavsData(mockCavs)
      } catch (error) {
        console.error("Erro ao buscar CAVs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCavs()
  }, [])

  const columns = [
    { key: "numero", title: "Número" },
    { key: "data_criacao", title: "Data" },
    { key: "funcionario", title: "Funcionário" },
    { key: "setor", title: "Setor" },
    { key: "tipo", title: "Tipo" },
    { key: "status", title: "Status" },
    { key: "criado_por", title: "Criado por" }
  ] as const

  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        if (column.key === "data_criacao") {
          acc[column.key] = Array.from(
            new Set(
              cavsData.map((item) => {
                const [year, month, day] = item.data_criacao.split("-")
                return `${day}/${month}/${year}`
              }),
            ),
          ).filter((value): value is string => typeof value === "string")
        } else {
          acc[column.key] = Array.from(
            new Set(
              cavsData
                .map((item) => item[column.key as keyof Cav])
                .filter((value): value is string => typeof value === "string"),
            ),
          )
        }
        return acc
      },
      {} as Record<string, string[]>,
    )
  }, [cavsData])

  const filteredData = useMemo(() => {
    return cavsData.filter((row) =>
      Object.entries(filters).every(([key, selectedOptions]) => {
        if (selectedOptions.size === 0) return true
        if (key === "data_criacao") {
          const [year, month, day] = row.data_criacao.split("-")
          const formattedDate = `${day}/${month}/${year}`
          return selectedOptions.has(formattedDate)
        }
        const value = row[key as keyof Cav]
        return typeof value === "string" && selectedOptions.has(value)
      }),
    )
  }, [cavsData, filters])

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-")
    return `${day}/${month}/${year}`
  }

  const handleFilterToggle = (columnKey: string, option: string) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters }
      const columnFilters = newFilters[columnKey] ? new Set(newFilters[columnKey]) : new Set<string>()

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
    setFilters((prev) => ({
      ...prev,
      [columnKey]: new Set<string>(),
    }))
  }

  const handleExport = () => {
    const BOM = '\uFEFF'
    
    const escapeCsvCell = (cell: string | number) => {
      cell = String(cell).replace(/"/g, '""')
      return /[;\n"]/.test(cell) ? `"${cell}"` : cell
    }

    const headers = {
      numero: 'Número',
      funcionario: 'Funcionário',
      setor: 'Setor',
      data_criacao: 'Data',
      tipo: 'Tipo',
      status: 'Status',
      observacoes: 'Observações',
      criado_por: 'Criado por'
    }

    const csvRows = [
      Object.values(headers).join(';'),
      
      ...filteredData.map(cav => [
        escapeCsvCell(cav.numero),
        escapeCsvCell(cav.funcionario),
        escapeCsvCell(cav.setor),
        escapeCsvCell(format(new Date(cav.data_criacao), "dd/MM/yyyy", { locale: ptBR })),
        escapeCsvCell(cav.tipo),
        escapeCsvCell(cav.status),
        escapeCsvCell(cav.observacoes || ''),
        escapeCsvCell(cav.criado_por)
      ].join(';'))
    ].join('\r\n')

    const blob = new Blob([BOM + csvRows], { 
      type: 'text/csv;charset=utf-8' 
    })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `cavs_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSort = (columnKey: string) => {
    setSorting(current => ({
      column: columnKey,
      direction: current?.column === columnKey && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const filteredAndSortedData = useMemo(() => {
    return filteredData
      .filter(item => {
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          return (
            item.numero.toLowerCase().includes(searchLower) ||
            item.funcionario.toLowerCase().includes(searchLower) ||
            item.setor.toLowerCase().includes(searchLower) ||
            item.tipo.toLowerCase().includes(searchLower)
          )
        }
        return true
      })
      .sort((a, b) => {
        if (!sorting || !sorting.direction) return 0
        const column = sorting.column as keyof Cav
        let valueA: string | number = a[column] as string
        let valueB: string | number = b[column] as string

        if (column === 'data_criacao') {
          valueA = new Date(valueA).getTime()
          valueB = new Date(valueB).getTime()
        }

        if (valueA === valueB) return 0
        if (valueA === null || valueA === undefined) return 1
        if (valueB === null || valueB === undefined) return -1

        const result = valueA < valueB ? -1 : 1
        return sorting.direction === 'asc' ? result : -result
      })
  }, [filteredData, searchTerm, sorting])

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage)

  const handleDelete = async () => {
    if (!cavToDelete) return

    try {
      // TODO: Implementar exclusão real
      toast({
        title: "Sucesso",
        description: "CAV excluído com sucesso!"
      })
      onCavEdited()
    } catch (error) {
      console.error("Erro ao excluir CAV:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o CAV.",
        variant: "destructive"
      })
    } finally {
      setCavToDelete(null)
    }
  }



  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Carregando CAVs...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="w-[400px]">
          <Input
            placeholder="Buscar por número, funcionário ou setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-black hover:bg-black/90 text-white h-9"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo CAV
          </Button>
          <Button variant="outline" className="h-9" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 border rounded-lg flex flex-col min-h-0 overflow-hidden">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-black sticky top-0">
              <TableRow className="h-[47px]">
                {columns.map((column) => (
                  <TableHead key={column.key} className="text-white font-medium px-3">
                    <div className="flex items-center gap-1">
                      <div 
                        className="flex items-center gap-1 cursor-pointer"
                        onClick={() => handleSort(column.key)}
                      >
                        <span>{column.title}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-7 w-7 p-0 hover:bg-transparent ${
                            sorting?.column === column.key ? 'text-white' : 'text-gray-400'
                          }`}
                        >
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <FilterDropdown
                        title={column.title}
                        options={filterOptions[column.key] ?? []}
                        selectedOptions={filters[column.key] ?? new Set()}
                        onOptionToggle={(option) => handleFilterToggle(column.key, option)}
                        onClear={() => handleClearFilter(column.key)}
                      />
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-white font-medium w-[100px] px-3">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((cav) => (
                <TableRow key={cav.id} className="h-[47px] hover:bg-gray-50 border-b border-gray-200">
                  <TableCell className="px-3 py-0 border-x border-gray-100">{cav.numero}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100">{formatDate(cav.data_criacao)}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100">{cav.funcionario}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100">{cav.setor}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100">{cav.tipo}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100">
                    <Badge className={getStatusColor(cav.status)}>
                      {cav.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100">{cav.criado_por}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setSelectedCav(cav)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => setCavToDelete(cav)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {/* Fill empty rows */}
              {paginatedData.length < rowsPerPage && (
                Array(rowsPerPage - paginatedData.length).fill(0).map((_, index) => (
                  <TableRow key={`empty-${index}`} className="h-[47px] border-b border-gray-200">
                    {Array(columns.length + 1).fill(0).map((_, colIndex) => (
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
            Mostrando {startIndex + 1} a {Math.min(startIndex + rowsPerPage, filteredAndSortedData.length)} de {filteredAndSortedData.length} resultados
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={!!cavToDelete} onOpenChange={(open) => !open && setCavToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir CAV</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este CAV? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de detalhes do CAV */}
      {selectedCav && (
        <CavDetailsModal
          open={!!selectedCav}
          onOpenChange={(open) => !open && setSelectedCav(null)}
          cav={selectedCav}
          onCavEdited={onCavEdited}
        />
      )}

      {/* Modal de novo CAV */}
      <NovoCavModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCavAdded={onCavEdited}
      />
    </div>
  )
}

// Componente de filtro dropdown
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
  const [searchTerm, setSearchTerm] = useState("")
  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DropdownMenu modal={true}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Filter className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-4" side="bottom" sideOffset={5}>
        <div className="space-y-4">
          <h4 className="font-medium">Filtrar {title.toLowerCase()}</h4>
          <Input 
            placeholder={`Buscar ${title.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="space-y-2 max-h-48 overflow-auto">
            {filteredOptions.map((option) => (
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

// Modal de detalhes - placeholder
function CavDetailsModal({
  open,
  onOpenChange,
  cav,
  onCavEdited
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cav: Cav
  onCavEdited: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Detalhes do CAV - {cav.numero}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Funcionário:</strong> {cav.funcionario}
                </div>
                <div>
                  <strong>Setor:</strong> {cav.setor}
                </div>
                <div>
                  <strong>Tipo:</strong> {cav.tipo}
                </div>
                <div>
                  <strong>Status:</strong> <Badge className={getStatusColor(cav.status)}>{cav.status}</Badge>
                </div>
                <div>
                  <strong>Data:</strong> {formatDate(cav.data_criacao)}
                </div>
                <div>
                  <strong>Criado por:</strong> {cav.criado_por}
                </div>
              </div>
              {cav.observacoes && (
                <div>
                  <strong>Observações:</strong>
                  <p className="mt-1">{cav.observacoes}</p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Fechar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Modal de novo CAV - placeholder
function NovoCavModal({
  open,
  onOpenChange,
  onCavAdded
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCavAdded: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Novo CAV</AlertDialogTitle>
          <AlertDialogDescription>
            Modal de criação de novo CAV será implementado aqui.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            onCavAdded()
            onOpenChange(false)
          }}>
            Criar CAV
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}