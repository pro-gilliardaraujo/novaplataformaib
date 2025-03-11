"use client"

import { Tab } from "@/types/pages"
import { Tabs as TabsRoot, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface CustomTabsProps {
  tabs: Tab[]
}

function TabContentRenderer({ content }: { content: string }) {
  return (
    <div 
      className="h-full w-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-none" 
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

export function CustomTabs({ tabs }: CustomTabsProps) {
  if (!tabs || tabs.length === 0) {
    return <div>Nenhuma aba configurada</div>
  }

  // Ordenar as abas pelo order_index
  const sortedTabs = [...tabs].sort((a, b) => a.order_index - b.order_index)

  return (
    <TabsRoot defaultValue={sortedTabs[0]?.name} className="w-full h-full flex flex-col">
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
        {sortedTabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.name}
            className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            {tab.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {sortedTabs.map((tab) => (
        <TabsContent
          key={tab.id}
          value={tab.name}
          className="flex-1 m-0 p-4 data-[state=active]:flex h-full"
        >
          <TabContentRenderer content={tab.content} />
        </TabsContent>
      ))}
    </TabsRoot>
  )
} 