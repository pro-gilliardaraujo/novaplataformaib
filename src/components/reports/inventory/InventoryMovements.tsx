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
import { AlertTriangle, Download, Search } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { addDays } from "date-fns"
import { DateRange } from "react-day-picker"

interface InventoryMovementsProps {
  settings: {
    showFilters: boolean
    showExport: boolean
    showDateRange: boolean
    columns: string[]
  }
}

interface Movement {
  id: string
  created_at: string
  tipo_movimentacao: 'entrada' | 'saida' | 'ajuste'
  motivo: string
  quantidade: number
  observacoes?: string
  item: {
    descricao: string
    codigo_fabricante: string
  }
  responsavel?: {
    nome: string
  } | null
}

const MOTIVOS = {
  compra: 'Compra',
  devolucao: 'Devolução',
  uso: 'Uso em Operação',
  perda: 'Perda/Avaria',
  inventario: 'Ajuste de Inventário',
}

export function InventoryMovements({ settings }: InventoryMovementsProps) {
  const [movements, setMovements] = useState<Movement[]>([])
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFilter, setTipoFilter] = useState<string>("all")
  const [motivoFilter, setMotivoFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -30),
    to: new Date()
  })

  useEffect(() => {
    const loadMovements = async () => {
      try {
        setIsLoading(true)

        const { data, error } = await supabase
          .from('historico_estoque')
          .select(`
            id,
            created_at,
            tipo_movimentacao,
            motivo,
            quantidade,
            observacoes,
            item:item_id (
              descricao,
              codigo_fabricante
            ),
            responsavel:responsavel_id (
              nome:raw_user_meta_data->nome
            )
          `)
          .gte('created_at', dateRange.from?.toISOString())
          .lte('created_at', (dateRange.to || new Date()).toISOString())
          .order('created_at', { ascending: false })

        if (error) throw error

        // Transform the data to match the Movement interface
        const transformedData = (data || []).map(item => ({
          ...item,
          item: item.item[0],
          responsavel: item.responsavel?.[0] || null
        })) as Movement[]

        setMovements(transformedData)
        setFilteredMovements(transformedData)
      } catch (error) {
        console.error('Erro ao carregar movimentações:', error)
        setError('Não foi possível carregar as movimentações.')
      } finally {
        setIsLoading(false)
      }
    }

    loadMovements()
  }, [dateRange])

  useEffect(() => {
    let filtered = [...movements]

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(mov =>
        mov.item.descricao.toLowerCase().includes(searchLower) ||
        mov.item.codigo_fabricante.toLowerCase().includes(searchLower)
      )
    }

    // Apply type filter
    if (tipoFilter !== "all") {
      filtered = filtered.filter(mov => mov.tipo_movimentacao === tipoFilter)
    }

    // Apply reason filter
    if (motivoFilter !== "all") {
      filtered = filtered.filter(mov => mov.motivo === motivoFilter)
    }

    setFilteredMovements(filtered)
  }, [searchTerm, tipoFilter, motivoFilter, movements])

  const handleExport = () => {
    const headers = {
      data: 'Data',
      tipo: 'Tipo',
      motivo: 'Motivo',
      quantidade: 'Quantidade',
      item: 'Item',
      responsavel: 'Responsável'
    }

    const csvContent = [
      // Headers
      settings.columns.map(col => headers[col as keyof typeof headers]).join(','),
      // Data rows
      ...filteredMovements.map(mov => 
        settings.columns.map(col => {
          switch (col) {
            case 'data':
              return format(new Date(mov.created_at), "dd/MM/yyyy HH:mm")
            case 'tipo':
              return mov.tipo_movimentacao === 'entrada' ? 'Entrada' :
                     mov.tipo_movimentacao === 'saida' ? 'Saída' : 'Ajuste'
            case 'motivo':
              return `"${MOTIVOS[mov.motivo as keyof typeof MOTIVOS]}"`
            case 'quantidade':
              return mov.quantidade
            case 'item':
              return `"${mov.item.descricao} (${mov.item.codigo_fabricante})"`
            case 'responsavel':
              return `"${mov.responsavel?.nome || 'N/A'}"`
            default:
              return ''
          }
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `movimentacoes_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`
    link.click()
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
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saídas</SelectItem>
                <SelectItem value="ajuste">Ajustes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={motivoFilter} onValueChange={setMotivoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os motivos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os motivos</SelectItem>
                {Object.entries(MOTIVOS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {settings.showDateRange && (
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
            )}
          </div>

          {settings.showExport && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
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
              {settings.columns.includes('motivo') && (
                <TableHead>Motivo</TableHead>
              )}
              {settings.columns.includes('quantidade') && (
                <TableHead className="text-right">Quantidade</TableHead>
              )}
              {settings.columns.includes('item') && (
                <TableHead>Item</TableHead>
              )}
              {settings.columns.includes('responsavel') && (
                <TableHead>Responsável</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={settings.columns.length} 
                  className="text-center h-32"
                >
                  Nenhuma movimentação encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((mov) => (
                <TableRow key={mov.id}>
                  {settings.columns.includes('data') && (
                    <TableCell>
                      {format(new Date(mov.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                  )}
                  {settings.columns.includes('tipo') && (
                    <TableCell>
                      <span className={
                        mov.tipo_movimentacao === 'entrada' ? 'text-green-600' :
                        mov.tipo_movimentacao === 'saida' ? 'text-red-600' :
                        'text-yellow-600'
                      }>
                        {mov.tipo_movimentacao === 'entrada' ? 'Entrada' :
                         mov.tipo_movimentacao === 'saida' ? 'Saída' : 'Ajuste'}
                      </span>
                    </TableCell>
                  )}
                  {settings.columns.includes('motivo') && (
                    <TableCell>
                      {MOTIVOS[mov.motivo as keyof typeof MOTIVOS]}
                    </TableCell>
                  )}
                  {settings.columns.includes('quantidade') && (
                    <TableCell className="text-right">
                      <span className={
                        mov.tipo_movimentacao === 'entrada' ? 'text-green-600' :
                        mov.tipo_movimentacao === 'saida' ? 'text-red-600' :
                        'text-yellow-600'
                      }>
                        {mov.tipo_movimentacao === 'entrada' ? '+' :
                         mov.tipo_movimentacao === 'saida' ? '-' : ''}
                        {mov.quantidade}
                      </span>
                    </TableCell>
                  )}
                  {settings.columns.includes('item') && (
                    <TableCell>
                      <div>
                        <span className="font-medium">{mov.item.descricao}</span>
                        <span className="text-sm text-gray-500 block">
                          {mov.item.codigo_fabricante}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  {settings.columns.includes('responsavel') && (
                    <TableCell>{mov.responsavel?.nome || 'N/A'}</TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 