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
  templateId: number;
  formTitle: string;
  submitDate: string;
  submitTime: string;
  targetSundayDate?: string;
  status: SubmissionStatus;
  submitterName: string;
  targetCellName?: string;
  targetCellId?: number;
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
  selectableDates?: string[];
  statusMessage?: string;
}

export interface MySubmissionResponse {
  submissionId: number;
  templateId: number;
  templateTitle: string;
  submitterName: string;
  submitTime: string;
  targetSundayDate?: string;
  targetCellName?: string;
  status: SubmissionStatus;
  category: FormCategory;
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
    submitted: dto.submitted,
    selectableDates: dto.selectableDates,
    statusMessage: dto.statusMessage
  } as FormTemplate & { 
    lastSubmitDate?: string, 
    submitted?: boolean, 
    selectableDates?: string[], 
    statusMessage?: string 
  }));
};

export const getMySubmissions = async (): Promise<MySubmissionResponse[]> => {
  const response = await api.get<ApiResponseForm<MySubmissionResponse[]>>('/api/forms/submissions/my');
  return response.data.data.map(dto => ({
    submissionId: dto.submissionId,
    templateId: dto.templateId,
    templateTitle: dto.templateTitle,
    submitterName: dto.submitterName || 'Unknown',
    submitTime: dto.submitTime,
    targetSundayDate: dto.targetSundayDate,
    targetCellName: dto.targetCellName,
    targetCellId: dto.targetCellId,
    status: dto.status || 'PENDING',
    category: dto.category
  }));
};

export const getLastSubmission = async (templateId: number, date?: string, cellId?: number): Promise<FormSubmission | null> => {
  try {
    const params = new URLSearchParams({ templateId: templateId.toString() });
    if (date) params.append('date', date);
    if (cellId) params.append('cellId', cellId.toString());
    const response = await api.get<ApiResponseForm<SubmissionDetailResponseDto>>(`/api/forms/submissions/last?${params.toString()}`);
    const data = response.data.data;
    
    if (!data) return null;

    // Flatten answers to match FormSubmission type
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
      templateId: templateId,
      submitterName: data.submitterName || 'Unknown',
      submitDate: data.submitDate,
      submitTime: data.submitTime,
      targetSundayDate: data.targetSundayDate,
      targetCellName: data.targetCellName,
      targetCellId: data.targetCellId,
      status: data.status || 'PENDING',
      answers
    };
  } catch (error) {
    return null;
  }
};

export const updateSubmission = async (submissionId: number, data: SubmissionRequest): Promise<void> => {
  await api.put(`/api/forms/submissions/${submissionId}`, data);
};

export const getFormTemplates = async (): Promise<FormTemplate[]> => {
  const response = await api.get<ApiResponseForm<AvailableFormResponseDto[]>>('/api/admin/forms/templates');
  return response.data.data.map(dto => ({
    id: dto.templateId,
    title: dto.title,
    description: dto.description,
    category: dto.category as FormCategory,
    type: (dto.category === 'CELL_REPORT' ? 'GROUP' : 'PERSONAL') as FormType,
    isActive: dto.isActive,
    questions: [],
    startDate: dto.startDate,
    endDate: dto.endDate
  } as FormTemplate));
};

export const getTemplateDetail = async (id: number): Promise<FormTemplate> => {
  const response = await api.get<ApiResponseForm<RawFormDetailDto>>(`/api/forms/templates/${id}`);
  const data = response.data.data;
  
  // 섹션에 있는 질문들을 모두 평탄화하여 questions 배열에 추가
  const questions = data.questions ? data.questions.map(mapQuestion) : [];
  if (data.sections) {
    data.sections.forEach(s => {
      if (s.questions) {
        s.questions.forEach(q => {
          if (!questions.find(existing => existing.id === q.id)) {
            questions.push(mapQuestion(q));
          }
        });
      }
    });
  }
  
  return {
    id: (data.templateId || data.id)!,
    title: data.title,
    description: data.description,
    category: data.category as FormCategory,
    type: (data.type || (data.category === 'CELL_REPORT' ? 'GROUP' : 'PERSONAL')) as FormType,
    isActive: (data.isActive ?? data.active)!,
    targetClubId: data.targetClubId,
    questions: questions,
    sections: data.sections ? data.sections.map(mapSection) : [],
    startDate: data.startDate,
    endDate: data.endDate
  };
};

export const getFormTemplate = async (id: number): Promise<FormTemplate> => {
  const response = await api.get<ApiResponseForm<RawFormDetailDto>>(`/api/admin/forms/templates/${id}`);
  const data = response.data.data;
  
  // 섹션에 있는 질문들을 모두 평탄화하여 questions 배열에 추가
  const questions = data.questions ? data.questions.map(mapQuestion) : [];
  if (data.sections) {
    data.sections.forEach(s => {
      if (s.questions) {
        s.questions.forEach(q => {
          if (!questions.find(existing => existing.id === q.id)) {
            questions.push(mapQuestion(q));
          }
        });
      }
    });
  }
  
  return {
    id: (data.templateId || data.id)!,
    title: data.title,
    description: data.description,
    category: data.category as FormCategory,
    type: (data.type || (data.category === 'CELL_REPORT' ? 'GROUP' : 'PERSONAL')) as FormType,
    isActive: (data.isActive ?? data.active)!, // Handle both isActive and active
    targetClubId: data.targetClubId,
    questions: questions,
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
    
    // 섹션에 있는 질문들을 모두 평탄화하여 questions 배열에 추가
    const questions = data.questions ? data.questions.map(mapQuestion) : [];
    if (data.sections) {
      data.sections.forEach(s => {
        if (s.questions) {
          s.questions.forEach(q => {
            if (!questions.find(existing => existing.id === q.id)) {
              questions.push(mapQuestion(q));
            }
          });
        }
      });
    }

    return {
      id: (data.templateId || data.id)!,
      title: data.title,
      description: data.description,
      category: data.category as FormCategory,
      type: (data.type || (data.category === 'CELL_REPORT' ? 'GROUP' : 'PERSONAL')) as FormType,
      isActive: (data.isActive ?? data.active)!,
      targetClubId: data.targetClubId,
      questions: questions,
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
  const response = await api.get<ApiResponseForm<SubmissionDetailResponseDto>>(`/api/forms/submissions/${submissionId}`);
  const dto = response.data.data;
  
  return {
    id: dto.submissionId,
    templateId: dto.templateId,
    submitterName: dto.submitterName || 'Unknown',
    submitDate: dto.submitDate,
    submitTime: dto.submitTime,
    targetSundayDate: dto.targetSundayDate,
    targetCellName: dto.targetCellName,
    targetCellId: dto.targetCellId,
    status: dto.status || 'PENDING',
    answers: dto.items.flatMap(item => {
      if (item.answers.length === 0) {
        return [{
          questionId: item.questionId,
          questionLabel: item.label,
          value: '', // 빈 값으로 표시
          targetMemberName: undefined
        }];
      }
      return item.answers.map(ans => ({
        questionId: item.questionId,
        questionLabel: item.label,
        value: ans.value,
        targetMemberName: ans.memberName || undefined
      }));
    })
  };
};

export const createFormTemplate = async (template: Partial<FormTemplate>): Promise<{ id: number }> => {
  const response = await api.post<ApiResponseForm<number>>('/api/forms/templates', template);
  return { id: response.data.data };
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
