export function formatDuration(startDate: Date | string, endDate: Date | string | null = null): string {
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : new Date()
  
  // Calculate total seconds
  const diffInSeconds = Math.floor((end.getTime() - start.getTime()) / 1000)
  
  // Calculate hours, minutes, and seconds
  const hours = Math.floor(diffInSeconds / 3600)
  const minutes = Math.floor((diffInSeconds % 3600) / 60)
  const seconds = diffInSeconds % 60
  
  // Format with leading zeros
  const formattedHours = String(hours).padStart(2, '0')
  const formattedMinutes = String(minutes).padStart(2, '0')
  const formattedSeconds = String(seconds).padStart(2, '0')
  
  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
}

export function formatDateBR(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  })
}

export function formatDateTimeBR(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  })
} 