export const setupPrintFileName = (fileName: string) => {
  // Salvar o título original
  const originalTitle = document.title;
  
  // Atualizar o título e adicionar atributo data-file-name
  document.title = fileName;
  document.body.setAttribute('data-file-name', fileName);
  
  // Criar e adicionar estilo temporário
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      @page {
        size: auto;
        margin: 0mm;
      }
      body[data-file-name]::before {
        content: attr(data-file-name);
        display: none;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Retornar função de limpeza
  return () => {
    document.title = originalTitle;
    document.body.removeAttribute('data-file-name');
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  };
};

export const formatFileName = (title: string) => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '_') // Substitui caracteres especiais por _
    .replace(/^_+|_+$/g, '') // Remove _ do início e fim
    .concat('_', new Date().toISOString().split('T')[0]); // Adiciona data
}; 