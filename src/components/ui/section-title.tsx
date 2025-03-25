interface SectionTitleProps {
  title: string
}

export function SectionTitle({ title }: SectionTitleProps) {
  return (
    <div className="flex items-center mb-4">
      <div className="flex-grow h-px bg-gray-200"></div>
      <h3 className="text-base font-medium px-4">{title}</h3>
      <div className="flex-grow h-px bg-gray-200"></div>
    </div>
  )
} 