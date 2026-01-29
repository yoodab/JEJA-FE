import api from './api'
import type { ApiResponseForm, Page } from '../types/api'
import type { 
  Newcomer, 
  CreateNewcomerRequest, 
  UpdateNewcomerRequest, 
  MdAssignment, 
  CreateMdAssignmentRequest 
} from '../types/newcomer'

// 새신자 목록 조회 파라미터
export interface GetNewcomersParams {
  page?: number
  size?: number
  year?: number
  status?: string // Backend Enum value
  keyword?: string
}

// 1. 목록 조회
export async function getNewcomers(params?: GetNewcomersParams): Promise<Page<Newcomer>> {
  const response = await api.get<ApiResponseForm<Page<any>>>('/api/newcomers', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 10,
      ...(params?.year && { year: params.year }),
      ...(params?.status && { status: params.status }),
      ...(params?.keyword && { keyword: params.keyword }),
    },
  })
  
  // 데이터 변환
  const content = response.data.data.content.map((item: any) => ({
    ...item,
    gender: item.gender === '남자' ? 'MALE' : (item.gender === '여자' ? 'FEMALE' : item.gender),
    isMemberRegistered: item.memberRegistered !== undefined ? item.memberRegistered : item.isMemberRegistered,
    isChurchRegistered: item.churchRegistered !== undefined ? item.churchRegistered : item.isChurchRegistered,
    cellName: item.cellName || item.assignedSoon, // 등반예정순 매핑
  }))

  return {
    ...response.data.data,
    content
  }
}

// 2. 상세 조회
export async function getNewcomerById(id: number): Promise<Newcomer> {
  const response = await api.get<ApiResponseForm<any>>(`/api/newcomers/${id}`)
  const data = response.data.data

  // 백엔드 응답 데이터 변환
  return {
    ...data,
    // 한글로 오는 성별을 Enum으로 변환
    gender: data.gender === '남자' ? 'MALE' : (data.gender === '여자' ? 'FEMALE' : data.gender),
    // 필드명 불일치 해결
    isMemberRegistered: data.memberRegistered !== undefined ? data.memberRegistered : data.isMemberRegistered,
    isChurchRegistered: data.churchRegistered !== undefined ? data.churchRegistered : data.isChurchRegistered,
    cellName: data.cellName || data.assignedSoon, // 등반예정순 매핑
  }
}

// 3. 등록
export async function createNewcomer(payload: CreateNewcomerRequest): Promise<void> {
  await api.post('/api/newcomers', payload)
}

// 4. 수정
export async function updateNewcomer(id: number, payload: UpdateNewcomerRequest): Promise<void> {
  await api.patch(`/api/newcomers/${id}`, payload)
}

// 5. 상태 변경
export async function updateNewcomerStatus(id: number, status: string): Promise<void> {
  await api.patch(`/api/newcomers/${id}/status`, null, {
    params: { status }
  })
}

// 6. 삭제 (명세에는 없지만 필요할 수 있음)
export async function deleteNewcomer(id: number): Promise<void> {
  await api.delete(`/api/newcomers/${id}`)
}

// 7. 엑셀 일괄 등록
export async function createNewcomersBatch(payload: CreateNewcomerRequest[]): Promise<void> {
  await api.post('/api/newcomers/batch', payload)
}

// 8. 등반 처리
export async function graduateNewcomer(id: number): Promise<void> {
  await api.post(`/api/newcomers/${id}/graduate`)
}

// 9. 순 배정
export async function assignNewcomerCell(id: number, cellName: string): Promise<void> {
  await api.patch(`/api/newcomers/${id}`, { cellName })
}

// --- MD 배치 관리 ---

// 1. MD 목록 조회
export async function getMdAssignments(): Promise<MdAssignment[]> {
  const response = await api.get<ApiResponseForm<MdAssignment[]>>('/api/newcomers/mds')
  return response.data.data
}

// 2. MD 등록
export async function createMdAssignment(payload: CreateMdAssignmentRequest): Promise<void> {
  await api.post('/api/newcomers/mds', payload)
}

// 3. MD 수정
export async function updateMdAssignment(id: number, payload: CreateMdAssignmentRequest): Promise<void> {
  await api.put(`/api/newcomers/mds/${id}`, payload)
}

// 4. MD 삭제
export async function deleteMdAssignment(id: number): Promise<void> {
  await api.delete(`/api/newcomers/mds/${id}`)
}

// --- 이미지 업로드 (Helper) ---
export async function uploadNewcomerImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('files', file)

  const response = await api.post<{ status: string, data: { url: string }[] }>('/api/files/upload', formData, {
    params: { folder: 'newcomer' },
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  
  // URL 반환 (첫 번째 파일)
  return response.data.data[0]?.url || ''
}
