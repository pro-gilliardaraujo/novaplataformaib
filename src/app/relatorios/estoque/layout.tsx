export default function EstoqueReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
} 