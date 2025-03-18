import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Equipamento } from "@/types/equipamento"
import { Wrench, AlertTriangle, CheckCircle } from "lucide-react"

interface EquipamentosDashboardProps {
  equipamentos: Equipamento[]
}

export function EquipamentosDashboard({ equipamentos }: EquipamentosDashboardProps) {
  const totalEquipamentos = equipamentos.length
  const equipamentosAtivos = equipamentos.filter(e => e.status === "ATIVO").length
  const equipamentosManutencao = equipamentos.filter(e => e.status === "MANUTENCAO").length

  return (
    <div className="space-y-4 p-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Equipamentos</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEquipamentos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipamentos Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipamentosAtivos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipamentosManutencao}</div>
          </CardContent>
        </Card>
      </div>

      {/* TODO: Add charts or additional statistics as needed */}
    </div>
  )
} 