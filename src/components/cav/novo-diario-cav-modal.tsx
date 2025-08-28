"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { CalendarIcon, FileText, FileUp, Image, Plus, Trash2, Upload, X } from "lucide-react"
import { format, parse } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { FRENTES_CONFIG } from "@/types/cav"
import { v4 as uuidv4 } from "uuid"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { DiarioCavFrotaData, PreviaBoletinsCav, ProducaoFrotaTurno, BoletimCavAgregado } from "@/types/diario-cav"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
// Removida importação do RelatorioDiarioCav, pois relatórios serão acessados em outra tela

interface NovoDiarioCavModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// Interface para cada item de frente
interface FrenteItem {
  id: string;
  frente: string;
  data: Date;
  imgDesloc: File | null;
  imgArea: File | null;
  prevDesloc: string | null;
  prevArea: string | null;
  dadosFiltrados?: Record<string, DiarioCavFrotaData>;
  dadosBoletinsCav?: PreviaBoletinsCav; // Dados de boletins CAV (granulares e agregados)
}

// Interface para os dados do arquivo OPC
interface OpcData {
  data: string;
  maquina: string;
  horasMotor: number;
  combustivelConsumido: number;
  fatorCargaMotorOcioso: number;
}

export function NovoDiarioCavModal({ open, onOpenChange, onSuccess }: NovoDiarioCavModalProps) {
  // Definir a data de ontem como padrão, garantindo que o dia esteja correto
  const hoje = new Date();
  // Criar uma nova data para ontem usando ano, mês e dia explicitamente
  const ontem = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate() - 1,
    12, 0, 0 // Meio-dia para evitar problemas de fuso horário
  );
  console.log(`Data de ontem inicializada: ${ontem.toISOString()}, Dia: ${ontem.getDate()}`);
  
  // Não usamos mais data global
  
  // Estado para múltiplas frentes
  const [frentes, setFrentes] = useState<FrenteItem[]>([{
    id: uuidv4(),
    frente: "",
    data: ontem,
    imgDesloc: null,
    imgArea: null,
    prevDesloc: null,
    prevArea: null,
    dadosFiltrados: {}
  }]);
  
  // Estado para arquivo OPC
  const [arquivoOPC, setArquivoOPC] = useState<File | null>(null);
  const [arquivoNome, setArquivoNome] = useState("");
  const [dadosOPC, setDadosOPC] = useState<OpcData[]>([]);
  const [dadosFrotas, setDadosFrotas] = useState<Record<string, DiarioCavFrotaData>>({});
  
  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [frenteToDelete, setFrenteToDelete] = useState<string | null>(null);
  const [processandoArquivo, setProcessandoArquivo] = useState(false);
  
  // Removemos os estados relacionados ao relatório, pois ele será acessado em outra tela
  
  // Adicionar nova frente
  const handleAddFrente = () => {
    const novoId = uuidv4();
    setFrentes(prev => [...prev, {
      id: novoId,
      frente: "",
      data: ontem,
      imgDesloc: null,
      imgArea: null,
      prevDesloc: null,
      prevArea: null,
      dadosFiltrados: {}
    }]);
    
    // Fazer scroll para o novo bloco após um pequeno delay para garantir que foi renderizado
    setTimeout(() => {
      const novoBloco = document.querySelector(`[data-frente-id="${novoId}"]`);
      if (novoBloco) {
        novoBloco.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center'
        });
        
        // Focar no select da frente
        const selectFrente = novoBloco.querySelector('button[role="combobox"]') as HTMLElement;
        if (selectFrente) {
          selectFrente.focus();
        }
      }
    }, 100);
  };
  
  // Remover frente
  const handleRemoveFrente = (id: string) => {
    setFrentes(prev => prev.filter(f => f.id !== id));
    setFrenteToDelete(null);
  };
  
  // Atualizar frente selecionada
  const handleFrenteChange = (id: string, value: string) => {
    setFrentes(prev => prev.map(f => 
      f.id === id ? { ...f, frente: value } : f
    ));
    
    // Filtrar dados relevantes para esta frente (assíncrono)
    filtrarDadosPorFrenteEData(id, value);
  };
  
  // Atualizar data selecionada
  const handleDataChange = (id: string, newDate: Date | undefined) => {
    const novaData = newDate || ontem;
    
    setFrentes(prev => prev.map(f => 
      f.id === id ? { ...f, data: novaData } : f
    ));
    
    // Filtrar dados relevantes para esta data (assíncrono)
    const frente = frentes.find(f => f.id === id);
    if (frente) {
      filtrarDadosPorFrenteEData(id, frente.frente, novaData);
    }
  };
  
  // Filtrar dados por frente e data
  const filtrarDadosPorFrenteEData = async (frenteId: string, frenteCodigo: string, dataFiltro?: Date) => {
    // Se não temos frente selecionada, não fazemos nada
    if (!frenteCodigo) {
      return;
    }
    
    const frente = frentes.find(f => f.id === frenteId);
    if (!frente) return;
    
    // Garantir que estamos usando a data correta
    const dataAtual = dataFiltro || frente.data;
    
    // Verificar se a data está correta
    console.log(`Data atual para filtro: ${dataAtual.toISOString()}, Dia: ${dataAtual.getDate()}`);
    
    const dataFormatadaDisplay = format(dataAtual, "dd/MM/yyyy");
    const dataFormatadaAPI = format(dataAtual, "yyyy-MM-dd");
    
    console.log(`🔍 FILTRO: Filtrando dados para frente ${frenteCodigo} na data ${dataFormatadaDisplay}`);
    
    // 1. Filtrar dados do arquivo OPC pela data
    console.log("📊 Dados OPC disponíveis:", dadosOPC.map(d => ({ data: d.data, maquina: d.maquina })));
    console.log(`📅 Data de filtro formatada: ${dataFormatadaDisplay}`);
    
    const dadosFiltrados = dadosOPC.filter(dado => {
      console.log(`🔍 Comparando: "${dado.data}" com "${dataFormatadaDisplay}"`);
      
      // Verificar se a data do dado corresponde à data selecionada
      // Primeiro, verificar se é exatamente igual (já formatada corretamente)
      if (dado.data === dataFormatadaDisplay) {
        console.log(`✅ Match exato encontrado para máquina ${dado.maquina}`);
        return true;
      }
      
      // Se não for igual, tentar comparar convertendo para objeto Date
      try {
        // Tentar extrair dia, mês e ano da data do dado
        let diaOPC, mesOPC, anoOPC;
        
        if (dado.data.includes("/")) {
          const partes = dado.data.split("/");
          if (partes.length === 3) {
            // Formato provável: dd/MM/yyyy ou MM/dd/yyyy
            if (parseInt(partes[0]) <= 31) {
              // Provavelmente dd/MM/yyyy
              diaOPC = parseInt(partes[0]);
              mesOPC = parseInt(partes[1]);
              anoOPC = parseInt(partes[2]);
            } else {
              // Provavelmente MM/dd/yyyy
              mesOPC = parseInt(partes[0]);
              diaOPC = parseInt(partes[1]);
              anoOPC = parseInt(partes[2]);
            }
          }
        } else if (dado.data.includes("-")) {
          const partes = dado.data.split("-");
          if (partes.length === 3) {
            // Formato provável: yyyy-MM-dd
            anoOPC = parseInt(partes[0]);
            mesOPC = parseInt(partes[1]);
            diaOPC = parseInt(partes[2]);
          }
        }
        
        // Se conseguimos extrair dia, mês e ano, comparar com a data selecionada
        if (diaOPC && mesOPC && anoOPC) {
          const diaAtual = dataAtual.getDate();
          const mesAtual = dataAtual.getMonth() + 1; // getMonth() retorna 0-11
          const anoAtual = dataAtual.getFullYear();
          
          const match = diaOPC === diaAtual && mesOPC === mesAtual && anoOPC === anoAtual;
          if (match) {
            console.log(`✅ Match por comparação de data encontrado para máquina ${dado.maquina} (${diaOPC}/${mesOPC}/${anoOPC} = ${diaAtual}/${mesAtual}/${anoAtual})`);
          }
          return match;
        }
      } catch (e) {
        console.error("Erro ao comparar datas:", e);
      }
      
      // Se não conseguimos comparar, retornar false
      return false;
    });
    
    console.log(`🎯 RESULTADO DO FILTRO para data ${dataFormatadaDisplay}:`, dadosFiltrados.length, "registros encontrados");
    console.log("📝 Detalhes dos dados filtrados:", dadosFiltrados.map(d => ({ data: d.data, maquina: d.maquina })));
    
    // Criar objeto de frotas filtrado do OPC (temporário)
    const todasFrotasFiltradas: Record<string, DiarioCavFrotaData> = {};
    dadosFiltrados.forEach(dado => {
      todasFrotasFiltradas[dado.maquina] = {
        h_motor: dado.horasMotor,
        combustivel_consumido: dado.combustivelConsumido,
        fator_carga_motor_ocioso: dado.fatorCargaMotorOcioso
      };
    });
    
    // 2. Buscar dados de boletins CAV (granulares e agregados)
    try {
      const supabase = createClientComponentClient();
      
      // O valor da frente vem com o formato "Frente X SETOR", mas no banco está apenas "Frente X"
      // Precisamos extrair apenas a parte "Frente X" para busca no banco de dados
      let frenteBusca = frenteCodigo;
      
      // Se o nome contém um espaço após "Frente X", extrair apenas a parte "Frente X"
      if (frenteBusca.startsWith("Frente ")) {
        // Pegar apenas "Frente X" e remover o sufixo (MOE, ITU, etc.)
        const match = frenteBusca.match(/^(Frente \d+)/);
        if (match) {
          frenteBusca = match[1];
        }
      } else if (frenteBusca.includes(" ")) {
        // Para casos como "Iturama ITU", pegar apenas a primeira parte
        frenteBusca = frenteBusca.split(" ")[0];
      }
      
      console.log(`Buscando dados para frente formatada: "${frenteBusca}" na data ${dataFormatadaAPI}`);
      
      // Buscar dados granulares (boletins_cav)
      const { data: dadosGranulares, error: errorGranular } = await supabase
        .from("boletins_cav")
        .select("id, data, frente, frota, turno, operador, codigo, producao, lamina_alvo")
        .eq("frente", frenteBusca)
        .eq("data", dataFormatadaAPI);
      
      if (errorGranular) {
        console.error("Erro ao buscar dados granulares:", errorGranular);
      }
      
      // Buscar dados agregados (boletins_cav_agregado)
      const { data: dadosAgregados, error: errorAgregado } = await supabase
        .from("boletins_cav_agregado")
        .select("id, data, frente, codigo, setor, total_producao, total_viagens_feitas, total_viagens_orcadas, lamina_alvo, lamina_aplicada, dif_viagens_perc, dif_lamina_perc")
        .eq("frente", frenteBusca)
        .eq("data", dataFormatadaAPI)
        .single();
      
      if (errorAgregado && errorAgregado.code !== 'PGRST116') { // Ignorar erro "não encontrado"
        console.error("Erro ao buscar dados agregados:", errorAgregado);
      }
      
      // Formatar dados granulares para o formato que precisamos
      const producaoPorFrotaTurno: ProducaoFrotaTurno[] = (dadosGranulares || []).map(item => ({
        frota: item.frota,
        turno: item.turno,
        codigo: item.codigo,
        producao: item.producao
      }));
      
      console.log("Dados granulares encontrados:", producaoPorFrotaTurno.length);
      console.log("Dados agregados encontrados:", dadosAgregados ? "Sim" : "Não");
      
      // IMPORTANTE: Filtrar dados OPC para incluir apenas as frotas encontradas nos boletins
      const frotasFiltradas: Record<string, any> = {};
      
      if (dadosGranulares && dadosGranulares.length > 0) {
        // Obter lista de frotas encontradas nos boletins
        const frotasEncontradas = new Set<string>();
        dadosGranulares.forEach(boletim => {
          frotasEncontradas.add(boletim.frota.toString());
        });
        
        console.log("Frotas encontradas nos boletins:", Array.from(frotasEncontradas));
        
        // Agrupar produção por frota
        const producaoPorFrota = new Map<string, number>();
        dadosGranulares.forEach(boletim => {
          const frotaKey = boletim.frota.toString();
          const producaoAtual = producaoPorFrota.get(frotaKey) || 0;
          producaoPorFrota.set(frotaKey, producaoAtual + boletim.producao);
        });
        
        console.log("🎯 Produção por frota calculada:", Object.fromEntries(producaoPorFrota));
        
        // Filtrar e combinar dados OPC com produção
        Object.keys(todasFrotasFiltradas).forEach(frotaKey => {
          if (frotasEncontradas.has(frotaKey)) {
            const dadosOPC = todasFrotasFiltradas[frotaKey];
            const totalProducao = producaoPorFrota.get(frotaKey) || 0;
            const horasMotor = dadosOPC.h_motor || 0;
            const hectarePorHora = horasMotor > 0 ? totalProducao / horasMotor : 0;
            
            // Buscar turnos individuais desta frota
            const turnosFrota = dadosGranulares.filter(boletim => 
              boletim.frota.toString() === frotaKey
            ).map(boletim => ({
              turno: boletim.turno,
              operador: boletim.operador,
              codigo: boletim.codigo,
              producao: boletim.producao,
              lamina_alvo: boletim.lamina_alvo
            }));
            
            // Combinar dados OPC + Produção + Turnos
            frotasFiltradas[frotaKey] = {
              ...dadosOPC,
              total_producao: totalProducao,
              hectare_por_hora: hectarePorHora,
              turnos: turnosFrota
            };
            
            console.log(`🚜 Frota ${frotaKey} combinada: ${totalProducao}ha, ${horasMotor}h, ${hectarePorHora.toFixed(2)}ha/h, ${turnosFrota.length} turnos`);
          }
        });
        
        console.log("✅ Dados OPC + Produção combinados:", frotasFiltradas);
      } else {
        // Se não temos dados de boletins, usar apenas os dados OPC
        console.log("Sem dados de boletins, usando apenas dados OPC");
        Object.assign(frotasFiltradas, todasFrotasFiltradas);
      }
      
      // Atualizar o estado com os dados combinados
      setFrentes(prev => prev.map(f => 
        f.id === frenteId ? { 
          ...f, 
          dadosFiltrados: frotasFiltradas,
          dadosBoletinsCav: {
            dadosGranulares: producaoPorFrotaTurno,
            dadosAgregados: dadosAgregados || undefined
          }
        } : f
      ));
      
    } catch (error) {
      console.error("Erro ao buscar dados de boletins CAV:", error);
      
      // Atualizar apenas com os dados do OPC em caso de erro
      const frotasFiltradas: Record<string, DiarioCavFrotaData> = {};
      Object.assign(frotasFiltradas, todasFrotasFiltradas);
      
      setFrentes(prev => prev.map(f => 
        f.id === frenteId ? { ...f, dadosFiltrados: frotasFiltradas } : f
      ));
    }
  };
  
  // Processar arquivo de imagem
  const processImageFile = (file: File, frenteId: string, isDeslocamento: boolean) => {
    // Validar se é uma imagem
    if (!file.type.startsWith('image/')) {
      setError("Por favor, selecione apenas arquivos de imagem.");
      return;
    }
    
    // Criar URL para preview
    const imageUrl = URL.createObjectURL(file);
    
    setFrentes(prev => prev.map(f => {
      if (f.id === frenteId) {
        if (isDeslocamento) {
          // Limpar preview anterior se existir
          if (f.prevDesloc) URL.revokeObjectURL(f.prevDesloc);
          return { ...f, imgDesloc: file, prevDesloc: imageUrl };
        } else {
          // Limpar preview anterior se existir
          if (f.prevArea) URL.revokeObjectURL(f.prevArea);
          return { ...f, imgArea: file, prevArea: imageUrl };
        }
      }
      return f;
    }));
  };
  
  // Funções para drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-black');
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-black');
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, frenteId: string, isDeslocamento: boolean) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-black');
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const imageFile = droppedFiles.find((file) => file.type.startsWith("image/"));
    
    if (imageFile) {
      processImageFile(imageFile, frenteId, isDeslocamento);
    } else {
      setError("Por favor, arraste apenas arquivos de imagem.");
    }
  };
  
  // Remover imagem
  const handleRemoveImage = (frenteId: string, isDeslocamento: boolean) => {
    console.log(`Removendo imagem: frenteId=${frenteId}, isDeslocamento=${isDeslocamento}`);
    
    // Primeiro atualizar o estado para remover a imagem
    setFrentes(prev => prev.map(f => {
      if (f.id === frenteId) {
        if (isDeslocamento) {
          if (f.prevDesloc) URL.revokeObjectURL(f.prevDesloc);
          return { ...f, imgDesloc: null, prevDesloc: null };
        } else {
          if (f.prevArea) URL.revokeObjectURL(f.prevArea);
          return { ...f, imgArea: null, prevArea: null };
        }
      }
      return f;
    }));
    
    // Resetar o input de arquivo para permitir selecionar a mesma imagem novamente
    // Usar setTimeout para garantir que o DOM foi atualizado
    setTimeout(() => {
      const inputId = isDeslocamento ? `imgDesloc-${frenteId}` : `imgArea-${frenteId}`;
      const inputElement = document.getElementById(inputId) as HTMLInputElement;
      if (inputElement) {
        inputElement.value = '';
        console.log(`Input ${inputId} resetado com sucesso`);
      } else {
        console.error(`Input ${inputId} não encontrado`);
      }
    }, 100);
  };
  
  // Limpar recursos ao fechar o modal
  // Processar arquivo CSV
  const processarCsv = (file: File) => {
    setProcessandoArquivo(true);
    setError("");
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.errors && results.errors.length > 0) {
            setError(`Erro ao processar CSV: ${results.errors[0].message}`);
            setProcessandoArquivo(false);
            return;
          }
          
          // Verificar se há dados
          if (!results.data || results.data.length === 0) {
            setError("Não foram encontrados dados no arquivo CSV.");
            setProcessandoArquivo(false);
            return;
          }
          
          console.log("Dados brutos CSV:", results.data);
          
          // Verificar as colunas disponíveis
          const primeiraLinha = results.data[0] as Record<string, any>;
          console.log("Colunas disponíveis CSV:", Object.keys(primeiraLinha));
          
          const dados: OpcData[] = [];
          const frotas: Record<string, DiarioCavFrotaData> = {};
          
          // Identificar nomes das colunas
          const colunas = {
            data: Object.keys(primeiraLinha).find(key => key.includes("Data") || key === "DATA") || "Data",
            maquina: Object.keys(primeiraLinha).find(key => key.includes("quina") || key === "MAQUINA") || "Máquina",
            horasMotor: Object.keys(primeiraLinha).find(key => 
              key.includes("Hora") && (key.includes("Motor") || key.includes("Operação") || key.includes("Período"))
            ) || "Horas de Operação do Motor Período (h)",
            combustivel: Object.keys(primeiraLinha).find(key => 
              key.includes("Combust") || key.includes("Consumido") || key.includes("Período")
            ) || "Combustível Consumido Período (l)",
            fatorCarga: Object.keys(primeiraLinha).find(key => 
              (key.includes("Fator") || key.includes("Carga") || key.includes("Ocioso") || key.includes("Motor")) && key.includes("%")
            ) || "Fator de Carga Médio do Motor Ocioso (%)"
          };
          
          console.log("Mapeamento de colunas CSV:", colunas);
          
          results.data.forEach((row: any) => {
            // Mapeamento das colunas do arquivo para o nosso formato
            let dataOriginal = row[colunas.data] || "";
            let dataFormatada = "";
            
            // Tentar padronizar o formato da data para dd/MM/yyyy
            try {
              if (dataOriginal) {
                // Se for uma data no formato Excel (número serial)
                if (!isNaN(Number(dataOriginal))) {
                  // Converter número serial do Excel para data JavaScript
                  const excelEpoch = new Date(1899, 11, 30);
                  const dataObj = new Date(excelEpoch.getTime() + Number(dataOriginal) * 24 * 60 * 60 * 1000);
                  dataFormatada = format(dataObj, "dd/MM/yyyy");
                } 
                // Se for uma string de data, tentar converter para o formato padrão
                else {
                  // Tentar detectar o formato da data
                  let dataObj;
                  if (dataOriginal.includes("/")) {
                    // Formato dd/MM/yyyy ou MM/dd/yyyy
                    const partes = dataOriginal.split("/");
                    if (partes.length === 3) {
                      // Assumir dd/MM/yyyy se o primeiro número for <= 31
                      if (parseInt(partes[0]) <= 31) {
                        dataObj = new Date(
                          parseInt(partes[2]), // ano
                          parseInt(partes[1]) - 1, // mês (0-11)
                          parseInt(partes[0]) // dia
                        );
                      } else {
                        // Assumir MM/dd/yyyy
                        dataObj = new Date(
                          parseInt(partes[2]), // ano
                          parseInt(partes[0]) - 1, // mês (0-11)
                          parseInt(partes[1]) // dia
                        );
                      }
                      dataFormatada = format(dataObj, "dd/MM/yyyy");
                    }
                  } else if (dataOriginal.includes("-")) {
                    // Formato yyyy-MM-dd
                    dataObj = new Date(dataOriginal);
                    dataFormatada = format(dataObj, "dd/MM/yyyy");
                  } else {
                    // Outros formatos, tentar parse genérico
                    dataObj = new Date(dataOriginal);
                    if (!isNaN(dataObj.getTime())) {
                      dataFormatada = format(dataObj, "dd/MM/yyyy");
                    }
                  }
                }
              }
            } catch (e) {
              console.error("Erro ao converter data:", e);
              dataFormatada = dataOriginal; // Manter o valor original em caso de erro
            }
            
            const data = dataFormatada || dataOriginal;
          console.log(`Data original: "${dataOriginal}", Data formatada: "${data}"`);
            const maquina = String(row[colunas.maquina] || "").trim();
            
            // Tratar valores numéricos
            let horasMotorStr = row[colunas.horasMotor];
            if (horasMotorStr !== undefined && horasMotorStr !== null) {
              horasMotorStr = String(horasMotorStr).replace(",", ".");
            } else {
              horasMotorStr = "0";
            }
            
            let combustivelStr = row[colunas.combustivel];
            if (combustivelStr !== undefined && combustivelStr !== null) {
              combustivelStr = String(combustivelStr).replace(",", ".");
            } else {
              combustivelStr = "0";
            }
            
            let fatorCargaStr = row[colunas.fatorCarga];
            if (fatorCargaStr !== undefined && fatorCargaStr !== null) {
              fatorCargaStr = String(fatorCargaStr).replace(",", ".");
            } else {
              fatorCargaStr = "0";
            }
            
            // Converter para números, se for vazio ou não numérico, usar 0
            const horasMotor = horasMotorStr ? parseFloat(horasMotorStr) : 0;
            const combustivel = combustivelStr ? parseFloat(combustivelStr) : 0;
            // O fator de carga já vem em formato decimal (0.24 = 24%)
            const fatorCarga = fatorCargaStr ? parseFloat(fatorCargaStr) : 0;
            
            console.log("Processando linha CSV:", { maquina, horasMotor, combustivel, fatorCarga });
            
            // Só adicionar se tiver dados válidos e horas motor > 0
            if (maquina && !isNaN(horasMotor) && horasMotor > 0) {
              dados.push({
                data,
                maquina,
                horasMotor,
                combustivelConsumido: combustivel,
                fatorCargaMotorOcioso: fatorCarga
              });
              
              // Calcular horas ociosas baseado no fator de carga
              // Assumindo que: horas_ociosas = horas_motor * fator_carga / 100
              const horasOciosas = horasMotor * (fatorCarga / 100);
              
              frotas[maquina] = {
                h_motor: horasMotor,
                combustivel_consumido: combustivel,
                fator_carga_motor_ocioso: fatorCarga
              };
            }
          });
          
          if (dados.length === 0) {
            setError("Não foram encontrados dados válidos no arquivo CSV.");
            setProcessandoArquivo(false);
            return;
          }
          
          setDadosOPC(dados);
          setDadosFrotas(frotas);
          console.log("Dados processados CSV:", dados);
          console.log("Frotas CSV:", frotas);
          
        } catch (error) {
          console.error("Erro ao processar CSV:", error);
          setError(`Erro ao processar o arquivo: ${error}`);
        } finally {
          setProcessandoArquivo(false);
        }
      },
      error: (error) => {
        console.error("Erro no parse do CSV:", error);
        setError(`Erro ao analisar o arquivo: ${error}`);
        setProcessandoArquivo(false);
      }
    });
  };
  
  // Processar arquivo XLSX
  const processarXlsx = (file: File) => {
    setProcessandoArquivo(true);
    setError("");
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Tenta encontrar a planilha 'Base OPC' ou usa a primeira planilha
        let sheetName = workbook.SheetNames.find(name => name === 'Base OPC') || workbook.SheetNames[0];
        console.log("Planilhas encontradas:", workbook.SheetNames);
        console.log("Usando planilha:", sheetName);
        
        const sheet = workbook.Sheets[sheetName];
        
        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        console.log("Dados brutos:", jsonData);
        
        // Verificar se há dados
        if (!jsonData || jsonData.length === 0) {
          setError("Não foram encontrados dados na planilha.");
          setProcessandoArquivo(false);
          return;
        }
        
        // Verificar as colunas disponíveis
        const primeiraLinha = jsonData[0] as Record<string, any>;
        console.log("Colunas disponíveis:", Object.keys(primeiraLinha));
        
        const dados: OpcData[] = [];
        const frotas: Record<string, DiarioCavFrotaData> = {};
        
        // Identificar nomes das colunas
        const colunas = {
          data: Object.keys(primeiraLinha).find(key => key.includes("Data") || key === "DATA") || "Data",
          maquina: Object.keys(primeiraLinha).find(key => key.includes("quina") || key === "MAQUINA") || "Máquina",
          horasMotor: Object.keys(primeiraLinha).find(key => key.includes("Hora") && key.includes("Motor")) || "Horas de Operação do Motor Período (h)",
          combustivel: Object.keys(primeiraLinha).find(key => key.includes("Combust")) || "Combustível Consumido Período (l)",
          fatorCarga: Object.keys(primeiraLinha).find(key => key.includes("Fator") && key.includes("Carga")) || "Fator de Carga Médio do Motor Ocioso (%)"
        };
        
        console.log("Mapeamento de colunas:", colunas);
        
        jsonData.forEach((row: any) => {
          // Mapeamento das colunas do arquivo para o nosso formato
          let dataOriginal = row[colunas.data] || "";
          let dataFormatada = "";
          
          // Tentar padronizar o formato da data para dd/MM/yyyy
          try {
            if (dataOriginal) {
              // Se for uma data no formato Excel (número serial)
              if (!isNaN(Number(dataOriginal))) {
                // Converter número serial do Excel para data JavaScript
                const excelEpoch = new Date(1899, 11, 30);
                const dataObj = new Date(excelEpoch.getTime() + Number(dataOriginal) * 24 * 60 * 60 * 1000);
                dataFormatada = format(dataObj, "dd/MM/yyyy");
              } 
              // Se for uma string de data, tentar converter para o formato padrão
              else if (dataOriginal instanceof Date) {
                dataFormatada = format(dataOriginal, "dd/MM/yyyy");
              }
              else {
                // Tentar detectar o formato da data
                let dataObj;
                if (dataOriginal.includes("/")) {
                  // Formato dd/MM/yyyy ou MM/dd/yyyy
                  const partes = dataOriginal.split("/");
                  if (partes.length === 3) {
                    // Assumir dd/MM/yyyy se o primeiro número for <= 31
                    if (parseInt(partes[0]) <= 31) {
                      dataObj = new Date(
                        parseInt(partes[2]), // ano
                        parseInt(partes[1]) - 1, // mês (0-11)
                        parseInt(partes[0]) // dia
                      );
                    } else {
                      // Assumir MM/dd/yyyy
                      dataObj = new Date(
                        parseInt(partes[2]), // ano
                        parseInt(partes[0]) - 1, // mês (0-11)
                        parseInt(partes[1]) // dia
                      );
                    }
                    dataFormatada = format(dataObj, "dd/MM/yyyy");
                  }
                } else if (dataOriginal.includes("-")) {
                  // Formato yyyy-MM-dd
                  dataObj = new Date(dataOriginal);
                  dataFormatada = format(dataObj, "dd/MM/yyyy");
                } else {
                  // Outros formatos, tentar parse genérico
                  dataObj = new Date(dataOriginal);
                  if (!isNaN(dataObj.getTime())) {
                    dataFormatada = format(dataObj, "dd/MM/yyyy");
                  }
                }
              }
            }
          } catch (e) {
            console.error("Erro ao converter data:", e);
            dataFormatada = String(dataOriginal); // Manter o valor original em caso de erro
          }
          
          const data = dataFormatada || String(dataOriginal);
          console.log(`Data original: "${dataOriginal}", Data formatada: "${data}"`);
          const maquina = String(row[colunas.maquina] || "").trim();
          
          // Tratar valores numéricos
          let horasMotorStr = row[colunas.horasMotor];
          if (horasMotorStr !== undefined && horasMotorStr !== null) {
            horasMotorStr = String(horasMotorStr).replace(",", ".");
          } else {
            horasMotorStr = "0";
          }
          
          let combustivelStr = row[colunas.combustivel];
          if (combustivelStr !== undefined && combustivelStr !== null) {
            combustivelStr = String(combustivelStr).replace(",", ".");
          } else {
            combustivelStr = "0";
          }
          
          let fatorCargaStr = row[colunas.fatorCarga];
          if (fatorCargaStr !== undefined && fatorCargaStr !== null) {
            fatorCargaStr = String(fatorCargaStr).replace(",", ".");
          } else {
            fatorCargaStr = "0";
          }
          
          // Converter para números, se for vazio ou não numérico, usar 0
          const horasMotor = horasMotorStr ? parseFloat(horasMotorStr) : 0;
          const combustivel = combustivelStr ? parseFloat(combustivelStr) : 0;
          // O fator de carga já vem em formato decimal (0.24 = 24%)
          const fatorCarga = fatorCargaStr ? parseFloat(fatorCargaStr) : 0;
          
          console.log("Processando linha:", { maquina, horasMotor, combustivel, fatorCarga });
          
          // Só adicionar se tiver dados válidos e horas motor > 0
          if (maquina && !isNaN(horasMotor) && horasMotor > 0) {
            dados.push({
              data,
              maquina,
              horasMotor,
              combustivelConsumido: combustivel,
              fatorCargaMotorOcioso: fatorCarga
            });
            
                          // Calcular horas ociosas baseado no fator de carga
              // Assumindo que: horas_ociosas = horas_motor * fator_carga / 100
              const horasOciosas = horasMotor * (fatorCarga / 100);
              
              frotas[maquina] = {
                h_motor: horasMotor,
                combustivel_consumido: combustivel,
                fator_carga_motor_ocioso: fatorCarga
              };
          }
        });
        
        if (dados.length === 0) {
          setError("Não foram encontrados dados válidos no arquivo.");
          setProcessandoArquivo(false);
          return;
        }
        
        setDadosOPC(dados);
        setDadosFrotas(frotas);
        console.log("Dados processados:", dados);
        console.log("Frotas:", frotas);
        
      } catch (error) {
        console.error("Erro ao processar XLSX:", error);
        setError(`Erro ao processar o arquivo: ${error}`);
      } finally {
        setProcessandoArquivo(false);
      }
    };
    
    reader.onerror = () => {
      setError("Erro ao ler o arquivo.");
      setProcessandoArquivo(false);
    };
    
    reader.readAsBinaryString(file);
  };
  
  // Processar arquivo OPC (CSV ou XLSX)
  const processarArquivoOPC = (file: File) => {
    if (!file) return;
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExt === 'csv' || fileExt === 'txt') {
      processarCsv(file);
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      processarXlsx(file);
    } else {
      setError("Formato de arquivo não suportado. Use CSV, TXT, XLSX ou XLS.");
    }
  };

  const handleCloseModal = (open: boolean) => {
    if (!open) {
      // Limpar todos os previews
      frentes.forEach(f => {
        if (f.prevDesloc) URL.revokeObjectURL(f.prevDesloc);
        if (f.prevArea) URL.revokeObjectURL(f.prevArea);
      });
      
      // Resetar estados
      setFrentes([{
        id: uuidv4(),
        frente: "",
        data: ontem,
        imgDesloc: null,
        imgArea: null,
        prevDesloc: null,
        prevArea: null,
        dadosFiltrados: {}
      }]);
      setArquivoOPC(null);
      setArquivoNome("");
      setDadosOPC([]);
      setDadosFrotas({});
      setError("");
    }
    onOpenChange(open);
  };
  
  // Salvar diário
  const handleSave = async () => {
    // Validar dados
    if (!arquivoOPC) {
      setError("Selecione um arquivo OPC.");
      return;
    }
    
    // Verificar se todas as frentes estão preenchidas
    const frenteInvalida = frentes.find(f => !f.data || !f.frente || !f.imgDesloc);
    if (frenteInvalida) {
      setError("Todas as frentes devem ter data, frente selecionada e uma imagem de deslocamento.");
      return;
    }
    
    // Verificar se o arquivo OPC foi processado
    if (Object.keys(dadosFrotas).length === 0) {
      setError("Não foi possível processar dados do arquivo OPC ou o arquivo não contém dados válidos.");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      // Inicializar cliente Supabase
      const supabase = createClientComponentClient();
      
      // Salvar cada frente como um registro separado
      for (const frente of frentes) {
        // Verificar se temos dados filtrados para esta frente
        let dadosFiltradosFrota: Record<string, DiarioCavFrotaData> = {};
        
        // Se a frente já tem dados filtrados, usar esses dados
        if (frente.dadosFiltrados && Object.keys(frente.dadosFiltrados).length > 0) {
          dadosFiltradosFrota = { ...frente.dadosFiltrados };
        } else {
          // Filtrar dados pela data da frente
          const dataFormatada = format(frente.data, "dd/MM/yyyy");
          const dadosFiltrados = dadosOPC.filter(dado => dado.data === dataFormatada);
          
          // Criar objeto de frotas filtrado com TODOS os campos necessários
          dadosFiltrados.forEach(dado => {
            dadosFiltradosFrota[dado.maquina] = {
              h_motor: dado.horasMotor,
              combustivel_consumido: dado.combustivelConsumido,
              fator_carga_motor_ocioso: dado.fatorCargaMotorOcioso
            };
          });
          
          console.log(`Dados filtrados para frente ${frente.frente} na data ${dataFormatada}:`, dadosFiltradosFrota);
        }
        
        // Se ainda não temos dados, mostrar erro e continuar para a próxima frente
        if (Object.keys(dadosFiltradosFrota).length === 0) {
          const dataFormatada = format(frente.data, "dd/MM/yyyy");
          console.warn(`AVISO: Não foi possível encontrar dados para a frente ${frente.frente} na data ${dataFormatada}. Esta frente será ignorada.`);
          continue; // Pular para a próxima frente
        }
        
        // Combinar dados das frotas com dados agregados
        const dadosParaSalvar = {
          frotas: dadosFiltradosFrota,
          agregados: frente.dadosBoletinsCav?.dadosAgregados || null
        };
        
        console.log(`💾 Salvando dados completos para frente ${frente.frente}:`, dadosParaSalvar);
        
        // Upload da imagem de deslocamento (obrigatória)
        let imgDeslocamentoUrl = null;
        if (frente.imgDesloc) {
          const imgDeslocamentoPath = `diario-cav/${uuidv4()}-${frente.imgDesloc.name.replace(/\s/g, "_")}`;
          const { error: uploadErrorDesloc } = await supabase.storage
            .from("cav")
            .upload(imgDeslocamentoPath, frente.imgDesloc);
            
          if (uploadErrorDesloc) {
            throw new Error("Erro ao fazer upload da imagem de deslocamento: " + uploadErrorDesloc.message);
          }
          
          const { data: imgDeslocamentoData } = supabase.storage
            .from("cav")
            .getPublicUrl(imgDeslocamentoPath);
            
          imgDeslocamentoUrl = imgDeslocamentoData?.publicUrl;
        }
        
        // Upload da imagem de área (opcional)
        let imgAreaUrl = null;
        if (frente.imgArea) {
          const imgAreaPath = `diario-cav/${uuidv4()}-${frente.imgArea.name.replace(/\s/g, "_")}`;
          const { error: uploadErrorArea } = await supabase.storage
            .from("cav")
            .upload(imgAreaPath, frente.imgArea);
            
          if (uploadErrorArea) {
            throw new Error("Erro ao fazer upload da imagem de área: " + uploadErrorArea.message);
          }
          
          const { data: imgAreaData } = supabase.storage
            .from("cav")
            .getPublicUrl(imgAreaPath);
            
          imgAreaUrl = imgAreaData?.publicUrl;
        }
        
        console.log(`Salvando diário para frente ${frente.frente} com ${Object.keys(dadosParaSalvar).length} máquinas`);
        
        // Inserir dados no banco
        const { error: insertError } = await supabase
          .from("diario_cav")
          .insert({
            data: format(frente.data, "yyyy-MM-dd"),
            frente: frente.frente,
            dados: dadosParaSalvar,
            imagem_deslocamento: imgDeslocamentoUrl,
            imagem_area: imgAreaUrl
          });
          
        if (insertError) {
          throw new Error("Erro ao salvar diário: " + insertError.message);
        }
      }
      
      // Mostrar mensagem de sucesso e fechar o modal
      toast({
        title: "Diários salvos com sucesso!",
        description: "Você pode visualizar os relatórios na aba Diário CAV.",
      });
      
      // Fechar o modal após salvar com sucesso
      handleCloseModal(false);
      
      setIsLoading(false);
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      console.error("Erro ao salvar diário:", error);
      setError(error.message || "Erro ao salvar diário.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseModal}>
        <DialogContent
          className="sm:max-w-[1100px] w-full max-h-[90vh] overflow-hidden flex flex-col"
          onPointerDownOutside={(e)=>e.preventDefault()}
          onEscapeKeyDown={(e)=>e.preventDefault()}
          onInteractOutside={(e)=>e.preventDefault()}
        >
          {/* Cabeçalho fixo */}
          <div className="flex items-center justify-between py-4 border-b">
            <span className="flex-1 text-center font-semibold text-lg">Novo Diário CAV</span>
            <DialogClose asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border border-gray-300 shadow-sm mr-4"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          
          {/* Conteúdo principal */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Área de erro fixa */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            {/* Área fixa para upload de arquivo OPC e botão adicionar frente */}
            <div className="border rounded-md p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                      <div 
                        className={cn(
                          "border-2 border-dashed rounded-md p-2 transition-colors flex items-center",
                          arquivoOPC ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"
                        )}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-black'); }}
                        onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-black'); }}
                        onDrop={(e) => { 
                          e.preventDefault(); 
                          e.currentTarget.classList.remove('border-black'); 
                          const droppedFiles = Array.from(e.dataTransfer.files); 
                          const file = droppedFiles[0];
                          if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.txt'))) {
                            setArquivoOPC(file);
                            setArquivoNome(file.name);
                            processarArquivoOPC(file);
                          } else {
                            setError("Por favor, arraste apenas arquivos CSV, XLSX, XLS ou TXT.");
                          }
                        }}
                        onClick={() => document.getElementById('csvFile')?.click()}
                      >
                        <Button
                          variant="outline"
                          className="h-10 whitespace-nowrap border-0"
                          disabled={processandoArquivo}
                          type="button"
                        >
                          <FileUp className="h-4 w-4 mr-2" />
                          {arquivoOPC ? "Trocar arquivo" : "Arquivo OPC"}
                        </Button>
                        <span className="text-xs text-gray-500 ml-2">
                          {arquivoOPC ? null : "ou arraste aqui"}
                        </span>
                      </div>
                    </div>
                    <Input
                      id="csvFile"
                      type="file"
                      accept=".csv,.xlsx,.xls,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setArquivoOPC(file);
                          setArquivoNome(file.name);
                          processarArquivoOPC(file);
                        }
                      }}
                    />
                    {processandoArquivo ? (
                      <div className="flex items-center">
                        <span className="text-sm text-amber-600">Processando arquivo...</span>
                      </div>
                    ) : arquivoNome ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          Arquivo: <span className="font-medium">{arquivoNome}</span>
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setArquivoOPC(null);
                            setArquivoNome("");
                            setDadosOPC([]);
                            setDadosFrotas({});
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddFrente}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Adicionar Frente
                  </Button>
                </div>
              </div>

            {/* Conteúdo scrollable - Blocos de Frentes */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6">
            {frentes.map((frente, index) => (
              <div key={frente.id} data-frente-id={frente.id} className="border rounded-md p-4">
                <div className="flex items-center justify-end mb-2">
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFrenteToDelete(frente.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-6">
                  <div className="flex flex-nowrap gap-6">
                    {/* Data */}
                    <div className="w-[180px]">
                      <Label htmlFor={`data-${frente.id}`} className="mb-2 block text-base font-medium truncate">Data</Label>
                      <Input
                          id={`data-${frente.id}`}
                          type="date"
                          className="w-full"
                          value={frente.data ? format(frente.data, "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            if (e.target.value) {
                              // Usar diretamente o valor do input como string
                              const dataString = e.target.value; // Formato yyyy-MM-dd
                              console.log(`Data selecionada no input: ${dataString}`);
                              
                              // Criar uma data usando o construtor nativo para garantir que o dia seja preservado
                              const dataCorreta = new Date(dataString + "T12:00:00");
                              
                              // Verificar se a data foi criada corretamente
                              console.log(`Data selecionada: ${dataString}`);
                              console.log(`Data convertida: ${dataCorreta.toISOString()}`);
                              console.log(`Dia selecionado: ${dataCorreta.getDate()}`);
                              
                              handleDataChange(frente.id, dataCorreta);
                            } else {
                              handleDataChange(frente.id, ontem);
                            }
                          }}
                        />
                    </div>

                    {/* Frente */}
                    <div className="w-[260px]">
                      <Label htmlFor={`frente-${frente.id}`} className="mb-2 block text-base font-medium truncate">Frente</Label>
                      <Select 
                        value={frente.frente} 
                        onValueChange={(value) => handleFrenteChange(frente.id, value)}
                      >
                        <SelectTrigger id={`frente-${frente.id}`}>
                          <SelectValue placeholder="Selecione uma frente" />
                        </SelectTrigger>
                        <SelectContent>
                          {FRENTES_CONFIG.map((config, index) => (
                            <SelectItem key={index} value={config.nome}>
                              {config.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Imagem Deslocamento */}
                    <div className="w-[250px] pt-6">
                      <div 
                        className={cn(
                          "border-2 border-dashed rounded-md p-2 transition-colors",
                          frente.prevDesloc ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"
                        )}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, frente.id, true)}
                      >
                        {frente.prevDesloc ? (
                          <div className="relative">
                            <img 
                              src={frente.prevDesloc} 
                              alt="Preview" 
                              className="w-full h-32 object-cover rounded-md"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-white/80 hover:bg-white"
                              onClick={() => handleRemoveImage(frente.id, true)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            className="w-full h-10 flex flex-row items-center justify-center gap-2 border-0"
                            onClick={() => document.getElementById(`imgDesloc-${frente.id}`)?.click()}
                          >
                            <Image className="h-5 w-5" />
                            <span className="text-sm">Imagem Deslocamento</span>
                          </Button>
                        )}
                        <Input
                          id={`imgDesloc-${frente.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) processImageFile(file, frente.id, true);
                          }}
                        />
                      </div>
                    </div>

                    {/* Imagem Fechamento */}
                    <div className="w-[250px] pt-6">
                      <div 
                        className={cn(
                          "border-2 border-dashed rounded-md p-2 transition-colors",
                          frente.prevArea ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"
                        )}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, frente.id, false)}
                      >
                        {frente.prevArea ? (
                          <div className="relative">
                            <img 
                              src={frente.prevArea} 
                              alt="Preview" 
                              className="w-full h-32 object-cover rounded-md"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-white/80 hover:bg-white"
                              onClick={() => handleRemoveImage(frente.id, false)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            className="w-full h-10 flex flex-row items-center justify-center gap-2 border-0"
                            onClick={() => document.getElementById(`imgArea-${frente.id}`)?.click()}
                          >
                            <Image className="h-5 w-5" />
                            <span className="text-sm">Imagem Fechamento</span>
                          </Button>
                        )}
                        <Input
                          id={`imgArea-${frente.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) processImageFile(file, frente.id, false);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Dados do arquivo OPC filtrados para esta frente */}
                  {frente.frente && frente.data && Object.keys(frente.dadosFiltrados || {}).length > 0 && (
                    <div className="w-full mt-4 border-t pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">
                          Dados do arquivo OPC para frente {frente.frente} em {format(frente.data, "dd/MM/yyyy")}
                        </h4>
                        <div className="text-xs text-gray-500">
                          {Object.keys(frente.dadosFiltrados || {}).length} registros encontrados
                        </div>
                      </div>
                      <div className="overflow-x-auto overflow-y-auto" style={{ height: "185px" }}>
                        <table className="w-full text-sm border-collapse">
                          <thead className="sticky top-0 bg-white">
                            <tr className="bg-gray-50">
                              <th className="border px-2 py-1 text-left">Data</th>
                              <th className="border px-2 py-1 text-left">Máquina</th>
                              <th className="border px-2 py-1 text-right">Horas Período</th>
                              <th className="border px-2 py-1 text-right">Motor Ocioso %</th>
                              <th className="border px-2 py-1 text-right">Consumo (L)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(frente.dadosFiltrados || {}).map(([maquina, dados]) => {
                              // Usar sempre a data selecionada da frente, não a data original do OPC
                              return (
                                <tr key={maquina} className="hover:bg-gray-50">
                                  <td className="border px-2 py-1">{format(frente.data, "dd/MM/yyyy")}</td>
                                  <td className="border px-2 py-1">{maquina}</td>
                                  <td className="border px-2 py-1 text-right">{dados.h_motor.toFixed(2)}</td>
                                  <td className="border px-2 py-1 text-right">{dados.fator_carga_motor_ocioso?.toFixed(2) || "-"}%</td>
                                  <td className="border px-2 py-1 text-right">{dados.combustivel_consumido?.toFixed(2) || "-"}</td>
                                </tr>
                              );
                            })}
                            {Object.keys(frente.dadosFiltrados || {}).length === 0 && (
                              <tr>
                                <td colSpan={5} className="border px-2 py-1 text-center text-gray-500">
                                  Nenhum dado encontrado para esta frente/data.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Dados de boletins CAV para esta frente */}
                  {frente.frente && frente.data && frente.dadosBoletinsCav && (
                    <div className="w-full mt-4 border-t pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">
                          Dados de produção para frente {frente.frente} em {format(frente.data, "dd/MM/yyyy")}:
                        </h4>
                        
                        {/* Removido o botão "Abrir Relatório" - relatórios serão acessados na lista de Diário CAV */}
                      </div>
                      
                      {/* Dados granulares - Produção por frota/turno */}
                      {frente.dadosBoletinsCav.dadosGranulares && frente.dadosBoletinsCav.dadosGranulares.length > 0 ? (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium">Produção por Frota/Turno:</h5>
                            <div className="text-xs text-gray-500">
                              {frente.dadosBoletinsCav.dadosGranulares.length} registros encontrados
                            </div>
                          </div>
                          <div className="overflow-x-auto overflow-y-auto" style={{ height: "185px" }}>
                            <table className="w-full text-sm border-collapse">
                              <thead className="sticky top-0 bg-white">
                                <tr className="bg-gray-50">
                                  <th className="border px-2 py-1 text-left">Frota</th>
                                  <th className="border px-2 py-1 text-left">Turno</th>
                                  <th className="border px-2 py-1 text-left">Código</th>
                                  <th className="border px-2 py-1 text-right">Produção (ha)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {frente.dadosBoletinsCav.dadosGranulares.map((item, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="border px-2 py-1">{item.frota}</td>
                                    <td className="border px-2 py-1">{item.turno}</td>
                                    <td className="border px-2 py-1">{item.codigo}</td>
                                    <td className="border px-2 py-1 text-right">{item.producao.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 text-gray-500 text-sm">
                          Nenhum dado de produção encontrado para esta frente/data.
                        </div>
                      )}
                      
                      {/* Resumo e JSON */}
                      {frente.dadosBoletinsCav.dadosAgregados && (
                        <div>
                          <div className="flex flex-row gap-4">
                            {/* Coluna da esquerda - Resumo */}
                            <div className="flex-1">
                              <h5 className="text-sm font-medium mb-1">Resumo:</h5>
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-xs text-gray-500">Total Aplicado</div>
                                  <div className="font-semibold">{frente.dadosBoletinsCav.dadosAgregados.total_producao.toFixed(2)} ha</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-xs text-gray-500">Lâmina Alvo</div>
                                  <div className="font-semibold">{frente.dadosBoletinsCav.dadosAgregados.lamina_alvo.toFixed(2)} m³</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-xs text-gray-500">Lâmina Aplicada</div>
                                  <div className="font-semibold">{frente.dadosBoletinsCav.dadosAgregados.lamina_aplicada.toFixed(2)} m³</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-xs text-gray-500">Dif. Lâmina</div>
                                  <div className={`font-semibold ${frente.dadosBoletinsCav.dadosAgregados.dif_lamina_perc < 0 ? 'text-red-600' : frente.dadosBoletinsCav.dadosAgregados.dif_lamina_perc <= 10 ? 'text-green-600' : 'text-yellow-500'}`}>
                                    {frente.dadosBoletinsCav.dadosAgregados.dif_lamina_perc > 0 ? '+' : ''}{frente.dadosBoletinsCav.dadosAgregados.dif_lamina_perc.toFixed(2)}%
                                  </div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-xs text-gray-500">Viagens Feitas</div>
                                  <div className="font-semibold">{frente.dadosBoletinsCav.dadosAgregados.total_viagens_feitas}</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-xs text-gray-500">Viagens Orçadas</div>
                                  <div className="font-semibold">{frente.dadosBoletinsCav.dadosAgregados.total_viagens_orcadas.toFixed(0)}</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-xs text-gray-500">Dif. Viagens</div>
                                  <div className={`font-semibold ${frente.dadosBoletinsCav.dadosAgregados.dif_viagens_perc < 0 ? 'text-red-600' : frente.dadosBoletinsCav.dadosAgregados.dif_viagens_perc <= 10 ? 'text-green-600' : 'text-yellow-500'}`}>
                                    {frente.dadosBoletinsCav.dadosAgregados.dif_viagens_perc > 0 ? '+' : ''}{frente.dadosBoletinsCav.dadosAgregados.dif_viagens_perc.toFixed(2)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Coluna da direita - JSON */}
                            {frente.frente && frente.data && (
                              <div className="w-1/3 bg-green-500 bg-opacity-10 border border-green-500 rounded-md">
                                <div className="border-b border-green-500 p-2">
                                  <h5 className="text-sm font-medium text-green-700">Dados JSON</h5>
                                </div>
                                <pre className="text-xs p-2 overflow-auto h-[200px]">
                                  {JSON.stringify({
                                    data: format(frente.data, "yyyy-MM-dd"),
                                    frente: frente.frente,
                                    dados: {
                                      frotas: frente.dadosFiltrados || {},
                                      agregados: frente.dadosBoletinsCav?.dadosAgregados || null
                                    }
                                  }, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

          </div>
          </div>

          {/* Botões de ação - Fixos na parte inferior */}
          <div className="py-4 border-t mt-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleCloseModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isLoading || !arquivoOPC || frentes.some(f => !f.data || !f.frente || !f.imgDesloc)}
              >
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmação para remover frente */}
      <ConfirmDialog
        open={!!frenteToDelete}
        onOpenChange={() => setFrenteToDelete(null)}
        title="Remover Frente"
        description="Tem certeza que deseja remover esta frente? Esta ação não pode ser desfeita."
        onConfirm={() => frenteToDelete && handleRemoveFrente(frenteToDelete)}
      />
    </>
  )
}