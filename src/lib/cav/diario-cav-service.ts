import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";
import { DiarioCavFrotaData } from "@/types/diario-cav";

interface BoletimCavData {
  frota: number;
  turno: string;
  operador: string;
  codigo: string;
  producao: number;
  lamina_alvo: number;
}

interface FrotaProducaoData {
  frota: number;
  turnos: {
    turno: string;
    codigo: string;
    producao: number;
    operador: string;
  }[];
  total_producao: number;
  horas_motor: number;
  hectare_por_hora: number;
  motor_ocioso_perc: number;
  combustivel_consumido: number;
}

export async function buscarDadosProducaoPorFrenteData(frente: string, data: Date) {
  const supabase = createClientComponentClient();
  const dataFormatada = format(data, "yyyy-MM-dd");
  
  try {
    // Buscar dados de boletins para a frente e data
    const { data: boletins, error: boletinsError } = await supabase
      .from("boletins_cav")
      .select("frota, turno, operador, codigo, producao, lamina_alvo")
      .eq("frente", frente)
      .eq("data", dataFormatada);
      
    if (boletinsError) {
      console.error("Erro ao buscar boletins:", boletinsError);
      throw new Error("Erro ao buscar dados de produção");
    }
    
    // Agrupar dados por frota e turno
    const dadosPorFrota = new Map<number, BoletimCavData[]>();
    
    boletins?.forEach((boletim) => {
      if (!dadosPorFrota.has(boletim.frota)) {
        dadosPorFrota.set(boletim.frota, []);
      }
      dadosPorFrota.get(boletim.frota)?.push(boletim);
    });
    
    // Buscar dados de OPC para a mesma data (para horas motor, consumo, etc)
    const { data: opcData, error: opcError } = await supabase
      .from("diario_cav")
      .select("dados")
      .eq("frente", frente)
      .eq("data", dataFormatada)
      .single();
      
    if (opcError && opcError.code !== "PGRST116") { // PGRST116 = not found
      console.error("Erro ao buscar dados OPC:", opcError);
    }
    
    // Dados OPC (horas motor, consumo, etc)
    const dadosOPC = opcData?.dados || {};
    
    // Montar dados consolidados
    const frotasProducao: FrotaProducaoData[] = [];
    
    dadosPorFrota.forEach((boletins, frota) => {
      const dadosFrota = dadosOPC[frota.toString()] as DiarioCavFrotaData || {
        h_motor: 0,
        h_ociosa: 0,
        h_trabalho: 0
      };
      
      // Calcular total de produção para esta frota
      const totalProducao = boletins.reduce((sum, b) => sum + b.producao, 0);
      
      // Calcular hectare por hora motor
      const hectarePorHora = dadosFrota.h_motor > 0 
        ? totalProducao / dadosFrota.h_motor 
        : 0;
      
      // Calcular percentual de motor ocioso
      const motorOciosoPerc = dadosFrota.h_motor > 0 
        ? (dadosFrota.h_ociosa / dadosFrota.h_motor) * 100 
        : 0;
      
      // Buscar consumo de combustível do OPC
      const combustivelConsumido = 0; // Precisamos adicionar esta informação no dadosOPC
      
      // Organizar dados por turno
      const turnosDados = boletins.map(b => ({
        turno: b.turno,
        codigo: b.codigo,
        producao: b.producao,
        operador: b.operador
      }));
      
      frotasProducao.push({
        frota,
        turnos: turnosDados,
        total_producao: totalProducao,
        horas_motor: dadosFrota.h_motor,
        hectare_por_hora: hectarePorHora,
        motor_ocioso_perc: motorOciosoPerc,
        combustivel_consumido
      });
    });
    
    // Calcular totais gerais
    const totalGeral = {
      total_producao: frotasProducao.reduce((sum, f) => sum + f.total_producao, 0),
      total_horas_motor: frotasProducao.reduce((sum, f) => sum + f.horas_motor, 0),
      lamina_alvo: 10, // Valor padrão, pode ser ajustado
      total_viagens: 20, // Valor a ser calculado ou informado pelo usuário
    };
    
    // Calcular lâmina aplicada
    const laminaAplicada = totalGeral.total_viagens > 0 && totalGeral.total_producao > 0
      ? (totalGeral.total_viagens * 60) / totalGeral.total_producao
      : 0;
    
    // Calcular viagens orçadas
    const viagensOrcadas = totalGeral.total_producao > 0 && totalGeral.lamina_alvo > 0
      ? (totalGeral.total_producao * totalGeral.lamina_alvo) / 60
      : 0;
    
    // Calcular diferença percentual de viagens
    const difViagensPerc = viagensOrcadas > 0
      ? ((totalGeral.total_viagens - viagensOrcadas) / viagensOrcadas) * 100
      : 0;
    
    return {
      frotas: frotasProducao,
      totais: {
        ...totalGeral,
        lamina_aplicada: laminaAplicada,
        viagens_orcadas: viagensOrcadas,
        dif_viagens_perc: difViagensPerc
      }
    };
  } catch (error) {
    console.error("Erro ao buscar dados de produção:", error);
    throw error;
  }
}
