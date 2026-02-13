// Enums
export type FormCategory = 'CLUB_APPLICATION' | 'CELL_REPORT' | 'EVENT_APPLICATION' | 'SURVEY' | 'ETC';
export type FormType = 'PERSONAL' | 'GROUP';
export type QuestionType = 'SHORT_TEXT' | 'LONG_TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'NUMBER' | 'BOOLEAN' | 'WORSHIP_ATTENDANCE' | 'SCHEDULE_ATTENDANCE';
export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type WorshipCategory = 'SUNDAY_SERVICE_1' | 'SUNDAY_SERVICE_2' | 'SUNDAY_SERVICE_3' | 'WEDNESDAY_SERVICE_1' | 'WEDNESDAY_SERVICE_2' | 'FRIDAY_PRAYER' | 'DAWN_PRAYER' | 'YOUTH_SERVICE' | 'ETC';
export type AttendanceSyncType = 'NONE' | 'POST_CONFIRMATION' | 'PRE_REGISTRATION';

export type NextActionType = 'CONTINUE' | 'GO_TO_SECTION' | 'SUBMIT';

export type AccessType = 'MANAGER' | 'RESPONDENT';
export type TargetType = 'ALL' | 'ROLE' | 'USER' | 'CLUB' | 'GUEST';

export interface QuestionOption {
  label: string;
  nextAction?: NextActionType;
  targetSectionIndex?: number | null;
}

// Interfaces
export interface FormTemplate {
  id: number;
  title: string;
  description?: string; // 백엔드 일치
  category: FormCategory;
  type: FormType;
  
  targetClubId?: number; // 특정 클럽 전용
  startDate?: string;    // 시작일 (ISO 8601 string)
  endDate?: string;      // 종료일
  isActive: boolean;     // 관리자 ON/OFF
  
  questions: FormQuestion[];
  sections?: FormSection[]; // 질문 섹션 (페이지) 관리
  accessList?: FormAccess[]; // 권한 관리
}

export interface FormSection {
  id: number;
  title: string;
  description?: string;
  orderIndex: number;
  defaultNextAction?: NextActionType;
  defaultTargetSectionIndex?: number | null;
  questions: FormQuestion[];
}

export interface FormAccess {
  id?: number;
  accessType: AccessType;
  targetType: TargetType;
  targetValue?: string; // "ROLE_LEADER", "1", "ALL" etc.
  targetName?: string; // Frontend display only (e.g. Member Name, Club Name)
}

export interface FormQuestion {
  id: number;
  label: string; // 예: "주일예배", "기도제목"
  description?: string;
  inputType: QuestionType;
  syncType?: AttendanceSyncType;
  required: boolean;
  orderIndex: number;
  options?: string[]; // Added for compatibility with previous code if needed (e.g. choice questions)
  optionsJson?: string; // JSON string of QuestionOption[]
  memberSpecific: boolean; // true면 각 순원마다 입력 (Row: 순원 / Col: 질문)
  linkedWorshipCategory?: WorshipCategory; // 출석 자동 연동 타겟
  linkedScheduleId?: number; // 특정 일정 참석여부 조사용 일정 ID
  linkedScheduleDate?: string; // 특정 날짜 (반복 일정 대응, YYYY-MM-DD)
  imageUrl?: string; // 질문에 포함된 이미지 URL
  
  // Frontend Only
  linkedSchedules?: {id: number, title: string, startDate: string, questionId?: number}[]; 
}

export interface FormSubmission {
  id: number;
  templateId: number;
  submitterName: string; // 순장 이름 (예: "윤다빈")
  submitDate: string;    // 실제 제출일 (예: "2026-01-10")
  submitTime: string;    // 실제 제출일시 (예: "2026-01-10T10:00:00")
  targetSundayDate?: string; // 보고서 해당 주일 (예: "2026-01-11")
  targetCellName?: string;  // 순 이름 (예: "다빈순")
  targetCellId?: number;    // 순 ID (예: 1)
  status: SubmissionStatus;
  answers: FormAnswer[];
}

export interface FormAnswer {
  questionId: number;
  questionLabel?: string; // 상세 조회 시 질문 내용 표시용
  targetMemberName?: string; // GROUP형일 때 대상 순원 이름 (예: "최인서")
  value: string; // "true", "false", "텍스트"
}

export interface ClubSubmissionResponse {
  submissionId: number;
  templateTitle: string;
  submitterName: string;
  submitDate: string;
  status: SubmissionStatus;
}

export interface MySubmissionResponse {
  submissionId: number;
  templateId: number;
  templateTitle: string;
  submitterName: string;
  submitTime: string;
  targetSundayDate?: string;
  status: SubmissionStatus;
  targetCellName?: string;
  targetCellId?: number;
  category?: FormCategory;
  type?: FormType;
}

export interface SubmissionDetailResponse {
  submissionId: number;
  formTitle: string;
  submitDate: string;
  targetSundayDate?: string;
  status: SubmissionStatus;
  submitterName: string;
  items: QuestionAnswerDto[];
}

export interface QuestionAnswerDto {
  questionId: number;
  label: string;
  inputType: QuestionType;
  answers: AnswerDetail[];
}

export interface AnswerDetail {
  memberName?: string;
  value: string;
}
