"use client"

import { useState, useEffect } from "react"
import { StatsCard } from "@/components/tratativas/stats-card"
import { QuickAccess } from "@/components/tratativas/quick-access"
import { TratativasPorSetor } from "@/components/tratativas/tratativas-por-setor"
import { TratativasStatusChart } from "@/components/tratativas/tratativas-status-chart"
import { RecentActivity } from "@/components/tratativas/recent-activity"
import { PendingTratativas } from "@/components/tratativas/pending-tratativas"
import { Tratativa } from "@/types/tratativas"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function DashboardPage() {
  const [data, setData] = useState<{
    tratativas: Tratativa[]
    stats: {
      total: number
      enviadas: number
      devolvidas: number
      canceladas: number
    }
    setores: Record<string, number>
  }>({
    tratativas: [],
    stats: { total: 0, enviadas: 0, devolvidas: 0, canceladas: 0 },
    setores: {},
  })

  const fetchData = async () => {
    console.log('Fetching data...')
    try {
      const response = await fetch('https://iblogistica.ddns.net:3000/api/tratativa/list', {
        headers: {
          'Accept': 'application/json'
        }
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('API Response:', result)
      
      if (result.status === 'success' && Array.isArray(result.data)) {
        console.log('Processing', result.data.length, 'tratativas')
        const tratativas: Tratativa[] = result.data.map((item: any) => ({
          ...item,
          status: item.status?.toUpperCase() || 'ENVIADA'
        }))

        const stats = {
          total: tratativas.length,
          enviadas: tratativas.filter(t => t.status === "ENVIADA").length,
          devolvidas: tratativas.filter(t => t.status === "DEVOLVIDA").length,
          canceladas: tratativas.filter(t => t.status === "CANCELADA").length,
        }
        console.log('Calculated stats:', stats)

        const setores = tratativas.reduce((acc: Record<string, number>, t) => {
          const setor = t.setor || 'Não especificado'
          acc[setor] = (acc[setor] || 0) + 1
          return acc
        }, {})
        console.log('Setores distribution:', setores)

        setData({ 
          tratativas: tratativas.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ),
          stats, 
          setores 
        })
        console.log('State updated successfully')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  useEffect(() => {
    console.log('Dashboard component mounted')
    fetchData()

    const intervalId = setInterval(fetchData, 30000)
    return () => {
      console.log('Dashboard component unmounting')
      clearInterval(intervalId)
    }
  }, [])

  console.log('Rendering with data:', data)

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 space-y-6">
      {/* First Section - Stats and Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="grid grid-cols-2 gap-6">
            <StatsCard title="Total" value={data.stats.total.toString()} icon="total" />
            <StatsCard title="Enviadas" value={data.stats.enviadas.toString()} icon="pending" />
            <StatsCard title="Devolvidas" value={data.stats.devolvidas.toString()} icon="completed" />
            <StatsCard title="Canceladas" value={data.stats.canceladas.toString()} icon="canceled" />
          </div>
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-center">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickAccess onTratativaAdded={fetchData} />
          </CardContent>
        </Card>
      </div>

      {/* Second Section - Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {data.stats.total > 0 && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-center">Status das Tratativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <TratativasStatusChart
                    enviadas={data.stats.enviadas}
                    devolvidas={data.stats.devolvidas}
                    canceladas={data.stats.canceladas}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-center">Tratativas por Setor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <TratativasPorSetor data={data.setores} />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Third Section - Activity Lists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-center">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] overflow-auto">
            <RecentActivity 
              recentTratativas={data.tratativas.slice(0, 5)} 
              hideTitle
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-center">Tratativas Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] overflow-auto">
            <PendingTratativas 
              tratativas={data.tratativas.filter(t => t.status === "ENVIADA").slice(0, 5)} 
              hideTitle
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 