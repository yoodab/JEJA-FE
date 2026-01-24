import type * as member from '../types/member'
import api from './api'
import type { ApiResponseForm, Page } from '../types/api'

// 생성 요청 DTO
export interface CreateMemberRequest {
  name: string
  phone: string
  birthDate: string
  gender: string  // "MALE" | "FEMALE"
  memberStatus: string  // "NEWCOMER", "ACTIVE", "LONG_TERM_ABSENT", "MOVED", "GRADUATED"
  memberImageUrl?: string
}

// 수정 요청 DTO
export interface UpdateMemberRequest {
  name?: string
  phone?: string
  birthDate?: string
  gender?: string
  memberStatus?: string
  memberImageUrl?: string
}

// 멤버 목록 조회 파라미터
export interface GetMembersParams {
  page?: number  // 기본 0
  size?: number  // 기본 20
  keyword?: string  // 선택
  status?: string // 선택 (Enum value)
  sort?: string // default "name,asc"
}

// 멤버 목록 조회 - GET /api/members
export async function getMembers(params?: GetMembersParams): Promise<Page<member.Member>> {
  const response = await api.get<ApiResponseForm<Page<member.Member>>>('/api/members', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      sort: params?.sort ?? 'name,asc',
      ...(params?.keyword && { keyword: params.keyword }),
      ...(params?.status && { status: params.status }),
    },
  })
  return response.data.data
}

// 멤버 통계 조회 - GET /api/members/statistics
export async function getMemberStats(): Promise<member.MemberStats> {
  const response = await api.get<ApiResponseForm<member.MemberStats>>('/api/members/statistics')
  return response.data.data
}

// 특정 멤버 상세 조회 - GET /api/members/{memberId}
export async function getMemberById(memberId: number): Promise<member.Member> {
  const response = await api.get<ApiResponseForm<member.Member>>(`/api/members/${memberId}`)
  return response.data.data
}

// 새 멤버 등록 - POST /api/members
export async function createMember(payload: CreateMemberRequest): Promise<number> {
  const response = await api.post<ApiResponseForm<number>>('/api/members', payload)
  return response.data.data
}

// 멤버 정보 수정 - PUT /api/members/{memberId}
export async function updateMember(memberId: number, payload: UpdateMemberRequest): Promise<void> {
  await api.put(`/api/members/${memberId}`, payload)
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

// 이미지 업로드 - POST /api/files/upload?folder=member
export async function uploadMemberImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<{ status: string, data: { url: string } }>('/api/files/upload?folder=member', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  
  return response.data.data.url
}

