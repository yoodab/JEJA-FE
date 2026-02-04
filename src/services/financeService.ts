import api from './api'
import type { ApiResponseForm } from '../types/api'
import type {
  FinanceRequestDto,
  FinanceResponseDto,
  CategoryDto,
  YearlyReportDto,
  DuesEventDto,
  DuesRecordDto,
  FinanceType
} from '../types/finance'

export const financeService = {
  // --- 1. 재정 관리 (General Finance) ---

  getFinances: async (startDate: string, endDate: string) => {
    const response = await api.get<ApiResponseForm<FinanceResponseDto[]>>('/api/finances', {
      params: { startDate, endDate }
    })
    return response.data.data
  },

  createFinance: async (data: FinanceRequestDto) => {
    const response = await api.post<ApiResponseForm<null>>('/api/finances', data)
    return response.data
  },

  createFinancesBatch: async (data: FinanceRequestDto[]) => {
    const response = await api.post<ApiResponseForm<null>>('/api/finances/batch', data)
    return response.data
  },

  updateFinance: async (id: number, data: FinanceRequestDto) => {
    const response = await api.put<ApiResponseForm<null>>(`/api/finances/${id}`, data)
    return response.data
  },

  deleteFinance: async (id: number) => {
    const response = await api.delete<ApiResponseForm<null>>(`/api/finances/${id}`)
    return response.data
  },

  // --- 2. 재정 카테고리 (Finance Category) ---

  getCategories: async (type: FinanceType) => {
    const response = await api.get<ApiResponseForm<CategoryDto[]>>('/api/finances/categories', {
      params: { type }
    })
    return response.data.data
  },

  createCategory: async (data: CategoryDto) => {
    const response = await api.post<ApiResponseForm<number>>('/api/finances/categories', data)
    return response.data.data // Returns created ID
  },

  updateCategory: async (id: number, data: CategoryDto) => {
    const response = await api.put<ApiResponseForm<null>>(`/api/finances/categories/${id}`, data)
    return response.data
  },

  deleteCategory: async (id: number) => {
    const response = await api.delete<ApiResponseForm<null>>(`/api/finances/categories/${id}`)
    return response.data
  },

  // --- 3. 재정 리포트 (Finance Report) ---

  getYearlyReport: async (year: number) => {
    const response = await api.get<ApiResponseForm<YearlyReportDto>>('/api/finances/report/yearly', {
      params: { year }
    })
    return response.data.data
  },

  // --- 4. 회비 관리 (Dues) ---

  // 4-1. 회비 이벤트 (Events)
  getDuesEvents: async () => {
    const response = await api.get<ApiResponseForm<DuesEventDto[]>>('/api/dues/events')
    return response.data.data
  },

  createDuesEvent: async (data: DuesEventDto) => {
    const response = await api.post<ApiResponseForm<number>>('/api/dues/events', data)
    return response.data.data // Returns created ID
  },

  updateDuesEvent: async (id: number, data: DuesEventDto) => {
    const response = await api.put<ApiResponseForm<null>>(`/api/dues/events/${id}`, data)
    return response.data
  },

  deleteDuesEvent: async (id: number) => {
    const response = await api.delete<ApiResponseForm<null>>(`/api/dues/events/${id}`)
    return response.data
  },

  // 4-2. 납부 기록 (Records)
  getDuesRecords: async (eventId: number) => {
    const response = await api.get<ApiResponseForm<DuesRecordDto[]>>('/api/dues/records', {
      params: { eventId }
    })
    return response.data.data
  },

  createDuesRecordsBatch: async (data: DuesRecordDto[]) => {
    const response = await api.post<ApiResponseForm<null>>('/api/dues/records/batch', data)
    return response.data
  },

  updateDuesRecord: async (id: number, data: DuesRecordDto) => {
    const response = await api.put<ApiResponseForm<null>>(`/api/dues/records/${id}`, data)
    return response.data
  },

  deleteDuesRecord: async (id: number) => {
    const response = await api.delete<ApiResponseForm<null>>(`/api/dues/records/${id}`)
    return response.data
  }
}
