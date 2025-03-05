export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}

export function formatFieldValue(field: string, value: string): string {
  switch (field) {
    case "status":
    case "codigo_infracao":
    case "penalidade":
      return value.toUpperCase()
    case "numero_documento":
      return value // Keep as is
    case "nome_funcionario":
    case "nome_lider":
    case "funcao":
    case "setor":
      return value.toUpperCase()
    default:
      return toTitleCase(value)
  }
}

export function capitalizeInput(value: string): string {
  return value.toUpperCase()
}

