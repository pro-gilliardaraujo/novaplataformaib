'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Box, VStack, Heading, Image, Flex, Text, SimpleGrid, Center, Spinner, Button, Switch, FormControl, FormLabel, Grid } from '@chakra-ui/react';
import A4Colheita from '@/components/Layout/A4Colheita';
import { useReportStore } from '@/store/useReportStore';
import { GraficoDisponibilidadeMecanicaTransbordo } from '@/components/Charts/Transbordo/Diario/GraficoDisponibilidadeMecanicaTransbordo';
import { GraficoEficienciaEnergetica } from '@/components/Charts/Transbordo/Diario/GraficoEficienciaEnergetica';
import { GraficoMotorOciosoTransbordo } from '@/components/Charts/Transbordo/Diario/GraficoMotorOciosoTransbordo';
import { GraficoMotorOciosoProgresso } from '@/components/Charts/Transbordo/Diario/GraficoMotorOciosoProgresso';
import { GraficoUsoGPS } from '@/components/Charts/Transbordo/Diario/GraficoUsoGPS';
import { GraficoFaltaApontamentoTransbordo } from '@/components/Charts/Transbordo/Diario/GraficoFaltaApontamentoTransbordo';
import { GraficoMotorOciosoEmpilhado } from '@/components/Charts/Transbordo/Diario/GraficoMotorOciosoEmpilhado';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FaPrint } from 'react-icons/fa';
import { configManager } from '@/utils/config';
import RelatorioColheitaDiarioResumo from '@/components/RelatorioColheitaDiarioResumo';
import IndicatorCard from '@/components/IndicatorCard';
import TabelaOperadores from '@/components/TabelaOperadores';
import TabelaFrotas from '@/components/TabelaFrotas';
import { GraficoMediaVelocidadeTransbordo } from '@/components/Charts/Transbordo/Diario/GraficoMediaVelocidadeTransbordo';
import { GraficoMediaVelocidadeVazioTransbordo } from '@/components/Charts/Transbordo/Diario/GraficoMediaVelocidadeVazioTransbordo';
import { GraficoMediaVelocidadeCarregadoTransbordo } from '@/components/Charts/Transbordo/Diario/GraficoMediaVelocidadeCarregadoTransbordo';
import { GraficoTop5OfensoresTransbordo } from '@/components/Charts/Transbordo/Diario/GraficoTop5OfensoresTransbordo';

// Dados de exemplo para visualização offline
const exemplosDados: DadosProcessados = {
  disponibilidade_mecanica: [
    { frota: '6031', disponibilidade: 89.00 },
    { frota: '6082', disponibilidade: 99.23 },
    { frota: '6087', disponibilidade: 98.61 },
    { frota: '6096', disponibilidade: 79.34 },
    { frota: '0', disponibilidade: 10.00 }
  ],
  eficiencia_energetica: [
    { id: '1', nome: 'JOAO BATISTA DA ROCHA', eficiencia: 50.39 },
    { id: '2', nome: 'TROCA DE TURNO', eficiencia: 0.00 },
    { id: '3', nome: 'LEONARDO RODRIGUES DE MENEZES', eficiencia: 56.66 },
    { id: '4', nome: 'GERALDO BRITO DA SILVA', eficiencia: 49.92 },
    { id: '5', nome: 'MANUEL RICARDO ALVES DOS SANTOS', eficiencia: 64.13 },
    { id: '6', nome: 'JOSE HUMBERTO DE OLIVEIRA', eficiencia: 52.45 },
    { id: '7', nome: 'SEM OPERADOR', eficiencia: 9.25 },
    { id: '8', nome: 'VITOR SOARES FREITAS', eficiencia: 56.81 },
    { id: '9', nome: 'DANILO JESUS BRITO', eficiencia: 54.67 }
  ],
  motor_ocioso: [
    { id: '1', nome: 'JOAO BATISTA DA ROCHA', percentual: 8.87 },
    { id: '2', nome: 'TROCA DE TURNO', percentual: 89.76 },
    { id: '3', nome: 'LEONARDO RODRIGUES DE MENEZES', percentual: 25.30 },
    { id: '4', nome: 'GERALDO BRITO DA SILVA', percentual: 38.27 },
    { id: '5', nome: 'MANUEL RICARDO ALVES DOS SANTOS', percentual: 20.85 },
    { id: '6', nome: 'JOSE HUMBERTO DE OLIVEIRA', percentual: 23.03 },
    { id: '7', nome: 'VITOR SOARES FREITAS', percentual: 13.96 },
    { id: '8', nome: 'DANILO JESUS BRITO', percentual: 17.89 }
  ],
  uso_gps: [
    { id: '1', nome: 'JOAO BATISTA DA ROCHA', porcentagem: 0.0 },
    { id: '2', nome: 'TROCA DE TURNO', porcentagem: 0.0 },
    { id: '3', nome: 'LEONARDO RODRIGUES DE MENEZES', porcentagem: 0.0 },
    { id: '4', nome: 'GERALDO BRITO DA SILVA', porcentagem: 0.0 },
    { id: '5', nome: 'MANUEL RICARDO ALVES DOS SANTOS', porcentagem: 0.0 },
    { id: '6', nome: 'JOSE HUMBERTO DE OLIVEIRA', porcentagem: 0.0 },
    { id: '7', nome: 'VITOR SOARES FREITAS', porcentagem: 0.0 },
    { id: '8', nome: 'DANILO JESUS BRITO', porcentagem: 0.0 }
  ],
  falta_apontamento: [
    { id: '1', nome: 'JOAO BATISTA DA ROCHA', percentual: 3.74 },
    { id: '2', nome: 'TROCA DE TURNO', percentual: 0.00 },
    { id: '3', nome: 'LEONARDO RODRIGUES DE MENEZES', percentual: 8.82 },
    { id: '4', nome: 'GERALDO BRITO DA SILVA', percentual: 9.26 },
    { id: '5', nome: 'MANUEL RICARDO ALVES DOS SANTOS', percentual: 0.04 },
    { id: '6', nome: 'JOSE HUMBERTO DE OLIVEIRA', percentual: 14.99 },
    { id: '7', nome: 'VITOR SOARES FREITAS', percentual: 5.30 },
    { id: '8', nome: 'DANILO JESUS BRITO', percentual: 1.02 }
  ],
  media_velocidade: [
    { id: '1', nome: 'JOAO BATISTA DA ROCHA', velocidade: 35.5 },
    { id: '2', nome: 'TROCA DE TURNO', velocidade: 0.0 },
    { id: '3', nome: 'LEONARDO RODRIGUES DE MENEZES', velocidade: 42.8 },
    { id: '4', nome: 'GERALDO BRITO DA SILVA', velocidade: 38.2 },
    { id: '5', nome: 'MANUEL RICARDO ALVES DOS SANTOS', velocidade: 45.6 },
    { id: '6', nome: 'JOSE HUMBERTO DE OLIVEIRA', velocidade: 33.9 },
    { id: '7', nome: 'VITOR SOARES FREITAS', velocidade: 40.1 },
    { id: '8', nome: 'DANILO JESUS BRITO', velocidade: 37.4 }
  ],
  media_velocidade_vazio: [
    { id: '1', nome: 'JOAO BATISTA DA ROCHA', velocidade: 0.0 },
    { id: '2', nome: 'TROCA DE TURNO', velocidade: 0.0 },
    { id: '3', nome: 'LEONARDO RODRIGUES DE MENEZES', velocidade: 0.0 },
    { id: '4', nome: 'GERALDO BRITO DA SILVA', velocidade: 0.0 },
    { id: '5', nome: 'MANUEL RICARDO ALVES DOS SANTOS', velocidade: 0.0 },
    { id: '6', nome: 'JOSE HUMBERTO DE OLIVEIRA', velocidade: 0.0 },
    { id: '7', nome: 'VITOR SOARES FREITAS', velocidade: 0.0 },
    { id: '8', nome: 'DANILO JESUS BRITO', velocidade: 0.0 }
  ],
  media_velocidade_carregado: [
    { id: '1', nome: 'JOAO BATISTA DA ROCHA', velocidade: 0.0 },
    { id: '2', nome: 'TROCA DE TURNO', velocidade: 0.0 },
    { id: '3', nome: 'LEONARDO RODRIGUES DE MENEZES', velocidade: 0.0 },
    { id: '4', nome: 'GERALDO BRITO DA SILVA', velocidade: 0.0 },
    { id: '5', nome: 'MANUEL RICARDO ALVES DOS SANTOS', velocidade: 0.0 },
    { id: '6', nome: 'JOSE HUMBERTO DE OLIVEIRA', velocidade: 0.0 },
    { id: '7', nome: 'VITOR SOARES FREITAS', velocidade: 0.0 },
    { id: '8', nome: 'DANILO JESUS BRITO', velocidade: 0.0 }
  ]
};

interface TransbordoA4Props {
  data?: any;
}

interface MotorOciosoData {
  id: string;
  nome: string;
  percentual: number;
  tempoLigado?: number;
  tempoOcioso?: number;
}

interface MediaVelocidadeData {
  id: string;
  nome: string;
  velocidade: number;
  velocidadeCarregado?: number;
  velocidadeVazio?: number;
}

interface DadosProcessados {
  disponibilidade_mecanica: Array<{
    frota: string;
    disponibilidade: number;
  }>;
  eficiencia_energetica: Array<{
    id: string;
    nome: string;
    eficiencia: number;
  }>;
  motor_ocioso: Array<{
    id: string;
    nome: string;
    percentual: number;
    tempoTotal?: number;
    tempoOcioso?: number;
  }>;
  uso_gps: Array<{
    id: string;
    nome: string;
    porcentagem: number;
  }>;
  falta_apontamento: Array<{
    id: string;
    nome: string;
    percentual: number;
  }>;
  media_velocidade: Array<{
    id: string;
    nome: string;
    velocidade: number;
    velocidadeCarregado?: number;
    velocidadeVazio?: number;
  }>;
  media_velocidade_vazio: Array<{
    id: string;
    nome: string;
    velocidade: number;
  }>;
  media_velocidade_carregado: Array<{
    id: string;
    nome: string;
    velocidade: number;
  }>;
}

interface HorasPorFrota {
  frota: string;
  horasRegistradas: number;
  diferencaPara24h: number;
}

interface DadosMotorOcioso {
  id: string;
  nome: string;
  percentual: string;
  horasTotal?: number;
}

interface DadosMotorOciosoProcessado {
  id: string;
  nome: string;
  percentual: number;
  tempoTotal: number;
  tempoOcioso: number;
}

interface DadosFaltaApontamento {
  id: string;
  nome: string;
  percentual: string;
  horasTotal?: number;
}

interface DadosFaltaApontamentoProcessado {
  id: string;
  nome: string;
  percentual: number;
  tempoTotal: number;
  tempoSemApontamento: number;
}

interface DadosParadaOperacional {
  id: string;
  nome: string;
  percentual: string;
  horasTotal?: number;
}

interface DadosParadaOperacionalProcessado {
  id: string;
  nome: string;
  percentual: number;
  tempoTotal: number;
  tempoParado: number;
}

interface DadosGPS {
  id: string;
  nome: string;
  percentual?: string | number;
  porcentagem?: string | number;
  horasTotal?: number;
}

interface DadosGPSProcessado {
  id: string;
  nome: string;
  porcentagem: number;
  tempoTotal: number;
  tempoSemGPS: number;
}

interface DadosVelocidade {
  id: string;
  nome: string;
  porcentagem: string;
  horasTotal?: number;
}

interface DadosVelocidadeProcessado {
  id: string;
  nome: string;
  porcentagem: number;
  tempoTotal: number;
  tempoExcedido: number;
}

// Interfaces para tipagem dos dados
interface OperadorEficiencia {
  id: string;
  nome: string;
  eficiencia: number;
}

interface OperadorMotorOcioso {
  id: string;
  nome: string;
  percentual: number;
  tempoTotal: number;
  tempoOcioso: number;
  tempoLigado?: number;
}

interface OperadorFaltaApontamento {
  id: string;
  nome: string;
  percentual: number;
  horasTotal?: number;
}

interface OperadorUsoGPS {
  id: string;
  nome: string;
  porcentagem: number;
}

interface OperadorVelocidade {
  id: string;
  nome: string;
  velocidade: number;
}

interface RawDataItem {
  operador: string;
  frota: string;
  tdh: string | number;
  diesel: string | number;
  velocidade: string | number;
  media_velocidade: string | number;
  impureza_vegetal: string | number;
  impureza_mineral: string | number;
  perdas_invisiveis: string | number;
  perdas_visiveis: string | number;
  perdas_totais: string | number;
  densidade: string | number;
  data_hora: string;
}

interface ProcessedData {
  operador: string;
  frota: string;
  tdh: number;
  diesel: number;
  velocidade: number;
  media_velocidade: number;
  impureza_vegetal: number;
  impureza_mineral: number;
  perdas_invisiveis: number;
  perdas_visiveis: number;
  perdas_totais: number;
  densidade: number;
  data_hora: string;
}

interface GraficoProps {
  data: ProcessedData[];
  xField: keyof ProcessedData;
  yField: keyof ProcessedData;
  seriesField?: keyof ProcessedData;
}

// Função para verificar se os dados estão no formato esperado
function verificarFormatoDados(dados: any) {
  // console.log("🔍 VERIFICANDO FORMATO DOS DADOS:", dados);
  
  if (!dados) {
    console.error("❌ Dados ausentes");
    return false;
  }

  // Verificar se temos pelo menos alguns dos dados esperados
  const tiposDados = [
    { chave: 'disponibilidade_mecanica', validar: (item: any) => item.frota && item.disponibilidade !== undefined },
    { 
      chave: 'eficiencia_energetica', 
      validar: (item: any) => {
        // Ignorar itens sem operador ou com operador inválido
        if (!item.nome || item.nome === '0' || item.nome === 'TROCA DE TURNO') {
          return false;
        }
        return item.eficiencia !== undefined;
      }
    },
    { 
      chave: 'motor_ocioso', 
      validar: (item: any) => {
        if (!item.nome || item.nome === '0' || item.nome === 'TROCA DE TURNO') {
          return false;
        }
        return item.percentual !== undefined;
      }
    },
    { 
      chave: 'falta_apontamento', 
      validar: (item: any) => {
        if (!item.nome || item.nome === '0' || item.nome === 'TROCA DE TURNO') {
          return false;
        }
        return item.percentual !== undefined;
      }
    },
    { 
      chave: 'uso_gps', 
      validar: (item: any) => {
        if (!item.nome || item.nome === '0' || item.nome === 'TROCA DE TURNO') {
          return false;
        }
        return item.porcentagem !== undefined;
      }
    }
  ];

  // Verificar cada tipo de dado
  const dadosValidos = tiposDados.map(tipo => {
    const dados_tipo = dados[tipo.chave];
    if (!Array.isArray(dados_tipo)) {
      // console.log(`❌ ${tipo.chave}: Não é um array`);
      return false;
    }

    // Filtrar itens válidos
    const itensValidos = dados_tipo.filter(tipo.validar);
    // console.log(`✅ ${tipo.chave}: ${itensValidos.length} itens válidos de ${dados_tipo.length} total`);
    
    // Mostrar exemplo de item válido se houver
    // if (itensValidos.length > 0) {
    //   console.log(`📄 Exemplo de ${tipo.chave}:`, itensValidos[0]);
    // }

    return itensValidos.length > 0;
  });

  // Se pelo menos alguns tipos de dados são válidos, considerar ok
  const temDadosValidos = dadosValidos.some(v => v);
  // console.log("📊 Resultado final:", temDadosValidos ? "✅ Dados válidos" : "❌ Dados inválidos");
  
  return temDadosValidos;
}

// Adicione esta função utilitária para calcular o tempo total e ocioso
const calcularTempoTotalEOcioso = (dadosMotorOcioso: Array<{percentual: number}>) => {
  // Valores padrão caso não haja dados
  if (!dadosMotorOcioso || dadosMotorOcioso.length === 0) {
    return {
      tempoTotal: 24, // Assumindo 24 horas por dia
      tempoOcioso: 0,
      meta: 6 // Meta padrão de 6%
    };
  }
  
  // Calcula o tempo total (assumindo que o total é igual para todos os operadores)
  // Em um sistema real, isso viria dos dados precisos
  const tempoTotal = 24; // Horas por dia
  
  // Calcular média de percentual ocioso e converter para horas
  const percentualMedioOcioso = dadosMotorOcioso.reduce((acc, item) => acc + item.percentual, 0) / dadosMotorOcioso.length;
  const tempoOcioso = (percentualMedioOcioso / 100) * tempoTotal;
  
  return {
    tempoTotal,
    tempoOcioso,
    meta: configManager.getMetas('transbordo_diario').motorOcioso || 6 // Meta padrão de 6%
  };
};

function processarDados(dados: RawDataItem[]): ProcessedData[] {
  return dados.map((item: RawDataItem): ProcessedData => ({
    operador: item.operador,
    frota: item.frota,
    tdh: Number(item.tdh) || 0,
    diesel: Number(item.diesel) || 0,
    velocidade: Number(item.velocidade) || 0,
    media_velocidade: Number(item.media_velocidade) || 0,
    impureza_vegetal: Number(item.impureza_vegetal) || 0,
    impureza_mineral: Number(item.impureza_mineral) || 0,
    perdas_invisiveis: Number(item.perdas_invisiveis) || 0,
    perdas_visiveis: Number(item.perdas_visiveis) || 0,
    perdas_totais: Number(item.perdas_totais) || 0,
    densidade: Number(item.densidade) || 0,
    data_hora: item.data_hora
  }));
}

export default function TransbordoA4({ data }: TransbordoA4Props) {
  // Hooks e estados
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
  const [useExampleData, setUseExampleData] = useState<boolean>(false);
  const [nomeFrente, setNomeFrente] = useState<string>('');
  
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
  
  // Função para formatar a data no padrão brasileiro
  const formatarData = (data: string) => {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  // Função para formatar a data para o título do documento
  const formatarDataTitulo = (data: string) => {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}-${mes}-${ano}`;
  };

  // Função para atualizar o título do documento
  const atualizarTituloDocumento = (frenteId: string, data: string) => {
    const dataFormatada = formatarDataTitulo(data);
    const frentes = configManager.getFrentes('transbordo_diario');
    const frente = frentes.find(f => f.id === frenteId);
    const nomeFrenteCompleto = frente ? frente.nome : frenteId;
    const titulo = `Relatório de Transbordo Diário - ${nomeFrenteCompleto} ${dataFormatada}`;
    if (typeof window !== 'undefined') {
      window.document.title = titulo;
    }
  };

  // Effect para atualizar o título do documento quando os dados mudarem
  useEffect(() => {
    if (reportData?.data && reportData?.frente) {
      atualizarTituloDocumento(reportData.frente, reportData.data);
    }
  }, [reportData?.data, reportData?.frente]);

  // Função para gerar o nome do arquivo PDF
  const gerarNomeArquivo = () => {
    const data = reportData?.data ? formatarData(reportData.data).replace(/\//g, '-') : formatarData(new Date().toISOString().split('T')[0]).replace(/\//g, '-');
    return `Relatório de Transbordo Diário - ${nomeFrente} - ${data}.pdf`;
  };

  const currentDate = formatarData(new Date().toISOString().split('T')[0]);
  const LOGO_HEIGHT = "50px";
  const LOGO_URL = "https://kjlwqezxzqjfhacmjhbh.supabase.co/storage/v1/object/public/sourcefiles/Logo%20IB%20Full.png";

  useEffect(() => {
    // Recarregar configurações antes de buscar dados
    const reloadConfig = async () => {
      await configManager.reloadConfig();
    };
    
    const loadData = async () => {
      try {
        await reloadConfig();
        setLoading(true);
        
        if (!reportId) {
          setUseExampleData(true);
          setLoading(false);
          return;
        }
        
        // Função para buscar dados do relatório
        const fetchReportData = async () => {
          try {
            // Buscar dados do relatório
            const { data: reportData, error } = await supabase
              .from('relatorios_diarios')
              .select('*')
              .eq('id', reportId)
              .single();
            
            if (error) {
              throw error;
            }
            
            if (!reportData) {
              throw new Error('Relatório não encontrado');
            }
            
            // Definir dados do relatório
            setReportData(reportData);
            setNomeFrente(reportData.frente || '');
            setLoading(false);
            
            // SEMPRE usar dados reais quando temos um ID
            if (reportId) {
              setUseExampleData(false);
            }
          } catch (error) {
            console.error('Erro ao buscar dados do relatório:', error);
            setError('Erro ao buscar dados. Por favor, tente novamente.');
            setLoading(false);
          }
        };
        
        await fetchReportData();
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError('Erro ao carregar dados. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    loadData();
    // Usar apenas reportId como dependência para evitar recálculos
  }, [reportId]);

  // Funções utilitárias para processamento de dados
      const processarOperador = (operador: any) => {
    if (!operador || !operador.nome) return 'Não informado';
    return operador.nome;
      };

      const converterNumero = (valor: any) => {
        if (typeof valor === 'number') return valor;
        if (typeof valor === 'string') {
          const parsedValue = parseFloat(valor);
          return isNaN(parsedValue) ? 0 : parsedValue;
        }
        return 0;
      };

      const processarPorcentagem = (valor: any) => {
        const numero = converterNumero(valor);
        return numero * 100; // Converter para porcentagem sem arredondar
      };

  // Função para imprimir o relatório
  const handlePrint = async () => {
      window.print();
  };

  // Funções para cálculos estatísticos
  const calcularMedia = (dados: ProcessedData[], propriedade: keyof ProcessedData): number => {
    const itensValidos = dados.filter((item: ProcessedData) => {
      const valor = item[propriedade];
      return Boolean(item.operador) && typeof valor === 'number' && !isNaN(valor);
    });

    if (itensValidos.length === 0) return 0;

    const soma = itensValidos.reduce((acc: number, item: ProcessedData) => {
      const valor = item[propriedade];
      return acc + (typeof valor === 'number' ? valor : 0);
    }, 0);

    return Number((soma / itensValidos.length).toFixed(2));
  };

  const calcularTotal = (dados: ProcessedData[], propriedade: keyof ProcessedData): number => {
    const itensValidos = dados.filter((item: ProcessedData) => {
      const valor = item[propriedade];
      return Boolean(item.operador) && typeof valor === 'number' && !isNaN(valor);
    });

    return itensValidos.reduce((acc: number, item: ProcessedData) => {
      const valor = item[propriedade];
      return acc + (typeof valor === 'number' ? valor : 0);
    }, 0);
  };

  const contarItensMeta = (array: any[] | undefined, propriedade: string, meta: number, acima: boolean = true): number => {
    if (!array || array.length === 0) return 0;
    
    return array.reduce((count, item) => {
      const valor = item[propriedade];
      if (typeof valor !== 'number') return count;
      
      if (acima) {
        return valor >= meta ? count + 1 : count;
      } else {
        return valor < meta ? count + 1 : count;
      }
    }, 0);
  };

  // Função utilitária para calcular indicadores com segurança
  function calcularIndicador(
    dados: any[] | undefined,
    propriedade: string,
    meta: number,
    isInverted: boolean = false
  ) {
    // Se dados for undefined ou vazio, retornar valores padrão
    if (!dados || !Array.isArray(dados) || dados.length === 0) {
      console.log(`⚠️ Dados ausentes ou inválidos para ${propriedade}`);
      return {
        valor: 0,
        acimaMeta: {
          quantidade: 0,
          total: 0,
          percentual: 0
        }
      };
    }

    try {
      // Filtrar itens válidos e remover 'TROCA DE TURNO'
      const itensValidos = dados.filter((item) => 
        item && 
        typeof item[propriedade] === 'number' && 
        (!item.nome || (item.nome !== 'TROCA DE TURNO' && item.nome !== 'SEM OPERADOR')));
      
      if (itensValidos.length === 0) {
        console.log(`⚠️ Sem itens válidos para ${propriedade}`);
        return {
          valor: 0,
          acimaMeta: {
            quantidade: 0,
            total: 0,
            percentual: 0
          }
        };
      }

      // Calcular média dos valores
      const soma = itensValidos.reduce((acc, item) => acc + item[propriedade], 0);
      const media = soma / itensValidos.length;
      
      // Contar quantos itens estão dentro da meta
      const itensMeta = itensValidos.filter((item) => {
        const valor = item[propriedade];
        // Para indicadores invertidos (como motor ocioso e velocidade), menor é melhor
        if (isInverted) {
          return valor <= meta;
        }
        // Para indicadores normais, maior é melhor
        return valor >= meta;
      });
      
      const quantidade = itensMeta.length;
      const total = itensValidos.length;
      const percentual = total > 0 ? (quantidade / total) * 100 : 0;

      return {
        valor: Number(media.toFixed(1)),
        acimaMeta: {
          quantidade,
          total,
          percentual: Number(percentual.toFixed(1))
        }
      };
    } catch (error) {
      console.error(`❌ Erro ao calcular indicador para ${propriedade}:`, error);
      return {
        valor: 0,
        acimaMeta: {
          quantidade: 0,
          total: 0,
          percentual: 0
        }
      };
    }
  }

  // Componentes de layout
  const PageHeader = ({ showDate = true }: { showDate?: boolean }) => {
    // Encontrar o nome completo da frente no config
    const frenteConfig = configManager.getFrentes('transbordo_diario').find((f: { id: string }) => f.id === reportData?.frente);
    const nomeFrente = frenteConfig?.nome || reportData?.frente || 'Exemplo';

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
            {`Relatório de Transbordo Diário - ${nomeFrente}`}
          </Heading>
          {showDate && (
            <Text color="black" fontSize="sm">
              {reportData?.data ? formatarData(reportData.data) : currentDate}
            </Text>
          )}
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

  // Use reportData ou dados de exemplo
  const processedData = useMemo(() => {
    // console.log("🔄 PROCESSANDO DADOS DO RELATÓRIO", {
    //   reportData, 
    //   temDados: reportData?.dados && Object.keys(reportData.dados).length > 0
    // });

    // Se não tivermos dados válidos, usar dados de exemplo
    if (!reportData?.dados || !verificarFormatoDados(reportData.dados)) {
      // console.log("📊 Usando dados de exemplo");
      return exemplosDados;
    }
    
    // A partir daqui, temos dados válidos do relatório
    // console.log("✅ Processando dados reais do relatório");
    
    // Processar e formatar os dados
    const dados = reportData.dados;
    
    // Log para depuração dos dados de falta de apontamento
    console.log("DEBUG: Dados de falta de apontamento nos dados originais:", 
      dados.falta_apontamento ? `Encontrados ${dados.falta_apontamento.length} registros` : "Não encontrados");
    
    // Log para depuração da base cálculo (onde pode haver dados de falta de apontamento)
    console.log("DEBUG: Dados de base_calculo:", 
      dados.base_calculo ? `Encontrados ${dados.base_calculo.length} registros` : "Não encontrados");
    
    // Tentar extrair falta_apontamento da base de cálculo, caso não exista
    let dadosFaltaApontamento = dados.falta_apontamento || [];
    
    // Se não tivermos dados de falta_apontamento mas tivermos base_calculo,
    // vamos tentar extrair os dados de lá
    if ((!dadosFaltaApontamento || dadosFaltaApontamento.length === 0) && dados.base_calculo && dados.base_calculo.length > 0) {
      console.log("DEBUG: Tentando extrair dados de falta de apontamento da base de cálculo");
      
      dadosFaltaApontamento = dados.base_calculo
        .filter((item: any) => item && item.Operador && item['% Falta de Apontamento'] !== undefined)
        .map((item: any) => ({
          id: item.Operador,
          nome: item.Operador,
          percentual: item['% Falta de Apontamento'] // Manter o valor exatamente como está, sem multiplicar por 100
        }));
      
      console.log(`DEBUG: Extraídos ${dadosFaltaApontamento.length} registros da base de cálculo`);
    }
    
    return {
      disponibilidade_mecanica: (dados.disponibilidade_mecanica || [])
        .filter((item: { frota: string }) => item && item.frota && item.frota !== '0')
        .map((item: { frota: string; disponibilidade: number; horasTotal?: number }) => {
          // Remover qualquer decimal do número da frota
          const frotaStr = String(item.frota).trim();
          const frotaFormatada = frotaStr.includes('.') ? frotaStr.split('.')[0] : frotaStr;
          
          return {
            frota: frotaFormatada,
            disponibilidade: Number(Number(item.disponibilidade).toFixed(2)),
            horasTotal: item.horasTotal || 24 // Adicionar horasTotal
          };
        }),
      eficiencia_energetica: (dados.eficiencia_energetica || [])
        .filter((item: { nome: string }) => item && item.nome && !['0', 'TROCA DE TURNO'].includes(item.nome))
        .map((item: { id: string; nome: string; eficiencia: number; horasTotal?: number }) => ({
          id: item.id,
          nome: item.nome,
          eficiencia: Number(Number(item.eficiencia).toFixed(2)),
          horasTotal: item.horasTotal || 24 // Adicionar horasTotal
        })),
      motor_ocioso: (dados.motor_ocioso || [] as DadosMotorOcioso[])
        .filter((item: DadosMotorOcioso) => item && item.nome && !['0', 'TROCA DE TURNO'].includes(item.nome))
        .map((item: DadosMotorOcioso) => ({
          id: item.id,
          nome: item.nome,
          percentual: Number(Number(item.percentual).toFixed(2)),
          tempoTotal: Number(item.horasTotal || 24),
          tempoOcioso: Number(((item.horasTotal || 24) * (Number(item.percentual) / 100)).toFixed(2))
        }))
        .sort((a: DadosMotorOciosoProcessado, b: DadosMotorOciosoProcessado) => b.percentual - a.percentual),
      falta_apontamento: (dadosFaltaApontamento || [] as DadosFaltaApontamento[])
        .filter((item: DadosFaltaApontamento) => item && item.nome && !['0', 'TROCA DE TURNO'].includes(item.nome))
        .map((item: DadosFaltaApontamento) => ({
          id: item.id,
          nome: item.nome,
          percentual: Number(Number(item.percentual).toFixed(2)),
          tempoTotal: Number(item.horasTotal || 24),
          tempoSemApontamento: Number(((item.horasTotal || 24) * (Number(item.percentual) / 100)).toFixed(2))
        }))
        .sort((a: DadosFaltaApontamentoProcessado, b: DadosFaltaApontamentoProcessado) => b.percentual - a.percentual),
      uso_gps: (dados.uso_gps || dados.gps || [] as DadosGPS[])
        .filter((item: DadosGPS) => {
          // Log para debug
          console.log('📊 Processando item GPS:', item);
          
          // Verificar se o item é válido
          const isValid = item && item.nome && !['0', 'TROCA DE TURNO'].includes(item.nome);
          if (!isValid) {
            console.log('❌ Item GPS inválido:', item);
          }
          return isValid;
        })
        .map((item: DadosGPS) => {
          // Obter o valor a ser processado (percentual ou porcentagem)
          const valorPercentual = item.percentual !== undefined ? item.percentual : item.porcentagem;
          
          // Converter para número e garantir que seja válido
          const percentualStr = typeof valorPercentual === 'string' ? valorPercentual.replace(',', '.') : String(valorPercentual);
          const percentual = Number(percentualStr);
          const porcentagem = isNaN(percentual) ? 0 : Number(percentual.toFixed(2));
          
          // Log para debug
          console.log('✅ Item GPS processado:', {
            id: item.id,
            nome: item.nome,
            valorOriginal: valorPercentual,
            percentualStr,
            porcentagemProcessada: porcentagem
          });
          
          return {
            id: item.id,
            nome: item.nome,
            porcentagem,
            tempoTotal: Number(item.horasTotal || 24),
            tempoSemGPS: Number(((item.horasTotal || 24) * (porcentagem / 100)).toFixed(2))
          };
        })
        .sort((a: DadosGPSProcessado, b: DadosGPSProcessado) => b.porcentagem - a.porcentagem),
      velocidade: (dados.velocidade || [] as DadosVelocidade[])
        .filter((item: DadosVelocidade) => item && item.nome && !['0', 'TROCA DE TURNO'].includes(item.nome))
        .map((item: DadosVelocidade) => ({
          id: item.id,
          nome: item.nome,
          porcentagem: Number(Number(item.porcentagem).toFixed(2)),
          tempoTotal: Number(item.horasTotal || 24),
          tempoExcedido: Number(((item.horasTotal || 24) * (Number(item.porcentagem) / 100)).toFixed(2))
        }))
        .sort((a: DadosVelocidadeProcessado, b: DadosVelocidadeProcessado) => b.porcentagem - a.porcentagem),
      parada_operacional: (dados.parada_operacional || [] as DadosParadaOperacional[])
        .filter((item: DadosParadaOperacional) => item && item.nome && !['0', 'TROCA DE TURNO'].includes(item.nome))
        .map((item: DadosParadaOperacional) => ({
          id: item.id,
          nome: item.nome,
          percentual: Number(Number(item.percentual).toFixed(2)),
          tempoTotal: Number(item.horasTotal || 24),
          tempoParado: Number(((item.horasTotal || 24) * (Number(item.percentual) / 100)).toFixed(2))
        }))
        .sort((a: DadosParadaOperacionalProcessado, b: DadosParadaOperacionalProcessado) => b.percentual - a.percentual),
      media_velocidade: (dados.media_velocidade || [])
        .filter((item: any) => item && item.nome && !['0', 'TROCA DE TURNO'].includes(item.nome))
        .map((item: any) => ({
          id: item.id,
          nome: item.nome,
          velocidade: Number(Number(item.velocidade).toFixed(2)),
          tempoTotal: Number(item.horasTotal || 24),
          tempoExcedido: Number(((item.horasTotal || 24) * (Number(item.velocidade) / 100)).toFixed(2))
        }))
        .sort((a: any, b: any) => b.velocidade - a.velocidade),
      // Adicionar processamento para media_velocidade_vazio
      media_velocidade_vazio: (dados.media_velocidade_vazio || [])
        .filter((item: any) => item && item.nome && !['0', 'TROCA DE TURNO'].includes(item.nome))
        .map((item: any) => ({
          id: item.id,
          nome: item.nome,
          velocidade: Number(Number(item.velocidade).toFixed(2))
        }))
        .sort((a: any, b: any) => b.velocidade - a.velocidade),
      // Adicionar processamento para media_velocidade_carregado
      media_velocidade_carregado: (dados.media_velocidade_carregado || [])
        .filter((item: any) => item && item.nome && !['0', 'TROCA DE TURNO'].includes(item.nome))
        .map((item: any) => ({
          id: item.id,
          nome: item.nome,
          velocidade: Number(Number(item.velocidade).toFixed(2))
        }))
        .sort((a: any, b: any) => b.velocidade - a.velocidade)
    };
  }, [reportData]);

  // Verificar configuração para mostrar ou esconder componentes
  const secoes = useMemo(() => {
    // Obter configurações de seções para o tipo de relatório
    const tipoRelatorio = reportData?.tipo || 'transbordo_diario';
    
    // Usar as configurações de visibilidade salvas com o relatório, se disponíveis
    const savedVisibility = reportData?.dados?.visibility;
    
    // Se não houver configurações salvas e tivermos um reportId, usar as do per-report store
    const reportSpecificVisibility = reportId ? getReportVisibilityConfig(reportId) : null;
    
    console.log("📊 Visibilidade salva no relatório:", savedVisibility);
    console.log("📊 Visibilidade específica do relatório no store:", reportSpecificVisibility);
    console.log("📊 Visibilidade global no store:", visibilityConfig);
    
    // Usar configurações padrão caso não exista
    const configSections = configManager.getTipoRelatorio(tipoRelatorio)?.secoes || {
      disponibilidadeMecanica: true,
      eficienciaEnergetica: true,
      motorOcioso: true,
      faltaApontamento: true,
      usoGPS: true,
      mediaVelocidade: true
    };
    
    // Priorizar as configurações na seguinte ordem:
    // 1. Configurações salvas no relatório
    // 2. Configurações específicas do relatório no store
    // 3. Configurações globais no store
    
    // Se tivermos configurações salvas no relatório, usá-las
    if (savedVisibility && savedVisibility.transbordo) {
      // Se tivermos um reportId, atualizar o store com essas configurações
      if (reportId) {
        setReportVisibilityConfig(reportId, savedVisibility);
      }
      
      return {
        ...configSections,
        // Usar as configurações de visibilidade que foram salvas com o relatório
        disponibilidadeMecanica: savedVisibility.transbordo.disponibilidadeMecanica,
        eficienciaEnergetica: savedVisibility.transbordo.eficienciaEnergetica,
        motorOcioso: savedVisibility.transbordo.motorOcioso,
        faltaApontamento: savedVisibility.transbordo.faltaApontamento,
        usoGPS: savedVisibility.transbordo.usoGPS,
        mediaVelocidade: true // Valor padrão
      };
    }
    
    // Se tivermos configurações específicas do relatório no store, usá-las
    if (reportSpecificVisibility && reportSpecificVisibility.transbordo) {
      return {
        ...configSections,
        // Usar as configurações de visibilidade específicas do relatório
        disponibilidadeMecanica: reportSpecificVisibility.transbordo.disponibilidadeMecanica,
        eficienciaEnergetica: reportSpecificVisibility.transbordo.eficienciaEnergetica,
        motorOcioso: reportSpecificVisibility.transbordo.motorOcioso,
        faltaApontamento: reportSpecificVisibility.transbordo.faltaApontamento,
        usoGPS: reportSpecificVisibility.transbordo.usoGPS,
        mediaVelocidade: true // Valor padrão
      };
    }
    
    // Por último, usar as configurações globais do store
    return {
      ...configSections,
      // Priorizar as configurações de visibilidade do store para o módulo Transbordo
      disponibilidadeMecanica: visibilityConfig.transbordo.disponibilidadeMecanica,
      eficienciaEnergetica: visibilityConfig.transbordo.eficienciaEnergetica,
      motorOcioso: visibilityConfig.transbordo.motorOcioso,
      faltaApontamento: visibilityConfig.transbordo.faltaApontamento,
      usoGPS: visibilityConfig.transbordo.usoGPS,
      mediaVelocidade: true // Adicionar com valor padrão
    };
  }, [reportData, reportId, visibilityConfig, getReportVisibilityConfig, setReportVisibilityConfig]);

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
  
  // Preparar dados para ofensores
  const finalDataOfensores = useMemo(() => {
    if (!reportData?.dados?.ofensores) {
      console.log("Ofensores não encontrados no relatório, usando mockup");
      // Usar dados de mockup se não houver dados reais
      return [
        { Operacao: '9020 - MANUTENÇÃO MECÂNICA', Tempo: 18.09, Porcentagem: '25,41%' },
        { Operacao: '8260 - AGUARDANDO COLHEDORA', Tempo: 12.81, Porcentagem: '17,99%' },
        { Operacao: '8310 - SEM OPERADOR', Tempo: 11.69, Porcentagem: '16,42%' },
        { Operacao: '8340 - FALTA DE APONTAMENTO', Tempo: 5.97, Porcentagem: '8,38%' },
        { Operacao: '8040 - MANUTENÇÃO CORRETIVA', Tempo: 5.86, Porcentagem: '8,22%' },
      ];
    }
    
    console.log("Dados de ofensores encontrados:", reportData.dados.ofensores);
    
    // Converter e validar os dados, garantindo que todos os campos necessários estejam presentes
    const dadosProcessados = reportData.dados.ofensores.map((item: any) => {
      // Considerar todas as possíveis variações de nomes de campos
      const operacao = item.Operação || item.Operacao || item.operacao || item.nome || '';
      
      // Obter o tempo (pode estar como tempo ou Tempo)
      const tempo = typeof item.Tempo === 'number' ? item.Tempo : 
                    typeof item.tempo === 'number' ? item.tempo : 0;
      
      // Obter a porcentagem (pode estar como Porcentagem ou porcentagem)
      let porcentagem = item.Porcentagem || item.porcentagem;
      if (typeof porcentagem === 'number') {
        // Converter para string no formato esperado pelo componente (46,18%)
        porcentagem = porcentagem.toString().replace('.', ',') + '%';
      } else if (!porcentagem) {
        porcentagem = '0%';
      }
      
      return {
        Operacao: operacao,
        Tempo: tempo,
        Porcentagem: porcentagem
      };
    });
    
    console.log("Dados de ofensores processados:", dadosProcessados);
    
    return dadosProcessados;
  }, [reportData?.dados?.ofensores]);

  const finalDataMotorOcioso = useMemo(() => {
    if (!reportData?.dados?.motor_ocioso) return [];
    return reportData.dados.motor_ocioso.map((item: MotorOciosoData) => ({
      id: item.id,
      nome: item.nome,
      percentual: item.percentual,
      tempoLigado: item.tempoLigado || 0,
      tempoOcioso: item.tempoOcioso || 0
    }));
  }, [reportData?.dados?.motor_ocioso]);

  // Corrigir a definição de finalDataMediaVelocidade para incluir velocidade carregado e vazio
  const finalDataMediaVelocidade = useMemo(() => {
    // Verificar se temos dados de média de velocidade
    if (!reportData?.dados?.media_velocidade || !Array.isArray(reportData.dados.media_velocidade)) {
      console.log("⚠️ Dados de média de velocidade não disponíveis");
      return [];
    }
    
    // Usar valores de media_velocidade para os valores gerais
    return reportData.dados.media_velocidade.map((item: any) => ({
      id: item.id || '',
      nome: item.nome || '',
      velocidade: item.velocidade || 0,
      // Garantir que temos valores para velocidadeCarregado e velocidadeVazio
      velocidadeCarregado: item.velocidadeCarregado !== undefined ? item.velocidadeCarregado : (item.velocidade || 0),
      velocidadeVazio: item.velocidadeVazio !== undefined ? item.velocidadeVazio : (item.velocidade || 0)
    }));
  }, [reportData?.dados?.media_velocidade]);
  
  // Extrair dados específicos para velocidade carregado
  const finalDataMediaVelocidadeCarregado = useMemo(() => {
    // Verificar se temos dados de velocidade carregado dedicados
    if (reportData?.dados?.media_velocidade_carregado && Array.isArray(reportData.dados.media_velocidade_carregado)) {
      console.log("📊 Usando dados dedicados de media_velocidade_carregado");
      // Usar os dados dedicados se existirem
      return processedData.media_velocidade_carregado;
    } 
    
    // Caso contrário, extrair dos dados gerais
    console.log("📊 Extraindo velocidadeCarregado dos dados gerais");
    return finalDataMediaVelocidade.map((item: MediaVelocidadeData) => ({
      id: item.id,
      nome: item.nome,
      velocidade: item.velocidadeCarregado !== undefined ? item.velocidadeCarregado : item.velocidade // Mapear para 'velocidade'
    }));
  }, [reportData?.dados?.media_velocidade_carregado, finalDataMediaVelocidade, processedData]);
  
  // Extrair dados específicos para velocidade vazio
  const finalDataMediaVelocidadeVazio = useMemo(() => {
    // Verificar se temos dados de velocidade vazio dedicados
    if (reportData?.dados?.media_velocidade_vazio && Array.isArray(reportData.dados.media_velocidade_vazio)) {
      console.log("📊 Usando dados dedicados de media_velocidade_vazio");
      // Usar os dados dedicados se existirem
      return processedData.media_velocidade_vazio;
    } 
    
    // Caso contrário, extrair dos dados gerais
    console.log("📊 Extraindo velocidadeVazio dos dados gerais");
    return finalDataMediaVelocidade.map((item: MediaVelocidadeData) => ({
      id: item.id,
      nome: item.nome,
      velocidade: item.velocidadeVazio !== undefined ? item.velocidadeVazio : item.velocidade // Mapear para 'velocidade'
    }));
  }, [reportData?.dados?.media_velocidade_vazio, finalDataMediaVelocidade, processedData]);

  const finalDataFaltaApontamento = useMemo(() => {
    if (!reportData?.dados?.falta_apontamento) return [];
    return reportData.dados.falta_apontamento.map((item: any) => ({
      id: item.id,
      nome: item.nome,
      percentual: item.percentual
    }));
  }, [reportData?.dados?.falta_apontamento]);

  // Log para debug dos dados do GPS
  React.useEffect(() => {
    if (reportData?.dados?.uso_gps) {
      console.log('📊 Dados do GPS:', reportData.dados.uso_gps);
    }
  }, [reportData?.dados?.uso_gps]);

  // Renderização condicional baseada no estado de carregamento
  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error && !useExampleData) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Text color="red.500">{error}</Text>
          <Button
            onClick={() => setUseExampleData(true)}
            colorScheme="blue"
          >
            Usar Dados de Exemplo
          </Button>
        </VStack>
      </Center>
    );
  }
  
  // RENDERIZAÇÃO PRINCIPAL
  return (
    <Box>
      {/* Conteúdo do relatório */}
      <Box className="report-content">
        {/* Página 1 - Disponibilidade Mecânica e Eficiência Energética */}
        {(secoes.disponibilidadeMecanica || secoes.eficienciaEnergetica) && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader />
              
              <Flex flex="1" direction="column" justify="space-between">
                {/* Disponibilidade Mecânica */}
                {secoes.disponibilidadeMecanica && (
                  <Box flex="1" mb={secoes.eficienciaEnergetica ? 3 : 0}>
                    <SectionTitle title="Disponibilidade Mecânica" centered={true} />
                    <Box 
                      border="1px solid"
                      borderColor="black"
                      borderRadius="md"
                      p={2}
                      h="calc(100% - 25px)"
                    >
                      {processedData.disponibilidade_mecanica.length > 0 ? (
                        <GraficoDisponibilidadeMecanicaTransbordo 
                          data={processedData.disponibilidade_mecanica} 
                          meta={configManager.getMetas('transbordo_diario').disponibilidadeMecanica} 
                        />
                      ) : (
                        <Center h="100%">
                          <Text>Sem dados de disponibilidade mecânica</Text>
                        </Center>
                      )}
                    </Box>
                  </Box>
                )}
                
                {/* Eficiência Energética */}
                {secoes.eficienciaEnergetica && processedData.eficiencia_energetica.length <= 16 && (
                  <Box flex="1">
                    <SectionTitle title="Eficiência Energética" centered={true} />
                    <Box 
                      border="1px solid"
                      borderColor="black"
                      borderRadius="md"
                      p={2}
                      h="calc(100% - 25px)"
                    >
                      {processedData.eficiencia_energetica.length > 0 ? (
                        <GraficoEficienciaEnergetica 
                          data={processedData.eficiencia_energetica} 
                          meta={configManager.getMetas('transbordo_diario').eficienciaEnergetica} 
                        />
                      ) : (
                        <Center h="100%">
                          <Text>Sem dados de eficiência energética</Text>
                        </Center>
                      )}
                    </Box>
                  </Box>
                )}
              </Flex>
            </Box>
          </A4Colheita>
        )}
        
        {/* Página adicional para Eficiência Energética quando houver mais de 16 registros */}
        {secoes.eficienciaEnergetica && processedData.eficiencia_energetica.length > 16 && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader />
              
              <Box flex="1">
                <SectionTitle title="Eficiência Energética" centered={true} />
                <Box 
                  border="1px solid"
                  borderColor="black"
                  borderRadius="md"
                  p={2}
                  h="calc(100% - 25px)"
                >
                  {processedData.eficiencia_energetica.length > 0 ? (
                    <GraficoEficienciaEnergetica 
                      data={processedData.eficiencia_energetica} 
                      meta={configManager.getMetas('transbordo_diario').eficienciaEnergetica} 
                    />
                  ) : (
                    <Center h="100%">
                      <Text>Sem dados de eficiência energética</Text>
                    </Center>
                  )}
                </Box>
              </Box>
            </Box>
          </A4Colheita>
        )}
        
        {/* Página 2 - Motor Ocioso */}
        {secoes.motorOcioso && finalDataMotorOcioso.length <= 16 && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader />
              
              <Flex flex="1" direction="column" justify="space-between">
                {/* Motor Ocioso */}
                <Box flex="1">
                  <SectionTitle title="Motor Ocioso" centered={true} />
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    h="calc(100% - 25px)"
                  >
                    {finalDataMotorOcioso.length > 0 ? (
                      <GraficoMotorOciosoTransbordo 
                        data={finalDataMotorOcioso} 
                        meta={configManager.getMetas('transbordo_diario').motorOcioso} 
                      />
                    ) : (
                      <Center h="100%">
                        <Text>Sem dados de motor ocioso</Text>
                      </Center>
                    )}
                  </Box>
                </Box>
              </Flex>
            </Box>
          </A4Colheita>
        )}

        {/* Página adicional para Motor Ocioso quando houver mais de 16 registros - Parte 1 */}
        {secoes.motorOcioso && finalDataMotorOcioso.length > 16 && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader />
              
              <Flex flex="1" direction="column" justify="space-between">
                <Box flex="1">
                  <SectionTitle title="Motor Ocioso (Página 1)" centered={true} />
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    h="calc(100% - 25px)"
                  >
                    {finalDataMotorOcioso.length > 0 ? (
                      <GraficoMotorOciosoTransbordo 
                        data={finalDataMotorOcioso.slice(0, 16)} 
                        meta={configManager.getMetas('transbordo_diario').motorOcioso} 
                      />
                    ) : (
                      <Center h="100%">
                        <Text>Sem dados de motor ocioso</Text>
                      </Center>
                    )}
                  </Box>
                </Box>
              </Flex>
            </Box>
          </A4Colheita>
        )}

        {/* Página adicional para Motor Ocioso quando houver mais de 16 registros - Parte 2 */}
        {secoes.motorOcioso && finalDataMotorOcioso.length > 16 && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader />
              
              <Flex flex="1" direction="column" justify="space-between">
                <Box flex="1">
                  <SectionTitle title="Motor Ocioso (Página 2)" centered={true} />
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    h="calc(100% - 25px)"
                  >
                    {finalDataMotorOcioso.length > 16 ? (
                      <GraficoMotorOciosoTransbordo 
                        data={finalDataMotorOcioso.slice(16)} 
                        meta={configManager.getMetas('transbordo_diario').motorOcioso} 
                      />
                    ) : (
                      <Center h="100%">
                        <Text>Sem dados adicionais de motor ocioso</Text>
                      </Center>
                    )}
                  </Box>
                </Box>
              </Flex>
            </Box>
          </A4Colheita>
        )}
        
        {/* Página 3 - Falta de Apontamento e Uso GPS quando ambos têm menos de 11 registros */}
        {(secoes.faltaApontamento || secoes.usoGPS) && 
          finalDataFaltaApontamento.length <= 11 && 
          processedData.uso_gps.length <= 11 && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader />
              
              <Flex flex="1" direction="column" justify="space-between">
                {/* Falta de Apontamento */}
                {secoes.faltaApontamento && (
                  <Box flex="1" mb={secoes.usoGPS ? 4 : 0}>
                    <SectionTitle title="Falta de Apontamento" centered={true} />
                    <Box 
                      border="1px solid"
                      borderColor="black"
                      borderRadius="md"
                      p={2}
                      h="calc(100% - 25px)"
                    >
                      {finalDataFaltaApontamento.length > 0 ? (
                        <GraficoFaltaApontamentoTransbordo 
                          data={finalDataFaltaApontamento} 
                          meta={configManager.getMetas('transbordo_diario').faltaApontamento} 
                        />
                      ) : (
                        <Center h="100%">
                          <Text>Sem dados de falta de apontamento</Text>
                        </Center>
                      )}
                    </Box>
                  </Box>
                )}
                
                {/* Uso GPS - Adicionado na mesma página */}
                {secoes.usoGPS && (
                  <Box flex="1">
                    <SectionTitle title="Uso GPS" centered={true} />
                    <Box 
                      border="1px solid"
                      borderColor="black"
                      borderRadius="md"
                      p={2}
                      h="calc(100% - 25px)"
                    >
                      {processedData.uso_gps.length > 0 ? (
                        <GraficoUsoGPS
                          data={processedData.uso_gps}
                          meta={configManager.getMetas('transbordo_diario').usoGPS}
                        />
                      ) : (
                        <Center h="100%">
                          <Text>Sem dados de uso GPS</Text>
                        </Center>
                      )}
                    </Box>
                  </Box>
                )}
              </Flex>
            </Box>
          </A4Colheita>
        )}

        {/* Página dedicada para Falta de Apontamento quando houver mais de 11 registros */}
        {secoes.faltaApontamento && finalDataFaltaApontamento.length > 11 && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader />
              
              <Box flex="1">
                <SectionTitle title="Falta de Apontamento" centered={true} />
                <Box 
                  border="1px solid"
                  borderColor="black"
                  borderRadius="md"
                  p={2}
                  h="calc(100% - 25px)"
                >
                  {finalDataFaltaApontamento.length > 0 ? (
                    <GraficoFaltaApontamentoTransbordo 
                      data={finalDataFaltaApontamento} 
                      meta={configManager.getMetas('transbordo_diario').faltaApontamento} 
                    />
                  ) : (
                    <Center h="100%">
                      <Text>Sem dados de falta de apontamento</Text>
                    </Center>
                  )}
                </Box>
              </Box>
            </Box>
          </A4Colheita>
        )}

        {/* Página dedicada para Uso GPS quando houver mais de 11 registros */}
        {secoes.usoGPS && processedData.uso_gps.length > 11 && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader />
              
              <Box flex="1">
                <SectionTitle title="Uso GPS" centered={true} />
                <Box 
                  border="1px solid"
                  borderColor="black"
                  borderRadius="md"
                  p={2}
                  h="calc(100% - 25px)"
                >
                  {processedData.uso_gps.length > 0 ? (
                    <GraficoUsoGPS
                      data={processedData.uso_gps}
                      meta={configManager.getMetas('transbordo_diario').usoGPS}
                    />
                  ) : (
                    <Center h="100%">
                      <Text>Sem dados de uso GPS</Text>
                    </Center>
                  )}
                </Box>
              </Box>
            </Box>
          </A4Colheita>
        )}

        {/* Páginas com Média de Velocidade (Carregado e Vazio) juntas quando ambos têm menos de 11 registros */}
        {secoes.mediaVelocidade && 
         finalDataMediaVelocidadeCarregado.length <= 11 && 
         finalDataMediaVelocidadeVazio.length <= 11 && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader />
              
              <Flex flex="1" direction="column" justify="space-between">
                {/* Média de Velocidade Carregado */}
                <Box flex="1" mb={4}>
                  <SectionTitle title="Média de Velocidade Carregado" centered={true} />
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    h="calc(100% - 25px)"
                  >
                    {finalDataMediaVelocidadeCarregado.length > 0 ? (
                      <GraficoMediaVelocidadeCarregadoTransbordo 
                        data={finalDataMediaVelocidadeCarregado} 
                        meta={configManager.getMetas('transbordo_diario').mediaVelocidade} 
                      />
                    ) : (
                      <Center h="100%">
                        <Text>Sem dados de média de velocidade carregado</Text>
                      </Center>
                    )}
                  </Box>
                </Box>

                {/* Média de Velocidade Vazio */}
                <Box flex="1">
                  <SectionTitle title="Média de Velocidade Vazio" centered={true} />
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    h="calc(100% - 25px)"
                  >
                    {finalDataMediaVelocidadeVazio.length > 0 ? (
                      <GraficoMediaVelocidadeVazioTransbordo 
                        data={finalDataMediaVelocidadeVazio} 
                        meta={configManager.getMetas('transbordo_diario').mediaVelocidade} 
                      />
                    ) : (
                      <Center h="100%">
                        <Text>Sem dados de média de velocidade vazio</Text>
                      </Center>
                    )}
                  </Box>
                </Box>
              </Flex>
            </Box>
          </A4Colheita>
        )}
        
        {/* Páginas separadas para velocidade quando qualquer um exceder 11 registros */}
        {secoes.mediaVelocidade && 
         (finalDataMediaVelocidadeCarregado.length > 11 || finalDataMediaVelocidadeVazio.length > 11) && (
          <>
            {/* Página dedicada para Média de Velocidade Carregado */}
            <A4Colheita>
              <Box h="100%" display="flex" flexDirection="column" bg="white">
                <PageHeader />
                
                <Box flex="1">
                  <SectionTitle title="Média de Velocidade Carregado" centered={true} />
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    h="calc(100% - 25px)"
                    display="flex"
                    flexDirection="column"
                    overflow="hidden"
                  >
                    <GraficoMediaVelocidadeCarregadoTransbordo 
                      data={finalDataMediaVelocidadeCarregado} 
                      meta={configManager.getMetas('transbordo_diario').mediaVelocidade} 
                    />
                  </Box>
                </Box>
              </Box>
            </A4Colheita>
            
            {/* Página dedicada para Média de Velocidade Vazio */}
            <A4Colheita>
              <Box h="100%" display="flex" flexDirection="column" bg="white">
                <PageHeader />
                
                <Box flex="1">
                  <SectionTitle title="Média de Velocidade Vazio" centered={true} />
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    h="calc(100% - 25px)"
                    display="flex"
                    flexDirection="column"
                    overflow="hidden"
                  >
                    <GraficoMediaVelocidadeVazioTransbordo
                      data={finalDataMediaVelocidadeVazio} 
                      meta={configManager.getMetas('transbordo_diario').mediaVelocidade} 
                    />
                  </Box>
                </Box>
              </Box>
            </A4Colheita>
          </>
        )}

        {/* Página de Media Velocidade Carregado - Excluir */}
        {secoes.mediaVelocidade && finalDataMediaVelocidadeCarregado.length > 0 && false && (
          <A4Colheita>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader showDate={true} />
              <Box flex="1">
                <SectionTitle title="Média de Velocidade com Carga" centered={true} />
                <Box mb={2}>
                  <Box border="1px solid" borderColor="black" borderRadius="md" p={2} h="calc(100% - 10px)">
                    <GraficoMediaVelocidadeCarregadoTransbordo 
                      data={finalDataMediaVelocidadeCarregado}
                      meta={configManager.getMetas('transbordo_diario').mediaVelocidadeCarregado || 20} 
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </A4Colheita>
        )}

        {/* Nova Página - Top 5 Ofensores */}
        <A4Colheita>
          <Box h="100%" display="flex" flexDirection="column" bg="white">
            <PageHeader showDate={true} />
            <Box flex="1" display="flex" flexDirection="column">
              <SectionTitle title="Top 5 Ofensores" centered={true} />
              
              {/* Container ocupando metade da página */}
              <Box 
                width="100%" 
                height="50%" 
                border="1px solid" 
                borderColor="black" 
                borderRadius="md" 
                p={4}
                mb={4}
              >
                {/* Gráfico de Top 5 Ofensores */}
                <GraficoTop5OfensoresTransbordo data={finalDataOfensores} />
              </Box>
            </Box>
          </Box>
        </A4Colheita>
        
        {/* Página 6 - Resumo de Frotas */}
        <A4Colheita
          footer={null}
        >
          <Box h="100%" display="flex" flexDirection="column" bg="white">
            <PageHeader />
            
            <Box p={4} flex="1">
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
                Resumo do Relatório de Transbordo Diário - Frotas
              </Heading>

              {/* Seção Frotas */}
              {secoes.disponibilidadeMecanica && (
                <Box>
                  <SectionTitle title="Frotas" centered={true} />
                  
                  {/* Cards de indicadores de frotas */}
                  <SimpleGrid columns={2} spacing={4} mb={4}>
                    {/* Garantir que os dados de disponibilidade mecânica são sempre exibidos */}
                    <IndicatorCard 
                      title="Disponibilidade Mecânica"
                      value={calcularIndicador(processedData.disponibilidade_mecanica, 'disponibilidade', configManager.getMetas('transbordo_diario').disponibilidadeMecanica).valor}
                      meta={configManager.getMetas('transbordo_diario').disponibilidadeMecanica}
                      unitType="porcentagem"
                      acimaMeta={calcularIndicador(processedData.disponibilidade_mecanica, 'disponibilidade', configManager.getMetas('transbordo_diario').disponibilidadeMecanica).acimaMeta}
                    />
                  </SimpleGrid>

                  {/* Tabela de frotas se for necessário */}
                  <TabelaFrotas 
                    dados={processedData.disponibilidade_mecanica.map((item: any) => ({
                      frota: item.frota,
                      disponibilidade: item.disponibilidade
                    }))} 
                    tipo="transbordo_diario" 
                    dadosCompletos={{}}
                    mostrarHorasTotal={false}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </A4Colheita>

        {/* Página 7 (Última) - Resumo de Operadores */}
        <A4Colheita isLastPage={true}>
          <Box h="100%" display="flex" flexDirection="column" bg="white">
            <PageHeader />
            
            <Box p={4} flex="1">
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
                Resumo do Relatório de Transbordo Diário - Operadores
              </Heading>

              {/* Seção Operadores */}
              <Box>
                <SectionTitle title="Operadores" centered={true} />
                
                {/* Cards de indicadores de operadores */}
                <SimpleGrid 
                  columns={2}
                  spacing={4} 
                  mb={4}
                >
                  {/* Mostrar cards somente se a seção estiver visível */}
                  {secoes.eficienciaEnergetica && (
                    <IndicatorCard 
                      title="Eficiência Energética"
                      value={calcularIndicador(processedData.eficiencia_energetica, 'eficiencia', configManager.getMetas('transbordo_diario').eficienciaEnergetica).valor}
                      meta={configManager.getMetas('transbordo_diario').eficienciaEnergetica}
                      unitType="porcentagem"
                      acimaMeta={calcularIndicador(processedData.eficiencia_energetica, 'eficiencia', configManager.getMetas('transbordo_diario').eficienciaEnergetica).acimaMeta}
                    />
                  )}
                  
                  {secoes.motorOcioso && (
                    <IndicatorCard 
                      title="Motor Ocioso"
                      value={calcularIndicador(processedData.motor_ocioso, 'percentual', configManager.getMetas('transbordo_diario').motorOcioso, true).valor}
                      meta={configManager.getMetas('transbordo_diario').motorOcioso}
                      isInverted={true}
                      unitType="porcentagem"
                      acimaMeta={calcularIndicador(processedData.motor_ocioso, 'percentual', configManager.getMetas('transbordo_diario').motorOcioso, true).acimaMeta}
                    />
                  )}
                  
                  {secoes.faltaApontamento && (
                    <IndicatorCard 
                      title="Falta de Apontamento"
                      value={calcularIndicador(processedData.falta_apontamento, 'percentual', configManager.getMetas('transbordo_diario').faltaApontamento, true).valor}
                      meta={configManager.getMetas('transbordo_diario').faltaApontamento}
                      isInverted={true}
                      unitType="porcentagem"
                      acimaMeta={calcularIndicador(processedData.falta_apontamento, 'percentual', configManager.getMetas('transbordo_diario').faltaApontamento, true).acimaMeta}
                    />
                  )}
                  
                  {secoes.usoGPS && (
                    <IndicatorCard 
                      title="Uso GPS"
                      value={calcularIndicador(processedData.uso_gps, 'porcentagem', configManager.getMetas('transbordo_diario').usoGPS, false).valor}
                      meta={configManager.getMetas('transbordo_diario').usoGPS}
                      unitType="porcentagem"
                      acimaMeta={calcularIndicador(processedData.uso_gps, 'porcentagem', configManager.getMetas('transbordo_diario').usoGPS, false).acimaMeta}
                    />
                  )}

                  {/* Card original de Média de Velocidade - escondido */}
                  {false && secoes.mediaVelocidade && (
                    <IndicatorCard 
                      title="Média de Velocidade"
                      value={calcularIndicador(processedData.media_velocidade, 'velocidade', configManager.getMetas('transbordo_diario').mediaVelocidade, true).valor}
                      meta={configManager.getMetas('transbordo_diario').mediaVelocidade}
                      unitType="velocidade"
                      isInverted={true}
                      acimaMeta={calcularIndicador(processedData.media_velocidade, 'velocidade', configManager.getMetas('transbordo_diario').mediaVelocidade, true).acimaMeta}
                    />
                  )}
                  
                  {/* Novo Card - Média de Velocidade Vazio */}
                  {secoes.mediaVelocidade && (
                    <IndicatorCard 
                      title="Média Velocidade Vazio"
                      value={calcularIndicador(finalDataMediaVelocidadeVazio, 'velocidade', configManager.getMetas('transbordo_diario').mediaVelocidade, true).valor}
                      meta={configManager.getMetas('transbordo_diario').mediaVelocidade}
                      unitType="velocidade"
                      isInverted={true}
                      acimaMeta={calcularIndicador(finalDataMediaVelocidadeVazio, 'velocidade', configManager.getMetas('transbordo_diario').mediaVelocidade, true).acimaMeta}
                    />
                  )}
                  
                  {/* Novo Card - Média de Velocidade Carregado */}
                  {secoes.mediaVelocidade && (
                    <IndicatorCard 
                      title="Média Velocidade Carregado"
                      value={calcularIndicador(finalDataMediaVelocidadeCarregado, 'velocidade', configManager.getMetas('transbordo_diario').mediaVelocidade, true).valor}
                      meta={configManager.getMetas('transbordo_diario').mediaVelocidade}
                      unitType="velocidade"
                      isInverted={true}
                      acimaMeta={calcularIndicador(finalDataMediaVelocidadeCarregado, 'velocidade', configManager.getMetas('transbordo_diario').mediaVelocidade, true).acimaMeta}
                    />
                  )}
                </SimpleGrid>
                
                {/* Tabela de operadores - só renderizar nesta página se não houver muitos registros */}
                {!(processedData.eficiencia_energetica.length > 15 || 
                   processedData.motor_ocioso.length > 15 || 
                   processedData.falta_apontamento.length > 15 || 
                   processedData.uso_gps.length > 15 || 
                   finalDataMediaVelocidadeVazio.length > 15 || 
                   finalDataMediaVelocidadeCarregado.length > 15) && (
                  <TabelaOperadores 
                    dados={{
                      eficiencia_energetica: processedData.eficiencia_energetica.map((item: OperadorEficiencia) => ({
                        id: item.id,
                        nome: item.nome,
                        eficiencia: item.eficiencia
                      })),
                      motor_ocioso: processedData.motor_ocioso.map((item: OperadorMotorOcioso) => ({
                        id: item.id || '',
                        nome: item.nome || '',
                        percentual: item.percentual || 0,
                        tempoLigado: item.tempoLigado || item.tempoTotal || 0,
                        tempoOcioso: item.tempoOcioso || ((item.percentual || 0) / 100 * (item.tempoLigado || item.tempoTotal || 0))
                      })),
                      falta_apontamento: processedData.falta_apontamento.map((item: OperadorFaltaApontamento) => ({
                        id: item.id || '',
                        nome: item.nome || '',
                        percentual: item.percentual || 0
                      })),
                      uso_gps: processedData.uso_gps.map((item: OperadorUsoGPS) => ({
                        id: item.id || '',
                        nome: item.nome || '',
                        porcentagem: item.porcentagem || 0
                      })),
                      media_velocidade: finalDataMediaVelocidade.map((item: MediaVelocidadeData) => ({
                        id: item.id,
                        nome: item.nome,
                        velocidade: item.velocidade
                      })),
                      media_velocidade_vazio: finalDataMediaVelocidadeVazio,
                      media_velocidade_carregado: finalDataMediaVelocidadeCarregado
                    }}
                    tipo="transbordo_diario"
                    mostrarEficiencia={secoes.eficienciaEnergetica}
                    mostrarMotorOcioso={secoes.motorOcioso}
                    mostrarUsoGPS={secoes.usoGPS}
                    mostrarFaltaApontamento={secoes.faltaApontamento}
                    mostrarMediaVelocidade={secoes.mediaVelocidade && false} // Ocultar velocidade original
                    mostrarMediaVelocidadeVazio={secoes.mediaVelocidade}
                    mostrarMediaVelocidadeCarregado={secoes.mediaVelocidade}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </A4Colheita>

        {/* Página adicional para tabela de operadores quando houver muitos registros */}
        {(processedData.eficiencia_energetica.length > 15 || 
          processedData.motor_ocioso.length > 15 || 
          processedData.falta_apontamento.length > 15 || 
          processedData.uso_gps.length > 15 || 
          finalDataMediaVelocidadeVazio.length > 15 || 
          finalDataMediaVelocidadeCarregado.length > 15) && (
          <A4Colheita isLastPage={true}>
            <Box h="100%" display="flex" flexDirection="column" bg="white">
              <PageHeader />
              
              <Box p={4} flex="1">
                <Heading
                  as="h1"
                  size="sm"
                  textAlign="center"
                  mb={4}
                  color="black"
                  fontWeight="bold"
                  fontSize="15px"
                >
                  Tabela de Operadores - Relatório de Transbordo Diário
                </Heading>
                
                <TabelaOperadores 
                  dados={{
                    eficiencia_energetica: processedData.eficiencia_energetica.map((item: OperadorEficiencia) => ({
                      id: item.id,
                      nome: item.nome,
                      eficiencia: item.eficiencia
                    })),
                    motor_ocioso: processedData.motor_ocioso.map((item: OperadorMotorOcioso) => ({
                      id: item.id || '',
                      nome: item.nome || '',
                      percentual: item.percentual || 0,
                      tempoLigado: item.tempoLigado || item.tempoTotal || 0,
                      tempoOcioso: item.tempoOcioso || ((item.percentual || 0) / 100 * (item.tempoLigado || item.tempoTotal || 0))
                    })),
                    falta_apontamento: processedData.falta_apontamento.map((item: OperadorFaltaApontamento) => ({
                      id: item.id || '',
                      nome: item.nome || '',
                      percentual: item.percentual || 0
                    })),
                    uso_gps: processedData.uso_gps.map((item: OperadorUsoGPS) => ({
                      id: item.id || '',
                      nome: item.nome || '',
                      porcentagem: item.porcentagem || 0
                    })),
                    media_velocidade: finalDataMediaVelocidade.map((item: MediaVelocidadeData) => ({
                      id: item.id,
                      nome: item.nome,
                      velocidade: item.velocidade
                    })),
                    media_velocidade_vazio: finalDataMediaVelocidadeVazio,
                    media_velocidade_carregado: finalDataMediaVelocidadeCarregado
                  }}
                  tipo="transbordo_diario"
                  mostrarEficiencia={secoes.eficienciaEnergetica}
                  mostrarMotorOcioso={secoes.motorOcioso}
                  mostrarUsoGPS={secoes.usoGPS}
                  mostrarFaltaApontamento={secoes.faltaApontamento}
                  mostrarMediaVelocidade={secoes.mediaVelocidade && false} // Ocultar velocidade original
                  mostrarMediaVelocidadeVazio={secoes.mediaVelocidade}
                  mostrarMediaVelocidadeCarregado={secoes.mediaVelocidade}
                />
              </Box>
            </Box>
          </A4Colheita>
        )}
      </Box>
    </Box>
  );
} 