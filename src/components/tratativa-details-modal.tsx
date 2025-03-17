// Directory: /src/components/tratativa-details-modal.tsx

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { X, FileText, Pencil } from "lucide-react"
import { TratativaDetailsProps } from "@/types/tratativas"
import { DocumentViewerModal } from "./document-viewer-modal"
import { EditarTratativaModal } from "./editar-tratativa-modal"
import { useState } from "react"

interface TratativaDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tratativa: TratativaDetailsProps
  onTratativaEdited?: () => void
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

function calcularDiasParaDevolver(dataInfracao: string, dataDevolvida: string | null): string {
  if (!dataDevolvida) return "—"
  
  const inicio = new Date(dataInfracao)
  const fim = new Date(dataDevolvida)
  const diffTime = Math.abs(fim.getTime() - inicio.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return `${diffDays} dia${diffDays !== 1 ? 's' : ''}`
}

export default function TratativaDetailsModal({ open, onOpenChange, tratativa, onTratativaEdited }: TratativaDetailsModalProps) {
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] p-0 flex flex-col h-[90vh]">
        <div className="flex items-center px-6 h-14 border-b relative">
          <div className="flex-1 text-center">
            <span className="text-lg font-medium">Detalhes da Tratativa #{tratativa.numero_tratativa}</span>
          </div>
          <div className="absolute right-4 top-3 flex items-center gap-2">
            <Button 
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setIsEditModalOpen(true)}
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <DialogClose asChild>
              <Button 
                variant="outline"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </div>

        <div className="px-8 py-6 space-y-8 flex-grow overflow-auto">
          <div>
            <SectionTitle title="Identificação" />
            <div className="grid grid-cols-4 gap-6">
              <DetailItem label="Documento" value={tratativa.numero_tratativa} />
              <DetailItem label="Funcionário" value={tratativa.funcionario} />
              <DetailItem label="Função" value={tratativa.funcao} />
              <DetailItem label="Setor" value={tratativa.setor} />
              <div className="col-span-2">
                <DetailItem label="Líder" value={tratativa.lider} />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <SectionTitle title="Infração e Penalidade" />
            <div className="grid grid-cols-4 gap-6">
              <DetailItem label="Data" value={formatDate(tratativa.data_infracao)} />
              <DetailItem label="Hora" value={tratativa.hora_infracao} />
              <DetailItem label="Código" value={tratativa.codigo_infracao} />
              <DetailItem label="Infração Cometida" value={tratativa.descricao_infracao} />
              <div className="col-span-2">
                <DetailItem label="Penalidade Aplicada" value={tratativa.penalidade} />
              </div>
              <div className="col-span-2">
                <DetailItem label="Texto da Advertência" value={tratativa.texto_advertencia} />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <SectionTitle title="Status e Devolução" />
            <div className="grid grid-cols-4 gap-6">
              <DetailItem 
                label="Status" 
                value={
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tratativa.status === 'DEVOLVIDA' ? 'bg-green-100 text-green-800' :
                    tratativa.status === 'CANCELADA' ? 'bg-red-100 text-red-800' :
                    tratativa.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                    tratativa.status === 'ENVIADA' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {tratativa.status}
                  </span>
                } 
              />
              <DetailItem 
                label="Analista" 
                value={tratativa.analista}
              />
              {tratativa.data_devolvida && (
                <>
                  <DetailItem 
                    label="Data de Devolução" 
                    value={formatDate(tratativa.data_devolvida)} 
                  />
                  <DetailItem 
                    label="Dias para devolver" 
                    value={calcularDiasParaDevolver(tratativa.data_infracao, tratativa.data_devolvida)}
                  />
                </>
              )}
              {tratativa.status === 'CANCELADA' && (
                <div className="col-span-3">
                  <DetailItem 
                    label="Justificativa" 
                    value={tratativa.texto_limite || "—"} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t bg-white px-8 py-5">
          <SectionTitle title="Documentos" />
          <div className="flex justify-center mt-4">
            {(tratativa.url_documento_enviado || tratativa.url_documento_devolvido) && (
              <Button
                variant="outline"
                onClick={() => setIsDocumentViewerOpen(true)}
                className="w-auto min-w-[200px]"
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
        numeroTratativa={tratativa.numero_tratativa}
      />

      {isEditModalOpen && (
        <EditarTratativaModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onTratativaEdited={() => {
            setIsEditModalOpen(false)
            onTratativaEdited?.()
          }}
          tratativaData={tratativa}
        />
      )}
    </Dialog>
  )
}

