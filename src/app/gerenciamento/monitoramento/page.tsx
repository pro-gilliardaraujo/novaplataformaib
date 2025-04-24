'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';

export default function MonitoramentoPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoRelatorio, setTipoRelatorio] = useState('');
  const [frente, setFrente] = useState('');
  const [data, setData] = useState<Date | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    // Implementar lógica de envio
    console.log('Gerando relatório...');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Opções */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Opções</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tipo de Relatório
              </label>
              <Select
                value={tipoRelatorio}
                onValueChange={setTipoRelatorio}
                placeholder="Selecione o tipo de relatório"
              >
                <option value="colheita-diario">Colheita - Diário</option>
                {/* Adicionar mais opções conforme necessário */}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Frente
              </label>
              <Select
                value={frente}
                onValueChange={setFrente}
                placeholder="Selecione a frente"
              >
                <option value="frente1">Frente 1 - BP Itulutaba</option>
                {/* Adicionar mais opções conforme necessário */}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Data
              </label>
              <DatePicker
                date={data}
                onDateChange={setData}
                placeholder="Selecione a data"
              />
            </div>
          </div>
        </Card>

        {/* Upload do arquivo */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Upload do arquivo Monit</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              accept=".zip"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span className="text-blue-600">Clique para selecionar</span>
                <span className="text-sm text-gray-500">ou arraste e solte</span>
                <span className="text-xs text-gray-400">ZIP até 10MB</span>
              </div>
            </label>
            
            {selectedFile && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Arquivo selecionado: {selectedFile.name}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={!selectedFile || !tipoRelatorio || !frente || !data}
            >
              Gerar Relatório
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
} 