"use server"

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    // Obter dados do formulário
    const formData = await request.json()
    
    // Verificar se o ID do boletim foi fornecido
    if (!formData.id) {
      return NextResponse.json({ error: 'ID do boletim não fornecido' }, { status: 400 })
    }
    
    console.log('📝 Recebendo requisição para atualizar boletim:', formData.id)
    
    // Extrair dados do formulário
    const { data, frente, frotas, id } = formData
    
    // Extrair setor da frente (ex: "Frente 1 MOE" -> setor = "MOE")
    const setorMatch = frente.match(/\b(GUA|MOE|ALE|ITU)\b/)
    const setor = setorMatch ? setorMatch[1] : undefined
    
    // Limpar nome da frente (ex: "Frente 1 MOE" -> "Frente 1")
    const frenteLimpa = frente.replace(/\s+(GUA|MOE|ALE|ITU)\b/, '')
    
    // Dados para inserção granular
    const dadosGranulares = []
    
    // Para cada frota e turno, criar um registro granular
    frotas.forEach(frotaData => {
      const { frota, turnos } = frotaData
      
      turnos.forEach(turnoData => {
        // Validar dados obrigatórios
        if (!turnoData.operador || !turnoData.producao) {
          console.warn('⚠️ Dados incompletos para turno:', turnoData)
          return
        }
        
        dadosGranulares.push({
          data,
          frente: frenteLimpa,
          setor,
          codigo: turnoData.codigo_fazenda || '',
          frota,
          turno: turnoData.turno as 'A' | 'B' | 'C',
          operador: turnoData.operador,
          producao: Number(turnoData.producao),
          lamina_alvo: Number(turnoData.lamina_alvo) || 10
        })
      })
    })
    
    // Agrupar por código para cálculos agregados
    const dadosPorCodigo = {}
    
    dadosGranulares.forEach(item => {
      if (!dadosPorCodigo[item.codigo]) {
        dadosPorCodigo[item.codigo] = {
          codigo: item.codigo,
          total_producao: 0,
          turnos: [],
          laminas_alvo: [],
          producoes: []
        }
      }
      
      dadosPorCodigo[item.codigo].total_producao += item.producao
      dadosPorCodigo[item.codigo].turnos.push(item)
      dadosPorCodigo[item.codigo].laminas_alvo.push(item.lamina_alvo)
      dadosPorCodigo[item.codigo].producoes.push(item.producao)
    })
    
    // Dados agregados para atualização
    const dadosAgregados = []
    
    // Para cada código, calcular os valores agregados
    Object.values(dadosPorCodigo).forEach(grupo => {
      // Calcular lâmina alvo ponderada pela produção
      let laminaAlvoPonderada = 0
      let somaPesos = 0
      
      for (let i = 0; i < grupo.laminas_alvo.length; i++) {
        laminaAlvoPonderada += grupo.laminas_alvo[i] * grupo.producoes[i]
        somaPesos += grupo.producoes[i]
      }
      
      const lamina_alvo = somaPesos > 0 ? laminaAlvoPonderada / somaPesos : 10
      
      // Usar total_viagens_feitas do formulário ou calcular
      const total_viagens_feitas = formData.total_viagens_feitas || 0
      
      // Calcular total_viagens_orcadas
      const total_viagens_orcadas = (grupo.total_producao * lamina_alvo) / 60
      
      // Calcular lamina_aplicada
      const lamina_aplicada = total_viagens_feitas > 0 ? (total_viagens_feitas * 60) / grupo.total_producao : 0
      
      // ✅ FÓRMULA CORRETA para diferença de viagens
      const dif_viagens_perc = total_viagens_orcadas > 0 ?
        ((total_viagens_feitas - total_viagens_orcadas) / total_viagens_orcadas) * 100 : 0
      
      // ✅ FÓRMULA CORRETA para diferença de lâmina
      const dif_lamina_perc = lamina_alvo > 0 ?
        ((lamina_aplicada - lamina_alvo) / lamina_alvo) * 100 : 0
      
      dadosAgregados.push({
        id,
        data,
        frente: frenteLimpa,
        setor,
        codigo: grupo.codigo,
        total_producao: grupo.total_producao,
        total_viagens_feitas,
        total_viagens_orcadas: Number(total_viagens_orcadas.toFixed(2)),
        dif_viagens_perc: Number(dif_viagens_perc.toFixed(2)),
        lamina_alvo: Number(lamina_alvo.toFixed(2)),
        lamina_aplicada: Number(lamina_aplicada.toFixed(2)),
        dif_lamina_perc: Number(dif_lamina_perc.toFixed(2))
      })
    })
    
    // Iniciar transação
    console.log('🔄 Iniciando transação para atualizar dados...')
    
    // 1. Excluir registros granulares existentes
    const { error: errorDelete } = await supabase
      .from('boletins_cav')
      .delete()
      .eq('data', data)
      .eq('frente', frenteLimpa)
      .in('codigo', dadosAgregados.map(d => d.codigo))
    
    if (errorDelete) {
      console.error('❌ Erro ao excluir registros granulares:', errorDelete)
      return NextResponse.json({ error: 'Erro ao excluir registros granulares' }, { status: 500 })
    }
    
    // 2. Inserir novos registros granulares
    const { error: errorInsert } = await supabase
      .from('boletins_cav')
      .insert(dadosGranulares)
    
    if (errorInsert) {
      console.error('❌ Erro ao inserir registros granulares:', errorInsert)
      return NextResponse.json({ error: 'Erro ao inserir registros granulares' }, { status: 500 })
    }
    
    // 3. Atualizar registros agregados
    for (const dadoAgregado of dadosAgregados) {
      const { error: errorUpsert } = await supabase
        .from('boletins_cav_agregado')
        .update({
          total_producao: dadoAgregado.total_producao,
          total_viagens_feitas: dadoAgregado.total_viagens_feitas,
          total_viagens_orcadas: dadoAgregado.total_viagens_orcadas,
          dif_viagens_perc: dadoAgregado.dif_viagens_perc,
          lamina_alvo: dadoAgregado.lamina_alvo,
          lamina_aplicada: dadoAgregado.lamina_aplicada,
          dif_lamina_perc: dadoAgregado.dif_lamina_perc,
          setor: dadoAgregado.setor
        })
        .eq('id', id)
      
      if (errorUpsert) {
        console.error('❌ Erro ao atualizar registro agregado:', errorUpsert)
        return NextResponse.json({ error: 'Erro ao atualizar registro agregado' }, { status: 500 })
      }
    }
    
    console.log('✅ Boletim atualizado com sucesso!')
    
    return NextResponse.json({
      success: true,
      message: 'Boletim atualizado com sucesso!',
      dados: {
        registros_granulares: dadosGranulares.length,
        registros_agregados: dadosAgregados.length
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}