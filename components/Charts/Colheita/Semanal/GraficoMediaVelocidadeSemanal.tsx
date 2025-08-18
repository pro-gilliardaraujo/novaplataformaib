import React from 'react';
import { Box, Text, VStack, HStack, Progress, Flex } from '@chakra-ui/react';
import { configManager } from '@/utils/config';
import { formatarFrota } from '@/utils/formatters';

interface DadosVelocidade {
  operador: string;
  velocidade: number;
}

interface Props {
  dados: DadosVelocidade[];
  meta?: number;
}

// Obter a meta do configManager com base no tipo
const getMeta = (tipo: 'colheita' | 'transbordo'): number => {
  return tipo === 'colheita' 
    ? configManager.getMetas('colheita_semanal').mediaVelocidade || 7
    : configManager.getMetas('transbordo_semanal').mediaVelocidade || 15;
};

// Dados de exemplo para o caso de não serem fornecidos
const defaultData: DadosVelocidade[] = [
  { operador: 'Frota 7041', velocidade: 6.8 },
  { operador: 'Frota 7042', velocidade: 6.2 }
];

export const GraficoMediaVelocidadeSemanal: React.FC<Props> = ({ dados = [], meta = 7 }) => {
  // Verificar se os dados são válidos ou usar dados de exemplo
  const dadosValidos = dados.length > 0 && dados.some(d => d.velocidade > 0)
    ? dados
    : defaultData;
    
  // Ordenar dados por velocidade em ordem decrescente
  const dadosOrdenados = [...dadosValidos].sort((a, b) => b.velocidade - a.velocidade);

  // Encontrar a maior velocidade para calcular a escala
  const maiorVelocidade = Math.max(...dadosValidos.map(d => d.velocidade), meta);
  const escalaMaxima = Math.max(30, maiorVelocidade * 1.2); // Garante que a escala seja no mínimo 30 km/h

  // Log para debug
  console.log('📊 GraficoMediaVelocidadeSemanal dados:', dadosValidos);
  console.log('📊 Meta velocidade:', meta);
  console.log('📊 Escala máxima:', escalaMaxima);

  return (
    <VStack w="100%" spacing={2} align="stretch">
      {dadosOrdenados.map((item, index) => {
        const porcentagemMeta = (item.velocidade / meta) * 100;
        const porcentagemBarra = (item.velocidade / escalaMaxima) * 100;
        const porcentagemMetaBarra = (meta / escalaMaxima) * 100;

        let corBarra = 'yellow.400';
        if (item.velocidade >= meta * 1.2) {
          corBarra = 'red.500';
        } else if (item.velocidade >= meta * 0.8 && item.velocidade <= meta * 1.2) {
          corBarra = 'green.500';
        }

        return (
          <Box key={index} position="relative" w="100%">
            <HStack spacing={2} mb={1}>
              <Text w="120px" fontSize="sm" isTruncated title={item.operador}>
                {item.operador}
              </Text>
              <Box flex={1} position="relative">
                <Progress
                  value={porcentagemBarra}
                  size="sm"
                  bg="gray.200"
                  sx={{
                    '& > div': {
                      background: corBarra,
                    },
                  }}
                />
                <Box
                  position="absolute"
                  top={0}
                  bottom={0}
                  left={`${porcentagemMetaBarra}%`}
                  width="2px"
                  bg="black"
                  zIndex={2}
                />
              </Box>
              <Text w="40px" fontSize="sm" textAlign="right">
                {item.velocidade.toFixed(2)}
              </Text>
            </HStack>
          </Box>
        );
      })}
    </VStack>
  );
};

export default GraficoMediaVelocidadeSemanal; 