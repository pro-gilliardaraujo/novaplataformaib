"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { buscarDadosProducaoPorFrenteData } from "@/lib/cav/diario-cav-service"
import { X, Download, Copy, Printer, Palette } from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { cn } from "@/lib/utils"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import "./relatorio-styles.css"

interface RelatorioDiarioCavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  frente: string
  data: Date
  imagemDeslocamento?: string
  imagemArea?: string
  dadosPassados?: Record<string, any>
}

export function RelatorioDiarioCav({ 
  open, 
  onOpenChange, 
  frente, 
  data,
  imagemDeslocamento,
  imagemArea,
  dadosPassados
}: RelatorioDiarioCavProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [dadosRelatorio, setDadosRelatorio] = useState<any>(null)
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
        setError('Erro ao buscar dados do relatório')
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
        setError('Erro ao salvar configurações da legenda')
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
      setError('Erro ao salvar configurações da legenda')
    }
  }
  
  useEffect(() => {
    if (open && frente && data) {
      carregarDados()
    }
  }, [open, frente, data, dadosPassados])
  
  const carregarDados = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      console.log(`Carregando dados para frente: ${frente}, data original: ${data.toISOString()}`);
      console.log(`Dados já passados:`, dadosPassados);
      
      // Se temos dados passados diretamente (do diario_cav), usar esses dados
      if (dadosPassados && Object.keys(dadosPassados).length > 0) {
        console.log("🎯 Usando dados passados diretamente da tabela diario_cav");
        console.log("📊 Dados recebidos:", dadosPassados);
        
        // Os dados agora vêm com a nova estrutura: { frotas: {...}, agregados: {...} }
        const frotasData = dadosPassados.frotas || dadosPassados; // Compatibilidade com dados antigos
        const agregadosData = dadosPassados.agregados || null;
        
        console.log("📊 Frotas recebidas:", frotasData);
        console.log("📊 Agregados recebidos:", agregadosData);
        
        // Transformar para o formato esperado pelo relatório
        const frotasProducao = Object.entries(frotasData).map(([frotaKey, dadosFrota]: [string, any]) => {
          const frotaNum = parseInt(frotaKey);
          const totalProducao = dadosFrota.total_producao || 0;
          const horasMotor = dadosFrota.h_motor || 0;
          const hectarePorHora = dadosFrota.hectare_por_hora || 0;
          const turnos = dadosFrota.turnos || [];
          
          // Converter fator de carga para porcentagem (multiplicar por 100)
          const motorOciosoPerc = (dadosFrota.fator_carga_motor_ocioso || 0) * 100;
          
          console.log(`🚜 Frota ${frotaNum}: produção=${totalProducao}ha, horas=${horasMotor}h, ha/h=${hectarePorHora.toFixed(2)}, ocioso=${motorOciosoPerc.toFixed(1)}%, turnos=${turnos.length}`);
          
          return {
            frota: frotaNum,
            turnos: turnos,
            total_producao: totalProducao,
            horas_motor: horasMotor,
            hectare_por_hora: hectarePorHora,
            motor_ocioso_perc: motorOciosoPerc,
            combustivel_consumido: dadosFrota.combustivel_consumido || 0
          };
        });
        
        console.log("🔄 Frotas transformadas:", frotasProducao);
        
        // Calcular totais (usar dados agregados se disponíveis)
        const totalProducaoGeral = frotasProducao.reduce((sum, f) => sum + f.total_producao, 0);
        const totalHorasMotor = frotasProducao.reduce((sum, f) => sum + f.horas_motor, 0);
        
        // Usar dados agregados se disponíveis, senão usar valores padrão
        const totaisCalculados = agregadosData ? {
          total_producao: agregadosData.total_producao || totalProducaoGeral,
          total_horas_motor: totalHorasMotor,
          lamina_alvo: agregadosData.lamina_alvo || 10,
          total_viagens: agregadosData.total_viagens_feitas || 20,
          lamina_aplicada: agregadosData.lamina_aplicada || 0,
          viagens_orcadas: agregadosData.total_viagens_orcadas || 0,
          dif_viagens_perc: agregadosData.dif_viagens_perc || 0,
          dif_lamina_perc: agregadosData.dif_lamina_perc || 0
        } : {
          total_producao: totalProducaoGeral,
          total_horas_motor: totalHorasMotor,
          lamina_alvo: 10,
          total_viagens: 20,
          lamina_aplicada: 0,
          viagens_orcadas: 0,
          dif_viagens_perc: 0,
          dif_lamina_perc: 0
        };
        
        console.log("📊 Totais calculados:", totaisCalculados);
        
        const dadosTransformados = {
          frotas: frotasProducao,
          totais: totaisCalculados
        };
        
        console.log("✅ Dados finais transformados:", dadosTransformados);
        
        setDadosRelatorio(dadosTransformados);
        inicializarCoresFrotas(dadosTransformados.frotas || []);
        
        // Carregar configurações salvas da legenda
        if (dadosPassados.legenda) {
          const { posicao, customPos, cores } = dadosPassados.legenda;
          if (posicao) setLegendaPosicao(posicao);
          if (customPos) setLegendaCustomPos(customPos);
          if (cores) setFrotaCores(cores);
        }
        
        setIsLoading(false);
        return;
      }
      
      // Caso contrário, buscar dados do serviço (fallback para dados mockados)
      console.log("⚠️ Nenhum dado passado, buscando do serviço...");
      
      // Garantir que estamos usando a data correta (sem problemas de fuso horário)
      // Usar a data fornecida diretamente, já que ela foi ajustada no componente DiarioCav
      const dataFormatada = new Date(data);
      
      console.log(`Data formatada para busca: ${dataFormatada.toISOString()}`);
      
      const dados = await buscarDadosProducaoPorFrenteData(frente, dataFormatada)
      
      // Garantir que todas as frotas tenham todas as propriedades necessárias definidas
      if (dados && dados.frotas && Array.isArray(dados.frotas)) {
        dados.frotas = dados.frotas.map((frota: any) => {
          if (!frota) return null;
          
          // Garantir que todas as propriedades essenciais estejam definidas
          const frotaNormalizada = {
            ...frota,
            combustivel_consumido: typeof frota.combustivel_consumido === 'number' && !isNaN(frota.combustivel_consumido) ? frota.combustivel_consumido : 0,
            horas_motor: typeof frota.horas_motor === 'number' && !isNaN(frota.horas_motor) ? frota.horas_motor : 0,
            motor_ocioso_perc: typeof frota.motor_ocioso_perc === 'number' && !isNaN(frota.motor_ocioso_perc) ? frota.motor_ocioso_perc : 0,
            hectare_por_hora: typeof frota.hectare_por_hora === 'number' && !isNaN(frota.hectare_por_hora) ? frota.hectare_por_hora : 0,
            total_producao: typeof frota.total_producao === 'number' && !isNaN(frota.total_producao) ? frota.total_producao : 0
          };
          
          console.log(`Frota ${frotaNormalizada.frota} normalizada:`, {
            combustivel_consumido: frotaNormalizada.combustivel_consumido,
            horas_motor: frotaNormalizada.horas_motor,
            motor_ocioso_perc: frotaNormalizada.motor_ocioso_perc
          });
          
          return frotaNormalizada;
        }).filter(Boolean);
      }
      
      // Não precisamos verificar todas as propriedades, apenas verificamos no momento de renderizar
      console.log("Dados carregados no modal de detalhes:", dados.frotas?.map((f: any) => ({ 
        frota: f.frota,
        combustivel_consumido: f.combustivel_consumido
      })));
      
      setDadosRelatorio(dados)
      inicializarCoresFrotas(dados.frotas || [])
    } catch (error: any) {
      console.error("Erro ao carregar dados do relatório:", error)
      setError(error.message || "Erro ao carregar dados do relatório")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDownloadPDF = async () => {
    if (!relatorioRef.current) return
    
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
      
      // Terceira página com imagem de área (se existir)
      if (imagemArea) {
        pdf.addPage()
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = imagemArea
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error("Erro ao carregar imagem de área"))
        })
        
        // Calcular dimensões para manter proporção
        const imgAspectRatio = img.width / img.height
        let imgWidth = contentWidth
        let imgHeight = contentWidth / imgAspectRatio
        
        if (imgHeight > contentHeight) {
          imgHeight = contentHeight
          imgWidth = contentHeight * imgAspectRatio
        }
        
        const x = margin + (contentWidth - imgWidth) / 2
        const y = margin + (contentHeight - imgHeight) / 2
        
        pdf.addImage(img, "PNG", x, y, imgWidth, imgHeight)
      }
      
      pdf.save(`Relatório-CAV-${frente}-${format(data, "dd-MM-yyyy")}.pdf`)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      setError("Erro ao gerar PDF")
    }
  }
  
  const handleCopyAsPNG = async () => {
    if (!relatorioRef.current) return
    
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
        } catch (err) {
          // Fallback para método mais antigo
          const data = [new ClipboardItem({ "image/png": blob })]
          const clipboardItemData = [new ClipboardItem({ "image/png": blob })]
          navigator.clipboard.write(clipboardItemData)
        }
      })
    } catch (error) {
      console.error("Erro ao copiar como PNG:", error)
      setError("Erro ao copiar como PNG")
    }
  }
  
  const handlePrint = () => {
    window.print()
  }
  
  const handleOpenInNewTab = () => {
    // Forçar a data correta sem ajustes de fuso horário
    // Usar o formato yyyy-MM-dd diretamente
    const dataFormatada = format(data, "yyyy-MM-dd");
    
    console.log(`Data para nova aba: ${data.toISOString()}, Data formatada: ${dataFormatada}`);
    
    // Construir URL para a página de preview com parâmetros
    const params = new URLSearchParams({
      frente: frente,
      data: dataFormatada // Usar a string formatada diretamente
    });
    
    // Adicionar parâmetros opcionais apenas se existirem
    if (imagemDeslocamento) {
      params.append('imagemDeslocamento', imagemDeslocamento);
    }
    
    if (imagemArea) {
      params.append('imagemArea', imagemArea);
    }
    
    const url = `/preview/relatorio-cav?${params.toString()}`;
    console.log(`Abrindo relatório em nova aba: ${url}`);
    window.open(url, '_blank');
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-full max-h-[95vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 text-center border-b">
          <DialogTitle className="text-xl font-bold">Relatório Diário CAV</DialogTitle>
          <div className="text-sm text-gray-600 mt-2">
            Frente: {frente} - Data: {format(data, "dd/MM/yyyy", { locale: ptBR })}
          </div>
          <DialogClose asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-4 h-8 w-8 rounded-lg border border-gray-300 shadow-sm"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        
        {/* Cabeçalho fixo com controles de legenda e comandos */}
        {!isLoading && dadosRelatorio && dadosRelatorio.frotas && dadosRelatorio.frotas.length > 0 && (
          <div className="border-b bg-white px-6 py-3">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}
            
            <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
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
                  onClick={handleOpenInNewTab}
                  disabled={isLoading}
                >
                  <span>Abrir em Nova Aba</span>
                </Button>
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
          </div>
        )}
        
        <div className="flex-1 overflow-auto p-6">
          {!dadosRelatorio && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}
          
          {/* Conteúdo do relatório */}
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
          ) : dadosRelatorio ? (
            <div className="flex justify-center">
              <div ref={relatorioRef} className="print:shadow-none" style={{ width: "210mm", minHeight: "297mm" }}>
            {/* Primeira página com gráficos */}
            <div className="pagina-1 border rounded-md p-6 mb-4 print:border-none print:p-0" style={{ width: "210mm", height: "297mm" }}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <img src="https://kjlwqezxzqjfhacmjhbh.supabase.co/storage/v1/object/public/sourcefiles/logo.png" alt="Logo" className="h-10" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold">Relatório Diário de Frotas - {frente}</h2>
                  <p className="text-sm">{format(data, "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <img src="https://kjlwqezxzqjfhacmjhbh.supabase.co/storage/v1/object/public/sourcefiles/logo.png" alt="Logo" className="h-10" />
                </div>
              </div>
              
              <div className="border border-gray-400 rounded-md p-4 mb-6 shadow-sm">
                <h3 className="text-center font-semibold mb-2">Ha aplicados</h3>

                <div className={`flex justify-center ${dadosRelatorio.frotas.filter((f: any) => f && f.frota && f.frota !== 'N/A' && !isNaN(f.frota) && f.horas_motor > 0).length <= 2 ? 'gap-32' : dadosRelatorio.frotas.filter((f: any) => f && f.frota && f.frota !== 'N/A' && !isNaN(f.frota) && f.horas_motor > 0).length === 3 ? 'gap-20' : 'gap-12'}`}>
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
                        console.error("Frota inválida no gráfico Ha aplicados:", frota);
                        return null;
                      }
                      
                      // Garantir que turnos existe e é um array
                      const turnos = Array.isArray(frota.turnos) ? frota.turnos : [];
                      
                      return (
                        <div key={frota.frota || 'unknown'} className="flex flex-col items-center">
                          <div className="flex gap-3 mb-4">
                            {turnos.map((turno: any) => {
                              if (!turno || typeof turno !== 'object') {
                                return null;
                              }
                              
                              const producao = typeof turno.producao === 'number' ? turno.producao : 0;
                              
                              return (
                                <div key={`${frota.frota}-${turno.turno || 'unknown'}`} className="flex flex-col items-center">
                                  <div className="h-32 flex flex-col justify-end">
                                    <div className="text-xs mb-1">{producao.toFixed(2)}</div>
                                    <div 
                                      className="bg-green-500 w-8" 
                                      style={{ height: `${Math.min(producao * 4, 100)}px` }}
                                    ></div>
                                  </div>
                                  <div className="mt-1 text-xs">{turno.turno || '?'}</div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="text-xs text-center border-t pt-2 w-full">
                            <div>Fazenda {turnos[0]?.codigo || "N/A"} - Vazão: 10m³</div>
                            <div className="font-semibold">{frota.frota || 'Desconhecida'}</div>
                            <div>Total frota: {(typeof frota.total_producao === 'number' ? frota.total_producao : 0).toFixed(2)} ha</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center w-full text-gray-500">
                      Nenhum dado de produção disponível
                    </div>
                  )}
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
                        console.error("Frota inválida no gráfico Hectares por Hora Motor:", frota);
                        return null;
                      }
                      
                      // Garantir que os valores numéricos existem
                      const horasMotor = typeof frota.horas_motor === 'number' ? frota.horas_motor : 0;
                      const hectarePorHora = typeof frota.hectare_por_hora === 'number' ? frota.hectare_por_hora : 0;
                      const totalProducao = typeof frota.total_producao === 'number' ? frota.total_producao : 0;
                      
                      // Calcular porcentagem para barra (baseado no maior hectare_por_hora, máximo 80%)
                      const frotasValidas = dadosRelatorio.frotas.filter((f: any) => f && f.hectare_por_hora > 0);
                      const maxHectarePorHora = frotasValidas.length > 0 ? Math.max(...frotasValidas.map((f: any) => f.hectare_por_hora)) : 1;
                      const porcentagemBarra = maxHectarePorHora > 0 ? Math.min((hectarePorHora / maxHectarePorHora) * 80, 80) : 5;
                      
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
                                style={{ width: `${Math.max(porcentagemBarra, 5)}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-20 text-center text-xs">
                            <div className="font-semibold">{totalProducao.toFixed(2)}ha</div>
                            <div>Ha Aplicados</div>
                          </div>
                          <div className="w-16 text-right text-xs font-semibold">{hectarePorHora.toFixed(2)}</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center w-full text-gray-500">
                      Nenhum dado de hectares por hora disponível
                    </div>
                  )}
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
            {imagemDeslocamento && (
              <div className="pagina-2 border rounded-md p-6 mb-4 print:border-none print:p-0 print:page-break-before flex flex-col" style={{ width: "210mm", height: "297mm" }}>
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
                    <img 
                      src={imagemDeslocamento} 
                      alt="Mapa de deslocamento" 
                      className="max-w-full h-auto object-contain"
                      style={{ maxHeight: "calc(297mm - 350px)", maxWidth: "calc(210mm - 40px)" }}
                    />
                    
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
            )}
            
            {/* Terceira página com imagem de área */}
            {imagemArea && (
              <div className="pagina-3 border rounded-md p-6 print:border-none print:p-0 print:page-break-before" style={{ width: "210mm", height: "297mm" }}>
                <div className="flex justify-center">
                  <img 
                    src={imagemArea} 
                    alt="Imagem de área" 
                    className="max-w-full max-h-[calc(297mm-60px)] object-contain"
                  />
                </div>
              </div>
            )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              Nenhum dado disponível para o relatório
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}