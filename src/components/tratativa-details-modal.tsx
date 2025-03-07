// Directory: /src/components/tratativa-details-modal.tsx

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { X, FileText } from "lucide-react"
import { TratativaDetailsProps } from "@/types/tratativas"
import { DocumentViewerModal } from "./document-viewer-modal"
import { useState } from "react"

interface TratativaDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tratativa: TratativaDetailsProps
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="text-lg font-semibold mb-2 text-center">{title}</h3>
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-")
  return `${day}/${month}/${year}`
}

export default function TratativaDetailsModal({ open, onOpenChange, tratativa }: TratativaDetailsModalProps) {
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <div className="flex items-center px-4 h-12 border-b relative">
          <div className="flex-1 text-center">
            <span className="text-xs text-muted-foreground block mb-0.5">/src/components/tratativa-details-modal.tsx</span>
            <span className="text-base font-medium">Detalhes da Tratativa #{tratativa.numero_tratativa}</span>
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

        <div className="px-6 py-4 space-y-6 flex-grow overflow-auto">
          <div>
            <SectionTitle title="Identificação" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DetailItem label="Documento" value={tratativa.numero_tratativa} />
              <DetailItem label="Status" value={tratativa.status} />
              <DetailItem label="Funcionário" value={tratativa.funcionario} />
              <DetailItem label="Função" value={tratativa.funcao} />
              <DetailItem label="Setor" value={tratativa.setor} />
              <DetailItem label="Líder" value={tratativa.lider} />
            </div>
          </div>

          <Separator />

          <div>
            <SectionTitle title="Infração" />
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Data" value={formatDate(tratativa.data_infracao)} />
                <DetailItem label="Hora" value={tratativa.hora_infracao} />
                <DetailItem label="Código" value={tratativa.codigo_infracao} />
                <DetailItem label="Infração Cometida" value={tratativa.descricao_infracao} />
              </div>
              <DetailItem label="Texto da Advertência" value={tratativa.texto_advertencia} />
            </div>
          </div>

          <Separator />

          <div>
            <SectionTitle title="Penalidade" />
            <DetailItem label="Penalidade Aplicada" value={tratativa.penalidade} />
          </div>
        </div>

        <div className="border-t bg-white p-4">
          <SectionTitle title="Documentos" />
          <div className="flex flex-col items-center sm:flex-row sm:justify-center gap-4">
            {(tratativa.url_documento_enviado || tratativa.url_documento_devolvido) && (
              <Button
                variant="outline"
                onClick={() => setIsDocumentViewerOpen(true)}
                className="w-full sm:w-auto"
              >
                <FileText className="mr-2 h-4 w-4" />
                Visualizar documentos
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      <DocumentViewerModal
        open={isDocumentViewerOpen}
        onOpenChange={setIsDocumentViewerOpen}
        documentoEnviado={tratativa.url_documento_enviado}
        documentoDevolvido={tratativa.url_documento_devolvido}
      />
    </Dialog>
  )
}

