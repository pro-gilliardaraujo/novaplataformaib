'use client';

import React from 'react';
import { Box, Text, Center } from '@chakra-ui/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { formatarHorasEmHorasMinutos } from '@/utils/formatters';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface OfensoresData {
  Operação: string;
  Tempo: number;
  Porcentagem: number;
}

interface GraficoTop5OfensoresProps {
  data: OfensoresData[];
  titulo?: string;
  subTitulo?: string;
  altura?: number;
  largura?: number;
  mostrarLegenda?: boolean;
  mostrarTempo?: boolean;
}

export default function GraficoTop5Ofensores({
  data,
  titulo = "Top 5 Ofensores",
  subTitulo,
  altura = 300,
  largura = 500,
  mostrarLegenda = false,
  mostrarTempo = true,
}: GraficoTop5OfensoresProps) {
  // Verificar se há dados
  if (!data || data.length === 0) {
    return (
      <Box
        width={largura}
        height={altura}
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderWidth="1px"
        borderRadius="lg"
        p={4}
      >
        <Text color="black">Sem dados para exibir</Text>
      </Box>
    );
  }

  // Limitar a 5 itens e ordenar por tempo em ordem decrescente
  const dadosProcessados = [...data]
    .sort((a, b) => b.Tempo - a.Tempo)
    .slice(0, 5);

  // Formatar operações com nomes muito longos
  const formatarOperacao = (operacao: string): string => {
    if (operacao.length > 20) {
      return operacao.substring(0, 17) + "...";
    }
    return operacao;
  };

  // Extrair dados para o gráfico
  const labels = dadosProcessados.map((item) => formatarOperacao(item.Operação));
  const tempos = dadosProcessados.map((item) => item.Tempo);

  // Configuração do gráfico
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x',
    layout: {
      padding: {
        top: 10,
        right: 25,
        bottom: 10,
        left: 25,
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 11,
          },
          color: "#000000", // Sempre preto
        },
        grid: {
          color: "#E0E0E0", // Cor clara para as linhas de grade
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 11,
          },
          color: "#000000", // Sempre preto
          // Formatar para mostrar horas com 2 casas decimais
          callback: function(value) {
            return Number(value).toFixed(2) + "h";
          },
        },
        grid: {
          color: "#E0E0E0", // Cor clara para as linhas de grade
        },
      },
    },
    plugins: {
      legend: {
        display: mostrarLegenda,
        labels: {
          color: "#000000", // Texto preto para a legenda
        },
      },
      title: {
        display: !!titulo,
        text: titulo,
        color: "#000000", // Título em preto
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      subtitle: {
        display: !!subTitulo,
        text: subTitulo,
        color: "#000000", // Subtítulo em preto
        font: {
          size: 14,
        },
        padding: {
          bottom: 10,
        },
      },
      tooltip: {
        titleColor: "#000000", // Cor do título do tooltip
        bodyColor: "#000000", // Cor do corpo do tooltip
        backgroundColor: "rgba(255, 255, 255, 0.9)", // Fundo branco com transparência
        borderColor: "#CCCCCC",
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const value = Number(context.parsed.y);
            return `${value.toFixed(2)}h`;
          },
        },
      },
    },
  };

  // Dados do gráfico
  const dataChartJS = {
    labels,
    datasets: [
      {
        label: "Tempo (horas)",
        data: tempos,
        backgroundColor: "#03428D",
        borderWidth: 1,
        borderColor: "#03428D",
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
    ],
  };

  return (
    <Box 
      width={largura} 
      height={altura} 
      position="relative"
      p={2}
    >
      <Bar options={options} data={dataChartJS} />
      {mostrarTempo && (
        <Box 
          mt={2} 
          textAlign="center"
          fontSize="sm"
          fontWeight="medium"
          color="black" // Forçar texto preto
        >
          {dadosProcessados.map((item, index) => (
            <Text key={index} mb={0.5} color="black">
              {formatarOperacao(item.Operação)}: {item.Tempo.toFixed(2)}h ({(item.Porcentagem * 100).toFixed(2)}%)
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
} 