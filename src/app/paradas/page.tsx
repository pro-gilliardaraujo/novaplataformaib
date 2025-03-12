import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { ParadasClient } from "./paradas-client";
import { Database } from "./database.types";

export const dynamic = "force-dynamic";

export default async function ParadasPage() {
  const supabase = createServerComponentClient<Database>({ cookies });

  // Buscar frotas
  const { data: frotas } = await supabase
    .from("paradas_frotas")
    .select(`
      id,
      codigo,
      modelo,
      unidade_id,
      tipo,
      unidades (
        id,
        nome,
        codigo
      )
    `)
    .eq("ativo", true);

  // Buscar tipos de parada
  const { data: tiposParada } = await supabase
    .from("paradas_tipos")
    .select("id, nome")
    .eq("ativo", true);

  // Buscar unidades
  const { data: unidades } = await supabase
    .from("unidades")
    .select("id, nome, codigo")
    .eq("ativo", true);

  // Buscar paradas ativas
  const { data: paradasAtivas } = await supabase
    .from("paradas_registros")
    .select(`
      id,
      frota_id,
      tipo_id,
      horario_inicio,
      previsao_minutos,
      motivo,
      paradas_tipos!inner (
        nome
      )
    `)
    .is("horario_fim", null);

  // Preparar dados para o cliente
  const frotasComStatus = frotas?.map((frota) => {
    const paradaAtiva = paradasAtivas?.find(
      (parada) => parada.frota_id === frota.id
    );

    return {
      ...frota,
      status: paradaAtiva ? "parado" : "operando",
      parada: paradaAtiva
        ? {
            tipo: paradaAtiva.paradas_tipos.nome,
            inicio: new Date(paradaAtiva.horario_inicio),
            previsao_minutos: paradaAtiva.previsao_minutos,
            motivo: paradaAtiva.motivo,
          }
        : undefined,
    };
  });

  return (
    <ParadasClient
      frotas={frotasComStatus || []}
      tiposParada={tiposParada || []}
      unidades={unidades || []}
    />
  );
} 