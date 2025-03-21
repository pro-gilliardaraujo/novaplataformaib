"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Page, Tab } from "@/types/pages"
import { pageService } from "@/services/pageService"
import { useToast } from "@/components/ui/use-toast"
import { X, Plus, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface GerenciarPaginaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  page: Page
  onPageUpdated?: () => void
}

interface TabData {
  name: string;
  content: string | {
    type: string;
    settings?: {
      showCategories?: boolean;
      showLowStock?: boolean;
      showCharts?: boolean;
      showFilters?: boolean;
      showExport?: boolean;
      showDateRange?: boolean;
      columns?: string[];
      [key: string]: any;
    };
  };
  order_index: number;
}

// Wrapper que faz o iframe ocupar todo o espaço disponível
const wrapIframeContent = (iframeTag: string) => {
  // Remove width e height fixos do iframe
  const cleanedIframe = iframeTag
    .replace(/width="[^"]*"/, 'width="100%"')
    .replace(/height="[^"]*"/, 'height="100%"')

  return `<div style="width: 100%; height: 100vh; overflow: hidden;">
  ${cleanedIframe}
</div>`
}

// Template padrão com um iframe vazio
const defaultIframeContent = wrapIframeContent('<iframe src="" frameborder="0" allowFullScreen="true"></iframe>')

export function GerenciarPaginaModal({
  open,
  onOpenChange,
  page,
  onPageUpdated
}: GerenciarPaginaModalProps) {
  const [tabs, setTabs] = useState<TabData[]>(
    page.tabs?.map(tab => ({
      name: tab.name,
      content: tab.content,
      order_index: tab.order_index
    })).sort((a, b) => a.order_index - b.order_index) || []
  )
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setTabs(
      page.tabs?.map(tab => ({
        name: tab.name,
        content: tab.content,
        order_index: tab.order_index
      })).sort((a, b) => a.order_index - b.order_index) || []
    )
  }, [page])

  const handleAddTab = () => {
    const maxOrderIndex = Math.max(...tabs.map(tab => tab.order_index), -1)
    setTabs(prev => [
      ...prev,
      {
        name: `Nova Aba ${prev.length + 1}`,
        content: defaultIframeContent,
        order_index: maxOrderIndex + 1
      }
    ])
  }

  const handleRemoveTab = (index: number) => {
    setTabs(prev => {
      const newTabs = prev.filter((_, i) => i !== index)
      // Reordena os índices após remover
      return newTabs.map((tab, i) => ({
        ...tab,
        order_index: i
      }))
    })
  }

  const handleTabChange = (index: number, field: keyof TabData, value: string) => {
    if (field === 'content') {
      // Se for um objeto JSON válido, mantenha-o como está
      try {
        const parsedContent = JSON.parse(value)
        if (typeof parsedContent === 'object' && parsedContent !== null) {
          setTabs(prev => prev.map((tab, i) => 
            i === index ? { ...tab, [field]: parsedContent } : tab
          ))
          return
        }
      } catch {
        // Se não for um JSON válido e parece ser um iframe, aplica o wrapper
        if (typeof value === 'string' && value.includes('<iframe')) {
          value = wrapIframeContent(value)
        }
      }
    }
    
    // Para outros campos ou conteúdo que não é JSON/iframe
    setTabs(prev => prev.map((tab, i) => 
      i === index ? { ...tab, [field]: value } : tab
    ))
  }

  const getDisplayContent = (content: string | { type: string; settings?: any }) => {
    if (typeof content === 'string') {
      if (content.includes('style="width: 100%; height: 100vh;')) {
        return content.split('\n')[1].trim()
      }
      return content
    }
    return JSON.stringify(content, null, 2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await pageService.updateTabs({
        page_id: page.id,
        tabs: tabs.map((tab, index) => ({
          ...tab,
          order_index: index,
          content: typeof tab.content === 'string' ? tab.content : JSON.stringify(tab.content)
        }))
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
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <div className="flex items-center justify-between px-6 h-14 border-b">
          <span className="text-lg font-medium">Gerenciar Abas - {page.name}</span>
          <DialogClose asChild>
            <Button 
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>

        <div className="p-6 flex-grow overflow-auto">
          <div className="space-y-4">
            {tabs.map((tab, index) => (
              <div key={index} className="border rounded-lg">
                <div className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <Label htmlFor={`tab-name-${index}`} className="text-sm font-medium mb-2">
                        Nome da Aba
                      </Label>
                      <Input
                        id={`tab-name-${index}`}
                        value={tab.name}
                        onChange={(e) => handleTabChange(index, 'name', e.target.value)}
                        placeholder="Nome da aba"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveTab(index)}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor={`tab-content-${index}`} className="text-sm font-medium mb-2">
                      Conteúdo
                    </Label>
                    <Textarea
                      id={`tab-content-${index}`}
                      value={getDisplayContent(tab.content)}
                      onChange={(e) => handleTabChange(index, 'content', e.target.value)}
                      placeholder="Cole aqui o código do iframe ou configuração JSON"
                      className="font-mono text-sm h-24 resize-none"
                      spellCheck={false}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
          <Button 
            onClick={handleAddTab}
            variant="outline"
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Aba
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading}
              className="bg-black hover:bg-black/90"
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 