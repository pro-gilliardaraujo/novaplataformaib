'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Grid,
  GridItem,
  Flex,
  Select,
  Input,
  Button,
  Text,
  useToast,
  VStack,
  FormControl,
  FormLabel,
  Checkbox,
  CheckboxGroup,
  Icon,
} from '@chakra-ui/react';
import { FiEye, FiUpload, FiRefreshCw } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function RelatoriosPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [reportType, setReportType] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedFrente, setSelectedFrente] = useState<string>('');
  const [selectedFrentes, setSelectedFrentes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  
  // Verificar se é um relatório semanal
  const isWeeklyReport = reportType ? reportType.includes('semanal') : false;
  
  // Dados mockados para demonstração - serão substituídos pela integração real
  const tiposRelatorio = [
    { id: 'colheita_diario', nome: 'Colheita - Diário' },
    { id: 'colheita_semanal', nome: 'Colheita - Semanal' },
    { id: 'transbordo_diario', nome: 'Transbordo - Diário' },
    { id: 'transbordo_semanal', nome: 'Transbordo - Semanal' }
  ];
  
  const frentesDisponiveis = [
    { id: 'frente1', nome: 'Frente 4 - BP Ituiutaba' },
    { id: 'frente2', nome: 'Frente 8 - CMAA Canápolis' },
    { id: 'frente3', nome: 'Frente 3 - Alexandrita' },
    { id: 'frente4', nome: 'Frente Zirleno' }
  ];

  // Configurando a data de ontem como padrão
  useEffect(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const defaultDate = yesterday.toISOString().split('T')[0];
    setSelectedDate(defaultDate);
  }, []);

  // Função para lidar com a seleção de múltiplas frentes usando checkboxes
  const handleFrentesCheckboxChange = (frenteId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedFrentes(prev => [...prev, frenteId]);
    } else {
      setSelectedFrentes(prev => prev.filter(id => id !== frenteId));
    }
  };

  // Mock - verificar se a seleção de frentes usa checkboxes (será integrado com configManager)
  const useFrentesCheckbox = reportType === 'comparativo_unidades_diario';

  // Verificar se o upload de Excel está habilitado para este tipo de relatório
  const showExcelUpload = true; // Mock - será integrado com configManager

  // Mock da função para carregar configurações
  const handleReloadConfig = async () => {
    toast({
      title: "Recarregando configurações",
      status: "info",
      duration: 2000,
    });
    // Simulação de carregamento
    setIsConfigLoaded(true);
  };

  const handleGenerateReport = async () => {
    if (!reportType || 
       (isWeeklyReport ? (!startDate || !endDate) : !selectedDate) || 
       (!useFrentesCheckbox && !selectedFrente) || 
       (useFrentesCheckbox && selectedFrentes.length === 0)) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione o tipo de relatório, data(s) e frente(s).",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Simular processamento - será substituído pela integração real
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Relatório gerado com sucesso",
        status: "success",
        duration: 3000,
      });
      
      // Navegar para página de visualização do relatório
      const baseRoute = `/gerenciamento/relatorios/visualizacao/a4/`;
      let route;
      
      if (reportType === 'colheita_diario') {
        route = `${baseRoute}colheita?frente=${selectedFrente}&data=${selectedDate}`;
      } else if (reportType === 'colheita_semanal') {
        route = `${baseRoute}colheita-semanal?frente=${selectedFrente}&inicio=${startDate}&fim=${endDate}`;
      } else if (reportType === 'transbordo_diario') {
        route = `${baseRoute}transbordo?frente=${selectedFrente}&data=${selectedDate}`;
      } else if (reportType === 'transbordo_semanal') {
        route = `${baseRoute}transbordo-semanal?frente=${selectedFrente}&inicio=${startDate}&fim=${endDate}`;
      }
      
      if (route) {
        router.push(route);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao processar sua solicitação.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={5}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">Relatórios</Heading>
        <Button 
          size="sm" 
          leftIcon={<Icon as={FiRefreshCw} />}
          onClick={handleReloadConfig} 
          colorScheme="blue"
          variant="outline"
        >
          Recarregar configurações
        </Button>
      </Flex>

      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
        <GridItem>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Tipo de Relatório</FormLabel>
              <Select 
                placeholder="Selecione o tipo de relatório" 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                {tiposRelatorio.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                ))}
              </Select>
            </FormControl>

            {isWeeklyReport ? (
              <Flex gap={4}>
                <FormControl isRequired>
                  <FormLabel>Data Inicial</FormLabel>
                  <Input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Data Final</FormLabel>
                  <Input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </FormControl>
              </Flex>
            ) : (
              <FormControl isRequired>
                <FormLabel>Data</FormLabel>
                <Input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </FormControl>
            )}

            {useFrentesCheckbox ? (
              <FormControl isRequired>
                <FormLabel>Frentes</FormLabel>
                <CheckboxGroup colorScheme="blue" value={selectedFrentes}>
                  <VStack align="start" spacing={2}>
                    {frentesDisponiveis.map(frente => (
                      <Checkbox 
                        key={frente.id} 
                        value={frente.id}
                        onChange={(e) => handleFrentesCheckboxChange(frente.id, e.target.checked)}
                      >
                        {frente.nome}
                      </Checkbox>
                    ))}
                  </VStack>
                </CheckboxGroup>
              </FormControl>
            ) : (
              <FormControl isRequired>
                <FormLabel>Frente</FormLabel>
                <Select 
                  placeholder="Selecione a frente"
                  value={selectedFrente}
                  onChange={(e) => setSelectedFrente(e.target.value)}
                >
                  {frentesDisponiveis.map(frente => (
                    <option key={frente.id} value={frente.id}>{frente.nome}</option>
                  ))}
                </Select>
              </FormControl>
            )}
          </VStack>
        </GridItem>

        <GridItem>
          <Box 
            border="1px dashed" 
            borderColor="gray.300" 
            p={6} 
            borderRadius="md" 
            height="100%"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
          >
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              Visualizador de Relatórios
            </Text>
            <Text textAlign="center" mb={6} color="gray.600">
              Configure as opções ao lado e gere um relatório para visualizar
            </Text>
            <Button
              colorScheme="blue"
              leftIcon={<Icon as={FiEye} />}
              onClick={handleGenerateReport}
              isLoading={isLoading}
              isDisabled={!reportType || (isWeeklyReport ? (!startDate || !endDate) : !selectedDate) || (!useFrentesCheckbox && !selectedFrente) || (useFrentesCheckbox && selectedFrentes.length === 0)}
              size="lg"
              width="100%"
              maxWidth="300px"
            >
              Gerar Relatório
            </Button>
          </Box>
        </GridItem>
      </Grid>

      <Box mt={10}>
        <Text fontSize="sm" color="gray.500">
          Nota: Os relatórios serão gerados com base nos dados disponíveis no sistema.
          Certifique-se de que todos os dados necessários foram carregados.
        </Text>
      </Box>
    </Box>
  );
} 