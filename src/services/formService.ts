import api from './api';
import type { 
  FormTemplate, 
  FormSubmission, 
  FormAnswer, 
  QuestionType, 
  SubmissionStatus, 
  FormCategory,
  FormQuestion,
  FormSection,
  FormType,
  AccessType,
  TargetType,
  AttendanceSyncType,
  WorshipCategory,
  NextActionType
} from '../types/form';
import type { ApiResponseForm } from '../types/api';

interface RawQuestionDto {
  id?: number;
  label?: string;
  inputType?: QuestionType | string;
  required?: boolean;
  orderIndex?: number;
  options?: string[];
  optionsJson?: string;
  isMemberSpecific?: boolean;
  memberSpecific?: boolean;
  syncType?: AttendanceSyncType | string;
  linkedWorshipCategory?: WorshipCategory | string;
  linkedScheduleId?: number;
  linkedScheduleDate?: string;
  linkedSchedules?: { id: number; title: string; startDate: string; questionId?: number }[];
}

interface RawSectionDto {
  id?: number;
  title?: string;
  description?: string;
  orderIndex?: number;
  defaultNextAction?: NextActionType | string;
  defaultTargetSectionIndex?: number | null;
  questions?: RawQuestionDto[];
}

interface RawAccessDto {
  accessType: string;
  targetType: string;
  targetValue: string;
}

interface RawFormDetailDto {
  templateId?: number;
  id?: number;
  title: string;
  description: string;
  category: FormCategory | string;
  type?: FormType | string;
  isActive?: boolean;
  active?: boolean;
  targetClubId?: number;
  questions?: RawQuestionDto[];
  sections?: RawSectionDto[];
  startDate?: string;
  endDate?: string;
  accessList?: RawAccessDto[];
}

export interface SubmissionRequest {
  templateId: number;
  date?: string; // YYYY-MM-DD
  cellId?: number;
  clubId?: number;
  guestName?: string;
  guestPhone?: string;
  answers: {
    questionId: number;
    targetMemberId?: number;
    value: string;
  }[];
}

// Backend DTOs
interface AvailableFormResponseDto {
  templateId: number;
  title: string;
  description: string;
  category: FormCategory | string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

interface AdminSubmissionSummaryDto {
  id: number;
  submitterName: string;
  description: string;
  submitTime: string; // ISO
  status: SubmissionStatus;
  targetSundayDate?: string;
}

interface ClubSubmissionResponseDto {
  submissionId: number;
  templateTitle: string;
  submitterName: string;
  submitDate: string;
  status: SubmissionStatus;
}

interface SubmissionDetailResponseDto {
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

interface AnswerDetail {
  memberName?: string;
  value: string;
}

export interface AvailableFormResponse {
  templateId: number;
  title: string;
  description: string;
  category: FormCategory;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  lastSubmitDate?: string;
  submitted: boolean;
}

export interface MySubmissionResponse {
  submissionId: number;
  templateTitle: string;
  submitterName: string;
  submitDate: string;
  status: SubmissionStatus;
}

const mapQuestion = (q: RawQuestionDto): FormQuestion => ({
  id: q.id ?? -(Date.now()),
  label: q.label ?? '',
  inputType: (q.inputType ?? 'SHORT_TEXT') as QuestionType,
  syncType: (q.syncType ?? undefined) as AttendanceSyncType | undefined,
  required: q.required ?? false,
  orderIndex: q.orderIndex ?? 0,
  options: q.options ?? [],
  optionsJson: q.optionsJson,
  memberSpecific: q.isMemberSpecific !== undefined ? !!q.isMemberSpecific : !!q.memberSpecific,
  linkedWorshipCategory: (q.linkedWorshipCategory ?? undefined) as WorshipCategory | undefined,
  linkedScheduleId: q.linkedScheduleId,
  linkedScheduleDate: q.linkedScheduleDate,
  linkedSchedules: q.linkedSchedules,
});

const mapSection = (s: RawSectionDto): FormSection => ({
  id: s.id ?? -(Date.now()),
  title: s.title ?? '',
  description: s.description,
  orderIndex: s.orderIndex ?? 0,
  defaultNextAction: (s.defaultNextAction ?? undefined) as NextActionType | undefined,
  defaultTargetSectionIndex: s.defaultTargetSectionIndex ?? null,
  questions: s.questions ? s.questions.map(mapQuestion) : [],
});

export const getAvailableForms = async (): Promise<FormTemplate[]> => {
  const response = await api.get<ApiResponseForm<AvailableFormResponse[]>>('/api/forms/templates/available');
  return response.data.data.map(dto => ({
    id: dto.templateId,
    title: dto.title,
    description: dto.description,
    category: dto.category,
    type: dto.category === 'CELL_REPORT' ? 'GROUP' : 'PERSONAL', // Derived
    isActive: dto.isActive,
    startDate: dto.startDate,
    endDate: dto.endDate,
    questions: [], // Summary view doesn't need full questions
    // Additional fields for UI
    lastSubmitDate: dto.lastSubmitDate,
    submitted: dto.submitted
  } as FormTemplate & { lastSubmitDate?: string, submitted?: boolean }));
};

export const getMySubmissions = async (): Promise<MySubmissionResponse[]> => {
  const response = await api.get<ApiResponseForm<MySubmissionResponse[]>>('/api/forms/submissions/my');
  return response.data.data;
};

export const getFormTemplates = async (): Promise<FormTemplate[]> => {
  const response = await api.get<ApiResponseForm<AvailableFormResponseDto[]>>('/api/admin/forms/templates');
  return response.data.data.map(dto => ({
    id: dto.templateId,
    title: dto.title,
    description: dto.description,
    category: dto.category as FormCategory,
    type: 'GROUP' as FormType, // Default or derived? Backend should provide. Assuming GROUP for now or derived from category.
                   // Actually category CELL_REPORT implies GROUP.
    isActive: true, // Backend AvailableFormResponseDto doesn't strictly imply isActive management status for admin list, 
                    // but usually this list is for management. 
                    // Wait, the Controller says getAllTemplates for ADMIN.
                    // AdminFormDetailResponseDto might be different.
                    // But here we are calling /api/admin/forms/templates.
    questions: [], // Summary list doesn't have questions
    startDate: dto.startDate,
    endDate: dto.endDate
  } as FormTemplate));
};

export const getTemplateDetail = async (id: number): Promise<FormTemplate> => {
  const response = await api.get<ApiResponseForm<RawFormDetailDto>>(`/api/forms/templates/${id}`);
  const data = response.data.data;
  
  return {
    id: (data.templateId || data.id)!,
    title: data.title,
    description: data.description,
    category: data.category as FormCategory,
    type: (data.type || (data.category === 'CELL_REPORT' ? 'GROUP' : 'PERSONAL')) as FormType,
    isActive: data.isActive!,
    targetClubId: data.targetClubId,
    questions: data.questions ? data.questions.map(mapQuestion) : [],
    sections: data.sections ? data.sections.map(mapSection) : [],
    startDate: data.startDate,
    endDate: data.endDate
  };
};

export const getFormTemplate = async (id: number): Promise<FormTemplate> => {
  const response = await api.get<ApiResponseForm<RawFormDetailDto>>(`/api/admin/forms/templates/${id}`);
  const data = response.data.data;
  
  return {
    id: (data.templateId || data.id)!,
    title: data.title,
    description: data.description,
    category: data.category as FormCategory,
    type: (data.type || (data.category === 'CELL_REPORT' ? 'GROUP' : 'PERSONAL')) as FormType,
    isActive: (data.isActive ?? data.active)!, // Handle both isActive and active
    targetClubId: data.targetClubId,
    questions: data.questions ? data.questions.map(mapQuestion) : [],
    sections: data.sections ? data.sections.map(mapSection) : [],
    startDate: data.startDate,
    endDate: data.endDate,
    accessList: data.accessList ? data.accessList.map((a, index) => ({
      id: Date.now() + index, 
      accessType: a.accessType as AccessType,
      targetType: a.targetType as TargetType,
      targetValue: a.targetValue
    })) : []
  };
};

export const getTemplateByClubId = async (clubId: number): Promise<FormTemplate | null> => {
  try {
    const response = await api.get<ApiResponseForm<RawFormDetailDto>>(`/api/forms/templates/club/${clubId}`);
    if (!response.data.data) return null;
    
    const data = response.data.data;
    return {
      id: (data.templateId || data.id)!,
      title: data.title,
      description: data.description,
      category: data.category as FormCategory,
      type: (data.type || (data.category === 'CELL_REPORT' ? 'GROUP' : 'PERSONAL')) as FormType,
      isActive: (data.isActive ?? data.active)!,
      targetClubId: data.targetClubId,
      questions: data.questions ? data.questions.map(mapQuestion) : [],
      sections: data.sections ? data.sections.map(mapSection) : [],
      startDate: data.startDate,
      endDate: data.endDate,
      accessList: data.accessList ? data.accessList.map((a, index) => ({
        id: Date.now() + index, 
        accessType: a.accessType as AccessType,
        targetType: a.targetType as TargetType,
        targetValue: a.targetValue
      })) : []
    };
  } catch {
    return null;
  }
};

export const getClubSubmissions = async (clubId: number): Promise<ClubSubmissionResponseDto[]> => {
  const response = await api.get<ApiResponseForm<ClubSubmissionResponseDto[]>>(`/api/clubs/${clubId}/submissions`);
  return response.data.data;
};

export const getFormSubmissions = async (templateId: number): Promise<FormSubmission[]> => {
  const response = await api.get<ApiResponseForm<AdminSubmissionSummaryDto[]>>(`/api/admin/forms/templates/${templateId}/submissions`);
  return response.data.data.map(dto => ({
    id: dto.id,
    templateId,
    submitterName: dto.submitterName,
    submitDate: dto.submitTime.split('T')[0],
    targetSundayDate: dto.targetSundayDate,
    status: dto.status,
    answers: [] // Summary doesn't have answers
  }));
};

export const getFormSubmission = async (submissionId: number): Promise<FormSubmission> => {
  const response = await api.get<ApiResponseForm<SubmissionDetailResponseDto>>(`/api/admin/forms/submissions/${submissionId}`);
  const data = response.data.data;
  
  // Flatten answers
  const answers: FormAnswer[] = [];
  data.items.forEach(item => {
    item.answers.forEach(ans => {
      answers.push({
        questionId: item.questionId,
        questionLabel: item.label,
        targetMemberName: ans.memberName || undefined,
        value: ans.value
      });
    });
  });

  return {
    id: data.submissionId,
    templateId: 0, // Not available in detail response
    submitterName: data.submitterName || 'Unknown',
    submitDate: data.submitDate,
    targetSundayDate: data.targetSundayDate,
    status: data.status || 'PENDING',
    answers
  };
};

export const createFormTemplate = async (template: Partial<FormTemplate>): Promise<FormTemplate> => {
  const response = await api.post<ApiResponseForm<FormTemplate>>('/api/forms/templates', template);
  return response.data.data;
};

export const updateFormTemplate = async (id: number, template: Partial<FormTemplate>): Promise<FormTemplate> => {
  const response = await api.put<ApiResponseForm<FormTemplate>>(`/api/admin/forms/templates/${id}`, template);
  return response.data.data;
};

export const updateTemplateStatus = async (id: number, isActive: boolean): Promise<void> => {
  await api.patch<ApiResponseForm<void>>(`/api/admin/forms/templates/${id}/status`, { isActive });
};

export const deleteFormTemplate = async (id: number): Promise<void> => {
  await api.delete<ApiResponseForm<void>>(`/api/admin/forms/templates/${id}`);
};

export const submitForm = async (data: SubmissionRequest): Promise<void> => {
  await api.post<ApiResponseForm<void>>('/api/forms/submissions', data);
};

export const approveSubmission = async (id: number): Promise<void> => {
  await api.patch<ApiResponseForm<void>>(`/api/forms/submissions/${id}/approve`);
};

export const rejectSubmission = async (id: number): Promise<void> => {
  await api.patch<ApiResponseForm<void>>(`/api/forms/submissions/${id}/reject`);
};
