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
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CustomTabs tabs={tabs} />
      </div>
    </div>
  )
} 