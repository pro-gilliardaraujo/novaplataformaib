import React from 'react';
import { Box, Text, Flex, VStack, Center } from '@chakra-ui/react';
import { configManager } from '@/utils/config';
import { limparIdOperador, formatarExibicaoOperador } from '@/utils/formatters';
import { formatarHorasEmHorasMinutos } from '@/utils/formatters';

interface MotorOciosoData {
  id: string;
  nome: string;
  percentual: number;
  tempoTotal?: number; // Tempo total em horas
  tempoOcioso?: number; // Tempo ocioso em horas
}

interface MotorOciosoSemanalProps {
  data: MotorOciosoData[];
  meta?: number;
}

// Valores padrão para cores e tolerâncias
const DEFAULT_COLORS = {
  meta_atingida: '#48BB78', // Verde
  proximo_meta: '#90EE90', // Verde claro
  alerta: '#ECC94B', // Amarelo
  critico: '#E53E3E' // Vermelho
};

const DEFAULT_TOLERANCES = {
  proximo_meta: 5,
  alerta: 15
};

// Valores padrão para formatação
const DEFAULT_FORMATTING = {
  decimal: {
    casas: 1,
    separador: "."
  },
  porcentagem: {
    casas: 1,
    separador: "."
  }
};

// Dados de exemplo para o caso de não serem fornecidos
const defaultData: MotorOciosoData[] = [
  { id: '1', nome: 'SEM OPERADOR', percentual: 12.5, tempoTotal: 10, tempoOcioso: 1.25 },
  { id: '1292073', nome: 'RENATO SOUZA SANTOS LIMA', percentual: 8.7, tempoTotal: 20, tempoOcioso: 1.74 }
];

export const GraficoMotorOciosoSemanal: React.FC<MotorOciosoSemanalProps> = ({ 
  data = [],
  meta = configManager.getMetas('colheita_semanal').motorOcioso
}) => {
  // Obter configurações com fallback para valores padrão
  const config = configManager.getConfig();
  const cores = config?.graficos?.cores || DEFAULT_COLORS;
  const tolerancias = config?.graficos?.tolerancias || DEFAULT_TOLERANCES;
  const formatacao = config?.graficos?.formatacao || DEFAULT_FORMATTING;
  
  // Filtrar dados inválidos e operadores especiais
  const dadosFinais = data.filter(item => 
    item && 
    item.nome && 
    !['TROCA DE TURNO', 'SEM OPERADOR'].includes(item.nome)
  );

  // Processar os dados para incluir tempo total e ocioso
  const dadosProcessados = dadosFinais.map(item => {
    // Usar os valores originais sem substituir por valores fixos
    const tempoTotal = item.tempoTotal || 0;
    const tempoOcioso = item.tempoOcioso || 0;
    
    return {
      ...item,
      tempoTotal: tempoTotal,
      tempoOcioso: tempoOcioso
    };
  });

  // Ordena por percentual (do menor para o maior, pois menor é melhor)
  const sortedData = [...dadosProcessados].sort((a, b) => a.percentual - b.percentual);
  
  // Define as cores com base no valor (menor melhor)
  const getBarColor = (value: number) => {
    if (value <= meta) return cores.meta_atingida;
    if (value <= meta * 1.5) return cores.proximo_meta;
    if (value <= meta * 2) return cores.alerta;
    return cores.critico;
  };

  // Formatar horas para exibição
  const formatHoras = (horas: number): string => {
    return formatarHorasEmHorasMinutos(horas);
  };

  // Se não tiver dados, mostrar mensagem
  if (data.length === 0) {
    return (
      <Center h="100%" flexDirection="column">
        <Text fontSize="14px" color="gray.500" fontWeight="medium">Sem dados disponíveis</Text>
        <Text fontSize="12px" color="gray.400">Verifique o relatório selecionado</Text>
      </Center>
    );
  }

  return (
    <Box>
      <VStack spacing={2} align="stretch" w="100%">
        {/* Título do gráfico */}
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          Motor Ocioso por Operador
        </Text>

        {/* Container do gráfico */}
        <Box>
          {sortedData.map((item, index) => {
            // Limpar e formattar nome do operador
            const idLimpo = limparIdOperador(item.id);
            const nomeOperador = formatarExibicaoOperador(idLimpo, item.nome);
            
            // Calcular valores para exibição
            const percentual = item.percentual;
            const metaEmHoras = (meta / 100) * (item.tempoTotal || 0);
            const metaEmHorasFormatado = formatHoras(metaEmHoras);
            
            return (
              <Box 
                key={item.id || index}
                p={2}
                bg={index % 2 === 0 ? 'gray.50' : 'white'}
                borderRadius="md"
              >
                <Flex align="center" justify="space-between">
                  {/* Nome do operador */}
                  <Text fontSize="10px" fontWeight="medium" minW="120px" maxW="120px" isTruncated>
                    {nomeOperador}
                  </Text>
                  
                  {/* Grupo de Tempo Ocioso à esquerda */}
                  <Flex direction="column" align="center" minW="65px">
                    <Text fontSize="9px" color={cores.critico} fontWeight="medium">
                      {formatHoras(item.tempoOcioso || 0)}
                    </Text>
                    <Text fontSize="8px" color={cores.critico}>Tempo Ocioso</Text>
                  </Flex>
                  
                  {/* Barra de progresso */}
                  <Box flex="1" h="16px" position="relative" mx={2}>
                    {/* Barra de fundo total (verde) */}
                    <Flex 
                      w="100%" 
                      h="100%" 
                      bg={cores.meta_atingida}
                      borderRadius="md"
                      overflow="hidden"
                      border="1px solid"
                      borderColor="gray.200"
                    >
                      {/* Barra de tempo ocioso sobreposta (vermelha) */}
                      <Box 
                        h="100%" 
                        w={`${percentual}%`} 
                        bg={cores.critico}
                        borderRadius="md 0 0 md"
                      />
                    </Flex>
                    
                    {/* Linha vertical indicando a meta */}
                    <Box 
                      position="absolute" 
                      top="0" 
                      left={`${meta}%`} 
                      h="16px"
                      w="2px"
                      bg="rgba(0,0,0,0.7)"
                      zIndex="2"
                      title={`Meta: ${meta}% (${metaEmHorasFormatado}h)`}
                    />
                  </Box>
                  
                  {/* Grupo de Tempo Ligado à direita */}
                  <Flex direction="column" align="center" minW="55px">
                    <Text fontSize="9px" color={cores.meta_atingida} fontWeight="medium">
                      {formatHoras(item.tempoTotal || 0)}
                    </Text>
                    <Text fontSize="8px" color={cores.meta_atingida}>Tempo Ligado</Text>
                  </Flex>
                  
                  {/* Percentual */}
                  <Text fontSize="10px" fontWeight="medium" minW="45px" textAlign="right">
                    {percentual.toFixed(formatacao.porcentagem.casas)}%
                  </Text>
                </Flex>
              </Box>
            );
          })}
        </Box>
      </VStack>
    </Box>
  );
};

export default GraficoMotorOciosoSemanal; 