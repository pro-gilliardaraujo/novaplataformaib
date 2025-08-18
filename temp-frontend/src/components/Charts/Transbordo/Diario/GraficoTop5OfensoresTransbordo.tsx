import React from 'react';
import { Box, Text, Center, Flex, VStack, Tooltip } from '@chakra-ui/react';

interface OfensorData {
  Operacao: string;   // Formato: "8040 - MANUTENÇÃO CORRETIVA"
  Tempo: number;      // Formato: 11.84 (horas)
  Porcentagem: string; // Formato: "46,18%"
}

interface GraficoTop5OfensoresTransbordoProps {
  data?: OfensorData[];
}

export const GraficoTop5OfensoresTransbordo: React.FC<GraficoTop5OfensoresTransbordoProps> = ({ data }) => {
  // Dados mockup para o gráfico
  const mockupData = [
    { Operacao: '9020 - MANUTENÇÃO MECÂNICA', Tempo: 18.09, Porcentagem: '25,41%' },
    { Operacao: '8260 - AGUARDANDO COLHEDORA', Tempo: 12.81, Porcentagem: '17,99%' },
    { Operacao: '8310 - SEM OPERADOR', Tempo: 11.69, Porcentagem: '16,42%' },
    { Operacao: '8340 - FALTA DE APONTAMENTO', Tempo: 5.97, Porcentagem: '8,38%' },
    { Operacao: '8040 - MANUTENÇÃO CORRETIVA', Tempo: 5.86, Porcentagem: '8,22%' },
  ];

  // Função para remover o código da operação (ex: "8040 - ")
  const removerCodigoOperacao = (operacao: string): string => {
    // Verificar se operacao é undefined ou null
    if (!operacao) return '';
    
    // Verifica se a operação segue o padrão XXXX - TEXTO
    const match = operacao.match(/^\d+\s*-\s*(.+)$/);
    return match ? match[1].trim() : operacao;
  };

  // Função para converter string percentual para número
  const converterPercentualParaNumero = (percentual: string): number => {
    // Remover o símbolo % e substituir vírgula por ponto
    return parseFloat(percentual.replace('%', '').replace(',', '.'));
  };

  // Converter e processar os dados recebidos
  const processarDados = (dadosOriginais: OfensorData[]) => {
    return dadosOriginais.map(item => ({
      operacao: item.Operacao,
      operacaoSemCodigo: removerCodigoOperacao(item.Operacao),
      percentual: typeof item.Porcentagem === 'string' 
        ? converterPercentualParaNumero(item.Porcentagem) 
        : item.Porcentagem,
      duracao: Math.round(item.Tempo * 60) // Convertendo horas para minutos
    })).sort((a, b) => b.percentual - a.percentual).slice(0, 5); // Top 5 ordenados por percentual
  };

  // Usar dados reais se fornecidos, caso contrário usar mockup
  const dadosProcessados = data && data.length > 0 
    ? processarDados(data) 
    : processarDados(mockupData);

  // Calcular o valor máximo para fazer as barras proporcionais
  const maxPercentual = Math.max(...dadosProcessados.map(item => item.percentual));
  
  // Altura máxima desejada para a barra com maior valor (em pixels)
  const alturaMaxima = 320;
  
  // Função para formatar minutos em formato hora/minuto
  const formatarDuracao = (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h${mins.toString().padStart(2, '0')}m`;
  };
  
  // Função para truncar texto preservando pelo menos duas palavras
  const truncarTexto = (texto: string, maxLength: number = 30) => {
    if (!texto) return '';
    
    const textoUpper = texto.toUpperCase();
    
    if (textoUpper.length <= maxLength) return textoUpper;
    
    // Dividir o texto em palavras
    const palavras = textoUpper.split(' ');
    
    // Garantir que pelo menos as duas primeiras palavras sejam mantidas
    if (palavras.length >= 2) {
      const duasPrimeiras = palavras.slice(0, 2).join(' ');
      
      // Se as duas primeiras palavras já excedem o tamanho máximo, retorná-las
      if (duasPrimeiras.length >= maxLength) {
        return duasPrimeiras;
      }
      
      // Tentar adicionar mais palavras até atingir o limite
      let resultado = duasPrimeiras;
      let i = 2;
      
      while (i < palavras.length && resultado.length + palavras[i].length + 1 <= maxLength) {
        resultado += ' ' + palavras[i];
        i++;
      }
      
      // Adicionar elipses se não incluiu todas as palavras
      if (i < palavras.length) {
        return resultado + '...';
      }
      
      return resultado;
    }
    
    // Se tiver apenas uma palavra, truncar normalmente
    return textoUpper.substring(0, maxLength) + '...';
  };

  return (
    <Box width="100%" height="100%" px={2}>
      {dadosProcessados.length > 0 ? (
        <Flex justify="space-between" align="flex-end" height="100%">
          {dadosProcessados.map((item, index) => {
            // Calcular altura proporcional
            const alturaRelativa = (item.percentual / maxPercentual) * alturaMaxima;
            const textoTruncado = truncarTexto(item.operacaoSemCodigo);
            
            return (
              <VStack key={index} spacing={2} width="15%">
                <Text fontWeight="bold" color="#E53E3E">{`${item.percentual.toFixed(2)}%`}</Text>
                <Text fontSize="xs" color="#000000">{formatarDuracao(item.duracao || 0)}</Text>
                <Box 
                  height={`${alturaRelativa}px`} 
                  width="80%" 
                  bg="#E53E3E" 
                  borderRadius="sm"
                />
                <Tooltip label={item.operacao} placement="top" hasArrow>
                  <Text 
                    fontSize="xs" 
                    textAlign="center" 
                    wordBreak="break-word"
                    width="100%"
                    lineHeight="1.2"
                    height="3.6em"
                    overflow="hidden"
                    textTransform="uppercase"
                    color="#000000"
                  >
                    {textoTruncado}
                  </Text>
                </Tooltip>
              </VStack>
            );
          })}
        </Flex>
      ) : (
        <Center h="100%">
          <Text color="#000000">Sem dados disponíveis</Text>
        </Center>
      )}
    </Box>
  );
};

export default GraficoTop5OfensoresTransbordo; 