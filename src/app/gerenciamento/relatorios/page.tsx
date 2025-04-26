'use client';

import { useState, useEffect, useRef } from 'react';
import { FiEye, FiUpload, FiRefreshCw, FiCheck } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import * as XLSX from 'xlsx';

export default function RelatoriosPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [reportType, setReportType] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedFrente, setSelectedFrente] = useState<string>('');
  const [selectedFrentes, setSelectedFrentes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [processingDetails, setProcessingDetails] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>("relatorios");
  
  // Configurações de visualização para Colheita
  const [colheitaVisibility, setColheitaVisibility] = useState({
    disponibilidadeMecanica: true,
    eficienciaEnergetica: true,
    horaElevador: true,
    motorOcioso: true,
    usoGPS: true,
    mediaVelocidade: true
  });
  
  // Configurações de visualização para Transbordo
  const [transbordoVisibility, setTransbordoVisibility] = useState({
    disponibilidadeMecanica: true,
    eficienciaEnergetica: true,
    motorOcioso: true,
    faltaApontamento: true,
    usoGPS: true,
    mediaVelocidade: true
  });
  
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

  // Estado para prévia do Excel
  const [excelPreview, setExcelPreview] = useState<{
    headers: string[];
    rows: any[][];
  } | null>(null);

  // Atualizar a função de seleção de arquivo para mostrar prévia
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      showToast(`Arquivo selecionado: ${file.name}`, "success");
      
      try {
        // Gerar prévia do Excel
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        // Pegar a primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length > 0) {
          const headers = Object.keys(jsonData[0] as object);
          const rows = jsonData.slice(0, 5).map(row => 
            headers.map(header => (row as any)[header])
          );
          
          setExcelPreview({ headers, rows });
        }
      } catch (error) {
        console.error('Erro ao processar arquivo Excel:', error);
        showToast("Erro ao ler arquivo Excel", "error");
      }
    }
  };

  // Também atualizar handleDrop para mostrar prévia
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      showToast(`Arquivo selecionado: ${file.name}`, "success");

      try {
        // Gerar prévia do Excel
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        // Pegar a primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length > 0) {
          const headers = Object.keys(jsonData[0] as object);
          const rows = jsonData.slice(0, 5).map(row => 
            headers.map(header => (row as any)[header])
          );
          
          setExcelPreview({ headers, rows });
        }
      } catch (error) {
        console.error('Erro ao processar arquivo Excel:', error);
        showToast("Erro ao ler arquivo Excel", "error");
      }
    }
  };

  // Função para lidar com o clique no botão de upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Função para lidar com a seleção de múltiplas frentes usando checkboxes
  const handleFrentesCheckboxChange = (frenteId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedFrentes(prev => [...prev, frenteId]);
    } else {
      setSelectedFrentes(prev => prev.filter(id => id !== frenteId));
    }
  };

  // Função para modificar as configurações de visualização de colheita
  const handleColheitaVisibilityChange = (field: string, value: boolean) => {
    setColheitaVisibility(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Função para modificar as configurações de visualização de transbordo
  const handleTransbordoVisibilityChange = (field: string, value: boolean) => {
    setTransbordoVisibility(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Mock - verificar se a seleção de frentes usa checkboxes (será integrado com configManager)
  const useFrentesCheckbox = reportType === 'comparativo_unidades_diario';

  // Verificar se o upload de Excel está habilitado para este tipo de relatório
  const showExcelUpload = true; // Mock - será integrado com configManager

  // Mock da função para carregar configurações
  const handleReloadConfig = async () => {
    // Simulação de carregamento
    setIsConfigLoaded(true);
    
    // Mostrar mensagem de sucesso
    showToast("Configurações recarregadas", "success");
  };

  // Função para mostrar notificações
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    // Implementação básica de toast usando DOM API
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-md z-50 ${
      type === 'success' ? 'bg-green-500' 
      : type === 'error' ? 'bg-red-500' 
      : 'bg-blue-500'
    } text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remover após 3 segundos
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  // Função auxiliar para simular o processamento do relatório
  const simulateProcessing = async () => {
    // Passo 1: Processando Zip
    setProcessingStep(1);
    setProcessingDetails(`colhedorasFrenteX-${Math.floor(Math.random() * 5000)}.zip`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Passo 2: Processando Excel
    setProcessingStep(2);
    setProcessingDetails(`colhedorasFrenteX-${Math.floor(Math.random() * 5000)}.xlsx`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Passo 3: Registrando dados
    setProcessingStep(3);
    setProcessingDetails("gravando dados na base");
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Passo 4: Gerando relatório
    setProcessingStep(4);
    setProcessingDetails("Preenchendo cards, gráficos e tabelas");
    await new Promise(resolve => setTimeout(resolve, 1500));
  };

  const handleGenerateReport = async () => {
    if (!reportType || 
       (isWeeklyReport ? (!startDate || !endDate) : !selectedDate) || 
       (!useFrentesCheckbox && !selectedFrente) || 
       (useFrentesCheckbox && selectedFrentes.length === 0)) {
      showToast("Por favor, selecione o tipo de relatório, data(s) e frente(s)", "error");
      return;
    }

    setIsLoading(true);
    
    try {
      // Simular processo de geração de relatório
      await simulateProcessing();
      
      showToast("Relatório gerado com sucesso", "success");
      
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
      showToast("Ocorreu um erro ao processar sua solicitação", "error");
    } finally {
      setIsLoading(false);
      setProcessingStep(0);
      setProcessingDetails('');
    }
  };

  const handleViewReports = () => {
    setActiveTab("visualizacao");
    showToast("Visualização de relatórios em desenvolvimento", "info");
  };

  // Estado para listagem de relatórios
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [loadingLista, setLoadingLista] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;
  const [relatorioParaExcluir, setRelatorioParaExcluir] = useState<{ id: string, isSemanal: boolean } | null>(null);

  // Carregar relatórios (diários e semanais) usando o cliente Supabase direto
  useEffect(() => {
    const carregarRelatorios = async () => {
      setLoadingLista(true);
      try {
        // Buscar relatórios diários
        const { data: diarios, error: errorDiarios } = await supabase
          .from('relatorios_diarios')
          .select('*');
        
        if (errorDiarios) throw errorDiarios;
        
        // Buscar relatórios semanais
        const { data: semanais, error: errorSemanis } = await supabase
          .from('relatorios_semanais')
          .select('*');
        
        if (errorSemanis) throw errorSemanis;
        
        // Formatar e combinar os dados
        const diariosFmt = (diarios || []).map((item: any) => ({
          ...item,
          isSemanal: false,
          periodo: item.data,
          periodo_fim: null
        }));
        
        const semanaisFmt = (semanais || []).map((item: any) => ({
          ...item,
          isSemanal: true,
          periodo: item.data_inicio,
          periodo_fim: item.data_fim
        }));
        
        // Combinar e ordenar por data de criação (mais recente primeiro)
        const todosDados = [...diariosFmt, ...semanaisFmt].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setRelatorios(todosDados);
      } catch (e) {
        console.error('Erro ao carregar relatórios:', e);
        setRelatorios([]);
      } finally {
        setLoadingLista(false);
      }
    };
    
    carregarRelatorios();
  }, []);

  // Função para excluir relatório
  const excluirRelatorio = async (id: string, isSemanal: boolean) => {
    const tabela = isSemanal ? 'relatorios_semanais' : 'relatorios_diarios';
    
    const { error } = await supabase
      .from(tabela)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao excluir:', error);
      showToast("Erro ao excluir relatório", "error");
      return;
    }
    
    setRelatorioParaExcluir(null);
    setRelatorios(relatorios.filter(r => r.id !== id));
    showToast("Relatório excluído com sucesso", "success");
  };

  // Filtro global
  const filteredRelatorios = relatorios.filter((r) => {
    const search = searchTerm.toLowerCase();
    return (
      (r.tipo?.toLowerCase().includes(search) || "") ||
      (r.frente?.toLowerCase().includes(search) || "") ||
      (r.status?.toLowerCase().includes(search) || "") ||
      (r.periodo && r.periodo.toString().includes(search)) ||
      (r.periodo_fim && r.periodo_fim.toString().includes(search))
    );
  });

  // Paginação
  const totalPages = Math.ceil(filteredRelatorios.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredRelatorios.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-2">
          <TabsTrigger value="relatorios" className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground">
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="visualizacao" className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground">
            Visualização
          </TabsTrigger>
        </TabsList>
        <div className="flex-1 p-2">
          <TabsContent value="relatorios" className="h-full m-0">
            {/* Layout principal com 3 painéis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Painel de Opções */}
              <div className="border border-gray-300 rounded-md p-4">
                <h2 className="text-lg font-bold text-center mb-4">Opções</h2>
                <div className="flex flex-col space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Tipo de Relatório <span className="text-red-500">*</span>
                    </label>
                    <select 
                      className="w-full border border-gray-300 rounded-md p-2"
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      <option value="">Selecione o tipo de relatório</option>
                      {tiposRelatorio.map(tipo => (
                        <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Frente <span className="text-red-500">*</span>
                    </label>
                    <select 
                      className="w-full border border-gray-300 rounded-md p-2"
                      value={selectedFrente}
                      onChange={(e) => setSelectedFrente(e.target.value)}
                    >
                      <option value="">Selecione a frente</option>
                      {frentesDisponiveis.map(frente => (
                        <option key={frente.id} value={frente.id}>{frente.nome}</option>
                      ))}
                    </select>
                  </div>

                  {isWeeklyReport ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Data Inicial <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="date" 
                          className="w-full border border-gray-300 rounded-md p-2"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Data Final <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="date" 
                          className="w-full border border-gray-300 rounded-md p-2"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Data <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="date" 
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Painel de Visualização */}
              <div className="border border-gray-300 rounded-md p-4">
                <h2 className="text-lg font-bold text-center mb-4">Visualização</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Configurações de Colheita */}
                  <div>
                    <h3 className="font-medium mb-2">Colheita</h3>
                    <div className="space-y-1">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="mr-2"
                          checked={colheitaVisibility.disponibilidadeMecanica}
                          onChange={(e) => handleColheitaVisibilityChange('disponibilidadeMecanica', e.target.checked)}
                        />
                        Disponibilidade Mecânica
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="mr-2"
                          checked={colheitaVisibility.eficienciaEnergetica}
                          onChange={(e) => handleColheitaVisibilityChange('eficienciaEnergetica', e.target.checked)}
                        />
                        Eficiência Energética
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="mr-2"
                          checked={colheitaVisibility.horaElevador}
                          onChange={(e) => handleColheitaVisibilityChange('horaElevador', e.target.checked)}
                        />
                        Hora Elevador
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="mr-2"
                          checked={colheitaVisibility.motorOcioso}
                          onChange={(e) => handleColheitaVisibilityChange('motorOcioso', e.target.checked)}
                        />
                        Motor Ocioso
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="mr-2"
                          checked={colheitaVisibility.usoGPS}
                          onChange={(e) => handleColheitaVisibilityChange('usoGPS', e.target.checked)}
                        />
                        Uso GPS
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="mr-2"
                          checked={colheitaVisibility.mediaVelocidade}
                          onChange={(e) => handleColheitaVisibilityChange('mediaVelocidade', e.target.checked)}
                        />
                        Média Velocidade
                      </label>
                    </div>
                  </div>
                  
                  {/* Configurações de Transbordo */}
                  <div>
                    <h3 className="font-medium mb-2">Transbordo</h3>
                    <div className="space-y-1">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="mr-2"
                          checked={transbordoVisibility.disponibilidadeMecanica}
                          onChange={(e) => handleTransbordoVisibilityChange('disponibilidadeMecanica', e.target.checked)}
                        />
                        Disponibilidade Mecânica
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="mr-2"
                          checked={transbordoVisibility.eficienciaEnergetica}
                          onChange={(e) => handleTransbordoVisibilityChange('eficienciaEnergetica', e.target.checked)}
                        />
                        Eficiência Energética
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="mr-2"
                          checked={transbordoVisibility.motorOcioso}
                          onChange={(e) => handleTransbordoVisibilityChange('motorOcioso', e.target.checked)}
                        />
                        Motor Ocioso
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="mr-2"
                          checked={transbordoVisibility.faltaApontamento}
                          onChange={(e) => handleTransbordoVisibilityChange('faltaApontamento', e.target.checked)}
                        />
                        Falta de Apontamento
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="mr-2"
                          checked={transbordoVisibility.usoGPS}
                          onChange={(e) => handleTransbordoVisibilityChange('usoGPS', e.target.checked)}
                        />
                        Uso GPS
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="mr-2"
                          checked={transbordoVisibility.mediaVelocidade}
                          onChange={(e) => handleTransbordoVisibilityChange('mediaVelocidade', e.target.checked)}
                        />
                        Média Velocidade
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Painel de Upload */}
              <div className="border border-gray-300 rounded-md p-4">
                <h2 className="text-lg font-bold text-center mb-4">Upload do arquivo Monit</h2>
                
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-md p-8 flex flex-col items-center justify-center cursor-pointer"
                  onClick={handleUploadClick}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept=".xlsx,.xls,.csv,.zip" 
                    onChange={handleFileSelect}
                  />
                  
                  <svg 
                    className="w-10 h-10 text-gray-400 mb-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  
                  <p className="text-sm text-center text-gray-600">
                    {selectedFile ? selectedFile.name : "Arraste um arquivo Excel ou clique para selecionar"}
                  </p>
                </div>

                {/* Prévia do Excel */}
                {excelPreview && (
                  <div className="mt-4 border border-gray-200 rounded-md">
                    <h3 className="p-2 bg-gray-50 font-medium border-b">Prévia do arquivo</h3>
                    <div className="max-h-[200px] overflow-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            {excelPreview.headers.map((header, idx) => (
                              <th key={idx} className="px-3 py-2 text-left font-medium text-gray-500">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {excelPreview.rows.map((row, rowIdx) => (
                            <tr key={rowIdx} className="border-t border-gray-200">
                              {row.map((cell, cellIdx) => (
                                <td key={cellIdx} className="px-3 py-2">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-center">
                  <button
                    className={`px-4 py-2 rounded-md flex items-center justify-center ${
                      isLoading 
                        ? 'bg-gray-500 text-white cursor-not-allowed' 
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                    onClick={handleGenerateReport}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processando..." : "Gerar Relatório"}
                  </button>
                </div>
              </div>
            </div>

            {/* Indicadores de Progresso */}
            {processingStep > 0 && (
              <div className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className={`p-4 border rounded-md ${processingStep >= 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="flex items-start">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${processingStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                        {processingStep > 1 ? <FiCheck className="w-4 h-4" /> : "1"}
                      </div>
                      <div>
                        <h3 className="font-medium">Processando Zip</h3>
                        {processingStep === 1 && processingDetails && (
                          <p className="text-xs text-gray-500">{processingDetails}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-4 border rounded-md ${processingStep >= 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="flex items-start">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${processingStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                        {processingStep > 2 ? <FiCheck className="w-4 h-4" /> : "2"}
                      </div>
                      <div>
                        <h3 className="font-medium">Processando .xlsx</h3>
                        {processingStep === 2 && processingDetails && (
                          <p className="text-xs text-gray-500">{processingDetails}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-4 border rounded-md ${processingStep >= 3 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="flex items-start">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${processingStep >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                        {processingStep > 3 ? <FiCheck className="w-4 h-4" /> : "3"}
                      </div>
                      <div>
                        <h3 className="font-medium">Registrando dados</h3>
                        {processingStep === 3 && processingDetails && (
                          <p className="text-xs text-gray-500">{processingDetails}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-4 border rounded-md ${processingStep >= 4 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="flex items-start">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${processingStep >= 4 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                        {processingStep > 4 ? <FiCheck className="w-4 h-4" /> : "4"}
                      </div>
                      <div>
                        <h3 className="font-medium">Gerando relatório</h3>
                        {processingStep === 4 && processingDetails && (
                          <p className="text-xs text-gray-500">{processingDetails}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="visualizacao" className="h-full m-0">
            {/* Busca global */}
            <div className="flex justify-between items-center mb-4">
              <div className="w-[400px]">
                <Input
                  placeholder="Buscar por tipo, frente, status ou data..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="h-9"
                />
              </div>
            </div>
            {/* Tabela */}
            <div className="overflow-auto flex-1 border border-gray-200 rounded-lg">
              <Table>
                <TableHeader className="bg-black sticky top-0">
                  <TableRow className="h-[47px]">
                    <TableHead className="text-white font-medium px-3">Data/Período</TableHead>
                    <TableHead className="text-white font-medium px-3">Tipo</TableHead>
                    <TableHead className="text-white font-medium px-3">Frente</TableHead>
                    <TableHead className="text-white font-medium px-3">Status</TableHead>
                    <TableHead className="text-white font-medium px-3">Teste</TableHead>
                    <TableHead className="text-white font-medium px-3 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLista ? (
                    <TableRow><TableCell colSpan={6} className="text-center p-8">Carregando...</TableCell></TableRow>
                  ) : paginatedData.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center p-8">Nenhum relatório encontrado</TableCell></TableRow>
                  ) : paginatedData.map(relatorio => (
                    <TableRow key={relatorio.id} className="h-[47px] hover:bg-gray-50 border-b border-gray-200">
                      <TableCell className="px-3 py-0 border-x border-gray-100">
                        {relatorio.isSemanal ? (
                          <span className="inline-flex items-center gap-2"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Semanal</span> {relatorio.periodo} - {relatorio.periodo_fim}</span>
                        ) : relatorio.periodo}
                      </TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">{relatorio.tipo}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">{relatorio.frente}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">{relatorio.status}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">{relatorio.is_teste ? 'Sim' : 'Não'}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100 text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.open(`/relatorios/visualizacao/a4/${relatorio.tipo}${relatorio.isSemanal ? '-semanal' : ''}?id=${relatorio.id}`, '_blank')}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => setRelatorioParaExcluir({ id: relatorio.id, isSemanal: relatorio.isSemanal })}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Paginação */}
            <div className="flex items-center justify-between mt-2">
              <div className="text-sm text-gray-500">
                Mostrando {startIndex + 1} a {Math.min(startIndex + rowsPerPage, filteredRelatorios.length)} de {filteredRelatorios.length} resultados
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                <span className="text-sm text-gray-600">Página {currentPage} de {totalPages}</span>
                <Button variant="outline" size="sm" className="h-7" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}><ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            {/* Modal de confirmação de exclusão */}
            {relatorioParaExcluir && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
                  <div className="font-bold mb-2">Excluir Relatório</div>
                  <div className="mb-4">Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.</div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setRelatorioParaExcluir(null)}>Cancelar</Button>
                    <Button className="bg-red-500 text-white" onClick={() => excluirRelatorio(relatorioParaExcluir.id, relatorioParaExcluir.isSemanal)}>Excluir</Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
} 