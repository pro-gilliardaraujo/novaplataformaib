"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Download, Search, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface InventoryAlertsProps {
  settings: {
    showFilters: boolean
    showExport: boolean
    columns: string[]
  }
}

interface Alert {
  id: string
  tipo: 'minimo' | 'critico'
  quantidade_atual: number
  nivel_configurado: number
  created_at: string
  resolvido: boolean
  resolvido_em?: string
  item: {
    id: string
    descricao: string
    codigo_fabricante: string
    categoria?: {
      nome: string
    }
  }
  responsavel?: {
    nome: string
  } | null
}

interface RawAlert {
  id: string
  tipo: 'minimo' | 'critico'
  quantidade_atual: number
  nivel_configurado: number
  created_at: string
  resolvido: boolean
  resolvido_em?: string
  item: {
    id: string
    descricao: string
    codigo_fabricante: string
    categoria: Array<{ nome: string }>
  }
  responsavel: Array<{ nome: string }> | null
}

export function InventoryAlerts({ settings }: InventoryAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFilter, setTipoFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("pendentes")

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase
        .from('alertas_estoque')
        .select(`
          id,
          tipo,
          quantidade_atual,
          nivel_configurado,
          created_at,
          resolvido,
          resolvido_em,
          item:item_id (
            id,
            descricao,
            codigo_fabricante,
            categoria:category_id (
              nome
            )
          ),
          responsavel:resolvido_por (
            nome:raw_user_meta_data->nome
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to match the Alert interface
      const transformedData = (data || []).map(raw => {
        const item = raw.item[0] || {}
        const categoria = item.categoria?.[0]
        const responsavel = raw.responsavel?.[0]

        const alert: Alert = {
          id: String(raw.id),
          tipo: raw.tipo as 'minimo' | 'critico',
          quantidade_atual: Number(raw.quantidade_atual),
          nivel_configurado: Number(raw.nivel_configurado),
          created_at: String(raw.created_at),
          resolvido: Boolean(raw.resolvido),
          resolvido_em: raw.resolvido_em ? String(raw.resolvido_em) : undefined,
          item: {
            id: String(item.id),
            descricao: String(item.descricao),
            codigo_fabricante: String(item.codigo_fabricante),
            categoria: categoria ? { nome: String(categoria.nome) } : undefined
          },
          responsavel: responsavel ? { nome: String(responsavel.nome) } : null
        }

        return alert
      })

      setAlerts(transformedData)
      setFilteredAlerts(transformedData)
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
      setError('Não foi possível carregar os alertas.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let filtered = [...alerts]

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(alert =>
        alert.item.descricao.toLowerCase().includes(searchLower) ||
        alert.item.codigo_fabricante.toLowerCase().includes(searchLower)
      )
    }

    // Apply type filter
    if (tipoFilter !== "all") {
      filtered = filtered.filter(alert => alert.tipo === tipoFilter)
    }

    // Apply status filter
    if (statusFilter === "pendentes") {
      filtered = filtered.filter(alert => !alert.resolvido)
    } else if (statusFilter === "resolvidos") {
      filtered = filtered.filter(alert => alert.resolvido)
    }

    setFilteredAlerts(filtered)
  }, [searchTerm, tipoFilter, statusFilter, alerts])

  const handleExport = () => {
    const headers = {
      data: 'Data',
      tipo: 'Tipo',
      item: 'Item',
      categoria: 'Categoria',
      quantidade: 'Quantidade',
      nivel: 'Nível Configurado',
      status: 'Status',
      resolvido_em: 'Resolvido Em',
      responsavel: 'Responsável'
    }

    const csvContent = [
      // Headers
      settings.columns.map(col => headers[col as keyof typeof headers]).join(','),
      // Data rows
      ...filteredAlerts.map(alert => 
        settings.columns.map(col => {
          switch (col) {
            case 'data':
              return format(new Date(alert.created_at), "dd/MM/yyyy HH:mm")
            case 'tipo':
              return alert.tipo === 'minimo' ? 'Nível Mínimo' : 'Nível Crítico'
            case 'item':
              return `"${alert.item.descricao} (${alert.item.codigo_fabricante})"`
            case 'categoria':
              return `"${alert.item.categoria?.nome || 'Sem Categoria'}"`
            case 'quantidade':
              return alert.quantidade_atual
            case 'nivel':
              return alert.nivel_configurado
            case 'status':
              return alert.resolvido ? 'Resolvido' : 'Pendente'
            case 'resolvido_em':
              return alert.resolvido_em
                ? format(new Date(alert.resolvido_em), "dd/MM/yyyy HH:mm")
                : 'N/A'
            case 'responsavel':
              return `"${alert.responsavel?.nome || 'N/A'}"`
            default:
              return ''
          }
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `alertas_estoque_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`
    link.click()
  }

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alertas_estoque')
        .update({
          resolvido: true,
          resolvido_em: new Date().toISOString(),
          resolvido_por: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', alertId)

      if (error) throw error

      // Reload alerts
      loadAlerts()
    } catch (error) {
      console.error('Erro ao resolver alerta:', error)
      setError('Não foi possível resolver o alerta.')
    }
  }

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
        <div className="h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {settings.showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="w-full sm:w-[200px]">
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="minimo">Nível Mínimo</SelectItem>
                <SelectItem value="critico">Nível Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-[200px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pendentes">Pendentes</SelectItem>
                <SelectItem value="resolvidos">Resolvidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {settings.showExport && (
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          )}
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {settings.columns.includes('data') && (
                <TableHead>Data</TableHead>
              )}
              {settings.columns.includes('tipo') && (
                <TableHead>Tipo</TableHead>
              )}
              {settings.columns.includes('item') && (
                <TableHead>Item</TableHead>
              )}
              {settings.columns.includes('categoria') && (
                <TableHead>Categoria</TableHead>
              )}
              {settings.columns.includes('quantidade') && (
                <TableHead className="text-right">Quantidade</TableHead>
              )}
              {settings.columns.includes('nivel') && (
                <TableHead className="text-right">Nível</TableHead>
              )}
              {settings.columns.includes('status') && (
                <TableHead>Status</TableHead>
              )}
              {settings.columns.includes('resolvido_em') && (
                <TableHead>Resolvido Em</TableHead>
              )}
              {settings.columns.includes('responsavel') && (
                <TableHead>Responsável</TableHead>
              )}
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlerts.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={settings.columns.length + 1} 
                  className="text-center h-32"
                >
                  Nenhum alerta encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  {settings.columns.includes('data') && (
                    <TableCell>
                      {format(new Date(alert.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                  )}
                  {settings.columns.includes('tipo') && (
                    <TableCell>
                      <span className={
                        alert.tipo === 'critico' ? 'text-red-600' : 'text-yellow-600'
                      }>
                        {alert.tipo === 'minimo' ? 'Nível Mínimo' : 'Nível Crítico'}
                      </span>
                    </TableCell>
                  )}
                  {settings.columns.includes('item') && (
                    <TableCell>
                      <div>
                        <span className="font-medium">{alert.item.descricao}</span>
                        <span className="text-sm text-gray-500 block">
                          {alert.item.codigo_fabricante}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  {settings.columns.includes('categoria') && (
                    <TableCell>
                      {alert.item.categoria?.nome || 'Sem Categoria'}
                    </TableCell>
                  )}
                  {settings.columns.includes('quantidade') && (
                    <TableCell className="text-right font-medium">
                      {alert.quantidade_atual}
                    </TableCell>
                  )}
                  {settings.columns.includes('nivel') && (
                    <TableCell className="text-right">
                      {alert.nivel_configurado}
                    </TableCell>
                  )}
                  {settings.columns.includes('status') && (
                    <TableCell>
                      <span className={
                        alert.resolvido ? 'text-green-600' : 'text-yellow-600'
                      }>
                        {alert.resolvido ? 'Resolvido' : 'Pendente'}
                      </span>
                    </TableCell>
                  )}
                  {settings.columns.includes('resolvido_em') && (
                    <TableCell>
                      {alert.resolvido_em
                        ? format(new Date(alert.resolvido_em), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : '-'}
                    </TableCell>
                  )}
                  {settings.columns.includes('responsavel') && (
                    <TableCell>
                      {alert.responsavel?.nome || '-'}
                    </TableCell>
                  )}
                  <TableCell>
                    {!alert.resolvido && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleResolveAlert(alert.id)}
                        title="Marcar como resolvido"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 