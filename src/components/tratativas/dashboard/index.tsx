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
import { NovaTratativaModal } from "@/components/nova-tratativa-modal"

interface TratativasDashboardProps {
  tratativas: Tratativa[]
  onTratativaEdited: () => void
}

export function TratativasDashboard({ tratativas, onTratativaEdited }: TratativasDashboardProps) {
  const [isNovaTratativaModalOpen, setIsNovaTratativaModalOpen] = useState(false)
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

  const calculateStats = (tratativas: Tratativa[]) => {
    const stats = {
      total: tratativas.length,
      enviadas: tratativas.filter(t => t.status === "ENVIADA").length,
      devolvidas: tratativas.filter(t => t.status === "DEVOLVIDA").length,
      canceladas: tratativas.filter(t => t.status === "CANCELADA").length
    }
    return stats
  }

  const calculateSetores = (tratativas: Tratativa[]) => {
    const setores: Record<string, number> = {}
    tratativas.forEach(tratativa => {
      const setor = tratativa.setor
      setores[setor] = (setores[setor] || 0) + 1
    })
    return setores
  }

  useEffect(() => {
    const lastDocumentNumber = tratativas.reduce((max, t) => {
      const num = parseInt(t.numero_tratativa || "0", 10)
      return num > max ? num : max
    }, 0).toString().padStart(4, "0")

    const stats = calculateStats(tratativas)
    const setores = calculateSetores(tratativas)
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
          valueClassName="text-black"
        />
        <StatsCard
          title="Em Andamento"
          value={data.stats.enviadas}
          icon={<Clock className="h-4 w-4 text-[#FFA500]" />}
          valueClassName="text-[#FFA500]"
        />
        <StatsCard
          title="Devolvidas"
          value={data.stats.devolvidas}
          icon={<CheckCircle className="h-4 w-4 text-[#22C55E]" />}
          valueClassName="text-[#22C55E]"
        />
        <StatsCard
          title="Canceladas"
          value={data.stats.canceladas}
          icon={<XCircle className="h-4 w-4 text-[#EF4444]" />}
          valueClassName="text-[#EF4444]"
        />
        <Card className="p-2">
          <Button
            className="bg-black hover:bg-black/90 text-white h-full w-full"
            onClick={() => setIsNovaTratativaModalOpen(true)}
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
                <CardTitle className="text-lg font-semibold text-center">Status das Tratativas</CardTitle>
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
                <CardTitle className="text-lg font-semibold text-center">Tratativas por Setor</CardTitle>
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
            <CardTitle className="text-lg font-semibold text-center">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-0 overflow-auto">
              <RecentActivity 
                recentTratativas={recentTratativas}
                hideTitle
                onTratativaDeleted={onTratativaEdited}
              />
            </div>
          </CardContent>
        </Card>
        {/* Pending Activity Card */}
        <Card className="p-2">
          <CardHeader className="p-2">
            <CardTitle className="text-lg font-semibold text-center">Tratativas Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-0 overflow-auto">
              <PendingTratativas 
                tratativas={tratativas.filter(t => t.status === "ENVIADA").slice(0, 5)}
                hideTitle
                onTratativaDeleted={onTratativaEdited}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <NovaTratativaModal
        open={isNovaTratativaModalOpen}
        onOpenChange={setIsNovaTratativaModalOpen}
        onTratativaAdded={() => {
          // Recarregar os dados após adicionar uma nova tratativa
          const newStats = calculateStats(tratativas)
          const newSetores = calculateSetores(tratativas)
          setData(prev => ({
            ...prev,
            stats: newStats,
            setores: newSetores
          }))
        }}
        lastDocumentNumber={tratativas[0]?.numero_tratativa || "1000"}
      />
    </div>
  )
} 