export type ScheduleType = 'WORSHIP' | 'EVENT' | 'MEETING';
export type SharingScope = 'PUBLIC' | 'LOGGED_IN_USERS' | 'PRIVATE';
export type RecurrenceRule = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type UpdateType = 'THIS_ONLY' | 'FUTURE' | 'ALL';

export interface WorshipCategory {
  worshipCategoryId: number;
  name: string;
}

export interface ScheduleAttendee {
  memberId: number;
  name: string;
  attended: boolean;
  attendanceTime: string;
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
  worshipCategoryId?: number;
  worshipName?: string;
  worshipCategoryName?: string;
  recurrenceRule: RecurrenceRule;
  recurrenceEndDate?: string; // YYYY-MM-DD
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
  worshipCategoryId?: number;
  recurrenceRule: RecurrenceRule;
  recurrenceEndDate?: string;
  createAlbum?: boolean;
}

export interface UpdateScheduleRequest extends Partial<Omit<CreateScheduleRequest, 'recurrenceRule' | 'recurrenceEndDate'>> {
  updateType?: UpdateType;
  targetDate?: string; // YYYY-MM-DD (수정하려는 일정의 원본 시작 날짜)
  recurrenceRule?: RecurrenceRule;
  recurrenceEndDate?: string;
}
