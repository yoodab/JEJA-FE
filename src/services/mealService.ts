import api from './api'

const API_ENDPOINT = '/api/meals'

export interface MealHistoryItem {
  id: number
  date: string
  category: 'STOCK' | 'USE'
  targetName: string | null
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
  // 백엔드에서 ApiResponse로 감싸지 않고 MealDataResponse를 직접 반환하는 경우와
  // ApiResponse.data 안에 담아 반환하는 경우를 모두 처리
  if (response.data?.data) {
    return response.data.data
  }
  return response.data || { currentStock: 0, history: [] }
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
