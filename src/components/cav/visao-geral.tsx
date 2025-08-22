"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { BoletimCav } from "@/types/cav";
import { FileText, Calendar, Users, Tractor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterDropdown } from "@/components/ui/filter-dropdown"

export function CavVisaoGeral() {
  const [periodo, setPeriodo] = useState<{ from: Date; to: Date } | undefined>();
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<BoletimCav[]>([]);

  const [frentesSel, setFrentesSel] = useState<Set<string>>(new Set());
  const [setoresSel, setSetoresSel] = useState<Set<string>>(new Set());
  const [codigosSel, setCodigosSel] = useState<Set<string>>(new Set());
  const [operadoresSel, setOperadoresSel] = useState<Set<string>>(new Set());
  const [allFrentes, setAllFrentes] = useState<string[]>([]);

  // carregar lista completa de frentes (uma vez)
  useEffect(() => {
    const loadFrentes = async () => {
      const { data, error } = await supabase
        .from("boletins_cav")
        .select("frente")
        .not("frente", "is", null);
      if (!error && data) {
        const uniques = Array.from(new Set(data.map((d: any) => d.frente))).filter(Boolean);
        setAllFrentes(uniques);
      }
    };
    loadFrentes();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase
        .from("boletins_cav")
        .select("operador, codigo:codigo_fazenda, producao, frente, setor, data, lamina_alvo, lamina_aplicada")
        .order("data", { ascending: false });

      if (periodo) {
        query = query
          .gte("data", periodo.from.toISOString().slice(0, 10))
          .lte("data", periodo.to.toISOString().slice(0, 10));
      }

      const { data, error } = await query;
      if (!error && data) {
        let arr = data as BoletimCav[];
        if(frentesSel.size) arr = arr.filter(d=>frentesSel.has(d.frente));
        if(setoresSel.size) arr = arr.filter(d=> d.setor && setoresSel.has(d.setor));
        if(codigosSel.size) arr = arr.filter(d=>codigosSel.has(d.codigo));
        if(operadoresSel.size) arr = arr.filter(d=>operadoresSel.has(d.operador));
        setDados(arr);
      }
      setLoading(false);
    };

    fetch();
  }, [periodo, frentesSel, setoresSel, codigosSel, operadoresSel]);

  const totalHa = dados.reduce((s, d) => s + d.producao, 0);
  const operadoresUnicos = new Set(dados.map((d) => d.operador)).size;
  const fazendasUnicas = new Set(dados.map((d) => d.codigo)).size;

  const options = useMemo(()=>{
    const f=new Set<string>(), s=new Set<string>(), fa=new Set<string>(), o=new Set<string>();
    dados.forEach(d=>{f.add(d.frente); if(d.setor) s.add(d.setor); fa.add(d.codigo); o.add(d.operador)});
    return {
      frentes: allFrentes.length? allFrentes : Array.from(f),
      setores:Array.from(s),
      codigos:Array.from(fa),
      operadores:Array.from(o)
    }
  },[dados, allFrentes]);

  return (
    <div className="space-y-4 p-4">
      <div className="grid md:grid-cols-5 gap-3 p-2 items-start">
        <DateRangePicker 
          value={periodo} 
          onChange={(val) => setPeriodo(val as any)} 
        />

        <FilterDropdown
          title="Frente"
          options={options.frentes}
          selectedOptions={frentesSel}
          onOptionToggle={(opt)=>{
            const ns=new Set(frentesSel); ns.has(opt)?ns.delete(opt):ns.add(opt); setFrentesSel(ns);
          }}
          onClear={()=>setFrentesSel(new Set())}
        />

        <FilterDropdown
          title="Setor"
          options={options.setores}
          selectedOptions={setoresSel}
          onOptionToggle={(opt)=>{const ns=new Set(setoresSel); ns.has(opt)?ns.delete(opt):ns.add(opt); setSetoresSel(ns)}}
          onClear={()=>setSetoresSel(new Set())}
        />

        <FilterDropdown
          title="Código"
          options={options.codigos}
          selectedOptions={codigosSel}
          onOptionToggle={(opt)=>{const ns=new Set(codigosSel); ns.has(opt)?ns.delete(opt):ns.add(opt); setCodigosSel(ns)}}
          onClear={()=>setCodigosSel(new Set())}
        />

        <FilterDropdown
          title="Operador"
          options={options.operadores}
          selectedOptions={operadoresSel}
          onOptionToggle={(opt)=>{const ns=new Set(operadoresSel); ns.has(opt)?ns.delete(opt):ns.add(opt); setOperadoresSel(ns)}}
          onClear={()=>setOperadoresSel(new Set())}
        />
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
