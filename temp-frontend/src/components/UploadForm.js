import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UploadForm.css';

const API_URL = 'http://localhost:8000';

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [reportType, setReportType] = useState('colheita');
  const [frente, setFrente] = useState('');
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [oldFlowStatus, setOldFlowStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  
  // Função para verificar o status do processamento no fluxo antigo
  const checkOldFlowStatus = async (reportId, statusUrl) => {
    if (!reportId || !statusUrl) return;
    
    try {
      setCheckingStatus(true);
      const response = await axios.get(`${API_URL}${statusUrl}`);
      setOldFlowStatus(response.data);
      
      // Se ainda estiver processando, verificar novamente em 3 segundos
      if (response.data.status === 'processing') {
        setTimeout(() => checkOldFlowStatus(reportId, statusUrl), 3000);
      } else if (response.data.status === 'completed') {
        // Se completou, verificar se tem URL de redirecionamento
        if (response.data.redirect_url) {
          // Abrir a página de visualização do relatório
          window.open(`${API_URL}${response.data.redirect_url}`, '_blank');
        }
      }
    } catch (err) {
      console.error('Erro ao verificar status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setOldFlowStatus(null);
    
    if (!file) {
      setError('Por favor, selecione um arquivo ZIP para upload.');
      return;
    }
    
    setLoading(true);
    
    // Criar FormData para o upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('report_type', reportType);
    
    if (frente) formData.append('frente', frente);
    if (data) formData.append('data', data);
    
    try {
      // Fazer o upload do arquivo
      const response = await axios.post(
        `${API_URL}/reports/upload-zip`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      setResult(response.data);
      
      // Se houver arquivos gerados, abrir o primeiro em uma nova aba
      if (response.data.output_files && response.data.output_files.length > 0) {
        const fileUrl = `${API_URL}${response.data.output_files[0].url}`;
        window.open(fileUrl, '_blank');
        
        // Verificar se temos informações do fluxo antigo
        const firstFile = response.data.output_files[0];
        if (firstFile.old_flow_id && firstFile.old_flow_status_url) {
          // Iniciar a verificação do status do fluxo antigo
          checkOldFlowStatus(firstFile.old_flow_id, firstFile.old_flow_status_url);
        }
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      setError(err.response?.data?.detail || 'Ocorreu um erro ao processar o arquivo.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="upload-container">
      <h2>Upload de Relatórios</h2>
      
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="file">Arquivo ZIP:</label>
          <input 
            type="file" 
            id="file" 
            accept=".zip" 
            onChange={handleFileChange} 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="reportType">Tipo de Relatório:</label>
          <select 
            id="reportType" 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="colheita">Colheita</option>
            <option value="transbordo">Transbordo</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="frente">Frente (opcional):</label>
          <input 
            type="text" 
            id="frente" 
            value={frente} 
            onChange={(e) => setFrente(e.target.value)} 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="data">Data (opcional):</label>
          <input 
            type="date" 
            id="data" 
            value={data} 
            onChange={(e) => setData(e.target.value)} 
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-button" 
          disabled={loading}
        >
          {loading ? 'Processando...' : 'Enviar Arquivo'}
        </button>
      </form>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="result-container">
          <h3>Processamento Concluído</h3>
          <p><strong>Status:</strong> {result.status}</p>
          <p><strong>Mensagem:</strong> {result.message}</p>
          
          {result.output_files && result.output_files.length > 0 ? (
            <>
              <h4>Arquivos Gerados:</h4>
              <ul className="file-list">
                {result.output_files.map((file, index) => (
                  <li key={index}>
                    <a href={`${API_URL}${file.url}`} target="_blank" rel="noopener noreferrer">
                      {file.filename}
                    </a>
                    <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                    {file.old_flow_id && (
                      <span className="old-flow-info"> - Em processamento no fluxo antigo</span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>Nenhum arquivo foi gerado durante o processamento.</p>
          )}
          
          {oldFlowStatus && (
            <div className="old-flow-status">
              <h4>Status do Processamento Antigo:</h4>
              <p><strong>Status:</strong> {oldFlowStatus.status}</p>
              {oldFlowStatus.status === 'processing' && (
                <p>Processando... Por favor aguarde.</p>
              )}
              {oldFlowStatus.status === 'completed' && (
                <>
                  <p>Processamento concluído com sucesso!</p>
                  {oldFlowStatus.redirect_url && (
                    <a 
                      href={`${API_URL}${oldFlowStatus.redirect_url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-button"
                    >
                      Visualizar Relatório Final
                    </a>
                  )}
                </>
              )}
              {oldFlowStatus.status === 'error' && (
                <p className="error-text">Erro: {oldFlowStatus.error}</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {checkingStatus && (
        <div className="loading-indicator">
          <p>Verificando status do processamento...</p>
        </div>
      )}
    </div>
  );
};

export default UploadForm; 