import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Parâmetro id é obrigatório', { status: 400 });
  }

  try {
    // Tentar buscar primeiro como relatório diário
    let { data: report, error } = await supabase
      .from('relatorios_diarios')
      .select('*')
      .eq('id', id)
      .single();

    // Se não encontrar como relatório diário, tentar como relatório semanal
    if (!report) {
      const { data: weeklyReport, error: weeklyError } = await supabase
        .from('relatorios_semanais')
        .select('*')
        .eq('id', id)
        .single();

      if (weeklyError || !weeklyReport) {
        throw new Error('Relatório não encontrado');
      }

      report = weeklyReport;
    }

    // Formata a data para o nome do arquivo
    const formatarData = (data: string) => {
      if (!data) return '';
      const [ano, mes, dia] = data.split('-');
      return `${dia}-${mes}-${ano}`;
    };

    // Determina o tipo de relatório
    const tipoBase = report.tipo.replace('_diario', '').replace('_semanal', '');
    const tipoRelatorio = report.data_inicio ? `${tipoBase}-semanal` : tipoBase;

    // Gera o nome do arquivo
    let nomeArquivo;
    if (report.data_inicio) {
      // Relatório semanal
      nomeArquivo = `Relatório ${tipoRelatorio} - ${report.frente} - ${formatarData(report.data_inicio)} a ${formatarData(report.data_fim)}.pdf`;
    } else {
      // Relatório diário
      nomeArquivo = `Relatório ${tipoRelatorio} - ${report.frente} - ${formatarData(report.data)}.pdf`;
    }

    // Faz a requisição para o backend gerar o PDF
    const response = await fetch(`${process.env.BACKEND_API_URL || 'http://localhost:8000'}/api/v1/relatorios/${id}/pdf?tipo=${tipoRelatorio}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na resposta do backend:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Erro ao gerar PDF: ${response.status} - ${errorText}`);
    }

    const pdfBuffer = await response.arrayBuffer();

    // Define os cabeçalhos da resposta
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(nomeArquivo)}"`);

    return new Response(pdfBuffer, {
      headers: headers
    });
  } catch (error: any) {
    console.error('Erro detalhado ao gerar PDF:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return new Response(`Erro ao gerar PDF: ${error.message}`, { status: 500 });
  }
} 