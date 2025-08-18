'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, VStack, Heading, Image, Flex, Text, SimpleGrid, Center, Spinner, Button, Switch, FormControl, FormLabel } from '@chakra-ui/react';
import A4Colheita from '@/components/Layout/A4Colheita';
import { useReportStore } from '@/store/useReportStore';
import { GraficoDisponibilidadeMecanicaColheita } from '@/components/Charts/Colheita/Diario/GraficoDisponibilidadeMecanicaColheita';
import { GraficoEficienciaEnergetica } from '@/components/Charts/Colheita/Diario/GraficoEficienciaEnergetica';
import { GraficoHorasElevador } from '@/components/Charts/Colheita/Diario/GraficoHorasElevador';
import { GraficoMotorOciosoColheita } from '@/components/Charts/Colheita/Diario/GraficoMotorOciosoColheita';
import { GraficoUsoGPS } from '@/components/Charts/Colheita/Diario/GraficoUsoGPS';
import { GraficoMediaVelocidadeColheita } from '@/components/Charts/Colheita/Diario/GraficoMediaVelocidadeColheita';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FaPrint } from 'react-icons/fa';
import { configManager } from '@/utils/config';
import RelatorioColheitaDiarioResumo from '@/components/RelatorioColheitaDiarioResumo';
import IndicatorCard from '@/components/IndicatorCard';
import TabelaOperadores from '@/components/TabelaOperadores';
import TabelaFrotas from '@/components/TabelaFrotas';
import { GraficoTop5OfensoresColheita } from '@/components/Charts/Colheita/Diario/GraficoTop5OfensoresColheita';

interface ColheitaA4Props {
  data?: any;
}

interface DadosProcessados {
  tdh: Array<{
    frota: string;
    valor: number;
  }>;
  diesel: Array<{
    frota: string;
    valor: number;
  }>;
  impureza_vegetal: Array<{
    frota: string;
    valor: number;
  }>;
  disponibilidade_mecanica: Array<{
    frota: string;
    disponibilidade: number;
  }>;
  eficiencia_energetica: Array<{
    id: string;
    nome: string;
    eficiencia: number;
  }>;
  hora_elevador: Array<{
    id: string;
    nome: string;
    horas: number;
  }>;
  motor_ocioso: Array<{
    id: string;
    nome: string;
    percentual: number;
  }>;
  uso_gps: Array<{
    id: string;
    nome: string;
    porcentagem: number;
  }>;
  media_velocidade: Array<{
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
  percentual: number;
  tempoLigado: number;
  tempoOcioso: number;
}

interface DadosVelocidade {
  id: string;
  nome: string;
  velocidade: number;
}

interface OperadorData {
  id: string;
  nome: string;
  percentual?: number;
  horas?: number;
  porcentagem?: number;
  eficiencia?: number;
  velocidade?: number;
}

interface DadosTabelaOperadores {
  eficiencia_energetica: Array<{ id: string; nome: string; eficiencia: number; }>;
  motor_ocioso: DadosMotorOcioso[];
  hora_elevador?: Array<{ id: string; nome: string; horas: number; }>;
  uso_gps: Array<{ id: string; nome: string; porcentagem: number; }>;
  media_velocidade: Array<{ id: string; nome: string; velocidade: number; }>;
}

interface MediaVelocidadeData {
  id: string;
  nome: string;
  velocidade: number;
}

interface MotorOciosoData {
  id: string;
  nome: string;
  percentual: number;
  tempoLigado: number;
  tempoOcioso: number;
}

interface MediaVelocidade {
  id: string;
  nome: string;
  velocidade: number;
}

interface DadosOperador {
  operadores: MediaVelocidade[];
  data: any;
  meta: number;
  media: number;
  acimaMeta: {
    quantidade: number;
    total: number;
    percentual: number;
  };
}

interface DadosProcessados {
  operadores: MediaVelocidade[];
  data: any;
  meta: any;
  media: number;
  acimaMeta: {
    quantidade: number;
    total: any;
    percentual: number;
  };
}

// Função para verificar se os dados estão no formato esperado
const verificarFormatoDados = (dados: any) => {
  if (!dados) return false;
  
  // Verificar se pelo menos uma das propriedades esperadas existe e tem itens
  const temDisponibilidade = Array.isArray(dados.disponibilidade_mecanica) && 
    dados.disponibilidade_mecanica.length > 0;
  
  const temEficiencia = Array.isArray(dados.eficiencia_energetica) && 
    dados.eficiencia_energetica.length > 0;
  
  const temHorasElevador = Array.isArray(dados.hora_elevador) && 
    dados.hora_elevador.length > 0;
  
  const temMotorOcioso = Array.isArray(dados.motor_ocioso) && 
    dados.motor_ocioso.length > 0;
  
  const temUsoGPS = Array.isArray(dados.uso_gps) && 
    dados.uso_gps.length > 0;
  
  // Verificação alternativa com nomes de campos em CamelCase ou outras variações
  const temDisponibilidadeAlt = Array.isArray(dados.disponibilidadeMecanica) && 
    dados.disponibilidadeMecanica.length > 0;
  
  const temEficienciaAlt = Array.isArray(dados.eficienciaEnergetica) && 
    dados.eficienciaEnergetica.length > 0;
  
  const temHorasElevadorAlt = Array.isArray(dados.horaElevador) && 
    dados.horaElevador.length > 0;
  
  const temMotorOciosoAlt = Array.isArray(dados.motorOcioso) && 
    dados.motorOcioso.length > 0;
  
  const temUsoGPSAlt = Array.isArray(dados.usoGPS) && 
    dados.usoGPS.length > 0;
  
  // Desabilitando log de depuração
  // console.log('Verificação de dados do relatório:', {
  //   temDisponibilidade,
  //   temEficiencia,
  //   temHorasElevador,
  //   temMotorOcioso,
  //   temUsoGPS,
  //   temDisponibilidadeAlt,
  //   temEficienciaAlt,
  //   temHorasElevadorAlt,
  //   temMotorOciosoAlt,
  //   temUsoGPSAlt
  // });
  
  // Verificar se pelo menos uma das seções tem dados
  return temDisponibilidade || temEficiencia || temHorasElevador || temMotorOcioso || temUsoGPS ||
         temDisponibilidadeAlt || temEficienciaAlt || temHorasElevadorAlt || temMotorOciosoAlt || temUsoGPSAlt;
};

export default function ColheitaA4({ data }: ColheitaA4Props) {
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
  const [nomeFrente, setNomeFrente] = useState<string>('');
  const [subscription, setSubscription] = useState<any>(null);
  
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
    const frentes = configManager.getFrentes('colheita_diario');
    const frente = frentes.find(f => f.id === frenteId);
    const nomeFrenteCompleto = frente ? frente.nome : frenteId;
    const titulo = `Relatório de Colheita Diário - ${nomeFrenteCompleto} ${dataFormatada}`;
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

  useEffect(() => {
    console.log('📊 ReportID mudou para:', reportId);
    console.log('📊 ReportData:', reportData);
    
    if (reportId) {
      setLoading(true);
      const fetchData = async () => {
        try {
          const { data: report, error } = await supabase
            .from('relatorios_diarios')
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
            const frentes = configManager.getFrentes('colheita_diario');
            const frente = frentes.find(f => f.id === report.frente);
            const nomeFrenteAtual = frente ? frente.nome : report.frente;
            setNomeFrente(nomeFrenteAtual);
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

  // Função para gerar o nome do arquivo PDF
  const gerarNomeArquivo = () => {
    const data = reportData?.data ? formatarData(reportData.data).replace(/\//g, '-') : formatarData(new Date().toISOString().split('T')[0]).replace(/\//g, '-');
    return `Relatório de Colheita Diário - ${nomeFrente} - ${data}.pdf`;
  };

  const currentDate = formatarData(new Date().toISOString().split('T')[0]);
  const LOGO_HEIGHT = "50px";
  const LOGO_URL = "https://kjlwqezxzqjfhacmjhbh.supabase.co/storage/v1/object/public/sourcefiles/Logo%20IB%20Full.png";

  // PREPARAÇÃO DE DADOS
  const finalData: DadosProcessados = useMemo(() => {
    if (!reportData?.dados) {
      // Reduzindo logs
      // console.log('❌ Sem dados do relatório');
                return {
        tdh: [],
        diesel: [],
        impureza_vegetal: [],
        disponibilidade_mecanica: [],
        eficiencia_energetica: [],
        hora_elevador: [],
        motor_ocioso: [],
        uso_gps: [],
        media_velocidade: []
      };
    }

    // Reduzindo logs
    // console.log('📊 Dados brutos do relatório:', reportData.dados);
    return reportData.dados;
  }, [reportData]);

  // Preparar os arrays de dados com validação estrita
  const finalDataDisponibilidade = useMemo(() => {
    if (!Array.isArray(finalData?.disponibilidade_mecanica)) {
      // Reduzindo logs
      // console.log('❌ Dados de disponibilidade inválidos ou ausentes');
      return [];
    }
    const data = finalData.disponibilidade_mecanica
      .filter(item => 
        item && item.frota && item.disponibilidade !== undefined && item.disponibilidade !== null
      )
      .map(item => ({
        ...item,
        frota: typeof item.frota === 'string' ? item.frota : String(item.frota).replace(/\.0+$/, '') // Remove decimais .0
      }));
    
    // Reduzindo logs
    // console.log('📊 Dados de disponibilidade processados:', data);
    return data;
  }, [finalData]);
  
  const finalDataEficiencia = useMemo(() => {
    if (!Array.isArray(finalData?.eficiencia_energetica)) {
      // Reduzindo logs
      // console.log('❌ Dados de eficiência inválidos ou ausentes');
      return [];
    }
    const data = finalData.eficiencia_energetica.filter(item => 
      item && item.nome && item.eficiencia !== undefined && item.eficiencia !== null
    );
    // Reduzindo logs
    // console.log('📊 Dados de eficiência processados:', data);
    return data;
  }, [finalData]);
  
  const finalDataHorasElevador = useMemo(() => {
    if (!Array.isArray(finalData?.hora_elevador)) {
      // Reduzindo logs
      // console.log('❌ Dados de horas elevador inválidos ou ausentes');
      return [];
    }
    const data = finalData.hora_elevador.filter(item => 
      item && item.nome && item.horas !== undefined && item.horas !== null
    );
    // Reduzindo logs
    // console.log('📊 Dados de horas elevador processados:', data);
    return data;
  }, [finalData]);
  
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
  
  const finalDataUsoGPS = useMemo(() => {
    if (!Array.isArray(finalData?.uso_gps)) {
      // Reduzindo logs
      // console.log('❌ Dados de uso GPS inválidos ou ausentes');
      return [];
    }
    const data = finalData.uso_gps.filter(item => 
      item && item.nome && item.porcentagem !== undefined && item.porcentagem !== null
    );
    // Reduzindo logs
    // console.log('📊 Dados de uso GPS processados:', data);
    return data;
  }, [finalData]);

  const finalDataMediaVelocidade = useMemo(() => {
    if (!reportData?.dados?.media_velocidade) return [];
    return reportData.dados.media_velocidade.map((item: MediaVelocidadeData) => ({
      id: item.id,
      nome: item.nome,
      velocidade: item.velocidade
    }));
  }, [reportData?.dados?.media_velocidade]);

  // Preparar dados para ofensores
  const finalDataOfensores = useMemo(() => {
    if (!reportData?.dados?.ofensores) {
      console.log("Ofensores não encontrados no relatório, usando mockup");
      // Usar dados de mockup se não houver dados reais
      return [
        { Operacao: '8040 - MANUTENÇÃO CORRETIVA', Tempo: 11.84, Porcentagem: '46,18%' },
        { Operacao: '8620 - FALTA TRANSBORDO', Tempo: 6.50, Porcentagem: '25,36%' },
        { Operacao: '8340 - FALTA DE APONTAMENTO', Tempo: 1.34, Porcentagem: '5,21%' },
        { Operacao: '8630 - TROCA DE FAQUINHA', Tempo: 1.18, Porcentagem: '4,59%' },
        { Operacao: '8660 - INST CONFIG TECNOL EMBARCADAS', Tempo: 1.05, Porcentagem: '4,10%' },
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

  // Obter metas do relatório ou usar fallback do configManager
  const metas = useMemo(() => {
    const defaultMetas = configManager.getMetas('colheita_diario');
    if (!reportData?.metas) {
      // Removendo o log aqui
      // console.log('⚠️ Usando metas padrão do configManager');
      return defaultMetas;
    }
    
    // Removendo o log aqui
    // console.log('✅ Usando metas do relatório:', reportData.metas);
    return {
      disponibilidadeMecanica: reportData.metas.disponibilidadeMecanica ?? defaultMetas.disponibilidadeMecanica,
      eficienciaEnergetica: reportData.metas.eficienciaEnergetica ?? defaultMetas.eficienciaEnergetica,
      horaElevador: reportData.metas.horaElevador ?? defaultMetas.horaElevador,
      motorOcioso: reportData.metas.motorOcioso ?? defaultMetas.motorOcioso,
      usoGPS: reportData.metas.usoGPS ?? defaultMetas.usoGPS
    };
  }, [reportData?.metas]);

  // Verificar se estamos no modo de visualização ou no modo de relatório específico
  const isModoTemplate = !reportId;

  // Log para debug - Desativado para reduzir logs
  useEffect(() => {
    // Log desativado para reduzir volume no console
    // if (!loading) {
    //   console.log('===== DETALHES DO RELATÓRIO =====');
    //   console.log('📊 Modo:', isModoTemplate ? 'Template/Layout' : 'Relatório Específico');
    //   console.log('📊 ID do relatório:', reportId || 'Nenhum');
    //   console.log('📊 Disponibilidade:', finalDataDisponibilidade.length, 'itens');
    //   console.log('📊 Eficiência:', finalDataEficiencia.length, 'itens');
    //   console.log('📊 Horas elevador:', finalDataHorasElevador.length, 'itens');
    //   console.log('📊 Motor ocioso:', finalDataMotorOcioso.length, 'itens');
    //   console.log('📊 Uso GPS:', finalDataUsoGPS.length, 'itens');
    //   
    //   // Verificar primeiro item de cada seção para depuração
    //   if (finalDataDisponibilidade.length > 0) {
    //     console.log('📊 Exemplo Disponibilidade:', finalDataDisponibilidade[0]);
    //   }
    //   if (finalDataEficiencia.length > 0) {
    //     console.log('📊 Exemplo Eficiência:', finalDataEficiencia[0]);
    //   }
    // }
  }, []); // Removendo completamente as dependências

  // Verificar configuração para mostrar ou esconder componentes
  const secoes = useMemo(() => {
    // Obter configurações de seções para o tipo de relatório
    const tipoRelatorio = reportData?.tipo || 'colheita_diario';
    
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
      horaElevador: true,
      usoGPS: true,
      mediaVelocidade: true
    };
    
    // Priorizar as configurações na seguinte ordem:
    // 1. Configurações salvas no relatório
    // 2. Configurações específicas do relatório no store
    // 3. Configurações globais no store
    
    // Se tivermos configurações salvas no relatório, usá-las
    if (savedVisibility && savedVisibility.colheita) {
      // Se tivermos um reportId, atualizar o store com essas configurações
      if (reportId) {
        setReportVisibilityConfig(reportId, savedVisibility);
      }
      
      return {
        ...configSections,
        // Usar as configurações de visibilidade que foram salvas com o relatório
        disponibilidadeMecanica: savedVisibility.colheita.disponibilidadeMecanica,
        eficienciaEnergetica: savedVisibility.colheita.eficienciaEnergetica,
        motorOcioso: savedVisibility.colheita.motorOcioso,
        horaElevador: savedVisibility.colheita.horaElevador,
        usoGPS: savedVisibility.colheita.usoGPS,
        mediaVelocidade: savedVisibility.colheita.mediaVelocidade
      };
    }
    
    // Se tivermos configurações específicas do relatório no store, usá-las
    if (reportSpecificVisibility && reportSpecificVisibility.colheita) {
      return {
        ...configSections,
        // Usar as configurações de visibilidade específicas do relatório
        disponibilidadeMecanica: reportSpecificVisibility.colheita.disponibilidadeMecanica,
        eficienciaEnergetica: reportSpecificVisibility.colheita.eficienciaEnergetica,
        motorOcioso: reportSpecificVisibility.colheita.motorOcioso,
        horaElevador: reportSpecificVisibility.colheita.horaElevador,
        usoGPS: reportSpecificVisibility.colheita.usoGPS,
        mediaVelocidade: reportSpecificVisibility.colheita.mediaVelocidade
      };
    }
    
    // Por último, usar as configurações globais do store
    return {
      ...configSections,
      // Priorizar as configurações de visibilidade do store para o módulo Colheita
      disponibilidadeMecanica: visibilityConfig.colheita.disponibilidadeMecanica,
      eficienciaEnergetica: visibilityConfig.colheita.eficienciaEnergetica,
      motorOcioso: visibilityConfig.colheita.motorOcioso,
      horaElevador: visibilityConfig.colheita.horaElevador,
      usoGPS: visibilityConfig.colheita.usoGPS,
      mediaVelocidade: visibilityConfig.colheita.mediaVelocidade
    };
  }, [reportData, reportId, visibilityConfig, getReportVisibilityConfig, setReportVisibilityConfig]);

  // FUNÇÕES
  // Função para imprimir o relatório
  const handlePrint = async () => {
    try {
      // Tentar usar a API de impressão do navegador diretamente
      window.print();
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      setError('Erro ao imprimir. Por favor, tente novamente.');
    }
  };

  // Função para calcular média
  const calcularMedia = (array: any[] | undefined, propriedade: string, acima: boolean = true): number => {
    // Verificação inicial mais robusta
    if (!array || !Array.isArray(array) || array.length === 0) {
      return 0;
    }
    
    // Filtrar apenas itens com valores válidos
    const itensFiltrados = array.filter(item => {
      if (!item) return false;
      
      // Verificação adicional para garantir que o valor existe e é válido
      const valor = item[propriedade];
      const valorExiste = valor !== undefined && valor !== null;
      const valorValido = typeof valor === 'number' || (typeof valor === 'string' && !isNaN(parseFloat(valor)));
      
      if (!valorExiste || !valorValido) {
        return false;
      }
      
      // Para disponibilidade, verificar se tem frota
      if (propriedade === 'disponibilidade') {
        return item.frota && item.frota.trim() !== '' && valorExiste && valorValido;
      }
      
      // Para valor (TDH, diesel, impureza)
      if (propriedade === 'valor') {
        return item.frota && item.frota.trim() !== '' && valorExiste && valorValido;
      }
      
      // Para outros, verificar se tem nome de operador
      return item.nome && item.nome.trim() !== '' && valorExiste && valorValido;
    });
    
    // Se não há itens válidos, retorna zero
    if (itensFiltrados.length === 0) {
      return 0;
    }
    
    // Convertendo cada valor para número com cuidado para preservar valores pequenos
    const valores = itensFiltrados.map(item => {
      const valor = item[propriedade];
      
      // Garantir que valores sejam tratados corretamente
      if (typeof valor === 'string') {
        return parseFloat(valor.replace(',', '.').replace('%', ''));
      }
      return typeof valor === 'number' ? valor : 0;
    });
    
    // Calculando a soma manualmente para garantir precisão com números pequenos
    let soma = 0;
    for (let i = 0; i < valores.length; i++) {
      soma += valores[i];
    }
    
    // Calcular média com alta precisão
    const media = soma / valores.length;
    
    // Retorna a média calculada sem arredondar
    return media;
  };

  // Função para calcular total
  const calcularTotal = (array: any[] | undefined, propriedade: string): number => {
    if (!array || array.length === 0) return 0;
    
    // Filtrar apenas itens que têm operador preenchido
    const itensFiltrados = array.filter(item => 
      item && item.nome && item.nome.trim() !== ''
    );
    
    // Soma apenas os itens com operador válido
    return itensFiltrados.reduce((acc: number, item: any) => acc + Number(item[propriedade] || 0), 0);
  };

  // Função para contar itens que atendem à meta
  const contarItensMeta = (array: any[] | undefined, propriedade: string, meta: number, acima: boolean = true): number => {
    if (!array || array.length === 0) return 0;
    
    // Filtrar apenas itens que têm operador/frota preenchidos
    const itensFiltrados = array.filter(item => {
      if (!item) return false;
      
      // Para disponibilidade, verificar se tem frota
      if (propriedade === 'disponibilidade') {
        return item.frota && item.frota.trim() !== '';
      }
      
      // Para outros, verificar se tem nome de operador
      return item.nome && item.nome.trim() !== '';
    });
    
    // Conta itens que atendem à meta
    return itensFiltrados.filter(item => 
      acima ? (Number(item[propriedade] || 0) >= meta) : (Number(item[propriedade] || 0) <= meta)
    ).length;
  };

  // COMPONENTES
  // Componente para o cabeçalho da página
  const PageHeader = ({ showDate = false }: { showDate?: boolean }) => {
    // Encontrar o nome completo da frente no config
    const frenteConfig = configManager.getFrentes('colheita_diario').find((f: { id: string }) => f.id === reportData?.frente);
    const nomeFrente = frenteConfig?.nome || reportData?.frente || 'Exemplo';
    
    // Processar a data com segurança
    const dateToDisplay = reportData?.data 
      ? formatarData(reportData.data) 
      : currentDate;

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
            {`Relatório de Colheita Diário - ${nomeFrente}`}
          </Heading>
          {showDate && dateToDisplay && (
            <Text color="black" fontSize="sm" fontWeight="medium">
              {dateToDisplay}
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

  // Preparar dados do resumo
  const resumoData = useMemo(() => {
    console.log('📊 Preparando dados para cards de resumo...');
    console.log('📊 Metas recebidas do backend:', reportData?.metas);
    console.log('📊 Metas do configManager:', configManager.getMetas('colheita_diario'));
    
    // Verificar se temos dados válidos
    if (!finalData || !reportData?.dados) {
      console.log('❌ Sem dados válidos para o resumo');
      return {
        tdh: { data: [], meta: 0, media: 0 },
        diesel: { data: [], meta: 0, media: 0 },
        impurezaVegetal: { data: [], meta: 0, media: 0 },
        disponibilidadeMecanica: { 
          data: [], 
          meta: 0, 
          media: 0,
          acimaMeta: { quantidade: 0, total: 0, percentual: 0 }
        },
        eficienciaEnergetica: {
          data: [],
          meta: 0,
          media: 0,
          acimaMeta: { quantidade: 0, total: 0, percentual: 0 }
        },
        horaElevador: {
          data: [],
          meta: 0,
          media: 0,
          acimaMeta: { quantidade: 0, total: 0, percentual: 0 }
        },
        motorOcioso: {
          data: [],
          meta: 0,
          media: 0,
          acimaMeta: { quantidade: 0, total: 0, percentual: 0 }
        },
        usoGPS: {
          data: [],
          meta: 0,
          media: 0,
          acimaMeta: { quantidade: 0, total: 0, percentual: 0 }
        },
        mediaVelocidade: {
          data: [],
          meta: 0,
          media: 0,
          acimaMeta: { quantidade: 0, total: 0, percentual: 0 }
        },
        frotas: [],
        operadores: []
      };
    }

    // Preparar dados das frotas com validação estrita
    const frotas = (finalData.tdh || [])
      .filter(item => item && item.frota && item.valor !== undefined)
      .map(item => ({
        id: item.frota,
        tdh: item.valor,
        diesel: finalData.diesel?.find(d => d.frota === item.frota)?.valor || 0,
        disponibilidade: finalData.disponibilidade_mecanica?.find(d => d.frota === item.frota)?.disponibilidade || 0,
        impureza: finalData.impureza_vegetal?.find(d => d.frota === item.frota)?.valor || 0
      }));

    // Preparar dados dos operadores com validação estrita
    const operadores = (finalDataEficiencia || [])
      .filter(item => item && item.nome)
      .map(item => ({
        id: item.nome,
        eficiencia: item.eficiencia || 0,
        horasElevador: finalDataHorasElevador.find(h => h.nome === item.nome)?.horas || 0,
        motorOcioso: finalDataMotorOcioso.find((m: MotorOciosoData) => m.nome === item.nome)?.percentual || 0,
        usoGPS: finalDataUsoGPS.find(g => g.nome === item.nome)?.porcentagem || 0
      }));

    return {
      tdh: {
      data: finalData.tdh || [],
        meta: reportData?.metas?.tdh || configManager.getMetas('colheita_diario').tdh,
      media: calcularMedia(finalData.tdh, 'valor')
      },
      diesel: {
      data: finalData.diesel || [],
        meta: reportData?.metas?.diesel || configManager.getMetas('colheita_diario').diesel,
      media: calcularMedia(finalData.diesel, 'valor')
      },
      impurezaVegetal: {
      data: finalData.impureza_vegetal || [],
        meta: reportData?.metas?.impurezaVegetal || configManager.getMetas('colheita_diario').impureza_vegetal,
      media: calcularMedia(finalData.impureza_vegetal, 'valor')
      },
      disponibilidadeMecanica: {
        data: finalDataDisponibilidade,
        meta: reportData?.metas?.disponibilidadeMecanica || configManager.getMetas('colheita_diario').disponibilidadeMecanica,
        media: calcularMedia(finalDataDisponibilidade, 'disponibilidade'),
      acimaMeta: {
          quantidade: contarItensMeta(finalDataDisponibilidade, 'disponibilidade', reportData?.metas?.disponibilidadeMecanica || configManager.getMetas('colheita_diario').disponibilidadeMecanica),
          total: finalDataDisponibilidade.length,
          percentual: (contarItensMeta(finalDataDisponibilidade, 'disponibilidade', reportData?.metas?.disponibilidadeMecanica || configManager.getMetas('colheita_diario').disponibilidadeMecanica) / 
            (finalDataDisponibilidade.length || 1)) * 100
        }
      },
      eficienciaEnergetica: {
        data: finalDataEficiencia,
        meta: reportData?.metas?.eficienciaEnergetica || configManager.getMetas('colheita_diario').eficienciaEnergetica,
        media: calcularMedia(finalDataEficiencia, 'eficiencia'),
      acimaMeta: {
          quantidade: contarItensMeta(finalDataEficiencia, 'eficiencia', reportData?.metas?.eficienciaEnergetica || configManager.getMetas('colheita_diario').eficienciaEnergetica),
          total: finalDataEficiencia.length,
          percentual: (contarItensMeta(finalDataEficiencia, 'eficiencia', reportData?.metas?.eficienciaEnergetica || configManager.getMetas('colheita_diario').eficienciaEnergetica) / 
            (finalDataEficiencia.length || 1)) * 100
        }
      },
      horaElevador: {
        data: finalDataHorasElevador,
        meta: reportData?.metas?.horaElevador || configManager.getMetas('colheita_diario').horaElevador,
        media: calcularMedia(finalDataHorasElevador, 'horas'),
      acimaMeta: {
          quantidade: contarItensMeta(finalDataHorasElevador, 'horas', reportData?.metas?.horaElevador || configManager.getMetas('colheita_diario').horaElevador),
          total: finalDataHorasElevador.length,
          percentual: (contarItensMeta(finalDataHorasElevador, 'horas', reportData?.metas?.horaElevador || configManager.getMetas('colheita_diario').horaElevador) / 
            (finalDataHorasElevador.length || 1)) * 100
        }
      },
      motorOcioso: {
        data: finalDataMotorOcioso,
        meta: reportData?.metas?.motorOcioso || configManager.getMetas('colheita_diario').motorOcioso,
        media: calcularMedia(finalDataMotorOcioso, 'percentual'),
      acimaMeta: {
          quantidade: contarItensMeta(finalDataMotorOcioso, 'percentual', reportData?.metas?.motorOcioso || configManager.getMetas('colheita_diario').motorOcioso, false),
          total: finalDataMotorOcioso.length,
          percentual: (contarItensMeta(finalDataMotorOcioso, 'percentual', reportData?.metas?.motorOcioso || configManager.getMetas('colheita_diario').motorOcioso, false) / 
            (finalDataMotorOcioso.length || 1)) * 100
        }
      },
      usoGPS: {
        data: finalDataUsoGPS,
        meta: reportData?.metas?.usoGPS || configManager.getMetas('colheita_diario').usoGPS,
        media: calcularMedia(finalDataUsoGPS, 'porcentagem'),
      acimaMeta: {
          quantidade: contarItensMeta(finalDataUsoGPS, 'porcentagem', reportData?.metas?.usoGPS || configManager.getMetas('colheita_diario').usoGPS),
          total: finalDataUsoGPS.length,
          percentual: (contarItensMeta(finalDataUsoGPS, 'porcentagem', reportData?.metas?.usoGPS || configManager.getMetas('colheita_diario').usoGPS) / 
            (finalDataUsoGPS.length || 1)) * 100
        }
      },
      mediaVelocidade: {
        data: finalDataMediaVelocidade,
        meta: reportData?.metas?.mediaVelocidade || configManager.getMetas('colheita_diario').mediaVelocidade,
        media: calcularMedia(finalDataMediaVelocidade, 'velocidade', true),
        acimaMeta: {
          quantidade: contarItensMeta(finalDataMediaVelocidade, 'velocidade', reportData?.metas?.mediaVelocidade || configManager.getMetas('colheita_diario').mediaVelocidade, true),
          total: finalDataMediaVelocidade.length,
          percentual: ((contarItensMeta(finalDataMediaVelocidade, 'velocidade', reportData?.metas?.mediaVelocidade || configManager.getMetas('colheita_diario').mediaVelocidade, true) / 
            (finalDataMediaVelocidade.length || 1)) * 100)
        }
      },
      frotas,
      operadores
    };
  }, [
    finalData,
    reportData,
    finalDataDisponibilidade,
    finalDataEficiencia,
    finalDataHorasElevador,
    finalDataMotorOcioso,
    finalDataUsoGPS,
    configManager
  ]);

  // Adicionar log durante a renderização para verificar quais metas estão sendo passadas para os componentes
  useEffect(() => {
    // Log desativado para reduzir volume no console
    // if (resumoData) {
    //   console.log('📊 VALORES DE METAS UTILIZADAS:');
    //   console.log('- Disponibilidade Mecânica:', resumoData.disponibilidadeMecanica.meta);
    //   console.log('- Eficiência Energética:', resumoData.eficienciaEnergetica.meta);
    //   console.log('- Motor Ocioso:', resumoData.motorOcioso.meta);
    //   console.log('- Hora Elevador:', resumoData.horaElevador.meta);
    //   console.log('- Uso GPS:', resumoData.usoGPS.meta);
    // }
  }, []); // Removendo dependência para executar apenas uma vez

  // RENDERIZAÇÃO CONDICIONAL
  // Se estiver carregando, mostrar indicador de loading
  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text>Carregando dados do relatório...</Text>
      </Center>
    );
  }
  
  // RENDERIZAÇÃO PRINCIPAL
  return (
    <Box position="relative">
      {/* Página 1 - TDH e Diesel (quando selecionados) */}
      {(secoes.disponibilidadeMecanica || secoes.eficienciaEnergetica) && (
        <A4Colheita>
          <Box h="100%" display="flex" flexDirection="column" bg="white">
            <PageHeader showDate={true} />
            
            <Flex flex="1" direction="column" justify="space-between">
              {/* Disponibilidade Mecânica */}
              {secoes.disponibilidadeMecanica && (
                <Box flex="1" mb={3}>
                  <SectionTitle title="Disponibilidade Mecânica" centered={true} />
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    h="calc(100% - 25px)"
                  >
                    {finalDataDisponibilidade.length > 0 ? (
                      <GraficoDisponibilidadeMecanicaColheita 
                        data={finalDataDisponibilidade} 
                        meta={resumoData.disponibilidadeMecanica.meta} 
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
              {secoes.eficienciaEnergetica && (
                <Box flex="1">
                  <SectionTitle title="Eficiência Energética" centered={true} />
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    h="calc(100% - 25px)"
                  >
                    {finalDataEficiencia.length > 0 ? (
                      <GraficoEficienciaEnergetica 
                        data={finalDataEficiencia} 
                        meta={resumoData.eficienciaEnergetica.meta} 
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
      
      {/* Página 2 - Motor Ocioso */}
      {secoes.motorOcioso && (
        <A4Colheita>
          <Box h="100%" display="flex" flexDirection="column" bg="white">
            <PageHeader showDate={true} />
            
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
                    <GraficoMotorOciosoColheita 
                      data={finalDataMotorOcioso} 
                      meta={resumoData.motorOcioso.meta} 
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
      
      {/* Página 3 - Horas Elevador */}
      {secoes.horaElevador && (
        <A4Colheita>
          <Box h="100%" display="flex" flexDirection="column" bg="white">
            <PageHeader showDate={true} />
            
            <Flex flex="1" direction="column" justify="space-between">
              {/* Horas Elevador */}
              <Box flex="1">
                <SectionTitle title="Horas Elevador" centered={true} />
                <Box 
                  border="1px solid"
                  borderColor="black"
                  borderRadius="md"
                  p={2}
                  h="calc(100% - 25px)"
                >
                  {finalDataHorasElevador.length > 0 ? (
                    <GraficoHorasElevador 
                      data={finalDataHorasElevador} 
                      meta={resumoData.horaElevador.meta} 
                    />
                  ) : (
                    <Center h="100%">
                      <Text>Sem dados de hora elevador</Text>
                    </Center>
                  )}
                </Box>
              </Box>
            </Flex>
          </Box>
        </A4Colheita>
      )}
      
      {/* Página 4 - Uso GPS e Média de Velocidade (juntos quando ambos têm até 11 registros) */}
      {(secoes.usoGPS || secoes.mediaVelocidade) && 
       finalDataUsoGPS.length <= 11 && 
       finalDataMediaVelocidade.length <= 11 && (
        <A4Colheita>
          <Box h="100%" display="flex" flexDirection="column" bg="white">
            <PageHeader showDate={true} />
            
            <Flex flex="1" direction="column" justify="space-between">
              {/* Uso GPS */}
              {secoes.usoGPS && (
                <Box flex="1" mb={3}>
                  <SectionTitle title="Uso GPS" centered={true} />
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    h="calc(100% - 25px)"
                  >
                    {finalDataUsoGPS.length > 0 ? (
                      <GraficoUsoGPS 
                        data={finalDataUsoGPS} 
                        meta={resumoData.usoGPS.meta} 
                      />
                    ) : (
                      <Center h="100%">
                        <Text>Sem dados de uso GPS</Text>
                      </Center>
                    )}
                  </Box>
                </Box>
              )}
              
              {/* Média de Velocidade */}
              {secoes.mediaVelocidade && (
                <Box flex="1">
                  <SectionTitle title="Média de Velocidade" centered={true} />
                  <Box 
                    border="1px solid"
                    borderColor="black"
                    borderRadius="md"
                    p={2}
                    h="calc(100% - 25px)"
                  >
                    {finalDataMediaVelocidade.length > 0 ? (
                      <GraficoMediaVelocidadeColheita 
                        data={finalDataMediaVelocidade} 
                        meta={resumoData.mediaVelocidade.meta} 
                      />
                    ) : (
                      <Center h="100%">
                        <Text>Sem dados de média de velocidade</Text>
                      </Center>
                    )}
                  </Box>
                </Box>
              )}
            </Flex>
          </Box>
        </A4Colheita>
      )}
      
      {/* Página dedicada para Uso GPS quando tem mais de 11 registros */}
      {secoes.usoGPS && finalDataUsoGPS.length > 11 && (
        <A4Colheita>
          <Box h="100%" display="flex" flexDirection="column" bg="white">
            <PageHeader showDate={true} />
            <Flex flex="1" direction="column" p={2}>
              <SectionTitle title="Uso GPS" centered={true} />
              <Box 
                border="1px solid"
                borderColor="black"
                borderRadius="md"
                p={2}
                flex="1"
                h="calc(100% - 25px)"
              >
                {finalDataUsoGPS.length > 0 ? (
                  <GraficoUsoGPS 
                    data={finalDataUsoGPS} 
                    meta={resumoData.usoGPS.meta} 
                  />
                ) : (
                  <Center h="100%">
                    <Text>Sem dados de uso GPS</Text>
                  </Center>
                )}
              </Box>
            </Flex>
          </Box>
        </A4Colheita>
      )}
      
      {/* Página dedicada para Média de Velocidade quando tem mais de 11 registros */}
      {secoes.mediaVelocidade && finalDataMediaVelocidade.length > 11 && (
        <A4Colheita>
          <Box h="100%" display="flex" flexDirection="column" bg="white">
            <PageHeader showDate={true} />
            <Flex flex="1" direction="column" p={2}>
              <SectionTitle title="Média de Velocidade" centered={true} />
              <Box 
                border="1px solid"
                borderColor="black"
                borderRadius="md"
                p={2}
                flex="1"
                h="calc(100% - 25px)"
              >
                {finalDataMediaVelocidade.length > 0 ? (
                  <GraficoMediaVelocidadeColheita 
                    data={finalDataMediaVelocidade} 
                    meta={resumoData.mediaVelocidade.meta} 
                  />
                ) : (
                  <Center h="100%">
                    <Text>Sem dados de média de velocidade</Text>
                  </Center>
                )}
              </Box>
            </Flex>
          </Box>
        </A4Colheita>
      )}
      
      {/* Página de Rastros - Movida para antes do Resumo */}
      <A4Colheita>
        <Box h="100%" display="flex" flexDirection="column" bg="white">
          <PageHeader showDate={true} />
          <Flex flex="1" direction="column" justify="space-between" p={1}>
            <Box flex="1" display="flex" flexDirection="column">
              <SectionTitle title="Rastros" centered={true} />
              <Box 
                border="1px solid"
                borderColor="black"
                borderRadius="md"
                p={2}
                flex="1"
                h="calc(100%)"
                display="flex"
                flexDirection="column"
              >
                {/* Container vazio para Rastros */}
              </Box>
            </Box>
          </Flex>
        </Box>
      </A4Colheita>
      
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
              <GraficoTop5OfensoresColheita data={finalDataOfensores} />
            </Box>
          </Box>
        </Box>
      </A4Colheita>
      
      {/* Página 5 - Resumo Geral */}
      <A4Colheita 
        isLastPage={true} 
        footer={null}
      >
        <Box h="100%" display="flex" flexDirection="column" bg="white">
          <PageHeader showDate={true} />
          
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
              Resumo do Relatório de Colheita Diário
            </Heading>

            {/* Seção Frotas */}
            <Box mb={6}>
              <SectionTitle title="Frotas" centered={true} />
              
              {/* Cards de indicadores de frotas */}
              <SimpleGrid columns={2} spacing={4} mb={4}>
                {/* Garantir que os dados de disponibilidade mecânica são sempre exibidos */}
                <IndicatorCard 
                  title="Disponibilidade Mecânica"
                  value={resumoData.disponibilidadeMecanica.media || 0}
                  meta={resumoData.disponibilidadeMecanica.meta || 0}
                  unitType="porcentagem"
                  acimaMeta={resumoData.disponibilidadeMecanica.acimaMeta}
                />
              </SimpleGrid>
            </Box>

            {/* Seção Operadores */}
            <Box>
              <SectionTitle title="Operadores" centered={true} />
              
              {/* Cards de indicadores de operadores */}
              <SimpleGrid columns={2} spacing={4} mb={4}>
                {/* Mostrar os cards somente se a seção estiver visível */}
                {secoes.eficienciaEnergetica && (
                  <IndicatorCard 
                    title="Eficiência Energética"
                    value={resumoData.eficienciaEnergetica.media || 0}
                    meta={resumoData.eficienciaEnergetica.meta || 0}
                    unitType="porcentagem"
                    acimaMeta={resumoData.eficienciaEnergetica.acimaMeta}
                  />
                )}
                
                {secoes.horaElevador && (
                  <IndicatorCard 
                    title="Horas Elevador"
                    value={resumoData.horaElevador.media || 0}
                    meta={resumoData.horaElevador.meta || 0}
                    unitType="horas"
                    acimaMeta={resumoData.horaElevador.acimaMeta}
                  />
                )}
                
                {secoes.motorOcioso && (
                  <IndicatorCard 
                    title="Motor Ocioso"
                    value={resumoData.motorOcioso.media || 0}
                    meta={resumoData.motorOcioso.meta || 0}
                    isInverted={true}
                    unitType="porcentagem"
                    acimaMeta={resumoData.motorOcioso.acimaMeta}
                  />
                )}
                
                {secoes.usoGPS && (
                  <IndicatorCard 
                    title="Uso GPS"
                    value={resumoData.usoGPS.media || 0}
                    meta={resumoData.usoGPS.meta || 0}
                    unitType="porcentagem"
                    acimaMeta={resumoData.usoGPS.acimaMeta}
                  />
                )}
                
                {secoes.mediaVelocidade && (
                  <IndicatorCard
                    title="Média de Velocidade"
                    value={resumoData.mediaVelocidade.media}
                    meta={resumoData.mediaVelocidade.meta || 7}
                    unitType="velocidade"
                    acimaMeta={resumoData.mediaVelocidade.acimaMeta}
                  />
                )}
              </SimpleGrid>

              {/* Tabela de operadores */}
              <TabelaOperadores 
                dados={{
                  eficiencia_energetica: finalDataEficiencia.map(item => ({
                    id: item.id,
                    nome: item.nome,
                    eficiencia: item.eficiencia
                  })),
                  motor_ocioso: (finalDataMotorOcioso || []).map((item: MotorOciosoData) => ({
                    id: item.id || '',
                    nome: item.nome || '',
                    percentual: item.percentual || 0,
                    tempoLigado: item.tempoLigado || 0,
                    tempoOcioso: item.tempoOcioso || 0
                  })),
                  hora_elevador: finalDataHorasElevador.map(item => ({
                    id: item.id,
                    nome: item.nome,
                    horas: item.horas
                  })),
                  uso_gps: finalDataUsoGPS.map(item => ({
                    id: item.id || '',
                    nome: item.nome || '',
                    porcentagem: item.porcentagem || 0
                  })),
                  media_velocidade: (finalDataMediaVelocidade || []).map((item: MediaVelocidadeData) => ({
                    id: item.id || '',
                    nome: item.nome || '',
                    velocidade: item.velocidade || 0
                  })),
                }}
                tipo="colheita_diario"
                mostrarEficiencia={secoes.eficienciaEnergetica}
                mostrarMotorOcioso={secoes.motorOcioso}
                mostrarHoraElevador={secoes.horaElevador}
                mostrarUsoGPS={secoes.usoGPS}
                mostrarMediaVelocidade={secoes.mediaVelocidade}
                mostrarFaltaApontamento={false}
              />
            </Box>
          </Box>
        </Box>
      </A4Colheita>
    </Box>
  );
} 