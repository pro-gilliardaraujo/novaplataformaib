"use client"

import Sidebar from "@/components/layout/Sidebar"
import { AuthProvider } from "@/contexts/AuthContext"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient()

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-black scrollbar-track-transparent">
            {children}
          </main>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  )
} 