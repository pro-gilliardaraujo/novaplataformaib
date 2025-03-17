"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabase"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Package } from "lucide-react"

interface InventoryOverviewProps {
  settings: {
    showCategories: boolean
    showLowStock: boolean
    showCharts: boolean
  }
}

interface InventorySummary {
  totalItems: number
  totalQuantity: number
  lowStockItems: number
  byCategory: {
    name: string
    itemCount: number
    totalQuantity: number
  }[]
}

export function InventoryOverview({ settings }: InventoryOverviewProps) {
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setIsLoading(true)

        // Get total items and quantity
        const { data: itemsData, error: itemsError } = await supabase
          .from('items_estoque')
          .select('id, quantidade_atual, category_id')

        if (itemsError) throw itemsError

        // Get categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categorias_item')
          .select('id, nome')

        if (categoriesError) throw categoriesError

        // Process data
        const categoriesMap = new Map(categoriesData.map(cat => [cat.id, cat.nome]))
        const byCategory = new Map<string, { itemCount: number; totalQuantity: number }>()

        let totalItems = 0
        let totalQuantity = 0
        let lowStockItems = 0

        itemsData.forEach(item => {
          totalItems++
          totalQuantity += item.quantidade_atual

          if (item.quantidade_atual < 5) { // TODO: Make this configurable
            lowStockItems++
          }

          const categoryName = item.category_id ? categoriesMap.get(item.category_id) || 'Sem Categoria' : 'Sem Categoria'
          const categoryStats = byCategory.get(categoryName) || { itemCount: 0, totalQuantity: 0 }
          categoryStats.itemCount++
          categoryStats.totalQuantity += item.quantidade_atual
          byCategory.set(categoryName, categoryStats)
        })

        setSummary({
          totalItems,
          totalQuantity,
          lowStockItems,
          byCategory: Array.from(byCategory.entries()).map(([name, stats]) => ({
            name,
            ...stats
          }))
        })
      } catch (error) {
        console.error('Erro ao carregar resumo do inventário:', error)
        setError('Não foi possível carregar o resumo do inventário.')
      } finally {
        setIsLoading(false)
      }
    }

    loadSummary()
  }, [])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <Skeleton className="h-4 w-[100px]" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        {settings.showCharts && (
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-4 w-[200px]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Itens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quantidade Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalQuantity}</div>
          </CardContent>
        </Card>
        {settings.showLowStock && (
          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Itens com Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {summary.lowStockItems}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {settings.showCategories && settings.showCharts && summary.byCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar 
                    yAxisId="left"
                    dataKey="itemCount" 
                    name="Quantidade de Itens"
                    fill="#1e293b" 
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="totalQuantity" 
                    name="Quantidade Total"
                    fill="#94a3b8" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 