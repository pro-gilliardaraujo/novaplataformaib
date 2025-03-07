"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DocumentViewerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentoEnviado: string
  documentoDevolvido?: string | null
}

export function DocumentViewerModal({
  open,
  onOpenChange,
  documentoEnviado,
  documentoDevolvido,
}: DocumentViewerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <div className="flex items-center justify-between px-4 h-12 border-b">
          <div className="flex-1 text-center text-base font-medium">Visualizar Documentos</div>
          <Button 
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-7 w-7 p-0 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="enviado" className="flex flex-col flex-1">
          <div className="-mt-[14px]">
            <TabsList className="w-full h-10 bg-gray-50 rounded-none border-b">
              <TabsTrigger 
                value="enviado" 
                className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-[inset_0_-2px_0_0_#000000]"
              >
                Documento Enviado
              </TabsTrigger>
              {documentoDevolvido && (
                <TabsTrigger 
                  value="devolvido" 
                  className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-[inset_0_-2px_0_0_#000000]"
                >
                  Documento Recebido
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="enviado" className="flex-1 m-0">
            <iframe src={documentoEnviado} className="w-full h-full" />
          </TabsContent>

          {documentoDevolvido && (
            <TabsContent value="devolvido" className="flex-1 m-0">
              <iframe src={documentoDevolvido} className="w-full h-full" />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 