import { Box, Text, Flex, VStack } from '@chakra-ui/react';
import { configManager } from '@/utils/config';

// Valores padrão para cores e tolerâncias
const DEFAULT_COLORS = {
  meta_atingida: '#48BB78',
  proximo_meta: '#98FB98',
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
    casas: 4,
    separador: "."
  },
  porcentagem: {
    casas: 2,
    separador: "."
  },
  horas: {
    formato: "Xh00m"
  }
};

interface IndicatorCardProps {
  title: string;
  value: number;
  meta: number;
  unit?: string;
  unitType?: string;
  isInverted?: boolean;
  acimaMeta?: {
    quantidade: number;
    total: number;
    percentual: number;
  };
  operadoresAcimaMeta?: number;
  totalOperadores?: number;
  showMetaOnTop?: boolean;
  showSummaryOnBottom?: boolean;
  formatValue?: (value: number) => string;
  showSuffix?: string;
}

export default function IndicatorCard({ 
  title, 
  value, 
  meta, 
  isInverted = false,
  unitType = 'porcentagem',
  acimaMeta,
  showMetaOnTop = false,
  showSummaryOnBottom = false,
  formatValue: customFormatValue,
  showSuffix
}: IndicatorCardProps) {
  // Obter configurações de cores e tolerâncias com fallback para valores padrão
  const cores = configManager.getConfig()?.graficos?.cores || DEFAULT_COLORS;
  const tolerancias = configManager.getConfig()?.graficos?.tolerancias || DEFAULT_TOLERANCES;
  const formatacao = configManager.getConfig()?.graficos?.formatacao || DEFAULT_FORMATTING;
  const diferencas = configManager.getConfig()?.graficos?.diferencas_meta || {
    normal: {
      meta_atingida: ">=",
      proximo_meta: -5,
      alerta: -15,
      critico: "<-15"
    },
    invertido: {
      meta_atingida: "<=",
      proximo_meta: 5,
      alerta: 15,
      critico: ">15"
    }
  };

  // Determinar se está dentro da meta
  const isWithinTarget = unitType === 'velocidade' ? 
    value <= meta : // Para velocidade, menor é melhor
    (isInverted ? value <= meta : value >= meta); // Para outros tipos

  // Determinar a cor baseada na diferença percentual
  const getValueColor = () => {
    // Para velocidade, usamos a lógica específica (valores menores são melhores)
    if (unitType === 'velocidade') {
      // Velocidade até a meta é boa (verde)
      if (value <= meta) return cores.meta_atingida;
      // Até 20% acima da meta é alerta (amarelo)
      if (value <= meta * 1.2) return cores.alerta;
      // Acima disso é crítico (vermelho)
      return cores.critico;
    }
    
    // Lógica para os outros tipos de métricas
    const diferenca = ((value - meta) / meta) * 100;
    const diferencaAbs = Math.abs(diferenca);
    const config = isInverted ? diferencas.invertido : diferencas.normal;

    if (isInverted) {
      if (value <= meta) return cores.meta_atingida;
      if (diferenca <= config.proximo_meta) return cores.proximo_meta;
      if (diferenca <= config.alerta) return cores.alerta;
      return cores.critico;
    } else {
      if (value >= meta) return cores.meta_atingida;
      if (diferencaAbs <= config.proximo_meta) return cores.proximo_meta;
      if (diferencaAbs <= config.alerta) return cores.alerta;
      return cores.critico;
    }
  };

  // Texto de atingimento da meta
  const metaText = acimaMeta ? 
    unitType === 'velocidade' ?
      `${acimaMeta.quantidade} de ${acimaMeta.total} abaixo da meta (${acimaMeta.percentual.toFixed(1)}%)` :
      `${acimaMeta.quantidade} de ${acimaMeta.total} atingiram a meta (${acimaMeta.percentual.toFixed(1)}%)` : 
    null;

  // Formatar valor de acordo com o tipo de unidade (preservando precisão)
  const formatValue = (value: number, unitType?: string, customFormat?: (value: number) => string) => {
    if (customFormat) {
      return customFormat(value);
    }

    let formattedValue = '';
    
    switch (unitType) {
      case 'horas':
        // Formato padronizado para horas (mesmo da meta)
        const hours = Math.floor(value);
        const minutes = Math.round((value - hours) * 60);
        formattedValue = `${hours}h${minutes.toString().padStart(2, '0')}`;
        break;
      case 'porcentagem':
        formattedValue = `${value.toFixed(1)}%`;
        break;
      case 'velocidade':
        formattedValue = `${value.toFixed(2)} km/h`;
        break;
      case 'tdh':
      case 'diesel':
        formattedValue = value.toFixed(4);
        break;
      case 'decimal':
      default:
        formattedValue = value.toFixed(2);
        break;
    }
    
    // Adicionar sufixo personalizado se fornecido
    if (showSuffix && unitType !== 'porcentagem') {
      formattedValue = `${formattedValue} ${showSuffix}`;
    }
    
    return formattedValue;
  };

  // Formatar meta de acordo com o tipo de unidade (preservando precisão)
  const formatMeta = (val: number): string => {
    // Garantir valor válido
    if (val === undefined || val === null || isNaN(val)) {
      console.warn(`⚠️ Meta inválida passada para IndicatorCard '${title}':`, val);
      val = 0;
    }
    
    let formattedMeta = '';
    
    if (unitType === 'porcentagem') {
      // Formatação para porcentagem com 2 casas decimais sem arredondamento
      const valueStr = String(val);
      const decimalIndex = valueStr.indexOf('.');
      
      if (decimalIndex === -1) {
        // Sem casa decimal, adicionar .0%
        formattedMeta = `${valueStr}.0%`;
      } else {
        const integerPart = valueStr.substring(0, decimalIndex);
        const decimalPart = valueStr.substring(decimalIndex + 1);
        
        // Se tem mais que 2 casas decimais, truncar para 2 (sem arredondamento)
        if (decimalPart.length >= 2) {
          formattedMeta = `${integerPart}.${decimalPart.substring(0, 2)}%`;
        } 
        // Se tem menos que 2 casas, completar com zeros
        else {
          formattedMeta = `${integerPart}.${decimalPart}${'0'.repeat(2 - decimalPart.length)}%`;
        }
      }
    } else if (unitType === 'velocidade') {
      formattedMeta = `${val.toFixed(2)} km/h`;
    } else if (unitType === 'horas') {
      const hours = Math.floor(val);
      const minutes = Math.round((val - hours) * 60);
      formattedMeta = `${hours}h${minutes.toString().padStart(2, '0')}`;
    } else if (unitType === 'tdh' || unitType === 'diesel') {
      // Formatação para TDH/Diesel com 4 casas decimais
      formattedMeta = formatDecimal(val, 4);
    } else if (unitType === 'decimal') {
      // Para impureza vegetal e outros valores decimais, usar apenas 2 casas decimais
      formattedMeta = formatDecimal(val, 2);
    } else {
      // Caso não seja nenhum dos tipos específicos, usar formato de 2 casas decimais como padrão
      formattedMeta = formatDecimal(val, 2);
    }
    
    // Adicionar sufixo personalizado se fornecido
    if (showSuffix && unitType !== 'porcentagem') {
      formattedMeta = `${formattedMeta} ${showSuffix}`;
    }
    
    return formattedMeta;
  };

  // Função auxiliar para formatar decimal com número específico de casas
  function formatDecimal(value: number, casas: number): string {
    const valueStr = String(value);
    const decimalIndex = valueStr.indexOf('.');
    
    if (decimalIndex === -1) {
      // Sem casa decimal, adicionar casas decimais
      return `${valueStr}.${'0'.repeat(casas)}`;
    } else {
      const integerPart = valueStr.substring(0, decimalIndex);
      const decimalPart = valueStr.substring(decimalIndex + 1);
      
      // Se tem mais casas decimais que o necessário, truncar
      if (decimalPart.length >= casas) {
        return `${integerPart}.${decimalPart.substring(0, casas)}`;
      } 
      // Se tem menos casas, completar com zeros
      else {
        return `${integerPart}.${decimalPart}${'0'.repeat(casas - decimalPart.length)}`;
      }
    }
  }

  // Componente de Meta e Média para reutilização
  const MetaValueDisplay = () => (
    <Flex direction="row" align="center" justify="space-between" width="100%">
      <VStack spacing={0} align="center">
        <Text fontSize="sm" fontWeight="bold" color={cores.meta_atingida}>{formatMeta(meta)}</Text>
        <Text fontSize="10px" color="#3182CE">Meta</Text>
      </VStack>
      <VStack spacing={0} align="center">
        <Text fontSize="sm" fontWeight="bold" color={getValueColor()}>
          {formatValue(value, unitType, customFormatValue)}
        </Text>
        <Text fontSize="10px" color="#3182CE">Média</Text>
      </VStack>
    </Flex>
  );

  // Componente do texto de summary
  const SummaryText = () => (
    metaText ? (
      <Text 
        fontSize="xs" 
        color={isWithinTarget ? cores.meta_atingida : cores.critico} 
        textAlign="center"
        fontWeight="bold"
        mx={2}
        mt={1}
        mb={1}
        w="100%"
        lineHeight="1.2"
      >
        {metaText}
      </Text>
    ) : null
  );

  // Layout padrão (meta e média lado a lado, texto no meio)
  if (!showMetaOnTop && !showSummaryOnBottom) {
    return (
      <Box borderWidth="1px" borderColor="black" borderRadius="md" p={3} bg="white">
        <Text fontSize="sm" fontWeight="bold" mb={1} color="black" textAlign="center" w="100%">{title}</Text>
        <Flex direction="row" align="center" justify="space-between">
          <VStack spacing={0} align="center">
            <Text fontSize="sm" fontWeight="bold" color={cores.meta_atingida}>{formatMeta(meta)}</Text>
            <Text fontSize="10px" color="#3182CE">Meta</Text>
          </VStack>
          {metaText && (
            <Text 
              fontSize="xs" 
              color={isWithinTarget ? cores.meta_atingida : cores.critico} 
              textAlign="center"
              mx={2}
              flex={1}
            >
              {metaText}
            </Text>
          )}
          <VStack spacing={0} align="center">
            <Text fontSize="sm" fontWeight="bold" color={getValueColor()}>
              {formatValue(value, unitType, customFormatValue)}
            </Text>
            <Text fontSize="10px" color="#3182CE">Média</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }
  
  // Layout com meta/média no topo e texto embaixo (conforme exemplo)
  return (
    <Box borderWidth="1px" borderColor="black" borderRadius="md" p={2} bg="white" h="110px" display="flex" flexDirection="column">
      <Text fontSize="sm" fontWeight="bold" mb={1} color="black" textAlign="center" w="100%">{title}</Text>
      <Flex direction="column" align="center" justify="flex-start" width="100%" flex="1">
        <MetaValueDisplay />
        <SummaryText />
      </Flex>
    </Box>
  );
} 
