/**
 * 백엔드(Spring Boot) API 공통 응답 포맷
 * 
 * 모든 API 응답은 아래 형태로 감싸져서 옴.
 * `data` 필드 안에 실제 내용이 들어감.
 * 
 * NOTE: API 버전에 따라 status/code 필드 또는 result 필드를 사용할 수 있음.
 */
export interface ApiResponse<T> {
  // v1.0 (status/code style)
  status?: string;
  code?: string;
  
  // v1.1 (result style)
  result?: string;
  
  // Common
  message?: string;
  data: T;
}

/**
 * API 응답 타입 별칭 (기존 코드와의 호환성을 위해)
 */
export type ApiResponseForm<T> = ApiResponse<T>;

/**
 * Spring Boot Page 응답 타입
 * 페이지네이션된 응답에서 사용
 */
export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
}
