import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { CavFormData, BoletimCav, BoletimCavAgregado, FRENTES_CONFIG } from "@/types/cav"

export async function POST(request: NextRequest) {
  try {
    const formData: CavFormData = await request.json()

    console.log("Recebendo dados do CAV:", formData)

    // Usar o primeiro código da fazenda informado, ou gerar automaticamente
    const primeiroCodigoFazenda = formData.frotas
      .flatMap(f => f.turnos)
      .find(t => t.codigo_fazenda && t.producao > 0)?.codigo_fazenda
    
    const dataFormatada = formData.data.replace(/-/g, '')
    const frenteSlug = formData.frente.toLowerCase().replace(/\s+/g, '-')
    const codigo = primeiroCodigoFazenda || `${dataFormatada}-${frenteSlug}`
    
    // Extrair setor da frente e limpar a frente (ex: "Frente 1 GUA" -> setor:"GUA", frente:"Frente 1")
    const setorMatch = formData.frente.match(/(GUA|MOE|ALE)/)
    const setor = setorMatch ? setorMatch[1] : null
    const frenteLimpa = formData.frente.replace(/\s+(GUA|MOE|ALE)$/, '').trim()
    
    console.log("Setor extraído:", setor)
    console.log("Frente limpa:", frenteLimpa)

    // Validações básicas
    if (!formData.data || !formData.frente || !formData.frotas?.length) {
      return NextResponse.json(
        { error: "Dados obrigatórios não informados" },
        { status: 400 }
      )
    }

    // 1️⃣ Preparar dados granulares para inserção
    const dadosGranulares: Omit<BoletimCav, 'id' | 'created_at' | 'updated_at'>[] = []

    formData.frotas.forEach(frotaData => {
      frotaData.turnos.forEach(turnoData => {
        // Inserir se tiver operador preenchido (incluindo produção 0)
        if (turnoData.operador && turnoData.operador.trim() !== "" && turnoData.operador !== "Não Op.") {
          dadosGranulares.push({
            data: formData.data,
            codigo: turnoData.codigo_fazenda || codigo, // Usar código da fazenda ou padrão
            frente: frenteLimpa, // ✅ Frente sem setor
            setor: setor, // ✅ Setor extraído da frente
            frota: frotaData.frota,
            turno: turnoData.turno,
            operador: turnoData.operador,
            producao: turnoData.producao,
            // lamina_alvo: turnoData.lamina_alvo || 2.5, // ⚠️ TEMPORARIAMENTE REMOVIDO - coluna não existe ainda
            observacoes: turnoData.producao === 0 ? "Não operou" : undefined
          })
        }
      })
    })

    console.log("Dados granulares preparados:", dadosGranulares.length, "registros")

    // Calcular lamina_alvo média ponderada dos operadores (usando dados do frontend)
    const totalProducaoComLamina = formData.frotas.reduce((sum, frota) => {
      return sum + frota.turnos.reduce((frotaSum, turno) => {
        if (turno.operador && turno.operador.trim() !== "" && turno.operador !== "Não Op.") {
          return frotaSum + (turno.producao * (turno.lamina_alvo || 2.5))
        }
        return frotaSum
      }, 0)
    }, 0)
    
    const totalProducaoGranular = dadosGranulares.reduce((sum, item) => sum + item.producao, 0)
    const lamina_alvo = totalProducaoGranular > 0 ? totalProducaoComLamina / totalProducaoGranular : 2.5

    console.log("Lâmina alvo calculada:", lamina_alvo)

    // 2️⃣ Inserir dados granulares em transação (sem created_at/updated_at)
    const dadosParaInserir = dadosGranulares.map(({ created_at, updated_at, ...resto }) => resto)
    
    const { data: dadosInseridos, error: erroInsercao } = await supabase
      .from("boletins_cav")
      .insert(dadosParaInserir)
      .select()

    if (erroInsercao) {
      console.error("Erro ao inserir dados granulares:", erroInsercao)
      throw erroInsercao
    }

    console.log("Dados granulares inseridos:", dadosInseridos?.length)

    // 3️⃣ Calcular agregados
    const total_producao = dadosGranulares.reduce((sum, item) => sum + item.producao, 0)
    const total_viagens_feitas = formData.total_viagens_feitas
    const total_viagens_orcadas = (total_producao * lamina_alvo) / 60
    const lamina_aplicada = total_viagens_feitas > 0 ? (total_viagens_feitas * 60) / total_producao : 0
    const dif_viagens_perc = total_viagens_orcadas > 0 ? ((total_viagens_feitas - total_viagens_orcadas) / total_viagens_orcadas) * 100 : 0
    const dif_lamina_perc = lamina_alvo > 0 ? ((lamina_aplicada - lamina_alvo) / lamina_alvo) * 100 : 0

    const dadosAgregados: Omit<BoletimCavAgregado, 'id' | 'created_at' | 'updated_at'> = {
      data: formData.data,
      codigo: codigo,
      frente: frenteLimpa, // ✅ Frente sem setor
      setor: setor, // ✅ Setor extraído da frente
      total_producao: Number(total_producao.toFixed(2)),
      total_viagens_feitas: Number(total_viagens_feitas.toFixed(2)),
      total_viagens_orcadas: Number(total_viagens_orcadas.toFixed(2)),
      dif_viagens_perc: Number(dif_viagens_perc.toFixed(2)),
      lamina_alvo: Number(lamina_alvo.toFixed(2)),
      lamina_aplicada: Number(lamina_aplicada.toFixed(2)),
      dif_lamina_perc: Number(dif_lamina_perc.toFixed(2))
    }

    console.log("Dados agregados calculados:", dadosAgregados)

    // 4️⃣ Inserir/atualizar dados agregados
    
    const { data: dadosAgregadosInseridos, error: erroAgregacao } = await supabase
      .from("boletins_cav_agregado")
      .upsert(dadosAgregados, {
        onConflict: "data,frente,codigo"
      })
      .select()

    if (erroAgregacao) {
      console.error("Erro ao inserir dados agregados:", erroAgregacao)
      throw erroAgregacao
    }

    console.log("Dados agregados inseridos/atualizados:", dadosAgregadosInseridos)

    // 5️⃣ Retornar sucesso com resumo
    return NextResponse.json({
      success: true,
      message: "Boletim CAV criado com sucesso",
      dados: {
        registros_granulares: dadosInseridos?.length || 0,
        resumo_agregado: dadosAgregadosInseridos?.[0] || dadosAgregados
      }
    })

  } catch (error) {
    console.error("Erro no processamento do CAV:", error)
    return NextResponse.json(
      { 
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    )
  }
}
