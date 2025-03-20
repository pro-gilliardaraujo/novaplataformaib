"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  quantidade_conferida?: number
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
      if (item.quantidade_conferida === undefined) return ""
      const diferenca = item.quantidade_conferida - item.quantidade
      return diferenca > 0 ? `+${diferenca}` : diferenca.toString()
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

    const itensNaoConferidos = itens.filter(item => item.quantidade_conferida === undefined)
    if (itensNaoConferidos.length > 0) {
      toast({
        variant: "destructive",
        title: "Itens não conferidos",
        description: "Todos os itens precisam ser conferidos antes de finalizar."
      })
      return
    }

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
        item.quantidade_conferida !== undefined && 
        item.quantidade_conferida !== item.quantidade
      ).length

      const dadosConferencia = {
        data_conferencia: dataInicio.toISOString(),
        status: "concluida",
        responsaveis: responsaveisNomes,
        total_itens: itens.length,
        itens_conferidos: itens.length,
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
          quantidade_conferida: item.quantidade_conferida!,
          diferenca: item.diferenca || 0,
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
      <Dialog open={open} onOpenChange={(open) => {
        if (!open) {
          onOpenChange(false)
        }
      }}>
        <DialogContent className="max-w-7xl" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center justify-between border-b pb-2">
              <div className="w-8" /> {/* Spacer */}
              <DialogTitle className="text-xl font-semibold text-center flex-1">
                Nova Conferência - {dataInicio.toLocaleDateString()} às {dataInicio.toLocaleTimeString()}
              </DialogTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header com busca e seleção de participantes */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar itens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Users className="h-4 w-4" />
                    Participantes ({selectedProfiles.length})
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <h4 className="font-medium">Selecionar Participantes</h4>
                    <div className="space-y-2 max-h-[300px] overflow-auto">
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

            {/* Tabela de itens */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader className="bg-black">
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.key} className="text-white font-medium h-[49px]">
                        {column.title}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredItens.map((item) => (
                    <TableRow key={item.id} className="h-[49px] hover:bg-gray-50 border-b border-gray-200">
                      {columns.map((column) => (
                        <TableCell 
                          key={column.key} 
                          className={cn("py-0", column.className, {
                            "text-red-600": column.key === "diferenca" && item.diferenca && item.diferenca < 0,
                            "text-green-600": column.key === "diferenca" && item.diferenca && item.diferenca > 0
                          })}
                        >
                          {column.key === "quantidade_conferida" ? (
                            <Input
                              type="number"
                              min="0"
                              value={item.quantidade_conferida?.toString() || ""}
                              onChange={(e) => handleQuantidadeChange(item.id, e.target.value)}
                              className="h-8"
                            />
                          ) : column.key === "observacoes" ? (
                            <Input
                              type="text"
                              value={item.observacoes || ""}
                              onChange={(e) => handleObservacoesChange(item.id, e.target.value)}
                              className="h-8"
                              placeholder="Observações do item..."
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

            {/* Botões de ação */}
            <div className="flex justify-end">
              <Button
                onClick={handleFinalizarConferencia}
                disabled={isLoading}
              >
                Finalizar Conferência
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação */}
      <Dialog open={showConfirmacao} onOpenChange={setShowConfirmacao}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between border-b pb-2">
              <div className="w-8" /> {/* Spacer */}
              <DialogTitle className="text-xl font-semibold text-center flex-1">
                Confirmar Conferência
              </DialogTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowConfirmacao(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Resumo da Conferência</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Data e Hora</p>
                  <p className="font-medium">{dataInicio.toLocaleDateString()} às {dataInicio.toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total de Itens</p>
                  <p className="font-medium">{itens.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Itens Divergentes</p>
                  <p className="font-medium">{itens.filter(item => item.diferenca !== 0).length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Responsáveis</p>
                  <p className="font-medium">
                    {selectedProfiles
                      .map(id => profiles.find(p => p.id === id)?.nome)
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de itens divergentes */}
            {itens.filter(item => item.diferenca !== 0).length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Itens com Divergência</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader className="bg-black">
                      <TableRow>
                        <TableHead className="text-white font-medium">Item</TableHead>
                        <TableHead className="text-white font-medium">Qtd. Sistema</TableHead>
                        <TableHead className="text-white font-medium">Qtd. Conferida</TableHead>
                        <TableHead className="text-white font-medium">Diferença</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens
                        .filter(item => item.diferenca !== 0)
                        .map(item => (
                          <TableRow key={item.id}>
                            <TableCell>{item.descricao}</TableCell>
                            <TableCell>{item.quantidade}</TableCell>
                            <TableCell>{item.quantidade_conferida}</TableCell>
                            <TableCell className={cn({
                              "text-red-600": item.diferenca && item.diferenca < 0,
                              "text-green-600": item.diferenca && item.diferenca > 0
                            })}>
                              {item.diferenca && item.diferenca > 0 ? `+${item.diferenca}` : item.diferenca}
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

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
                className="min-w-[100px]"
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
        </DialogContent>
      </Dialog>
    </>
  )
} 