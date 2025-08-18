'use client';

import { Box, Grid, GridItem, Heading, Text, Flex, Input, Button, useToast, Radio, RadioGroup, Stack, VStack, HStack, Icon, Checkbox, InputGroup, InputRightElement } from '@chakra-ui/react';
import { FiUpload, FiDownload, FiList, FiFile, FiCheck, FiCalendar, FiEye } from 'react-icons/fi';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useReportStore } from '@/store/useReportStore';
import { useRouter } from 'next/navigation';
import { configManager } from '@/utils/config';

interface FrenteUploadData {
  id: string;
  nome: string;
  colhedorasFile: File | null;
  transbordosFile: File | null;
  hasTransbordos: boolean;
}

// Interface para itens de processamento
interface ProcessedItem {
  success: boolean;
  id?: string;
  error?: string;
  inProgress?: boolean;
  tipoRelatorio?: string;
}

// Interface para item da fila de processamento
interface QueueItem {
  frenteId: string;
  fileType: 'colhedoras' | 'transbordos';
}

export default function ReportsPage() {
  const router = useRouter();
  const { 
    visibilityConfig,
    setVisibilityConfig,
    setCurrentReportId
  } = useReportStore();
  
  // Calcular ontem
  const getYesterday = () => {
    // Usar o objeto Date com a data local
    const yesterday = new Date();
    
    // Subtrair um dia
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Formatar como YYYY-MM-DD
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };
  
  // Estados principais
  const [periodoRelatorio, setPeriodoRelatorio] = useState<string>('diario');
  const [selectedDate, setSelectedDate] = useState<string>(getYesterday());
  const [startDate, setStartDate] = useState<string>(getYesterday());
  const [endDate, setEndDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [frentesData, setFrentesData] = useState<FrenteUploadData[]>([]);
  
  // Estados para processamento e fila
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedItems, setProcessedItems] = useState<{[key: string]: ProcessedItem}>({});
  const [processQueue, setProcessQueue] = useState<QueueItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  
  // Estados adicionais para drag and drop
  const [dragOver, setDragOver] = useState<{[key: string]: boolean}>({});
  
  const toast = useToast();

  // Reset current report ID
  useEffect(() => {
    setCurrentReportId(null);
  }, [setCurrentReportId]);

  // Carregar configurações
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        if (!configManager.isLoaded()) {
          await configManager.reloadConfig();
        }
        setIsConfigLoaded(true);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast({
          title: "Erro ao carregar configurações",
          description: "Usando configurações padrão",
          status: "warning",
          duration: 3000,
        });
        setIsConfigLoaded(true);
      }
    };
    
    loadConfigs();
  }, []);

  // Verificar se é um relatório semanal
  const isWeeklyReport = periodoRelatorio === 'semanal';
  
  // Get report type based on periodo
  const getColheitaReportType = () => {
    return `colheita_${periodoRelatorio}`;
  };
  
  const getTransbordoReportType = () => {
    return `transbordo_${periodoRelatorio}`;
  };
  
  // Função para atualizar configurações quando o tipo de relatório muda
  useEffect(() => {
    // Se for um relatório semanal, marcar todas as opções
    if (periodoRelatorio === 'semanal') {
      setVisibilityConfig({
        colheita: {
          disponibilidadeMecanica: true,
          eficienciaEnergetica: true,
          motorOcioso: true,
          horaElevador: true,
          usoGPS: true,
          mediaVelocidade: true,
          diesel: true,
          tdh: true,
          graficoProducao: true,
          impurezaVegetal: true
        },
        transbordo: {
          disponibilidadeMecanica: true,
          eficienciaEnergetica: true,
          motorOcioso: true,
          faltaApontamento: true,
          usoGPS: true,
          velocidadeVazio: true,
          velocidadeCarregado: true,
          diesel: true,
          tdh: true,
          impurezaVegetal: true
        }
      });
    }
  }, [periodoRelatorio, setVisibilityConfig]);
  
  // Obter configurações apenas quando isConfigLoaded for true
  const frentesDisponiveis = isConfigLoaded ? configManager.getFrentes(getColheitaReportType()) : [];

  // Inicializar os dados das frentes quando o componente monta
  useEffect(() => {
    if (isConfigLoaded && frentesDisponiveis.length > 0) {
      const frentesDataInit = frentesDisponiveis.map(frente => ({
        id: frente.id,
        nome: frente.nome,
        colhedorasFile: null,
        transbordosFile: null,
        hasTransbordos: !frente.id.includes('zirleno') && !frente.nome.includes('Zirleno') // Zirleno não tem transbordos
      }));
      setFrentesData(frentesDataInit);
    }
  }, [isConfigLoaded, frentesDisponiveis, periodoRelatorio]);

  // Função para atualizar o arquivo de uma frente específica
  const updateFrenteFile = (frenteId: string, fileType: 'colhedoras' | 'transbordos', file: File | null) => {
    setFrentesData(prev => 
      prev.map(frente => 
        frente.id === frenteId 
          ? { 
              ...frente, 
              [fileType === 'colhedoras' ? 'colhedorasFile' : 'transbordosFile']: file 
            } 
          : frente
      )
    );
  };

  // Função para verificar se todos os inputs necessários estão preenchidos
  const isFormValid = () => {
    if (isWeeklyReport && (!startDate || !endDate)) return false;
    if (!isWeeklyReport && !selectedDate) return false;
    
    // Verificar se pelo menos uma frente tem um arquivo
    const hasAnyFile = frentesData.some(frente => frente.colhedorasFile !== null || frente.transbordosFile !== null);
    return hasAnyFile;
  };

  // Função para processar um único relatório
  const processSingleReport = useCallback(async (queueItem: QueueItem): Promise<boolean> => {
    const { frenteId, fileType } = queueItem;
    const key = `${frenteId}:${fileType}`;
    
    try {
      // Atualizar estado para mostrar que está processando este item
      setProcessedItems(prev => ({
        ...prev,
        [key]: { success: false, inProgress: true }
      }));
      
      const frente = frentesData.find(f => f.id === frenteId);
      if (!frente) throw new Error(`Frente ${frenteId} não encontrada`);
      
      const file = fileType === 'colhedoras' ? frente.colhedorasFile : frente.transbordosFile;
      if (!file) throw new Error(`Arquivo não encontrado para ${frente.nome} - ${fileType}`);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('report_type', fileType === 'colhedoras' ? 
        (isWeeklyReport ? 'colheita_semanal' : 'colheita_diario') : 
        (isWeeklyReport ? 'transbordo_semanal' : 'transbordo_diario')
      );
      
      // Adicionar as datas apropriadas dependendo do tipo de relatório
      if (isWeeklyReport) {
        formData.append('start_date', startDate);
        formData.append('end_date', endDate);
      } else {
        formData.append('report_date', selectedDate);
      }
      
      formData.append('frente', frenteId);
      formData.append('visibility_config', JSON.stringify(visibilityConfig));
      
      // Enviar para o backend (via API route do Next.js)
      const response = await fetch(`/api/reports/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao processar o arquivo no backend');
      }
      
      const result = await response.json();
      
      if (!result || !result.data) {
        throw new Error('Resposta inválida do backend');
      }
      
      console.log(`✅ Relatório ${fileType} para ${frente.nome} gerado com sucesso, ID: ${result.id}`);
      
      // Determinar tipo de relatório
      const tipoRelatorio = fileType === 'colhedoras' ? 
        (isWeeklyReport ? 'colheita-semanal' : 'colheita') : 
        (isWeeklyReport ? 'transbordo-semanal' : 'transbordo');
      
      // Atualizar estado para mostrar que o item foi processado com sucesso
      setProcessedItems(prev => ({
        ...prev,
        [key]: { 
          success: true, 
          id: result.id,
          inProgress: false,
          tipoRelatorio
        }
      }));

      // Incrementar contador de itens processados
      setProcessedCount(prev => prev + 1);
      
      toast({
        title: "Relatório gerado com sucesso",
        description: `Relatório ${fileType} para ${frente.nome} gerado.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      return true;
      
    } catch (error) {
      console.error(`❌ Erro ao processar relatório ${fileType} para frente ${frenteId}:`, error);
      
      // Atualizar estado para mostrar que o item falhou
      setProcessedItems(prev => ({
        ...prev,
        [key]: { 
          success: false, 
          error: String(error),
          inProgress: false
        }
      }));

      // Incrementar contador de itens processados (mesmo com falha)
      setProcessedCount(prev => prev + 1);
      
      toast({
        title: "Erro ao gerar relatório",
        description: String(error),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      
      return false;
    }
  }, [frentesData, isWeeklyReport, selectedDate, startDate, endDate, visibilityConfig, toast]);

  // Função para processar a fila sequencialmente
  const processQueueSequentially = useCallback(async () => {
    if (!isProcessing || processQueue.length === 0) {
      setIsProcessing(false);
      return;
    }
    
    try {
      // Pegar o primeiro item da fila sem modificar o estado
      const currentItem = processQueue[0];
      
      // Processar o item atual
      const success = await processSingleReport(currentItem);
      
      // Remover o item processado da fila (após processamento completo)
      setProcessQueue(prev => prev.slice(1));
      
      // Pequena pausa entre processamentos
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Se ainda houver itens na fila, continuar processando
      if (processQueue.length > 1) {
        // Não fazer nada aqui, o useEffect vai disparar novamente
      } else {
        // Finalizar processamento se a fila está vazia
        setIsProcessing(false);
        
        // Mostrar toast de conclusão
        const sucessos = Object.values(processedItems).filter(item => item.success).length;
        const falhas = Object.values(processedItems).filter(item => !item.success && !item.inProgress).length;
        
        toast({
          title: "Processamento concluído",
          description: sucessos > 0 
            ? `${sucessos} relatório(s) gerado(s) com sucesso${falhas ? `. ${falhas} falha(s).` : '!'}`
            : falhas > 0 
              ? `Nenhum relatório gerado. ${falhas} falha(s).`
              : "Nenhum relatório na fila de processamento.",
          status: sucessos > 0 ? "success" : falhas > 0 ? "error" : "info",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Erro no processamento da fila:", error);
      setIsProcessing(false);
    }
  }, [isProcessing, processQueue, processSingleReport, processedItems, toast]);

  // Efeito para monitorar mudanças no estado da fila e iniciar processamento
  useEffect(() => {
    if (isProcessing && processQueue.length > 0) {
      // Chamar apenas quando isProcessing = true e há itens na fila
      processQueueSequentially();
    } else if (isProcessing && processQueue.length === 0) {
      // Se estava processando mas a fila acabou, finalizar
      setIsProcessing(false);
    }
    // Remover processQueueSequentially das dependências para evitar loops
  }, [isProcessing, processQueue.length]);

  // Função para processar todos os relatórios
  const handleProcessAll = () => {
    if (!isFormValid()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione a data e faça upload de pelo menos um arquivo.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Validar datas para relatórios semanais
    if (isWeeklyReport && startDate > endDate) {
      toast({
        title: "Datas inválidas",
        description: "A data de início deve ser anterior ou igual à data de fim.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Resetar estados de processamento
    setProcessedItems({});
    setProcessedCount(0);
    
    // Criar fila de processamento verificando quais arquivos realmente existem
    const queue: QueueItem[] = [];
    
    frentesData.forEach(frente => {
      // Verificar se cada arquivo realmente existe antes de adicionar à fila
      if (frente.colhedorasFile) {
        queue.push({ frenteId: frente.id, fileType: 'colhedoras' });
      }
      if (frente.transbordosFile) {
        queue.push({ frenteId: frente.id, fileType: 'transbordos' });
      }
    });
    
    if (queue.length === 0) {
      toast({
        title: "Nenhum arquivo para processar",
        description: "Faça upload de pelo menos um arquivo de colhedoras ou transbordos.",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    
    console.log(`Iniciando processamento de ${queue.length} arquivos:`, queue);
    
    // Configurar e iniciar processamento
    setTotalItems(queue.length);
    setProcessQueue(queue);
    setIsProcessing(true);
    
    toast({
      title: "Processamento iniciado",
      description: `${queue.length} relatório(s) serão processados sequencialmente.`,
      status: "info",
      duration: 3000,
    });
  };

  // Função para tentar novamente um item específico que falhou
  const handleRetryItem = (frenteId: string, fileType: 'colhedoras' | 'transbordos') => {
    // Adicionar item na fila
    const newItem = { frenteId, fileType };
    setProcessQueue([newItem]);
    
    // Reiniciar estado do item
    setProcessedItems(prev => ({
      ...prev,
      [`${frenteId}:${fileType}`]: { success: false, inProgress: false }
    }));
    
    // Iniciar processamento
    setIsProcessing(true);
    
    toast({
      title: "Processando novamente",
      description: `Tentando gerar relatório ${fileType} novamente.`,
      status: "info",
      duration: 2000,
    });
  };

  // Função para visualizar um relatório gerado
  const handleViewReport = (item: {id: string, tipoRelatorio: string}) => {
    const viewUrl = `/relatorios/visualizacao/a4/${item.tipoRelatorio}?id=${item.id}`;
    window.open(viewUrl, `report_${item.id}`);
  };

  // Função para fazer download do PDF do relatório
  const handleDownloadPDF = async (item: {id: string, tipoRelatorio: string}) => {
    const viewUrl = `/relatorios/visualizacao/a4/${item.tipoRelatorio}?id=${item.id}`;
    
    // Configurar opções da janela popup - tamanho adequado para A4
    const width = 800;
    const height = 1130; // Proporção A4
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    // Abrir popup
    const popup = window.open(
      viewUrl,
      `print_${item.id}`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    // Aguardar carregamento e imprimir
    if (popup) {
      popup.onload = () => {
        setTimeout(() => {
          // Adicionar listener para fechar a janela após impressão
          if (popup.matchMedia) {
            const mediaQueryList = popup.matchMedia('print');
            mediaQueryList.addEventListener('change', (mql) => {
              if (!mql.matches) { // Após sair do modo impressão
                popup.close();
              }
            });
          }
          
          // Acionar impressão
          popup.focus();
          popup.print();
        }, 1000);
      };
    } else {
      toast({
        title: "Erro ao abrir janela",
        description: "Por favor, permita popups para este site",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Função para visualizar relatórios existentes
  const handleViewReports = () => {
    router.push('/relatorios/lista');
  };

  // Funçao customizada para upload de arquivo
  const handleFileUpload = (frenteId: string, fileType: 'colhedoras' | 'transbordos') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.zip';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        updateFrenteFile(frenteId, fileType, file);
        toast({
          title: "Arquivo selecionado",
          description: `Arquivo ${file.name} selecionado.`,
          status: "success",
          duration: 3000,
        });
      }
    };
    input.click();
  };
  
  // Handlers para o drag and drop
  const handleDragEnter = (frenteId: string, fileType: 'colhedoras' | 'transbordos', e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Atualizar estado para mostrar feedback visual
    setDragOver(prev => ({
      ...prev,
      [`${frenteId}:${fileType}`]: true
    }));
  };
  
  const handleDragLeave = (frenteId: string, fileType: 'colhedoras' | 'transbordos', e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remover feedback visual
    setDragOver(prev => ({
      ...prev,
      [`${frenteId}:${fileType}`]: false
    }));
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (frenteId: string, fileType: 'colhedoras' | 'transbordos', e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remover feedback visual
    setDragOver(prev => ({
      ...prev,
      [`${frenteId}:${fileType}`]: false
    }));
    
    // Verificar se há arquivos
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      // Verificar extensão do arquivo
      if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.zip')) {
        updateFrenteFile(frenteId, fileType, file);
        toast({
          title: "Arquivo selecionado",
          description: `Arquivo ${file.name} selecionado.`,
          status: "success",
          duration: 3000,
        });
      } else {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo .xlsx ou .zip",
          status: "error",
          duration: 3000,
        });
      }
    }
  };

  // Função para ordenar frentes
  const getSortedFrentes = () => {
    return [...frentesData].sort((a, b) => {
      const getPriority = (frente: FrenteUploadData) => {
        if (frente.nome.includes('3') || frente.nome.includes('Alexandrita')) return 1;
        if (frente.nome.includes('4') || frente.nome.includes('Ituiutaba')) return 2;
        if (frente.nome.includes('8') || frente.nome.includes('Canápolis')) return 3;
        if (frente.nome.includes('Zirleno')) return 4;
        return 5; // Outras frentes (se houver)
      };
      
      return getPriority(a) - getPriority(b);
    });
  };

  // Calcular progresso atual
  const progress = totalItems > 0 ? (processedCount / totalItems) * 100 : 0;

  return (
    <Box minH="100vh" bg="white" p={6}>
      {/* Grid principal - dividindo a tela em duas áreas principais */}
      <Grid 
        templateColumns="4fr 1fr" 
        gap={6} 
        width="100%" 
        height="calc(100vh - 96px)" // Altura total - padding
      >
        {/* Coluna principal com configurações e grid de frentes */}
        <Flex direction="column" height="100%" gap={6}>
          {/* Painel de configurações superior */}
          <Grid templateColumns="1fr 2fr" gap={6}>
            {/* Opções do Relatório */}
            <Box 
              border="1px solid black" 
              borderRadius="md" 
              p={4}
              bg="white"
              boxShadow="sm"
              height="100%"
            >
              <Heading size="md" mb={5} color="black" textAlign="center">Opções Relatório</Heading>
              
              <VStack align="start" spacing={6} width="100%">
                {/* Período */}
                <Box width="100%">
                  <Text fontWeight="medium" mb={2} color="black">Período</Text>
                  <RadioGroup 
                    value={periodoRelatorio} 
                    onChange={(val) => setPeriodoRelatorio(val)}
                  >
                    <Stack direction="row" justify="space-around" width="100%">
                      <Radio 
                        value="diario" 
                        colorScheme="blackAlpha"
                        borderColor="black"
                        size="md"
                      >
                        <Text color="black">Diário</Text>
                      </Radio>
                      <Radio 
                        value="semanal" 
                        colorScheme="blackAlpha"
                        borderColor="black"
                        size="md"
                      >
                        <Text color="black">Semanal</Text>
                      </Radio>
                    </Stack>
                  </RadioGroup>
                </Box>
                
                {/* Data */}
                <Box width="100%">
                  <Text fontWeight="medium" mb={2} color="black">Data</Text>
                  
                  <VStack spacing={3} align="start" width="100%">
                    <Box width="100%">
                      <Text fontSize="sm" mb={1} color="gray.600">
                        {isWeeklyReport ? 'Data Início' : 'Data do Relatório'}
                      </Text>
                      <InputGroup>
                        <Input
                          type="date"
                          value={isWeeklyReport ? startDate : selectedDate}
                          onChange={(e) => isWeeklyReport ? setStartDate(e.target.value) : setSelectedDate(e.target.value)}
                          borderColor="black"
                          color="black"
                          bg="white"
                          size="md"
                          fontSize="sm"
                          width="100%"
                          height="40px"
                          cursor="pointer"
                        />
                        <InputRightElement pointerEvents="none" height="40px">
                          <Icon as={FiCalendar} color="black" />
                        </InputRightElement>
                      </InputGroup>
                    </Box>
                    
                    <Box width="100%">
                      <Text 
                        fontSize="sm" 
                        mb={1} 
                        color={isWeeklyReport ? "gray.600" : "gray.400"}
                      >
                        Data Fim
                      </Text>
                      <InputGroup>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          borderColor={isWeeklyReport ? "black" : "gray.200"}
                          color={isWeeklyReport ? "black" : "gray.400"}
                          bg="white"
                          size="md"
                          fontSize="sm"
                          width="100%"
                          height="40px"
                          isDisabled={!isWeeklyReport}
                          _disabled={{ cursor: "not-allowed" }}
                          cursor={isWeeklyReport ? "pointer" : "not-allowed"}
                        />
                        <InputRightElement pointerEvents="none" height="40px">
                          <Icon as={FiCalendar} color={isWeeklyReport ? "black" : "gray.400"} />
                        </InputRightElement>
                      </InputGroup>
                    </Box>
                  </VStack>
                </Box>
              </VStack>
            </Box>

            {/* Visualização */}
            <Box 
              border="1px solid black" 
              borderRadius="md"
              p={4}
              bg="white"
              boxShadow="sm"
              height="100%"
            >
              <Heading size="md" mb={5} color="black" textAlign="center">Visualização</Heading>
              
              <Grid templateColumns="repeat(2, 1fr)" gap={8}>
                {/* Coluna Colheita */}
                <Box>
                  <Text 
                    fontWeight="bold" 
                    mb={3} 
                    color="black" 
                    borderBottom="1px solid" 
                    borderColor="gray.200"
                    pb={1}
                  >
                    Colheita
                  </Text>
                  <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                    <Checkbox
                      isChecked={visibilityConfig.colheita.disponibilidadeMecanica}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        colheita: { 
                          ...visibilityConfig.colheita,
                          disponibilidadeMecanica: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Disponibilidade Mecânica</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.colheita.eficienciaEnergetica}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        colheita: { 
                          ...visibilityConfig.colheita,
                          eficienciaEnergetica: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Eficiência Energética</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.colheita.horaElevador}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        colheita: { 
                          ...visibilityConfig.colheita,
                          horaElevador: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Hora Elevador</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.colheita.motorOcioso}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        colheita: { 
                          ...visibilityConfig.colheita,
                          motorOcioso: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Motor Ocioso</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.colheita.usoGPS}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        colheita: { 
                          ...visibilityConfig.colheita,
                          usoGPS: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Uso GPS</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.colheita.mediaVelocidade}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        colheita: { 
                          ...visibilityConfig.colheita,
                          mediaVelocidade: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Média Velocidade</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.colheita.diesel}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        colheita: { 
                          ...visibilityConfig.colheita,
                          diesel: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Diesel</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.colheita.tdh}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        colheita: { 
                          ...visibilityConfig.colheita,
                          tdh: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">TDH</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.colheita.graficoProducao}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        colheita: { 
                          ...visibilityConfig.colheita,
                          graficoProducao: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Gráfico de Produção</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.colheita.impurezaVegetal}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        colheita: { 
                          ...visibilityConfig.colheita,
                          impurezaVegetal: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Impureza Vegetal</Text>
                    </Checkbox>
                  </Grid>
                </Box>

                {/* Coluna Transbordo */}
                <Box>
                  <Text 
                    fontWeight="bold" 
                    mb={3} 
                    color="black" 
                    borderBottom="1px solid" 
                    borderColor="gray.200"
                    pb={1}
                  >
                    Transbordo
                  </Text>
                  <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                    <Checkbox
                      isChecked={visibilityConfig.transbordo.disponibilidadeMecanica}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        transbordo: { 
                          ...visibilityConfig.transbordo,
                          disponibilidadeMecanica: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Disponibilidade Mecânica</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.transbordo.eficienciaEnergetica}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        transbordo: { 
                          ...visibilityConfig.transbordo,
                          eficienciaEnergetica: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Eficiência Energética</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.transbordo.motorOcioso}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        transbordo: { 
                          ...visibilityConfig.transbordo,
                          motorOcioso: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Motor Ocioso</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.transbordo.faltaApontamento}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        transbordo: { 
                          ...visibilityConfig.transbordo,
                          faltaApontamento: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Falta de Apontamento</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.transbordo.usoGPS}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        transbordo: { 
                          ...visibilityConfig.transbordo,
                          usoGPS: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Uso GPS</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.transbordo.velocidadeVazio}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        transbordo: { 
                          ...visibilityConfig.transbordo,
                          velocidadeVazio: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Velocidade Vazio</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.transbordo.velocidadeCarregado}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        transbordo: { 
                          ...visibilityConfig.transbordo,
                          velocidadeCarregado: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Velocidade Carregado</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.transbordo.diesel}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        transbordo: { 
                          ...visibilityConfig.transbordo,
                          diesel: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Diesel</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.transbordo.tdh}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        transbordo: { 
                          ...visibilityConfig.transbordo,
                          tdh: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">TDH</Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={visibilityConfig.transbordo.impurezaVegetal}
                      onChange={(e) => setVisibilityConfig({ 
                        ...visibilityConfig, 
                        transbordo: { 
                          ...visibilityConfig.transbordo,
                          impurezaVegetal: e.target.checked 
                        }
                      })}
                      colorScheme="blackAlpha"
                      borderColor="black"
                      size="sm"
                    >
                      <Text color="black" fontSize="xs" whiteSpace="nowrap">Impureza Vegetal</Text>
                    </Checkbox>
                  </Grid>
                </Box>
              </Grid>
            </Box>
          </Grid>

          {/* Grid de Frentes */}
          <Box 
            flex="1" 
            overflowY="auto" 
            pb={3} // Adicionar padding para alinhar com a coluna da direita
          >
            <Grid 
              templateColumns={{ 
                base: "repeat(1, 1fr)", 
                sm: "repeat(2, 1fr)", 
                lg: "repeat(3, 1fr)", 
                xl: "repeat(4, 1fr)" 
              }} 
              gap={4} 
              width="100%"
            >
              {getSortedFrentes().map((frente) => (
                <Box 
                  key={frente.id} 
                  border="1px solid black" 
                  borderRadius="md"
                  overflow="hidden"
                  bg="white"
                  boxShadow="sm"
                >
                  <Heading 
                    size="sm" 
                    textAlign="center" 
                    color="white" 
                    bg="black" 
                    p={3}
                  >
                    {frente.nome}
                  </Heading>
                  
                  {/* Colhedoras */}
                  <Box 
                    height={frente.hasTransbordos ? "auto" : "100%"}
                  >
                    <Box 
                      p={2} 
                      bg="gray.50" 
                      borderBottom="1px solid" 
                      borderColor="gray.200"
                      textAlign="center"
                    >
                      <Text color="black" fontWeight="medium">Colhedoras</Text>
                    </Box>
                    
                    <Box 
                      height="140px" 
                      bg={dragOver[`${frente.id}:colhedoras`] ? "blue.50" : frente.colhedorasFile ? "gray.100" : "gray.50"} 
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexDirection="column"
                      onClick={() => handleFileUpload(frente.id, 'colhedoras')}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ bg: 'gray.200' }}
                      p={3}
                      border={dragOver[`${frente.id}:colhedoras`] ? "2px dashed blue" : "none"}
                      onDragEnter={(e) => handleDragEnter(frente.id, 'colhedoras', e)}
                      onDragLeave={(e) => handleDragLeave(frente.id, 'colhedoras', e)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(frente.id, 'colhedoras', e)}
                    >
                      {frente.colhedorasFile ? (
                        <>
                          <Flex 
                            bg="green.50" 
                            color="green.600" 
                            borderRadius="full" 
                            p={2}
                            mb={2}
                          >
                            <Icon as={FiCheck} w={6} h={6} />
                          </Flex>
                          <Text color="black" fontSize="sm" textAlign="center" fontWeight="medium">
                            Arquivo selecionado
                          </Text>
                          <Flex alignItems="center" justifyContent="center" width="100%" mt={1}>
                            <Text color="gray.600" fontSize="xs" noOfLines={1} maxW="70%">
                              {frente.colhedorasFile.name}
                            </Text>
                            <Button 
                              size="xs" 
                              colorScheme="red" 
                              ml={2} 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateFrenteFile(frente.id, 'colhedoras', null);
                                toast({
                                  title: "Arquivo removido",
                                  description: "O arquivo foi removido com sucesso.",
                                  status: "info",
                                  duration: 3000,
                                });
                              }}
                            >
                              Remover
                            </Button>
                          </Flex>
                        </>
                      ) : (
                        <>
                          <Flex 
                            bg="gray.100" 
                            color="gray.600" 
                            borderRadius="full" 
                            p={3}
                            mb={2}
                          >
                            <Icon as={FiFile} w={6} h={6} />
                          </Flex>
                          <Text color="gray.600" fontSize="sm">
                            {dragOver[`${frente.id}:colhedoras`] ? "Solte o arquivo aqui" : "Clique para selecionar"}
                          </Text>
                          <Text color="gray.500" fontSize="xs" mt={1}>
                            {dragOver[`${frente.id}:colhedoras`] ? "ou arraste e solte" : "ou arraste e solte aqui"}
                          </Text>
                          <Text color="gray.500" fontSize="xs" mt={0.5}>
                            Formato: .xlsx ou .zip
                          </Text>
                        </>
                      )}
                    </Box>
                  </Box>
                  
                  {/* Transbordos (apenas para frentes que não são zirleno) */}
                  {frente.hasTransbordos && (
                    <Box>
                      <Box 
                        p={2} 
                        bg="gray.50" 
                        borderTop="1px solid"
                        borderBottom="1px solid" 
                        borderColor="gray.200"
                        textAlign="center"
                      >
                        <Text color="black" fontWeight="medium">Transbordos</Text>
                      </Box>
                      
                      <Box 
                        height="140px" 
                        bg={dragOver[`${frente.id}:transbordos`] ? "blue.50" : frente.transbordosFile ? "gray.100" : "gray.50"} 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center"
                        flexDirection="column"
                        onClick={() => handleFileUpload(frente.id, 'transbordos')}
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ bg: 'gray.200' }}
                        p={3}
                        border={dragOver[`${frente.id}:transbordos`] ? "2px dashed blue" : "none"}
                        onDragEnter={(e) => handleDragEnter(frente.id, 'transbordos', e)}
                        onDragLeave={(e) => handleDragLeave(frente.id, 'transbordos', e)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(frente.id, 'transbordos', e)}
                      >
                        {frente.transbordosFile ? (
                          <>
                            <Flex 
                              bg="green.50" 
                              color="green.600" 
                              borderRadius="full" 
                              p={2}
                              mb={2}
                            >
                              <Icon as={FiCheck} w={6} h={6} />
                            </Flex>
                            <Text color="black" fontSize="sm" textAlign="center" fontWeight="medium">
                              Arquivo selecionado
                            </Text>
                            <Flex alignItems="center" justifyContent="center" width="100%" mt={1}>
                              <Text color="gray.600" fontSize="xs" noOfLines={1} maxW="70%">
                                {frente.transbordosFile.name}
                              </Text>
                              <Button 
                                size="xs" 
                                colorScheme="red" 
                                ml={2} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateFrenteFile(frente.id, 'transbordos', null);
                                  toast({
                                    title: "Arquivo removido",
                                    description: "O arquivo foi removido com sucesso.",
                                    status: "info",
                                    duration: 3000,
                                  });
                                }}
                              >
                                Remover
                              </Button>
                            </Flex>
                          </>
                        ) : (
                          <>
                            <Flex 
                              bg="gray.100" 
                              color="gray.600" 
                              borderRadius="full" 
                              p={3}
                              mb={2}
                            >
                              <Icon as={FiFile} w={6} h={6} />
                            </Flex>
                            <Text color="gray.600" fontSize="sm">
                              {dragOver[`${frente.id}:transbordos`] ? "Solte o arquivo aqui" : "Clique para selecionar"}
                            </Text>
                            <Text color="gray.500" fontSize="xs" mt={1}>
                              {dragOver[`${frente.id}:transbordos`] ? "ou arraste e solte" : "ou arraste e solte aqui"}
                            </Text>
                            <Text color="gray.500" fontSize="xs" mt={0.5}>
                              Formato: .xlsx ou .zip
                            </Text>
                          </>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              ))}
            </Grid>
          </Box>
        </Flex>

        {/* Coluna lateral direita com botões e resultados */}
        <Flex 
          direction="column" 
          height="100%" 
          gap={4}
          pb={3} // Adicionar padding para alinhar com a coluna da esquerda
        >
          {/* Container para botões */}
          <Box>
            <VStack spacing={3} width="100%">
              <Button
                leftIcon={<Icon as={FiList} />}
                bg="white"
                color="black"
                border="1px solid black"
                borderRadius="md"
                onClick={handleViewReports}
                _hover={{ bg: 'gray.100' }}
                width="100%"
                height="45px"
              >
                Lista de Relatórios
              </Button>
              
              <Button
                leftIcon={<Icon as={FiDownload} />}
                bg="black"
                color="white"
                onClick={handleProcessAll}
                isLoading={isProcessing}
                loadingText={isProcessing ? 
                  `Processando ${processedCount + 1}/${totalItems}` : 
                  'Gerar'}
                isDisabled={!isFormValid() || isProcessing}
                _hover={{ bg: 'gray.700' }}
                width="100%"
                height="45px"
              >
                Gerar
              </Button>

              {/* Indicador de progresso */}
              {isProcessing && (
                <Box width="100%" pt={1}>
                  <Text fontSize="xs" color="gray.600" mb={1} textAlign="center">
                    Progresso: {processedCount}/{totalItems}
                  </Text>
                  <Box bg="gray.100" height="6px" width="100%" borderRadius="full" overflow="hidden">
                    <Box 
                      bg="green.400" 
                      height="100%" 
                      width={`${progress}%`}
                      transition="width 0.3s ease-in-out"
                    />
                  </Box>
                </Box>
              )}
              
              {/* Contador de resultados */}
              {!isProcessing && Object.keys(processedItems).length > 0 && (
                <Box width="100%" pt={1}>
                  <Text fontSize="xs" color="gray.600" textAlign="center">
                    {Object.values(processedItems).filter(i => i.success).length > 0 
                      ? `${Object.values(processedItems).filter(i => i.success).length} relatório(s) gerado(s)`
                      : "Nenhum relatório gerado"}
                    {Object.values(processedItems).filter(i => !i.success && !i.inProgress).length > 0 && 
                      ` • ${Object.values(processedItems).filter(i => !i.success && !i.inProgress).length} falha(s)`}
                  </Text>
                </Box>
              )}
            </VStack>
          </Box>
          
          {/* Resultados do Processamento */}
          {Object.keys(processedItems).length > 0 && (
            <Box 
              border="1px solid black" 
              borderRadius="md" 
              bg="white"
              boxShadow="sm"
              overflow="hidden"
              flex="1"
              display="flex"
              flexDirection="column"
            >
              <Heading 
                size="sm" 
                textAlign="center" 
                color="white" 
                bg="black" 
                p={2}
              >
                Resultados
              </Heading>
              
              <Box p={2} overflowY="auto" flex="1">
                <VStack spacing={2} align="stretch">
                  {Object.entries(processedItems).map(([key, item]) => {
                    const [frenteId, fileType] = key.split(':');
                    const frente = frentesData.find(f => f.id === frenteId);
                    const frenteName = frente ? frente.nome : frenteId;
                    
                    // Criar abreviação para a frente
                    let abreviacao = "";
                    if (frenteName.includes("3") || frenteName.includes("Alexandrita")) {
                      abreviacao = "F3";
                    } else if (frenteName.includes("4") || frenteName.includes("Ituiutaba")) {
                      abreviacao = "F4";
                    } else if (frenteName.includes("8") || frenteName.includes("Canápolis")) {
                      abreviacao = "F8";
                    } else if (frenteName.includes("Zirleno")) {
                      abreviacao = "Zirleno";
                    } else {
                      abreviacao = frenteName.substring(0, 3);
                    }
                    
                    // Adicionar tipo
                    abreviacao += " " + (fileType === 'colhedoras' ? "CD" : "TT");
                    
                    return (
                      <Box 
                        key={key} 
                        border="1px solid" 
                        borderColor={item.inProgress ? "blue.200" : item.success ? "green.200" : "red.200"}
                        borderRadius="md"
                        p={2}
                        bg={item.inProgress ? "blue.50" : item.success ? "green.50" : "red.50"}
                      >
                        <Flex justify="space-between" align="center" mb={2}>
                          <HStack>
                            <Icon 
                              as={item.inProgress ? FiUpload : item.success ? FiCheck : FiUpload} 
                              color={item.inProgress ? "blue.500" : item.success ? "green.500" : "red.500"}
                              boxSize={4}
                            />
                            <Text fontWeight="bold" fontSize="sm" color="black">
                              {abreviacao}
                            </Text>
                          </HStack>
                          
                          {item.success && item.id && (
                            <Button
                              size="xs" 
                              colorScheme="green" 
                              leftIcon={<Icon as={FiEye} />}
                              onClick={() => handleViewReport(item as any)}
                            >
                              Ver
                            </Button>
                          )}
                        </Flex>

                        {item.success && item.id && (
                          <Flex justify="space-between" align="center">
                            <Text fontSize="xs" color="green.600">
                              Processado com sucesso
                            </Text>
                            <Button
                              size="xs"
                              colorScheme="blue"
                              leftIcon={<Icon as={FiDownload} />}
                              onClick={() => handleDownloadPDF(item as any)}
                            >
                              Download
                            </Button>
                          </Flex>
                        )}
                        
                        {!item.success && !item.inProgress && (
                          <Button
                            size="xs" 
                            colorScheme="red" 
                            leftIcon={<Icon as={FiUpload} />}
                            onClick={() => handleRetryItem(frenteId, fileType as 'colhedoras' | 'transbordos')}
                          >
                            Retry
                          </Button>
                        )}
                        
                        {/* Status para casos de erro ou processando */}
                        {(item.inProgress || (!item.success && !item.inProgress)) && (
                          <Text fontSize="xs" mt={1} color={item.inProgress ? "blue.600" : "red.600"}>
                            {item.inProgress ? "Processando..." : 
                            `Falha: ${item.error?.substring(0, 40)}${item.error && item.error.length > 40 ? '...' : ''}`}
                          </Text>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
            </Box>
          )}
        </Flex>
      </Grid>
    </Box>
  );
} 