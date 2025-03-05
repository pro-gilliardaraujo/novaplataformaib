'use client'

import { useState } from 'react'
import { SafeIframe } from './SafeIframe'

interface Tab {
  name: string
  content: string
}

export function Tabs({ tabs }: { tabs: Tab[] }) {
  const [activeTab, setActiveTab] = useState(0)

  const getIframeSrc = (content: string) => {
    const match = content.match(/src="([^"]+)"/)
    return match ? match[1] : ''
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navegação das abas */}
      <nav className="flex border-b border-gray-200 bg-gray-50">
        {tabs.map((tab, index) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(index)}
            className={`
              px-3 py-1.5 text-xs font-medium border-b-2 transition-colors
              ${activeTab === index 
                ? 'border-black text-black' 
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}
            `}
          >
            {tab.name}
          </button>
        ))}
      </nav>

      {/* Conteúdo da aba ativa */}
      <div className="flex-1 overflow-hidden">
        <SafeIframe
          src={getIframeSrc(tabs[activeTab].content)}
          title={tabs[activeTab].name}
        />
      </div>
    </div>
  )
} 