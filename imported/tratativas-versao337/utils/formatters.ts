export function formatarData(data: string): string {
  const diasSemana = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ]
  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ]

  // Cria a data considerando o fuso horário local
  const dataObj = new Date(data + "T00:00:00")
  const diaSemana = diasSemana[dataObj.getDay()]
  const dia = dataObj.getDate().toString().padStart(2, "0")
  const mes = meses[dataObj.getMonth()]
  const ano = dataObj.getFullYear()

  return `${diaSemana}, ${dia} de ${mes} de ${ano}`
}

export function formatCPF(value: string): string {
  const cpf = value.replace(/\D/g, "")
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

