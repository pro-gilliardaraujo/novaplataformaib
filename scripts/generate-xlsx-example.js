const XlsxPopulate = require('xlsx-populate');
const fs = require('fs');
const path = require('path');

// Dados do CSV
const csvData = `Data,Máquina,Horas de Operação do Motor Período (h),Combustível Consumido Período (l),Fator de Carga Médio do Motor Ocioso (%)
24/08/2023,6125,5.95,74.45,0.24
24/08/2023,6126,0.00,0.00,0.00
24/08/2023,6127,1.45,11.74,0.23
24/08/2023,6128,0.00,0.00,0.00
24/08/2023,6129,0.00,0.00,0.00
24/08/2023,6130,0.80,7.98,0.25
24/08/2023,6131,8.00,73.18,0.25
24/08/2023,6132,10.40,98.05,0.28
24/08/2023,6133,0.00,0.00,0.00
24/08/2023,6134,3.80,37.83,0.23
24/08/2023,6137,1.20,6.26,0.28
24/08/2023,6138,9.25,118.76,0.32`;

// Função para converter CSV para array
function csvToArray(csv) {
  const lines = csv.split('\n');
  const result = [];
  const headers = lines[0].split(',');

  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    const currentLine = lines[i].split(',');

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentLine[j];
    }

    result.push(obj);
  }

  return { headers, data: result };
}

// Criar arquivo XLSX
async function createXlsx() {
  try {
    const { headers, data } = csvToArray(csvData);
    
    // Criar um novo workbook
    const workbook = await XlsxPopulate.fromBlankAsync();
    const sheet = workbook.sheet(0);
    
    // Adicionar cabeçalhos
    headers.forEach((header, index) => {
      sheet.cell(1, index + 1).value(header);
    });
    
    // Adicionar dados
    data.forEach((row, rowIndex) => {
      headers.forEach((header, colIndex) => {
        sheet.cell(rowIndex + 2, colIndex + 1).value(row[header]);
      });
    });
    
    // Formatar cabeçalhos
    sheet.range(1, 1, 1, headers.length).style({
      bold: true,
      fill: 'D9D9D9',
      horizontalAlignment: 'center'
    });
    
    // Ajustar largura das colunas
    sheet.column(1).width(12); // Data
    sheet.column(2).width(10); // Máquina
    sheet.column(3).width(35); // Horas de Operação
    sheet.column(4).width(35); // Combustível
    sheet.column(5).width(35); // Fator de Carga
    
    // Salvar o arquivo
    const outputPath = path.join(__dirname, '../public/exemplo_opc.xlsx');
    await workbook.toFileAsync(outputPath);
    
    console.log(`Arquivo XLSX criado com sucesso: ${outputPath}`);
  } catch (error) {
    console.error('Erro ao criar arquivo XLSX:', error);
  }
}

createXlsx();
