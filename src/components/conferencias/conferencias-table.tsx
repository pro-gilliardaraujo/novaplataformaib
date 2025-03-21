"use client"

import { useState, useMemo, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Eye, Plus, Search, ArrowUpDown } from "lucide-react"
import { FilterDropdown } from "@/components/filter-dropdown"
import { ConferenciaDetailsModal } from "./conferencia-details-modal"
import { NovaConferenciaModal } from "./nova-conferencia-modal"
import { EditarConferenciaModal } from "./editar-conferencia-modal"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { Conferencia } from "@/types/conferencias"

interface FilterState {
  [key: string]: Set<string>
}

const columns = [
  {
    key: "data_conferencia",
    title: "Data",
    sortable: true,
    getValue: (conferencia: Conferencia) => {
      const date = new Date(conferencia.data_conferencia)
      return date.toLocaleDateString("pt-BR")
    }
  },
  {
    key: "status",
    title: "Status",
    sortable: true,
    getValue: (conferencia: Conferencia) => {
      const statusMap = {
        em_andamento: "Em Andamento",
        concluida: "Concluída",
        cancelada: "Cancelada"
      }
      return statusMap[conferencia.status]
    }
  },
  {
    key: "total_itens",
    title: "Total de Itens",
    sortable: true,
    getValue: (conferencia: Conferencia) => conferencia.total_itens.toString()
  },
  {
    key: "itens_conferidos",
    title: "Itens Conferidos",
    sortable: true,
    getValue: (conferencia: Conferencia) => conferencia.itens_conferidos.toString()
  },
  {
    key: "itens_divergentes",
    title: "Divergências",
    sortable: true,
    getValue: (conferencia: Conferencia) => conferencia.itens_divergentes.toString()
  },
  {
    key: "responsaveis",
    title: "Responsáveis",
    sortable: true,
    getValue: (conferencia: Conferencia) => conferencia.responsaveis
  }
]

export function ConferenciasTable() {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterState>({})
  const [selectedConferencia, setSelectedConferencia] = useState<Conferencia | null>(null)
  const [selectedConferenciaForEdit, setSelectedConferenciaForEdit] = useState<Conferencia | null>(null)
  const [conferencias, setConferencias] = useState<Conferencia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewConferenciaModalOpen, setIsNewConferenciaModalOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'data_conferencia', 
    direction: 'desc' 
  })
  const rowsPerPage = 15
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    loadConferencias()
  }, [])

  const loadConferencias = async () => {
    try {
      const { data: conferenciasData, error } = await supabase
        .from("conferencias_estoque")
        .select("*")
        .order("data_conferencia", { ascending: false })

      if (error) throw error

      setConferencias(conferenciasData)
    } catch (error) {
      console.error("Erro ao carregar conferências:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar conferências",
        description: "Não foi possível carregar as conferências."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadConferenciaDetails = async (conferencia: Conferencia) => {
    try {
      const { data: itensData, error } = await supabase
        .from("itens_conferencia")
        .select(`
          id,
          item_id,
          quantidade_sistema,
          quantidade_conferida,
          diferenca,
          observacoes,
          item:itens_estoque!inner (
            codigo_fabricante,
            descricao
          )
        `)
        .eq("conferencia_id", conferencia.id)

      if (error) throw error

      type ItemResponse = {
        id: string
        item_id: string
        quantidade_sistema: number
        quantidade_conferida: number | null
        diferenca: number | null
        observacoes: string | null
        item: {
          codigo_fabricante: string
          descricao: string
        }
      }

      const itens = (itensData as unknown as ItemResponse[]).map(item => ({
        id: item.id,
        item_id: item.item_id,
        codigo_patrimonio: item.item.codigo_fabricante,
        descricao: item.item.descricao,
        quantidade_sistema: item.quantidade_sistema,
        quantidade_conferida: item.quantidade_conferida === null ? ("--" as const) : item.quantidade_conferida,
        diferenca: item.diferenca || 0,
        observacoes: item.observacoes
      }))

      setSelectedConferencia({
        ...conferencia,
        itens
      })
    } catch (error) {
      console.error("Erro ao carregar detalhes da conferência:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar detalhes",
        description: "Não foi possível carregar os detalhes da conferência."
      })
    }
  }

  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        acc[column.key] = Array.from(
          new Set(
            conferencias
              .map((item) => column.getValue(item))
              .filter((value): value is string => typeof value === "string")
          )
        )
        return acc
      },
      {} as Record<string, string[]>
    )
  }, [conferencias])

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
    setFilters((prevFilters) => ({
      ...prevFilters,
      [columnKey]: new Set<string>(),
    }))
  }

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const filteredAndSortedData = useMemo(() => {
    let filtered = conferencias.filter((row) =>
      Object.entries(filters).every(([key, selectedOptions]) => {
        if (selectedOptions.size === 0) return true
        const column = columns.find(col => col.key === key)
        if (!column) return true
        const value = column.getValue(row)
        return typeof value === "string" && selectedOptions.has(value)
      })
    )

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(conferencia =>
        conferencia.responsaveis.toLowerCase().includes(searchLower) ||
        columns.some(column => column.getValue(conferencia).toLowerCase().includes(searchLower))
      )
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const column = columns.find(col => col.key === sortConfig.key)
        if (!column) return 0

        let aValue = column.getValue(a)
        let bValue = column.getValue(b)

        // Special handling for dates
        if (sortConfig.key === 'data_conferencia') {
          aValue = new Date(a.data_conferencia).getTime().toString()
          bValue = new Date(b.data_conferencia).getTime().toString()
        }

        // Special handling for numbers
        if (['total_itens', 'itens_conferidos', 'itens_divergentes'].includes(sortConfig.key)) {
          aValue = parseInt(aValue).toString()
          bValue = parseInt(bValue).toString()
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [conferencias, filters, searchTerm, sortConfig])

  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage)

  const handleConferenciaCreated = () => {
    loadConferencias()
  }

  const handleViewConferencia = (conferencia: Conferencia) => {
    loadConferenciaDetails(conferencia)
  }

  const handleEditConferencia = (conferencia: Conferencia) => {
    setSelectedConferenciaForEdit(conferencia)
  }

  const handleDeleteConferencia = async (conferencia: Conferencia) => {
    try {
      const { error } = await supabase
        .from("conferencias_estoque")
        .delete()
        .eq("id", conferencia.id)

      if (error) throw error

      await loadConferencias()
      toast({
        title: "Sucesso",
        description: "Conferência excluída com sucesso!"
      })
    } catch (error) {
      console.error("Erro ao excluir conferência:", error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir conferência",
        description: "Não foi possível excluir a conferência."
      })
      throw error
    }
  }

  const handleConferenciaEdited = async (conferencia: Conferencia) => {
    try {
      const { error } = await supabase
        .from("conferencias_estoque")
        .update({
          responsaveis: conferencia.responsaveis,
          observacoes: conferencia.observacoes,
          updated_at: new Date().toISOString()
        })
        .eq("id", conferencia.id)

      if (error) throw error

      await loadConferencias()
      setSelectedConferenciaForEdit(null)
      toast({
        title: "Sucesso",
        description: "Conferência atualizada com sucesso!"
      })
    } catch (error) {
      console.error("Erro ao atualizar conferência:", error)
      toast({
        variant: "destructive",
        title: "Erro ao atualizar conferência",
        description: "Não foi possível atualizar a conferência."
      })
      throw error
    }
  }

  const testarAlteracoes = async () => {
    try {
      // 1. Criar uma nova conferência
      const { data: conferencia, error: confError } = await supabase
        .from('conferencias_estoque')
        .insert({
          status: 'concluida',
          responsaveis: 'Teste',
          total_itens: 3,
          itens_conferidos: 2,
          itens_divergentes: 1
        })
        .select()
        .single();

      if (confError) throw confError;

      // 2. Buscar alguns itens do estoque para usar no teste
      const { data: itensEstoque, error: itensError } = await supabase
        .from('itens_estoque')
        .select('id')
        .limit(3);

      if (itensError) throw itensError;

      // 3. Inserir itens de teste
      const itensConferencia = itensEstoque.map((item, index) => ({
        conferencia_id: conferencia.id,
        item_id: item.id,
        quantidade_sistema: 10,
        quantidade_conferida: index === 2 ? null : index === 1 ? 8 : 12, // null, menor, maior
        observacoes: `Teste ${index + 1}`
      }));

      const { data: itensInseridos, error: insertError } = await supabase
        .from('itens_conferencia')
        .insert(itensConferencia)
        .select('quantidade_sistema, quantidade_conferida, diferenca, observacoes');

      if (insertError) throw insertError;

      console.log('Teste concluído com sucesso!');
      console.log('Itens inseridos:', itensInseridos);

      // 4. Carregar a conferência para ver como aparece na interface
      await loadConferenciaDetails(conferencia);

    } catch (error) {
      console.error('Erro no teste:', error);
      toast({
        variant: "destructive",
        title: "Erro no teste",
        description: "Verifique o console para mais detalhes."
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white">
        <Input 
          className="max-w-md" 
          placeholder="Buscar conferências..." 
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          className="bg-black hover:bg-black/90 text-white"
          onClick={() => setIsNewConferenciaModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Conferência
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader className="bg-black">
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className="text-white font-medium h-[47px]">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <span>{column.title}</span>
                        {column.sortable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-transparent"
                            onClick={() => handleSort(column.key)}
                          >
                            <ArrowUpDown className={`h-4 w-4 ${
                              sortConfig.key === column.key
                                ? sortConfig.direction === 'asc'
                                  ? 'text-white'
                                  : 'text-white rotate-180'
                                : 'text-white/50'
                            }`} />
                          </Button>
                        )}
                        <FilterDropdown
                          title={column.title}
                          options={filterOptions[column.key] || []}
                          selectedOptions={filters[column.key] || new Set()}
                          onOptionToggle={(option) => handleFilterToggle(column.key, option)}
                          onClear={() => handleClearFilter(column.key)}
                        />
                      </div>
                    </div>
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-white font-medium h-[47px] text-center">Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((conferencia) => (
              <TableRow key={conferencia.id} className="h-[47px] hover:bg-gray-50 border-b border-gray-200">
                {columns.map((column) => (
                  <TableCell key={column.key} className="py-0 border-x border-gray-100">
                    {column.getValue(conferencia)}
                  </TableCell>
                ))}
                <TableCell className="py-0 border-x border-gray-100">
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleViewConferencia(conferencia)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {/* Fill empty rows to maintain consistent height */}
            {paginatedData.length < rowsPerPage && (
              Array(rowsPerPage - paginatedData.length).fill(0).map((_, index) => (
                <TableRow key={`empty-${index}`} className="h-[47px] border-b border-gray-200">
                  {Array(columns.length + 1).fill(0).map((_, colIndex) => (
                    <TableCell key={`empty-cell-${colIndex}`} className="py-0 border-x border-gray-100">&nbsp;</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
          {/* Paginação como parte da tabela */}
          <tfoot>
            <tr>
              <td colSpan={columns.length + 1} className="px-4 h-[47px] border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Mostrando {(currentPage - 1) * rowsPerPage + 1} a {Math.min(currentPage * rowsPerPage, filteredAndSortedData.length)} de {filteredAndSortedData.length} resultados
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </Table>
      </div>

      {/* Modals */}
      {selectedConferencia && (
        <ConferenciaDetailsModal
          open={!!selectedConferencia}
          onOpenChange={(open) => !open && setSelectedConferencia(null)}
          conferencia={selectedConferencia}
          onEdit={handleEditConferencia}
          onDelete={handleDeleteConferencia}
        />
      )}

      {selectedConferenciaForEdit && (
        <EditarConferenciaModal
          open={!!selectedConferenciaForEdit}
          onOpenChange={(open) => !open && setSelectedConferenciaForEdit(null)}
          conferencia={selectedConferenciaForEdit}
          onConferenciaEdited={handleConferenciaEdited}
        />
      )}

      <NovaConferenciaModal
        open={isNewConferenciaModalOpen}
        onOpenChange={setIsNewConferenciaModalOpen}
        onConferenciaCreated={handleConferenciaCreated}
      />
    </div>
  )
} 