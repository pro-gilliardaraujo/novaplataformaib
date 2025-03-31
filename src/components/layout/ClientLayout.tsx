"use client"

import { useState } from "react"
import Sidebar from "@/components/layout/Sidebar"
import { AuthProvider } from "@/contexts/AuthContext"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

export function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
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