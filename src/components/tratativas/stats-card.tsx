"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: number
  icon: React.ReactNode
  valueClassName?: string
}

export function StatsCard({ title, value, icon, valueClassName }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h2 className={cn("text-2xl font-bold", valueClassName)}>{value.toString()}</h2>
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  )
} 