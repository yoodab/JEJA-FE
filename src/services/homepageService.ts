import api from './api'
import type { ApiResponse } from '../types/api'

export type SlideType = 'text' | 'image' | 'IMAGE' | 'TEXT'

export interface TextElement {
  id: string
  text: string
  fontSize: number
  color: string
  x: number
  y: number
  fontWeight: 'normal' | 'bold' | 'semibold'
  fontFamily: string
}

export interface Slide {
  id: number
  type: SlideType
  orderIndex: number
  // Image fields
  url?: string
  linkUrl?: string
  title?: string
  subtitle?: string
  // Text fields
  backgroundColor?: string
  textElements?: TextElement[]
  // Base fields
  createdAt?: string
  updatedAt?: string
}

export interface SlideRequestDto {
  type: SlideType
  url?: string
  linkUrl?: string
  title?: string
  subtitle?: string
  backgroundColor?: string
  textElements?: TextElement[]
}

export interface YoutubeConfig {
  id?: number
  liveUrl: string
  playlistUrl: string
}

// === 관리자 API ===

// 슬라이드 목록 조회 (관리자)
export const getSlidesAdmin = async (): Promise<Slide[]> => {
  const response = await api.get<ApiResponse<Slide[]>>('/api/admin/homepage/slides')
  return response.data.data
}

// 슬라이드 생성
export const createSlide = async (data: SlideRequestDto): Promise<number> => {
  const response = await api.post<ApiResponse<number>>('/api/admin/homepage/slides', data)
  return response.data.data
}

// 슬라이드 수정
export const updateSlide = async (slideId: number, data: SlideRequestDto): Promise<void> => {
  await api.patch<ApiResponse<void>>(`/api/admin/homepage/slides/${slideId}`, data)
}

// 슬라이드 삭제
export const deleteSlide = async (slideId: number): Promise<void> => {
  await api.delete<ApiResponse<void>>(`/api/admin/homepage/slides/${slideId}`)
}

// 슬라이드 순서 변경
export const reorderSlides = async (slideIds: number[]): Promise<void> => {
  await api.patch<ApiResponse<void>>('/api/admin/homepage/slides/reorder', { slideIds })
}

// 유튜브 설정 조회 (관리자)
export const getYoutubeConfigAdmin = async (): Promise<YoutubeConfig> => {
  const response = await api.get<ApiResponse<YoutubeConfig>>('/api/admin/homepage/youtube-config')
  return response.data.data
}

// 유튜브 설정 수정
export const updateYoutubeConfig = async (data: YoutubeConfig): Promise<void> => {
  await api.patch<ApiResponse<void>>('/api/admin/homepage/youtube-config', data)
}

// === 공개 API ===

// 공개 슬라이드 목록 조회
export const getSlidesPublic = async (): Promise<Slide[]> => {
  const response = await api.get<ApiResponse<Slide[]>>('/api/homepage/slides')
  return response.data.data
}

// 공개 유튜브 설정 조회
export const getYoutubeConfigPublic = async (): Promise<YoutubeConfig> => {
  const response = await api.get<ApiResponse<YoutubeConfig>>('/api/homepage/youtube')
  return response.data.data
}
