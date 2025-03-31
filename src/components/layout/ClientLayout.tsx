"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/layout/Sidebar"
import { AuthProvider } from "@/contexts/AuthContext"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { loading } = useAuth()
  const isPublicRoute = pathname === '/login'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      // Colapsa automaticamente em telas menores que 2xl (1536px)
      setIsSidebarCollapsed(window.innerWidth < 1536)
    }

    // Checa o tamanho inicial
    handleResize()

    // Adiciona o listener de resize
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    )
  }

  if (isPublicRoute) {
    return children
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  return (
    <div className="flex h-screen relative">
      {/* Sidebar com classes responsivas */}
      <div className={`
        relative transition-all duration-300 ease-in-out
        ${isSidebarCollapsed ? 'w-16 hover:w-64' : 'w-64'}
        2xl:${isSidebarCollapsed ? 'w-16 hover:w-64' : 'w-64'}
      `}>
        <Sidebar isCollapsed={isSidebarCollapsed} />
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 bg-white border shadow-sm z-50 rounded-full hidden 2xl:flex"
          onClick={toggleSidebar}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-black scrollbar-track-transparent p-2">
        {children}
      </main>
    </div>
  )
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 1000 * 60 * 5, // 5 minutos
        gcTime: 1000 * 60 * 15, // 15 minutos
        refetchInterval: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LayoutContent>
          {children}
        </LayoutContent>
      </AuthProvider>
    </QueryClientProvider>
  )
} 