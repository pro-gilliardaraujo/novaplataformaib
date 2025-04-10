import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileText } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Tratativa } from "@/types/tratativas";

const TratativasSemDocumento = () => {
  const [tratativas, setTratativas] = useState<Tratativa[]>([]);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [currentTratativa, setCurrentTratativa] = useState<Tratativa | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { toast } = useToast();

  const API_URL = 'https://iblogistica.ddns.net:3000/api/tratativa';

  // Função para carregar tratativas sem documento
  const carregarTratativas = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/list-without-pdf`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setTratativas(data.data);
        toast({
          title: "Sucesso",
          description: `${data.count} tratativas sem documento encontradas`
        });
      } else {
        toast({
          title: "Erro",
          description: 'Erro ao carregar tratativas'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar tratativas:', error);
      toast({
        title: "Erro",
        description: 'Erro de comunicação com o servidor',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar ao montar o componente
  useEffect(() => {
    carregarTratativas();
  }, []);

  // Função para regenerar um documento
  const regenerarDocumento = async (tratativa: Tratativa, folhaUnica = false) => {
    setRegenerating(true);
    
    try {
      const response = await fetch(`${API_URL}/regenerate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: tratativa.id,
          folhaUnica
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success') {
        toast({
          title: "Sucesso",
          description: `Documento gerado com sucesso para ${tratativa.funcionario}`
        });
        // Recarregar a lista para remover a tratativa que teve o documento gerado
        carregarTratativas();
      } else if (result.status === 'info') {
        toast({
          title: "Informação",
          description: result.message
        });
      } else {
        toast({
          title: "Erro",
          description: `Erro ao gerar documento: ${result.error}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao regenerar documento:', error);
      toast({
        title: "Erro",
        description: 'Erro de comunicação com o servidor',
        variant: "destructive"
      });
    } finally {
      setRegenerating(false);
      setModalVisible(false);
    }
  };

  // Abrir modal para confirmar regeneração
  const abrirModalRegeneracao = (tratativa: Tratativa) => {
    setCurrentTratativa(tratativa);
    setModalVisible(true);
  };

  // Formatar data
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  // Colunas da tabela
  const columns = [
    {
      title: 'Número',
      dataIndex: 'numero_tratativa',
      key: 'numero_tratativa',
    },
    {
      title: 'Funcionário',
      dataIndex: 'funcionario',
      key: 'funcionario',
    },
    {
      title: 'Setor',
      dataIndex: 'setor',
      key: 'setor',
    },
    {
      title: 'Data',
      dataIndex: 'data_infracao',
      key: 'data_infracao',
      render: (text: string) => formatDate(text),
    },
    {
      title: 'Código',
      dataIndex: 'codigo_infracao',
      key: 'codigo_infracao',
    },
    {
      title: 'Ações',
      key: 'acoes',
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tratativas sem Documento Gerado</h1>
        <Button 
          variant="outline" 
          onClick={carregarTratativas}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Carregando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </>
          )}
        </Button>
      </div>
      
      <div className="bg-white rounded-md shadow">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className="font-medium">
                  {column.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tratativas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  {loading ? 'Carregando tratativas...' : 'Nenhuma tratativa sem documento encontrada'}
                </TableCell>
              </TableRow>
            ) : (
              tratativas.map((tratativa) => (
                <TableRow key={tratativa.id}>
                  <TableCell>{tratativa.numero_tratativa}</TableCell>
                  <TableCell>{tratativa.funcionario}</TableCell>
                  <TableCell>{tratativa.setor}</TableCell>
                  <TableCell>{formatDate(tratativa.data_infracao)}</TableCell>
                  <TableCell>{tratativa.codigo_infracao}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => abrirModalRegeneracao(tratativa)}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Gerar PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={modalVisible} onOpenChange={setModalVisible}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gerar Documento</AlertDialogTitle>
            <AlertDialogDescription>
              {currentTratativa && (
                <>
                  Como deseja gerar o documento para a tratativa <strong>{currentTratativa.numero_tratativa}</strong> do funcionário <strong>{currentTratativa.funcionario}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex justify-center gap-4 my-4">
            <Button
              variant="default"
              disabled={regenerating}
              onClick={() => currentTratativa && regenerarDocumento(currentTratativa, false)}
            >
              {regenerating ? "Gerando..." : "Documento Completo (2 folhas)"}
            </Button>
            
            <Button
              variant="outline"
              disabled={regenerating}
              onClick={() => currentTratativa && regenerarDocumento(currentTratativa, true)}
            >
              {regenerating ? "Gerando..." : "Apenas Folha 1"}
            </Button>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={regenerating}>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TratativasSemDocumento; 