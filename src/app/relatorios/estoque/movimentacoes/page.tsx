"use client"

import { CustomTabs } from "@/components/ui/custom-tabs"

export default function MovimentacoesPage() {
  const tabs = [
    {
      name: "Movimentações",
      content: {
        type: "inventory_movements",
        settings: {
          showFilters: true,
          showExport: true,
          showDateRange: true,
          columns: [
            'data',
            'tipo',
            'motivo',
            'quantidade',
            'item',
            'responsavel'
          ]
        }
      }
    }
  ]

  return (
    <div className="h-full p-4">
      <CustomTabs tabs={tabs} />
    </div>
  )
} 