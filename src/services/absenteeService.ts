import api from './api'

// --- Types ---

export interface CareSettings {
  attentionWeeks: number
  longTermWeeks: number
  resettlementWeeks: number
}

// API Summary Response Map
export interface CareSummaryMap {
  needsAttention: number
  resettling: number
  longTermAbsence: number
}

// Frontend Friendly Summary
export interface CareSummary {
  resettlingCount: number
  longTermCount: number
  needsAttentionCount: number
}

export type CareStatus = 'NEEDS_ATTENTION' | 'LONG_TERM_ABSENCE' | 'RESETTLING' | 'COMPLETED' | 'CARE_STOPPED'

export interface CareMember {
  memberId: number
  name: string
  phone: string
  memberImageUrl?: string | null
  status: CareStatus
  absenceWeeks: number
  attendanceWeeks: number
  managerName: string
  startDate: string // YYYY-MM-DD
}

export type CareMethod = '전화' | '심방' | '문자' | '기타'

export interface CareLog {
  logId: number
  createdAt: string // ISO string
  careDate?: string
  content: string
  careMethod: CareMethod
  createdBy: string
}

export interface CareMemberDetail {
  currentInfo: CareMember
  history: CareHistory[]
  logs: CareLog[]
}

export interface CareHistory {
  historyId: number
  period: string // e.g. "2023.01 ~ 2023.03"
  status: string // e.g. "재정착 성공", "타교회 이동"
  managerName: string
  closingNote?: string
  startDate?: string
  endDate?: string
}

interface ApiResponse<T> {
  status: string
  code: string
  message: string
  data: T
}

// --- Endpoints ---

// 1. Settings

export async function getCareSettings(): Promise<CareSettings> {
  const response = await api.get<ApiResponse<CareSettings>>('/api/care/settings')
  return response.data.data
  // await delay(500)
  // return MOCK_SETTINGS
}

export async function updateCareSettings(settings: CareSettings): Promise<void> {
  await api.put('/api/care/settings', settings)
  // await delay(500)
  // Object.assign(MOCK_SETTINGS, settings)
}

// 2. Summary & List

export async function getCareSummary(): Promise<CareSummary> {
  const response = await api.get<ApiResponse<CareSummaryMap>>('/api/care/summary')
  const data = response.data.data
  
  return {
    resettlingCount: data.resettling || 0,
    longTermCount: data.longTermAbsence || 0,
    needsAttentionCount: data.needsAttention || 0,
  }
  // await delay(500)
  // return {
  //   resettlingCount: MOCK_MEMBERS.filter(m => m.status === 'RESETTLING').length,
  //   longTermCount: MOCK_MEMBERS.filter(m => m.status === 'LONG_TERM_ABSENCE').length,
  //   needsAttentionCount: MOCK_MEMBERS.filter(m => m.status === 'NEEDS_ATTENTION').length,
  // }
}

export async function getCareMembers(): Promise<CareMember[]> {
  const response = await api.get<ApiResponse<CareMember[]>>('/api/care/absentees')
  return response.data.data
  // await delay(500)
  // return [...MOCK_MEMBERS]
}

// 3. Detail & Actions

export async function getCareMemberDetail(memberId: number): Promise<CareMemberDetail> {
  const response = await api.get<ApiResponse<CareMemberDetail>>(`/api/care/absentees/${memberId}`)
  return response.data.data
  // await delay(500)
  // const member = MOCK_MEMBERS.find(m => m.memberId === memberId)
  // if (!member) throw new Error('Member not found')
  // return {
  //   currentInfo: member,
  //   history: MOCK_HISTORY,
  //   logs: MOCK_LOGS
  // }
}

export async function updateManager(memberId: number, newManagerId: number): Promise<void> {
  await api.patch(`/api/care/absentees/${memberId}/manager`, { newManagerId })
  // await delay(500)
  // // In a real mock, we might update the managerName, but since we only have IDs, we'll just log it or ignore
  // const member = MOCK_MEMBERS.find(m => m.memberId === memberId)
  // if (member) {
  //   member.managerName = '새담당자' // Simple mock update
  // }
}

export async function completeCare(memberId: number, type: 'COMPLETED' | 'STOPPED', closingNote: string): Promise<void> {
  await api.patch(`/api/care/absentees/${memberId}/complete`, { type, closingNote })
  // await delay(500)
  // const member = MOCK_MEMBERS.find(m => m.memberId === memberId)
  // if (member) {
  //   member.status = type === 'COMPLETED' ? 'COMPLETED' : 'CARE_STOPPED'
    
  //   // Add to history
  //   MOCK_HISTORY.unshift({
  //     historyId: Date.now(),
  //     period: `${member.startDate} ~ ${new Date().toISOString().split('T')[0]}`,
  //     status: type === 'COMPLETED' ? '재정착 성공' : '케어 중단',
  //     managerName: member.managerName,
  //     closingNote: closingNote,
  //     startDate: member.startDate,
  //     endDate: new Date().toISOString().split('T')[0]
  //   })
  // }
}

// 4. Care Logs

export async function addCareLog(memberId: number, content: string, careMethod: string): Promise<void> {
  await api.post(`/api/care/absentees/${memberId}/logs`, { content, careMethod })
  // await delay(500)
  // const newLog: CareLog = {
  //   logId: Date.now(),
  //   createdAt: new Date().toISOString(),
  //   content,
  //   careMethod: careMethod as CareMethod,
  //   createdBy: 'Current User'
  // }
  // MOCK_LOGS = [newLog, ...MOCK_LOGS]
}

export async function updateCareLog(memberId: number, logId: number, content: string, careMethod: string): Promise<void> {
  await api.patch(`/api/care/absentees/${memberId}/logs/${logId}`, { content, careMethod })
  // await delay(500)
  // const logIndex = MOCK_LOGS.findIndex(l => l.logId === logId)
  // if (logIndex !== -1) {
  //   MOCK_LOGS[logIndex] = { ...MOCK_LOGS[logIndex], content, careMethod: careMethod as CareMethod }
  // }
}

export async function deleteCareLog(memberId: number, logId: number): Promise<void> {
  await api.delete(`/api/care/absentees/${memberId}/logs/${logId}`)
  // await delay(500)
  // MOCK_LOGS = MOCK_LOGS.filter(l => l.logId !== logId)
}
