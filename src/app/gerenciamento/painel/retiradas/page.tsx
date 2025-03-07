"use client"

import { useState, useEffect } from "react"
import { RetiradaTable } from "@/components/retirada-table"
import { NovaRetiradaModal } from "@/components/nova-retirada-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Retirada, NovaRetiradaData, UpdateRetiradaData } from "@/types/retirada"
import { useToast } from "@/components/ui/use-toast"
import { retiradaService } from "@/services/retiradas"

export default function RetiradasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [retiradas, setRetiradas] = useState<Retirada[]>([])
  const { toast } = useToast()

  const fetchRetiradas = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await retiradaService.list()
      console.log('Retiradas fetched:', data) // This will help us see the data in the console
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
      throw error // Re-throw to be handled by the modal's error handling
    }
  }

  const handleUpdateRetirada = async (id: string, updates: UpdateRetiradaData) => {
    try {
      await retiradaService.update(id, updates)
      toast({
        title: "Retirada Atualizada",
        description: "Retirada atualizada com sucesso!",
      })
      await fetchRetiradas() // Refresh the list to get the latest data
    } catch (error) {
      console.error("Error updating retirada:", error)
      throw new Error("Erro ao atualizar retirada")
    }
  }

  const filteredRetiradas = retiradas.filter(r => 
    Object.values(r).some(value => 
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <div className="h-screen flex flex-col p-4 bg-white">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-3 bg-white">
        <Input 
          className="max-w-md" 
          placeholder="Buscar retiradas..." 
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          className="bg-black hover:bg-black/90 text-white"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Retirada
        </Button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Table with fixed height */}
        <div className="flex-1">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">Carregando retiradas...</div>
          ) : (
            <RetiradaTable 
              retiradas={filteredRetiradas}
              onRetiradaUpdated={handleUpdateRetirada}
            />
          )}
        </div>
      </div>

      <NovaRetiradaModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateRetirada}
      />
    </div>
  )
} 