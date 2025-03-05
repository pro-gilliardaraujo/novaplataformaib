export interface Tab {
  name: string
  content: string
}

export interface PageData {
  tabs: Tab[]
}

export interface CategoryData {
  [key: string]: PageData
}

export interface PagesConfig {
  [key: string]: CategoryData
} 