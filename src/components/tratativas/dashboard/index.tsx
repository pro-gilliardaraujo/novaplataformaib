"use client"

import { useState, useEffect } from "react"
import { StatsCard } from "@/components/tratativas/stats-card"
import { TratativasPorSetor } from "@/components/tratativas/tratativas-por-setor"
import { TratativasStatusChart } from "@/components/tratativas/tratativas-status-chart"
import { RecentActivity } from "@/components/tratativas/recent-activity"
import { PendingTratativas } from "@/components/tratativas/pending-tratativas"
import { Tratativa } from "@/types/tratativas"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, CheckCircle, XCircle, Plus } from "lucide-react"
import { subDays } from "date-fns"

interface TratativasDashboardProps {
  tratativas: Tratativa[]
}

export function TratativasDashboard({ tratativas }: TratativasDashboardProps) {
  const [data, setData] = useState<{
    stats: {
      total: number
      enviadas: number
      devolvidas: number
      canceladas: number
    }
    setores: Record<string, number>
    lastDocumentNumber: string
  }>({
    stats: { total: 0, enviadas: 0, devolvidas: 0, canceladas: 0 },
    setores: {},
    lastDocumentNumber: "1000"
  })

  useEffect(() => {
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

    const setores = tratativas.reduce((acc: Record<string, number>, t) => {
      const setor = t.setor || 'Não especificado'
      acc[setor] = (acc[setor] || 0) + 1
      return acc
    }, {})

    setData({ stats, setores, lastDocumentNumber })
  }, [tratativas])

  // Filter last 7 days activities
  const recentTratativas = tratativas.filter(t => {
    const date = new Date(t.created_at)
    const sevenDaysAgo = subDays(new Date(), 7)
    return date >= sevenDaysAgo
  }).slice(0, 5)

  return (
    <div className="h-full flex flex-col gap-2 p-2">
      {/* SECTION 1: STATS CARDS AND QUICK ACCESS */}
      <div className="grid grid-cols-5 gap-2">
        <StatsCard
          title="Total de Tratativas"
          value={data.stats.total}
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatsCard
          title="Em Andamento"
          value={data.stats.enviadas}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatsCard
          title="Devolvidas"
          value={data.stats.devolvidas}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatsCard
          title="Canceladas"
          value={data.stats.canceladas}
          icon={<XCircle className="h-4 w-4" />}
        />
        <Card className="p-2">
          <Button
            className="bg-black hover:bg-black/90 text-white h-full w-full"
            onClick={() => {}}
          >
            <Plus className="mr-2 h-4 w-4" /> Nova Tratativa
          </Button>
        </Card>
      </div>

      {/* SECTION 2: CHARTS */}
      <div className="grid grid-cols-2 gap-2 h-[300px]">
        {data.stats.total > 0 && (
          <>
            {/* Status Chart Card */}
            <Card className="p-2">
              <CardHeader className="p-2">
                <CardTitle className="text-lg font-semibold">Status das Tratativas</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="h-[220px]">
                  <TratativasStatusChart
                    enviadas={data.stats.enviadas}
                    devolvidas={data.stats.devolvidas}
                    canceladas={data.stats.canceladas}
                  />
                </div>
              </CardContent>
            </Card>
            {/* Sector Chart Card */}
            <Card className="p-2">
              <CardHeader className="p-2">
                <CardTitle className="text-lg font-semibold">Tratativas por Setor</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="h-[220px]">
                  <TratativasPorSetor data={data.setores} />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* SECTION 3: ACTIVITY LISTS */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        {/* Recent Activity Card */}
        <Card className="p-2">
          <CardHeader className="p-2">
            <CardTitle className="text-lg font-semibold">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-0 overflow-auto">
              <RecentActivity 
                recentTratativas={recentTratativas}
                hideTitle
              />
            </div>
          </CardContent>
        </Card>
        {/* Pending Activity Card */}
        <Card className="p-2">
          <CardHeader className="p-2">
            <CardTitle className="text-lg font-semibold">Tratativas Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-0 overflow-auto">
              <PendingTratativas 
                tratativas={tratativas.filter(t => t.status === "ENVIADA").slice(0, 5)}
                hideTitle
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 