"use client"

import { Tab } from "@/types/pages"
import { Tabs as TabsRoot, TabsList, TabsTrigger, TabsContent } from "./tabs"

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
  return (
    <TabsRoot defaultValue={tabs[0]?.name} className="w-full h-full flex flex-col">
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.name}
            value={tab.name}
            className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            {tab.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.name}
          value={tab.name}
          className="flex-1 m-0 p-4 data-[state=active]:flex h-full"
        >
          <TabContentRenderer content={tab.content} />
        </TabsContent>
      ))}
    </TabsRoot>
  )
} 