import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface RelatorioData {
  id: string;
  title: string;
  pdf_url?: string;
  status: string;
  // adicione outros campos conforme necessário
}

export function useRelatorioData(id: string | null) {
  const [data, setData] = useState<RelatorioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: report, error } = await supabase
          .from('relatorios_diarios')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setData(report);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao buscar dados do relatório'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  return { data, isLoading, error };
} 