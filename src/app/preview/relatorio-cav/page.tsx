"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Copy, Printer } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import "@/components/cav/relatorio-styles.css"

// Dados mockados para o relatório
const dadosMock = {
  frotas: [
    {
      frota: 6127,
      turnos: [
        { turno: "A", codigo: "10650-10743", producao: 7.5, operador: "João Silva" },
        { turno: "B", codigo: "10650-10743", producao: 16.28, operador: "Maria Oliveira" },
        { turno: "C", codigo: "10650-10743", producao: 5.81, operador: "Pedro Santos" }
      ],
      total_producao: 29.59,
      horas_motor: 12.95,
      hectare_por_hora: 2.28,
      motor_ocioso_perc: 27.74,
      combustivel_consumido: 12.00
    },
    {
      frota: 6131,
      turnos: [
        { turno: "A", codigo: "10650-10743", producao: 9.29, operador: "Ana Costa" },
        { turno: "B", codigo: "10650-10743", producao: 8.78, operador: "Carlos Mendes" },
        { turno: "C", codigo: "10650-10743", producao: 26.09, operador: "Fernanda Lima" }
      ],
      total_producao: 44.16,
      horas_motor: 16.3,
      hectare_por_hora: 2.71,
      motor_ocioso_perc: 26.23,
      combustivel_consumido: 13.55
    },
    {
      frota: 6133,
      turnos: [
        { turno: "A", codigo: "10650-10743", producao: 11.84, operador: "Roberto Alves" },
        { turno: "B", codigo: "10650-10743", producao: 19.36, operador: "Juliana Martins" },
        { turno: "C", codigo: "10650-10743", producao: 18.16, operador: "Marcos Pereira" }
      ],
      total_producao: 49.36,
      horas_motor: 13.65,
      hectare_por_hora: 3.62,
      motor_ocioso_perc: 27.13,
      combustivel_consumido: 14.80
    }
  ],
  totais: {
    total_producao: 123.11,
    total_horas_motor: 42.9,
    lamina_alvo: 10,
    total_viagens: 20,
    lamina_aplicada: 9.75,
    viagens_orcadas: 20.52,
    dif_viagens_perc: -2.59
  }
}

export default function RelatorioPreviewPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [dadosRelatorio, setDadosRelatorio] = useState<any>(dadosMock)
  const [frente, setFrente] = useState<string>("")
  const [data, setData] = useState<Date>(new Date())
  const [imagemDeslocamento, setImagemDeslocamento] = useState<string | undefined>()
  const [imagemArea, setImagemArea] = useState<string | undefined>()
  const relatorioRef = useRef<HTMLDivElement>(null)
  
  // Estados para cores das frotas e legenda
  const [frotaCores, setFrotaCores] = useState<Record<string, string>>({})
  const [legendaPosicao, setLegendaPosicao] = useState<'direita' | 'esquerda'>('direita')
  const [legendaCustomPos, setLegendaCustomPos] = useState<{x: number, y: number} | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({x: 0, y: 0})
  
  // Cores fixas para as frotas (em ordem)
  const coresDisponiveis = [
    '#66ffcc', // 1ª frota - verde-água
    '#66ff66', // 2ª frota - verde-claro  
    '#ffa200', // 3ª frota - laranja
    '#ff6666', // 4ª frota - vermelho-claro
    '#6666ff', // 5ª frota - azul-claro
    '#ff66ff', // 6ª frota - rosa-claro
    '#66ffff', // 7ª frota - ciano-claro
    '#ffff66', // 8ª frota - amarelo-claro
    '#ff9966', // 9ª frota - laranja-claro
    '#9966ff', // 10ª frota - roxo-claro
    '#66ff99', // 11ª frota - verde-menta
    '#ff6699', // 12ª frota - rosa-médio
    '#99ff66', // 13ª frota - lima-claro
    '#6699ff', // 14ª frota - azul-médio
    '#ff9999'  // 15ª frota - rosa-salmão
  ]
  
  // Função para inicializar cores das frotas
  const inicializarCoresFrotas = (frotas: any[]) => {
    const novasCores: Record<string, string> = {}
    frotas.forEach((frota, index) => {
      if (frota && frota.frota) {
        novasCores[frota.frota] = coresDisponiveis[index % coresDisponiveis.length]
      }
    })
    setFrotaCores(novasCores)
  }

  // Funções para drag & drop da legenda
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    const container = e.currentTarget.closest('.relative')
    if (!container) return
    
    const containerRect = container.getBoundingClientRect()
    const newX = e.clientX - containerRect.left - dragOffset.x
    const newY = e.clientY - containerRect.top - dragOffset.y
    
    // Limitar dentro do container
    const maxX = containerRect.width - 120 // largura aproximada da legenda
    const maxY = containerRect.height - 80 // altura aproximada da legenda
    
    setLegendaCustomPos({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const resetarPosicaoLegenda = () => {
    setLegendaCustomPos(null)
  }

  // Função para salvar posição da legenda no banco de dados
  const salvarPosicaoLegenda = async () => {
    try {
      const supabase = createClientComponentClient()
      
      // Preparar dados da legenda para salvar
      const dadosLegenda = {
        posicao: legendaPosicao,
        customPos: legendaCustomPos,
        cores: frotaCores
      }

      // Buscar o registro atual
      const dataFormatada = format(data, 'yyyy-MM-dd')
      const { data: registroAtual, error: fetchError } = await supabase
        .from('diario_cav')
        .select('dados')
        .eq('frente', frente)
        .eq('data', dataFormatada)
        .single()

      if (fetchError) {
        console.error('Erro ao buscar registro atual:', fetchError)
        return
      }

      // Mesclar dados existentes com configurações da legenda
      const dadosAtualizados = {
        ...registroAtual.dados,
        legenda: dadosLegenda
      }

      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('diario_cav')
        .update({ dados: dadosAtualizados })
        .eq('frente', frente)
        .eq('data', dataFormatada)

      if (updateError) {
        console.error('Erro ao salvar posição da legenda:', updateError)
        return
      }

      // Feedback visual de sucesso
      const button = document.querySelector('[data-salvar-legenda]') as HTMLButtonElement
      if (button) {
        const originalText = button.textContent
        button.textContent = '✓ Salvo!'
        button.classList.add('bg-green-100', 'text-green-700')
        setTimeout(() => {
          button.textContent = originalText
          button.classList.remove('bg-green-100', 'text-green-700')
        }, 2000)
      }

    } catch (error) {
      console.error('Erro ao salvar posição da legenda:', error)
    }
  }
  
  // Inicializar cores das frotas mockadas
  useEffect(() => {
    inicializarCoresFrotas(dadosMock.frotas || []);
  }, []);

  // Carregar parâmetros da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const frenteParam = params.get('frente');
    const dataParam = params.get('data');
    const imagemDeslocamentoParam = params.get('imagemDeslocamento');
    const imagemAreaParam = params.get('imagemArea');
    
    console.log("Parâmetros da URL:", { frenteParam, dataParam, imagemDeslocamentoParam, imagemAreaParam });
    
    if (frenteParam) setFrente(frenteParam);
    if (dataParam) {
      try {
        // Verificar se o dataParam já está no formato yyyy-MM-dd
        if (dataParam.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Extrair a data diretamente da string no formato yyyy-MM-dd
          const [ano, mes, dia] = dataParam.split('-').map(Number);
          // Criar uma nova data com o dia correto (mes-1 porque em JS os meses começam em 0)
          const dataCorreta = new Date(ano, mes-1, dia);
          console.log(`Data do parâmetro formatada: ${dataParam}, Data correta: ${dataCorreta.toISOString()}, Dia: ${dia}`);
          setData(dataCorreta);
        } else {
          // Caso contrário, tentar converter a data do parâmetro (que pode ser um ISO string)
          const dataObj = new Date(dataParam);
          console.log("Data do parâmetro ISO:", dataObj.toISOString());
          
          // Extrair ano, mês e dia da data convertida
          const ano = dataObj.getFullYear();
          const mes = dataObj.getMonth();
          const dia = dataObj.getDate();
          
          // Criar uma nova data com o dia correto
          const dataCorreta = new Date(ano, mes, dia);
          console.log(`Data correta na preview: ${dataCorreta.toISOString()}, Dia: ${dia}`);
          setData(dataCorreta);
        }
      } catch (error) {
        console.error("Erro ao converter data:", error);
      }
    }
    
    if (imagemDeslocamentoParam && imagemDeslocamentoParam !== 'undefined') {
      console.log("Imagem de deslocamento definida:", imagemDeslocamentoParam);
      setImagemDeslocamento(imagemDeslocamentoParam);
    }
    
    if (imagemAreaParam && imagemAreaParam !== 'undefined') {
      console.log("Imagem de área definida:", imagemAreaParam);
      setImagemArea(imagemAreaParam);
    }
    
    // Carregar dados do relatório
    if (frenteParam && dataParam) {
      try {
        carregarDados(frenteParam, new Date(dataParam));
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    } else {
      console.error("Parâmetros faltando para carregar dados:", { frenteParam, dataParam });
    }
  }, []);
  
  // Função para carregar dados
  const carregarDados = async (frente: string, data: Date) => {
    setIsLoading(true);
    const dataFormatada = format(data, "yyyy-MM-dd");
    console.log(`🔍 Carregando dados salvos para frente: ${frente}, data: ${dataFormatada}`);
    
    try {
      // Buscar dados salvos na tabela diario_cav
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
      const supabase = createClientComponentClient();
      
      const { data: diarioData, error } = await supabase
        .from("diario_cav")
        .select("dados")
        .eq("frente", frente)
        .eq("data", dataFormatada)
        .single();
        
      if (error) {
        console.error("Erro ao buscar dados do diário:", error);
        throw error;
      }
      
      if (!diarioData || !diarioData.dados) {
        console.warn("Nenhum dado encontrado, usando dados mockados");
        setDadosRelatorio(dadosMock);
        inicializarCoresFrotas(dadosMock.frotas || []);
        setIsLoading(false);
        return;
      }
      
      console.log("📊 Dados brutos do diário:", diarioData.dados);
      
      // Transformar dados salvos para o formato do relatório
      const dadosSalvos = diarioData.dados;
      const frotasData = dadosSalvos.frotas || dadosSalvos; // Compatibilidade
      const agregadosData = dadosSalvos.agregados || null;
      
      const frotasTransformadas = Object.entries(frotasData).map(([frotaKey, dadosFrota]: [string, any]) => {
        const frotaNum = parseInt(frotaKey);
        return {
          frota: frotaNum,
          turnos: dadosFrota.turnos || [],
          total_producao: dadosFrota.total_producao || 0,
          horas_motor: dadosFrota.h_motor || 0,
          hectare_por_hora: dadosFrota.hectare_por_hora || 0,
          motor_ocioso_perc: (dadosFrota.fator_carga_motor_ocioso || 0) * 100,
          combustivel_consumido: dadosFrota.combustivel_consumido || 0
        };
      });
      
      const totaisCalculados = agregadosData ? {
        total_producao: agregadosData.total_producao || 0,
        total_horas_motor: frotasTransformadas.reduce((sum: number, f: any) => sum + f.horas_motor, 0),
        lamina_alvo: agregadosData.lamina_alvo || 10,
        total_viagens: agregadosData.total_viagens_feitas || 20,
        lamina_aplicada: agregadosData.lamina_aplicada || 0,
        viagens_orcadas: agregadosData.total_viagens_orcadas || 0,
        dif_viagens_perc: agregadosData.dif_viagens_perc || 0
      } : dadosMock.totais;
      
      const dados = {
        frotas: frotasTransformadas,
        totais: totaisCalculados
      };
      
      console.log("✅ Dados transformados para preview:", dados);
      
      setDadosRelatorio(dados);
      inicializarCoresFrotas(dados.frotas || []);
      
      // Carregar configurações salvas da legenda
      if (diarioData.dados.legenda) {
        const { posicao, customPos, cores } = diarioData.dados.legenda;
        if (posicao) setLegendaPosicao(posicao);
        if (customPos) setLegendaCustomPos(customPos);
        if (cores) setFrotaCores(cores);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do relatório:", error);
      // Manter os dados mockados em caso de erro
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleDownloadPDF = async () => {
    if (!relatorioRef.current) return
    setIsLoading(true)
    
    try {
      // Configuração para tamanho exato A4 (210mm x 297mm)
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = 210
      const pageHeight = 297
      const margin = 10
      const contentWidth = pageWidth - (margin * 2)
      const contentHeight = pageHeight - (margin * 2)
      
      // Primeira página com gráficos
      const pagina1 = relatorioRef.current.querySelector(".pagina-1") as HTMLElement
      if (pagina1) {
        const canvas1 = await html2canvas(pagina1, {
          logging: false,
          useCORS: true,
          allowTaint: true,
          scale: 2, // Melhor qualidade
          width: pagina1.offsetWidth,
          height: pagina1.offsetHeight,
          backgroundColor: '#ffffff'
        } as any)
        const imgData1 = canvas1.toDataURL("image/png", 1.0)
        pdf.addImage(imgData1, "PNG", margin, margin, contentWidth, contentHeight)
      }
      
      // Segunda página com gráfico de combustível + mapa de deslocamento
      const pagina2 = relatorioRef.current.querySelector(".pagina-2") as HTMLElement
      if (pagina2) {
        pdf.addPage()
        const canvas2 = await html2canvas(pagina2, {
          logging: false,
          useCORS: true,
          allowTaint: true,
          scale: 2, // Melhor qualidade
          width: pagina2.offsetWidth,
          height: pagina2.offsetHeight,
          backgroundColor: '#ffffff'
        } as any)
        const imgData2 = canvas2.toDataURL("image/png", 1.0)
        pdf.addImage(imgData2, "PNG", margin, margin, contentWidth, contentHeight)
      }
      
      pdf.save(`Relatório-CAV-${frente}-${format(data, "dd-MM-yyyy")}.pdf`)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleCopyAsPNG = async () => {
    if (!relatorioRef.current) return
    setIsLoading(true)
    
    try {
      const canvas = await html2canvas(relatorioRef.current.querySelector(".pagina-1") as HTMLElement)
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error("Erro ao converter para PNG")
        }
        
        try {
          // Tenta usar a Clipboard API moderna
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
          ])
          alert("Imagem copiada para a área de transferência!")
        } catch (err) {
          // Fallback para método mais antigo
          const data = [new ClipboardItem({ "image/png": blob })]
          navigator.clipboard.write(data)
          alert("Imagem copiada para a área de transferência!")
        }
      })
    } catch (error) {
      console.error("Erro ao copiar como PNG:", error)
      alert("Erro ao copiar como PNG")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handlePrint = () => {
    window.print()
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Preview do Relatório CAV</h1>
        
        {/* Cabeçalho unificado com controles de legenda e comandos */}
        {!isLoading && dadosRelatorio && dadosRelatorio.frotas && dadosRelatorio.frotas.length > 0 && (
          <div className="flex items-center justify-between gap-4 mb-6 p-3 bg-gray-50 rounded-lg">
            {/* Esquerda - Controles de Legenda */}
            <div className="flex items-center gap-4">
              {/* Cores das Frotas */}
              <div className="flex items-center gap-2">
                {dadosRelatorio.frotas
                  .filter((frota: any) => frota && frota.frota && frota.frota !== 'N/A' && !isNaN(frota.frota))
                  .map((frota: any) => (
                    <div key={frota.frota} className="flex items-center gap-1">
                      <span className="text-sm font-medium">{frota.frota}</span>
                      <input
                        type="color"
                        value={frotaCores[frota.frota] || coresDisponiveis[0]}
                        onChange={(e) => setFrotaCores(prev => ({
                          ...prev,
                          [frota.frota]: e.target.value
                        }))}
                        className="w-6 h-6 border rounded cursor-pointer"
                        title={`Cor da frota ${frota.frota}`}
                      />
                    </div>
                  ))}
              </div>
              
              {/* Posição da Legenda */}
              <div className="flex items-center gap-2">
                <Button
                  variant={legendaPosicao === 'esquerda' && !legendaCustomPos ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setLegendaPosicao('esquerda'); setLegendaCustomPos(null); }}
                >
                  Inferior Esquerda
                </Button>
                <Button
                  variant={legendaPosicao === 'direita' && !legendaCustomPos ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setLegendaPosicao('direita'); setLegendaCustomPos(null); }}
                >
                  Inferior Direita
                </Button>
                {legendaCustomPos && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetarPosicaoLegenda}
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    Resetar Posição
                  </Button>
                )}
              </div>
            </div>

            {/* Separador */}
            <div className="h-8 w-px bg-gray-300"></div>

            {/* Direita - Comandos Principais */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={handleDownloadPDF}
                disabled={isLoading}
              >
                <Download className="h-4 w-4" />
                <span>Baixar PDF</span>
              </Button>
              {(legendaCustomPos || frotaCores) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 text-green-600 border-green-300 hover:bg-green-50"
                  onClick={salvarPosicaoLegenda}
                  disabled={isLoading}
                  data-salvar-legenda
                >
                  <span>Salvar Legenda</span>
                </Button>
              )}
            </div>
          </div>
        )}
        
        <div className="flex justify-center">
          <div ref={relatorioRef} className="bg-white shadow-lg print:shadow-none" style={{ width: "210mm", minHeight: "297mm" }}>
        {/* Primeira página com gráficos */}
        <div className="pagina-1 border rounded-md p-6 mb-4 print:border-none print:p-0 bg-white" style={{ width: "210mm", height: "297mm" }}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <img src="https://kjlwqezxzqjfhacmjhbh.supabase.co/storage/v1/object/public/sourcefiles/logo.png" alt="Logo" className="h-10" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold">Relatório Diário de Frotas - {frente || "Moema Frente 2"}</h2>
              <p className="text-sm">{format(data, "dd/MM/yyyy", { locale: ptBR })}</p>
            </div>
            <div className="flex items-center gap-2">
              <img src="https://kjlwqezxzqjfhacmjhbh.supabase.co/storage/v1/object/public/sourcefiles/logo.png" alt="Logo" className="h-10" />
            </div>
          </div>
          
          <div className="border border-gray-400 rounded-md p-4 mb-6 shadow-sm">
            <h3 className="text-center font-semibold mb-2">Ha aplicados</h3>
                            <div className={`flex justify-center ${dadosRelatorio.frotas.length <= 2 ? 'gap-32' : dadosRelatorio.frotas.length === 3 ? 'gap-20' : 'gap-12'}`}>
              {dadosRelatorio.frotas.map((frota: any) => (
                <div key={frota.frota} className="flex flex-col items-center">
                  <div className="flex gap-3 mb-4">
                    {frota.turnos.map((turno: any) => (
                      <div key={`${frota.frota}-${turno.turno}`} className="flex flex-col items-center">
                        <div className="h-32 flex flex-col justify-end">
                          <div className="text-xs mb-1">{turno.producao.toFixed(2)}</div>
                          <div 
                            className="bg-green-500 w-8" 
                            style={{ height: `${Math.min(turno.producao * 4, 100)}px` }}
                          ></div>
                        </div>
                        <div className="mt-1 text-xs">{turno.turno}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-center border-t pt-2 w-full">
                    <div>Fazenda {frota.turnos[0]?.codigo || ""} - Lâmina: {dadosRelatorio.totais.lamina_alvo.toFixed(2)}m³</div>
                    <div className="font-semibold">{frota.frota}</div>
                    <div>Total frota: {frota.total_producao.toFixed(2)} ha</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-4 border-t pt-2">
              <div className="text-base font-semibold">Total Aplicado: {dadosRelatorio.totais.total_producao.toFixed(2)}</div>
            </div>
            <div className="text-center mt-2 border-t pt-2">
              <div className="text-xs">Lâmina Alvo: {dadosRelatorio.totais.lamina_alvo.toFixed(2)} | Lâmina Aplicada: {dadosRelatorio.totais.lamina_aplicada.toFixed(2)}</div>
              <div className="text-xs">Total Viagens: {dadosRelatorio.totais.total_viagens} | Viagens Orçadas: {dadosRelatorio.totais.viagens_orcadas.toFixed(2)} | % Diferença: {dadosRelatorio.totais.dif_viagens_perc.toFixed(2)}%</div>
            </div>
          </div>
          
          <div className="border border-gray-400 rounded-md p-4 mb-6 shadow-sm">
            <h3 className="text-center font-semibold mb-2">Hectares por Hora Motor</h3>
            <div className="flex flex-col gap-4">
              {dadosRelatorio.frotas.filter((frota: any) => {
                // Filtrar apenas frotas com dados válidos
                const frotaValida = frota && 
                  typeof frota === 'object' && 
                  frota.frota && 
                  frota.frota !== 'N/A' && 
                  !isNaN(frota.frota) &&
                  typeof frota.horas_motor === 'number' && 
                  frota.horas_motor > 0;
                return frotaValida;
              }).map((frota: any) => {
                // Calcular porcentagem para barra (baseado no maior hectare_por_hora)
                const frotasValidas = dadosRelatorio.frotas.filter((f: any) => f && f.hectare_por_hora > 0);
                const maxHectarePorHora = frotasValidas.length > 0 ? Math.max(...frotasValidas.map((f: any) => f.hectare_por_hora)) : 1;
                const porcentagemBarra = maxHectarePorHora > 0 ? Math.min((frota.hectare_por_hora / maxHectarePorHora) * 80, 80) : 5;
                
                return (
                  <div key={frota.frota} className="flex items-center">
                    <div className="w-12 text-left text-xs font-semibold">{frota.frota}</div>
                    <div className="w-20 text-center text-xs">
                      <div className="font-semibold">{frota.horas_motor.toFixed(2)}h</div>
                      <div>Horas Motor</div>
                    </div>
                    <div className="flex-1 mx-2 relative">
                      <div className="w-full h-6 bg-gray-300 rounded-full border">
                        <div 
                          className="bg-green-600 h-6 rounded-full transition-all duration-300" 
                          style={{ width: `${Math.max(porcentagemBarra, 5)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-20 text-center text-xs">
                      <div className="font-semibold">{frota.total_producao.toFixed(2)}ha</div>
                      <div>Ha Aplicados</div>
                    </div>
                    <div className="w-16 text-right text-xs font-semibold">{frota.hectare_por_hora.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="border border-gray-400 rounded-md p-4 shadow-sm">
            <h3 className="text-center font-semibold mb-2">% Motor Ocioso</h3>
            <div className={`flex justify-center py-8 ${dadosRelatorio.frotas.filter((f: any) => f && f.frota && f.frota !== 'N/A' && !isNaN(f.frota) && f.horas_motor > 0).length <= 2 ? 'gap-32' : dadosRelatorio.frotas.filter((f: any) => f && f.frota && f.frota !== 'N/A' && !isNaN(f.frota) && f.horas_motor > 0).length === 3 ? 'gap-20' : 'gap-12'}`}>
              {dadosRelatorio.frotas.filter((frota: any) => {
                // Filtrar apenas frotas com dados válidos
                const frotaValida = frota && 
                  typeof frota === 'object' && 
                  frota.frota && 
                  frota.frota !== 'N/A' && 
                  !isNaN(frota.frota) &&
                  typeof frota.horas_motor === 'number' && 
                  frota.horas_motor > 0;
                return frotaValida;
              }).map((frota: any) => (
                <div key={frota.frota} className="flex flex-col items-center">
                  <div className="relative w-40 h-40">
                    <svg viewBox="-20 -20 140 140" className="w-full h-full">
                      {/* Fundo cinza claro */}
                      <circle 
                        cx="50" cy="50" r="40" 
                        fill="#f5f5f5" 
                      />
                      
                      {/* Círculo de trabalho (verde) */}
                      <circle 
                        cx="50" cy="50" r="40" 
                        fill="transparent" 
                        stroke="#22c55e" 
                        strokeWidth="15" 
                        strokeDasharray={`${(100 - frota.motor_ocioso_perc) * 2.51} ${251 - (100 - frota.motor_ocioso_perc) * 2.51}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />
                      
                      {/* Círculo ocioso (vermelho) */}
                      <circle 
                        cx="50" cy="50" r="40" 
                        fill="transparent" 
                        stroke="#ef4444" 
                        strokeWidth="15" 
                        strokeDasharray={`${frota.motor_ocioso_perc * 2.51} ${251 - frota.motor_ocioso_perc * 2.51}`}
                        strokeDashoffset={`${-(100 - frota.motor_ocioso_perc) * 2.51}`}
                        strokeLinecap="round"
                      />
                      
                      {/* Frota no centro */}
                      <text 
                        x="50" 
                        y="53" 
                        textAnchor="middle" 
                        fontSize="14" 
                        fill="#000"
                        fontWeight="bold"
                      >
                        {frota.frota}
                      </text>
                      
                      {/* Texto da porcentagem trabalhando (canto inferior esquerdo) */}
                      <text 
                        x="15" 
                        y="85" 
                        textAnchor="middle" 
                        fontSize="12" 
                        fill="#000000"
                        fontWeight="bold"
                      >
                        {(100 - frota.motor_ocioso_perc).toFixed(2)}%
                      </text>
                      
                      {/* Texto da porcentagem ocioso (canto superior direito) */}
                      <text 
                        x="85" 
                        y="15" 
                        textAnchor="middle" 
                        fontSize="12" 
                        fill="#000000"
                        fontWeight="bold"
                      >
                        {frota.motor_ocioso_perc.toFixed(2)}%
                      </text>
                    </svg>
                  </div>
                  <div className="mt-4 text-xs flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500"></div>
                      <span>Motor Ocioso</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500"></div>
                      <span>Trabalhando</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Segunda página com mapa de deslocamento */}
        <div className="pagina-2 border rounded-md p-6 mb-4 print:border-none print:p-0 print:page-break-before bg-white flex flex-col" style={{ width: "210mm", height: "297mm" }}>
          <div className="border border-gray-400 rounded-md p-4 mb-4 shadow-sm">
            <h3 className="text-center font-semibold mb-2">Consumo de Combustível (l/h)</h3>

            <div className="flex flex-col gap-4">
              {dadosRelatorio.frotas && dadosRelatorio.frotas.length > 0 ? (
                dadosRelatorio.frotas.filter((frota: any) => {
                  // Filtrar apenas frotas com dados válidos
                  const frotaValida = frota && 
                    typeof frota === 'object' && 
                    frota.frota && 
                    frota.frota !== 'N/A' && 
                    !isNaN(frota.frota) &&
                    typeof frota.horas_motor === 'number' && 
                    frota.horas_motor > 0;
                  return frotaValida;
                }).map((frota: any) => {
                  // Verificar se frota é um objeto válido
                  if (!frota || typeof frota !== 'object') {
                    console.error("Frota inválida no gráfico Consumo de Combustível:", frota);
                    return null;
                  }
                  
                  // Garantir que os valores numéricos existem
                  const horasMotor = typeof frota.horas_motor === 'number' ? frota.horas_motor : 0;
                  const consumoTotal = typeof frota.combustivel_consumido === 'number' ? frota.combustivel_consumido : 0;
                  const consumoPorHora = horasMotor > 0 ? consumoTotal / horasMotor : 0;
                  
                  // Calcular porcentagem para barra de consumo (baseado no maior consumo por hora)
                  const frotasValidasConsumo = dadosRelatorio.frotas.filter((f: any) => {
                    const hMotor = typeof f.horas_motor === 'number' ? f.horas_motor : 0;
                    const cTotal = typeof f.combustivel_consumido === 'number' ? f.combustivel_consumido : 0;
                    return hMotor > 0 && cTotal > 0;
                  });
                  const maxConsumoPorHora = frotasValidasConsumo.length > 0 ? Math.max(...frotasValidasConsumo.map((f: any) => {
                    const hMotor = f.horas_motor || 0;
                    const cTotal = f.combustivel_consumido || 0;
                    return hMotor > 0 ? cTotal / hMotor : 0;
                  })) : 1;
                  const porcentagemBarraConsumo = maxConsumoPorHora > 0 ? Math.min((consumoPorHora / maxConsumoPorHora) * 80, 80) : 5;
                  
                  return (
                    <div key={frota.frota || 'unknown'} className="flex items-center">
                      <div className="w-12 text-left text-xs font-semibold">{frota.frota || 'N/A'}</div>
                      <div className="w-20 text-center text-xs">
                        <div className="font-semibold">{horasMotor.toFixed(2)}h</div>
                        <div>Horas Motor</div>
                      </div>
                      <div className="flex-1 mx-2 relative">
                        <div className="w-full h-6 bg-gray-300 rounded-full border">
                          <div 
                            className="bg-green-600 h-6 rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(porcentagemBarraConsumo, 5)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-20 text-center text-xs">
                        <div className="font-semibold">{consumoTotal.toFixed(2)} L</div>
                        <div>Total Consumo</div>
                      </div>
                      <div className="w-16 text-right text-xs font-semibold">{consumoPorHora.toFixed(2)}</div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 text-sm">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </div>
          
          <div className="border border-gray-400 rounded-md p-2 shadow-sm flex-1 flex flex-col">
            <h3 className="text-center font-semibold mb-2">Mapa de deslocamento</h3>
            <div 
              className="flex justify-center flex-1 relative"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {imagemDeslocamento ? (
                <img 
                  src={imagemDeslocamento} 
                  alt="Mapa de deslocamento" 
                  className="max-w-full h-auto object-contain"
                  style={{ maxHeight: "calc(297mm - 350px)", maxWidth: "calc(210mm - 40px)" }}
                  onError={(e) => {
                    console.error("Erro ao carregar imagem de deslocamento:", e);
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="12" text-anchor="middle" fill="%23999">Imagem não disponível</text></svg>';
                  }}
                />
              ) : (
                <div className="w-full bg-gray-200 flex items-center justify-center" style={{ height: "calc(297mm - 200px)" }}>
                  <p className="text-gray-500">Imagem do mapa de deslocamento</p>
                </div>
              )}
              
              {/* Legenda sobreposta com drag & drop */}
              <div 
                className={`absolute bg-white border border-gray-300 rounded-lg p-2 shadow-lg cursor-move select-none ${isDragging ? 'shadow-xl border-blue-400' : ''}`}
                style={
                  legendaCustomPos 
                    ? { left: `${legendaCustomPos.x}px`, top: `${legendaCustomPos.y}px` }
                    : { 
                        [legendaPosicao === 'direita' ? 'right' : 'left']: '8px',
                        bottom: '8px'
                      }
                }
                onMouseDown={handleMouseDown}
                title="Arraste para reposicionar a legenda"
              >
                <div className="space-y-2">
                  {dadosRelatorio.frotas
                    .filter((frota: any) => frota && frota.frota && frota.frota !== 'N/A' && !isNaN(frota.frota))
                    .map((frota: any) => (
                      <div key={frota.frota} className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div 
                          className="w-3 h-3 rounded border flex-shrink-0"
                          style={{ 
                            backgroundColor: frotaCores[frota.frota] || coresDisponiveis[0],
                            width: '12px',
                            height: '12px',
                            flexShrink: 0,
                            border: '1px solid #ccc',
                            borderRadius: '2px'
                          }}
                        ></div>
                        <span 
                          className="text-xs font-bold text-gray-800 leading-none"
                          style={{ 
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#1f2937',
                            lineHeight: '1',
                            verticalAlign: 'middle'
                          }}
                        >
                          {frota.frota}
                        </span>
                      </div>
                    ))}
                </div>
                {/* Indicador visual de que é arrastável */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-50 animate-pulse"></div>
              </div>
            </div>
            <div className="text-center text-xs mt-1">
              <p>*** As cores dos rastros não refletem lâmina de aplicação, apenas diferem a frota ***</p>
            </div>
          </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}