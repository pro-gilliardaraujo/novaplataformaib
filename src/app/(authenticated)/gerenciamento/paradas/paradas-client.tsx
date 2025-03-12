"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useCallback, useState } from "react";
import { Frota, ParadaRegistro, ParadaRegistroRow, TipoParada, Unidade } from "./types";
import { Database } from "./database.types";

interface ParadasClientProps {
  frotas: Frota[];
  tiposParada: TipoParada[];
  unidades: Unidade[];
}

export function ParadasClient({
  frotas: frotasIniciais,
  tiposParada,
  unidades,
}: ParadasClientProps) {
  const [frotas, setFrotas] = useState<Frota[]>(frotasIniciais);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string>("");
  const supabase = createClientComponentClient<Database>();

  const atualizarStatusFrota = useCallback(
    async (frota: Frota, novaParada?: ParadaRegistroRow) => {
      const frotasAtualizadas = frotas.map((f) => {
        if (f.id === frota.id) {
          return {
            ...f,
            status: novaParada ? ("parado" as const) : ("operando" as const),
            parada: novaParada
              ? {
                  tipo: novaParada.paradas_tipos.nome,
                  inicio: new Date(novaParada.horario_inicio),
                  previsao_minutos: novaParada.previsao_minutos,
                  motivo: novaParada.motivo,
                }
              : undefined,
          };
        }
        return f;
      });
      setFrotas(frotasAtualizadas);
    },
    [frotas]
  );

  const registrarParada = useCallback(
    async (frota: Frota, tipoId: string, previsaoMinutos: number, motivo: string) => {
      const { data: novaParada } = await supabase
        .from("paradas_registros")
        .insert({
          frota_id: frota.id,
          tipo_id: tipoId,
          horario_inicio: new Date().toISOString(),
          previsao_minutos: previsaoMinutos,
          motivo,
        })
        .select(`
          id,
          frota_id,
          tipo_id,
          horario_inicio,
          previsao_minutos,
          motivo,
          paradas_tipos (
            nome
          )
        `)
        .single();

      if (novaParada) {
        await atualizarStatusFrota(frota, novaParada);
      }
    },
    [atualizarStatusFrota, supabase]
  );

  const finalizarParada = useCallback(
    async (frota: Frota) => {
      const { data: paradaAtiva } = await supabase
        .from("paradas_registros")
        .select("id")
        .is("horario_fim", null)
        .eq("frota_id", frota.id)
        .single();

      if (paradaAtiva) {
        await supabase
          .from("paradas_registros")
          .update({ horario_fim: new Date().toISOString() })
          .eq("id", paradaAtiva.id);

        await atualizarStatusFrota(frota);
      }
    },
    [atualizarStatusFrota, supabase]
  );

  const frotasFiltradas = unidadeSelecionada
    ? frotas.filter((frota) => frota.unidade_id === unidadeSelecionada)
    : frotas;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <select
          value={unidadeSelecionada}
          onChange={(e) => setUnidadeSelecionada(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">Todas as unidades</option>
          {unidades.map((unidade) => (
            <option key={unidade.id} value={unidade.id}>
              {unidade.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {frotasFiltradas.map((frota) => (
          <div
            key={frota.id}
            className="p-4 border rounded shadow"
          >
            <h3 className="text-lg font-bold mb-2">
              {frota.codigo} - {frota.modelo}
            </h3>
            <p className="mb-2">
              Unidade: {frota.unidades?.nome || "Não definida"}
            </p>
            <p className="mb-2">
              Status:{" "}
              <span
                className={`font-bold ${
                  frota.status === "operando"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {frota.status === "operando" ? "Operando" : "Parado"}
              </span>
            </p>

            {frota.status === "operando" ? (
              <div>
                <select
                  id={`tipo-${frota.id}`}
                  className="p-2 border rounded mb-2 w-full"
                >
                  {tiposParada.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  id={`previsao-${frota.id}`}
                  placeholder="Previsão (minutos)"
                  className="p-2 border rounded mb-2 w-full"
                />
                <textarea
                  id={`motivo-${frota.id}`}
                  placeholder="Motivo"
                  className="p-2 border rounded mb-2 w-full"
                />
                <button
                  onClick={() => {
                    const tipoSelect = document.getElementById(
                      `tipo-${frota.id}`
                    ) as HTMLSelectElement;
                    const previsaoInput = document.getElementById(
                      `previsao-${frota.id}`
                    ) as HTMLInputElement;
                    const motivoTextarea = document.getElementById(
                      `motivo-${frota.id}`
                    ) as HTMLTextAreaElement;

                    registrarParada(
                      frota,
                      tipoSelect.value,
                      Number(previsaoInput.value),
                      motivoTextarea.value
                    );
                  }}
                  className="bg-red-500 text-white p-2 rounded w-full"
                >
                  Registrar Parada
                </button>
              </div>
            ) : frota.parada ? (
              <div>
                <p>Tipo: {frota.parada.tipo}</p>
                <p>
                  Início:{" "}
                  {frota.parada.inicio.toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
                <p>Previsão: {frota.parada.previsao_minutos} minutos</p>
                <p>Motivo: {frota.parada.motivo}</p>
                <button
                  onClick={() => finalizarParada(frota)}
                  className="bg-green-500 text-white p-2 rounded w-full mt-2"
                >
                  Finalizar Parada
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
} 