"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Eye, 
  MoreHorizontal,
  Calendar,
  FileText
} from "lucide-react"

interface Relatorio {
  id: string
  nome: string
  tipo: string
  status: "Processando" | "Concluído" | "Erro" | "Pendente"
  dataGeracao: string
  tamanho: string
  criadoPor: string
}

export function RelatoriosListaDetalhada() {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")

  useEffect(() => {
    const fetchRelatorios = async () => {
      try {
        setIsLoading(true)
        // TODO: Implementar busca real de dados
        // Por enquanto, dados mockados
        const mockRelatorios: Relatorio[] = [
          {
            id: "1",
            nome: "Relatório de Colheita - Janeiro 2024",
            tipo: "Colheita",
            status: "Concluído",
            dataGeracao: "2024-01-15T10:30:00Z",
            tamanho: "2.4 MB",
            criadoPor: "João Silva"
          },
          {
            id: "2", 
            nome: "Relatório de Transbordo - Janeiro 2024",
            tipo: "Transbordo",
            status: "Concluído",
            dataGeracao: "2024-01-14T14:20:00Z",
            tamanho: "1.8 MB",
            criadoPor: "Maria Santos"
          },
          {
            id: "3",
            nome: "Relatório de Plantio - Janeiro 2024", 
            tipo: "Plantio",
            status: "Processando",
            dataGeracao: "2024-01-16T09:15:00Z",
            tamanho: "0 MB",
            criadoPor: "Pedro Costa"
          }
        ]
        setRelatorios(mockRelatorios)
      } catch (error) {
        console.error("Erro ao buscar relatórios:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRelatorios()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Concluído":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "Processando":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "Erro":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      case "Pendente":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const formatData = (dataString: string) => {
    return new Date(dataString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const relatoriosFiltrados = relatorios.filter(relatorio => {
    const matchSearch = Object.values(relatorio).some(value => 
      value != null && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
    const matchStatus = filtroStatus === "todos" || relatorio.status === filtroStatus
    return matchSearch && matchStatus
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Carregando relatórios...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Barra de Ferramentas */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar relatórios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFiltroStatus("todos")}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFiltroStatus("Concluído")}>
                Concluído
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFiltroStatus("Processando")}>
                Processando
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFiltroStatus("Pendente")}>
                Pendente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFiltroStatus("Erro")}>
                Erro
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button className="bg-black hover:bg-black/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Novo Relatório
        </Button>
      </div>

      {/* Tabela de Relatórios */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios ({relatoriosFiltrados.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {relatoriosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">Nenhum relatório encontrado</p>
              <p className="text-sm text-gray-400">
                {searchTerm ? "Tente ajustar os filtros de busca" : "Crie seu primeiro relatório"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Geração</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Criado por</TableHead>
                  <TableHead className="w-[50px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatoriosFiltrados.map((relatorio) => (
                  <TableRow key={relatorio.id}>
                    <TableCell className="font-medium">
                      {relatorio.nome}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{relatorio.tipo}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(relatorio.status)}>
                        {relatorio.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatData(relatorio.dataGeracao)}
                      </div>
                    </TableCell>
                    <TableCell>{relatorio.tamanho}</TableCell>
                    <TableCell>{relatorio.criadoPor}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
