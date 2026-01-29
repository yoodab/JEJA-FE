import api from './api'
import type { ApiResponseForm } from '../types/api'

const API_ENDPOINT = '/api/meals'

export interface MealHistoryItem {
  id: number
  date: string
  category: 'STOCK' | 'USE'
  targetName: string
  note: string
  amount: number
}

export interface MealDataResponse {
  currentStock: number
  history: MealHistoryItem[]
}

export interface AddStockRequest {
  amount: number
  note: string
}

export interface UseMealTicketRequest {
  userName: string
  place: string
  count: number
}

export interface UpdateMealRequest {
  date?: string
  targetName: string
  note: string
  amount: number
}

export const getMeals = async (): Promise<MealDataResponse> => {
  const response = await api.get<any>(API_ENDPOINT)
  // 백엔드 응답이 표준 래퍼(data 필드)를 쓰는지, 바로 데이터를 주는지 확인하여 처리
  return response.data?.data || response.data
}

export const addMealStock = async (data: AddStockRequest): Promise<void> => {
  await api.post(`${API_ENDPOINT}/stock`, data)
}

export const useMealTicket = async (data: UseMealTicketRequest): Promise<void> => {
  await api.post(`${API_ENDPOINT}/use`, data)
}

export const updateMeal = async (id: number, data: UpdateMealRequest): Promise<void> => {
  await api.put(`${API_ENDPOINT}/${id}`, data)
}

export const deleteMeal = async (id: number): Promise<void> => {
  await api.delete(`${API_ENDPOINT}/${id}`)
}
