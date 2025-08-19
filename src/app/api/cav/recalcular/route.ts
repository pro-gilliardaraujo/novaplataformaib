import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Iniciando recálculo de diferenças de viagens...")

    // 1️⃣ Buscar todos os registros agregados
    const { data: registros, error: errorBusca } = await supabase
      .from('boletins_cav_agregado')
      .select('*')

    if (errorBusca) {
      console.error("Erro ao buscar registros:", errorBusca)
      return NextResponse.json({ error: "Erro ao buscar registros" }, { status: 500 })
    }

    if (!registros || registros.length === 0) {
      return NextResponse.json({ message: "Nenhum registro encontrado" })
    }

    console.log(`📊 Encontrados ${registros.length} registros para recalcular`)

    // 2️⃣ Recalcular cada registro
    const lamina_alvo = 2.5 // Valor padrão usado no sistema
    const atualizacoes = []

    for (const registro of registros) {
      const { total_producao, total_viagens_feitas } = registro

      // Recalcular valores
      const total_viagens_orcadas = (total_producao * lamina_alvo) / 60
      const lamina_aplicada = total_viagens_feitas > 0 ? (total_viagens_feitas * 60) / total_producao : 0
      
      // ✅ FÓRMULA CORRETA para diferença de viagens
      const dif_viagens_perc = total_viagens_orcadas > 0 ? 
        ((total_viagens_feitas - total_viagens_orcadas) / total_viagens_orcadas) * 100 : 0
      
      // ✅ FÓRMULA CORRETA para diferença de lâmina
      const dif_lamina_perc = lamina_alvo > 0 ? 
        ((lamina_aplicada - lamina_alvo) / lamina_alvo) * 100 : 0

      atualizacoes.push({
        id: registro.id,
        total_viagens_orcadas: Number(total_viagens_orcadas.toFixed(2)),
        lamina_aplicada: Number(lamina_aplicada.toFixed(2)),
        dif_viagens_perc: Number(dif_viagens_perc.toFixed(2)),
        dif_lamina_perc: Number(dif_lamina_perc.toFixed(2))
      })
    }

    // 3️⃣ Atualizar registros em lotes
    console.log("💾 Atualizando registros...")
    
    for (const atualizacao of atualizacoes) {
      const { error: errorUpdate } = await supabase
        .from('boletins_cav_agregado')
        .update({
          total_viagens_orcadas: atualizacao.total_viagens_orcadas,
          lamina_aplicada: atualizacao.lamina_aplicada,
          dif_viagens_perc: atualizacao.dif_viagens_perc,
          dif_lamina_perc: atualizacao.dif_lamina_perc,
          updated_at: new Date().toISOString()
        })
        .eq('id', atualizacao.id)

      if (errorUpdate) {
        console.error(`Erro ao atualizar registro ${atualizacao.id}:`, errorUpdate)
      }
    }

    console.log("✅ Recálculo concluído!")

    return NextResponse.json({ 
      message: `Recálculo concluído com sucesso!`,
      registros_atualizados: atualizacoes.length,
      detalhes: atualizacoes.slice(0, 5) // Mostrar apenas os primeiros 5 como exemplo
    })

  } catch (error) {
    console.error("Erro no recálculo:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor" 
    }, { status: 500 })
  }
}
