import React from 'react';
import { Box, Text, Flex, VStack, Center } from '@chakra-ui/react';
import { configManager } from '@/utils/config';
import { limparIdOperador } from '@/utils/formatters';

interface DieselData {
  frota: string;
  diesel: number;
}

interface GraficoDieselTransbordoProps {
  data: DieselData[];
  meta?: number;
  inverterMeta?: boolean;
  exibirCards?: boolean;
}

// Valores padrão para cores e tolerâncias
const DEFAULT_COLORS = {
  meta_atingida: '#48BB78',
  proximo_meta: '#90EE90',
  alerta: '#ECC94B',
  critico: '#E53E3E'
};

const DEFAULT_TOLERANCES = {
  proximo_meta: 5,
  alerta: 15
};

// Valores padrão para formatação
const DEFAULT_FORMATTING = {
  decimal: {
    casas: 2,
    separador: "."
  },
  porcentagem: {
    casas: 1,
    separador: "."
  }
};

export const GraficoDieselTransbordo: React.FC<GraficoDieselTransbordoProps> = ({ 
  data = [],
  meta = configManager.getMetas('transbordo_diario').diesel || 12,
  inverterMeta = false,  // Para diesel, inverter meta = false (menor é melhor)
  exibirCards = false
}) => {
  // Obter configurações de cores e tolerâncias com fallback para valores padrão
  const cores = configManager.getConfig()?.graficos?.cores || DEFAULT_COLORS;
  const tolerancias = configManager.getConfig()?.graficos?.tolerancias || DEFAULT_TOLERANCES;
  const formatacao = configManager.getConfig()?.graficos?.formatacao || DEFAULT_FORMATTING;

  // Se não tiver dados, mostrar mensagem
  if (!data || data.length === 0) {
    return (
      <Center h="100%" flexDirection="column">
        <Text fontSize="14px" color="gray.500" fontWeight="medium">Sem dados disponíveis</Text>
        <Text fontSize="12px" color="gray.400">Verifique o relatório selecionado</Text>
      </Center>
    );
  }

  // Escala fixa para diesel (L/h)
  const ESCALA_MAXIMA = 20; 
  const META_DIESEL = meta || 12; // Garante que temos um valor de meta
  
  // Ordena por consumo de diesel (do menor para o maior)
  const sortedData = [...data].sort((a, b) => a.diesel - b.diesel);
  
  // Define as cores com base no valor
  const getBarColor = (value: number) => {
    // Para diesel, menor é melhor
    if (!inverterMeta && value <= META_DIESEL) return cores.meta_atingida;
    if (inverterMeta && value >= META_DIESEL) return cores.meta_atingida;
    
    const diferenca = Math.abs(((value - META_DIESEL) / META_DIESEL) * 100);
    if (diferenca <= tolerancias.proximo_meta) return cores.proximo_meta;
    if (diferenca <= tolerancias.alerta) return cores.alerta;
    return cores.critico;
  };

  // Calcula a largura da barra baseada na escala fixa
  const getBarWidth = (value: number) => {
    const width = (value / ESCALA_MAXIMA) * 100;
    return `${Math.min(width, 100)}%`; // Limita a 100%
  };

  // Calcula a posição da meta 
  const metaPosition = `${(META_DIESEL / ESCALA_MAXIMA) * 100}%`;

  return (
    <Box h="100%">
      <Box h="100%" overflowY="auto">
        <VStack spacing={0} align="stretch">
          {sortedData.map((item, index) => {
            const frotaFormatada = limparIdOperador(item.frota);
            const barColor = getBarColor(item.diesel);
            
            return (
              <Box 
                key={index}
                py={0.5}
                px={1}
                bg={index % 2 === 0 ? "gray.50" : "white"}
                borderRadius="sm"
                position="relative"
              >
                <Text 
                  fontSize="10px" 
                  fontWeight="medium" 
                  noOfLines={1} 
                  title={frotaFormatada} 
                  mb={0.5}
                  color="black"
                >
                  {frotaFormatada}
                </Text>
                
                <Flex direction="row" align="center">
                  <Box flex="1" h="10px" position="relative" mr={2} maxW="calc(100% - 65px)">
                    {/* Barra de fundo */}
                    <Box 
                      position="absolute"
                      top="0"
                      left="0"
                      right="0"
                      h="100%" 
                      bg="gray.100"
                      borderRadius="sm"
                    />
                    
                    {/* Barra de progresso */}
                    <Box 
                      position="absolute"
                      top="0"
                      left="0"
                      h="100%" 
                      w={getBarWidth(item.diesel)}
                      bg={barColor}
                      borderRadius="sm"
                    />
                    
                    {/* Linha de meta */}
                    <Box 
                      position="absolute" 
                      top="-2px" 
                      left={metaPosition}
                      h="14px"
                      w="2px"
                      bg="rgba(0,0,0,0.7)"
                      zIndex="2"
                    />
                  </Box>
                  
                  <Text 
                    fontSize="10px" 
                    fontWeight="bold" 
                    w="65px" 
                    textAlign="right" 
                    color={barColor}
                    whiteSpace="nowrap"
                    flexShrink={0}
                  >
                    {item.diesel.toFixed(1)} L/h
                  </Text>
                </Flex>
              </Box>
            );
          })}
        </VStack>
      </Box>
    </Box>
  );
};

export default GraficoDieselTransbordo; 