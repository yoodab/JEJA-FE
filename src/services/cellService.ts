import api from './api'
import type { Member } from '../types/member'

export interface ApiResponse<T> {
  status: string
  data: T
  message?: string
}

export interface Cell {
  cellId: number
  cellName: string
  year: number
  active: boolean
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
}

export interface SyncCellMembersRequest {
  leaderId: number | null
  memberIds: number[]
}

export interface CellMemberUpdateDto {
  cellId: number
  leaderId: number | null
  memberIds: number[]
}

export interface CellMemberBatchUpdateRequestDto {
  cellUpdates: CellMemberUpdateDto[]
}

// 셀 목록 조회
export async function getCells(year: number): Promise<Cell[]> {
  const response = await api.get<ApiResponse<any>>('/api/admin/cells', {
    params: { year },
  })
  
  if (response.data.status?.toUpperCase() !== 'SUCCESS') {
    throw new Error(response.data.message || '셀 목록 조회 실패')
  }

  const rawData = response.data.data
  
  return rawData.map((cell: any) => ({
    cellId: cell.cellId,
    cellName: cell.cellName,
    year: cell.year,
    active: cell.active,
    leaderMemberId: cell.leader?.memberId || null,
    leaderName: cell.leader?.name || null,
    leaderPhone: cell.leader?.phone || null,
    members: (cell.members || [])
      .filter((m: any) => m.memberId !== (cell.leader?.memberId))
      .map((m: any) => ({
        ...m,
        // API 응답에 없는 필드 안전하게 처리
        phone: m.phone || '',
        birthDate: m.birthDate || '',
        memberStatus: m.memberStatus || 'ACTIVE',
        roles: m.roles || [],
      })),
  }))
}

// 셀 생성
export async function createCell(data: CreateCellRequest): Promise<number> {
  const response = await api.post<ApiResponse<number>>('/api/admin/cells', data)
  
  if (response.data.status?.toUpperCase() !== 'SUCCESS') {
    throw new Error(response.data.message || '셀 생성 실패')
  }
  
  return response.data.data
}

// 셀 수정
export async function updateCell(cellId: number, data: UpdateCellRequest): Promise<void> {
  const response = await api.patch<ApiResponse<any>>(`/api/admin/cells/${cellId}`, data)
  
  if (response.data.status?.toUpperCase() !== 'SUCCESS') {
    throw new Error(response.data.message || '셀 수정 실패')
  }
}

// 셀 삭제
export async function deleteCell(cellId: number): Promise<void> {
  const response = await api.delete<ApiResponse<any>>(`/api/admin/cells/${cellId}`)
  
  if (response.data.status?.toUpperCase() !== 'SUCCESS') {
    throw new Error(response.data.message || '셀 삭제 실패')
  }
}

// 미배정 인원 조회
export async function getUnassignedMembers(year: number): Promise<Member[]> {
  const response = await api.get<ApiResponse<Member[]>>('/api/members/admin/unassigned', {
    params: { year },
  })
  
  if (response.data.status?.toUpperCase() !== 'SUCCESS') {
    throw new Error(response.data.message || '미배정 인원 조회 실패')
  }
  
  return response.data.data
}

// 셀원 구성 동기화 (순장 + 순원)
export async function syncCellMembers(cellId: number, data: SyncCellMembersRequest): Promise<void> {
  const response = await api.put<ApiResponse<any>>(`/api/admin/cells/${cellId}/members`, data)
  
  if (response.data.status?.toUpperCase() !== 'SUCCESS') {
    throw new Error(response.data.message || '멤버 배정 실패')
  }
}

// 순 구성원 일괄 업데이트 (Batch Update)
export async function updateCellMembersBatch(data: CellMemberBatchUpdateRequestDto): Promise<void> {
  const response = await api.put<ApiResponse<any>>('/api/admin/cells/members/batch', data)

  if (response.data.status?.toUpperCase() !== 'SUCCESS') {
    throw new Error(response.data.message || '일괄 업데이트 실패')
  }
}

// 시즌 활성화
export async function activateSeason(year: number): Promise<void> {
  const response = await api.post<ApiResponse<any>>('/api/admin/activate', null, {
    params: { year }
  })
  
  if (response.data.status?.toUpperCase() !== 'SUCCESS') {
    throw new Error(response.data.message || '시즌 활성화 실패')
  }
}
