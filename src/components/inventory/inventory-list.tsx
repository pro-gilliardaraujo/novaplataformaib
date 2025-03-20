"use client"

interface InventoryListSettings {
  showFilters: boolean
  showExport: boolean
  columns: string[]
}

interface InventoryListProps {
  settings: InventoryListSettings
}

export function InventoryList({ settings }: InventoryListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Lista Detalhada</h2>
      
      {/* Implementar a lista detalhada aqui */}
      <div>Em desenvolvimento...</div>
    </div>
  )
} 