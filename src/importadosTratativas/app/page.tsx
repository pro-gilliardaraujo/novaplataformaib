"use client"

import { useState, useEffect, useCallback } from "react"
import { StatsCard } from "@/components/stats-card"
import { QuickAccess } from "@/components/quick-access"
import { TratativasPorSetor } from "@/components/tratativas-por-setor"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { TratativasStatusChart } from "@/components/tratativas-status-chart"
import { RecentActivity } from "@/components/recent-activity"
import { PendingTratativas } from "@/components/pending-tratativas"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

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

interface DashboardData {
  totalTratativas: number
  trataticasEnviadas: number
  tratativasDevolvidas: number
  tratativasCanceladas: number
  recentTratativas: Tratativa[]
  tratativasPorSetor: Record<string, number>
  tratativasNaoDevolvidas: Tratativa[]
  setores: string[]
  statusOptions: string[]
}

const fallbackData: DashboardData = {
  totalTratativas: 0,
  trataticasEnviadas: 0,
  tratativasDevolvidas: 0,
  tratativasCanceladas: 0,
  recentTratativas: [],
  tratativasPorSetor: {},
  tratativasNaoDevolvidas: [],
  setores: [],
  statusOptions: [],
}

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardData>(fallbackData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tratativas, setTratativas] = useState<Tratativa[]>([])

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

  useEffect(() => {
    const processData = () => {
      const processedData: DashboardData = {
        totalTratativas: tratativas.length,
        trataticasEnviadas: tratativas.filter((t: Tratativa) => t.status === "ENVIADA").length,
        tratativasDevolvidas: tratativas.filter((t: Tratativa) => t.status === "DEVOLVIDA").length,
        tratativasCanceladas: tratativas.filter((t: Tratativa) => t.status === "CANCELADA").length,
        recentTratativas: tratativas.slice(0, 5),
        tratativasPorSetor: tratativas.reduce((acc: Record<string, number>, t: Tratativa) => {
          acc[t.setor] = (acc[t.setor] || 0) + 1
          return acc
        }, {}),
        tratativasNaoDevolvidas: tratativas.filter((t: Tratativa) => t.status === "ENVIADA").slice(0, 5),
        setores: Array.from(new Set(tratativas.map((t: Tratativa) => t.setor))),
        statusOptions: Array.from(new Set(tratativas.map((t: Tratativa) => t.status))),
      }
      setDashboardData(processedData)
    }

    if (!isLoading) {
      processData()
    }
  }, [tratativas, isLoading])

  const handleTratativaAdded = () => {
    fetchTratativas()
  }

  if (isLoading) {
    return <div className="p-6">Carregando dados do dashboard...</div>
  }

  return (
    <div className="flex flex-col min-h-screen p-4 space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={() => fetchTratativas()} className="ml-2">
            Tentar novamente
          </Button>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <StatsCard title="Total" value={dashboardData.totalTratativas.toString()} icon="total" />
            <StatsCard title="Enviadas" value={dashboardData.trataticasEnviadas.toString()} icon="pending" />
            <StatsCard title="Devolvidas" value={dashboardData.tratativasDevolvidas.toString()} icon="completed" />
            <StatsCard title="Canceladas" value={dashboardData.tratativasCanceladas.toString()} icon="canceled" />
          </div>
        </div>
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-center">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickAccess onTratativaAdded={handleTratativaAdded} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ height: "400px" }}>
        <TratativasStatusChart
          enviadas={dashboardData.trataticasEnviadas}
          devolvidas={dashboardData.tratativasDevolvidas}
          canceladas={dashboardData.tratativasCanceladas}
        />
        <TratativasPorSetor data={dashboardData.tratativasPorSetor} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
        <RecentActivity recentTratativas={dashboardData.recentTratativas} />
        <PendingTratativas tratativas={dashboardData.tratativasNaoDevolvidas} />
      </div>
    </div>
  )
}

