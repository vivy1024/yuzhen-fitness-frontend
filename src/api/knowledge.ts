/**
 * 知识库 API
 */

import api from './auth'

export interface KnowledgeCategory {
  id: number
  name: string
  slug: string
  article_count: number
}

export interface KnowledgeArticle {
  id: number
  title: string
  summary: string
  category: KnowledgeCategory
  source_type: string
  source_name: string
  tags: string[]
  created_at: string
}

export interface KnowledgeDetail extends KnowledgeArticle {
  content: string
  references: Array<{ title: string; url?: string; source: string }>
  related: KnowledgeArticle[]
}

export interface KnowledgeListResponse {
  code: number
  msg: string
  data: {
    items: KnowledgeArticle[]
    pagination: { current_page: number; last_page: number; total: number; per_page: number }
  } | null
}

export interface KnowledgeDetailResponse {
  code: number
  msg: string
  data: KnowledgeDetail | null
}

export interface KnowledgeCategoriesResponse {
  code: number
  msg: string
  data: KnowledgeCategory[]
}

export const getKnowledgeList = (params?: {
  page?: number
  per_page?: number
  category_id?: number
  tag?: string
}): Promise<KnowledgeListResponse> => {
  return api.get('/knowledge', { params })
}

export const getKnowledgeDetail = (id: number): Promise<KnowledgeDetailResponse> => {
  return api.get(`/knowledge/${id}`)
}

export const getKnowledgeCategories = (): Promise<KnowledgeCategoriesResponse> => {
  return api.get('/knowledge/categories')
}

export const searchKnowledge = (params: {
  q: string
  page?: number
  per_page?: number
}): Promise<KnowledgeListResponse> => {
  return api.get('/knowledge/search', { params })
}
