"use client"

import { Tab } from "@/types/pages"
import { Tabs as TabsRoot, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DynamicContentRenderer } from "@/components/dynamic-content-renderer"

interface LocalTab {
  name: string
  content: {
    type: string
    settings?: any
  }
}

interface CustomTabsProps {
  tabs: (Tab | LocalTab)[]
}

function TabContentRenderer({ content }: { content: string | { type: string; settings?: any } }) {
  // If content is a string, render it as HTML (legacy support)
  if (typeof content === 'string') {
    return (
      <div 
        className="h-full w-full [&_iframe]:w-full [&_iframe]:h-full" 
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  // If content is an object with type, use DynamicContentRenderer
  return <DynamicContentRenderer content={content} />
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
      <div className="flex-1 p-4">
        {tabs.map((tab) => (
          <TabsContent
            key={tab.name}
            value={tab.name}
            className="flex-1 m-0 data-[state=active]:flex h-full"
          >
            <TabContentRenderer content={tab.content} />
          </TabsContent>
        ))}
      </div>
    </TabsRoot>
  )
} 