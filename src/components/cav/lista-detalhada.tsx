"use client"

import { useMemo, useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Eye, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Plus, Download, Pencil, FileDown, Copy, X, FileText } from "lucide-react"
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
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { NovoCavModal } from "./novo-cav-modal"
import { NovoDiarioCavModal } from "./novo-diario-cav-modal"
import { supabase } from "@/lib/supabase"
import React from "react"

// Componente de filtro simples (layout antigo)
function ClassicFilter({ options, selected, onToggle, onClear }: { options: string[]; selected: Set<string>; onToggle: (o: string)=>void; onClear: ()=>void }) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(()=>
    options.filter(o=>o.toLowerCase().includes(search.toLowerCase())).sort(),
  [options, search])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:bg-transparent">
          <Filter className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-3" sideOffset={5}>
        <Input placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} className="mb-2 h-8" />
        <div className="max-h-40 overflow-auto space-y-1">
          {filtered.map(opt=> (
            <div key={opt} className="flex items-center space-x-2">
              <Checkbox id={opt} checked={selected.has(opt)} onCheckedChange={()=>onToggle(opt)} />
              <label htmlFor={opt} className="text-sm">{opt}</label>
            </div>
          ))}
          {filtered.length===0 && <p className="text-sm text-muted-foreground">Nenhuma opção</p>}
        </div>
        <Button variant="outline" size="sm" className="mt-2 w-full" onClick={onClear}>Limpar</Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

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
  registros_granulares?: { uuids: number[] }
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editBoletinsIndividuais, setEditBoletinsIndividuais] = useState<BoletimCav[]>([])
  const [isRelatorioModalOpen, setIsRelatorioModalOpen] = useState(false)
  const [selectedCavForRelatorio, setSelectedCavForRelatorio] = useState<CavAgregado | null>(null)
  const [dadosGranularesCarregados, setDadosGranularesCarregados] = useState<BoletimCav[]>([])

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
    { key: "setor", title: "Setor" },
    { key: "total_producao", title: "Produção (ha)" },
    { key: "total_viagens_feitas", title: "Viagens" },
    { key: "total_viagens_orcadas", title: "Viagens Orçadas" },
    { key: "dif_viagens_perc", title: "Dif. Viagens (%)" },
    { key: "lamina_alvo", title: "Lâmina Alvo (m³)" },
    { key: "lamina_aplicada", title: "Lâmina Aplicada (m³)" },
    { key: "dif_lamina_perc", title: "Dif. Lâmina (%)" },
  ]

  // 📋 Colunas visíveis (podem ser alternadas pelo usuário)
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>(columns.map(c=>c.key))

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev =>
      prev.includes(key) ? prev.filter(k=>k!==key) : [...prev, key]
    )
  }

  const isColVisible = (key:string) => visibleColumns.includes(key)

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

    const fmt = (n:number, dec:number)=> n.toFixed(dec).replace('.',',')

    const csvRows = [
      Object.values(headers).join(';'),

      ...filteredData.map(cav => [
        cav.data.split('-').reverse().join('/'),
        cav.codigo,
        cav.frente,
        fmt(cav.total_producao,2),
        fmt(cav.total_viagens_feitas,0),
        fmt(cav.total_viagens_orcadas,0),
        fmt(cav.dif_viagens_perc,2) + '%',
        fmt(cav.lamina_alvo,1),
        fmt(cav.lamina_aplicada,2),
        fmt(cav.dif_lamina_perc,2) + '%'
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
        <div className="flex gap-2 items-center">
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

        {/* Seletor de colunas */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              Colunas
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent className="p-3 w-56">
            <div className="space-y-2">
              {columns.map(col=> (
                <div key={col.key} className="flex items-center space-x-2">
                  <Checkbox id={`col_${col.key}`} checked={isColVisible(col.key)} onCheckedChange={()=>toggleColumn(col.key)} />
                  <label htmlFor={`col_${col.key}`} className="text-sm">{col.title}</label>
                </div>
              ))}
            </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div> {/* fim botoes */}
      </div> {/* fim header */}

      {/* Table */}
      <div className="flex-1 border rounded-lg flex flex-col min-h-0 overflow-hidden">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-black sticky top-0">
              <TableRow className="h-[47px]">
                {columns.filter(c=>isColVisible(c.key)).map((column) => (
                  <TableHead key={column.key} className="text-white font-medium px-3 text-center">
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
                      <ClassicFilter
                        options={filterOptions[column.key] ?? []}
                        selected={filters[column.key] ?? new Set()}
                        onToggle={(opt)=>handleFilterToggle(column.key,opt)}
                        onClear={()=>handleClearFilter(column.key)}
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
                  {isColVisible('data') && (
                    <TableCell className="px-3 py-0 border-x border-gray-100 text-center">{format(new Date(cav.data + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  )}
                  {isColVisible('codigo') && (
                    <TableCell className="px-3 py-0 border-x border-gray-100 text-center">{cav.codigo}</TableCell>
                  )}
                  {isColVisible('frente') && (
                    <TableCell className="px-3 py-0 border-x border-gray-100 text-center">{cav.frente}</TableCell>
                  )}
                  {isColVisible('setor') && (
                    <TableCell className="px-3 py-0 border-x border-gray-100 text-center">{cav.setor ?? '-'}</TableCell>
                  )}
                  {isColVisible('total_producao') && (
                    <TableCell className="px-3 py-0 border-x border-gray-100 text-center">{cav.total_producao.toFixed(2)}</TableCell>
                  )}
                  {isColVisible('total_viagens_feitas') && (
                    <TableCell className="px-3 py-0 border-x border-gray-100 text-center">{cav.total_viagens_feitas.toFixed(0)}</TableCell>
                  )}
                  {isColVisible('total_viagens_orcadas') && (
                    <TableCell className="px-3 py-0 border-x border-gray-100 text-center">{cav.total_viagens_orcadas.toFixed(0)}</TableCell>
                  )}
                  {isColVisible('dif_viagens_perc') && (
                    <TableCell className="px-3 py-0 border-x border-gray-100 text-center">
                      <span className={
                        cav.dif_viagens_perc < 0
                          ? "text-red-600"
                          : cav.dif_viagens_perc <= 10
                            ? "text-green-600"
                            : "text-yellow-500"
                      }>
                        {cav.dif_viagens_perc.toFixed(2)}%
                      </span>
                    </TableCell>
                  )}
                  {isColVisible('lamina_alvo') && (
                    <TableCell className="px-3 py-0 border-x border-gray-100 text-center">{cav.lamina_alvo.toFixed(1)}</TableCell>
                  )}
                  {isColVisible('lamina_aplicada') && (
                    <TableCell className="px-3 py-0 border-x border-gray-100 text-center">{cav.lamina_aplicada.toFixed(1)}</TableCell>
                  )}
                  {isColVisible('dif_lamina_perc') && (
                    <TableCell className="px-3 py-0 border-x border-gray-100 text-center">
                    <span className={
                      cav.dif_lamina_perc < 0
                        ? "text-red-600"
                        : cav.dif_lamina_perc <= 10
                          ? "text-green-600"
                          : "text-yellow-500"
                    }>
                      {cav.dif_lamina_perc.toFixed(2)}%
                    </span>
                    </TableCell>
                  )}
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
                Array(rowsPerPage - paginatedData.length).fill(0).map((_, index) => {
                  const visibleCount = visibleColumns.length + 1 // +1 para coluna Ações
                  return (
                    <TableRow key={`empty-${index}`} className="h-[47px] border-b border-gray-200">
                      {Array(visibleCount).fill(0).map((_, colIndex) => (
                        <TableCell key={`empty-cell-${colIndex}`} className="px-3 py-0 border-x border-gray-100">&nbsp;</TableCell>
                      ))}
                    </TableRow>
                  )
                })
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
          onOpenChange={(open) => {
            if (!open) {
              // Se o modal de edição não está aberto, podemos limpar
              if (!isEditModalOpen) {
                setSelectedCav(null)
              }
            }
          }}
          cav={selectedCav}
          onEdit={(cav, boletinsIndividuais) => {
            // Armazenar os boletins individuais para edição
            setEditBoletinsIndividuais(boletinsIndividuais);
            
            // Abrir o modal de edição
            setIsEditModalOpen(true);
          }}
          onGerarRelatorio={(cav, boletinsIndividuais) => {
            console.log('🎯 onGerarRelatorio chamado com:', { cav, boletinsIndividuais: boletinsIndividuais.length });
            
            // Configurar estados para o modal de relatório
            setSelectedCavForRelatorio(cav);
            setDadosGranularesCarregados(boletinsIndividuais);
            
            // Fechar modal de detalhes e abrir modal de relatório
            setSelectedCav(null);
            setIsRelatorioModalOpen(true);
            
            console.log('✅ Estados configurados - modal deveria abrir');
          }}
        />
      )}

      {/* Modal de novo CAV */}
      <NovoCavModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCavAdded={handleCavAdded}
      />
      
      {/* Modal de edição de CAV */}
      {selectedCav && (
        <NovoCavModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onCavAdded={handleCavAdded}
          isEditMode={true}
          cavToEdit={selectedCav}
          boletinsIndividuais={editBoletinsIndividuais}
        />
      )}

      {/* Modal de geração de relatório */}
      {(() => {
        console.log('🔍 Verificando renderização do modal relatório:', {
          selectedCavForRelatorio: !!selectedCavForRelatorio,
          isRelatorioModalOpen,
          dadosGranularesCarregados: dadosGranularesCarregados.length
        });
        
        return selectedCavForRelatorio && (
          <NovoDiarioCavModal
            open={isRelatorioModalOpen}
            onOpenChange={(open) => {
              console.log('📱 Modal relatório onOpenChange:', open);
              setIsRelatorioModalOpen(open);
              if (!open) {
                setSelectedCavForRelatorio(null);
                setDadosGranularesCarregados([]);
              }
            }}
            onSuccess={() => {
              setIsRelatorioModalOpen(false);
              setSelectedCavForRelatorio(null);
              setDadosGranularesCarregados([]);
              toast({
                title: "Relatório gerado!",
                description: "O relatório foi criado com sucesso.",
              });
            }}
            preFilledData={{
              data: format(new Date(selectedCavForRelatorio.data + 'T00:00:00'), "dd/MM/yyyy"),
              frente: selectedCavForRelatorio.frente,
              codigo: selectedCavForRelatorio.codigo,
              idsGranulares: selectedCavForRelatorio.registros_granulares?.uuids || [],
              dadosGranulares: dadosGranularesCarregados,
              dadosAgregados: selectedCavForRelatorio
            }}
          />
        );
      })()}
          </div>
  )
}

// FilterDropdown agora é importado de componente comum

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
  cav,
  onEdit,
  onGerarRelatorio
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cav: CavAgregado
  onEdit?: (cav: CavAgregado, boletinsIndividuais: BoletimCav[]) => void
  onGerarRelatorio?: (cav: CavAgregado, boletinsIndividuais: BoletimCav[]) => void
}) {
  const { toast } = useToast()
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
        <DialogHeader className="sr-only">
          <DialogTitle>
            Detalhes do Boletim CAV - {cav.frente} {format(new Date(cav.data + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })} - {cav.codigo}
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center px-4 h-12 border-b relative">
          <div className="flex-1 text-center">
            <span className="text-base font-medium">
              Detalhes {cav.frente} {format(new Date(cav.data + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })} - {cav.codigo}
            </span>
        </div>
          <div className="absolute right-2 top-2 flex space-x-2">
            <Button 
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => {
                if (onEdit && boletinsIndividuais.length > 0) {
                  onEdit(cav, boletinsIndividuais);
                }
              }}
              title="Editar boletim"
              disabled={isLoadingDetalhes || boletinsIndividuais.length === 0}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onOpenChange(false)}
              title="Fechar"
            >
              <X className="h-4 w-4" />
        </Button>
      </div>
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
                  <span className={
                    cav.dif_lamina_perc < 0
                      ? "text-red-600 font-semibold"
                      : cav.dif_lamina_perc <= 10
                        ? "text-green-600 font-semibold"
                        : "text-yellow-500 font-semibold"
                  }>
                    {cav.dif_lamina_perc.toFixed(2)}%
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
              <DetailItem label="Viagens Orçadas" value={cav.total_viagens_orcadas.toFixed(0)} />
              <DetailItem 
                label="Diferença de Viagens" 
                value={
                  <span className={
                    cav.dif_viagens_perc < 0
                      ? "text-red-600 font-semibold"
                      : cav.dif_viagens_perc <= 10
                        ? "text-green-600 font-semibold"
                        : "text-yellow-500 font-semibold"
                  }>
                    {cav.dif_viagens_perc.toFixed(2)}%
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

          <Separator className="my-2" />

          <div>
            <SectionTitle title="Referências" />
            {cav.registros_granulares?.uuids && cav.registros_granulares.uuids.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  IDs dos registros granulares vinculados a este registro agregado:
                </p>
                <div className="flex flex-wrap gap-2">
                  {cav.registros_granulares.uuids.map((id, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs font-mono"
                      onClick={() => {
                        navigator.clipboard.writeText(String(id))
                        toast({
                          title: "ID copiado!",
                          description: `ID ${id} foi copiado para a área de transferência.`,
                        })
                      }}
                      title={`Clique para copiar ID: ${id}`}
                    >
                      {id}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => {
                    const allIds = cav.registros_granulares?.uuids?.join(', ') || ''
                    navigator.clipboard.writeText(allIds)
                    toast({
                      title: "IDs copiados!",
                      description: `Todos os ${cav.registros_granulares?.uuids?.length || 0} IDs foram copiados.`,
                    })
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar todos os IDs
                </Button>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                Nenhuma referência de registros granulares encontrada
              </div>
            )}
          </div>

        </div>

        <div className="border-t bg-white px-8 py-5">
          <SectionTitle title="Resumo do Boletim" />
          <div className="flex justify-center gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                // Usar Dialog do Shadcn para criar o modal
                const dialogRoot = document.createElement('div');
                dialogRoot.id = 'resumo-dialog-root';
                document.body.appendChild(dialogRoot);
                
                // Criar o conteúdo HTML para o modal
                const modalHTML = `
                  <div data-state="open" class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" style="pointer-events: auto;">
                    <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full" style="pointer-events: auto;">
                      <div class="flex flex-col space-y-1.5 text-center sm:text-center">
                        <h2 class="text-lg font-semibold leading-none tracking-tight">${cav.frente} ${format(new Date(cav.data + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })} - ${cav.codigo}</h2>
                      </div>
                      <div id="resumo-content" class="p-4 pt-0">
                        <div class="mb-4">
                          <p><strong>📅 Data:</strong> ${format(new Date(cav.data + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}</p>
                          <p><strong>🏭 Frente:</strong> ${cav.frente}</p>
                          <p><strong>🔢 Código:</strong> ${cav.codigo}</p>
                          <p><strong>💧 Lâmina Alvo:</strong> ${cav.lamina_alvo} m³</p>
                        </div>
                        
                        <h4 class="text-center font-semibold mb-2">📊 APLICAÇÃO</h4>
                        <div class="mb-4" id="aplicacao-section">
                          <!-- Será preenchido via JavaScript -->
                        </div>
                        
                        <h4 class="text-center font-semibold mb-2">💧 LÂMINA</h4>
                        <div class="mb-4">
                          <p><strong>Lâmina Alvo:</strong> ${cav.lamina_alvo.toFixed(2)} m³</p>
                          <p><strong>Lâmina Aplicada:</strong> ${cav.lamina_aplicada.toFixed(2)} m³</p>
                          <p><strong>Diferença:</strong> ${(cav.lamina_aplicada - cav.lamina_alvo).toFixed(2)} m³ (${cav.dif_lamina_perc > 0 ? '+' : ''}${cav.dif_lamina_perc.toFixed(2)}%)</p>
                        </div>
                        
                        <h4 class="text-center font-semibold mb-2">🚜 VIAGENS</h4>
                        <div class="mb-4">
                          <p><strong>Viagens Orçadas:</strong> ${cav.total_viagens_orcadas.toFixed(0)}</p>
                          <p><strong>Viagens Feitas:</strong> ${cav.total_viagens_feitas.toFixed(2)}</p>
                          <p><strong>Diferença:</strong> ${(cav.total_viagens_feitas - cav.total_viagens_orcadas).toFixed(2)} (<span class="${cav.dif_viagens_perc < 0 ? 'text-red-600' : cav.dif_viagens_perc <= 10 ? 'text-green-600' : 'text-yellow-500'}">${cav.dif_viagens_perc > 0 ? '+' : ''}${cav.dif_viagens_perc.toFixed(2)}%</span>)</p>
                        </div>
                        
                        <div class="flex justify-center mt-6">
                          <button id="btn-copiar-png" class="bg-black text-white px-4 py-2 rounded-md font-semibold">
                            Copiar como PNG
                          </button>
                        </div>
                      </div>
                      <button id="btn-fechar-resumo" class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <div class="flex h-8 w-8 items-center justify-center rounded-sm border border-slate-200">
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4">
                            <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path>
                          </svg>
                        </div>
                        <span class="sr-only">Fechar</span>
                      </button>
                    </div>
    </div>
                `;
                
                dialogRoot.innerHTML = modalHTML;
                
                // Preencher a seção de aplicação
                const aplicacaoSection = document.getElementById('aplicacao-section');
                if (aplicacaoSection) {
                  // Agrupar por frota
                  const frotasAgrupadas: Record<string, BoletimCav[]> = {};
                  boletinsIndividuais.forEach(boletim => {
                    const frotaKey = String(boletim.frota);
                    if (!frotasAgrupadas[frotaKey]) {
                      frotasAgrupadas[frotaKey] = [];
                    }
                    frotasAgrupadas[frotaKey].push(boletim);
                  });
                  
                  // Renderizar frotas e turnos
                  let aplicacaoHTML = '';
                  Object.entries(frotasAgrupadas).forEach(([frota, boletins]) => {
                    aplicacaoHTML += `<p class="font-semibold mt-2">🚜 Frota ${frota}:</p>`;
                    
                    let totalFrota = 0;
                    boletins.forEach((boletim: BoletimCav) => {
                      aplicacaoHTML += `<p class="ml-5">• Turno ${boletim.turno}: ${boletim.operador} - ${boletim.producao} ha</p>`;
                      totalFrota += boletim.producao;
                    });
                    
                    aplicacaoHTML += `<p class="ml-5 font-semibold">📋 Total Frota: ${totalFrota.toFixed(2)} ha</p>`;
                  });
                  
                  aplicacaoHTML += `
                    <p class="font-semibold mt-2">📋 Código ${cav.codigo}: ${cav.total_producao} ha</p>
                    <p class="text-center font-semibold text-base mt-2">🎯 TOTAL GERAL: ${cav.total_producao} ha</p>
                  `;
                  
                  aplicacaoSection.innerHTML = aplicacaoHTML;
                }
                
                // Adicionar evento de clique ao botão de fechar
                const closeButton = document.getElementById('btn-fechar-resumo');
                if (closeButton) {
                  closeButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    document.body.removeChild(dialogRoot);
                  });
                }
                
                // Adicionar evento de clique no overlay para fechar
                const overlay = dialogRoot.querySelector('[data-state="open"]');
                if (overlay) {
                  overlay.addEventListener('click', function(e) {
                    // Só fechar se clicou no overlay, não no conteúdo
                    if (e.target === overlay) {
                      e.preventDefault();
                      e.stopPropagation();
                      e.stopImmediatePropagation && e.stopImmediatePropagation();
                      setTimeout(() => { document.body.removeChild(dialogRoot); }, 0);
                    }
                  });
                }
                
                // Adicionar evento de clique ao botão de copiar
                setTimeout(() => {
                  const copyButton = document.getElementById('btn-copiar-png');
                  if (copyButton) {
                    copyButton.onclick = async function() {
                      try {
                        // Mostrar toast de processamento
                        toast({
                          title: "Processando...",
                          description: "Capturando o resumo como PNG",
                        });
                        
                        // Importar html2canvas dinamicamente
                        const html2canvasModule = await import('html2canvas');
                        const html2canvas = html2canvasModule.default;
                        
                        // Esconder o botão temporariamente para a captura
                        copyButton.style.display = 'none';
                        
                        // Obter o conteúdo do resumo
                        const resumoContent = document.getElementById('resumo-content');
                        if (!resumoContent) {
                          throw new Error("Conteúdo do resumo não encontrado");
                        }
                        
                        // Capturar o elemento
                        const canvas = await html2canvas(resumoContent, {
                          background: '#ffffff',
                          // @ts-ignore
                          scale: 2,
                          useCORS: true,
                          allowTaint: true,
                          logging: false
                        });
                        
                        // Restaurar o botão
                        copyButton.style.display = 'block';
                        
                        // Gerar nome de arquivo
                        const dataFormatada = format(new Date(cav.data + 'T00:00:00'), "dd-MM-yyyy", { locale: ptBR });
                        const frenteFormatada = cav.frente.replace(/\s+/g, '_');
                        const nomeArquivo = `Boletim_${frenteFormatada}_${dataFormatada}_${cav.codigo}.png`;
                        
                        // Converter para blob
                        canvas.toBlob(function(blob) {
                          if (!blob) {
                            console.error("Falha ao gerar blob");
                            return;
                          }
                          
                          // Forçar download automático sem prompt
                          const dataUrl = canvas.toDataURL('image/png');
                          const binaryData = atob(dataUrl.split(',')[1]);
                          const array = [];
                          for (let i = 0; i < binaryData.length; i++) {
                            array.push(binaryData.charCodeAt(i));
                          }
                          
                          // Criar um Blob com os dados binários
                          const downloadBlob = new Blob([new Uint8Array(array)], {type: 'image/png'});
                          const url = URL.createObjectURL(downloadBlob);
                          
                          // Criar link para download
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = nomeArquivo;
                          link.style.display = 'none';
                          link.setAttribute('download', nomeArquivo); // Reforçar o atributo download
                          document.body.appendChild(link);
                          
                          // Forçar o clique e download
                          link.click();
                          
                          // Limpar URL após o download
                          setTimeout(() => {
                            URL.revokeObjectURL(url);
                            document.body.removeChild(link);
                            
                            // Mostrar mensagem de sucesso
                            toast({
                              title: "Download concluído!",
                              description: `Arquivo salvo como ${nomeArquivo}`,
                            });
                          }, 100);
                          
                          // Copiar imagem para área de transferência usando Clipboard API
                          try {
                            // Definir função de fallback fora do bloco try
                            const copyImageFallback = () => {
                              // Criar elemento de imagem
                              const img = new Image();
                              img.src = canvas.toDataURL('image/png');
                              img.onload = function() {
                                // Criar canvas temporário
                                const tempCanvas = document.createElement('canvas');
                                tempCanvas.width = img.width;
                                tempCanvas.height = img.height;
                                
                                // Desenhar a imagem no canvas
                                const ctx = tempCanvas.getContext('2d');
                                ctx?.drawImage(img, 0, 0);
                                
                                // Converter canvas para blob
                                tempCanvas.toBlob(function(imgBlob) {
                                  if (!imgBlob) return;
                                  
                                  // Criar elemento de imagem para copiar
                                  const imgElement = document.createElement('img');
                                  imgElement.src = URL.createObjectURL(imgBlob);
                                  imgElement.style.position = 'fixed';
                                  imgElement.style.left = '0';
                                  imgElement.style.top = '0';
                                  imgElement.style.opacity = '0';
                                  imgElement.style.zIndex = '-9999';
                                  imgElement.style.maxWidth = 'none';
                                  imgElement.style.maxHeight = 'none';
                                  
                                  // Adicionar ao DOM
                                  document.body.appendChild(imgElement);
                                  
                                  // Selecionar a imagem
                                  const range = document.createRange();
                                  range.selectNode(imgElement);
                                  const selection = window.getSelection();
                                  selection?.removeAllRanges();
                                  selection?.addRange(range);
                                  
                                  // Tentar copiar
                                  try {
                                    const success = document.execCommand('copy');
                                    if (success) {
                                      toast({
                                        title: "Copiado!",
                                        description: "Imagem copiada para a área de transferência",
                                      });
                                    }
                                  } catch (e) {
                                    console.error("Erro ao copiar imagem:", e);
                                  } finally {
                                    // Limpar
                                    selection?.removeAllRanges();
                                    document.body.removeChild(imgElement);
                                  }
                                }, 'image/png', 1.0);
                              };
                            };
                            
                            // Método moderno usando Clipboard API
                            if (navigator.clipboard && navigator.clipboard.write) {
                              navigator.clipboard.write([
                                new ClipboardItem({
                                  'image/png': blob
                                })
                              ]).then(() => {
                                toast({
                                  title: "Copiado!",
                                  description: "Imagem copiada para a área de transferência",
                                });
                              }).catch(err => {
                                console.error("Erro ao copiar com Clipboard API:", err);
                                // Tentar método alternativo
                                copyImageFallback();
                              });
                            } else {
                              // Usar método alternativo
                              copyImageFallback();
                            }
                          } catch (clipboardError) {
                            console.error("Erro ao copiar para clipboard:", clipboardError);
                          }
                        }, 'image/png', 1.0);
                      } catch (error) {
                        console.error('Erro ao copiar como PNG:', error);
                        toast({
                          title: "Erro",
                          description: "Não foi possível gerar a imagem",
                          variant: "destructive"
                        });
                      }
                    };
                  }
                }, 500); // Pequeno delay para garantir que o DOM está pronto
              }}
              className="w-auto min-w-[200px]"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Visualizar resumo
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                console.log('🎯 CLIQUE NO GERAR RELATÓRIO DETECTADO!');
                console.log('📊 Dados do CAV:', {
                  data: cav.data,
                  frente: cav.frente,
                  codigo: cav.codigo,
                  registros_granulares: cav.registros_granulares,
                  boletinsIndividuais: boletinsIndividuais
                });
                
                // Chamar a função de gerar relatório
                if (onGerarRelatorio) {
                  console.log('⚙️ Chamando função de gerar relatório...');
                  onGerarRelatorio(cav, boletinsIndividuais);
                } else {
                  console.error('❌ Função onGerarRelatorio não foi passada!');
                }
              }}
              className="w-auto min-w-[200px] border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <FileText className="mr-2 h-4 w-4" />
              Gerar Relatório
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



