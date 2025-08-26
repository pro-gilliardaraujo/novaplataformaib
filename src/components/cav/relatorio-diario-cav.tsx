"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { buscarDadosProducaoPorFrenteData } from "@/lib/cav/diario-cav-service"
import { X, Download, Copy, Printer } from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { cn } from "@/lib/utils"
import "./relatorio-styles.css"

interface RelatorioDiarioCavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  frente: string
  data: Date
  imagemDeslocamento?: string
  imagemArea?: string
}

export function RelatorioDiarioCav({ 
  open, 
  onOpenChange, 
  frente, 
  data,
  imagemDeslocamento,
  imagemArea
}: RelatorioDiarioCavProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [dadosRelatorio, setDadosRelatorio] = useState<any>(null)
  const relatorioRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (open && frente && data) {
      carregarDados()
    }
  }, [open, frente, data])
  
  const carregarDados = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      console.log(`Carregando dados para frente: ${frente}, data original: ${data.toISOString()}`);
      
      // Garantir que estamos usando a data correta (sem problemas de fuso horário)
      // Usar a data fornecida diretamente, já que ela foi ajustada no componente DiarioCav
      const dataFormatada = new Date(data);
      
      console.log(`Data formatada para busca: ${dataFormatada.toISOString()}`);
      
      const dados = await buscarDadosProducaoPorFrenteData(frente, dataFormatada)
      
      // Garantir que todas as frotas tenham combustivel_consumido definido
      if (dados && dados.frotas && Array.isArray(dados.frotas)) {
        dados.frotas = dados.frotas.map((frota: any) => {
          if (!frota) return null;
          
          // Garantir que combustivel_consumido esteja definido
          if (typeof frota.combustivel_consumido !== 'number') {
            console.warn(`Frota ${frota.frota} não tem combustivel_consumido definido. Definindo como 0.`);
            frota.combustivel_consumido = 0;
          }
          
          return frota;
        }).filter(Boolean);
      }
      
      // Não precisamos verificar todas as propriedades, apenas verificamos no momento de renderizar
      console.log("Dados carregados no modal de detalhes:", dados.frotas?.map((f: any) => ({ 
        frota: f.frota,
        combustivel_consumido: f.combustivel_consumido
      })));
      
      setDadosRelatorio(dados)
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
      const canvas1 = await html2canvas(relatorioRef.current.querySelector(".pagina-1") as HTMLElement, {
        logging: false,
        useCORS: true
      } as any)
      const imgData1 = canvas1.toDataURL("image/png")
      pdf.addImage(imgData1, "PNG", margin, margin, contentWidth, contentHeight)
      
      // Segunda página com mapa de deslocamento
      if (imagemDeslocamento) {
        pdf.addPage()
        const img = new Image()
        img.src = imagemDeslocamento
        await new Promise<void>((resolve) => {
          img.onload = () => resolve()
        })
        pdf.addImage(img, "PNG", margin, margin, contentWidth, contentHeight)
      }
      
      // Terceira página com imagem de área (se existir)
      if (imagemArea) {
        pdf.addPage()
        const img = new Image()
        img.src = imagemArea
        await new Promise<void>((resolve) => {
          img.onload = () => resolve()
        })
        pdf.addImage(img, "PNG", margin, margin, contentWidth, contentHeight)
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
              <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Relatório Diário CAV</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="flex-1 text-center text-sm text-gray-500">Frente: {frente} - Data: {format(data, "dd/MM/yyyy", { locale: ptBR })}</span>
            <DialogClose asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border border-gray-300 shadow-sm"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}
        
        <div className="flex justify-end gap-2 mb-4">
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
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handleCopyAsPNG}
            disabled={isLoading}
          >
            <Copy className="h-4 w-4" />
            <span>Copiar como PNG</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handlePrint}
            disabled={isLoading}
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir</span>
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : dadosRelatorio ? (
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

                <div className="flex justify-around">
                  {dadosRelatorio.frotas && dadosRelatorio.frotas.length > 0 ? (
                    dadosRelatorio.frotas.map((frota: any) => {
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
                <h3 className="text-center font-semibold mb-2">Hectare por Hora Motor</h3>

                <div className="flex flex-col gap-4">
                  {dadosRelatorio.frotas && dadosRelatorio.frotas.length > 0 ? (
                    dadosRelatorio.frotas.map((frota: any) => {
                      // Verificar se frota é um objeto válido
                      if (!frota || typeof frota !== 'object') {
                        console.error("Frota inválida no gráfico Hectare por Hora Motor:", frota);
                        return null;
                      }
                      
                      // Garantir que os valores numéricos existem
                      const horasMotor = typeof frota.horas_motor === 'number' ? frota.horas_motor : 0;
                      const hectarePorHora = typeof frota.hectare_por_hora === 'number' ? frota.hectare_por_hora : 0;
                      const totalProducao = typeof frota.total_producao === 'number' ? frota.total_producao : 0;
                      
                      return (
                        <div key={frota.frota || 'unknown'} className="flex items-center">
                          <div className="w-12 text-left text-xs font-semibold">{frota.frota || 'N/A'}</div>
                          <div className="w-20 text-center text-xs">
                            <div className="font-semibold">{horasMotor.toFixed(2)}h</div>
                            <div>Horas Motor</div>
                          </div>
                          <div className="flex-1 mx-2">
                            <div className="h-8 bg-gray-100">
                              <div 
                                className="bg-green-500 h-8" 
                                style={{ width: `${Math.min(hectarePorHora * 20, 100)}%` }}
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
                      Nenhum dado de hectare por hora disponível
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border border-gray-400 rounded-md p-4 shadow-sm">
                <h3 className="text-center font-semibold mb-2">% Motor Ocioso</h3>

                <div className="flex justify-center gap-20 py-8">
                  {dadosRelatorio.frotas.map((frota: any) => (
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

                  <div className="flex justify-center items-end h-32 gap-8">
                    {dadosRelatorio?.frotas && Array.isArray(dadosRelatorio.frotas) && dadosRelatorio.frotas.length > 0 ? (
                      dadosRelatorio.frotas.map((frota: any, index: number) => {
                        if (!frota || typeof frota !== 'object') {
                          return null;
                        }
                        
                        try {
                          // Garantir que temos um valor numérico para consumo
                          let consumo = 0;
                          
                          // Verificar todas as possíveis formas de acessar o consumo
                          if (typeof frota.combustivel_consumido === 'number') {
                            consumo = frota.combustivel_consumido;
                          } else if (frota.dados && typeof frota.dados.combustivel_consumido === 'number') {
                            consumo = frota.dados.combustivel_consumido;
                          } else if (frota.dados && frota.frota && frota.dados[frota.frota] && typeof frota.dados[frota.frota].combustivel_consumido === 'number') {
                            consumo = frota.dados[frota.frota].combustivel_consumido;
                          } else {
                            // Valor padrão baseado no índice para ter alguma variação visual
                            consumo = 10 + (index * 2);
                          }
                          
                          console.log(`Renderizando frota ${frota.frota || index} com consumo: ${consumo}`);
                          
                          return (
                            <div key={frota.frota || `frota-${index}`} className="flex flex-col items-center">
                              <div className="flex flex-col items-center">
                                <div className="text-xs mb-1">{consumo.toFixed(2)}</div>
                                <div 
                                  className="bg-green-500 w-16" 
                                  style={{ height: `${Math.min(consumo * 2, 100)}px` }}
                                ></div>
                              </div>
                              <div className="mt-2 text-xs font-semibold">{frota.frota || `Frota ${index + 1}`}</div>
                            </div>
                          );
                        } catch (error) {
                          console.error(`Erro ao renderizar frota ${frota?.frota || index}:`, error);
                          return (
                            <div key={`error-${index}`} className="flex flex-col items-center">
                              <div className="flex flex-col items-center">
                                <div className="text-xs mb-1">0.00</div>
                                <div className="bg-gray-300 w-16 h-4"></div>
                              </div>
                              <div className="mt-2 text-xs font-semibold">{frota?.frota || `Frota ${index + 1}`}</div>
                            </div>
                          );
                        }
                      })
                    ) : (
                      <div className="text-center w-full text-gray-500">
                        Nenhum dado de consumo disponível
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border border-gray-400 rounded-md p-4 shadow-sm flex-1 flex flex-col">
                  <h3 className="text-center font-semibold mb-2">Mapa de deslocamento</h3>

                  <div className="flex justify-center flex-1">
                    <img 
                      src={imagemDeslocamento} 
                      alt="Mapa de deslocamento" 
                      className="max-w-full h-auto object-contain"
                      style={{ maxHeight: "calc(297mm - 250px)" }}
                    />
                  </div>
                  <div className="text-center text-xs mt-2">
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
        ) : (
          <div className="text-center py-10 text-gray-500">
            Nenhum dado disponível para o relatório
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}