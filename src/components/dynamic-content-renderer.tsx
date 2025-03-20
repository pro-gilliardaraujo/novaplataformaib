"use client"

import { useState, useEffect } from "react"
import { InventoryReport } from "./reports/inventory/InventoryReport"
import { InventoryMovements } from "./reports/inventory/InventoryMovements"
import { supabase } from "@/lib/supabase"

interface DynamicContentRendererProps {
  content: {
    type: string
    settings?: any
  }
}

interface CategoriaItem {
  id: string
  nome: string
  cor?: string
}

export function DynamicContentRenderer({ content }: DynamicContentRendererProps) {
  const { type, settings = {} } = content
  const [categorias, setCategorias] = useState<CategoriaItem[]>([])

  useEffect(() => {
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

    if (type === 'inventory_overview' || type === 'inventory_list') {
      loadCategorias()
    }
  }, [type])

  // Inventory reports
  if (type === 'inventory_overview' || type === 'inventory_list') {
    return <InventoryReport type={type} settings={settings} categorias={categorias} />
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