'use client';

import React, { useState, useEffect } from 'react';
import MapContainer from '../../../components/MapContainer';
import { useSearchParams } from 'next/navigation';

// Tipo para os dados do relatório
interface ReportData {
  id: string;
  tipo: string;
  frente: string;
  data: string;
  dados: any;
  status: string;
}

const ReportVisualization: React.FC = () => {
  const searchParams = useSearchParams();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const reportId = searchParams.get('id');
  
  useEffect(() => {
    const fetchReportData = async () => {
      if (!reportId) {
        setError('ID do relatório não fornecido');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Substitua pela sua URL real de API
        const response = await fetch(`/api/reports/${reportId}`);
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar relatório: ${response.statusText}`);
        }
        
        const data = await response.json();
        setReport(data);
      } catch (err) {
        setError(`Erro ao carregar o relatório: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [reportId]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-4">Carregando relatório...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p><strong>Erro:</strong> {error}</p>
        </div>
      </div>
    );
  }
  
  if (!report) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Nenhum relatório encontrado com o ID fornecido.</p>
        </div>
      </div>
    );
  }
  
  // Extrair dados do mapa do relatório
  const mapData = {
    map_data: report.dados.map_data,
    rastros: report.dados.rastros
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Relatório: {report.tipo}</h1>
        <p className="text-gray-600">
          <span className="font-medium">Data:</span> {new Date(report.data).toLocaleDateString('pt-BR')} | 
          <span className="font-medium ml-2">Frente:</span> {report.frente}
        </p>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Mapa de Rastros</h2>
        <div className="rounded-lg overflow-hidden">
          <MapContainer data={mapData} height="600px" />
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Dados do Relatório</h2>
        
        {/* Adicione aqui outros componentes para visualização de dados
             conforme os requisitos específicos do seu relatório */}
             
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <details>
            <summary className="cursor-pointer text-blue-600 font-medium">
              Dados JSON do relatório
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 overflow-x-auto max-h-96 text-xs">
              {JSON.stringify(report, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};

export default ReportVisualization; 