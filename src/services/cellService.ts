import api from './api'
import type { Member } from '../types/member'

export interface Cell {
  cellId: number
  cellName: string
  year: number
  leaderMemberId: number | null
  leaderName: string | null
  leaderPhone: string | null
  members: Member[]
}

export interface CreateCellRequest {
  cellName: string
  year: number
  leaderMemberId?: number | null
}

export interface UpdateCellRequest {
  cellName?: string
  year?: number
  leaderMemberId?: number | null
}

// 셀 목록 조회
export async function getCells(year: number): Promise<Cell[]> {
  const response = await api.get('/api/admin/cells', {
    params: { year },
  })
  const rawData = (response.data as any).data
  
  return rawData.map((cell: any) => ({
    cellId: cell.cellId,
    cellName: cell.cellName,
    year: cell.year,
    leaderMemberId: cell.leader?.memberId || null,
    leaderName: cell.leader?.name || null,
    leaderPhone: cell.leader?.phone || null,
    members: (cell.members || []).filter((m: any) => m.memberId !== (cell.leader?.memberId)),
  }))
}

// 셀 생성
export async function createCell(data: CreateCellRequest): Promise<number> {
  const response = await api.post('/api/admin/cells', data)
  return (response.data as any).data
}

// 셀 수정
export async function updateCell(cellId: number, data: UpdateCellRequest): Promise<void> {
  await api.patch(`/api/admin/cells/${cellId}`, data)
}

// 셀 삭제
export async function deleteCell(cellId: number): Promise<void> {
  await api.delete(`/api/admin/cells/${cellId}`)
}

// 미배정 인원 조회
export async function getUnassignedMembers(year: number): Promise<Member[]> {
  const response = await api.get<{ data: Member[] }>('/api/members/admin/unassigned', {
    params: { year },
  })
  return (response.data as any).data
}

// 셀원 일괄 배정
export async function assignMembersToCell(cellId: number, memberIds: number[]): Promise<void> {
  await api.post(`/api/admin/cells/${cellId}/members`, memberIds)
}
