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
  const { result, data, message } = response.data as any; // 임시로 any 처리 (api.ts 정의와 맞추기 위해)
  
  // 백엔드 API 명세에 따르면 성공 시 result: "SUCCESS"
  // api.ts에는 status, code, message, data 구조로 되어 있는데, 
  // 실제 백엔드 구현에 따라 다를 수 있으므로 유연하게 처리
  if (result === 'SUCCESS' || response.data.status === 'SUCCESS' || response.data.code === '200') {
    return data;
  }
  
  throw new Error(message || response.data.message || 'API 요청 실패');
};

export const scheduleService = {
  // 월별 일정 조회
  getSchedules: async (year: number, month: number): Promise<Schedule[]> => {
    const response = await api.get<ApiResponse<Schedule[]>>(`/api/schedules`, {
      params: { year, month }
    });
    return handleResponse(response);
  },

  // 일정 등록
  createSchedule: async (data: CreateScheduleRequest): Promise<Schedule> => {
    const response = await api.post<ApiResponse<Schedule>>('/api/schedules', data);
    return handleResponse(response);
  },

  // 일정 상세 조회
  getScheduleDetail: async (id: number): Promise<Schedule> => {
    const response = await api.get<ApiResponse<Schedule>>(`/api/schedules/${id}`);
    return handleResponse(response);
  },

  // 일정 수정
  updateSchedule: async (id: number, data: UpdateScheduleRequest): Promise<Schedule> => {
    const response = await api.patch<ApiResponse<Schedule>>(`/api/schedules/${id}`, data);
    return handleResponse(response);
  },

  // 일정 삭제
  deleteSchedule: async (id: number, updateType?: UpdateType, targetDate?: string): Promise<void> => {
    await api.delete(`/api/schedules/${id}`, {
      params: { updateType, targetDate }
    });
    // DELETE는 보통 204 No Content 혹은 200 OK로 오며, 별도 데이터 반환이 없을 수 있음
  },

  // 예배 카테고리 조회
  getWorshipCategories: async (): Promise<WorshipCategory[]> => {
    const response = await api.get<ApiResponse<WorshipCategory[]>>('/api/admin/worship-categories');
    return handleResponse(response);
  },

  // 명단 등록 (Register)
  registerScheduleMembers: async (scheduleId: number, memberIds: number[]): Promise<void> => {
    const response = await api.post<ApiResponse<void>>(`/api/admin/schedules/${scheduleId}/register`, { memberIds });
    return handleResponse(response);
  },

  // 명단 제외 (Remove)
  removeScheduleAttendees: async (scheduleId: number, memberIds: number[]): Promise<void> => {
    const response = await api.post<ApiResponse<void>>(`/api/admin/schedules/${scheduleId}/attendees/remove`, { memberIds });
    return handleResponse(response);
  }
};
