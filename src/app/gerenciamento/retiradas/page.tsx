"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageLayout } from "@/components/page-layout"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Retirada, NovaRetiradaData, UpdateRetiradaData } from "@/types/retirada"
import { useToast } from "@/components/ui/use-toast"
import { retiradaService } from "@/services/retiradas"
import { NovaRetiradaModal } from "@/components/nova-retirada-modal"
import RetiradaDetailsModal from "@/components/retirada-details-modal"
import { EditarRetiradaModal } from "@/components/editar-retirada-modal"
import { RetiradaDashboard } from "@/components/retiradas/dashboard"
import { RetiradaTable } from "@/components/retiradas/table"

export default function RetiradasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [retiradas, setRetiradas] = useState<Retirada[]>([])
  const [selectedRetirada, setSelectedRetirada] = useState<Retirada | null>(null)
  const [selectedRetiradaForEdit, setSelectedRetiradaForEdit] = useState<Retirada | null>(null)
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

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="overview" className="flex-1">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-2">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="list" className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground">
            Lista Detalhada
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 p-2">
          <TabsContent value="overview" className="h-full m-0">
            <RetiradaDashboard retiradas={retiradas} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="list" className="h-full m-0">
            <RetiradaTable
              retiradas={retiradas}
              isLoading={isLoading}
              onViewRetirada={handleViewRetirada}
              onEditRetirada={handleEditRetirada}
              onNewRetirada={() => setIsModalOpen(true)}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Modals */}
      <NovaRetiradaModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateRetirada}
      />

      {selectedRetirada && (
        <RetiradaDetailsModal
          retirada={selectedRetirada}
          open={!!selectedRetirada}
          onOpenChange={(open) => !open && setSelectedRetirada(null)}
          onEdit={handleEditRetirada}
        />
      )}

      {selectedRetiradaForEdit && (
        <EditarRetiradaModal
          retirada={selectedRetiradaForEdit}
          open={!!selectedRetiradaForEdit}
          onOpenChange={(open) => !open && setSelectedRetiradaForEdit(null)}
          onSubmit={handleUpdateRetirada}
        />
      )}
    </div>
  )
} 