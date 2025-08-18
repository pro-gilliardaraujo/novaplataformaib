import React from 'react';
import { Box, Text, Flex } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProducaoData {
  data: string;
  valor: number;
  frota: string;
}

interface GraficoProducaoProps {
  data: ProducaoData[];
}

export const GraficoProducao: React.FC<GraficoProducaoProps> = ({ data }) => {
  // Se não houver dados, mostrar mensagem
  if (!data || data.length === 0) {
    return (
      <Flex w="100%" h="100%" justify="center" align="center">
        <Text color="gray.500">Sem dados de produção disponíveis</Text>
      </Flex>
    );
  }

  // Processar os dados para o gráfico
  const chartData = data.map(item => ({
    data: item.data,
    valor: typeof item.valor === 'number' ? item.valor : 0,
    frota: item.frota || 'Desconhecido'
  }));

  return (
    <Box w="100%" h="100%">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="data" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="valor" name="Produção" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}; 