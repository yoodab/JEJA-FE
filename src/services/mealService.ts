import api from './api'
import type { ApiResponse } from '../types/api'

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
  const response = await api.get<ApiResponse<MealDataResponse>>(API_ENDPOINT)
  return response.data.data
}

export const addMealStock = async (data: AddStockRequest): Promise<void> => {
  await api.post(`${API_ENDPOINT}/stock`, data)
}

export const consumeMealTicket = async (data: UseMealTicketRequest): Promise<void> => {
  await api.post(`${API_ENDPOINT}/use`, data)
}

export const updateMeal = async (id: number, data: UpdateMealRequest): Promise<void> => {
  await api.put(`${API_ENDPOINT}/${id}`, data)
}

export const deleteMeal = async (id: number): Promise<void> => {
  await api.delete(`${API_ENDPOINT}/${id}`)
}
