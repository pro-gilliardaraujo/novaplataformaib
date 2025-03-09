export interface User {
  id: string
  name: string
  email: string
  role: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
}

export interface Item {
  id: string
  title: string
  slug: string
  categoryId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface Tab {
  name: string
  content: string
} 