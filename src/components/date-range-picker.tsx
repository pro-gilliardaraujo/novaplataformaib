"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface DateRangePickerProps {
  className?: string
  date: DateRange | undefined
  onChange: (date: DateRange | undefined) => void
}

export function DateRangePicker({
  className,
  date,
  onChange
}: DateRangePickerProps) {
  const [selectedPreset, setSelectedPreset] = React.useState<string>("")

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset)
    const today = new Date()
    const from = new Date()
    const to = new Date()

    switch (preset) {
      case "hoje":
        onChange({ from: today, to: today })
        break
      case "ontem": {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        onChange({ from: yesterday, to: yesterday })
        break
      }
      case "ultimos7dias": {
        from.setDate(today.getDate() - 6)
        onChange({ from, to: today })
        break
      }
      case "ultimos30dias": {
        from.setDate(today.getDate() - 29)
        onChange({ from, to: today })
        break
      }
      case "mesAtual": {
        from.setDate(1)
        onChange({ from, to: today })
        break
      }
      case "mesAnterior": {
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        from.setDate(1)
        from.setMonth(from.getMonth() - 1)
        to.setDate(0)
        onChange({ from, to })
        break
      }
      case "todos":
        onChange(undefined)
        break
      default:
        onChange(undefined)
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'from' | 'to') => {
    const value = e.target.value
    if (!value) return

    setSelectedPreset("")
    const newDate = new Date(value)
    
    if (type === 'from') {
      onChange({ from: newDate, to: date?.to })
    } else {
      onChange({ from: date?.from, to: newDate })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hoje">Hoje</SelectItem>
          <SelectItem value="ontem">Ontem</SelectItem>
          <SelectItem value="ultimos7dias">Últimos 7 dias</SelectItem>
          <SelectItem value="ultimos30dias">Últimos 30 dias</SelectItem>
          <SelectItem value="mesAtual">Mês atual</SelectItem>
          <SelectItem value="mesAnterior">Mês anterior</SelectItem>
          <SelectItem value="todos">Todas as movimentações</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <input
          type="date"
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={date?.from ? format(date.from, "yyyy-MM-dd") : ""}
          onChange={(e) => handleDateChange(e, 'from')}
        />
        <span className="text-sm text-muted-foreground">até</span>
        <input
          type="date"
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={date?.to ? format(date.to, "yyyy-MM-dd") : ""}
          onChange={(e) => handleDateChange(e, 'to')}
        />
      </div>
    </div>
  )
} 