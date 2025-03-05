export default function CategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { category: string }
}) {
  return (
    <div className="h-full">
      {children}
    </div>
  )
} 