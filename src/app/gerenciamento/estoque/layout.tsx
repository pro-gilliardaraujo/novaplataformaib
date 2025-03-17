export default function EstoqueManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
} 