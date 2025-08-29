"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  Plus, 
  FileText, 
  Image, 
  Loader2, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  Download,
  Calendar,
  Eye
} from "lucide-react"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { NovoDiarioCavModal } from "@/components/cav/novo-diario-cav-modal"
import { RelatorioDiarioCav } from "@/components/cav/relatorio-diario-cav"
import { DiarioCav as DiarioCavType } from "@/types/diario-cav"
import { format, parseISO, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { DateRange } from "react-day-picker"

// Componente de filtro simples
function ClassicFilter({ options, selected, onToggle, onClear }: { options: string[]; selected: Set<string>; onToggle: (o: string)=>void; onClear: ()=>void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = useMemo(()=>
    options.filter(o=>o.toLowerCase().includes(search.toLowerCase())).sort(),
  [options, search])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:bg-transparent">
          <Filter className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-3" sideOffset={5}>
        <Input placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} className="mb-2 h-8" />
        <div className="max-h-40 overflow-auto space-y-1">
          {filtered.map(opt=> (
            <div key={opt} className="flex items-center space-x-2">
              <Checkbox id={opt} checked={selected.has(opt)} onCheckedChange={()=>onToggle(opt)} />
              <label htmlFor={opt} className="text-sm">{opt}</label>
            </div>
          ))}
          {filtered.length===0 && <p className="text-sm text-muted-foreground">Nenhuma opção</p>}
        </div>
        <Button variant="outline" size="sm" className="mt-2 w-full" onClick={onClear}>Limpar</Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface RelatorioData {
  frente: string;
  data: Date;
  imagemDeslocamento?: string;
  imagensDeslocamento?: string[];
  imagemArea?: string;
  dados?: Record<string, any>;
}

export function DiarioCav() {
  // Estados para o modal e relatório
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRelatorioOpen, setIsRelatorioOpen] = useState(false)
  const [relatorioData, setRelatorioData] = useState<RelatorioData | null>(null)
  
  // Estados para os dados e carregamento
  const [diarios, setDiarios] = useState<DiarioCavType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Estados para paginação
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  
  // Estados para ordenação
  const [sortField, setSortField] = useState<string>("data")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  })
  const [frenteFilter, setFrenteFilter] = useState<Set<string>>(new Set())
  const [uniqueFrentes, setUniqueFrentes] = useState<string[]>([])
  const [dataFilter, setDataFilter] = useState<Set<string>>(new Set())
  const [uniqueDatas, setUniqueDatas] = useState<string[]>([])
  
  // Função para carregar os diários com filtros e paginação
  const carregarDiarios = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const supabase = createClientComponentClient()
      
      // Construir a query base
      let query = supabase
        .from("diario_cav")
        .select("*", { count: "exact" })
      
      // Aplicar filtro de data
      if (dateRange?.from) {
        query = query.gte("data", format(dateRange.from, "yyyy-MM-dd"))
      }
      if (dateRange?.to) {
        query = query.lte("data", format(dateRange.to, "yyyy-MM-dd"))
      }
      
      // Aplicar filtro de frente
      if (frenteFilter.size > 0) {
        query = query.in("frente", Array.from(frenteFilter))
      }
      
      // Aplicar filtro de data específica
      if (dataFilter.size > 0) {
        query = query.in("data", Array.from(dataFilter))
      }
      
      // Aplicar busca textual (no campo frente)
      if (searchTerm) {
        query = query.ilike("frente", `%${searchTerm}%`)
      }
      
      // Aplicar ordenação
      query = query.order(sortField, { ascending: sortDirection === "asc" })
      
      // Aplicar paginação
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
      
      // Executar a query
      const { data, error: supabaseError, count } = await query
      
      if (supabaseError) {
        throw new Error(supabaseError.message || "Erro ao carregar diários")
      }
      
      setDiarios(data || [])
      setTotalCount(count || 0)
      
      // Carregar opções de filtro únicas
      await carregarOpcoesFiltro()
    } catch (error: any) {
      console.error("Erro ao carregar diários:", error)
      setError(error.message || "Erro ao carregar diários")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Função para carregar opções de filtro
  const carregarOpcoesFiltro = async () => {
    try {
      const supabase = createClientComponentClient()
      
      // Carregar frentes únicas
      const { data: frentesData } = await supabase
        .from("diario_cav")
        .select("frente")
        .order("frente")
      
      if (frentesData) {
        const frentes = Array.from(new Set(frentesData.map(item => item.frente)))
        setUniqueFrentes(frentes)
      }
      
      // Carregar datas únicas (formatadas)
      const { data: datasData } = await supabase
        .from("diario_cav")
        .select("data")
        .order("data", { ascending: false })
      
      if (datasData) {
        const datasFormatadas = Array.from(new Set(datasData.map(item => {
          const [year, month, day] = item.data.split("-")
          return `${day}/${month}/${year}`
        })))
        setUniqueDatas(datasFormatadas)
      }
    } catch (error) {
      console.error("Erro ao carregar opções de filtro:", error)
    }
  }
  
  // Função para alternar ordenação
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }
  
  // Função para alternar filtro de frente
  const toggleFrenteFilter = (frente: string) => {
    const newFilter = new Set(frenteFilter)
    if (newFilter.has(frente)) {
      newFilter.delete(frente)
    } else {
      newFilter.add(frente)
    }
    setFrenteFilter(newFilter)
  }
  
  // Função para alternar filtro de data
  const toggleDataFilter = (dataFormatada: string) => {
    // Converter data formatada (dd/MM/yyyy) de volta para yyyy-MM-dd
    const [dia, mes, ano] = dataFormatada.split("/")
    const dataISO = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
    
    const newFilter = new Set(dataFilter)
    if (newFilter.has(dataISO)) {
      newFilter.delete(dataISO)
    } else {
      newFilter.add(dataISO)
    }
    setDataFilter(newFilter)
  }
  
  // Efeito para carregar dados iniciais
  useEffect(() => {
    carregarDiarios()
  }, [page, pageSize, sortField, sortDirection, dateRange, frenteFilter, dataFilter, searchTerm])
  
  // Calcular total de páginas
  const totalPages = Math.ceil(totalCount / pageSize)
  
  // Exportar para CSV
  const exportarCSV = () => {
    if (diarios.length === 0) return
    
    // Preparar cabeçalhos
    const headers = ["Data", "Frente", "Imagem Deslocamento", "Imagem Área"]
    
    // Preparar linhas
    const rows = diarios.map(diario => [
      format(parseISO(diario.data), "dd/MM/yyyy"),
      diario.frente,
      diario.imagem_deslocamento || "",
      diario.imagem_area || ""
    ])
    
    // Combinar cabeçalhos e linhas
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")
    
    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `diarios_cav_${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="w-[400px]">
          <Input
            placeholder="Buscar por frente ou data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex gap-2 items-center">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className="h-9"
          />
          <Button 
            variant="outline"
            className="h-9"
            onClick={exportarCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            className="bg-black hover:bg-black/90 text-white h-9"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> 
            Novo Diário
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 border rounded-lg flex flex-col min-h-0 overflow-hidden">
        <div className="overflow-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          ) : diarios.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <p className="text-muted-foreground">
                Nenhum diário encontrado com os filtros selecionados.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-black sticky top-0">
                <TableRow className="h-[47px]">
                  <TableHead className="text-white font-medium px-3 text-center">
                    <div className="flex items-center gap-1">
                      <div 
                        className="flex items-center gap-1 cursor-pointer"
                        onClick={() => toggleSort("data")}
                      >
                        <span>Data</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-7 w-7 p-0 hover:bg-transparent ${
                            sortField === "data" ? 'text-white' : 'text-gray-400'
                          }`}
                        >
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <ClassicFilter
                        options={uniqueDatas}
                                selected={new Set(Array.from(dataFilter).map(data => {
          const [year, month, day] = data.split("-")
          return `${day}/${month}/${year}`
        }))}
                        onToggle={toggleDataFilter}
                        onClear={() => setDataFilter(new Set())}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-white font-medium px-3 text-center">
                    <div className="flex items-center gap-1">
                      <div 
                        className="flex items-center gap-1 cursor-pointer"
                        onClick={() => toggleSort("frente")}
                      >
                        <span>Frente</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-7 w-7 p-0 hover:bg-transparent ${
                            sortField === "frente" ? 'text-white' : 'text-gray-400'
                          }`}
                        >
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <ClassicFilter
                        options={uniqueFrentes}
                        selected={frenteFilter}
                        onToggle={toggleFrenteFilter}
                        onClear={() => setFrenteFilter(new Set())}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-white font-medium px-3 text-center">Imagens</TableHead>
                  <TableHead className="text-white font-medium w-[100px] px-3">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diarios.map((diario) => (
                  <TableRow key={diario.id} className="h-[47px] hover:bg-gray-50 border-b border-gray-200">
                    <TableCell className="px-3 py-0 border-x border-gray-100 text-center">
                      {format(parseISO(diario.data), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="px-3 py-0 border-x border-gray-100 text-center">
                      {diario.frente}
                    </TableCell>
                    <TableCell className="px-3 py-0 border-x border-gray-100 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Verificar múltiplas imagens primeiro */}
                        {(() => {
                          let imagensArray = diario.imagens_deslocamento;
                          if (typeof imagensArray === 'string') {
                            try {
                              imagensArray = JSON.parse(imagensArray);
                            } catch (e) {
                              console.error('Erro ao fazer parse de imagens_deslocamento:', e);
                              imagensArray = null;
                            }
                          }
                          
                          console.log(`📊 Diário ${diario.id}:`, { 
                            imagem_unica: diario.imagem_deslocamento, 
                            multiplas_raw: diario.imagens_deslocamento,
                            multiplas_parsed: imagensArray 
                          });
                          
                          return imagensArray && Array.isArray(imagensArray) && imagensArray.length > 0;
                        })() ? (
                          (() => {
                            let imagensArray = diario.imagens_deslocamento;
                            if (typeof imagensArray === 'string') {
                              try {
                                imagensArray = JSON.parse(imagensArray);
                              } catch (e) {
                                return [];
                              }
                            }
                            return Array.isArray(imagensArray) ? imagensArray : [];
                          })().map((imgUrl: string, index: number) => (
                            <a 
                              key={index}
                              href={imgUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700 relative"
                              title={`Ver imagem de deslocamento ${index + 1}`}
                            >
                              <Image className="h-4 w-4" />
                              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center leading-none">
                                {index + 1}
                              </span>
                            </a>
                          ))
                        ) : diario.imagem_deslocamento ? (
                          <a 
                            href={diario.imagem_deslocamento} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                            title="Ver imagem de deslocamento"
                          >
                            <Image className="h-4 w-4" />
                          </a>
                        ) : null}
                        
                        {diario.imagem_area && (
                          <a 
                            href={diario.imagem_area} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-green-500 hover:text-green-700"
                            title="Ver imagem de área"
                          >
                            <Image className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-0 border-x border-gray-100">
                      <div className="flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Ver detalhes"
                          onClick={() => {
                            console.log(`Abrindo relatório para frente ${diario.frente} na data ${diario.data}`);
                            console.log(`Dados do diário:`, diario);
                            
                            // Verificar se os dados são válidos
                            if (!diario.frente || !diario.data) {
                              alert("Dados incompletos para gerar o relatório. Frente ou data não definidos.");
                              return;
                            }
                            
                            // Verificar se dados OPC existem
                            if (!diario.dados || Object.keys(diario.dados).length === 0) {
                              console.warn("Alerta: Dados OPC não encontrados para este diário.");
                            } else {
                              // Verificar se cada frota tem combustivel_consumido definido
                              console.log("🔍 Verificando dados das frotas:", diario.dados);
                              Object.keys(diario.dados).forEach(frotaKey => {
                                const frotaData = diario.dados[frotaKey];
                                console.log(`🔍 Verificando frota ${frotaKey}:`, frotaData);
                                
                                if (frotaData && typeof frotaData === 'object') {
                                  if (typeof frotaData.combustivel_consumido !== 'number') {
                                    console.warn(`⚠️ Frota ${frotaKey} não tem combustivel_consumido válido. Valor atual:`, frotaData.combustivel_consumido);
                                    frotaData.combustivel_consumido = 0;
                                  }
                                } else {
                                  console.error(`❌ Frota ${frotaKey} tem dados inválidos (${typeof frotaData}):`, frotaData);
                                }
                              });
                            }
                            
                            // Forçar a data correta sem ajustes de fuso horário
                            // Extrair a data diretamente da string no formato yyyy-MM-dd
                            const [ano, mes, dia] = diario.data.split('-').map(Number);
                            // Criar uma nova data com o dia correto (mes-1 porque em JS os meses começam em 0)
                            const dataCorreta = new Date(ano, mes-1, dia, 12, 0, 0); // Meio-dia para evitar problemas de fuso horário
                            
                            console.log(`Data do banco: ${diario.data}, Data forçada: ${dataCorreta.toISOString()}, Dia forçado: ${dia}`);
                            console.log(`Dados do diário para relatório:`, diario.dados);
                            
                            // Lógica para verificar múltiplas imagens
                            let imagensDeslocamentoArray: string[] | undefined = undefined;
                            if (diario.imagens_deslocamento) {
                              if (typeof diario.imagens_deslocamento === 'string') {
                                try {
                                  const parsed = JSON.parse(diario.imagens_deslocamento);
                                  imagensDeslocamentoArray = Array.isArray(parsed) ? parsed : undefined;
                                } catch (e) {
                                  console.error('Erro ao fazer parse de imagens_deslocamento para relatório:', e);
                                  imagensDeslocamentoArray = undefined;
                                }
                              } else if (Array.isArray(diario.imagens_deslocamento)) {
                                imagensDeslocamentoArray = diario.imagens_deslocamento;
                              }
                            }
                            
                            setRelatorioData({
                              frente: diario.frente,
                              data: dataCorreta,
                              imagemDeslocamento: diario.imagem_deslocamento || undefined,
                              imagensDeslocamento: imagensDeslocamentoArray,
                              imagemArea: diario.imagem_area || undefined,
                              dados: diario.dados // Passar os dados diretamente para o relatório
                            });
                            setIsRelatorioOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
        </div>
        
        {/* Paginação */}
        {!isLoading && !error && diarios.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {diarios.length} de {totalCount} registros
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm">
                Página {page} de {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <NovoDiarioCavModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          carregarDiarios()
        }}
      />
      
      {relatorioData && (
        <RelatorioDiarioCav
          open={isRelatorioOpen}
          onOpenChange={setIsRelatorioOpen}
          frente={relatorioData.frente}
          data={relatorioData.data}
          imagemDeslocamento={relatorioData.imagemDeslocamento}
          imagensDeslocamento={relatorioData.imagensDeslocamento}
          imagemArea={relatorioData.imagemArea}
          dadosPassados={relatorioData.dados}
        />
      )}
    </div>
  )
}