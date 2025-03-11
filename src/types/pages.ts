export type Category = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  slug: string;
  order_index: number;
  section: 'reports' | 'management';
  icon?: string;
};

export type Page = {
  id: string;
  created_at: string;
  updated_at: string;
  category_id: string;
  category_name?: string;
  name: string;
  slug: string;
  icon?: string;
  tabs: Tab[];
};

export type Tab = {
  id: string;
  created_at: string;
  updated_at: string;
  page_id: string;
  name: string;
  content: string;
  order_index: number;
};

// Tipos para criação/atualização
export interface CreateCategoryData {
  name: string;
  order_index: number;
}

export interface UpdateCategoryOrder {
  id: string;
  order_index: number;
}

export interface CreatePageData {
  category_id: string;
  name: string;
}

export interface UpdateTabsData {
  page_id: string;
  tabs: Array<{
    name: string;
    content: string;
    order_index: number;
  }>;
} 