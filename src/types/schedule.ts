export type ScheduleType = 'WORSHIP' | 'EVENT' | 'MEETING';
export type SharingScope = 'PUBLIC' | 'LOGGED_IN_USERS' | 'PRIVATE';
export type RecurrenceRule = 'NONE' | 'DAILY' | 'WEEKLY' | 'WEEKLY_DAYS' | 'MONTHLY' | 'YEARLY';
export type UpdateType = 'THIS_ONLY' | 'FUTURE' | 'ALL';

export interface WorshipCategory {
  code: string;
  name: string;
}

export interface ScheduleAttendee {
  memberId: number;
  name: string;
  attended: boolean;
  attendanceTime: string;
  phoneNumber?: string; // 전화번호 필드 추가
}

export interface Schedule {
  scheduleId: number;
  title: string;
  content?: string;
  startDate: string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss
  endDate: string;   // ISO 8601 format
  type: ScheduleType;
  location?: string;
  sharingScope: SharingScope;
  worshipCategory?: string;
  worshipName?: string;
  worshipCategoryName?: string;
  recurrenceRule: RecurrenceRule;
  recurrenceEndDate?: string; // YYYY-MM-DD
  recurrenceDays?: string[]; // ['MONDAY', 'TUESDAY', ...]
  linkedAlbumId?: number | null;
  attendees?: ScheduleAttendee[];
}

export interface CreateScheduleRequest {
  title: string;
  content?: string;
  startDate: string; // ISO 8601 format
  endDate: string;   // ISO 8601 format
  type: ScheduleType;
  location?: string;
  sharingScope: SharingScope;
  worshipCategory?: string;
  recurrenceRule: RecurrenceRule;
  recurrenceEndDate?: string;
  recurrenceDays?: string[];
  createAlbum?: boolean;
}

export interface UpdateScheduleRequest extends Partial<Omit<CreateScheduleRequest, 'recurrenceRule' | 'recurrenceEndDate' | 'recurrenceDays'>> {
  updateType?: UpdateType;
  targetDate?: string; // YYYY-MM-DD (수정하려는 일정의 원본 시작 날짜)
  recurrenceRule?: RecurrenceRule;
  recurrenceEndDate?: string;
  recurrenceDays?: string[];
}

export interface UpcomingScheduleResponse {
  publicSchedules: Schedule[];
  memberSchedules: Schedule[] | null;
}
