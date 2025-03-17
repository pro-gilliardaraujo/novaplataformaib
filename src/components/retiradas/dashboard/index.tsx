"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Retirada } from "@/types/retirada"
import { useMemo } from "react"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react"

interface RetiradaStats {
  totalRetiradas: number
  retiradosAtivos: number
  devolvidos: number
  mediaTempoRetirada: number
}

interface Props {
  retiradas: Retirada[]
  isLoading: boolean
}

export function RetiradaDashboard({ retiradas, isLoading }: Props) {
  const stats = useMemo<RetiradaStats>(() => {
    const totalRetiradas = retiradas.length
    const retiradosAtivos = retiradas.filter(r => r.retirado).length
    const devolvidos = retiradas.filter(r => !r.retirado).length
    
    // Calculate average time of items being out (in days)
    const tempoMedioRetirada = retiradas
      .filter(r => r.data_devolucao)
      .map(r => {
        const retirada = new Date(r.data_retirada)
        const devolucao = new Date(r.data_devolucao!)
        return Math.ceil((devolucao.getTime() - retirada.getTime()) / (1000 * 60 * 60 * 24))
      })
    
    const mediaTempoRetirada = tempoMedioRetirada.length > 0
      ? Math.round(tempoMedioRetirada.reduce((a, b) => a + b, 0) / tempoMedioRetirada.length)
      : 0

    return {
      totalRetiradas,
      retiradosAtivos,
      devolvidos,
      mediaTempoRetirada
    }
  }, [retiradas])

  // Get last 5 activities
  const ultimasAtividades = useMemo(() => {
    return retiradas
      .slice(0, 5)
      .map(r => ({
        ...r,
        data_formatada: formatDate(r.data_retirada)
      }))
  }, [retiradas])

  if (isLoading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="space-y-4 p-2">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Retiradas</p>
              <h2 className="text-2xl font-bold">{stats.totalRetiradas}</h2>
            </div>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Retirados Ativos</p>
              <h2 className="text-2xl font-bold">{stats.retiradosAtivos}</h2>
            </div>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Devolvidos</p>
              <h2 className="text-2xl font-bold">{stats.devolvidos}</h2>
            </div>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Média de Dias Retirado</p>
              <h2 className="text-2xl font-bold">{stats.mediaTempoRetirada}</h2>
            </div>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {ultimasAtividades.map((atividade) => (
              <Button
                key={atividade.id}
                variant="ghost"
                className="flex items-start space-x-4 p-2 rounded-lg bg-muted/50 h-auto justify-start hover:bg-muted w-full"
                onClick={() => {}}
              >
                <div className="flex-1 space-y-1 text-left">
                  <p className="text-sm font-medium leading-none">
                    {atividade.codigo_patrimonio} - {atividade.frota_instalada}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Retirado por {atividade.retirado_por}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {atividade.data_formatada}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 