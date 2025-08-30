import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase com as credenciais do ambiente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Esta rota simula um servidor de PDFs em ambiente local
// Em produção, seria utilizado um serviço como o Supabase Storage
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { searchParams } = new URL(request.url);
    const folhaUnica = searchParams.get('folhaUnica') === 'true';
    
    console.log(`Mock PDF Server: Requisição de PDF para tratativa ${id}`, { folhaUnica });
    
    // Buscar informações da tratativa
    const { data: tratativa, error } = await supabase
      .from("tratativas")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error || !tratativa) {
      console.error('Tratativa não encontrada:', error);
      return NextResponse.json(
        { error: 'Tratativa não encontrada' },
        { status: 404 }
      );
    }
    
    // Em um ambiente real, aqui seria gerado um PDF
    // Para o ambiente local, vamos simular com um HTML formatado como PDF
    
    // Criar uma representação visual simples da tratativa como HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Documento da Tratativa ${tratativa.numero_tratativa || id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 20px;
          }
          .title {
            font-size: 24px;
            color: #333;
          }
          .info {
            margin-bottom: 20px;
          }
          .label {
            font-weight: bold;
            margin-right: 10px;
          }
          .footer {
            margin-top: 50px;
            border-top: 1px solid #ccc;
            padding-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .page-number {
            position: absolute;
            bottom: 30px;
            right: 30px;
            font-size: 12px;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            opacity: 0.1;
            color: red;
            z-index: -1;
          }
        </style>
      </head>
      <body>
        <div class="watermark">DOCUMENTO SIMULADO</div>
        
        <div class="header">
          <div class="title">TRATATIVA ${tratativa.numero_tratativa || id}</div>
          <div>Tipo de Documento: ${folhaUnica ? 'Folha Única' : 'Documento Completo (2 Folhas)'}</div>
        </div>
        
        <div class="info">
          <p><span class="label">Funcionário:</span> ${tratativa.funcionario || 'Não informado'}</p>
          <p><span class="label">Setor:</span> ${tratativa.setor || 'Não informado'}</p>
          <p><span class="label">Penalidade:</span> ${tratativa.penalidade || 'Não informada'}</p>
          <p><span class="label">Data da Infração:</span> ${formatDate(tratativa.data_infracao)}</p>
          <p><span class="label">Código da Infração:</span> ${tratativa.codigo_infracao || 'Não informado'}</p>
          <p><span class="label">Descrição:</span> ${tratativa.descricao_infracao || 'Não informada'}</p>
        </div>
        
        ${folhaUnica ? '' : `
          <!-- Segunda página - só aparece no documento completo -->
          <div style="page-break-before: always;">
            <div class="header">
              <div class="title">TRATATIVA ${tratativa.numero_tratativa || id} - COMPLEMENTO</div>
            </div>
            
            <div class="info">
              <p><span class="label">Status:</span> ${tratativa.status || 'ENVIADA'}</p>
              <p><span class="label">Líder:</span> ${tratativa.lider || 'Não informado'}</p>
              <p><span class="label">Analista:</span> ${tratativa.analista_nome || 'Não informado'}</p>
              <p><span class="label">Observações:</span> ${tratativa.observacoes || 'Nenhuma observação registrada.'}</p>
              <p><span class="label">Tipo de documento:</span> ${tratativa.penalidade?.includes('P1') ? 'ADVERTIDO' : 'SUSPENSO'}</p>
            </div>
          </div>
        `}
        
        <div class="footer">
          <p>Documento gerado em ${new Date().toLocaleString('pt-BR')}</p>
          <p>Este é um PDF simulado para fins de desenvolvimento local.</p>
        </div>
        
        <div class="page-number">Página 1${folhaUnica ? '' : ' de 2'}</div>
      </body>
      </html>
    `;
    
    // Retornar como HTML em vez de PDF para facilitar o desenvolvimento
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="tratativa-${tratativa.numero_tratativa || id}.html"`
      }
    });
  } catch (error) {
    console.error('Erro no servidor de PDF mock:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar documento simulado', details: String(error) },
      { status: 500 }
    );
  }
}

// Função auxiliar para formatar datas
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Não informada';
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    return dateStr;
  }
}
