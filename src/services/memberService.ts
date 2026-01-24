import type * as member from '../types/member'
import api from './api'
import type { ApiResponseForm, Page } from '../types/api'

// 생성 요청 DTO (백엔드 Enum 값으로 전송)
export interface CreateMemberRequest {
  name: string
  phone: string
  birthDate: string
  gender?: string  // 성별: "남성", "여성" 등
  status: string  // 백엔드 Enum: "ACTIVE", "INACTIVE", "NEWCOMER" 등
  role: string     // 백엔드 Enum: "MEMBER", "CELL_LEADER", "TEAM_LEADER" 등
}

// 수정 요청 DTO (백엔드 Enum 값으로 전송)
export interface UpdateMemberRequest {
  name?: string
  phone?: string
  birthDate?: string
  gender?: string  // 성별: "남성", "여성" 등
  status?: string  // 백엔드 Enum: "ACTIVE", "INACTIVE", "NEWCOMER" 등
  role?: string     // 백엔드 Enum: "MEMBER", "CELL_LEADER", "TEAM_LEADER" 등
}

// 멤버 목록 조회 파라미터
export interface GetMembersParams {
  page?: number  // 기본 0
  size?: number  // 기본 20
  keyword?: string  // 선택
}

// 멤버 목록 조회 - GET /api/members
export async function getMembers(params?: GetMembersParams): Promise<Page<member.Member>> {
  const response = await api.get<ApiResponseForm<Page<member.Member>>>('/api/members', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      ...(params?.keyword && { keyword: params.keyword }),
    },
  })
  return response.data.data
}

// 특정 멤버 상세 조회 - GET /api/members/{memberId} (또는 /api/admin/members/{memberId})
export async function getMemberById(memberId: number): Promise<member.Member> {
  const response = await api.get<ApiResponseForm<member.Member>>(`/api/members/${memberId}`)
  return response.data.data
}

// 새 멤버 등록 - POST /api/members
// payload는 이미 백엔드 Enum 값 (status: "ACTIVE", role: "MEMBER" 등)을 포함해야 함
export async function createMember(payload: CreateMemberRequest): Promise<number> {
  const response = await api.post<ApiResponseForm<number>>('/api/members', payload)
  return response.data.data
}

// 멤버 정보 수정 - PATCH /api/members/{memberId} (또는 /api/admin/members/{memberId})
// payload는 이미 백엔드 Enum 값을 포함해야 함
export async function updateMember(memberId: number, payload: UpdateMemberRequest): Promise<void> {
  await api.patch(`/api/members/${memberId}`, payload)
}

// 멤버 삭제 - DELETE /api/members/{memberId} (또는 /api/admin/members/{memberId})
export async function deleteMember(memberId: number): Promise<void> {
  await api.delete(`/api/members/${memberId}`)
}

// 엑셀 업로드로 멤버 일괄 등록 - POST /api/members/import
// multipart/form-data 형식으로 파일 전송
export async function uploadMembersFromExcel(file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)

  await api.post('/api/members/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

