"use client"
import { useState, useEffect, useCallback } from "react"
import { TratativasTable } from "@/components/tratativas-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { NovaTratativaModal } from "@/components/nova-tratativa-modal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

// Add the supabase client after the imports
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Tratativa {
  id: number
  numero_documento: string
  nome_funcionario: string
  funcao: string
  setor: string
  data_formatada: string
  codigo_infracao: string
  infracao_cometida: string
  data_infracao: string
  hora_infracao: string
  penalidade: string
  penalidade_aplicada: string
  nome_lider: string
  texto_excesso: string
  texto_limite: string
  status: string
  documento_url: string
  created_at: string
}

export default function TratativasPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [tratativas, setTratativas] = useState<Tratativa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastDocumentNumber, setLastDocumentNumber] = useState("999")

  const fetchTratativas = useCallback(async (retryCount = 0) => {
    try {
      setIsLoading(true)
      const response = await fetch("https://iblogistica.ddns.net:3000/api/tratativa/list")
      if (!response.ok) {
        throw new Error("Failed to fetch tratativas")
      }
      const data = await response.json()
      console.log("Received data:", data) // Log the received data for debugging
      if (data.status === "success" && Array.isArray(data.data)) {
        setTratativas(data.data)
      } else {
        console.error("Unexpected response structure:", data)
        throw new Error("Unexpected response format")
      }
    } catch (err) {
      console.error("Error fetching tratativas:", err)
      if (retryCount < 3) {
        console.log(`Retrying... Attempt ${retryCount + 1}`)
        setTimeout(() => fetchTratativas(retryCount + 1), 1000 * (retryCount + 1))
      } else {
        setError(err instanceof Error ? err.message : "An error occurred while fetching tratativas")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTratativas()
  }, [fetchTratativas])

  const handleTratativaAdded = () => {
    fetchTratativas()
  }

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

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <Input className="max-w-md" placeholder="Buscar tratativas..." type="search" />
          <Button
            className="bg-black hover:bg-black/90 text-white"
            onClick={async () => {
              await fetchLastDocumentNumber()
              setModalOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Nova Tratativa
          </Button>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isLoading ? <div>Carregando tratativas...</div> : <TratativasTable tratativas={tratativas} />}
        <NovaTratativaModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onTratativaAdded={handleTratativaAdded}
          lastDocumentNumber={lastDocumentNumber}
          mockData={null}
        />
      </div>
    </div>
  )
}

