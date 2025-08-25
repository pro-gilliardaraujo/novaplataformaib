"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, FileText, Image, Loader2 } from "lucide-react"
import { NovoDiarioCavModal } from "@/components/cav/novo-diario-cav-modal"
import { DiarioCav as DiarioCavType } from "@/types/diario-cav"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function DiarioCav() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [diarios, setDiarios] = useState<DiarioCavType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  
  const carregarDiarios = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const supabase = createClientComponentClient()
      
      const { data, error: supabaseError } = await supabase
        .from("diario_cav")
        .select("*")
        .order("data", { ascending: false })
      
      if (supabaseError) {
        throw new Error(supabaseError.message || "Erro ao carregar diários")
      }
      
      setDiarios(data || [])
    } catch (error: any) {
      console.error("Erro ao carregar diários:", error)
      setError(error.message || "Erro ao carregar diários")
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    carregarDiarios()
  }, [])
  
  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Diário CAV</h2>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <PlusCircle className="h-4 w-4" />
          Novo Diário
        </Button>
      </div>
      
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Diários Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          ) : diarios.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhum diário cadastrado. Clique em "Novo Diário" para adicionar.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Frente</TableHead>
                    <TableHead>Máquinas</TableHead>
                    <TableHead>Imagens</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diarios.map((diario) => (
                    <TableRow key={diario.id}>
                      <TableCell>
                        {format(parseISO(diario.data), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {diario.frente}
                      </TableCell>
                      <TableCell>
                        {Object.keys(diario.dados).length} máquinas
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {diario.imagem_deslocamento && (
                            <a 
                              href={diario.imagem_deslocamento} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                              title="Ver imagem de deslocamento"
                            >
                              <Image className="h-4 w-4" />
                            </a>
                          )}
                          {diario.imagem_area && (
                            <a 
                              href={diario.imagem_area} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-green-500 hover:text-green-700"
                              title="Ver imagem de área"
                            >
                              <Image className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          title="Ver relatório"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <NovoDiarioCavModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          carregarDiarios()
        }}
      />
    </div>
  )
}