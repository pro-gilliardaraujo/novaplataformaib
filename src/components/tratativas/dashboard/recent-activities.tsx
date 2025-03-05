"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { supabase } from "@/lib/supabase"

interface Activity {
  id: string
  numero_tratativa: string
  funcionario: string
  data_infracao: string
  status: string
  created_at: string
}

export function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivities()
  }, [])

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("tratativas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error("Erro ao carregar atividades recentes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {isLoading ? (
              <div>Carregando...</div>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Tratativa #{activity.numero_tratativa}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.funcionario}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{activity.status}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(activity.created_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 