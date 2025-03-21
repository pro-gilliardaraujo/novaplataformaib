"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Search, Users } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { TagInput } from "@/components/tag-input"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useAuth } from "@/hooks/useAuth"

interface ItemEstoque {
  id: string
  codigo_fabricante: string
  descricao: string
  quantidade: number
  quantidade_conferida?: number | "--"
  diferenca?: number
  observacoes?: string
}

interface Profile {
  id: string
  nome: string
}

interface NovaConferenciaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConferenciaCreated: () => void
}

const columns = [
  {
    key: "codigo_fabricante",
    title: "Código",
    className: "w-40 border-x",
    getValue: (item: ItemEstoque) => item.codigo_fabricante
  },
  {
    key: "descricao",
    title: "Descrição",
    className: "w-[350px] border-r",
    getValue: (item: ItemEstoque) => item.descricao
  },
  {
    key: "quantidade",
    title: "Qtd. Estoque",
    className: "w-28 text-center border-r",
    getValue: (item: ItemEstoque) => item.quantidade.toString()
  },
  {
    key: "quantidade_conferida",
    title: "Qtd. Conferida",
    className: "w-28 border-r",
    getValue: (item: ItemEstoque) => item.quantidade_conferida?.toString() || ""
  },
  {
    key: "diferenca",
    title: "Diferença",
    className: "w-24 text-center border-r",
    getValue: (item: ItemEstoque) => {
      if (item.quantidade_conferida === undefined || item.quantidade_conferida === "--") return ""
      if (typeof item.quantidade_conferida === 'number') {
        const diferenca = item.quantidade_conferida - item.quantidade
        return diferenca > 0 ? `+${diferenca}` : diferenca.toString()
      }
      return ""
    }
  },
  {
    key: "observacoes",
    title: "Observações",
    className: "w-48 border-r",
    getValue: (item: ItemEstoque) => item.observacoes || ""
  }
]

export function NovaConferenciaModal({ open, onOpenChange, onConferenciaCreated }: NovaConferenciaModalProps) {
  const { user } = useAuth()
  const [itens, setItens] = useState<ItemEstoque[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmacao, setShowConfirmacao] = useState(false)
  const [dataInicio] = useState(new Date())
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (open) {
      loadItens()
      loadProfiles()
      setSelectedProfiles([])
    }
  }, [open])

  useEffect(() => {
    if (user?.id && profiles.length > 0 && selectedProfiles.length === 0) {
      const userExists = profiles.some(profile => profile.id === user.id)
      if (userExists) {
        setSelectedProfiles([user.id])
      }
    }
  }, [user, profiles, selectedProfiles.length])

  const loadItens = async () => {
    try {
      const { data: itensEstoque, error } = await supabase
        .from("itens_estoque")
        .select("id, codigo_fabricante, descricao, quantidade_atual")
        .order("codigo_fabricante")

      if (error) throw error

      setItens(itensEstoque.map(item => ({
        ...item,
        quantidade: item.quantidade_atual,
        quantidade_conferida: undefined
      })))
    } catch (error) {
      console.error("Erro ao carregar itens:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar itens",
        description: "Não foi possível carregar os itens do estoque."
      })
    }
  }

  const loadProfiles = async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select("id, nome")
        .order("nome")

      if (error) throw error

      setProfiles(profilesData)
    } catch (error) {
      console.error("Erro ao carregar profiles:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários."
      })
    }
  }

  const handleQuantidadeChange = (id: string, value: string) => {
    setItens(prev => prev.map(item => {
      if (item.id === id) {
        const quantidade_conferida = value === "" ? undefined : parseInt(value)
        return {
          ...item,
          quantidade_conferida,
          diferenca: quantidade_conferida !== undefined ? quantidade_conferida - item.quantidade : undefined
        }
      }
      return item
    }))
  }

  const handleObservacoesChange = (id: string, value: string) => {
    setItens(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          observacoes: value
        }
      }
      return item
    }))
  }

  const handleFinalizarConferencia = () => {
    if (selectedProfiles.length === 0) {
      toast({
        variant: "destructive",
        title: "Selecione os responsáveis",
        description: "É necessário selecionar pelo menos um responsável pela conferência."
      })
      return
    }

    // Marcar itens não conferidos com "--"
    const itensAtualizados = itens.map(item => ({
      ...item,
      quantidade_conferida: item.quantidade_conferida === undefined ? "--" : item.quantidade_conferida,
      diferenca: item.quantidade_conferida === undefined || item.quantidade_conferida === "--" ? 0 
               : typeof item.quantidade_conferida === 'number' ? item.quantidade_conferida - item.quantidade 
               : 0
    }))

    setItens(itensAtualizados)
    setShowConfirmacao(true)
  }

  const handleConfirmarConferencia = async () => {
    setIsLoading(true)
    console.log("Iniciando criação da conferência...")

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false)
      setShowConfirmacao(false)
      toast({
        variant: "destructive",
        title: "Tempo excedido",
        description: "A operação demorou muito tempo. Por favor, tente novamente.",
        duration: 5000
      })
    }, 30000) // 30 seconds timeout

    try {
      // Get responsible users' names
      const responsaveisNomes = selectedProfiles
        .map(id => profiles.find(p => p.id === id)?.nome)
        .filter(Boolean)
        .join(", ")

      const itensDivergentes = itens.filter(item => 
        typeof item.quantidade_conferida === 'number' && 
        item.quantidade_conferida !== item.quantidade
      ).length

      const dadosConferencia = {
        data_conferencia: dataInicio.toISOString(),
        status: "concluida",
        responsaveis: responsaveisNomes,
        total_itens: itens.length,
        itens_conferidos: itens.filter(item => 
          typeof item.quantidade_conferida === 'number'
        ).length,
        itens_divergentes: itensDivergentes
      }

      console.log("Dados da conferência:", dadosConferencia)

      // Create conference and items in a single transaction
      const { data, error } = await supabase.rpc('criar_conferencia', {
        p_data_conferencia: dadosConferencia.data_conferencia,
        p_status: dadosConferencia.status,
        p_responsaveis: responsaveisNomes,
        p_total_itens: dadosConferencia.total_itens,
        p_itens_conferidos: dadosConferencia.itens_conferidos,
        p_itens_divergentes: dadosConferencia.itens_divergentes,
        p_itens: itens.map(item => ({
          item_id: item.id,
          quantidade_sistema: item.quantidade,
          quantidade_conferida: item.quantidade_conferida === "--" ? item.quantidade : item.quantidade_conferida!,
          diferenca: item.quantidade_conferida === "--" ? 0 : (item.diferenca || 0),
          observacoes: item.observacoes || null
        }))
      })

      if (error) {
        console.error("Erro na chamada RPC:", error)
        throw error
      }

      if (!data || data.status === 'error') {
        console.error("Erro retornado pela função:", data)
        throw new Error(data?.message || 'Erro desconhecido ao criar conferência')
      }

      console.log("Conferência criada com sucesso:", data)

      // Clear timeout on success
      clearTimeout(timeoutId)
      
      toast({
        title: "Conferência finalizada",
        description: "A conferência foi registrada com sucesso."
      })

      onConferenciaCreated()
      onOpenChange(false)
    } catch (error: any) {
      // Clear timeout on error
      clearTimeout(timeoutId)

      console.error("Erro detalhado ao finalizar conferência:", error)
      let errorMessage = "Não foi possível salvar a conferência."
      
      if (error?.code) {
        errorMessage += ` Código: ${error.code}`
      }
      if (error?.message) {
        errorMessage += ` Detalhes: ${error.message}`
      }
      if (error?.details) {
        errorMessage += ` Info: ${error.details}`
      }

      toast({
        variant: "destructive",
        title: "Erro ao finalizar conferência",
        description: errorMessage,
        duration: 5000
      })
    } finally {
      // Clear timeout in finally block just in case
      clearTimeout(timeoutId)
      setIsLoading(false)
      setShowConfirmacao(false)
    }
  }

  const filteredItens = itens.filter(item =>
    item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.codigo_fabricante.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl p-0 flex flex-col h-[90vh]">
          <div className="h-12 border-b flex items-center justify-between px-4">
            <div className="w-8" /> {/* Spacer */}
            <div className="text-base font-medium">
              Nova Conferência - {dataInicio.toLocaleDateString()} às {dataInicio.toLocaleTimeString()}
            </div>
            <DialogClose asChild>
              <Button 
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-md shadow-sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {/* Search and Filters */}
            <div className="px-6 py-4 border-b">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar por código ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Users className="h-4 w-4" />
                      <span>Responsáveis</span>
                      {selectedProfiles.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {selectedProfiles.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-4">
                      <h4 className="font-medium">Selecionar Responsáveis</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {profiles.map((profile) => (
                          <div key={profile.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={profile.id}
                              checked={selectedProfiles.includes(profile.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedProfiles(prev => [...prev, profile.id])
                                } else {
                                  setSelectedProfiles(prev => prev.filter(id => id !== profile.id))
                                }
                              }}
                            />
                            <Label htmlFor={profile.id} className="text-sm">
                              {profile.nome}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Table */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader className="bg-black">
                      <TableRow>
                        {columns.map((column) => (
                          <TableHead key={column.key} className={cn("text-white font-medium h-10", column.className)}>
                            {column.title}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens
                        .filter(item =>
                          searchTerm === "" ||
                          item.codigo_fabricante.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.descricao.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((item) => (
                          <TableRow key={item.id} className="h-12 hover:bg-gray-50">
                            {columns.map((column) => (
                              <TableCell key={column.key} className={cn(column.className, "py-1")}>
                                {column.key === "quantidade_conferida" ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    value={item.quantidade_conferida?.toString() || ""}
                                    onChange={(e) => handleQuantidadeChange(item.id, e.target.value)}
                                    className="h-9 w-full"
                                  />
                                ) : column.key === "diferenca" ? (
                                  <div className={cn(
                                    "text-center font-medium",
                                    item.diferenca === undefined ? "" :
                                      item.diferenca === 0 ? "text-green-600" :
                                        item.diferenca > 0 ? "text-blue-600" : "text-red-600"
                                  )}>
                                    {column.getValue(item)}
                                  </div>
                                ) : column.key === "observacoes" ? (
                                  <Input
                                    value={item.observacoes || ""}
                                    onChange={(e) => handleObservacoesChange(item.id, e.target.value)}
                                    className="h-9 w-full"
                                  />
                                ) : (
                                  column.getValue(item)
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {itens.length} itens no total
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleFinalizarConferencia}
                    disabled={isLoading}
                    className="bg-black hover:bg-black/90"
                  >
                    {isLoading ? "Finalizando..." : "Finalizar Conferência"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showConfirmacao && (
        <Dialog open={showConfirmacao} onOpenChange={setShowConfirmacao}>
          <DialogContent className="max-w-7xl p-0 flex flex-col h-[90vh]">
            <DialogHeader className="h-12 border-b relative px-4">
              <DialogTitle className="text-base font-medium text-center">
                Confirmar Conferência - {dataInicio.toLocaleDateString()} às {dataInicio.toLocaleTimeString()}
              </DialogTitle>
              <DialogClose asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 absolute right-4"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </DialogHeader>

            <div className="flex-1 flex flex-col min-h-0">
              {/* Resumo */}
              <div className="px-6 py-4 border-b">
                <div className="grid grid-cols-7 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">Total de Itens</p>
                    </div>
                    <p className="font-medium">{itens.length}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">Conferidos</p>
                    </div>
                    <p className="font-medium">
                      {itens.filter(item => 
                        typeof item.quantidade_conferida === 'number'
                      ).length}/{itens.length}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">Não Conferidos</p>
                      <div className="h-3 w-3 rounded bg-white border border-gray-300" />
                    </div>
                    <p className="font-medium">
                      {itens.filter(item => 
                        typeof item.quantidade_conferida === 'string' && item.quantidade_conferida === "--"
                      ).length}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">Sem Alteração</p>
                      <div className="h-3 w-3 rounded bg-green-50 border border-green-600" />
                    </div>
                    <p className="font-medium">
                      {itens.filter(item => 
                        typeof item.quantidade_conferida === 'number' && 
                        item.quantidade_conferida === item.quantidade
                      ).length}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">Divergência Positiva</p>
                      <div className="h-3 w-3 rounded bg-blue-50 border border-blue-600" />
                    </div>
                    <p className="font-medium">
                      {itens.filter(item => 
                        typeof item.quantidade_conferida === 'number' && 
                        item.diferenca !== undefined && 
                        item.diferenca > 0
                      ).length}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">Divergência Negativa</p>
                      <div className="h-3 w-3 rounded bg-red-50 border border-red-600" />
                    </div>
                    <p className="font-medium">
                      {itens.filter(item => 
                        typeof item.quantidade_conferida === 'number' && 
                        item.diferenca !== undefined && 
                        item.diferenca < 0
                      ).length}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">Responsáveis</p>
                    </div>
                    <p className="font-medium truncate">
                      {selectedProfiles
                        .map(id => profiles.find(p => p.id === id)?.nome)
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabela com todos os itens */}
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader className="bg-black">
                          <TableRow>
                            {columns.map((column) => (
                              <TableHead key={column.key} className={cn("text-white font-medium h-10", column.className)}>
                                {column.title}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {itens.map((item) => {
                            // Verificar se o item foi realmente conferido (teve input manual)
                            const foiConferido = typeof item.quantidade_conferida === 'number';
                            const temDiferenca = foiConferido && item.diferenca !== undefined && item.diferenca !== 0;

                            return (
                              <TableRow 
                                key={item.id} 
                                className={cn(
                                  "h-12",
                                  {
                                    // Apenas colorir se o item foi realmente conferido
                                    "bg-green-50": foiConferido && !temDiferenca,
                                    "bg-red-50": foiConferido && item.diferenca !== undefined && item.diferenca < 0,
                                    "bg-blue-50": foiConferido && item.diferenca !== undefined && item.diferenca > 0
                                  }
                                )}
                              >
                                {columns.map((column) => (
                                  <TableCell key={column.key} className={cn(column.className, "py-1")}>
                                    {column.key === "diferenca" ? (
                                      <div className={cn(
                                        "text-center font-medium",
                                        !foiConferido ? "text-gray-400" :
                                          !temDiferenca ? "text-green-600" :
                                            (item.diferenca || 0) > 0 ? "text-blue-600" : "text-red-600"
                                      )}>
                                        {column.getValue(item)}
                                      </div>
                                    ) : (
                                      column.getValue(item)
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </ScrollArea>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t bg-gray-50">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmacao(false)}
                    disabled={isLoading}
                  >
                    Revisar
                  </Button>
                  <Button
                    onClick={handleConfirmarConferencia}
                    disabled={isLoading}
                    className="bg-black hover:bg-black/90"
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Salvando...
                      </>
                    ) : (
                      "Confirmar"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
} 