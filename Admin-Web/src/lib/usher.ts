import api, { ApiResponse } from './api'

export interface ActiveSession {
  id: string
  name: string
  serviceType: string
  date: string
  startTime: string | null
  endTime: string | null
  status: number
  createdAt: string
  startedAt: string | null
  closedAt: string | null
}

export interface EnvelopeScanResult {
  envelopeId: string
  code: string
  isActive: boolean
  alreadyUsedInSession: boolean
  previousMemberName: string | null
  previousTransactionId: string | null
  hasHistory: boolean
}

export interface TransactionItem {
  id: string
  transactionUuid: string
  envelopeId: string
  envelopeCode: string
  collectionSessionId: string
  collectionSessionName: string | null
  donorName: string
  tithesAmount: number
  offeringAmount: number
  totalAmount: number
  status: number
  createdAt: string
  voidedAt: string | null
  voidReason: string | null
  usherName?: string | null
}

export async function getActiveSession(): Promise<ActiveSession | null> {
  const res = await api.get<ApiResponse<ActiveSession | null>>('/sessions/active')
  if (!res.data.success || !res.data.data) return null
  const s = res.data.data
  return { ...s, serviceType: s.serviceType || '' }
}

export type ScanOutcome =
  | { kind: 'ok'; result: EnvelopeScanResult; message: string }
  | { kind: 'already-recorded'; result: EnvelopeScanResult; message: string }
  | { kind: 'error'; message: string }

export async function scanEnvelope(qrToken: string, sessionId: string | null): Promise<ScanOutcome> {
  const res = await api.post<ApiResponse<EnvelopeScanResult>>('/envelopes/scan', {
    qrToken,
    sessionId
  })
  if (!res.data.success || !res.data.data) {
    return { kind: 'error', message: res.data.message || 'Envelope could not be verified.' }
  }
  const result = res.data.data
  if (!result.isActive) {
    return { kind: 'error', message: 'This envelope has been disabled. Please contact the administrator.' }
  }
  if (result.alreadyUsedInSession) {
    return { kind: 'already-recorded', result, message: res.data.message || 'Envelope already recorded.' }
  }
  return { kind: 'ok', result, message: res.data.message || 'Envelope verified.' }
}

export interface CreateTransactionInput {
  envelopeId: string
  sessionId: string | null
  donorName: string
  tithes: number
  offering: number
  transactionUuid: string
}

export async function createTransaction(input: CreateTransactionInput): Promise<{ ok: boolean; message: string; data?: TransactionItem }> {
  const res = await api.post<ApiResponse<TransactionItem>>('/transactions', {
    envelopeId: input.envelopeId,
    collectionSessionId: input.sessionId,
    donorName: input.donorName,
    tithesAmount: input.tithes,
    offeringAmount: input.offering,
    notes: null,
    transactionUuid: input.transactionUuid
  })
  if (!res.data.success || !res.data.data) {
    return { ok: false, message: res.data.message || 'Failed to record transaction.' }
  }
  return { ok: true, message: res.data.message, data: res.data.data }
}

export async function getMyTransactions(): Promise<TransactionItem[]> {
  const res = await api.get<ApiResponse<{ items: TransactionItem[] }>>(
    '/transactions/my?page=1&pageSize=100'
  )
  if (!res.data.success) return []
  return res.data.data?.items ?? []
}
