import type * as member from '../types/member'
import api from './api'

// 생성 요청 DTO (memberId, soonId, soonName, hasAccount는 서버에서 결정)
export interface CreateMemberRequest {
  name: string
  phone: string
  birthDate: string
  status: string
  role: string
}

// 수정 요청 DTO
export interface UpdateMemberRequest {
  name?: string
  phone?: string
  birthDate?: string
  status?: string
  role?: string
}

// API 응답 타입
interface ApiResponse<T> {
  status: string
  code: string
  message: string
  data: T
}

// 전체 멤버 목록 조회 - GET /api/admin/members
export async function getMembers(): Promise<member.Member[]> {
  const response = await api.get<ApiResponse<member.Member[]>>('/api/admin/members')
  return response.data.data
}

// 특정 멤버 상세 조회 - GET /api/admin/members/{memberId}
export async function getMemberById(memberId: number): Promise<member.Member> {
  const response = await api.get<ApiResponse<member.Member>>(`/api/admin/members/${memberId}`)
  return response.data.data
}

// 새 멤버 등록 - POST /api/admin/members
// 성공 시 Body: 생성된 memberId (number)
export async function createMember(payload: CreateMemberRequest): Promise<number> {
  const response = await api.post<number>('/api/admin/members', payload)
  return response.data
}

// 멤버 정보 수정 - PATCH /api/admin/members/{memberId}
export async function updateMember(memberId: number, payload: UpdateMemberRequest): Promise<void> {
  await api.patch(`/api/admin/members/${memberId}`, payload)
}

// 멤버 삭제 - DELETE /api/admin/members/{memberId}
export async function deleteMember(memberId: number): Promise<void> {
  await api.delete(`/api/admin/members/${memberId}`)
}

