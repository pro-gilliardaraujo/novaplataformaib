export function formatCPF(cpf: string): string {
  // Remove all non-numeric characters
  const numbers = cpf.replace(/\D/g, "")

  // Apply the CPF mask (XXX.XXX.XXX-XX)
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

export function normalizeText(text: string): string {
  if (!text) return "";
  
  // First normalize the text to proper case (first letter of each sentence capitalized)
  const sentences = text.toLowerCase().split('. ');
  const normalizedSentences = sentences.map(sentence => 
    sentence.charAt(0).toUpperCase() + sentence.slice(1)
  );
  
  return normalizedSentences.join('. ');
}

export function formatName(name: string): string {
  if (!name) return "";
  
  // Split the name into parts and normalize each part
  return name
    .toLowerCase()
    .split(' ')
    .map(part => {
      // Skip capitalizing small words like 'de', 'da', 'do', 'dos', etc.
      const smallWords = ['de', 'da', 'do', 'das', 'dos', 'e'];
      if (smallWords.includes(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

export function formatPatrimonioCode(code: string): string {
  // Remove any non-numeric characters
  const numericOnly = code.replace(/\D/g, '');
  // Pad with zeros if less than 6 digits
  return numericOnly.padStart(6, '0');
} 