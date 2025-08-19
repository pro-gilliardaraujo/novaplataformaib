"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, FileText, Calendar, TrendingUp } from "lucide-react"

interface CavStats {
  totalCavs: number
  cavsRecentes: number
  cavsPendentes: number
  cavsFinalizados: number
}

export function CavVisaoGeral() {
  const [stats, setStats] = useState<CavStats>({
    totalCavs: 0,
    cavsRecentes: 0,
    cavsPendentes: 0,
    cavsFinalizados: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        // TODO: Implementar busca real de dados
        // Por enquanto, dados mockados
        setStats({
          totalCavs: 156,
          cavsRecentes: 12,
          cavsPendentes: 8,
          cavsFinalizados: 136
        })
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Carregando dados...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de CAVs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCavs}</div>
            <p className="text-xs text-muted-foreground">
              Todos os CAVs gerados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recentes (7 dias)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cavsRecentes}</div>
            <p className="text-xs text-muted-foreground">
              Gerados na última semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cavsPendentes}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando processamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cavsFinalizados}</div>
            <p className="text-xs text-muted-foreground">
              CAVs concluídos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-medium">Novo CAV</h3>
                  <p className="text-sm text-gray-500">Criar novo CAV personalizado</p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-medium">Dashboard</h3>
                  <p className="text-sm text-gray-500">Visualizar métricas e gráficos</p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <Calendar className="h-6 w-6 text-purple-600" />
                <div>
                  <h3 className="font-medium">Agendamentos</h3>
                  <p className="text-sm text-gray-500">Programar CAVs automáticos</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção de CAVs Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>CAVs Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Placeholder para CAVs recentes */}
            <div className="text-center text-gray-500 py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum CAV encontrado</p>
              <p className="text-sm">Os CAVs gerados aparecerão aqui</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
