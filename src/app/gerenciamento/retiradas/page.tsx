"use client"

import { useState, useEffect, useMemo } from "react"
import { DataTable, Column } from "@/components/data-table"
import { PageLayout } from "@/components/page-layout"
import { Plus, Eye, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Retirada, NovaRetiradaData, UpdateRetiradaData } from "@/types/retirada"
import { useToast } from "@/components/ui/use-toast"
import { retiradaService } from "@/services/retiradas"
import { NovaRetiradaModal } from "@/components/nova-retirada-modal"
import RetiradaDetailsModal from "@/components/retirada-details-modal"
import { EditarRetiradaModal } from "@/components/editar-retirada-modal"

interface FilterState {
  [key: string]: Set<string>
}

const columns: Column<Retirada>[] = [
  { key: "codigo_patrimonio", title: "Código Patrimônio" },
  { key: "retirado_por", title: "Retirado por" },
  { 
    key: "data_retirada", 
    title: "Data de Retirada",
    render: (value) => {
      const [year, month, day] = (value as string).split("-")
      return `${day}/${month}/${year}`
    }
  },
  { key: "frota_instalada", title: "Frota Instalada" },
  { key: "entregue_por", title: "Entregue por" },
  { 
    key: "retirado", 
    title: "Status",
    render: (value) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          value ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
        }`}
      >
        {value ? "Retirado" : "Devolvido"}
      </span>
    )
  },
]

export default function RetiradasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [retiradas, setRetiradas] = useState<Retirada[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRetirada, setSelectedRetirada] = useState<Retirada | null>(null)
  const [selectedRetiradaForEdit, setSelectedRetiradaForEdit] = useState<Retirada | null>(null)
  const [filters, setFilters] = useState<FilterState>({})
  const { toast } = useToast()

  const fetchRetiradas = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await retiradaService.list()
      setRetiradas(data)
    } catch (error) {
      console.error("Error fetching retiradas:", error)
      setError("Erro ao carregar retiradas. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRetiradas()
    const unsubscribe = retiradaService.subscribeToChanges(fetchRetiradas)
    return () => {
      unsubscribe()
    }
  }, [])

  const handleCreateRetirada = async (formData: NovaRetiradaData) => {
    try {
      const newRetirada = await retiradaService.create(formData)
      setRetiradas(prev => [newRetirada, ...prev])
      toast({
        title: "Sucesso",
        description: "Retirada criada com sucesso!",
      })
      setIsModalOpen(false)
    } catch (error) {
      console.error("Error creating retirada:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar retirada. Por favor, tente novamente.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleUpdateRetirada = async (id: string, updates: UpdateRetiradaData) => {
    try {
      await retiradaService.update(id, updates)
      toast({
        title: "Retirada Atualizada",
        description: "Retirada atualizada com sucesso!",
      })
      await fetchRetiradas()
    } catch (error) {
      console.error("Error updating retirada:", error)
      throw new Error("Erro ao atualizar retirada")
    }
  }

  const handleViewRetirada = (retirada: Retirada) => {
    setSelectedRetirada(retirada)
  }

  const handleEditRetirada = (retirada: Retirada) => {
    setSelectedRetiradaForEdit(retirada)
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
    setFilters((prevFilters) => ({
      ...prevFilters,
      [columnKey]: new Set<string>(),
    }))
  }

  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        if (column.key === "data_retirada") {
          acc[column.key] = Array.from(
            new Set(
              retiradas
                .filter(item => item.data_retirada != null)
                .map((item) => {
                  if (!item.data_retirada) return null;
                  const [year, month, day] = item.data_retirada.split("-")
                  return `${day}/${month}/${year}`
                })
                .filter((value): value is string => value !== null)
            )
          )
        } else if (column.key === "retirado") {
          acc[column.key] = ["Retirado", "Devolvido"]
        } else {
          acc[column.key] = Array.from(
            new Set(
              retiradas
                .map((item) => item[column.key])
                .filter((value): value is string => typeof value === "string")
            )
          )
        }
        return acc
      },
      {} as Record<string, string[]>
    )
  }, [retiradas])

  const filteredRetiradas = useMemo(() => {
    return retiradas
      .filter(r => 
        Object.values(r).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
      .filter((row) =>
        Object.entries(filters).every(([key, selectedOptions]) => {
          if (selectedOptions.size === 0) return true
          if (key === "data_retirada") {
            const [year, month, day] = row.data_retirada.split("-")
            const formattedDate = `${day}/${month}/${year}`
            return selectedOptions.has(formattedDate)
          }
          if (key === "retirado") {
            return selectedOptions.has(row.retirado ? "Retirado" : "Devolvido")
          }
          const value = row[key as keyof Retirada]
          return typeof value === "string" && selectedOptions.has(value)
        })
      )
  }, [retiradas, searchTerm, filters])

  const totalPages = Math.ceil(filteredRetiradas.length / 15)

  const actions = (retirada: Retirada) => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => handleViewRetirada(retirada)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => handleEditRetirada(retirada)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <PageLayout
      title="Nova Retirada"
      searchPlaceholder="Buscar retiradas..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      onNewClick={() => setIsModalOpen(true)}
      isLoading={isLoading}
      error={error}
    >
      <div className="-mx-4">
        <DataTable 
          data={filteredRetiradas}
          columns={columns}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          actions={actions}
          filters={filters}
          filterOptions={filterOptions}
          onFilterToggle={handleFilterToggle}
          onFilterClear={handleClearFilter}
        />
      </div>

      <NovaRetiradaModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateRetirada}
      />

      {selectedRetirada && (
        <RetiradaDetailsModal
          open={!!selectedRetirada}
          onOpenChange={(open: boolean) => !open && setSelectedRetirada(null)}
          retirada={selectedRetirada}
        />
      )}

      {selectedRetiradaForEdit && (
        <EditarRetiradaModal
          open={!!selectedRetiradaForEdit}
          onOpenChange={(open: boolean) => !open && setSelectedRetiradaForEdit(null)}
          onRetiradaEdited={(updates) => {
            handleUpdateRetirada(selectedRetiradaForEdit.id, updates)
            setSelectedRetiradaForEdit(null)
          }}
          retiradaData={selectedRetiradaForEdit}
        />
      )}
    </PageLayout>
  )
} 