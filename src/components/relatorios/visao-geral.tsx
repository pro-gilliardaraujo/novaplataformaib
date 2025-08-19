"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, FileText, Calendar, TrendingUp } from "lucide-react"

interface RelatorioStats {
  totalRelatorios: number
  relatoriosRecentes: number
  relatoriosPendentes: number
  relatoriosFinalizados: number
}

export function RelatoriosVisaoGeral() {
  const [stats, setStats] = useState<RelatorioStats>({
    totalRelatorios: 0,
    relatoriosRecentes: 0,
    relatoriosPendentes: 0,
    relatoriosFinalizados: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        // TODO: Implementar busca real de dados
        // Por enquanto, dados mockados
        setStats({
          totalRelatorios: 156,
          relatoriosRecentes: 12,
          relatoriosPendentes: 8,
          relatoriosFinalizados: 136
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
            <CardTitle className="text-sm font-medium">Total de Relatórios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRelatorios}</div>
            <p className="text-xs text-muted-foreground">
              Todos os relatórios gerados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recentes (7 dias)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.relatoriosRecentes}</div>
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
            <div className="text-2xl font-bold">{stats.relatoriosPendentes}</div>
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
            <div className="text-2xl font-bold">{stats.relatoriosFinalizados}</div>
            <p className="text-xs text-muted-foreground">
              Relatórios concluídos
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
                  <h3 className="font-medium">Novo Relatório</h3>
                  <p className="text-sm text-gray-500">Criar novo relatório personalizado</p>
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
                  <p className="text-sm text-gray-500">Programar relatórios automáticos</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Relatórios Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Placeholder para relatórios recentes */}
            <div className="text-center text-gray-500 py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum relatório encontrado</p>
              <p className="text-sm">Os relatórios gerados aparecerão aqui</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
