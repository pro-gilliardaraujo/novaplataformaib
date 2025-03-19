"use client"

import { InventoryReport } from "./reports/inventory/InventoryReport"
import { InventoryMovements } from "./reports/inventory/InventoryMovements"

interface DynamicContentRendererProps {
  content: {
    type: string
    settings?: any
  }
}

export function DynamicContentRenderer({ content }: DynamicContentRendererProps) {
  const { type, settings = {} } = content

  // Inventory reports
  if (type === 'inventory_overview' || type === 'inventory_list') {
    return <InventoryReport type={type} settings={settings} />
  }

  // Inventory movements
  if (type === 'inventory_movements') {
    return <InventoryMovements settings={settings} />
  }

  // Default fallback
  return (
    <div className="flex items-center justify-center h-[400px]">
      <p className="text-gray-500">Tipo de conteúdo não suportado</p>
    </div>
  )
} 