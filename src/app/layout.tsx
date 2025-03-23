"use client"

import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import ClientLayout from "@/components/layout/ClientLayout"
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link 
          rel="icon" 
          href="https://kjlwqezxzqjfhacmjhbh.supabase.co/storage/v1/object/public/sourcefiles//logo.png" 
          type="image/png"
        />
      </head>
      <body className={`${inter.className} overflow-hidden`}>
        <ClientLayout>
          {children}
        </ClientLayout>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
