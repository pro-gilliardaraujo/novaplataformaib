interface DetailItemProps {
  label: string
  value: React.ReactNode
}

export function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="flex flex-col items-start">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm mt-1">{value}</span>
    </div>
  )
} 