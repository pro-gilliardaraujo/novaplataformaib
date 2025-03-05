import { PagesConfig } from '@/types'

export function getPageData(pagesConfig: PagesConfig, category: string, item: string) {
  return pagesConfig[category]?.[item]
}

export function getCategoryItems(pagesConfig: PagesConfig, category: string) {
  return Object.keys(pagesConfig[category] || {})
}

export function getCategories(pagesConfig: PagesConfig) {
  return Object.keys(pagesConfig)
} 