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
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
}

export function formatName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function formatPatrimonioCode(code: string): string {
  return code.padStart(6, "0")
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "—"
  
  try {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return dateString
  }
}

export function formatDateOnly(dateString: string | null | undefined): string {
  if (!dateString) return "—"
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(dateString))
} 