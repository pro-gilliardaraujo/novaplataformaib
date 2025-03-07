'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  WrenchScrewdriverIcon, 
  TruckIcon, 
  ClipboardDocumentListIcon, 
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  UsersIcon,
  KeyIcon,
  DocumentDuplicateIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline'
import { pagesConfig } from '@/config/pages.config'

type Category = keyof typeof pagesConfig | 'Tratativas' | 'Painel' | 'Config'

// Adjust these values to change sidebar width (in pixels)
const EXPANDED_WIDTH = 256 // Increased from 224
const COLLAPSED_WIDTH = 72 // Increased from 64

export default function Sidebar() {
  const categories = Object.keys(pagesConfig) as Category[]
  const [openCategory, setOpenCategory] = useState<Category | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const smallScreen = window.innerWidth < 768
      setIsSmallScreen(smallScreen)
      setIsCollapsed(smallScreen)
    }

    handleResize() // Initial check
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleCategory = (category: Category) => {
    if (isCollapsed && isSmallScreen) {
      setIsCollapsed(false)
    }
    setOpenCategory(openCategory === category ? null : category)
  }

  return (
    <aside 
      className={`
        bg-white border-r flex flex-col h-screen overflow-hidden transition-all duration-300
        ${isCollapsed ? `w-[${COLLAPSED_WIDTH}px]` : `w-[${EXPANDED_WIDTH}px]`}
        ${isSmallScreen ? 'hover:w-[256px] group' : ''}
      `}
      onMouseEnter={() => isSmallScreen && setIsCollapsed(false)}
      onMouseLeave={() => isSmallScreen && setIsCollapsed(true)}
    >
      {/* Logo and Title Section - 5% */}
      <div className="h-[5%] flex items-center px-3 py-4 border-b border-gray-200">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Image
            src="https://kjlwqezxzqjfhacmjhbh.supabase.co/storage/v1/object/public/sourcefiles//logo.png"
            alt="IB Logística"
            width={36}
            height={36}
            className="rounded"
          />
          <span className={`ml-3 text-base font-medium text-gray-900 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
            IB Logística
          </span>
        </Link>
      </div>

      {/* Relatórios Section - 60% */}
      <div className="h-[60%] px-3 py-4 overflow-y-auto border-b border-gray-200 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
        <h2 className={`text-sm font-semibold text-black uppercase tracking-wider mb-3 px-2 text-center ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
          Relatórios
        </h2>
        <nav className="space-y-1">
          {categories.map((category) => (
            <div key={category} className="space-y-0.5">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-gray-500" />
                  <span className={`ml-3 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
                    {category}
                  </span>
                </div>
                <ChevronDownIcon 
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 
                    ${openCategory === category ? 'transform rotate-180' : ''}
                    ${isCollapsed ? 'hidden group-hover:block' : ''}
                  `}
                />
              </button>
              {(!isCollapsed || (isSmallScreen && !isCollapsed)) && openCategory === category && (
                <div className="ml-6 space-y-1">
                  {Object.keys(pagesConfig[category]).map((item) => {
                    const href = `/${String(category).toLowerCase().replace(/\s+/g, '-')}/${String(item).toLowerCase().replace(/\s+/g, '-')}`
                    return (
                      <Link
                        key={item}
                        href={href}
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100"
                      >
                        <span className={isCollapsed ? 'hidden group-hover:block' : ''}>
                          {item}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Gerenciamento Section - 25% */}
      <div className="h-[35%] px-3 py-4 overflow-y-auto border-b border-gray-200 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
        <h2 className={`text-sm font-semibold text-black uppercase tracking-wider mb-3 px-2 text-center ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
          Gerenciamento
        </h2>
        <nav className="space-y-1">
          {/* Painel de Controle */}
          <div className="space-y-1">
            <button
              onClick={() => toggleCategory('Painel')}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-gray-100"
            >
              <div className="flex items-center">
                <CircleStackIcon className="h-5 w-5 text-gray-500" />
                <span className={`ml-3 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
                  Painéis
                </span>
              </div>
              <ChevronDownIcon 
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 
                  ${openCategory === 'Painel' ? 'transform rotate-180' : ''}
                  ${isCollapsed ? 'hidden group-hover:block' : ''}
                `}
              />
            </button>
            {(!isCollapsed || (isSmallScreen && !isCollapsed)) && openCategory === 'Painel' && (
              <div className="ml-6 space-y-0.5">
                <Link
                  href="/gerenciamento/painel/usuarios"
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <UsersIcon className="h-4 w-4 text-gray-400" />
                  <span className="ml-2">Usuários</span>
                </Link>
                <Link
                  href="/gerenciamento/painel/equipamentos"
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <WrenchScrewdriverIcon className="h-4 w-4 text-gray-400" />
                  <span className="ml-2">Equipamentos</span>
                </Link>
                <Link
                  href="/gerenciamento/painel/retiradas"
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <DocumentDuplicateIcon className="h-4 w-4 text-gray-400" />
                  <span className="ml-2">Retiradas</span>
                </Link>
              </div>
            )}
          </div>

          {/* Tratativas Section */}
          <div className="space-y-1">
            <button
              onClick={() => toggleCategory('Tratativas')}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-gray-100"
            >
              <div className="flex items-center">
                <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500" />
                <span className={`ml-3 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
                  Tratativas
                </span>
              </div>
              <ChevronDownIcon 
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 
                  ${openCategory === 'Tratativas' ? 'transform rotate-180' : ''}
                  ${isCollapsed ? 'hidden group-hover:block' : ''}
                `}
              />
            </button>
            {(!isCollapsed || (isSmallScreen && !isCollapsed)) && openCategory === 'Tratativas' && (
              <div className="ml-6 space-y-1">
                <Link
                  href="/gerenciamento/tratativas/dashboard"
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <ChartBarIcon className="h-5 w-5 text-gray-500" />
                  <span className={`ml-3 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
                    Dashboard
                  </span>
                </Link>
                <Link
                  href="/gerenciamento/tratativas/lista"
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <DocumentDuplicateIcon className="h-5 w-5 text-gray-500" />
                  <span className={`ml-3 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
                    Lista
                  </span>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Configurações Section - 5% */}
      <div className="h-[5%] mt-auto relative flex items-center justify-center border-t border-gray-200">
        <button
          onClick={() => toggleCategory('Config')}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-gray-100"
        >
          <div className="flex items-center">
            <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
            <span className={`ml-3 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
              Configurações
            </span>
          </div>
          <ChevronDownIcon 
            className={`ml-2 h-4 w-4 text-gray-400 transition-transform duration-200 transform rotate-180
              ${openCategory === 'Config' ? 'rotate-180' : ''}
              ${isCollapsed ? 'hidden group-hover:block' : ''}
            `}
          />
        </button>
        {(!isCollapsed || (isSmallScreen && !isCollapsed)) && openCategory === 'Config' && (
          <div className="absolute bottom-[calc(100%+1px)] left-0 w-full bg-white border border-gray-200 rounded-t-md shadow-lg z-50">
            <div className="p-2 space-y-1">
              <Link
                href="/configuracoes/perfil"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
              >
                <UsersIcon className="h-5 w-5 text-gray-500" />
                <span className={`ml-3 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
                  Perfil
                </span>
              </Link>
              <Link
                href="/configuracoes/sistema"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
              >
                <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
                <span className={`ml-3 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
                  Sistema
                </span>
              </Link>
              <button
                onClick={() => {/* handle logout */}}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span className={`ml-3 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
                  Sair
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
} 