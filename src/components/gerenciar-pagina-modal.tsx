"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Page, Tab } from "@/types/pages"
import { pageService } from "@/services/pageService"

interface GerenciarPaginaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  page: Page
  onPageUpdated: () => void
}

export function GerenciarPaginaModal({
  open,
  onOpenChange,
  page,
  onPageUpdated
}: GerenciarPaginaModalProps) {
  const [tabs, setTabs] = useState<Array<{
    name: string
    content: string
    order_index: number
  }>>(
    page.tabs?.map(tab => ({
      name: tab.name,
      content: tab.content,
      order_index: tab.order_index
    })) || []
  )
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setTabs(
      page.tabs?.map(tab => ({
        name: tab.name,
        content: tab.content,
        order_index: tab.order_index
      })) || []
    )
  }, [page])

  const handleAddTab = () => {
    setTabs(prev => [
      ...prev,
      {
        name: `Nova Aba ${prev.length + 1}`,
        content: '',
        order_index: prev.length
      }
    ])
  }

  const handleRemoveTab = (index: number) => {
    setTabs(prev => prev.filter((_, i) => i !== index))
  }

  const handleTabChange = (index: number, field: keyof Tab, value: string) => {
    setTabs(prev => prev.map((tab, i) => 
      i === index ? { ...tab, [field]: value } : tab
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await pageService.updateTabs({
        page_id: page.id,
        tabs
      })
      
      toast({
        title: "Sucesso",
        description: "Página atualizada com sucesso!",
      })
      onPageUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao atualizar página:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar página. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <div className="flex items-center px-4 h-12 border-b relative">
          <div className="flex-1 text-center">
            <span className="text-base font-medium">Gerenciar Página: {page.name}</span>
          </div>
          <DialogClose asChild>
            <Button 
              variant="outline"
              className="h-8 w-8 p-0 absolute right-2 top-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {tabs.map((tab, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={() => handleRemoveTab(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <div className="space-y-2">
                  <Label>Nome da Aba</Label>
                  <Input
                    value={tab.name}
                    onChange={e => handleTabChange(index, "name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conteúdo (iframe)</Label>
                  <Textarea
                    value={tab.content}
                    onChange={e => handleTabChange(index, "content", e.target.value)}
                    className="min-h-[200px]"
                    required
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddTab}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Aba
            </Button>
          </div>

          <div className="border-t bg-gray-50 p-4 flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 