// Gerenciador de configurações para o sistema de relatórios
// Este arquivo será responsável por carregar e gerenciar as configurações dos relatórios

interface ReportConfig {
  tiposRelatorio: {
    [key: string]: {
      nome: string;
      frentes: Array<{ id: string; nome: string }>;
      metas: {
        [key: string]: number;
      };
      secoes: {
        [key: string]: boolean;
      };
      planilhas_excel?: string[];
      colunas_excel?: {
        [key: string]: string[];
      };
      componentes?: {
        mostrarImageUpload?: boolean;
        mostrarExcelUpload?: boolean;
        mostrarMapas?: boolean;
        usarFrentesCheckbox?: boolean;
      };
    };
  };
  fontesExcel?: {
    [key: string]: string;
  };
  fontesImagens?: {
    [key: string]: string;
  };
}

class ConfigManager {
  private config: ReportConfig | null = null;
  private isLoaded = false;

  constructor() {
    this.config = null;
    this.isLoaded = false;
  }

  // Função para carregar as configurações
  async reloadConfig() {
    try {
      // Em produção, isto buscaria as configurações de uma API ou arquivo
      const response = await fetch('/api/reports/config');
      if (!response.ok) {
        throw new Error('Falha ao carregar configurações');
      }
      
      this.config = await response.json();
      this.isLoaded = true;
      return this.config;
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      
      // Fallback para configurações padrão em caso de erro
      this.config = {
        tiposRelatorio: {
          colheita_diario: {
            nome: "Colheita - Diário",
            frentes: [
              { id: "frente1", nome: "Frente 4 - BP Ituiutaba" },
              { id: "frente2", nome: "Frente 8 - CMAA Canápolis" },
              { id: "frente3", nome: "Frente 3 - Alexandrita" },
              { id: "frente4", nome: "Frente Zirleno" }
            ],
            metas: {
              disponibilidadeMecanica: 90,
              eficienciaEnergetica: 70,
              motorOcioso: 4,
              horaElevador: 5,
              usoGPS: 90,
              mediaVelocidade: 7
            },
            secoes: {
              disponibilidadeMecanica: true,
              eficienciaEnergetica: true,
              motorOcioso: true,
              horaElevador: true,
              usoGPS: true,
              mediaVelocidade: true
            },
            componentes: {
              mostrarImageUpload: true,
              mostrarExcelUpload: true,
              mostrarMapas: false
            }
          },
          colheita_semanal: {
            nome: "Colheita - Semanal",
            frentes: [
              { id: "frente1", nome: "Frente 4 - BP Ituiutaba" },
              { id: "frente2", nome: "Frente 8 - CMAA Canápolis" },
              { id: "frente3", nome: "Frente 3 - Alexandrita" },
              { id: "frente4", nome: "Frente Zirleno" }
            ],
            metas: {
              disponibilidadeMecanica: 90,
              eficienciaEnergetica: 70,
              motorOcioso: 4,
              horaElevador: 5,
              usoGPS: 90,
              mediaVelocidade: 7
            },
            secoes: {
              disponibilidadeMecanica: true,
              eficienciaEnergetica: true,
              motorOcioso: true,
              horaElevador: true,
              usoGPS: true,
              mediaVelocidade: true
            },
            componentes: {
              mostrarImageUpload: true,
              mostrarExcelUpload: true,
              mostrarMapas: false
            }
          },
          transbordo_diario: {
            nome: "Transbordo - Diário",
            frentes: [
              { id: "frente1", nome: "Frente 4 - BP Ituiutaba" },
              { id: "frente2", nome: "Frente 8 - CMAA Canápolis" },
              { id: "frente3", nome: "Frente 3 - Alexandrita" },
              { id: "frente4", nome: "Frente Zirleno" }
            ],
            metas: {
              disponibilidadeMecanica: 90,
              eficienciaEnergetica: 65,
              motorOcioso: 6,
              faltaApontamento: 10,
              usoGPS: 90,
              mediaVelocidade: 15
            },
            secoes: {
              disponibilidadeMecanica: true,
              eficienciaEnergetica: true,
              motorOcioso: true,
              faltaApontamento: true,
              usoGPS: false,
              mediaVelocidade: true
            },
            componentes: {
              mostrarImageUpload: true,
              mostrarExcelUpload: true,
              mostrarMapas: false
            }
          },
          transbordo_semanal: {
            nome: "Transbordo - Semanal",
            frentes: [
              { id: "frente1", nome: "Frente 4 - BP Ituiutaba" },
              { id: "frente2", nome: "Frente 8 - CMAA Canápolis" },
              { id: "frente3", nome: "Frente 3 - Alexandrita" },
              { id: "frente4", nome: "Frente Zirleno" }
            ],
            metas: {
              disponibilidadeMecanica: 90,
              eficienciaEnergetica: 65,
              motorOcioso: 6,
              faltaApontamento: 10,
              usoGPS: 90,
              mediaVelocidade: 15
            },
            secoes: {
              disponibilidadeMecanica: true,
              eficienciaEnergetica: true,
              motorOcioso: true,
              faltaApontamento: true,
              usoGPS: false,
              mediaVelocidade: true
            },
            componentes: {
              mostrarImageUpload: true,
              mostrarExcelUpload: true,
              mostrarMapas: false
            }
          }
        },
        fontesExcel: {
          "fonte1": "Agronômico",
          "fonte2": "JD Link",
          "fonte3": "SAP"
        },
        fontesImagens: {
          "fonte1": "Drone",
          "fonte2": "Satélite",
          "fonte3": "Campo"
        }
      };
      
      this.isLoaded = true;
      return this.config;
    }
  }

  // Verificar se as configurações foram carregadas
  isConfigLoaded() {
    return this.isLoaded;
  }

  // Obter todos os tipos de relatório
  getTiposRelatorio() {
    if (!this.isLoaded || !this.config) {
      return [];
    }
    
    return Object.entries(this.config.tiposRelatorio).map(([id, config]) => ({
      id,
      nome: config.nome
    }));
  }

  // Obter configuração específica de um tipo de relatório
  getTipoRelatorio(tipoId: string) {
    if (!this.isLoaded || !this.config) {
      return null;
    }
    
    return this.config.tiposRelatorio[tipoId] || null;
  }

  // Obter frentes disponíveis para um tipo de relatório
  getFrentes(tipoId: string) {
    const tipoRelatorio = this.getTipoRelatorio(tipoId);
    if (!tipoRelatorio) {
      return [];
    }
    
    return tipoRelatorio.frentes || [];
  }

  // Obter metas para um tipo de relatório
  getMetas(tipoId: string) {
    const tipoRelatorio = this.getTipoRelatorio(tipoId);
    if (!tipoRelatorio) {
      return {};
    }
    
    return tipoRelatorio.metas || {};
  }

  // Obter configuração de seções para um tipo de relatório
  getSecoes(tipoId: string) {
    const tipoRelatorio = this.getTipoRelatorio(tipoId);
    if (!tipoRelatorio) {
      return {};
    }
    
    return tipoRelatorio.secoes || {};
  }

  // Obter fontes de Excel disponíveis
  getFontesExcel() {
    if (!this.isLoaded || !this.config || !this.config.fontesExcel) {
      return [];
    }
    
    return Object.entries(this.config.fontesExcel).map(([id, nome]) => ({
      id,
      nome
    }));
  }

  // Obter fontes de imagens disponíveis
  getFontesImagens() {
    if (!this.isLoaded || !this.config || !this.config.fontesImagens) {
      return [];
    }
    
    return Object.entries(this.config.fontesImagens).map(([id, nome]) => ({
      id,
      nome
    }));
  }
}

// Exportar uma instância única do gerenciador de configurações
export const configManager = new ConfigManager(); 