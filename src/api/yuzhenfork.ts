/**
 * YuzhenFork Session API 客户端
 * REST 端点：/api/sessions
 */
import axios from 'axios'

const YUZHENFORK_BASE = import.meta.env.VITE_YUZHENFORK_URL || 'http://localhost:4567'

const api = axios.create({
  baseURL: YUZHENFORK_BASE,
  timeout: 10000,
})

// === 类型 ===

export interface SessionListItem {
  id: string
  title?: string
  agentId?: string
  kind: string
  status: string
  createdAt: string
  lastModified?: string
  messageCount: number
  sessionConfig?: {
    providerId?: string
    modelId?: string
    permissionMode?: string
  }
}

export interface CreateSessionInput {
  title?: string
  agentId?: string
  kind?: 'standalone' | 'chapter'
  sessionMode?: 'chat' | 'plan'
  sessionConfig?: {
    providerId?: string
    modelId?: string
    permissionMode?: 'ask' | 'edit' | 'allow'
    reasoningEffort?: 'low' | 'medium' | 'high'
  }
}

// === API ===

export async function listSessions(): Promise<SessionListItem[]> {
  const { data } = await api.get('/api/sessions', {
    params: { kind: 'standalone', status: 'active', sort: 'recent' },
  })
  return data
}

export async function createSession(input: CreateSessionInput): Promise<SessionListItem> {
  const { data } = await api.post('/api/sessions', input)
  return data
}

export async function deleteSession(id: string): Promise<void> {
  await api.delete(`/api/sessions/${id}`)
}

export async function getSessionHistory(id: string, sinceSeq?: number) {
  const { data } = await api.get(`/api/sessions/${id}/chat/history`, {
    params: sinceSeq ? { sinceSeq } : undefined,
  })
  return data
}

export async function confirmToolDecision(
  sessionId: string,
  toolName: string,
  decision: 'approve' | 'reject',
  reason?: string,
) {
  const { data } = await api.post(`/api/sessions/${sessionId}/tools/${toolName}/confirm`, {
    decision,
    reason,
  })
  return data
}

export async function getHealth() {
  const { data } = await api.get('/api/health')
  return data
}

export { YUZHENFORK_BASE }
