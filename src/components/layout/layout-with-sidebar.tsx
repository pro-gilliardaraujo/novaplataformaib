"use client"

import type React from "react"
import Sidebar from "@/components/layout/Sidebar"

export function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50 p-4">{children}</main>
    </div>
  )
}

