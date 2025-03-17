"use client"

import { InventoryOverview } from "./InventoryOverview"
import { InventoryList } from "./InventoryList"

interface InventoryReportProps {
  type: string
  settings: {
    showCategories?: boolean
    showLowStock?: boolean
    showCharts?: boolean
    showFilters?: boolean
    showExport?: boolean
    columns?: string[]
  }
}

export function InventoryReport({ type, settings }: InventoryReportProps) {
  switch (type) {
    case 'inventory_overview':
      return (
        <InventoryOverview
          settings={{
            showCategories: settings.showCategories ?? true,
            showLowStock: settings.showLowStock ?? true,
            showCharts: settings.showCharts ?? true
          }}
        />
      )
    case 'inventory_list':
      return (
        <InventoryList
          settings={{
            showFilters: settings.showFilters ?? true,
            showExport: settings.showExport ?? true,
            columns: settings.columns ?? [
              'codigo_fabricante',
              'descricao',
              'categoria',
              'quantidade_atual',
              'ultima_movimentacao'
            ]
          }}
        />
      )
    default:
      return (
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-gray-500">Tipo de relatório não suportado</p>
        </div>
      )
  }
} 