import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { X, FileText } from "lucide-react"

interface TratativaDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tratativa: {
    id: string
    numero_tratativa: string
    funcionario: string
    data_infracao: string
    hora_infracao: string
    codigo_infracao: string
    descricao_infracao: string
    penalidade: string
    lider: string
    status: string
    created_at: string
    texto_advertencia: string
    texto_limite: string
    url_documento_enviado: string
    url_documento_devolvido: string | null
    data_devolvida: string | null
    funcao: string
    setor: string
    metrica: string
    valor_praticado: string
  }
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl text-center">Detalhes da Tratativa</DialogTitle>
          <Button className="absolute right-4 top-4" variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <ScrollArea className="flex-grow px-6 py-4">
          <div className="space-y-6">
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DetailItem label="Data" value={formatDate(tratativa.data_infracao)} />
                <DetailItem label="Hora" value={tratativa.hora_infracao} />
                <DetailItem label="Código" value={tratativa.codigo_infracao} />
                <DetailItem label="Medida" value={tratativa.metrica} />
                <DetailItem label="Valor Praticado" value={tratativa.valor_praticado} />
              </div>
            </div>

            <Separator />

            <div>
              <SectionTitle title="Detalhes da Infração" />
              <DetailItem label="Infração Cometida" value={tratativa.descricao_infracao} />
              <DetailItem label="Texto da Advertência" value={tratativa.texto_advertencia} />
            </div>

            <Separator />

            <div>
              <SectionTitle title="Penalidade" />
              <DetailItem label="Penalidade Aplicada" value={tratativa.penalidade} />
            </div>
          </div>
        </ScrollArea>

        <div className="border-t bg-white p-4">
          <SectionTitle title="Documentos" />
          <div className="flex flex-col items-center sm:flex-row sm:justify-center gap-4">
            {tratativa.url_documento_enviado && (
              <Button
                variant="outline"
                onClick={() => window.open(tratativa.url_documento_enviado, "_blank")}
                className="w-full sm:w-auto"
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver documento enviado
              </Button>
            )}
            {tratativa.url_documento_devolvido && (
              <Button
                variant="outline"
                onClick={() => window.open(tratativa.url_documento_devolvido, "_blank")}
                className="w-full sm:w-auto"
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver documento recebido
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

