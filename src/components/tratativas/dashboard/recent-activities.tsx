"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Tratativa } from "@/types/tratativas"

interface RecentActivitiesProps {
  tratativas: Tratativa[]
}

export function RecentActivities({ tratativas }: RecentActivitiesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {tratativas.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade recente
              </div>
            ) : (
              tratativas.map((tratativa) => (
                <div
                  key={tratativa.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Tratativa #{tratativa.numero_tratativa}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tratativa.funcionario}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{tratativa.status}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(tratativa.created_at), "dd/MM/yyyy", {
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