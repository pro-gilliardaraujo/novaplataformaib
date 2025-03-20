"use client"

interface InventoryOverviewSettings {
  showCategories: boolean
  showLowStock: boolean
  showCharts: boolean
}

interface InventoryOverviewProps {
  settings: InventoryOverviewSettings
}

export function InventoryOverview({ settings }: InventoryOverviewProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Visão Geral do Estoque</h2>
      
      {/* Implementar a visão geral aqui */}
      <div>Em desenvolvimento...</div>
    </div>
  )
} 