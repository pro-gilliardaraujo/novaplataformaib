import { Box } from '@chakra-ui/react';
import { configManager } from '@/utils/config';
import { useMemo } from 'react';
import { ColumnDef, CellContext } from '@tanstack/react-table';

interface OperadorData {
  id: string;
  nome: string;
  eficiencia: number;
  horasTotal?: number;
  percentual?: number;
  horas?: number;
  porcentagem?: number;
  velocidade?: number;
}

interface TabelaOperadoresProps {
  dados: {
    eficiencia_energetica: OperadorData[];
    motor_ocioso: Array<{ 
      id: string; 
      nome: string; 
      percentual: number; 
      tempoLigado: number;
      tempoOcioso: number;
    }>;
    falta_apontamento?: Array<{ id: string; nome: string; percentual: number; horasTotal?: number }>;
    uso_gps: Array<{ id: string; nome: string; porcentagem: number; horasTotal?: number }>;
    hora_elevador?: Array<{ id: string; nome: string; horas: number; horasTotal?: number }>;
    media_velocidade?: Array<{ id: string; nome: string; velocidade: number }>;
    media_velocidade_vazio?: Array<{ id: string; nome: string; velocidade: number }>;
    media_velocidade_carregado?: Array<{ id: string; nome: string; velocidade: number }>;
  };
  tipo?: string;
  mostrarUsoGPS?: boolean;
  mostrarMediaVelocidade?: boolean;
  mostrarMediaVelocidadeVazio?: boolean;
  mostrarMediaVelocidadeCarregado?: boolean;
  mostrarEficiencia?: boolean;
  mostrarMotorOcioso?: boolean;
  mostrarHoraElevador?: boolean;
  mostrarFaltaApontamento?: boolean;
  mostrarTDH?: boolean;
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

// Função para formatar percentagens com 2 casas sem arredondamento
const formatPercentage = (val: number): string => {
  // Log para debug
  console.log(`📊 Formatando percentagem na tabela: ${val}`);
  
  // Se for undefined ou null, mostrar 0.00%
  if (val === undefined || val === null) {
    return "0.00%";
  }
  
  // Preservar o valor original sem causar arredondamento
  const valueStr = String(val);
  const decimalIndex = valueStr.indexOf('.');
  
  if (decimalIndex === -1) {
    // Sem casa decimal, adicionar .00%
    return `${valueStr}.00%`;
  } else {
    const integerPart = valueStr.substring(0, decimalIndex);
    const decimalPart = valueStr.substring(decimalIndex + 1);
    
    // Se tem mais que 2 casas decimais, truncar para 2 (sem arredondamento)
    if (decimalPart.length >= 2) {
      return `${integerPart}.${decimalPart.substring(0, 2)}%`;
    } 
    // Se tem menos que 2 casas, completar com zeros
    else {
      return `${integerPart}.${decimalPart}${'0'.repeat(2 - decimalPart.length)}%`;
    }
  }
};

// Função para formatar horas sem arredondamento
const formatHoras = (val: number): string => {
  // Log para debug
  console.log(`📊 Formatando horas na tabela: ${val}`);
  
  // Verificar se o valor é undefined, null, NaN ou zero
  if (val === undefined || val === null || isNaN(val) || val === 0) {
    return '0h00m';
  }
  
  const hours = Math.floor(val);
  const minutesDecimal = (val - hours) * 60;
  // Evitar arredondamento dos minutos
  const minutes = Math.floor(minutesDecimal);
  
  return `${hours}h${minutes.toString().padStart(2, '0')}m`;
};

// Função para limpar o ID do operador, removendo numerações como "1 - ", "2 - " antes do ID real
const limparIdOperador = (idCompleto: string): string => {
  // Se o ID contém um padrão como "123 - NOME", extrai apenas o número inicial
  if (idCompleto && typeof idCompleto === 'string' && idCompleto.includes(' - ')) {
    return idCompleto.split(' - ')[0].trim();
  }
  
  // Se o ID parece ser apenas um índice numérico (1, 2, 3, etc.), retorna vazio
  if (/^\d{1,2}$/.test(idCompleto)) {
    return '';
  }
  
  // Se não encontrou nenhum dos padrões, retorna o ID original
  return idCompleto;
};

const TabelaOperadores: React.FC<TabelaOperadoresProps> = ({ 
  dados, 
  tipo = 'colheita_diario',
  mostrarUsoGPS = true,
  mostrarMediaVelocidade = true,
  mostrarMediaVelocidadeVazio = false,
  mostrarMediaVelocidadeCarregado = false,
  mostrarEficiencia = true,
  mostrarMotorOcioso = true,
  mostrarHoraElevador = true,
  mostrarFaltaApontamento = true,
  mostrarTDH = true
}) => {
  const columns = useMemo<ColumnDef<OperadorData>[]>(() => [
    {
      accessorKey: 'nome',
      header: 'Operador',
      cell: (info: CellContext<OperadorData, unknown>) => (
        <div style={{ 
          maxWidth: '150px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {info.getValue() as string}
        </div>
      ),
    },
    {
      accessorKey: 'eficiencia',
      header: 'Eficiência',
      cell: (info: CellContext<OperadorData, unknown>) => `${(info.getValue() as number).toFixed(1)}%`,
    },
    {
      accessorKey: 'percentual',
      header: 'Motor Ocioso',
      cell: (info: CellContext<OperadorData, unknown>) => `${(info.getValue() as number).toFixed(1)}%`,
    },
    {
      accessorKey: 'horas',
      header: 'Horas Elevador',
      cell: (info: CellContext<OperadorData, unknown>) => `${(info.getValue() as number).toFixed(1)}h`,
    },
    {
      accessorKey: 'porcentagem',
      header: 'Uso GPS',
      cell: (info: CellContext<OperadorData, unknown>) => `${(info.getValue() as number).toFixed(1)}%`,
    },
    {
      accessorKey: 'velocidade',
      header: 'Média Velocidade',
      cell: (info: CellContext<OperadorData, unknown>) => `${(info.getValue() as number).toFixed(2)} km/h`,
    },
    {
      accessorKey: 'velocidade_vazio',
      header: 'Veloc. Vazio',
      cell: (info: CellContext<OperadorData, unknown>) => `${(info.getValue() as number).toFixed(2)} km/h`,
    },
    {
      accessorKey: 'velocidade_carregado',
      header: 'Veloc. Carregado',
      cell: (info: CellContext<OperadorData, unknown>) => `${(info.getValue() as number).toFixed(2)} km/h`,
    },
  ], []);

  // Log para depuração
  console.log('📊 TabelaOperadores recebeu dados:', {
    tipo: tipo,
    mostrarUsoGPS: mostrarUsoGPS,
    mostrarEficiencia: mostrarEficiencia,
    mostrarMotorOcioso: mostrarMotorOcioso,
    mostrarHoraElevador: mostrarHoraElevador,
    mostrarFaltaApontamento: mostrarFaltaApontamento,
    eficiencia_energetica: dados.eficiencia_energetica?.length || 0,
    motor_ocioso: dados.motor_ocioso?.length || 0,
    falta_apontamento: dados.falta_apontamento?.length || 0,
    uso_gps: dados.uso_gps?.length || 0,
    hora_elevador: dados.hora_elevador?.length || 0
  });
  
  // Definir quais colunas mostrar baseado nas props de visibilidade
  const mostrarColunas = {
    eficiencia: mostrarEficiencia,
    motorOcioso: mostrarMotorOcioso,
    horaElevador: mostrarHoraElevador && tipo.startsWith('colheita_'),
    usoGPS: mostrarUsoGPS,
    faltaApontamento: mostrarFaltaApontamento,
    mediaVelocidade: mostrarMediaVelocidade,
    mediaVelocidadeVazio: mostrarMediaVelocidadeVazio,
    mediaVelocidadeCarregado: mostrarMediaVelocidadeCarregado,
    tdh: mostrarTDH
  };
  
  console.log('📊 Configuração de colunas para tabela:', mostrarColunas);
  
  // Verificar se os dados necessários existem
  const temDados = 
    (mostrarEficiencia && Array.isArray(dados.eficiencia_energetica) && dados.eficiencia_energetica.length > 0) ||
    (mostrarMotorOcioso && Array.isArray(dados.motor_ocioso) && dados.motor_ocioso.length > 0) ||
    (mostrarFaltaApontamento && Array.isArray(dados.falta_apontamento) && dados.falta_apontamento.length > 0) ||
    (mostrarUsoGPS && Array.isArray(dados.uso_gps) && dados.uso_gps.length > 0) ||
    (mostrarHoraElevador && Array.isArray(dados.hora_elevador) && dados.hora_elevador.length > 0);
  
  if (!temDados) {
    console.log('📊 Todos os dados de operadores estão ausentes ou vazios');
    return (
      <Box p={4} textAlign="center" fontSize="sm" color="gray.500">
        Sem dados de operadores disponíveis
      </Box>
    );
  }

  // Filtrar operadores inválidos
  const filtrarOperadoresValidos = (array: any[]): any[] => {
    return array?.filter(item => 
      item && 
      item.nome && 
      item.nome !== 'TROCA DE TURNO' && 
      item.nome !== 'SEM OPERADOR' &&
      // Remover valores com "TROCA DE TURNO" em qualquer parte do nome
      !item.nome.includes('TROCA DE TURNO')
    ) || [];
  };

  // Filtrar e limpar os arrays de dados
  const eficienciaFiltrada = filtrarOperadoresValidos(dados.eficiencia_energetica);
  const motorOciosoFiltrado = filtrarOperadoresValidos(dados.motor_ocioso);
  const faltaApontamentoFiltrado = filtrarOperadoresValidos(dados.falta_apontamento || []);
  const usoGPSFiltrado = filtrarOperadoresValidos(dados.uso_gps);
  const horaElevadorFiltrado = filtrarOperadoresValidos(dados.hora_elevador || []);

  // Filtrar os arrays de dados de média de velocidade
  const mediaVelocidadeFiltrada = filtrarOperadoresValidos(dados.media_velocidade || []);
  const mediaVelocidadeVazioFiltrada = filtrarOperadoresValidos(dados.media_velocidade_vazio || []);
  const mediaVelocidadeCarregadoFiltrada = filtrarOperadoresValidos(dados.media_velocidade_carregado || []);

  // Se não encontramos operadores válidos após a filtragem, mostrar mensagem
  if (
    eficienciaFiltrada.length === 0 &&
    motorOciosoFiltrado.length === 0 &&
    faltaApontamentoFiltrado.length === 0 &&
    usoGPSFiltrado.length === 0 &&
    horaElevadorFiltrado.length === 0 &&
    mediaVelocidadeFiltrada.length === 0 &&
    mediaVelocidadeVazioFiltrada.length === 0 &&
    mediaVelocidadeCarregadoFiltrada.length === 0
  ) {
    console.log('📊 Nenhum operador válido encontrado após filtragem');
    return (
      <Box p={4} textAlign="center" fontSize="sm" color="gray.500">
        Sem dados de operadores disponíveis
      </Box>
    );
  }
  
  // Coletar todos os operadores únicos baseados no nome (não no ID)
  const operadoresVistos = new Set<string>();
  const todosOperadores: Array<{id: string, nome: string}> = [];
  
  // Combinando todos os arrays de dados filtrados
  [
    ...eficienciaFiltrada,
    ...motorOciosoFiltrado,
    ...faltaApontamentoFiltrado,
    ...usoGPSFiltrado,
    ...horaElevadorFiltrado,
    ...mediaVelocidadeFiltrada,
    ...mediaVelocidadeVazioFiltrada,
    ...mediaVelocidadeCarregadoFiltrada
  ].forEach(item => {
    if (item && item.nome && !operadoresVistos.has(item.nome)) {
      operadoresVistos.add(item.nome);
      const idLimpo = limparIdOperador(item.id);
      todosOperadores.push({
        id: idLimpo,
        nome: item.nome
      });
    }
  });
  
  // Ordenar operadores alfabeticamente
  todosOperadores.sort((a, b) => {
    // Casos especiais - colocar "SEM OPERADOR" sempre ao final
    if (a.nome.includes("SEM OPERADOR")) return 1;
    if (b.nome.includes("SEM OPERADOR")) return -1;
    
    // Extrair apenas o nome após o " - " se existir
    const nomeA = a.nome.includes(" - ") ? a.nome.split(" - ")[1] : a.nome;
    const nomeB = b.nome.includes(" - ") ? b.nome.split(" - ")[1] : b.nome;
    
    // Usar localeCompare para ordenação com opcoes pt-BR
    return nomeA.localeCompare(nomeB, 'pt-BR');
  });
  
  // Obter metas do configManager
  const metas = configManager.getMetas(tipo);
  const metaEficiencia = metas.eficienciaEnergetica || 60;
  const metaMotorOcioso = metas.motorOcioso || 25;
  const metaHorasElevador = metas.horaElevador || 5;
  const metaUsoGPS = metas.usoGPS || 90;
  const metaFaltaApontamento = metas.faltaApontamento || 15;
  const metaVelocidade = metas.mediaVelocidade || 5.5;

  // Valores intermediários (85% do valor meta)
  const metaEficienciaIntermediaria = metaEficiencia * 0.8;
  const metaMotorOciosoIntermediaria = metaMotorOcioso * 1.2;
  const metaHorasElevadorIntermediaria = metaHorasElevador * 0.8;
  const metaUsoGPSIntermediaria = metaUsoGPS * 0.85;
  const metaFaltaApontamentoIntermediaria = metaFaltaApontamento * 1.2;
  const metaVelocidadeIntermediaria = metaVelocidade * 0.85;

  // Função auxiliar para procurar operador pelo nome exato (não pelo ID)
  const encontrarValorOperadorPorNome = (
    array: Array<any> | undefined, 
    operadorNome: string, 
    campoValor: string
  ) => {
    // Verificar se há dados
    if (!array || !Array.isArray(array)) {
      console.log(`📊 encontrarValorOperadorPorNome: Array inválido para ${campoValor}, operador ${operadorNome}`);
      // Retornar undefined em vez de 0 para que valores ausentes não apareçam como 0
      return undefined;
    }
    
    console.log(`📊 Procurando ${campoValor} para operador "${operadorNome}" em array de ${array.length} itens`);
    
    // Log para debug - mostrar os primeiros itens do array
    if (array.length > 0 && campoValor === 'percentual') {
      console.log(`📊 Exemplos de dados no array: `, 
        array.slice(0, 2).map(m => ({ 
          nome: m.nome, 
          id: m.id, 
          percentual: m.percentual,
          tempoLigado: m.tempoLigado,
          tempoOcioso: m.tempoOcioso,
          campos: Object.keys(m)
        }))
      );
    }
    
    // Tenta encontrar pelo nome exato do operador
    let item = array.find((m: any) => m.nome === operadorNome);
    
    // Se não encontrar pelo nome exato, tenta com outras estratégias:
    if (!item) {
      // 1. Se o nome do operador contém um ID "1234 - Nome", tentar buscar sem o ID
      if (operadorNome.includes(' - ')) {
        const nomeSemId = operadorNome.split(' - ')[1];
        item = array.find((m: any) => 
          m.nome === nomeSemId || 
          (m.nome && m.nome.includes(nomeSemId))
        );
      }
      
      // 2. Se o campo nome no array tiver o formato "1234 - Nome", extrair apenas o nome
      if (!item) {
        item = array.find((m: any) => {
          if (m.nome && m.nome.includes(' - ')) {
            const nomeSemId = m.nome.split(' - ')[1];
            return nomeSemId === operadorNome || operadorNome.includes(nomeSemId);
          }
          return false;
        });
      }
      
      // 3. Comparação mais flexível: verificar se o nome do operador está contido
      if (!item) {
        item = array.find((m: any) => 
          (m.nome && operadorNome.includes(m.nome)) || 
          (m.nome && m.nome.includes(operadorNome))
        );
      }
    }
    
    if (item) {
      console.log(`📊 Encontrado ${campoValor} para operador "${operadorNome}":`, item[campoValor]);
      
      // Para percentual, verificar múltiplos campos possíveis
      if (campoValor === 'percentual') {
        if (typeof item[campoValor] === 'number') {
          return item[campoValor];
        }
        if (typeof item.porcentagem === 'number') {
          return item.porcentagem;
        }
        if (item.tempoLigado > 0 && item.tempoOcioso >= 0) {
          const calculado = (item.tempoOcioso / item.tempoLigado) * 100;
          console.log(`📊 Percentual calculado: ${calculado}`);
          return calculado;
        }
      }
      
      return item[campoValor] || 0;  // Retornar 0 em vez de undefined para campos numéricos
    }
    
    // Se não encontrou o item, retornar 0 para campos numéricos
    return ['percentual', 'eficiencia', 'horas', 'porcentagem', 'velocidade'].includes(campoValor) ? 0 : undefined;
  };

  // Função para determinar a cor do valor
  const getValueColor = (value: number | undefined, tipo: string, meta: number) => {
    if (value === undefined || value === null) return "gray.400";

    const cores = configManager.getConfig()?.graficos?.cores || DEFAULT_COLORS;
    const tolerancias = configManager.getConfig()?.graficos?.tolerancias || DEFAULT_TOLERANCES;

    // Para velocidade e motor ocioso, menor é melhor
    if (tipo === 'velocidade' || tipo === 'motor_ocioso') {
      if (value <= meta) return cores.meta_atingida;
      if (value <= meta * 1.2) return cores.proximo_meta;
      if (value <= meta * 1.5) return cores.alerta;
      return cores.critico;
    }

    // Para os demais indicadores, maior é melhor
    const diferenca = ((value - meta) / meta) * 100;
    if (value >= meta) return cores.meta_atingida;
    if (diferenca >= -tolerancias.proximo_meta) return cores.proximo_meta;
    if (diferenca >= -tolerancias.alerta) return cores.alerta;
    return cores.critico;
  };

  return (
    <Box 
      w="100%" 
      border="1px solid" 
      borderColor="black" 
      borderRadius="md" 
      overflow="hidden"
      bg="white"
    >
      <Box as="table" w="100%" fontSize="11px" color="black">
        <Box as="thead">
          <Box as="tr" bg="gray.100">
            <Box as="th" p={2} textAlign="left" borderBottom="1px solid" borderColor="black" color="black" fontWeight="bold">
              Operador
            </Box>
            {mostrarColunas.eficiencia && (
              <Box as="th" p={2} textAlign="center" borderBottom="1px solid" borderColor="black" color="black" fontWeight="bold">
                Eficiência
              </Box>
            )}
            {mostrarColunas.motorOcioso && (
              <Box as="th" p={2} textAlign="center" borderBottom="1px solid" borderColor="black" color="black" fontWeight="bold">
                Motor Ocioso
              </Box>
            )}
            {mostrarColunas.horaElevador && (
              <Box as="th" p={2} textAlign="center" borderBottom="1px solid" borderColor="black" color="black" fontWeight="bold">
                Horas Elevador
              </Box>
            )}
            {mostrarColunas.usoGPS && (
              <Box as="th" p={2} textAlign="center" borderBottom="1px solid" borderColor="black" color="black" fontWeight="bold">
                Uso GPS
              </Box>
            )}
            {mostrarColunas.faltaApontamento && (
              <Box as="th" p={2} textAlign="center" borderBottom="1px solid" borderColor="black" color="black" fontWeight="bold">
                Falta Apontamento
              </Box>
            )}
            {mostrarColunas.mediaVelocidade && (
              <Box as="th" p={2} textAlign="center" borderBottom="1px solid" borderColor="black" color="black" fontWeight="bold">
                Média Velocidade
              </Box>
            )}
            {mostrarColunas.mediaVelocidadeVazio && (
              <Box as="th" p={2} textAlign="center" borderBottom="1px solid" borderColor="black" color="black" fontWeight="bold">
                Veloc. Vazio
              </Box>
            )}
            {mostrarColunas.mediaVelocidadeCarregado && (
              <Box as="th" p={2} textAlign="center" borderBottom="1px solid" borderColor="black" color="black" fontWeight="bold">
                Veloc. Carregado
              </Box>
            )}
          </Box>
        </Box>
        <Box as="tbody">
          {todosOperadores.map((item, index) => {
              const eficiencia = encontrarValorOperadorPorNome(
                dados.eficiencia_energetica,
                item.nome, 
                'eficiencia'
              );
              
              const motorOcioso = encontrarValorOperadorPorNome(
                dados.motor_ocioso, 
                item.nome, 
                'percentual'
              );
              
              const horasElevador = encontrarValorOperadorPorNome(
                dados.hora_elevador, 
                item.nome, 
                'horas'
              );
              
              const usoGPS = encontrarValorOperadorPorNome(
                dados.uso_gps, 
                item.nome, 
                'porcentagem'
              );
              
              const faltaApontamento = encontrarValorOperadorPorNome(
                dados.falta_apontamento,
                item.nome,
                'percentual'
              );
              
              const velocidade = encontrarValorOperadorPorNome(
                dados.media_velocidade,
                item.nome,
                'velocidade'
              );
              
              const velocidadeVazio = encontrarValorOperadorPorNome(
                dados.media_velocidade_vazio,
                item.nome,
                'velocidade'
              );
              
              const velocidadeCarregado = encontrarValorOperadorPorNome(
                dados.media_velocidade_carregado,
                item.nome,
                'velocidade'
              );
              
              // Determinar cores conforme o valor
              const getEfficiencyColor = (val: number) => {
                if (val >= metaEficiencia) return 'green.600';
                if (val >= metaEficienciaIntermediaria) return 'orange.500';
                return 'red.500';
              };
              
              const getInvertedColor = (val: number, meta: number, intermedia: number) => {
                if (val <= meta) return 'green.600';
                if (val <= intermedia) return 'orange.500';
                return 'red.500';
              };
              
              const getHoursColor = (val: number) => {
                if (val >= metaHorasElevador) return 'green.600';
                if (val >= metaHorasElevadorIntermediaria) return 'orange.500';
                return 'red.500';
              };
              
              // Decidir se mostra ou não o operador
              // Vamos mostrar todos os operadores, incluindo aqueles com valores zero
              // Verificamos apenas se existem valores definidos (not undefined)
              const temAlgumValorDefinido = 
                (eficiencia !== undefined) || 
                (motorOcioso !== undefined) || 
                (horasElevador !== undefined) || 
                (usoGPS !== undefined) || 
                (velocidade !== undefined) || 
                (faltaApontamento !== undefined) ||
                (velocidadeVazio !== undefined) ||
                (velocidadeCarregado !== undefined);
                
              if (!temAlgumValorDefinido) return null;
              
              // Extrair apenas o nome do operador (após o " - " se existir)
              const nomeOperador = item.nome.includes(" - ") ? item.nome.split(" - ")[1] : item.nome;
              
              return (
                <Box 
                  as="tr" 
                  key={index} 
                  bg={index % 2 === 0 ? 'white' : 'gray.100'}
                  borderBottom="1px solid"
                  borderColor="gray.200"
                  _hover={{ bg: 'gray.100' }}
                >
                  <Box 
                    as="td" 
                    p={2} 
                    fontWeight="medium" 
                    borderRight="1px solid" 
                    borderColor="gray.200"
                    title={item.nome}
                    sx={{
                      maxWidth: '150px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {nomeOperador}
                  </Box>
                  
                  {mostrarColunas.eficiencia && (
                    <Box 
                      as="td" 
                      p={2} 
                      textAlign="center" 
                      borderRight={(!mostrarColunas.motorOcioso && !mostrarColunas.horaElevador && !mostrarColunas.usoGPS && !mostrarColunas.faltaApontamento && !mostrarColunas.mediaVelocidade) ? "none" : "1px solid"}
                      borderColor="gray.200"
                      color={getEfficiencyColor(eficiencia)}
                      fontWeight="bold"
                    >
                      {formatPercentage(eficiencia)}
                    </Box>
                  )}
                  
                  {mostrarColunas.motorOcioso && (
                    <Box 
                      as="td" 
                      p={2} 
                      textAlign="center" 
                      borderRight={(!mostrarColunas.horaElevador && !mostrarColunas.usoGPS && !mostrarColunas.faltaApontamento && !mostrarColunas.mediaVelocidade) ? "none" : "1px solid"}
                      borderColor="gray.200"
                      color={getInvertedColor(motorOcioso, metaMotorOcioso, metaMotorOciosoIntermediaria)}
                      fontWeight="bold"
                    >
                      {formatPercentage(motorOcioso)}
                    </Box>
                  )}
                  
                  {mostrarColunas.horaElevador && (
                    <Box 
                      as="td" 
                      p={2} 
                      textAlign="center" 
                      borderRight={(!mostrarColunas.usoGPS && !mostrarColunas.faltaApontamento && !mostrarColunas.mediaVelocidade) ? "none" : "1px solid"}
                      borderColor="gray.200"
                      color={getHoursColor(horasElevador || 0)}
                      fontWeight="bold"
                    >
                      {formatHoras(horasElevador || 0)}
                    </Box>
                  )}
                  
                  {mostrarColunas.usoGPS && (
                    <Box 
                      as="td" 
                      p={2} 
                      textAlign="center" 
                      borderRight={(!mostrarColunas.faltaApontamento && !mostrarColunas.mediaVelocidade) ? "none" : "1px solid"}
                      borderColor="gray.200"
                      color={usoGPS >= metaUsoGPS ? 'green.600' : (usoGPS >= metaUsoGPSIntermediaria ? 'orange.500' : 'red.500')}
                      fontWeight="bold"
                    >
                      {formatPercentage(usoGPS)}
                    </Box>
                  )}
                  {mostrarColunas.faltaApontamento && (
                    <Box 
                      as="td" 
                      p={2} 
                      textAlign="center" 
                      borderRight={!mostrarColunas.mediaVelocidade ? "none" : "1px solid"}
                      borderColor="gray.200"
                      color={getInvertedColor(faltaApontamento, metaFaltaApontamento, metaFaltaApontamentoIntermediaria)}
                      fontWeight="bold"
                    >
                      {formatPercentage(faltaApontamento)}
                    </Box>
                  )}
                  {mostrarColunas.mediaVelocidade && (
                    <Box 
                      as="td" 
                      p={2} 
                      textAlign="center" 
                      color={getInvertedColor(velocidade, metaVelocidade, metaVelocidadeIntermediaria)}
                      fontWeight="bold"
                    >
                      {velocidade.toFixed(2)} km/h
                    </Box>
                  )}
                  {mostrarColunas.mediaVelocidadeVazio && (
                    <Box 
                      as="td" 
                      p={2} 
                      textAlign="center" 
                      color={getInvertedColor(velocidadeVazio, metaVelocidade, metaVelocidadeIntermediaria)}
                      fontWeight="bold"
                    >
                      {velocidadeVazio.toFixed(2)} km/h
                    </Box>
                  )}
                  {mostrarColunas.mediaVelocidadeCarregado && (
                    <Box 
                      as="td" 
                      p={2} 
                      textAlign="center" 
                      color={getInvertedColor(velocidadeCarregado, metaVelocidade, metaVelocidadeIntermediaria)}
                      fontWeight="bold"
                    >
                      {velocidadeCarregado.toFixed(2)} km/h
                    </Box>
                  )}
                </Box>
              );
            })}
        </Box>
      </Box>
    </Box>
  );
};

export default TabelaOperadores; 