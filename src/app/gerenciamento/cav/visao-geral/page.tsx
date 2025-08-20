import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { BoletimCav } from "@/types/cav";

const VisaoGeralCavPage: React.FC = () => {
  /** Filtros */
  const [periodo, setPeriodo] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const [frente, setFrente] = useState<string>("");
  const [setor, setSetor] = useState<string>("");
  const [fazenda, setFazenda] = useState<string>("");

  /** Dados */
  const [dados, setDados] = useState<BoletimCav[]>([]);
  const [loading, setLoading] = useState(false);

  /** Buscar dados */
  useEffect(() => {
    const fetchData = async () => {
      if (!periodo) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("boletins_cav")
        .select("operador, codigo:codigo_fazenda, producao, lamina_alvo, lamina_aplicada, frente, setor")
        .gte("data", periodo.from.toISOString().slice(0, 10))
        .lte("data", periodo.to.toISOString().slice(0, 10));

      if (error) {
        console.error("Erro ao buscar dados CAV:", error);
        setLoading(false);
        return;
      }

      let filtrados = (data || []) as BoletimCav[];
      if (frente) filtrados = filtrados.filter((d) => d.frente === frente);
      if (setor) filtrados = filtrados.filter((d) => d.setor === setor);
      if (fazenda) filtrados = filtrados.filter((d) => d.codigo === fazenda);
      setDados(filtrados);
      setLoading(false);
    };

    fetchData();
  }, [periodo, frente, setor, fazenda]);

  /** Agregações */
  const resumoPorOperador = useMemo(() => {
    const map = new Map<string, number>();
    dados.forEach((d) => {
      const atual = map.get(d.operador) || 0;
      map.set(d.operador, atual + d.producao);
    });
    return Array.from(map.entries()).map(([operador, ha]) => ({ operador, ha }));
  }, [dados]);

  const resumoPorFazenda = useMemo(() => {
    const map = new Map<string, { ha: number; alvo: number; aplicada: number; count: number }>();
    dados.forEach((d) => {
      const obj = map.get(d.codigo) || { ha: 0, alvo: 0, aplicada: 0, count: 0 };
      obj.ha += d.producao;
      obj.alvo += d.lamina_alvo;
      obj.aplicada += d.lamina_aplicada;
      obj.count += 1;
      map.set(d.codigo, obj);
    });
    return Array.from(map.entries()).map(([codigo, obj]) => ({
      codigo,
      ha: obj.ha,
      alvo: obj.alvo / obj.count || 0,
      aplicada: obj.aplicada / obj.count || 0,
      dif: obj.alvo ? ((obj.aplicada / obj.alvo) * 100 - 100) : 0,
    }));
  }, [dados]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Visão Geral CAV</h1>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted p-4 rounded-md">
        <DatePickerWithRange value={periodo} onChange={setPeriodo} />
        <Input placeholder="Frente" value={frente} onChange={(e) => setFrente(e.target.value)} />
        <Input placeholder="Setor" value={setor} onChange={(e) => setSetor(e.target.value)} />
        <Input placeholder="Fazenda" value={fazenda} onChange={(e) => setFazenda(e.target.value)} />
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total de Registros</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{dados.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Operadores únicos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{resumoPorOperador.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fazendas únicas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{resumoPorFazenda.length}</CardContent>
        </Card>
      </div>

      {/* Placeholders para gráficos – a serem implementados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="h-72 flex items-center justify-center text-muted-foreground">Gráfico Operadores (em construção)</Card>
        <Card className="h-72 flex items-center justify-center text-muted-foreground">Gráfico Fazendas (em construção)</Card>
      </div>

      {loading && <p>Carregando...</p>}
    </div>
  );
};

export default VisaoGeralCavPage;
