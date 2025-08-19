"use client"

import { useMemo, useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Eye, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Plus, Download } from "lucide-react"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { NovoCavModal } from "./novo-cav-modal"
import { supabase } from "@/lib/supabase"

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

// Interface real baseada na tabela boletins_cav_agregado
interface CavAgregado {
  id: number
  data: string // YYYY-MM-DD
  codigo: string
  frente: string
  setor?: string // GUA, MOE, ALE
  total_producao: number
  total_viagens_feitas: number
  total_viagens_orcadas: number
  dif_viagens_perc: number
  lamina_alvo: number
  lamina_aplicada: number
  dif_lamina_perc: number
  created_at: string
  updated_at: string
}

// Interface para boletins individuais
interface BoletimCav {
  id: number
  data: string
  codigo: string
  frente: string
  setor?: string // GUA, MOE, ALE
  frota: number
  turno: string
  operador: string
  producao: number
  observacoes?: string
  created_at: string
  updated_at: string
}

interface FilterState {
  [key: string]: Set<string>
}

interface CavListaDetalhadaProps {
  onCavAdded?: () => void
}

export function CavListaDetalhada({ onCavAdded }: CavListaDetalhadaProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<FilterState>({})
  const [sorting, setSorting] = useState<{ column: string; direction: 'asc' | 'desc' | null } | null>(null)
  const [selectedCav, setSelectedCav] = useState<CavAgregado | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [cavsData, setCavsData] = useState<CavAgregado[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const rowsPerPage = 15
  const { toast } = useToast()

  // Buscar dados reais do Supabase
  const fetchCavs = async () => {
      try {
        setIsLoading(true)
      
      const { data, error } = await supabase
        .from('boletins_cav_agregado')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Erro ao buscar dados CAV:', error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados CAV. Tente novamente.",
          variant: "destructive",
        })
        return
      }
      
      setCavsData(data || [])
      } catch (error) {
      console.error('Erro na busca de dados CAV:', error)
      toast({
        title: "Erro de conexão",
        description: "Erro ao conectar com o banco de dados.",
        variant: "destructive",
      })
      } finally {
        setIsLoading(false)
      }
    }

  useEffect(() => {
    fetchCavs()
  }, [])

  // Callback para atualizar lista quando novo CAV é adicionado
  const handleCavAdded = () => {
    fetchCavs()
    if (onCavAdded) {
      onCavAdded()
    }
  }

  const columns = [
    { key: "data", title: "Data" },
    { key: "codigo", title: "Código" },
    { key: "frente", title: "Frente" },
    { key: "total_producao", title: "Produção (ha)" },
    { key: "total_viagens_feitas", title: "Viagens" },
    { key: "lamina_alvo", title: "Lâmina Alvo (m³)" },
    { key: "dif_lamina_perc", title: "Dif. Lâmina (%)" }
  ] as const

  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        if (column.key === "data") {
          acc[column.key] = Array.from(
            new Set(
              cavsData.map((item) => {
                const [year, month, day] = item.data.split("-")
                return `${day}/${month}/${year}`
              }),
            ),
          ).filter((value): value is string => typeof value === "string")
        } else {
          acc[column.key] = Array.from(
            new Set(
              cavsData
                .map((item) => item[column.key as keyof CavAgregado])
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
        if (key === "data") {
          const [year, month, day] = row.data.split("-")
          const formattedDate = `${day}/${month}/${year}`
          return selectedOptions.has(formattedDate)
        }
        const value = row[key as keyof CavAgregado]
        return typeof value === "string" && selectedOptions.has(value)
      }),
    )
  }, [cavsData, filters])



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
      data: 'Data',
      codigo: 'Código',
      frente: 'Frente',
      total_producao: 'Produção (ha)',
      total_viagens_feitas: 'Viagens Feitas',
      total_viagens_orcadas: 'Viagens Orçadas',
      dif_viagens_perc: 'Dif. Viagens (%)',
      lamina_alvo: 'Lâmina Alvo (m³)',
      lamina_aplicada: 'Lâmina Aplicada (m³)',
      dif_lamina_perc: 'Dif. Lâmina (%)'
    }

    const csvRows = [
      Object.values(headers).join(';'),
      
      ...filteredData.map(cav => [
        escapeCsvCell(format(new Date(cav.data + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })),
        escapeCsvCell(cav.codigo),
        escapeCsvCell(cav.frente),
        escapeCsvCell(cav.total_producao.toFixed(2)),
        escapeCsvCell(cav.total_viagens_feitas.toFixed(0)),
        escapeCsvCell(cav.total_viagens_orcadas.toFixed(1)),
        escapeCsvCell(cav.dif_viagens_perc.toFixed(1) + '%'),
        escapeCsvCell(cav.lamina_alvo.toFixed(1)),
        escapeCsvCell(cav.lamina_aplicada.toFixed(2)),
        escapeCsvCell(cav.dif_lamina_perc.toFixed(1) + '%')
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
            item.codigo.toLowerCase().includes(searchLower) ||
            item.frente.toLowerCase().includes(searchLower) ||
            item.data.includes(searchLower) ||
            item.total_producao.toString().includes(searchLower)
          )
        }
        return true
      })
      .sort((a, b) => {
        if (!sorting || !sorting.direction) return 0
        const column = sorting.column as keyof CavAgregado
        let valueA: string | number = a[column] as string
        let valueB: string | number = b[column] as string

        if (column === 'data' || column === 'created_at') {
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
            <Plus className="mr-2 h-4 w-4" /> Novo Boletim
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
                                                      <TableCell className="px-3 py-0 border-x border-gray-100">{format(new Date(cav.data + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100">{cav.codigo}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100">{cav.frente}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100 text-right">{cav.total_producao.toFixed(2)}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100 text-right">{cav.total_viagens_feitas.toFixed(0)}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100 text-right">{cav.lamina_alvo.toFixed(1)}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100 text-right">
                    <span className={cav.dif_lamina_perc > 0 ? "text-red-600" : "text-green-600"}>
                      {cav.dif_lamina_perc.toFixed(1)}%
                    </span>
                    </TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100">
                    <div className="flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setSelectedCav(cav)}
                      >
                        <Eye className="h-4 w-4" />
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



      {/* Modal de detalhes do CAV */}
      {selectedCav && (
        <CavDetailsModal
          open={!!selectedCav}
          onOpenChange={(open) => !open && setSelectedCav(null)}
          cav={selectedCav}
        />
      )}

      {/* Modal de novo CAV */}
      <NovoCavModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCavAdded={handleCavAdded}
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
// Componente de título de seção (mesmo padrão das tratativas)
function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center mb-4">
      <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
    </div>
  )
}

// Componente de item de detalhe (mesmo padrão das tratativas)
function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <div className="text-sm text-gray-900">{value}</div>
        </div>
  )
}

function CavDetailsModal({
  open,
  onOpenChange,
  cav
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cav: CavAgregado
}) {
  const [boletinsIndividuais, setBoletinsIndividuais] = useState<BoletimCav[]>([])
  const [isLoadingDetalhes, setIsLoadingDetalhes] = useState(false)

  // Buscar boletins individuais quando o modal abrir
  useEffect(() => {
    if (open) {
      fetchBoletinsIndividuais()
    }
  }, [open, cav.data, cav.frente, cav.codigo])

  const fetchBoletinsIndividuais = async () => {
    try {
      setIsLoadingDetalhes(true)
      
      const { data, error } = await supabase
        .from('boletins_cav')
        .select('*')
        .eq('data', cav.data)
        .eq('frente', cav.frente)
        .eq('codigo', cav.codigo)
        .order('frota', { ascending: true })
        .order('turno', { ascending: true })
      
      if (error) {
        console.error('Erro ao buscar boletins individuais:', error)
        return
      }
      
      setBoletinsIndividuais(data || [])
    } catch (error) {
      console.error('Erro na busca de boletins individuais:', error)
    } finally {
      setIsLoadingDetalhes(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <div className="flex items-center px-4 h-12 border-b relative">
          <div className="flex-1 text-center">
            <span className="text-base font-medium">
              Detalhes {cav.frente} {format(new Date(cav.data + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })} - {cav.codigo}
            </span>
          </div>
          <Button 
            variant="outline"
            className="h-8 w-8 p-0 absolute right-2 top-2"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
        </Button>
      </div>

        <div className="px-8 space-y-2 flex-grow overflow-auto">
          <div>
            <SectionTitle title="Identificação" />
            <div className="grid grid-cols-4 gap-3">
              <DetailItem label="Código" value={cav.codigo} />
              <DetailItem label="Data" value={format(new Date(cav.data + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })} />
              <DetailItem label="Frente" value={cav.frente} />
              <DetailItem 
                label="Setor" 
                value={
                  cav.setor ? (
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      cav.setor === 'GUA' ? 'bg-blue-100 text-blue-800' :
                      cav.setor === 'MOE' ? 'bg-green-100 text-green-800' :
                      cav.setor === 'ALE' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {cav.setor}
                    </span>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )
                } 
              />
            </div>
          </div>

          <Separator className="my-2" />

          <div>
            <SectionTitle title="Produção e Aplicação" />
            <div className="grid grid-cols-4 gap-3">
              <DetailItem label="Produção Total" value={`${cav.total_producao.toFixed(2)} ha`} />
              <DetailItem label="Lâmina Alvo" value={`${cav.lamina_alvo.toFixed(1)} m³`} />
              <DetailItem label="Lâmina Aplicada" value={`${cav.lamina_aplicada.toFixed(2)} m³`} />
              <DetailItem 
                label="Diferença de Lâmina" 
                value={
                  <span className={cav.dif_lamina_perc > 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                    {cav.dif_lamina_perc.toFixed(1)}%
                  </span>
                } 
              />
            </div>
          </div>

          <Separator className="my-2" />

          <div>
            <SectionTitle title="Viagens" />
            <div className="grid grid-cols-3 gap-3">
              <DetailItem label="Viagens Feitas" value={cav.total_viagens_feitas.toFixed(2)} />
              <DetailItem label="Viagens Orçadas" value={cav.total_viagens_orcadas.toFixed(2)} />
              <DetailItem 
                label="Diferença de Viagens" 
                value={
                  <span className={cav.dif_viagens_perc > 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                    {cav.dif_viagens_perc.toFixed(1)}%
                  </span>
                } 
              />
            </div>
          </div>

          <Separator className="my-2" />

          <div>
            <SectionTitle title="Registros Detalhados" />
            {isLoadingDetalhes ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Carregando detalhes...</div>
            </div>
            ) : boletinsIndividuais.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
            <Table>
                  <TableHeader className="bg-gray-50">
                                        <TableRow className="h-[40px]">
                      <TableHead className="text-gray-700 font-medium px-3">Frota</TableHead>
                      <TableHead className="text-gray-700 font-medium px-3">Turno</TableHead>
                      <TableHead className="text-gray-700 font-medium px-3">Operador</TableHead>
                      <TableHead className="text-gray-700 font-medium px-3 text-right">Produção (ha)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                    {(() => {
                      // Agrupar por frota
                      const frotasAgrupadas = boletinsIndividuais.reduce((acc, boletim) => {
                        if (!acc[boletim.frota]) {
                          acc[boletim.frota] = []
                        }
                        acc[boletim.frota].push(boletim)
                        return acc
                      }, {} as Record<number, BoletimCav[]>)

                      // Calcular total geral
                      const totalGeral = boletinsIndividuais.reduce((sum, b) => sum + b.producao, 0)

                      const rows: React.ReactNode[] = []

                      // Renderizar cada frota com subtotal
                      Object.entries(frotasAgrupadas)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .forEach(([frota, boletins]) => {
                          const totalFrota = boletins.reduce((sum, b) => sum + b.producao, 0)
                          
                          // Adicionar registros da frota
                          boletins.forEach((boletim, index) => {
                            rows.push(
                                                            <TableRow key={boletim.id} className="h-[40px] hover:bg-gray-50">
                                <TableCell className="px-3 py-2 border-x border-gray-100">{boletim.frota}</TableCell>
                                <TableCell className="px-3 py-2 border-x border-gray-100">{boletim.turno}</TableCell>
                                <TableCell className="px-3 py-2 border-x border-gray-100">{boletim.operador}</TableCell>
                                <TableCell className="px-3 py-2 border-x border-gray-100 text-right">
                                  {boletim.producao.toFixed(2)}
                    </TableCell>
                              </TableRow>
                            )
                          })

                          // Adicionar subtotal da frota
                          rows.push(
                                                        <TableRow key={`subtotal-${frota}`} className="bg-blue-50 font-medium">
                              <TableCell className="px-3 py-2 border-x border-gray-200" colSpan={3}>
                                <span className="text-blue-700">Subtotal Frota {frota}</span>
                    </TableCell>
                              <TableCell className="px-3 py-2 border-x border-gray-200 text-right text-blue-700 font-semibold">
                                {totalFrota.toFixed(2)}
                    </TableCell>
                            </TableRow>
                          )
                        })

                      // Adicionar total geral
                      rows.push(
                                                <TableRow key="total-geral" className="bg-green-50 font-bold border-t-2 border-green-200">
                          <TableCell className="px-3 py-2 border-x border-gray-200" colSpan={3}>
                            <span className="text-green-700">🎯 TOTAL GERAL</span>
                    </TableCell>
                          <TableCell className="px-3 py-2 border-x border-gray-200 text-right text-green-700 font-bold text-lg">
                            {totalGeral.toFixed(2)}
                    </TableCell>
                  </TableRow>
                      )

                      return rows
                    })()}
              </TableBody>
            </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum registro detalhado encontrado
              </div>
            )}
          </div>


        </div>

        <div className="border-t bg-white p-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
    </div>
      </DialogContent>
    </Dialog>
  )
}

