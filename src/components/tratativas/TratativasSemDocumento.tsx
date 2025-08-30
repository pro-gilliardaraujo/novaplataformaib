import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  RefreshCw, 
  FileText, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  ArrowUpDown 
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger, 
  DropdownMenuGroup 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { Tratativa } from "@/types/tratativas";

// Interface para os filtros
type FilterState = Record<string, Set<string>>;

const TratativasSemDocumento = () => {
  const [tratativas, setTratativas] = useState<Tratativa[]>([]);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [currentTratativa, setCurrentTratativa] = useState<Tratativa | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({});
  const [sorting, setSorting] = useState<{ column: string; direction: 'asc' | 'desc' | null } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;
  const { toast } = useToast();

  const API_URL = 'http://iblogistica.ddns.net:3000/api/tratativa';

  // Colunas da tabela
  const columns = [
    { key: "numero_tratativa", title: "Tratativa" },
    { key: "funcionario", title: "Funcionário" },
    { key: "setor", title: "Setor" },
    { key: "data_infracao", title: "Data" },
    { key: "codigo_infracao", title: "Código" },
    { key: "penalidade", title: "Penalidade" },
    { key: "lider", title: "Líder" },
  ] as const;

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
        setCurrentPage(1); // Reset pagination when loading new data
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

  // Gerar opções de filtro a partir dos dados
  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        if (column.key === "data_infracao") {
          acc[column.key] = Array.from(
            new Set(
              tratativas.map((item) => {
                const [year, month, day] = item.data_infracao.split("-")
                return `${day}/${month}/${year}`
              }),
            ),
          ).filter((value): value is string => typeof value === "string")
        } else {
          acc[column.key] = Array.from(
            new Set(
              tratativas
                .map((item) => item[column.key as keyof Tratativa])
                .filter((value): value is string => typeof value === "string"),
            ),
          )
        }
        return acc
      },
      {} as Record<string, string[]>,
    )
  }, [tratativas]);

  // Filtrar dados com base nos filtros aplicados
  const filteredData = useMemo(() => {
    // Primeiro, aplicar os filtros de coluna
    const filtered = tratativas.filter((row) =>
      Object.entries(filters).every(([key, selectedOptions]) => {
        if (selectedOptions.size === 0) return true
        if (key === "data_infracao") {
          const [year, month, day] = row.data_infracao.split("-")
          const formattedDate = `${day}/${month}/${year}`
          return selectedOptions.has(formattedDate)
        }
        const value = row[key as keyof Tratativa]
        return typeof value === "string" && selectedOptions.has(value)
      }),
    );

    // Depois, aplicar o termo de busca geral
    if (!searchTerm.trim()) return filtered;
    
    return filtered.filter(tratativa => 
      Object.values(tratativa).some(value => 
        value !== null && 
        typeof value === 'string' && 
        value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [tratativas, filters, searchTerm]);

  // Ordenar dados
  const sortedData = useMemo(() => {
    if (!sorting || !sorting.column || !sorting.direction) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sorting.column as keyof Tratativa];
      const bValue = b[sorting.column as keyof Tratativa];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sorting.direction === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });
  }, [filteredData, sorting]);

  // Calcular paginação
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + rowsPerPage);

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
          folhaUnica: false  // Todas as penalidades geram duas folhas
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

  // Manipuladores para filtros
  const handleFilterToggle = (columnKey: string, option: string) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters };
      const columnFilters = newFilters[columnKey] ? new Set(newFilters[columnKey]) : new Set<string>();

      if (columnFilters.has(option)) {
        columnFilters.delete(option);
      } else {
        columnFilters.add(option);
      }

      newFilters[columnKey] = columnFilters;
      return newFilters;
    });
    setCurrentPage(1); // Resetar paginação ao filtrar
  };

  const handleClearFilter = (columnKey: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [columnKey]: new Set<string>(),
    }));
  };

  // Manipulador para ordenação
  const handleSort = (columnKey: string) => {
    setSorting(prev => {
      if (prev?.column !== columnKey) {
        return { column: columnKey, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { column: columnKey, direction: 'desc' };
      }
      return { column: columnKey, direction: null };
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header com busca e botão de atualizar */}
      <div className="flex justify-between items-center mb-4">
        <div className="w-[400px]">
          <Input
            placeholder="Buscar por número, funcionário ou setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={carregarTratativas}
          disabled={loading}
          className="flex items-center gap-2 h-9"
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
      
      {/* Tabela */}
      <div className="flex-1 border rounded-lg flex flex-col min-h-0 overflow-hidden">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-black sticky top-0">
              <TableRow className="h-[46px]">
                {columns.map((column) => (
                  <TableHead key={column.key} className="text-white font-medium px-3">
                    <div className="flex items-center gap-1">
                      <div 
                        className="flex items-center gap-1 cursor-pointer"
                        onClick={() => handleSort(column.key)}
                      >
                        <span>{column.title}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-7 w-7 p-0 hover:bg-transparent ${
                            sorting?.column === column.key ? 'text-white' : 'text-gray-400'
                          }`}
                        >
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <FilterDropdown
                        title={column.title}
                        options={filterOptions[column.key] ?? []}
                        selectedOptions={filters[column.key] ?? new Set()}
                        onOptionToggle={(option) => handleFilterToggle(column.key, option)}
                        onClear={() => handleClearFilter(column.key)}
                      />
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-white font-medium w-[100px] px-3">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                    {loading ? 'Carregando tratativas...' : 'Nenhuma tratativa sem documento encontrada'}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {paginatedData.map((tratativa) => (
                    <TableRow key={tratativa.id} className="h-[46px] hover:bg-gray-50 border-b border-gray-200">
                      <TableCell className="px-3 py-0 border-x border-gray-100">{tratativa.numero_tratativa}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">{tratativa.funcionario}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">{tratativa.setor}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">{formatDate(tratativa.data_infracao)}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">{tratativa.codigo_infracao}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">{tratativa.penalidade}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">{tratativa.lider}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">
                        <div className="flex items-center justify-center">
                          <Button 
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => abrirModalRegeneracao(tratativa)}
                            title="Gerar PDF"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Preencher com linhas vazias para manter altura fixa */}
                  {paginatedData.length < rowsPerPage && (
                    Array(rowsPerPage - paginatedData.length).fill(0).map((_, index) => (
                      <TableRow key={`empty-${index}`} className="h-[46px] border-b border-gray-200">
                        {Array(columns.length + 1).fill(0).map((_, colIndex) => (
                          <TableCell key={`empty-cell-${colIndex}`} className="px-3 py-0 border-x border-gray-100">&nbsp;</TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Controles de paginação */}
        <div className="bg-gray-50 p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Mostrando {sortedData.length > 0 ? startIndex + 1 : 0} a {Math.min(startIndex + rowsPerPage, sortedData.length)} de {sortedData.length} resultados
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || sortedData.length === 0}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {Math.max(totalPages, 1)}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || sortedData.length === 0}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Modal de confirmação */}
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

// Componente de dropdown para filtros
function FilterDropdown({
  title,
  options,
  selectedOptions,
  onOptionToggle,
  onClear,
}: {
  title: string
  options: string[]
  selectedOptions: Set<string>
  onOptionToggle: (option: string) => void
  onClear: () => void
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DropdownMenu modal={true}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Filter className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-4" side="bottom" sideOffset={5}>
        <div className="space-y-4">
          <h4 className="font-medium">Filtrar {title.toLowerCase()}</h4>
          <Input 
            placeholder={`Buscar ${title.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="space-y-2 max-h-48 overflow-auto">
            {filteredOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={selectedOptions.has(option)}
                  onCheckedChange={() => onOptionToggle(option)}
                />
                <label htmlFor={option} className="text-sm">
                  {option}
                </label>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={onClear}>
              Limpar
            </Button>
            <span className="text-sm text-muted-foreground">{selectedOptions.size} selecionados</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default TratativasSemDocumento; 