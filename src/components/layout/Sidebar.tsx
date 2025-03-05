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

type Category = keyof typeof pagesConfig

// Adjust these values to change sidebar width (in pixels)
const EXPANDED_WIDTH = 224 // w-56 = 224px
const COLLAPSED_WIDTH = 64 // w-16 = 64px

export default function Sidebar() {
  const categories = Object.keys(pagesConfig) as Category[]
  const [openCategory, setOpenCategory] = useState<Category>('Colheita')
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
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
    if (!isSmallScreen || !isCollapsed) {
      setOpenCategory(openCategory === category ? '' as Category : category)
    }
  }

  return (
    <aside 
      className={`
        bg-white border-r flex flex-col h-screen overflow-hidden transition-all duration-300
        ${isCollapsed ? `w-[${COLLAPSED_WIDTH}px]` : `w-[${EXPANDED_WIDTH}px]`}
        ${isSmallScreen ? 'hover:w-[224px] group' : ''}
      `}
      onMouseEnter={() => isSmallScreen && setIsCollapsed(false)}
      onMouseLeave={() => isSmallScreen && setIsCollapsed(true)}
    >
      {/* Logo and Title Section */}
      <div className="flex items-center px-2 py-3 border-b border-gray-200">
        <div className="flex items-center">
          <Image
            src="https://kjlwqezxzqjfhacmjhbh.supabase.co/storage/v1/object/public/sourcefiles//logo.png"
            alt="IB Logística"
            width={32}
            height={32}
            className="rounded"
          />
          <span className={`ml-2 text-sm font-medium text-gray-900 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
            IB Logística
          </span>
        </div>
      </div>

      {/* Início Section */}
      <div className="px-2 py-3 border-b border-gray-200">
        <Link
          href="/"
          className="flex items-center px-2 py-1.5 text-xs font-medium text-gray-900 rounded-md hover:bg-gray-100"
        >
          <HomeIcon className="h-4 w-4 text-gray-400" />
          <span className={`ml-2 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
            Início
          </span>
        </Link>
      </div>

      {/* Relatórios Section - 50% */}
      <div className="h-[50%] px-2 py-3 overflow-y-auto border-b border-gray-200 scrollbar-thin scrollbar-thumb-black scrollbar-track-transparent">
        <h2 className={`text-xs font-semibold text-black uppercase tracking-wider mb-2 px-1 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
          Relatórios
        </h2>
        <nav className="space-y-0.5">
          {categories.map((category) => (
            <div key={category} className="space-y-0.5">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-gray-900 rounded-md hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <ChartBarIcon className="h-4 w-4 text-gray-400" />
                  <span className={`ml-2 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
                    {category}
                  </span>
                </div>
                <ChevronDownIcon 
                  className={`h-3 w-3 text-gray-400 transition-transform duration-200 
                    ${openCategory === category ? 'transform rotate-180' : ''}
                    ${isCollapsed ? 'hidden group-hover:block' : ''}
                  `}
                />
              </button>
              {/* Sub-items for each category */}
              {(!isCollapsed || (isSmallScreen && !isCollapsed)) && openCategory === category && (
                <div className="ml-6 space-y-0.5">
                  {Object.keys(pagesConfig[category]).map((item) => {
                    const href = `/${String(category).toLowerCase().replace(/\s+/g, '-')}/${String(item).toLowerCase().replace(/\s+/g, '-')}`
                    return (
                      <Link
                        key={item}
                        href={href}
                        className="flex items-center px-2 py-1.5 text-xs font-medium text-gray-600 rounded-md hover:bg-gray-100"
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

      {/* Gerenciamento Section - 30% */}
      <div className="h-[30%] px-2 py-3 overflow-y-auto border-b border-gray-200 scrollbar-thin scrollbar-thumb-black scrollbar-track-transparent">
        <h2 className={`text-xs font-semibold text-black uppercase tracking-wider mb-2 px-1 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
          Gerenciamento
        </h2>
        <nav className="space-y-0.5">
          {/* Painel de Controle */}
          <div className="space-y-0.5">
            <button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              <div className="flex items-center">
                <CircleStackIcon className="h-4 w-4 text-gray-400" />
                <span className={`ml-2 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
                  Painel de Controle
                </span>
              </div>
              <ChevronDownIcon 
                className={`h-3 w-3 text-gray-400 transition-transform duration-200 
                  ${isPanelOpen ? 'transform rotate-180' : ''}
                  ${isCollapsed ? 'hidden group-hover:block' : ''}
                `}
              />
            </button>
            {(!isCollapsed || (isSmallScreen && !isCollapsed)) && isPanelOpen && (
              <div className="ml-6 space-y-0.5">
                <Link
                  href="/gerenciamento/painel/usuarios"
                  className="flex items-center px-2 py-1.5 text-xs font-medium text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <UsersIcon className="h-4 w-4 text-gray-400" />
                  <span className="ml-2">Usuários</span>
                </Link>
                <Link
                  href="/gerenciamento/painel/equipamentos"
                  className="flex items-center px-2 py-1.5 text-xs font-medium text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <WrenchScrewdriverIcon className="h-4 w-4 text-gray-400" />
                  <span className="ml-2">Equipamentos</span>
                </Link>
                <Link
                  href="/gerenciamento/painel/retiradas"
                  className="flex items-center px-2 py-1.5 text-xs font-medium text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <DocumentDuplicateIcon className="h-4 w-4 text-gray-400" />
                  <span className="ml-2">Retiradas</span>
                </Link>
                <Link
                  href="/gerenciamento/painel/permissoes"
                  className="flex items-center px-2 py-1.5 text-xs font-medium text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <KeyIcon className="h-4 w-4 text-gray-400" />
                  <span className="ml-2">Permissões</span>
                </Link>
              </div>
            )}
          </div>

          {/* Other Gerenciamento items */}
          <div className="space-y-0.5">
            <button
              onClick={() => setOpenCategory('Tratativas')}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              <div className="flex items-center">
                <ClipboardDocumentListIcon className="h-4 w-4 text-gray-400" />
                <span className={`ml-2 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
                  Tratativas
                </span>
              </div>
              <ChevronDownIcon 
                className={`h-3 w-3 text-gray-400 transition-transform duration-200 
                  ${openCategory === 'Tratativas' ? 'transform rotate-180' : ''}
                  ${isCollapsed ? 'hidden group-hover:block' : ''}
                `}
              />
            </button>
            {(!isCollapsed || (isSmallScreen && !isCollapsed)) && openCategory === 'Tratativas' && (
              <div className="ml-6 space-y-0.5">
                <Link
                  href="/gerenciamento/tratativas/dashboard"
                  className="flex items-center px-2 py-1.5 text-xs font-medium text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <ChartBarIcon className="h-4 w-4 text-gray-400" />
                  <span className={`ml-2 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
                    Dashboard
                  </span>
                </Link>
                <Link
                  href="/gerenciamento/tratativas/documentos"
                  className="flex items-center px-2 py-1.5 text-xs font-medium text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <DocumentDuplicateIcon className="h-4 w-4 text-gray-400" />
                  <span className={`ml-2 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
                    Documentos
                  </span>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Configurações Section - 10% */}
      <div className="h-[10%] px-2 py-2 relative">
        <nav className="space-y-0.5">
          <div className="space-y-0.5">
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              <div className="flex items-center">
                <Cog6ToothIcon className="h-4 w-4 text-gray-400" />
                <span className={`ml-2 ${isCollapsed ? 'hidden group-hover:block' : ''}`}>
                  Configurações
                </span>
              </div>
              <ChevronDownIcon 
                className={`h-3 w-3 text-gray-400 transition-transform duration-200 
                  ${isConfigOpen ? 'transform rotate-180' : ''}
                  ${isCollapsed ? 'hidden group-hover:block' : ''}
                `}
              />
            </button>
            {(!isCollapsed || (isSmallScreen && !isCollapsed)) && isConfigOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-md shadow-lg">
                <button 
                  className="w-full flex items-center px-2 py-1.5 text-xs font-medium text-red-600 rounded-md hover:bg-red-50"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2 text-red-400" />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  )
} 