"use client"

import { useState, useRef } from "react"
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
  const relatorioRef = useRef<HTMLDivElement>(null)
  
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
              <h2 className="text-xl font-bold">Relatório Diário de Frotas - Moema Frente 2</h2>
              <p className="text-sm">{format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</p>
            </div>
            <div className="flex items-center gap-2">
              <img src="https://kjlwqezxzqjfhacmjhbh.supabase.co/storage/v1/object/public/sourcefiles/logo.png" alt="Logo" className="h-10" />
            </div>
          </div>
          
          <div className="border border-gray-400 rounded-md p-4 mb-6 shadow-sm">
            <h3 className="text-center font-semibold mb-2">Ha aplicados</h3>
            <div className="flex justify-around">
              {dadosMock.frotas.map((frota) => (
                <div key={frota.frota} className="flex flex-col items-center">
                  <div className="flex gap-3 mb-4">
                    {frota.turnos.map((turno) => (
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
              <div className="text-base font-semibold">Total Aplicado: {dadosMock.totais.total_producao.toFixed(2)}</div>
            </div>
            <div className="text-center mt-2 border-t pt-2">
              <div className="text-xs">Lâmina Alvo: {dadosMock.totais.lamina_alvo.toFixed(2)} | Lâmina Aplicada: {dadosMock.totais.lamina_aplicada.toFixed(2)}</div>
              <div className="text-xs">Total Viagens: {dadosMock.totais.total_viagens} | Viagens Orçadas: {dadosMock.totais.viagens_orcadas.toFixed(2)} | % Diferença: {dadosMock.totais.dif_viagens_perc.toFixed(2)}%</div>
            </div>
          </div>
          
          <div className="border border-gray-400 rounded-md p-4 mb-6 shadow-sm">
            <h3 className="text-center font-semibold mb-2">Hectare por Hora Motor</h3>
            <div className="flex flex-col gap-4">
              {dadosMock.frotas.map((frota) => (
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
              {dadosMock.frotas.map((frota) => (
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
              {dadosMock.frotas.map((frota) => (
                <div key={frota.frota} className="flex flex-col items-center">
                  <div className="flex flex-col items-center">
                    <div className="text-xs mb-1">{frota.combustivel_consumido.toFixed(2)}</div>
                    <div 
                      className="bg-green-500 w-16" 
                      style={{ height: `${Math.min(frota.combustivel_consumido * 2, 100)}px` }}
                    ></div>
                  </div>
                  <div className="mt-2 text-xs font-semibold">{frota.frota}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border border-gray-400 rounded-md p-4 shadow-sm flex-1 flex flex-col">
            <h3 className="text-center font-semibold mb-2">Mapa de deslocamento</h3>
            <div className="flex justify-center flex-1">
              <div className="w-full bg-gray-200 flex items-center justify-center" style={{ height: "calc(297mm - 450px)" }}>
                <p className="text-gray-500">Imagem do mapa de deslocamento</p>
              </div>
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