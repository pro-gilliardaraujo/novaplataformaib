import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timer } from "lucide-react";
import { Select } from "@/components/ui/select";

interface FrotaCardProps {
  frota: {
    id: string;
    codigo: string;
    modelo: string;
    status: "parado" | "operando";
    parada?: {
      tipo: string;
      inicio: Date;
      previsao_minutos: number;
      motivo: string;
    };
  };
  onLiberar: (id: string) => void;
  onRegistrarParada: (id: string) => void;
}

export function FrotaCard({ frota, onLiberar, onRegistrarParada }: FrotaCardProps) {
  const isParado = frota.status === "parado";
  
  return (
    <Card className={`w-full border-l-4 ${isParado ? "border-l-red-500" : "border-l-green-500"}`}>
      <CardHeader className="pb-2">
        <div>
          <h3 className="font-bold text-lg">{frota.codigo}</h3>
          <p className="text-sm text-muted-foreground">{frota.modelo}</p>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        {isParado && frota.parada && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Parado há {formatDistanceToNow(frota.parada.inicio, { locale: ptBR })}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{frota.parada.tipo}</p>
              <p className="text-sm text-muted-foreground">{frota.parada.motivo}</p>
              <p className="text-sm text-muted-foreground">
                Previsão: {frota.parada.previsao_minutos} minutos
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          variant={isParado ? "default" : "destructive"}
          className="w-full"
          onClick={() => isParado ? onLiberar(frota.id) : onRegistrarParada(frota.id)}
        >
          {isParado ? "Liberar" : "Parar"}
        </Button>
      </CardFooter>
    </Card>
  );
} 