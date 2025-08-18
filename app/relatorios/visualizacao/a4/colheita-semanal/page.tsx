'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Box, VStack, Heading, Image, Flex, Text, SimpleGrid, Center, Spinner, Grid, GridItem, Card, CardBody, Button, Switch, FormControl, FormLabel } from '@chakra-ui/react';
import A4Colheita from '@/components/Layout/A4Colheita';
import { useReportStore } from '@/store/useReportStore';
import { GraficoDisponibilidadeMecanicaColheita } from '@/components/Charts/Colheita/Diario/GraficoDisponibilidadeMecanicaColheita';
import { GraficoEficienciaEnergetica } from '@/components/Charts/Colheita/Diario/GraficoEficienciaEnergetica';
import { GraficoHorasElevador } from '@/components/Charts/Colheita/Diario/GraficoHorasElevador';
import { GraficoMotorOciosoColheita } from '@/components/Charts/Colheita/Diario/GraficoMotorOciosoColheita';
import { GraficoUsoGPS } from '@/components/Charts/Colheita/Diario/GraficoUsoGPS';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FaPrint } from 'react-icons/fa';
import { configManager } from '@/utils/config';
import TabelaOperadores from '@/components/TabelaOperadores';
import TabelaFrotas from '@/components/TabelaFrotas';
import { DateRangeDisplay } from '@/components/DateRangeDisplay';
import IndicatorCard from '@/components/IndicatorCard';
import { GraficoMediaVelocidadeColheita } from '@/components/Charts/Colheita/Diario/GraficoMediaVelocidadeColheita';
import { GraficoMediaVelocidadeTransbordo } from '@/components/Charts/Transbordo/Diario/GraficoMediaVelocidadeTransbordo';
import { GraficoProducao } from '@/components/Charts/Colheita/Diario/GraficoProducao';
import { GraficoTDH } from '@/components/Charts/Colheita/Semanal/GraficoTDH';
import { GraficoDiesel } from '@/components/Charts/Colheita/Semanal/GraficoDiesel';
import { GraficoImpurezaVegetal } from '@/components/Charts/Colheita/Semanal/GraficoImpurezaVegetal';

interface ColheitaA4Props {
  data?: any;
}

// Interface para a configuração de visibilidade
interface VisibilityConfig {
  colheita: {
    disponibilidadeMecanica: boolean;
    eficienciaEnergetica: boolean;
    motorOcioso: boolean;
    horaElevador: boolean;
    usoGPS: boolean;
    mediaVelocidade: boolean;
    diesel: boolean;
    tdh: boolean;
    impurezaVegetal: boolean;
    graficoProducao: boolean;
  };
  transbordo: {
    disponibilidadeMecanica: boolean;
    eficienciaEnergetica: boolean;
    motorOcioso: boolean;
    faltaApontamento: boolean;
    usoGPS: boolean;
    mediaVelocidade: boolean;
    diesel: boolean;
    tdh: boolean;
    impurezaVegetal: boolean;
  };
}

// Função utilitária para verificar formato de dados
const verificarFormatoDados = (dados: any) => {
  if (!dados) return false;
  
  const temDisponibilidade = Array.isArray(dados.disponibilidade_mecanica) && 
    dados.disponibilidade_mecanica.length > 0 &&
    dados.disponibilidade_mecanica.some((item: any) => item && item.frota && item.disponibilidade !== undefined);
  
  const temEficiencia = Array.isArray(dados.eficiencia_energetica) && 
    dados.eficiencia_energetica.length > 0 &&
    dados.eficiencia_energetica.some((item: any) => item && item.nome && item.eficiencia !== undefined);
  
  const temHorasElevador = Array.isArray(dados.hora_elevador) && 
    dados.hora_elevador.length > 0 &&
    dados.hora_elevador.some((item: any) => item && item.nome && item.horas !== undefined);
  
  const temMotorOcioso = Array.isArray(dados.motor_ocioso) && 
    dados.motor_ocioso.length > 0 &&
    dados.motor_ocioso.some((item: any) => item && item.nome && item.percentual !== undefined);
  
  const temUsoGPS = Array.isArray(dados.uso_gps) && 
    dados.uso_gps.length > 0 &&
    dados.uso_gps.some((item: any) => item && item.nome && item.porcentagem !== undefined);
  
  // Verificar se pelo menos uma das seções tem dados
  return temDisponibilidade || temEficiencia || temHorasElevador || temMotorOcioso || temUsoGPS;
};

// Componente para título de seção
const SectionTitle = ({ title, centered = true }: { title: string; centered?: boolean }) => (
  <Heading 
    as="h2" 
    size="sm" 
    textAlign={centered ? "center" : "left"} 
    mb={2} 
    fontSize="15px"
    color="black"
  >
    {title}
  </Heading>
);

interface DataItem {
  frota?: string;
  valor?: number;
  disponibilidade?: number;
  operador?: string;
  horas?: number;
  percentual?: number;
  porcentagem?: number;
}

interface AcimaMeta {
  quantidade: number;
  total: number;
  percentual: number;
}

interface Metas {
  disponibilidadeMecanica: number;
  eficienciaEnergetica: number;
  horaElevador: number;
  motorOcioso: number;
  usoGPS: number;
  mediaVelocidade: number;
}

// Função para calcular média - definida no escopo global do componente
const calcularMedia = (array: any[] | undefined, propriedade: string): number => {
  if (!array || array.length === 0) return 0;
  const valoresTotais = array.reduce((acc, item) => {
    if (item && typeof item[propriedade] === 'number') {
      return acc + item[propriedade];
    }
    return acc;
  }, 0);
  return valoresTotais / array.length;
};

// Função para contar itens acima/abaixo da meta - definida no escopo global do componente
const contarItensMeta = (array: any[] | undefined, propriedade: string, meta: number, maiorMelhor: boolean = true): number => {
  if (!array || array.length === 0) return 0;
  return array.filter(item => {
    if (!item || typeof item[propriedade] !== 'number') return false;
    return maiorMelhor ? item[propriedade] >= meta : item[propriedade] <= meta;
  }).length;
};

// Processamento dos dados para o resumo - MOVIDO PARA ANTES DO useMemo
const processarDadosResumo = (dados: any): ResumoData => {
  // Obter metas do relatório ou usar as metas padrão da configuração
  const metasConfig = configManager.getMetas('colheita_semanal');
  const metas: Metas = {
    disponibilidadeMecanica: metasConfig?.disponibilidadeMecanica ?? 90,
    eficienciaEnergetica: metasConfig?.eficienciaEnergetica ?? 70,
    horaElevador: metasConfig?.horaElevador ?? 5,
    motorOcioso: metasConfig?.motorOcioso ?? 4,
    usoGPS: metasConfig?.usoGPS ?? 90,
    mediaVelocidade: metasConfig?.mediaVelocidade ?? 7
  };

  // Se temos metas no relatório, usar elas
  if (dados?.metas) {
    console.log("📊 Usando metas do relatório:", dados.metas);
    Object.assign(metas, dados.metas);
  }
  
  // Se não temos dados, retornar uma estrutura vazia com metas
  if (!dados || Object.keys(dados).length === 0) {
    console.warn("📊 Sem dados para processar em processarDadosResumo");
    return {
      disponibilidade_mecanica: {
        data: [],
        meta: 0,
        media: 0,
        acimaMeta: {
          quantidade: 0,
          total: 0,
          percentual: 0
        }
      },
      eficiencia_energetica: {
        data: [],
        meta: 0,
        media: 0,
        acimaMeta: {
          quantidade: 0,
          total: 0,
          percentual: 0
        }
      },
      motor_ocioso: {
        data: [],
        meta: 0,
        media: 0,
        acimaMeta: {
          quantidade: 0,
          total: 0,
          percentual: 0
        }
      },
      hora_elevador: {
        data: [],
        meta: 0,
        media: 0,
        acimaMeta: {
          quantidade: 0,
          total: 0,
          percentual: 0
        }
      },
      uso_gps: {
        data: [],
        meta: 0,
        media: 0,
        acimaMeta: {
          quantidade: 0,
          total: 0,
          percentual: 0
        }
      },
      media_velocidade: {
        data: [],
        meta: 0,
        media: 0,
        acimaMeta: {
          quantidade: 0,
          total: 0,
          percentual: 0
        }
      },
    };
  }

  console.log("📊 Processando dados em processarDadosResumo:", dados);
  
  return {
    disponibilidade_mecanica: {
      data: dados.disponibilidade_mecanica || [],
      meta: metas.disponibilidadeMecanica,
      media: calcularMedia(dados.disponibilidade_mecanica, 'disponibilidade'),
      acimaMeta: {
        quantidade: contarItensMeta(dados.disponibilidade_mecanica, 'disponibilidade', metas.disponibilidadeMecanica),
        total: dados.disponibilidade_mecanica.length || 1,
        percentual: (contarItensMeta(dados.disponibilidade_mecanica, 'disponibilidade', metas.disponibilidadeMecanica) / (dados.disponibilidade_mecanica.length || 1)) * 100
      }
    },
    eficiencia_energetica: {
      data: dados.eficiencia_energetica || [],
      meta: metas.eficienciaEnergetica,
      media: calcularMedia(dados.eficiencia_energetica, 'eficiencia'),
      acimaMeta: {
        quantidade: contarItensMeta(dados.eficiencia_energetica, 'eficiencia', metas.eficienciaEnergetica),
        total: dados.eficiencia_energetica.length || 1,
        percentual: (contarItensMeta(dados.eficiencia_energetica, 'eficiencia', metas.eficienciaEnergetica) / (dados.eficiencia_energetica.length || 1)) * 100
      }
    },
    motor_ocioso: {
      data: dados.motor_ocioso || [],
      meta: metas.motorOcioso,
      media: calcularMedia(dados.motor_ocioso, 'percentual'),
      acimaMeta: {
        quantidade: contarItensMeta(dados.motor_ocioso, 'percentual', metas.motorOcioso, false),
        total: dados.motor_ocioso.length || 1,
        percentual: (contarItensMeta(dados.motor_ocioso, 'percentual', metas.motorOcioso, false) / (dados.motor_ocioso.length || 1)) * 100
      }
    },
    hora_elevador: {
      data: dados.hora_elevador || [],
      meta: metas.horaElevador,
      media: calcularMedia(dados.hora_elevador, 'horas'),
      acimaMeta: {
        quantidade: contarItensMeta(dados.hora_elevador, 'horas', metas.horaElevador),
        total: dados.hora_elevador.length || 1,
        percentual: (contarItensMeta(dados.hora_elevador, 'horas', metas.horaElevador) / (dados.hora_elevador.length || 1)) * 100
      }
    },
    uso_gps: {
      data: dados.uso_gps || [],
      meta: metas.usoGPS,
      media: calcularMedia(dados.uso_gps, 'porcentagem'),
      acimaMeta: {
        quantidade: contarItensMeta(dados.uso_gps, 'porcentagem', metas.usoGPS),
        total: dados.uso_gps.length || 1,
        percentual: (contarItensMeta(dados.uso_gps, 'porcentagem', metas.usoGPS) / (dados.uso_gps.length || 1)) * 100
      }
    },
    media_velocidade: {
      data: dados.media_velocidade || [],
      meta: metas.mediaVelocidade,
      media: calcularMedia(dados.media_velocidade, 'velocidade'),
      acimaMeta: {
        quantidade: contarItensMeta(dados.media_velocidade, 'velocidade', metas.mediaVelocidade),
        total: dados.media_velocidade.length || 0,
        percentual: (contarItensMeta(dados.media_velocidade, 'velocidade', metas.mediaVelocidade) / (dados.media_velocidade.length || 1)) * 100
      }
    },
  };
};

interface HorasPorFrota {
  frota: string;
  horasRegistradas: number;
  diferencaPara24h: number;
}

interface ResumoData {
  disponibilidade_mecanica: {
    data: Array<{
      frota: string;
      disponibilidade: number;
    }>;
    meta: number;
    media: number;
    acimaMeta: {
      quantidade: number;
      total: number;
      percentual: number;
    };
  };
  eficiencia_energetica: {
    data: Array<{
      id: string;
      nome: string;
      eficiencia: number;
    }>;
    meta: number;
    media: number;
    acimaMeta: {
      quantidade: number;
      total: number;
      percentual: number;
    };
  };
  motor_ocioso: {
    data: Array<{
      id: string;
      nome: string;
      percentual: number;
    }>;
    meta: number;
    media: number;
    acimaMeta: {
      quantidade: number;
      total: number;
      percentual: number;
    };
  };
  hora_elevador: {
    data: Array<{
      id: string;
      nome: string;
      horas: number;
    }>;
    meta: number;
    media: number;
    acimaMeta: {
      quantidade: number;
      total: number;
      percentual: number;
    };
  };
  uso_gps: {
    data: Array<{
      id: string;
      nome: string;
      porcentagem: number;
    }>;
    meta: number;
    media: number;
    acimaMeta: {
      quantidade: number;
      total: number;
      percentual: number;
    };
  };
  media_velocidade: {
    data: Array<{
      id: string;
      nome: string;
      velocidade: number;
    }>;
    meta: number;
    media: number;
    acimaMeta: {
      quantidade: number;
      total: number;
      percentual: number;
    };
  };
  diesel?: {
    data: Array<{
      frota: string;
      consumo: number;
      data?: string;
    }>;
    meta: number;
    media: number;
    acimaMeta: {
      quantidade: number;
      total: number;
      percentual: number;
    };
  };
  tdh?: {
    data: Array<{
      frota: string;
      valor: number;
      data?: string;
    }>;
    meta: number;
    media: number;
    acimaMeta: {
      quantidade: number;
      total: number;
      percentual: number;
    };
  };
  impureza_vegetal?: {
    data: Array<{
      frota: string;
      percentual: number;
      data?: string;
    }>;
    meta: number;
    media: number;
    acimaMeta: {
      quantidade: number;
      total: number;
      percentual: number;
    };
  };
}

export default function ColheitaA4({ data }: ColheitaA4Props) {
  const router = useRouter();
  const { 
    images, 
    visibilityConfig, 
    setCurrentReportId, 
    getReportVisibilityConfig, 
    setReportVisibilityConfig 
  } = useReportStore();
  const searchParams = useSearchParams();
  const reportId = searchParams.get('id');
  const format = searchParams.get('format');
  const isPdfMode = format === 'pdf';
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nomeFrente, setNomeFrente] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  // Adicionando estado para controle de quais dados estão disponíveis
  const [dataStatus, setDataStatus] = useState({
    tdh: false,
    diesel: false,
    impurezaVegetal: false,
    graficoProducao: false,
    disponibilidadeMecanica: false,
    eficienciaEnergetica: false,
    horaElevador: false,
    motorOcioso: false,
    usoGPS: false,
    mediaVelocidade: false
  });
  const LOGO_HEIGHT = "50px";
  const LOGO_URL = "https://kjlwqezxzqjfhacmjhbh.supabase.co/storage/v1/object/public/sourcefiles/Logo%20IB%20Full.png";

  // Estado das seções a exibir
  const [secoes, setSecoes] = useState({
    disponibilidade_mecanica: true,
    eficiencia_energetica: true,
    hora_elevador: true,
    motor_ocioso: true,
    uso_gps: true,
    media_velocidade: true,
    diesel: false,
    tdh: false,
    impureza_vegetal: false,
    graficoProducao: false,
  });
  
  // Set the current report ID when this component loads
  useEffect(() => {
    if (reportId) {
      setCurrentReportId(reportId);
    }
    
    // Clean up when component unmounts
    return () => {
      setCurrentReportId(null);
    };
  }, [reportId, setCurrentReportId]);

  // Ajustar o secoesMemo para manter as chaves do estado corretas
  const secoesMemo = useMemo(() => {
    // Obter configurações de seções para o tipo de relatório
    const tipoRelatorio = reportData?.tipo || 'colheita_semanal';
    
    // Usar as configurações de visibilidade salvas com o relatório, se disponíveis
    const savedVisibility = reportData?.dados?.visibility;
    
    // Se não houver configurações salvas e tivermos um reportId, usar as do per-report store
    const reportSpecificVisibility = reportId ? getReportVisibilityConfig(reportId) : null;
    
    console.log("📊 Visibilidade salva no relatório:", savedVisibility);
    console.log("📊 Visibilidade específica do relatório no store:", reportSpecificVisibility);
    console.log("📊 Visibilidade global no store:", visibilityConfig);
    
    // Usar configurações padrão caso não exista
    const configSections = configManager.getTipoRelatorio(tipoRelatorio)?.secoes || {
      disponibilidade_mecanica: true,
      eficiencia_energetica: true,
      hora_elevador: true,
      motor_ocioso: true,
      uso_gps: true,
      media_velocidade: true,
      diesel: true,
      tdh: true,
      impureza_vegetal: true,
      graficoProducao: true
    };

    let finalConfig;
    
    // Prioridade 1: Se tivermos configurações específicas do relatório no store, usá-las
    if (reportSpecificVisibility && reportSpecificVisibility.colheita) {
      console.log("📊 Usando configurações específicas do relatório no store");
      
      // Mapeamento entre nomes de propriedades
      finalConfig = {
        ...configSections,
        disponibilidade_mecanica: reportSpecificVisibility.colheita.disponibilidadeMecanica ?? true,
        eficiencia_energetica: reportSpecificVisibility.colheita.eficienciaEnergetica ?? true,
        hora_elevador: reportSpecificVisibility.colheita.horaElevador ?? true,
        motor_ocioso: reportSpecificVisibility.colheita.motorOcioso ?? true,
        uso_gps: reportSpecificVisibility.colheita.usoGPS ?? true,
        media_velocidade: reportSpecificVisibility.colheita.mediaVelocidade ?? true,
        diesel: reportSpecificVisibility.colheita.diesel ?? true,
        tdh: reportSpecificVisibility.colheita.tdh ?? true,
        impureza_vegetal: reportSpecificVisibility.colheita.impurezaVegetal ?? true,
        graficoProducao: reportSpecificVisibility.colheita.graficoProducao ?? true
      };
    }
    // Prioridade 2: Se tivermos configurações salvas no relatório, usá-las
    else if (savedVisibility && savedVisibility.colheita) {
      console.log("📊 Usando configurações salvas no relatório");
      
      // Mapeamento entre nomes de propriedades
      finalConfig = {
        ...configSections,
        disponibilidade_mecanica: savedVisibility.colheita.disponibilidadeMecanica ?? true,
        eficiencia_energetica: savedVisibility.colheita.eficienciaEnergetica ?? true,
        hora_elevador: savedVisibility.colheita.horaElevador ?? true,
        motor_ocioso: savedVisibility.colheita.motorOcioso ?? true,
        uso_gps: savedVisibility.colheita.usoGPS ?? true,
        media_velocidade: savedVisibility.colheita.mediaVelocidade ?? true,
        diesel: savedVisibility.colheita.diesel ?? true,
        tdh: savedVisibility.colheita.tdh ?? true,
        impureza_vegetal: savedVisibility.colheita.impurezaVegetal ?? true,
        graficoProducao: savedVisibility.colheita.graficoProducao ?? true
      };

      // Se tivermos um reportId, atualizar o store com essas configurações
      if (reportId) {
        setReportVisibilityConfig(reportId, savedVisibility);
      }
    }
    // Por último, usar as configurações globais do store
    else {
      console.log("📊 Usando configurações globais do store");
      // Mapeamento entre nomes de propriedades
      finalConfig = {
        ...configSections,
        disponibilidade_mecanica: visibilityConfig.colheita.disponibilidadeMecanica ?? true,
        eficiencia_energetica: visibilityConfig.colheita.eficienciaEnergetica ?? true,
        hora_elevador: visibilityConfig.colheita.horaElevador ?? true,
        motor_ocioso: visibilityConfig.colheita.motorOcioso ?? true,
        uso_gps: visibilityConfig.colheita.usoGPS ?? true,
        media_velocidade: visibilityConfig.colheita.mediaVelocidade ?? true,
        diesel: visibilityConfig.colheita.diesel ?? true,
        tdh: visibilityConfig.colheita.tdh ?? true,
        impureza_vegetal: visibilityConfig.colheita.impurezaVegetal ?? true,
        graficoProducao: visibilityConfig.colheita.graficoProducao ?? true
      };
      
      // Se tivermos um reportId, salvar como configuração específica do relatório
      if (reportId) {
        const reportConfig = { ...visibilityConfig };
        setReportVisibilityConfig(reportId, reportConfig);
      }
    }

    console.log("📊 Configuração final das seções:", finalConfig);
    
    // Atualizar o estado local com as configurações 
    setSecoes({
      disponibilidade_mecanica: finalConfig.disponibilidade_mecanica,
      eficiencia_energetica: finalConfig.eficiencia_energetica,
      hora_elevador: finalConfig.hora_elevador,
      motor_ocioso: finalConfig.motor_ocioso,
      uso_gps: finalConfig.uso_gps,
      media_velocidade: finalConfig.media_velocidade,
      diesel: finalConfig.diesel,
      tdh: finalConfig.tdh,
      impureza_vegetal: finalConfig.impureza_vegetal,
      graficoProducao: finalConfig.graficoProducao,
    });
    
    return finalConfig;
  }, [reportData, reportId, visibilityConfig, getReportVisibilityConfig, setReportVisibilityConfig]);

  // Atualizar o dataStatus para mostrar quais seções têm dados
  useEffect(() => {
    // Só atualizar status se tivermos dados do relatório
    if (reportData?.dados) {
      const temDadosTDH = Array.isArray(reportData.dados.tdh) && reportData.dados.tdh.length > 0;
      const temDadosDiesel = Array.isArray(reportData.dados.diesel) && reportData.dados.diesel.length > 0;
      const temDadosImpurezaVegetal = Array.isArray(reportData.dados.impureza_vegetal) && reportData.dados.impureza_vegetal.length > 0;
      const temDadosGraficoProducao = Array.isArray(reportData.dados.producao) && reportData.dados.producao.length > 0;

      console.log("📊 Verificação de dados disponíveis:", {
        tdh: temDadosTDH,
        diesel: temDadosDiesel,
        impurezaVegetal: temDadosImpurezaVegetal,
        graficoProducao: temDadosGraficoProducao
      });

      setDataStatus({
        tdh: temDadosTDH,
        diesel: temDadosDiesel,
        impurezaVegetal: temDadosImpurezaVegetal,
        graficoProducao: temDadosGraficoProducao,
        disponibilidadeMecanica: Boolean(reportData.dados.disponibilidade_mecanica && reportData.dados.disponibilidade_mecanica.length > 0),
        eficienciaEnergetica: Boolean(reportData.dados.eficiencia_energetica && reportData.dados.eficiencia_energetica.length > 0),
        horaElevador: Boolean(reportData.dados.hora_elevador && reportData.dados.hora_elevador.length > 0),
        motorOcioso: Boolean(reportData.dados.motor_ocioso && reportData.dados.motor_ocioso.length > 0),
        usoGPS: Boolean(reportData.dados.uso_gps && reportData.dados.uso_gps.length > 0),
        mediaVelocidade: Boolean(reportData.dados.media_velocidade && reportData.dados.media_velocidade.length > 0)
      });
    }
  }, [reportData]);

  // Função para formatar a data no padrão brasileiro
  const formatarData = (data: string) => {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    const dataObj = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
    return dataObj.toLocaleDateString('pt-BR');
  };

  const currentDate = formatarData(new Date().toISOString().split('T')[0]);

  // Função para formatar a data para o título do documento
  const formatarDataTitulo = (data: string) => {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}-${mes}`;
  };

  // Função para atualizar o título do documento
  const atualizarTituloDocumento = (frenteId: string, dataInicio: string, dataFim: string) => {
    const dataInicioFormatada = formatarDataTitulo(dataInicio);
    const dataFimFormatada = formatarDataTitulo(dataFim);
    const frentes = configManager.getFrentes('colheita_semanal');
    const frente = frentes.find(f => f.id === frenteId);
    const nomeFrenteCompleto = frente ? frente.nome : frenteId;
    const titulo = `Relatório Semanal de Colheita - ${nomeFrenteCompleto} - ${dataInicioFormatada} à ${dataFimFormatada}`;
    if (typeof window !== 'undefined') {
      window.document.title = titulo;
    }
  };

  useEffect(() => {
    console.log('📊 ReportID mudou para:', reportId);
    console.log('📊 ReportData:', reportData);
    
    if (reportId) {
      setLoading(true);
      const fetchData = async () => {
        try {
          const { data: report, error } = await supabase
            .from('relatorios_semanais')
            .select('*')
            .eq('id', reportId)
            .single();

          if (error) {
            console.error('❌ Erro ao buscar relatório:', error);
            setLoading(false);
            setError('Ocorreu um erro ao carregar os dados do relatório.');
            return;
          }

          if (!report) {
            console.error('❌ Relatório não encontrado');
            setLoading(false);
            setError('Relatório não encontrado.');
            return;
          }

          console.log('📊 Relatório carregado:', report);
          setReportData(report);
          
          // Tentar obter o nome da frente a partir do arquivo de configuração
          try {
            const frentes = configManager.getFrentes('colheita_semanal');
            const frente = frentes.find(f => f.id === report.frente);
            if (frente) {
              setNomeFrente(frente.nome);
            } else {
              setNomeFrente(report.frente);
            }

            // Atualizar o título do documento com o período
            if (report.data_inicio && report.data_fim) {
              atualizarTituloDocumento(report.frente, report.data_inicio, report.data_fim);
            }
          } catch (e) {
            console.error("Erro ao obter nome da frente:", e);
            setNomeFrente(report.frente);
          }
          
          setLoading(false);
        } catch (error) {
          console.error('❌ Erro ao buscar dados:', error);
          setLoading(false);
          setError('Ocorreu um erro ao carregar os dados do relatório.');
        }
      };

      fetchData();
    }
  }, [reportId]);

  // Preparar dados para a renderização
  const finalData = useMemo(() => {
    console.log('📊 Recalculando finalData com reportData:', reportData);
    if (loading) return null;
    if (!reportData?.dados) {
      console.warn('📊 Não há dados disponíveis para processamento');
      return null;
    }
    
    return processarDadosResumo(reportData.dados);
  }, [reportData, loading]);

  // Preparar dados para o footer de HorasPorFrota
  const dadosHorasPorFrota = useMemo(() => {
    if (!reportData?.dados?.horas_por_frota) return [];
    
    return reportData.dados.horas_por_frota
      .filter((item: any) => item && item.frota && item.frota.trim() !== '')
      .map((item: any) => ({
        frota: item.frota,
        horasRegistradas: Number(item.horasRegistradas || 0),
        diferencaPara24h: Number(item.diferencaPara24h || 0)
      }));
  }, [reportData]);

  // Verificar se estamos no modo de visualização ou no modo de relatório específico
  const isModoTemplate = !reportId;

  // COMPONENTES
  // Componente para o cabeçalho da página
  const PageHeader = ({ showDate = false }: { showDate?: boolean }) => {
    // Função para criar datas de forma segura usando UTC para evitar problemas de timezone
    const createSafeDate = (dateStr: string | undefined) => {
      if (!dateStr) return new Date();
      
      try {
        // Garantir que estamos trabalhando apenas com a parte da data
        const datePart = dateStr.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        
        // Usar UTC para evitar ajustes de timezone, com horário fixo às 12:00
        return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      } catch (error) {
        console.error("❌ Erro ao processar data para cabeçalho:", error);
        return new Date(dateStr);
      }
    };
    
    // Primeiro tentar usar os dados do metadata que estão no formato correto
    const startDate = reportData?.dados?.metadata?.start_date 
      ? createSafeDate(reportData.dados.metadata.start_date) 
      : reportData?.data_inicio 
        ? createSafeDate(reportData.data_inicio) 
        : new Date();
    
    const endDate = reportData?.dados?.metadata?.end_date 
      ? createSafeDate(reportData.dados.metadata.end_date) 
      : reportData?.data_fim 
        ? createSafeDate(reportData.data_fim) 
        : new Date();
    
    const frontName = nomeFrente || 'Frente 01';

    // Debug das datas para verificar o que está sendo usado
    console.log('Datas do relatório para o cabeçalho:', {
      metadata_start: reportData?.dados?.metadata?.start_date,
      metadata_end: reportData?.dados?.metadata?.end_date,
      data_inicio: reportData?.data_inicio,
      data_fim: reportData?.data_fim,
      startDateForHeader: startDate.toISOString(),
      endDateForHeader: endDate.toISOString()
    });

    return (
      <Flex justify="space-between" align="center" mb={4}>
        <Image
          src={LOGO_URL}
          alt="Logo IB"
          h={LOGO_HEIGHT}
          objectFit="contain"
        />
        <VStack spacing={1}>
          <Heading size="md" color="black" fontWeight="bold" textAlign="center">
            {`Relatório Semanal de Colheita - ${frontName} `} 
          </Heading>
          {showDate && <DateRangeDisplay startDate={startDate} endDate={endDate} />}
        </VStack>
        <Image 
          src={LOGO_URL} 
          alt="Logo IB"
          h={LOGO_HEIGHT}
          objectFit="contain"
        />
      </Flex>
    );
  };

  // RENDERIZAÇÃO CONDICIONAL
  // Se estiver carregando, mostrar indicador de loading
  if (loading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text>Carregando dados do relatório...</Text>
        </VStack>
      </Center>
    );
  }
  
  // RENDERIZAÇÃO PRINCIPAL
  return (() => {
    // Log para verificar todas as seções que devem ser exibidas
    console.log("📊 Estado atual das seções:", {
      secoes,
      dataStatus,
      reportData: {
        tdh: Boolean(reportData?.dados?.tdh) && Array.isArray(reportData?.dados?.tdh) && reportData?.dados?.tdh.length > 0,
        diesel: Boolean(reportData?.dados?.diesel) && Array.isArray(reportData?.dados?.diesel) && reportData?.dados?.diesel.length > 0,
        impurezaVegetal: Boolean(reportData?.dados?.impureza_vegetal) && Array.isArray(reportData?.dados?.impureza_vegetal) && reportData?.dados?.impureza_vegetal.length > 0,
        producao: Boolean(reportData?.dados?.producao) && Array.isArray(reportData?.dados?.producao) && reportData?.dados?.producao.length > 0,
        disponibilidadeMecanica: Boolean(reportData?.dados?.disponibilidade_mecanica) && Array.isArray(reportData?.dados?.disponibilidade_mecanica) && reportData?.dados?.disponibilidade_mecanica.length > 0,
        eficienciaEnergetica: Boolean(reportData?.dados?.eficiencia_energetica) && Array.isArray(reportData?.dados?.eficiencia_energetica) && reportData?.dados?.eficiencia_energetica.length > 0,
        horaElevador: Boolean(reportData?.dados?.hora_elevador) && Array.isArray(reportData?.dados?.hora_elevador) && reportData?.dados?.hora_elevador.length > 0,
        motorOcioso: Boolean(reportData?.dados?.motor_ocioso) && Array.isArray(reportData?.dados?.motor_ocioso) && reportData?.dados?.motor_ocioso.length > 0,
        usoGPS: Boolean(reportData?.dados?.uso_gps) && Array.isArray(reportData?.dados?.uso_gps) && reportData?.dados?.uso_gps.length > 0,
        mediaVelocidade: Boolean(reportData?.dados?.media_velocidade) && Array.isArray(reportData?.dados?.media_velocidade) && reportData?.dados?.media_velocidade.length > 0
      }
    });

    return (
      <Box position="relative">
        {/* Página 1 - TDH e Diesel (quando selecionados) */}
        {(secoes.tdh || secoes.diesel) && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader showDate={true} />
              
              <Grid templateRows={(secoes.tdh && secoes.diesel) ? "repeat(2, 1fr)" : "1fr"} gap={4} flex="1" p={4}>
                {/* TDH */}
                {secoes.tdh && (
                  <Box display="flex" flexDirection="column">
                    <SectionTitle title="TDH" />
                    <SimpleGrid columns={1} spacing={3} w="100%" mb={2}>
                      <IndicatorCard
                        title=""
                        value={reportData?.dados?.tdh && reportData.dados.tdh.length > 0 
                          ? calcularMedia(finalData?.tdh?.data || reportData.dados.tdh, 'valor')
                          : 0}
                        meta={finalData?.tdh?.meta || configManager.getMetas('colheita_semanal').tdh || 10}
                        unitType="valor"
                        acimaMeta={{
                          quantidade: reportData?.dados?.tdh && reportData.dados.tdh.length > 0 
                            ? contarItensMeta(finalData?.tdh?.data || reportData.dados.tdh, 'valor', finalData?.tdh?.meta || configManager.getMetas('colheita_semanal').tdh || 10)
                            : 0,
                          total: reportData?.dados?.tdh && reportData.dados.tdh.length > 0 
                            ? (finalData?.tdh?.data || reportData.dados.tdh).length 
                            : 1,
                          percentual: reportData?.dados?.tdh && reportData.dados.tdh.length > 0 
                            ? (contarItensMeta(finalData?.tdh?.data || reportData.dados.tdh, 'valor', finalData?.tdh?.meta || configManager.getMetas('colheita_semanal').tdh || 10) / ((finalData?.tdh?.data || reportData.dados.tdh).length || 1)) * 100
                            : 0
                        }}
                      />
                    </SimpleGrid>
                    <Box 
                      border="1px solid"
                      borderColor="black"
                      borderRadius="md"
                      p={2}
                      flex="1"
                      minH="200px"
                      display="flex"
                      flexDirection="column"
                    >
                      {reportData?.dados?.tdh && reportData.dados.tdh.length > 0 ? (
                        <GraficoTDH 
                          data={reportData.dados.tdh} 
                          meta={finalData?.tdh?.meta || configManager.getMetas('colheita_semanal').tdh || 10}
                        />
                      ) : (
                        <Flex flex="1" justify="center" align="center">
                          <Text fontSize="lg" color="gray.500">Sem dados</Text>
                        </Flex>
                      )}
                    </Box>
                  </Box>
                )}
                
                {/* Diesel */}
                {secoes.diesel && (
                  <Box flex="1" display="flex" flexDirection="column">
                    <SectionTitle title="Diesel" />
                    <SimpleGrid columns={1} spacing={3} w="100%" mb={2}>
                      <IndicatorCard
                        title=""
                        value={reportData?.dados?.diesel && reportData.dados.diesel.length > 0 
                          ? calcularMedia(finalData?.diesel?.data || reportData.dados.diesel, 'consumo')
                          : 0}
                        meta={finalData?.diesel?.meta || configManager.getMetas('colheita_semanal').diesel || 5}
                        unitType="consumo"
                        acimaMeta={{
                          quantidade: reportData?.dados?.diesel && reportData.dados.diesel.length > 0 
                            ? contarItensMeta(finalData?.diesel?.data || reportData.dados.diesel, 'consumo', finalData?.diesel?.meta || configManager.getMetas('colheita_semanal').diesel || 5)
                            : 0,
                          total: reportData?.dados?.diesel && reportData.dados.diesel.length > 0 
                            ? (finalData?.diesel?.data || reportData.dados.diesel).length 
                            : 1,
                          percentual: reportData?.dados?.diesel && reportData.dados.diesel.length > 0 
                            ? (contarItensMeta(finalData?.diesel?.data || reportData.dados.diesel, 'consumo', finalData?.diesel?.meta || configManager.getMetas('colheita_semanal').diesel || 5) / ((finalData?.diesel?.data || reportData.dados.diesel).length || 1)) * 100
                            : 0
                        }}
                      />
                    </SimpleGrid>
                    <Box 
                      border="1px solid"
                      borderColor="black"
                      borderRadius="md"
                      p={2}
                      flex="1"
                      minH="200px"
                      display="flex"
                      flexDirection="column"
                    >
                      {reportData?.dados?.diesel && reportData.dados.diesel.length > 0 ? (
                        <GraficoDiesel 
                          data={reportData.dados.diesel} 
                          meta={finalData?.diesel?.meta || configManager.getMetas('colheita_semanal').diesel || 5}
                        />
                      ) : (
                        <Flex flex="1" justify="center" align="center">
                          <Text fontSize="lg" color="gray.500">Sem dados</Text>
                        </Flex>
                      )}
                    </Box>
                  </Box>
                )}
              </Grid>
            </Box>
          </A4Colheita>
        )}

        {/* Página 2 - Impureza Vegetal */}
        {secoes.impureza_vegetal && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader showDate={true} />
              
              <Flex flex="1" direction="column" justify="space-between" p={4}>
                <Box flex="1" display="flex" flexDirection="column">
                  <SectionTitle title="Impureza Vegetal" />
                  <SimpleGrid columns={1} spacing={3} w="100%" mb={2}>
                    <IndicatorCard
                      title=""
                      value={reportData?.dados?.impureza_vegetal && reportData.dados.impureza_vegetal.length > 0 
                        ? calcularMedia(finalData?.impureza_vegetal?.data || reportData.dados.impureza_vegetal, 'percentual')
                        : 0}
                      meta={64}
                      unitType="decimal"
                      isInverted={true}
                      acimaMeta={{
                        quantidade: reportData?.dados?.impureza_vegetal && reportData.dados.impureza_vegetal.length > 0 
                          ? contarItensMeta(finalData?.impureza_vegetal?.data || reportData.dados.impureza_vegetal, 'percentual', 64, false)
                          : 0,
                        total: reportData?.dados?.impureza_vegetal && reportData.dados.impureza_vegetal.length > 0 
                          ? (finalData?.impureza_vegetal?.data || reportData.dados.impureza_vegetal).length 
                          : 1,
                        percentual: reportData?.dados?.impureza_vegetal && reportData.dados.impureza_vegetal.length > 0 
                          ? (contarItensMeta(finalData?.impureza_vegetal?.data || reportData.dados.impureza_vegetal, 'percentual', 64, false) / ((finalData?.impureza_vegetal?.data || reportData.dados.impureza_vegetal).length || 1)) * 100
                          : 0
                      }}
                    />
                  </SimpleGrid>
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    flex="1"
                    minH="200px"
                    display="flex"
                    flexDirection="column"
                  >
                    {reportData?.dados?.impureza_vegetal && reportData.dados.impureza_vegetal.length > 0 ? (
                      <GraficoImpurezaVegetal 
                        data={reportData.dados.impureza_vegetal} 
                        meta={64}
                      />
                    ) : (
                      <Flex flex="1" justify="center" align="center">
                        <Text fontSize="lg" color="gray.500">Sem dados</Text>
                      </Flex>
                    )}
                  </Box>
                </Box>
              </Flex>
            </Box>
          </A4Colheita>
        )}

        {/* Página - Disponibilidade Mecânica */}
        {secoes.disponibilidade_mecanica && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader showDate={true} />
              
              <Flex flex="1" direction="column" justify="space-between" p={4}>
                <Box flex="1" display="flex" flexDirection="column">
                  <SectionTitle title="Disponibilidade Mecânica" />
                  <SimpleGrid columns={1} spacing={3} w="100%" mb={2}>
                    <IndicatorCard
                      title=""
                      value={finalData?.disponibilidade_mecanica?.data && finalData.disponibilidade_mecanica.data.length > 0
                        ? calcularMedia(finalData?.disponibilidade_mecanica?.data, 'disponibilidade')
                        : 0}
                      meta={finalData?.disponibilidade_mecanica?.meta || configManager.getMetas('colheita_semanal').disponibilidadeMecanica}
                      unitType="porcentagem"
                      acimaMeta={{
                        quantidade: finalData?.disponibilidade_mecanica?.data && finalData.disponibilidade_mecanica.data.length > 0
                          ? contarItensMeta(finalData?.disponibilidade_mecanica?.data, 'disponibilidade', finalData?.disponibilidade_mecanica?.meta || configManager.getMetas('colheita_semanal').disponibilidadeMecanica)
                          : 0,
                        total: finalData?.disponibilidade_mecanica?.data?.length || 1,
                        percentual: finalData?.disponibilidade_mecanica?.data && finalData.disponibilidade_mecanica.data.length > 0
                          ? (contarItensMeta(finalData?.disponibilidade_mecanica?.data, 'disponibilidade', finalData?.disponibilidade_mecanica?.meta || configManager.getMetas('colheita_semanal').disponibilidadeMecanica) / (finalData?.disponibilidade_mecanica?.data.length || 1)) * 100
                          : 0
                      }}
                    />
                  </SimpleGrid>
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    flex="1"
                    minH="200px"
                    display="flex"
                    flexDirection="column"
                  >
                    {finalData?.disponibilidade_mecanica?.data && finalData.disponibilidade_mecanica.data.length > 0 ? (
                      <GraficoDisponibilidadeMecanicaColheita 
                        data={finalData?.disponibilidade_mecanica?.data || []} 
                        meta={finalData?.disponibilidade_mecanica?.meta || 0}
                      />
                    ) : (
                      <Flex flex="1" justify="center" align="center">
                        <Text fontSize="lg" color="gray.500">Sem dados</Text>
                      </Flex>
                    )}
                  </Box>
                </Box>
              </Flex>
            </Box>
          </A4Colheita>
        )}

        {/* Página - Eficiência Energética */}
        {secoes.eficiencia_energetica && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader showDate={true} />
              
              <Flex flex="1" direction="column" justify="space-between" p={4}>
                <Box flex="1" display="flex" flexDirection="column">
                  <SectionTitle title="Eficiência Energética" />
                  <SimpleGrid columns={1} spacing={3} w="100%" mb={2}>
                    <IndicatorCard
                      title=""
                      value={finalData?.eficiencia_energetica?.data && finalData.eficiencia_energetica.data.length > 0
                        ? calcularMedia(finalData?.eficiencia_energetica?.data, 'eficiencia')
                        : 0}
                      meta={finalData?.eficiencia_energetica?.meta || configManager.getMetas('colheita_semanal').eficienciaEnergetica}
                      unitType="porcentagem"
                      acimaMeta={{
                        quantidade: finalData?.eficiencia_energetica?.data && finalData.eficiencia_energetica.data.length > 0
                          ? contarItensMeta(finalData?.eficiencia_energetica?.data, 'eficiencia', finalData?.eficiencia_energetica?.meta || configManager.getMetas('colheita_semanal').eficienciaEnergetica)
                          : 0,
                        total: finalData?.eficiencia_energetica?.data?.length || 1,
                        percentual: finalData?.eficiencia_energetica?.data && finalData.eficiencia_energetica.data.length > 0
                          ? (contarItensMeta(finalData?.eficiencia_energetica?.data, 'eficiencia', finalData?.eficiencia_energetica?.meta || configManager.getMetas('colheita_semanal').eficienciaEnergetica) / (finalData?.eficiencia_energetica?.data.length || 1)) * 100
                          : 0
                      }}
                    />
                  </SimpleGrid>
                  
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    flex="1"
                    minH="200px"
                    display="flex"
                    flexDirection="column"
                  >
                    {finalData?.eficiencia_energetica?.data && finalData.eficiencia_energetica.data.length > 0 ? (
                      <GraficoEficienciaEnergetica 
                        data={finalData?.eficiencia_energetica?.data || []} 
                        meta={finalData?.eficiencia_energetica?.meta || 0}
                      />
                    ) : (
                      <Flex flex="1" justify="center" align="center">
                        <Text fontSize="lg" color="gray.500">Sem dados</Text>
                      </Flex>
                    )}
                  </Box>
                </Box>
              </Flex>
            </Box>
          </A4Colheita>
        )}

        {/* Página - Hora Elevador */}
        {secoes.hora_elevador && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader showDate={true} />
              
              <Flex flex="1" direction="column" justify="space-between" p={4}>
                {/* Hora Elevador */}
                <Box flex="1" display="flex" flexDirection="column">
                  <SectionTitle title="Hora Elevador" />
                  <SimpleGrid columns={1} spacing={3} w="100%" mb={2}>
                    <IndicatorCard
                      title=""
                      value={finalData?.hora_elevador?.data && finalData.hora_elevador.data.length > 0
                        ? calcularMedia(finalData?.hora_elevador?.data, 'horas')
                        : 0}
                      meta={finalData?.hora_elevador?.meta || configManager.getMetas('colheita_semanal').horaElevador}
                      unitType="horas"
                      acimaMeta={{
                        quantidade: finalData?.hora_elevador?.data && finalData.hora_elevador.data.length > 0
                          ? contarItensMeta(finalData?.hora_elevador?.data, 'horas', finalData?.hora_elevador?.meta || configManager.getMetas('colheita_semanal').horaElevador)
                          : 0,
                        total: finalData?.hora_elevador?.data?.length || 1,
                        percentual: finalData?.hora_elevador?.data && finalData.hora_elevador.data.length > 0
                          ? (contarItensMeta(finalData?.hora_elevador?.data, 'horas', finalData?.hora_elevador?.meta || configManager.getMetas('colheita_semanal').horaElevador) / (finalData?.hora_elevador?.data.length || 1)) * 100
                          : 0
                      }}
                    />
                  </SimpleGrid>
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    flex="1"
                    minH="200px"
                    display="flex"
                    flexDirection="column"
                  >
                    {finalData?.hora_elevador?.data && finalData.hora_elevador.data.length > 0 ? (
                      <GraficoHorasElevador
                        data={finalData?.hora_elevador?.data || []} 
                        meta={finalData?.hora_elevador?.meta || 0} 
                      />
                    ) : (
                      <Flex flex="1" justify="center" align="center">
                        <Text fontSize="lg" color="gray.500">Sem dados</Text>
                      </Flex>
                    )}
                  </Box>
                </Box>
              </Flex>
            </Box>
          </A4Colheita>
        )}

        {/* Página - Motor Ocioso */}
        {secoes.motor_ocioso && (
          <>
            <A4Colheita>
              <Box h="100%" display="flex" flexDirection="column" bg="white">
                <PageHeader showDate={true} />
                
                <Flex flex="1" direction="column" justify="space-between" p={4}>
                  {/* Motor Ocioso */}
                  <Box flex="1" display="flex" flexDirection="column">
                    <SectionTitle title="Motor Ocioso" />
                    <SimpleGrid columns={1} spacing={3} w="100%" mb={2}>
                      <IndicatorCard 
                        title=""
                        value={finalData?.motor_ocioso?.data && finalData.motor_ocioso.data.length > 0
                          ? calcularMedia(finalData?.motor_ocioso?.data, 'percentual')
                          : 0}
                        meta={finalData?.motor_ocioso?.meta || configManager.getMetas('colheita_semanal').motorOcioso}
                        unitType="porcentagem"
                        acimaMeta={{
                          quantidade: finalData?.motor_ocioso?.data && finalData.motor_ocioso.data.length > 0
                            ? contarItensMeta(finalData?.motor_ocioso?.data, 'percentual', finalData?.motor_ocioso?.meta || configManager.getMetas('colheita_semanal').motorOcioso, false)
                            : 0,
                          total: finalData?.motor_ocioso?.data?.length || 1,
                          percentual: finalData?.motor_ocioso?.data && finalData.motor_ocioso.data.length > 0
                            ? (contarItensMeta(finalData?.motor_ocioso?.data, 'percentual', finalData?.motor_ocioso?.meta || configManager.getMetas('colheita_semanal').motorOcioso, false) / (finalData?.motor_ocioso?.data.length || 1)) * 100
                            : 0
                        }}
                        isInverted
                      />
                    </SimpleGrid>
                    <Box 
                      border="1px solid"
                      borderColor="black"
                      borderRadius="md"
                      p={2}
                      flex="1"
                      minH="200px"
                      display="flex"
                      flexDirection="column"
                    >
                      {finalData?.motor_ocioso?.data && finalData.motor_ocioso.data.length > 0 ? (
                        <GraficoMotorOciosoColheita 
                          data={finalData?.motor_ocioso?.data.length > 15 
                            ? finalData?.motor_ocioso?.data.slice(0, 15) // Mostrar apenas os primeiros 15 registros na primeira página
                            : finalData?.motor_ocioso?.data || []} 
                          meta={finalData?.motor_ocioso?.meta || 0} 
                        />
                      ) : (
                        <Flex flex="1" justify="center" align="center">
                          <Text fontSize="lg" color="gray.500">Sem dados</Text>
                        </Flex>
                      )}
                    </Box>
                  </Box>
                </Flex>
              </Box>
            </A4Colheita>

            {/* Adicionar uma segunda página para motor ocioso quando houver mais de 15 registros */}
            {finalData?.motor_ocioso?.data && finalData.motor_ocioso.data.length > 15 && (
              <A4Colheita>
                <Box h="100%" display="flex" flexDirection="column" bg="white">
                  <PageHeader showDate={true} />
                  
                  <Flex flex="1" direction="column" justify="space-between" p={4}>
                    {/* Motor Ocioso - Continuação */}
                    <Box flex="1" display="flex" flexDirection="column">
                      <SectionTitle title="Motor Ocioso" />
                      <Box 
                        border="1px solid"
                        borderColor="black"
                        borderRadius="md"
                        p={2}
                        flex="1"
                        minH="200px"
                        mt={10}
                        display="flex"
                        flexDirection="column"
                      >
                        <GraficoMotorOciosoColheita 
                          data={finalData.motor_ocioso.data.slice(15) || []} 
                          meta={finalData?.motor_ocioso?.meta || 0} 
                        />
                      </Box>
                    </Box>
                  </Flex>
                </Box>
              </A4Colheita>
            )}
          </>
        )}
        
        {/* Página com Uso GPS e Média de Velocidade juntos quando ambos têm até 11 registros */}
        {(secoes.uso_gps || secoes.media_velocidade) && 
         (!finalData?.uso_gps?.data || finalData?.uso_gps?.data?.length <= 11) && 
         (!reportData?.dados?.media_velocidade || reportData?.dados?.media_velocidade?.length <= 11) && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader showDate={true} />
              
              <Flex flex="1" direction="column" justify="space-between" p={4}>
                {/* Uso GPS */}
                {secoes.uso_gps && finalData?.uso_gps?.data && (
                  <Box flex="1" mb={secoes.media_velocidade ? 4 : 0}>
                    <SectionTitle title="Uso GPS" />
                    <SimpleGrid columns={1} spacing={3} w="100%" mb={2}>
                      <IndicatorCard 
                        title=""
                        value={finalData.uso_gps.data.length > 0
                          ? calcularMedia(finalData.uso_gps.data, 'porcentagem')
                          : 0}
                        meta={finalData?.uso_gps?.meta || configManager.getMetas('colheita_semanal').usoGPS}
                        unitType="porcentagem"
                        acimaMeta={{
                          quantidade: finalData.uso_gps.data.length > 0
                            ? contarItensMeta(finalData.uso_gps.data, 'porcentagem', finalData?.uso_gps?.meta || configManager.getMetas('colheita_semanal').usoGPS)
                            : 0,
                          total: finalData.uso_gps.data.length || 1,
                          percentual: finalData.uso_gps.data.length > 0
                            ? (contarItensMeta(finalData.uso_gps.data, 'porcentagem', finalData?.uso_gps?.meta || configManager.getMetas('colheita_semanal').usoGPS) / (finalData.uso_gps.data.length || 1)) * 100
                            : 0
                        }}
                      />
                    </SimpleGrid>
                    <Box 
                      border="1px solid"
                      borderColor="black"
                      borderRadius="md"
                      p={2}
                      flex="1"
                      minH={secoes.media_velocidade ? "120px" : "200px"}
                      display="flex"
                      flexDirection="column"
                    >
                      {finalData.uso_gps.data.length > 0 ? (
                        <GraficoUsoGPS 
                          data={finalData.uso_gps.data} 
                          meta={finalData?.uso_gps?.meta || 0} 
                        />
                      ) : (
                        <Flex flex="1" justify="center" align="center">
                          <Text fontSize="lg" color="gray.500">Sem dados</Text>
                        </Flex>
                      )}
                    </Box>
                  </Box>
                )}
                
                {/* Média de Velocidade */}
                {secoes.media_velocidade && reportData?.dados?.media_velocidade && (
                  <Box flex="1">
                    <SectionTitle title="Média de Velocidade" />
                    <SimpleGrid columns={1} spacing={3} w="100%" mb={2}>
                      <IndicatorCard
                        title=""
                        value={reportData.dados.media_velocidade.length > 0
                          ? calcularMedia(reportData.dados.media_velocidade, 'velocidade') || 0
                          : 0}
                        meta={reportData?.dados?.metas?.mediaVelocidade || configManager.getMetas('colheita_semanal').mediaVelocidade}
                        unitType="velocidade"
                        acimaMeta={{
                          quantidade: reportData.dados.media_velocidade.length > 0
                            ? contarItensMeta(reportData.dados.media_velocidade, 'velocidade', reportData?.dados?.metas?.mediaVelocidade || configManager.getMetas('colheita_semanal').mediaVelocidade)
                            : 0,
                          total: reportData.dados.media_velocidade.length || 1,
                          percentual: reportData.dados.media_velocidade.length > 0
                            ? (contarItensMeta(reportData.dados.media_velocidade, 'velocidade', reportData?.dados?.metas?.mediaVelocidade || configManager.getMetas('colheita_semanal').mediaVelocidade) / 
                              (reportData.dados.media_velocidade.length || 1)) * 100
                            : 0
                        }}
                      />
                    </SimpleGrid>
                    <Box 
                      border="1px solid"
                      borderColor="black"
                      borderRadius="md"
                      p={2}
                      flex="1"
                      minH={secoes.uso_gps ? "120px" : "200px"}
                      display="flex"
                      flexDirection="column"
                    >
                      {reportData.dados.media_velocidade.length > 0 ? (
                        <GraficoMediaVelocidadeColheita 
                          data={reportData.dados.media_velocidade.map((item: any) => {
                            // Garantir que a velocidade seja um número válido
                            let velocidade = 0;
                            try {
                              velocidade = typeof item.velocidade === 'string' 
                                ? parseFloat(item.velocidade.replace(',', '.')) 
                                : Number(item.velocidade);
                              // Se for NaN, usar 0
                              if (isNaN(velocidade)) velocidade = 0;
                            } catch (e) {
                              console.error('Erro ao converter velocidade:', e);
                              velocidade = 0;
                            }
                            
                            return {
                              id: item.id || '',
                              nome: item.nome || '',
                              velocidade: velocidade
                            };
                          })}
                          meta={reportData?.dados?.metas?.mediaVelocidade || configManager.getMetas('colheita_semanal').mediaVelocidade || 7}
                        />
                      ) : (
                        <Flex flex="1" justify="center" align="center">
                          <Text fontSize="lg" color="gray.500">Sem dados</Text>
                        </Flex>
                      )}
                    </Box>
                  </Box>
                )}
              </Flex>
            </Box>
          </A4Colheita>
        )}
        
        {/* Página - Uso GPS quando tem mais de 11 registros */}
        {secoes.uso_gps && finalData?.uso_gps?.data && Array.isArray(finalData.uso_gps.data) && finalData.uso_gps.data.length > 11 && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader showDate={true} />
              
              <Flex flex="1" direction="column" justify="space-between" p={4}>
                {/* Uso GPS */}
                <Box flex="1" display="flex" flexDirection="column">
                  <SectionTitle title="Uso GPS" />
                  <SimpleGrid columns={1} spacing={3} w="100%" mb={2}>
                    <IndicatorCard 
                      title=""
                      value={finalData?.uso_gps?.data && finalData.uso_gps.data.length > 0
                        ? calcularMedia(finalData?.uso_gps?.data, 'porcentagem')
                        : 0}
                      meta={finalData?.uso_gps?.meta || configManager.getMetas('colheita_semanal').usoGPS}
                      unitType="porcentagem"
                      acimaMeta={{
                        quantidade: finalData?.uso_gps?.data && finalData.uso_gps.data.length > 0
                          ? contarItensMeta(finalData?.uso_gps?.data, 'porcentagem', finalData?.uso_gps?.meta || configManager.getMetas('colheita_semanal').usoGPS)
                          : 0,
                        total: finalData?.uso_gps?.data?.length || 1,
                        percentual: finalData?.uso_gps?.data && finalData.uso_gps.data.length > 0
                          ? (contarItensMeta(finalData?.uso_gps?.data, 'porcentagem', finalData?.uso_gps?.meta || configManager.getMetas('colheita_semanal').usoGPS) / (finalData?.uso_gps?.data.length || 1)) * 100
                          : 0
                      }}
                    />
                  </SimpleGrid>
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    flex="1"
                    minH="200px"
                    display="flex"
                    flexDirection="column"
                  >
                    {finalData?.uso_gps?.data && finalData.uso_gps.data.length > 0 ? (
                      <GraficoUsoGPS 
                        data={finalData?.uso_gps?.data || []} 
                        meta={finalData?.uso_gps?.meta || 0} 
                      />
                    ) : (
                      <Flex flex="1" justify="center" align="center">
                        <Text fontSize="lg" color="gray.500">Sem dados</Text>
                      </Flex>
                    )}
                  </Box>
                </Box>
              </Flex>
            </Box>
          </A4Colheita>
        )}
        
        {/* Página - Média de Velocidade quando tem mais de 11 registros */}
        {secoes.media_velocidade && reportData?.dados?.media_velocidade && Array.isArray(reportData.dados.media_velocidade) && reportData.dados.media_velocidade.length > 11 && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader showDate={true} />
              <Flex flex="1" direction="column" justify="space-between" p={4}>
                {/* Média de Velocidade */}
                <Box flex="1" display="flex" flexDirection="column">
                  <SectionTitle title="Média de Velocidade" />
                  <SimpleGrid columns={1} spacing={3} w="100%" mb={2}>
                    <IndicatorCard
                      title=""
                      value={reportData?.dados?.media_velocidade && reportData.dados.media_velocidade.length > 0
                        ? calcularMedia(reportData?.dados?.media_velocidade, 'velocidade') || 0
                        : 0}
                      meta={reportData?.dados?.metas?.mediaVelocidade || configManager.getMetas('colheita_semanal').mediaVelocidade}
                      unitType="velocidade"
                      acimaMeta={{
                        quantidade: reportData?.dados?.media_velocidade && reportData.dados.media_velocidade.length > 0
                          ? contarItensMeta(reportData?.dados?.media_velocidade, 'velocidade', reportData?.dados?.metas?.mediaVelocidade || configManager.getMetas('colheita_semanal').mediaVelocidade)
                          : 0,
                        total: reportData?.dados?.media_velocidade?.length || 1,
                        percentual: reportData?.dados?.media_velocidade && reportData.dados.media_velocidade.length > 0
                          ? (contarItensMeta(reportData?.dados?.media_velocidade, 'velocidade', reportData?.dados?.metas?.mediaVelocidade || configManager.getMetas('colheita_semanal').mediaVelocidade) / 
                            (reportData.dados.media_velocidade.length || 1)) * 100
                          : 0
                      }}
                    />
                  </SimpleGrid>
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    flex="1"
                    minH="200px"
                    display="flex"
                    flexDirection="column"
                  >
                    {reportData?.dados?.media_velocidade && reportData.dados.media_velocidade.length > 0 ? (
                      <GraficoMediaVelocidadeColheita 
                        data={(reportData?.dados?.media_velocidade || []).map((item: any) => {
                          // Garantir que a velocidade seja um número válido
                          let velocidade = 0;
                          try {
                            velocidade = typeof item.velocidade === 'string' 
                              ? parseFloat(item.velocidade.replace(',', '.')) 
                              : Number(item.velocidade);
                            // Se for NaN, usar 0
                            if (isNaN(velocidade)) velocidade = 0;
                          } catch (e) {
                            console.error('Erro ao converter velocidade:', e);
                            velocidade = 0;
                          }
                          
                          return {
                            id: item.id || '',
                            nome: item.nome || '',
                            velocidade: velocidade
                          };
                        })}
                        meta={reportData?.dados?.metas?.mediaVelocidade || configManager.getMetas('colheita_semanal').mediaVelocidade || 7}
                      />
                    ) : (
                      <Flex flex="1" justify="center" align="center">
                        <Text fontSize="lg" color="gray.500">Sem dados</Text>
                      </Flex>
                    )}
                  </Box>
                </Box>
              </Flex>
            </Box>
          </A4Colheita>
        )}

        {/* Página com Gráfico de Produção - antes da página de resumo */}
        {secoes.graficoProducao && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader showDate={true} />
              
              <Flex flex="1" direction="column" justify="space-between" p={4}>
                <Box flex="1" display="flex" flexDirection="column">
                  <SectionTitle title="Gráfico de Produção" />
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    flex="1"
                    minH="200px"
                    display="flex"
                    flexDirection="column"
                  >
                    {reportData?.dados?.producao && reportData.dados.producao.length > 0 ? (
                      <GraficoProducao data={reportData.dados.producao} />
                    ) : (
                      <Flex flex="1" justify="center" align="center">
                        <Text fontSize="lg" color="gray.500">Sem dados de produção disponíveis</Text>
                      </Flex>
                    )}
                  </Box>
                </Box>
              </Flex>
            </Box>
          </A4Colheita>
        )}

        {/* Página com Tabelas - Última página */}
        <A4Colheita 
          isLastPage={true}
          footer={null}
        >
          <Box h="100%" display="flex" flexDirection="column" bg="white">
            <PageHeader showDate={true} />
            
            <Box flex="1" p={4}>
              {/* Título Principal do Resumo */}
              <Heading
                as="h1"
                size="sm"
                textAlign="center"
                mb={4}
                color="black"
                fontWeight="bold"
                fontSize="15px"
              >
                Resumo do Relatório de Colheita Semanal
              </Heading>

              {/* Seção Frotas */}
              <Box mb={6}>
                <SectionTitle title="Frotas" centered={true} />
                
                {/* Tabela de frotas */}
                <TabelaFrotas 
                  dados={reportData?.dados?.disponibilidade_mecanica?.map((item: { frota: string; disponibilidade: number }) => ({
                    frota: item.frota,
                    disponibilidade: item.disponibilidade
                  })) || []} 
                  tipo="colheita_semanal"
                  mostrarTDH={true}
                  mostrarDiesel={true}
                  mostrarImpureza={true}
                  temDadosTDH={reportData?.dados?.tdh && reportData.dados.tdh.length > 0}
                  temDadosDiesel={reportData?.dados?.diesel && reportData.dados.diesel.length > 0}
                  temDadosImpureza={reportData?.dados?.impureza_vegetal && reportData.dados.impureza_vegetal.length > 0}
                  dadosCompletos={{
                    diesel: reportData?.dados?.diesel ? reportData.dados.diesel.map((item: any) => ({
                      frota: item.frota,
                      consumo: item.consumo || 0
                    })) : [],
                    tdh: reportData?.dados?.tdh ? reportData.dados.tdh.map((item: any) => ({
                      frota: item.frota,
                      valor: item.valor || 0
                    })) : [],
                    impureza_vegetal: reportData?.dados?.impureza_vegetal ? reportData.dados.impureza_vegetal.map((item: any) => ({
                      frota: item.frota,
                      valor: item.percentual || 0
                    })) : []
                  }}
                />
              </Box>

              {/* Seção Operadores */}
              <Box>
                <SectionTitle title="Operadores" centered={true} />
                
                {/* Tabela de operadores */}
                <TabelaOperadores 
                  dados={{
                    eficiencia_energetica: finalData?.eficiencia_energetica?.data?.map(item => ({
                      id: item.id,
                      nome: item.nome,
                      eficiencia: item.eficiencia
                    })) || [],
                    motor_ocioso: finalData?.motor_ocioso?.data?.map(item => ({
                      id: item.id,
                      nome: item.nome,
                      percentual: item.percentual,
                      tempoLigado: 0,
                      tempoOcioso: 0
                    })) || [],
                    hora_elevador: finalData?.hora_elevador?.data?.map(item => ({
                      id: item.id,
                      nome: item.nome,
                      horas: item.horas
                    })) || [],
                    uso_gps: finalData?.uso_gps?.data?.map(item => ({
                      id: item.id,
                      nome: item.nome,
                      porcentagem: item.porcentagem
                    })) || [],
                    media_velocidade: finalData?.media_velocidade?.data?.map(item => ({
                      id: item.id,
                      nome: item.nome,
                      velocidade: item.velocidade
                    })) || []
                  }} 
                  tipo="colheita_semanal" 
                  mostrarEficiencia={secoes.eficiencia_energetica}
                  mostrarMotorOcioso={secoes.motor_ocioso}
                  mostrarHoraElevador={secoes.hora_elevador}
                  mostrarUsoGPS={secoes.uso_gps}
                  mostrarMediaVelocidade={secoes.media_velocidade}
                  mostrarFaltaApontamento={false}
                />
              </Box>
            </Box>
          </Box>
        </A4Colheita>
      </Box>
    );
  })();
} 