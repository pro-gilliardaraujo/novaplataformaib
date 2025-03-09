"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Unit {
  id: string
  name: string
  code: string
  created_at: string
  updated_at: string
}

export default function UnidadesPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [formData, setFormData] = useState({ name: "", code: "" })
  const { toast } = useToast()

  useEffect(() => {
    fetchUnits()
  }, [])

  const fetchUnits = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .order("name")

      if (error) throw error
      setUnits(data)
    } catch (error) {
      console.error("Erro ao carregar unidades:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as unidades.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUnit = async () => {
    try {
      const { data, error } = await supabase
        .from("units")
        .insert([
          {
            name: formData.name,
            code: formData.code.toLowerCase(),
          },
        ])
        .select()
        .single()

      if (error) throw error

      setUnits((prev) => [...prev, data])
      setIsAddDialogOpen(false)
      setFormData({ name: "", code: "" })
      toast({
        title: "Sucesso",
        description: "Unidade adicionada com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao adicionar unidade:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a unidade.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUnit = async () => {
    if (!selectedUnit) return

    try {
      const { error } = await supabase
        .from("units")
        .delete()
        .eq("id", selectedUnit.id)

      if (error) throw error

      setUnits((prev) => prev.filter((unit) => unit.id !== selectedUnit.id))
      setIsDeleteDialogOpen(false)
      setSelectedUnit(null)
      toast({
        title: "Sucesso",
        description: "Unidade excluída com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao excluir unidade:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a unidade.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Unidades</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Unidade
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Nenhuma unidade encontrada.
                </TableCell>
              </TableRow>
            ) : (
              units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>{unit.name}</TableCell>
                  <TableCell>{unit.code}</TableCell>
                  <TableCell>
                    {new Date(unit.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUnit(unit)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Adicionar Unidade */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Unidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddUnit}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a unidade {selectedUnit?.name}? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUnit}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 