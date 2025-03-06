export function formatCPF(cpf: string): string {
  // Remove all non-numeric characters
  const numbers = cpf.replace(/\D/g, "")

  // Apply the CPF mask (XXX.XXX.XXX-XX)
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
} 