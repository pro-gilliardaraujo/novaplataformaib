import React from 'react';
import { Box, Text, VStack, Flex, HStack, Tooltip } from '@chakra-ui/react';
import { configManager } from '@/utils/config';

interface DadosVelocidade {
  operador: string;
  velocidadeVazio: number;
  velocidadeCarregado: number;
}

interface Props {
  dados: DadosVelocidade[];
  metaVazio?: number;
  metaCarregado?: number;
}

// Valores padrão para cores e tolerâncias
const DEFAULT_COLORS = {
  meta_atingida: '#48BB78',
  proximo_meta: '#90EE90',
  alerta: '#ECC94B',
  critico: '#E53E3E',
  vazio: '#3182CE',
  carregado: '#805AD5'
};

const DEFAULT_TOLERANCES = {
  proximo_meta: 5,
  alerta: 15
};

export const GraficoMediaVelocidadeVazioCarregado: React.FC<Props> = ({ 
  dados = [],
  metaVazio = configManager.getMetas('transbordo_semanal').mediaVelocidadeVazio || 14,
  metaCarregado = configManager.getMetas('transbordo_semanal').mediaVelocidadeCarregado || 8
}) => {
  // Obter configurações de cores e tolerâncias com fallback para valores padrão
  const cores = configManager.getConfig()?.graficos?.cores || DEFAULT_COLORS;
  
  // Fixando a escala máxima em 20 km/h
  const escalaMaxima = 20;

  // Ordenar dados por operador em ordem alfabética
  const dadosOrdenados = [...dados]
    .filter(item => item && typeof item.velocidadeVazio === 'number' && typeof item.velocidadeCarregado === 'number')
    .sort((a, b) => a.operador.localeCompare(b.operador));

  // Se não houver dados válidos, mostrar mensagem
  if (dadosOrdenados.length === 0) {
    return (
      <Box h="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="gray.500">Sem dados disponíveis</Text>
      </Box>
    );
  }

  // Função para determinar a cor da barra
  const getBarColor = (velocidade: number, tipo: 'vazio' | 'carregado') => {
    const meta = tipo === 'vazio' ? metaVazio : metaCarregado;
    // Para velocidade, considera-se abaixo da meta como bom (verde)
    if (velocidade <= meta) {
      return cores.meta_atingida;
    } else if (velocidade <= meta * 1.2) {
      return cores.alerta;
    }
    return cores.critico;
  };

  return (
    <Box h="100%">
      {/* Legenda */}
      <Flex justifyContent="space-between" mb={2} px={2} fontSize="xs">
        <HStack spacing={4}>
          <HStack>
            <Box w="10px" h="10px" borderRadius="sm" bg={cores.vazio || '#3182CE'} />
            <Text>Vazio</Text>
          </HStack>
          <HStack>
            <Box w="10px" h="10px" borderRadius="sm" bg={cores.carregado || '#805AD5'} />
            <Text>Carregado</Text>
          </HStack>
        </HStack>
        <HStack spacing={2}>
          <Box w="2px" h="10px" bg="black" />
          <Text>Meta</Text>
        </HStack>
      </Flex>
      
      {/* Gráfico */}
      <Box h="calc(100% - 30px)" overflowY="auto">
        <VStack spacing={0} align="stretch">
          {dadosOrdenados.map((item, index) => {
            const vazioFormatado = `${item.velocidadeVazio.toFixed(1)} km/h`;
            const carregadoFormatado = `${item.velocidadeCarregado.toFixed(1)} km/h`;
            const porcentagemBarraVazio = (item.velocidadeVazio / escalaMaxima) * 100;
            const porcentagemBarraCarregado = (item.velocidadeCarregado / escalaMaxima) * 100;
            const porcentagemMetaVazio = (metaVazio / escalaMaxima) * 100;
            const porcentagemMetaCarregado = (metaCarregado / escalaMaxima) * 100;
            
            const corBarraVazio = getBarColor(item.velocidadeVazio, 'vazio');
            const corBarraCarregado = getBarColor(item.velocidadeCarregado, 'carregado');
            
            return (
              <Box 
                key={index}
                py={1.5}
                px={2}
                bg={index % 2 === 0 ? "gray.50" : "white"}
                borderRadius="sm"
              >
                <Text fontSize="11px" fontWeight="medium" noOfLines={1} title={item.operador} mb={1} color="black">
                  {item.operador}
                </Text>
                
                {/* Barra Velocidade Vazio */}
                <Flex direction="row" align="center" mb={1}>
                  <Text fontSize="10px" color="gray.600" w="45px">Vazio:</Text>
                  <Box flex="1" h="12px" position="relative" mr={2} maxW="calc(100% - 105px)">
                    <Box 
                      position="absolute" 
                      bg={cores.vazio || '#3182CE'}
                      h="100%" 
                      w={`${porcentagemBarraVazio}%`}
                      borderRadius="sm"
                    />
                    <Box 
                      position="absolute" 
                      top="0" 
                      left={`${porcentagemMetaVazio}%`} 
                      h="12px"
                      w="2px"
                      bg="rgba(0,0,0,0.7)"
                      zIndex="2"
                    />
                  </Box>
                  <Text 
                    fontSize="10px" 
                    fontWeight="bold" 
                    w="60px" 
                    textAlign="right" 
                    color={corBarraVazio}
                  >
                    {vazioFormatado}
                  </Text>
                </Flex>
                
                {/* Barra Velocidade Carregado */}
                <Flex direction="row" align="center">
                  <Text fontSize="10px" color="gray.600" w="45px">Carregado:</Text>
                  <Box flex="1" h="12px" position="relative" mr={2} maxW="calc(100% - 105px)">
                    <Box 
                      position="absolute" 
                      bg={cores.carregado || '#805AD5'}
                      h="100%" 
                      w={`${porcentagemBarraCarregado}%`}
                      borderRadius="sm"
                    />
                    <Box 
                      position="absolute" 
                      top="0" 
                      left={`${porcentagemMetaCarregado}%`} 
                      h="12px"
                      w="2px"
                      bg="rgba(0,0,0,0.7)"
                      zIndex="2"
                    />
                  </Box>
                  <Text 
                    fontSize="10px" 
                    fontWeight="bold" 
                    w="60px" 
                    textAlign="right" 
                    color={corBarraCarregado}
                  >
                    {carregadoFormatado}
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

export default GraficoMediaVelocidadeVazioCarregado; 