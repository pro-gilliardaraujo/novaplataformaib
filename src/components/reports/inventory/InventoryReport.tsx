"use client"

import { useState, useEffect } from "react"
import { InventoryOverview } from "./InventoryOverview"
import { InventoryList } from "./InventoryList"
import { supabase } from "@/lib/supabase"

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
  const [categorias, setCategorias] = useState<{ id: string; nome: string; cor?: string }[]>([])

  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_item')
        .select('id, nome, cor')
        .order('nome')

      if (error) throw error
      setCategorias(data || [])
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  useEffect(() => {
    loadCategorias()
  }, [])

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
          categorias={categorias}
          onCategoriaCreated={loadCategorias}
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