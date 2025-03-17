"use client"

import { CustomTabs } from "@/components/ui/custom-tabs"

export default function InventarioAtualPage() {
  const tabs = [
    {
      name: "Visão Geral",
      content: {
        type: "inventory_overview",
        settings: {
          showCategories: true,
          showLowStock: true,
          showCharts: true
        }
      }
    },
    {
      name: "Lista Detalhada",
      content: {
        type: "inventory_list",
        settings: {
          showFilters: true,
          showExport: true,
          columns: [
            'codigo_fabricante',
            'descricao',
            'categoria',
            'quantidade_atual',
            'ultima_movimentacao'
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