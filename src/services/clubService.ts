import api from './api'
import type { Club, CreateClubRequest, UpdateClubRequest } from '../types/club'
import type { ApiResponseForm } from '../types/api'

export const getClubs = async (): Promise<Club[]> => {
  const response = await api.get<ApiResponseForm<Club[]>>('/api/clubs')
  return response.data.data
}

export const getMyClubs = async (): Promise<Club[]> => {
  const response = await api.get<ApiResponseForm<Club[]>>('/api/clubs/my')
  return response.data.data
}

export const getClub = async (clubId: number): Promise<Club> => {
  const response = await api.get<ApiResponseForm<Club>>(`/api/clubs/${clubId}`)
  return response.data.data
}

export const createClub = async (data: CreateClubRequest): Promise<void> => {
  await api.post('/api/admin/clubs', data)
}

export const updateClub = async (clubId: number, data: UpdateClubRequest): Promise<void> => {
  await api.patch(`/api/clubs/${clubId}`, data)
}

export const deleteClub = async (clubId: number): Promise<void> => {
  await api.delete(`/api/admin/clubs/${clubId}`)
}

export const addClubMember = async (clubId: number, memberId: number): Promise<void> => {
  await api.post(`/api/clubs/${clubId}/members`, { memberId })
}

export const removeClubMember = async (clubId: number, memberId: number): Promise<void> => {
  await api.delete(`/api/clubs/${clubId}/members/${memberId}`)
}

export const changeClubLeader = async (clubId: number, newLeaderId: number): Promise<void> => {
  await api.patch(`/api/clubs/${clubId}/leader`, { newLeaderId })
}
