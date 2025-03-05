"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { LayoutDashboard, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const newIsMobile = window.innerWidth < 768
      setIsMobile(newIsMobile)
      setIsOpen(!newIsMobile)
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  const toggleSidebar = () => setIsOpen(!isOpen)

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 ${!isOpen ? "justify-center" : ""}`}
          >
            <Icon className="w-5 h-5" />
            {isOpen && <span>{label}</span>}
          </Link>
        </TooltipTrigger>
        {!isOpen && <TooltipContent side="right">{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <div
      className={`${
        isOpen ? "w-64" : "w-16"
      } transition-all duration-300 ease-in-out fixed md:static top-0 left-0 h-full bg-white border-r flex flex-col z-10`}
    >
      <div className="p-4 border-b flex items-center justify-between">
        {isOpen && (
          <div className="flex items-center">
            <Image
              src="https://kjlwqezxzqjfhacmjhbh.supabase.co/storage/v1/object/public/sourcefiles//logo.png"
              alt="IB Logística Logo"
              width={32}
              height={32}
              className="mr-2"
            />
            <h1 className="text-xl font-semibold">Tratativas</h1>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className={isOpen ? "" : "mx-auto"}>
          {isOpen ? <ChevronLeft /> : <ChevronRight />}
        </Button>
      </div>
      <nav className="p-4 space-y-2 flex-1">
        <NavItem href="/" icon={LayoutDashboard} label="Dashboard" />
        <NavItem href="/tratativas" icon={FileText} label="Gerenciamento" />
      </nav>
    </div>
  )
}

