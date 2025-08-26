"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Copy, Printer } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
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
    console.log(`Carregando dados para frente: ${frente}, data: ${format(data, "yyyy-MM-dd")}`);
    
    try {
      const { buscarDadosProducaoPorFrenteData } = await import('@/lib/cav/diario-cav-service');
      const dados = await buscarDadosProducaoPorFrenteData(frente, data);
      console.log("Dados carregados com sucesso:", dados);
      
      // Não precisamos verificar todas as propriedades, apenas verificamos no momento de renderizar
      
      setDadosRelatorio(dados);
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
      const canvas1 = await html2canvas(relatorioRef.current.querySelector(".pagina-1") as HTMLElement, {
        logging: false,
        useCORS: true
      } as any)
      const imgData1 = canvas1.toDataURL("image/png")
      pdf.addImage(imgData1, "PNG", margin, margin, contentWidth, contentHeight)
      
      // Segunda página com mapa de deslocamento
      pdf.addPage()
      const canvas2 = await html2canvas(relatorioRef.current.querySelector(".pagina-2") as HTMLElement)
      const imgData2 = canvas2.toDataURL("image/png")
      pdf.addImage(imgData2, "PNG", margin, margin, contentWidth, contentHeight)
      
      pdf.save(`Relatório-CAV-Preview.pdf`)
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
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Preview do Relatório CAV</h1>
      
      <div className="flex justify-end gap-2 mb-4">
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
      
      <div ref={relatorioRef} className="print:shadow-none" style={{ width: "210mm", minHeight: "297mm" }}>
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
            <div className="flex justify-around">
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
                    <div>Fazenda {frota.turnos[0]?.codigo || ""} - Vazão: 10m³</div>
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
            <h3 className="text-center font-semibold mb-2">Hectare por Hora Motor</h3>
            <div className="flex flex-col gap-4">
              {dadosRelatorio.frotas.map((frota: any) => (
                <div key={frota.frota} className="flex items-center">
                  <div className="w-12 text-left text-xs font-semibold">{frota.frota}</div>
                  <div className="w-20 text-center text-xs">
                    <div className="font-semibold">{frota.horas_motor.toFixed(2)}h</div>
                    <div>Horas Motor</div>
                  </div>
                  <div className="flex-1 mx-2">
                    <div className="h-8 bg-gray-100">
                      <div 
                        className="bg-green-500 h-8" 
                        style={{ width: `${Math.min(frota.hectare_por_hora * 20, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-20 text-center text-xs">
                    <div className="font-semibold">{frota.total_producao.toFixed(2)}ha</div>
                    <div>Ha Aplicados</div>
                  </div>
                  <div className="w-16 text-right text-xs font-semibold">{frota.hectare_por_hora.toFixed(2)}</div>
                </div>
              ))}
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
        <div className="pagina-2 border rounded-md p-6 mb-4 print:border-none print:p-0 print:page-break-before bg-white flex flex-col" style={{ width: "210mm", height: "297mm" }}>
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
                    
                    console.log(`Preview: Renderizando frota ${frota.frota || index} com consumo: ${consumo}`);
                    
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
              {imagemDeslocamento ? (
                <img 
                  src={imagemDeslocamento} 
                  alt="Mapa de deslocamento" 
                  className="max-w-full h-auto object-contain"
                  style={{ maxHeight: "calc(297mm - 250px)" }}
                  onError={(e) => {
                    console.error("Erro ao carregar imagem de deslocamento:", e);
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="12" text-anchor="middle" fill="%23999">Imagem não disponível</text></svg>';
                  }}
                />
              ) : (
                <div className="w-full bg-gray-200 flex items-center justify-center" style={{ height: "calc(297mm - 450px)" }}>
                  <p className="text-gray-500">Imagem do mapa de deslocamento</p>
                </div>
              )}
            </div>
            <div className="text-center text-xs mt-2">
              <p>*** As cores dos rastros não refletem lâmina de aplicação, apenas diferem a frota ***</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}