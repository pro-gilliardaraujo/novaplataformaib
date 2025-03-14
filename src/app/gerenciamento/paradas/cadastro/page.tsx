"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

interface TipoParada {
  id: string
  nome: string
  icone?: string
  created_at: string
  updated_at: string
}

export default function CadastroParadasPage() {
  const [tipos, setTipos] = useState<TipoParada[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const fetchTipos = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('tipos_parada')
        .select('*')
        .order('nome')

      if (error) throw error
      setTipos(data)
    } catch (error) {
      console.error('Erro ao carregar tipos de parada:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tipos de parada",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTipos()
  }, [])

  const filteredTipos = tipos.filter(tipo =>
    tipo.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-screen flex flex-col p-4 bg-white">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-3 bg-white">
        <Input 
          className="max-w-md" 
          placeholder="Buscar tipos de parada..." 
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          className="bg-black hover:bg-black/90 text-white"
          onClick={() => {/* TODO: Implementar modal de novo tipo */}}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Tipo
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-black">
            <TableRow>
              <TableHead className="text-white">Nome</TableHead>
              <TableHead className="text-white">Ícone</TableHead>
              <TableHead className="text-white w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  Carregando tipos de parada...
                </TableCell>
              </TableRow>
            ) : filteredTipos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  Nenhum tipo de parada encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredTipos.map((tipo) => (
                <TableRow key={tipo.id}>
                  <TableCell>{tipo.nome}</TableCell>
                  <TableCell>{tipo.icone || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {/* TODO: Implementar edição */}}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {/* TODO: Implementar exclusão */}}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
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