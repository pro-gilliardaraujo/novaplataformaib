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
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react"

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
    lastDocumentNumber: string
  }>({
    tratativas: [],
    stats: { total: 0, enviadas: 0, devolvidas: 0, canceladas: 0 },
    setores: {},
    lastDocumentNumber: "1000"
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

        // Calculate last document number
        const lastDocumentNumber = tratativas.reduce((max, t) => {
          const num = parseInt(t.numero_tratativa || "0", 10)
          return num > max ? num : max
        }, 0).toString().padStart(4, "0")

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
          setores,
          lastDocumentNumber
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
    <div className="h-[calc(100vh)] overflow-hidden">
      {/* Main Dashboard Container */}
      <div className="grid grid-rows-[120px_minmax(0,1.2fr)_minmax(0,1fr)] h-full gap-2 p-2">
        {/* SECTION 1: STATS CARDS & QUICK ACCESS */}
        <div className="grid grid-cols-5 gap-2 h-full">
          {/* Stats Cards */}
          <div>
            <Card className="h-full">
              <CardContent className="flex items-center justify-between h-full p-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-base sm:text-lg font-bold text-blue-600">{data.stats.total}</p>
                </div>
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="h-full">
              <CardContent className="flex items-center justify-between h-full p-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Enviadas</p>
                  <p className="text-base sm:text-lg font-bold text-yellow-600">{data.stats.enviadas}</p>
                </div>
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="h-full">
              <CardContent className="flex items-center justify-between h-full p-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Devolvidas</p>
                  <p className="text-base sm:text-lg font-bold text-green-600">{data.stats.devolvidas}</p>
                </div>
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="h-full">
              <CardContent className="flex items-center justify-between h-full p-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Canceladas</p>
                  <p className="text-base sm:text-lg font-bold text-red-600">{data.stats.canceladas}</p>
                </div>
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </CardContent>
            </Card>
          </div>
          {/* Quick Access Card */}
          <div>
            <Card className="h-full flex flex-col">
              <CardHeader className="py-1.5 flex-none">
                <CardTitle className="text-lg font-semibold text-center">Acesso Rápido</CardTitle>
              </CardHeader>
              <CardContent className="p-2 flex-1">
                <QuickAccess 
                  onTratativaAdded={fetchData} 
                  lastDocumentNumber={data.lastDocumentNumber}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SECTION 2: CHARTS */}
        <div className="grid grid-cols-2 gap-2 h-full">
          {data.stats.total > 0 && (
            <>
              {/* Status Chart Card */}
              <Card className="h-full w-full flex flex-col">
                <CardHeader className="py-1.5 flex-none">
                  <CardTitle className="text-lg font-semibold text-center">Status das Tratativas</CardTitle>
                </CardHeader>
                <CardContent className="p-2 flex-1">
                  <div className="h-full w-full">
                    <TratativasStatusChart
                      enviadas={data.stats.enviadas}
                      devolvidas={data.stats.devolvidas}
                      canceladas={data.stats.canceladas}
                    />
                  </div>
                </CardContent>
              </Card>
              {/* Sector Chart Card */}
              <Card className="h-full w-full flex flex-col">
                <CardHeader className="py-1.5 flex-none">
                  <CardTitle className="text-lg font-semibold text-center">Tratativas por Setor</CardTitle>
                </CardHeader>
                <CardContent className="p-2 flex-1">
                  <div className="h-full w-full">
                    <TratativasPorSetor data={data.setores} />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* SECTION 3: ACTIVITY LISTS */}
        <div className="grid grid-cols-2 gap-2 h-full">
          {/* Recent Activity Card */}
          <Card className="h-full w-full flex flex-col">
            <CardHeader className="py-1.5 flex-none">
              <CardTitle className="text-lg font-semibold text-center">Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex-1 overflow-auto">
              <RecentActivity 
                recentTratativas={data.tratativas.slice(0, 5)} 
                hideTitle
              />
            </CardContent>
          </Card>
          {/* Pending Activity Card */}
          <Card className="h-full w-full flex flex-col">
            <CardHeader className="py-1.5 flex-none">
              <CardTitle className="text-lg font-semibold text-center">Tratativas Pendentes</CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex-1 overflow-auto">
              <PendingTratativas 
                tratativas={data.tratativas.filter(t => t.status === "ENVIADA").slice(0, 5)} 
                hideTitle
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 