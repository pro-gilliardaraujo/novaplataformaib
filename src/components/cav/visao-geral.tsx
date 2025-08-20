"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { BoletimCav } from "@/types/cav";
import { FileText, Calendar, Users, Tractor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CavVisaoGeral() {
  const [periodo, setPeriodo] = useState<{ from: Date; to: Date } | undefined>();
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<BoletimCav[]>([]);

  useEffect(() => {
    if (!periodo) return;
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("boletins_cav")
        .select("operador, codigo:codigo_fazenda, producao")
        .gte("data", periodo.from.toISOString().slice(0, 10))
        .lte("data", periodo.to.toISOString().slice(0, 10));
      if (!error && data) setDados(data as BoletimCav[]);
      setLoading(false);
    };
    fetch();
  }, [periodo]);

  const totalHa = dados.reduce((s, d) => s + d.producao, 0);
  const operadoresUnicos = new Set(dados.map((d) => d.operador)).size;
  const fazendasUnicas = new Set(dados.map((d) => d.codigo)).size;

  return (
    <div className="space-y-6 p-4">
      <div className="grid md:grid-cols-4 gap-4 bg-muted p-4 rounded-md">
        <DateRangePicker value={periodo} onChange={setPeriodo} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total ha</CardTitle>
            <Tractor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHa.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Operadores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operadoresUnicos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fazendas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fazendasUnicas}</div>
          </CardContent>
        </Card>
      </div>

      {loading && <p>Carregando...</p>}
    </div>
  );
}
