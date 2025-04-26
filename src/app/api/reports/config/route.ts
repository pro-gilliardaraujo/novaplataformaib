import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Função para carregar o arquivo de configuração
const loadConfigFile = () => {
  try {
    // Caminho para o arquivo de configuração
    const configPath = path.join(process.cwd(), 'relatorios/config/reports.config.json');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(configPath)) {
      console.error('Arquivo de configuração não encontrado:', configPath);
      return null;
    }
    
    // Ler o arquivo de configuração
    const fileContents = fs.readFileSync(configPath, 'utf8');
    
    // Converter para objeto JSON
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Erro ao carregar arquivo de configuração:', error);
    return null;
  }
};

export async function GET() {
  try {
    // Carregar o arquivo de configuração
    const config = loadConfigFile();
    
    // Se não foi possível carregar o arquivo, retornar configuração padrão
    if (!config) {
      return NextResponse.json({
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
      }, { status: 200 });
    }
    
    // Retornar a configuração carregada
    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar configurações' },
      { status: 500 }
    );
  }
} 