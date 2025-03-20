"use client"

interface InventoryMovementsSettings {
  showFilters: boolean
  showExport: boolean
  showDateRange: boolean
  columns: string[]
}

interface InventoryMovementsProps {
  settings: InventoryMovementsSettings
}

export function InventoryMovements({ settings }: InventoryMovementsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Movimentações</h2>
      
      {/* Implementar as movimentações aqui */}
      <div>Em desenvolvimento...</div>
    </div>
  )
} 