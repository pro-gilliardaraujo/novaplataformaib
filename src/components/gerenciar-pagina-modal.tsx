"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Page, Tab } from "@/types/pages"
import { pageService } from "@/services/pageService"
import { useToast } from "@/components/ui/use-toast"
import { getDefaultTabContent } from "@/utils/templates"

interface GerenciarPaginaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  page: Page
  onPageUpdated?: () => void
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
        content: getDefaultTabContent(),
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
      onPageUpdated?.()
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Abas - {page.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {tabs.map((tab, index) => (
              <div key={index} className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Input
                    value={tab.name}
                    onChange={(e) => handleTabChange(index, 'name', e.target.value)}
                    placeholder="Nome da aba"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleRemoveTab(index)}
                  >
                    Remover
                  </Button>
                </div>
                <div className="relative">
                  <iframe
                    srcDoc={tab.content}
                    className="w-full h-[300px] border rounded"
                    title={`Preview da aba ${tab.name}`}
                  />
                  <textarea
                    value={tab.content}
                    onChange={(e) => handleTabChange(index, 'content', e.target.value)}
                    className="absolute inset-0 opacity-0"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <Button type="button" onClick={handleAddTab}>
              Adicionar Aba
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 