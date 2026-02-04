import api from './api';
import type { 
  Schedule, 
  CreateScheduleRequest, 
  UpdateScheduleRequest, 
  WorshipCategory,
  UpdateType
} from '../types/schedule';

// ApiResponse 타입을 직접 정의하여 모듈 import 오류 방지
interface ApiResponse<T> {
  result?: string;
  status?: string;
  code?: string;
  message?: string;
  data: T;
}

// 백엔드 공통 응답 처리 함수
// result: "SUCCESS" 여부를 확인하고 data를 반환
  const handleResponse = <T>(response: { data: ApiResponse<T> }): T => {
    const { result, data, message } = response.data;
    
    // 백엔드 API 명세에 따르면 성공 시 result: "SUCCESS"
  // api.ts에는 status, code, message, data 구조로 되어 있는데, 
  // 실제 백엔드 구현에 따라 다를 수 있으므로 유연하게 처리
  if (result === 'SUCCESS' || response.data.status === 'SUCCESS' || response.data.code === '200') {
    return data;
  }
  
  throw new Error(message || response.data.message || 'API 요청 실패');
};

export const getSchedules = async (year: number, month: number): Promise<Schedule[]> => {
  const response = await api.get<ApiResponse<Schedule[]>>(`/api/schedules`, {
    params: { year, month }
  });
  return handleResponse(response);
};

export const createSchedule = async (data: CreateScheduleRequest): Promise<Schedule> => {
  const response = await api.post<ApiResponse<Schedule>>('/api/schedules', data);
  return handleResponse(response);
};

export const getScheduleDetail = async (id: number, date?: string): Promise<Schedule> => {
  const response = await api.get<ApiResponse<Schedule>>(`/api/schedules/${id}`, {
    params: { date }
  });
  return handleResponse(response);
};

export const updateSchedule = async (id: number, data: UpdateScheduleRequest): Promise<Schedule> => {
  const response = await api.patch<ApiResponse<Schedule>>(`/api/schedules/${id}`, data);
  return handleResponse(response);
};

export const deleteSchedule = async (id: number, updateType?: UpdateType, targetDate?: string): Promise<void> => {
  await api.delete(`/api/schedules/${id}`, {
    params: { updateType, targetDate }
  });
};

export const getWorshipCategories = async (): Promise<WorshipCategory[]> => {
  const response = await api.get<ApiResponse<WorshipCategory[]>>('/api/admin/worship-categories');
  return handleResponse(response);
};

export const registerScheduleMembers = async (scheduleId: number, memberIds: number[], targetDate: string): Promise<void> => {
  const response = await api.post<ApiResponse<void>>(`/api/admin/schedules/${scheduleId}/register`, { memberIds, targetDate });
  return handleResponse(response);
};

export const removeScheduleAttendees = async (scheduleId: number, memberIds: number[], targetDate: string): Promise<void> => {
  const response = await api.post<ApiResponse<void>>(`/api/admin/schedules/${scheduleId}/attendees/remove`, { memberIds, targetDate });
  return handleResponse(response);
};

export const getAdminSchedules = async (year: number, month: number): Promise<Schedule[]> => {
  const response = await api.get<ApiResponse<Schedule[]>>(`/api/schedules/admin`, {
      params: { year, month }
  });
  return handleResponse(response);
};

export const getUpcomingSchedules = async (): Promise<Schedule[]> => {
  const response = await api.get<ApiResponse<Schedule[]>>(`/api/schedules/upcoming`);
  return handleResponse(response);
};

export const scheduleService = {
  getSchedules,
  createSchedule,
  getScheduleDetail,
  updateSchedule,
  deleteSchedule,
  getWorshipCategories,
  registerScheduleMembers,
  removeScheduleAttendees,
  getAdminSchedules,
  getUpcomingSchedules
};
