import { useState, useEffect } from 'react';
import type { FormTemplate, FormQuestion, FormCategory, FormType, QuestionType, WorshipCategory, FormAccess, AccessType, TargetType, FormSection, NextActionType, AttendanceSyncType } from '../../types/form';
import type { Schedule } from '../../types/schedule';
import { scheduleService } from '../../services/scheduleService';
import { Plus, Trash2, Check, ChevronUp, ChevronDown, X, Eye, Layers, Calendar } from 'lucide-react';
import { DynamicFormRenderer } from './DynamicFormRenderer';

const ScheduleManager = ({ 
  selectedSchedules,
  onChange
}: { 
  selectedSchedules: {id: number, title: string, startDate: string, questionId?: number}[];
  onChange: (schedules: {id: number, title: string, startDate: string, questionId?: number}[]) => void;
}) => {
  const [searchDate, setSearchDate] = useState('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!searchDate) return;
      
      setLoading(true);
      try {
        const date = new Date(searchDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        const result = await scheduleService.getSchedules(year, month);
        const dailySchedules = result.filter(s => s.startDate.startsWith(searchDate));
        setSchedules(dailySchedules);
      } catch (error) {
        console.error('Failed to fetch schedules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [searchDate]);

  const handleSelect = (scheduleId: string) => {
    const schedule = schedules.find(s => s.scheduleId === Number(scheduleId));
    if (!schedule) return;
    
    // Prevent duplicates
    if (selectedSchedules.some(s => s.id === schedule.scheduleId)) {
      alert('이미 선택된 일정입니다.');
      return;
    }

    const newSchedules = [...selectedSchedules, {
      id: schedule.scheduleId,
      title: schedule.title,
      startDate: schedule.startDate
    }];
    
    onChange(newSchedules);
    
    // Reset search
    setSearchDate(''); 
    setSchedules([]);
  };

  const handleRemove = (id: number) => {
    const newSchedules = selectedSchedules.filter(s => s.id !== id);
    onChange(newSchedules);
  };

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 text-xs font-semibold text-slate-500 flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        일정 관리 (여러 일정 선택 시 자동으로 질문이 생성됩니다)
      </div>
      
      {/* Selected Schedules List */}
      {selectedSchedules.length > 0 && (
        <div className="mb-3 space-y-2">
          {selectedSchedules.map(schedule => (
            <div key={schedule.id} className="flex items-center justify-between rounded border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              <span className="font-medium">
                [{schedule.startDate.slice(5, 10)}] {schedule.title}
              </span>
              <button 
                onClick={() => handleRemove(schedule.id)}
                className="ml-2 rounded-full p-1 hover:bg-blue-100 text-blue-400 hover:text-rose-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Select Schedule */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        />
        <select
          value=""
          onChange={(e) => handleSelect(e.target.value)}
          disabled={!searchDate || loading || schedules.length === 0}
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100"
        >
          <option value="">
            {loading ? '로딩 중...' : schedules.length === 0 ? (searchDate ? '일정 없음' : '날짜를 선택하세요') : '일정 선택...'}
          </option>
          {schedules.map(s => (
            <option key={s.scheduleId} value={s.scheduleId}>
              [{s.startDate.slice(11, 16)}] {s.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

interface FormBuilderProps {
  initialTemplate?: FormTemplate;
  initialTitle?: string;
  initialCategory?: FormCategory;
  initialFormType?: FormType;
  initialTargetClubId?: number | string;
  onSave: (templateData: Partial<FormTemplate>) => Promise<void>;
  onCancel: () => void;
  isModal?: boolean;
  customTitle?: string;
  initialAccessList?: FormAccess[];
  hideAccessControl?: boolean;
  excludedQuestionTypes?: QuestionType[];
  hideBasicInfo?: boolean;
}

export const FormBuilder = ({
  initialTemplate,
  initialTitle,
  initialCategory,
  initialFormType,
  initialTargetClubId,
  onSave,
  onCancel,
  isModal = false,
  customTitle,
  initialAccessList,
  hideAccessControl = false,
  excludedQuestionTypes = [],
  hideBasicInfo = false
}: FormBuilderProps) => {

  const [title, setTitle] = useState(initialTemplate?.title || initialTitle || '');
  const [description, setDescription] = useState(initialTemplate?.description || '');
  const [category, setCategory] = useState<FormCategory>(initialTemplate?.category || initialCategory || 'CELL_REPORT');
  const [formType, setFormType] = useState<FormType>(initialTemplate?.type || initialFormType || 'GROUP');
  const [targetClubId] = useState<string>(initialTemplate?.targetClubId?.toString() || initialTargetClubId?.toString() || '');
  const [startDate, setStartDate] = useState(initialTemplate?.startDate ? initialTemplate.startDate.slice(0, 16) : '');
  const [endDate, setEndDate] = useState(initialTemplate?.endDate ? initialTemplate.endDate.slice(0, 16) : '');
  const [isActive, setIsActive] = useState(initialTemplate?.isActive ?? true);
  
  // Helper to parse JSON fields from backend and Group Schedule Questions
  const processQuestions = (questions: FormQuestion[]): FormQuestion[] => {
    const processed: FormQuestion[] = [];
    let currentScheduleGroup: FormQuestion | null = null;

    // Sort questions by orderIndex
    const sortedQuestions = [...questions].sort((a, b) => a.orderIndex - b.orderIndex);

    for (const q of sortedQuestions) {
      const updated = { ...q };
      
      // Parse optionsJson if options is missing
      if (updated.optionsJson && (!updated.options || updated.options.length === 0)) {
        try {
          const parsed = JSON.parse(updated.optionsJson);
          updated.options = Array.isArray(parsed) 
            ? parsed.map((o: unknown) => typeof o === 'string' ? o : (o as { label: string }).label) 
            : [];
        } catch (e) {
          console.error('Failed to parse optionsJson', e);
        }
      }

      // Restore UI types from Backend types (BOOLEAN + POST_CONFIRMATION -> WORSHIP/SCHEDULE)
      if (updated.inputType === 'BOOLEAN') {
        if (updated.syncType === 'POST_CONFIRMATION' && updated.linkedWorshipCategory) {
          updated.inputType = 'WORSHIP_ATTENDANCE';
        } else if (updated.syncType === 'PRE_REGISTRATION' && updated.linkedScheduleId) {
          updated.inputType = 'SCHEDULE_ATTENDANCE';
        }
      }

      // Grouping Logic for SCHEDULE_ATTENDANCE
      if (updated.inputType === 'SCHEDULE_ATTENDANCE' && updated.linkedScheduleId) {
        if (currentScheduleGroup) {
          // Add to existing group
          if (!currentScheduleGroup.linkedSchedules) currentScheduleGroup.linkedSchedules = [];
          
          currentScheduleGroup.linkedSchedules.push({
            id: updated.linkedScheduleId,
            title: updated.label, // Assume label is the schedule title
            startDate: updated.linkedScheduleDate || '',
            questionId: updated.id // Preserve original question ID
          });
          
          // Don't push this question to processed list, it's merged into the group
          continue;
        } else {
          // Start new group
          currentScheduleGroup = {
            ...updated,
            label: updated.label, // Use the first question's label as group label (or maybe generic?)
            linkedSchedules: [{
              id: updated.linkedScheduleId,
              title: updated.label,
              startDate: updated.linkedScheduleDate || '',
              questionId: updated.id
            }]
          };
          processed.push(currentScheduleGroup);
        }
      } else {
        // Not a schedule question, or end of group
        currentScheduleGroup = null;
        processed.push(updated);
      }
    }
    
    return processed;
  };

  // 섹션 및 질문 상태 관리
  const [sections, setSections] = useState<FormSection[]>(() => {
    if (initialTemplate?.sections && initialTemplate.sections.length > 0) {
      return initialTemplate.sections.map((s, index) => ({
        ...s,
        id: s.id || (Date.now() + index),
        questions: processQuestions(s.questions)
      }));
    }
    return [{
      id: Date.now(),
      title: '기본 섹션',
      description: '',
      orderIndex: 0,
      defaultNextAction: 'CONTINUE' as NextActionType,
      questions: initialTemplate?.questions ? processQuestions(initialTemplate.questions) : []
    }];
  });
  const [accessList, setAccessList] = useState<FormAccess[]>(initialTemplate?.accessList || initialAccessList || []);

  const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(true);
  const [isAccessInfoOpen, setIsAccessInfoOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Access Form State
  const [newAccessType, setNewAccessType] = useState<AccessType>('RESPONDENT');
  const [newTargetType, setNewTargetType] = useState<TargetType>('ALL');
  const [newTargetValue, setNewTargetValue] = useState('');

  const addAccessRule = () => {
    const newRule: FormAccess = {
      id: Date.now(),
      accessType: newAccessType,
      targetType: newTargetType,
      targetValue: newTargetValue
    };
    setAccessList([...accessList, newRule]);
    setNewTargetValue('');
  };

  const removeAccessRule = (id?: number) => {
    if (id === undefined) return;
    setAccessList(accessList.filter(a => a.id !== id));
  };

  const addSection = () => {
    const newSection: FormSection = {
      id: Date.now(),
      title: `섹션 ${sections.length + 1}`,
      description: '',
      orderIndex: sections.length,
      questions: []
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (sectionId: number) => {
    if (sections.length <= 1) {
      alert('최소 1개의 섹션이 필요합니다.');
      return;
    }
    if (confirm('섹션을 삭제하시겠습니까? 포함된 질문도 모두 삭제됩니다.')) {
      setSections(sections.filter(s => s.id !== sectionId));
    }
  };

  const updateSection = (sectionId: number, updates: Partial<FormSection>) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, ...updates } : s));
  };

  const addQuestion = (sectionId: number) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const newId = Date.now();
    const newQuestion: FormQuestion = {
      id: newId,
      label: '',
      inputType: 'SHORT_TEXT',
      required: false,
      orderIndex: section.questions.length + 1,
      memberSpecific: formType === 'GROUP', // Default to true for Group forms
      linkedSchedules: [] // Initialize for schedule questions
    };

    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, questions: [...s.questions, newQuestion] };
      }
      return s;
    }));
  };

  const updateQuestion = (sectionId: number, questionId: number, updates: Partial<FormQuestion>) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          questions: s.questions.map(q => {
            if (q.id === questionId) {
              const updatedQ = { ...q, ...updates };
              
              // Reset special fields when switching types
              if (updates.inputType && updates.inputType !== 'SCHEDULE_ATTENDANCE') {
                updatedQ.linkedSchedules = [];
                updatedQ.linkedScheduleId = undefined;
                updatedQ.linkedScheduleDate = undefined;
              }
              
              // Reset special fields when switching away from WORSHIP_ATTENDANCE
              if (updates.inputType && updates.inputType !== 'WORSHIP_ATTENDANCE') {
                updatedQ.linkedWorshipCategory = undefined;
              }

              // Special handling for MemberSpecific
              if (updates.memberSpecific === false) {
                 if (updatedQ.inputType === 'WORSHIP_ATTENDANCE') {
                   updatedQ.inputType = 'SHORT_TEXT';
                 }
              }
              
              return updatedQ;
            }
            return q;
          })
        };
      }
      return s;
    }));
  };

  const removeQuestion = (sectionId: number, questionId: number) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, questions: s.questions.filter(q => q.id !== questionId) };
      }
      return s;
    }));
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    setSections(newSections);
  };

  const moveSectionDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    setSections(newSections);
  };

  const moveQuestionUp = (sectionId: number, index: number) => {
    if (index === 0) return;
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const newQuestions = [...s.questions];
        [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
        return { ...s, questions: newQuestions };
      }
      return s;
    }));
  };

  const moveQuestionDown = (sectionId: number, index: number) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section || index === section.questions.length - 1) return;
    
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const newQuestions = [...s.questions];
        [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
        return { ...s, questions: newQuestions };
      }
      return s;
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as FormCategory;
    setCategory(newCategory);

    // Automatically add ROLE_LEADER permission for CELL_REPORT
    if (newCategory === 'CELL_REPORT') {
      const hasLeaderPerm = accessList.some(
        a => a.accessType === 'RESPONDENT' && a.targetType === 'ROLE' && a.targetValue === 'ROLE_LEADER'
      );

      if (!hasLeaderPerm) {
        const newRule: FormAccess = {
          id: Date.now(),
          accessType: 'RESPONDENT',
          targetType: 'ROLE',
          targetValue: 'ROLE_LEADER'
        };
        setAccessList(prev => [...prev, newRule]);
      }
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('양식 제목을 입력해주세요.');
      return;
    }
    
    // Transform questions for saving: Split multi-schedule questions into individual questions
    const processedSections = sections.map(section => ({
      ...section,
      questions: section.questions.flatMap(q => {
        // If it's a schedule attendance question with multiple linked schedules
        if (q.inputType === 'SCHEDULE_ATTENDANCE' && q.linkedSchedules && q.linkedSchedules.length > 0) {
          return q.linkedSchedules.map((schedule) => ({
            ...q,
            // Use original ID if available (for updates), otherwise 0 for new
            id: schedule.questionId || 0, 
            label: schedule.title, // Set label to schedule title
            linkedScheduleId: schedule.id,
            linkedScheduleDate: schedule.startDate,
            // Remove frontend-only field
            linkedSchedules: undefined,
            // Map to Backend Types
            inputType: 'BOOLEAN' as QuestionType,
            syncType: 'PRE_REGISTRATION' as AttendanceSyncType
          }));
        }

        // Single Schedule Attendance
        if (q.inputType === 'SCHEDULE_ATTENDANCE') {
          return [{
            ...q,
            inputType: 'BOOLEAN' as QuestionType,
            syncType: 'PRE_REGISTRATION' as AttendanceSyncType
          }];
        }

        // Worship Attendance
        if (q.inputType === 'WORSHIP_ATTENDANCE') {
          return [{
            ...q,
            inputType: 'BOOLEAN' as QuestionType,
            syncType: 'POST_CONFIRMATION' as AttendanceSyncType
          }];
        }

        return [q];
      })
    }));

    // Flatten for legacy support check
    const allQuestions = processedSections.flatMap(s => s.questions);
    
    if (allQuestions.length === 0) {
      alert('최소 1개 이상의 질문을 추가해주세요.');
      return;
    }

    const newTemplate: Partial<FormTemplate> = {
      title,
      description,
      category,
      type: formType,
      targetClubId: targetClubId ? Number(targetClubId) : undefined,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      isActive,
      questions: allQuestions, // Legacy support
      sections: processedSections, // New structure
      accessList,
    };

    await onSave(newTemplate);
  };

  return (
    <div className={`flex flex-col h-full bg-slate-50 ${isModal ? '' : 'min-h-screen'}`}>
      {/* Header Area - Sticky/Fixed */}
      <div className={`flex-none bg-slate-50 z-10 ${isModal ? 'border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4' : 'px-4 py-6 sm:px-6 sm:py-10'}`}>
        <div className={`mx-auto w-full ${isModal ? '' : 'max-w-4xl'}`}>
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{customTitle || '양식 생성기 (Form Builder)'}</h1>
              {!customTitle && <p className="mt-1 text-xs sm:text-sm text-slate-500">새로운 보고서 양식이나 신청서를 생성합니다.</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                <Eye className="h-4 w-4" />
                미리보기
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Check className="h-4 w-4" />
                저장하기
              </button>
              <div className="ml-1 pl-1 sm:ml-2 sm:pl-2 sm:border-l border-slate-200">
                <button
                  onClick={onCancel}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  aria-label="닫기"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>
          </header>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className={`flex-1 overflow-y-auto ${isModal ? 'p-4 sm:p-6' : 'px-4 pb-10 sm:px-6'}`}>
        <div className={`mx-auto w-full space-y-6 ${isModal ? 'max-w-4xl' : 'max-w-4xl'}`}>
        
        {/* Basic Info */}
        {!hideBasicInfo && (
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setIsBasicInfoOpen(!isBasicInfoOpen)}
              className="flex w-full items-center justify-between bg-slate-50 px-6 py-4 text-left"
            >
              <h2 className="text-lg font-semibold text-slate-900">기본 정보</h2>
              {isBasicInfoOpen ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
            </button>
            
            {isBasicInfoOpen && (
              <div className="grid gap-6 border-t border-slate-200 p-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    양식 제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="예: 2024년 여름 수련회 신청서"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    설명
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="양식에 대한 설명을 입력하세요"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    카테고리
                  </label>
                  <select
                    value={category}
                    onChange={handleCategoryChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="CELL_REPORT">셀 보고서</option>
                    <option value="EVENT_APPLICATION">행사 신청서</option>
                    <option value="CLUB_APPLICATION">팀/동아리 가입 신청서</option>
                    <option value="SURVEY">설문조사</option>
                    <option value="ETC">기타</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    대상 유형 (Form Type)
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as FormType)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="PERSONAL">개인 (Personal)</option>
                    <option value="GROUP">그룹 (Group)</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    시작 일시
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    종료 일시
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2 md:col-span-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-900">
                    활성화 (체크 해제 시 사용자에게 노출되지 않음)
                  </label>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Access Control */}
        {!hideAccessControl && (
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setIsAccessInfoOpen(!isAccessInfoOpen)}
              className="flex w-full items-center justify-between bg-slate-50 px-6 py-4 text-left"
            >
              <h2 className="text-lg font-semibold text-slate-900">권한 설정 (Access Control)</h2>
              {isAccessInfoOpen ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
            </button>
            
            {isAccessInfoOpen && (
              <div className="border-t border-slate-200 p-6">
                <div className="mb-4 flex items-end gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">접근 유형</label>
                    <select
                      value={newAccessType}
                      onChange={(e) => setNewAccessType(e.target.value as AccessType)}
                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                    >
                      <option value="RESPONDENT">응답자 (제출 가능)</option>
                      <option value="MANAGER">관리자 (수정/조회)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">대상 유형</label>
                    <select
                      value={newTargetType}
                      onChange={(e) => setNewTargetType(e.target.value as TargetType)}
                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                    >
                      <option value="ALL">전체 (누구나)</option>
                      <option value="ROLE">특정 역할 (Role)</option>
                      <option value="USER">특정 사용자 (ID)</option>
                      <option value="CLUB">특정 클럽 (ID)</option>
                    </select>
                  </div>
                  {(newTargetType !== 'ALL' && newTargetType !== 'GUEST') && (
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-slate-500">값 (Role, ID 등)</label>
                      {newTargetType === 'ROLE' ? (
                        <select
                          value={newTargetValue}
                          onChange={(e) => setNewTargetValue(e.target.value)}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        >
                          <option value="">선택하세요</option>
                          <option value="ROLE_ADMIN">관리자 (ROLE_ADMIN)</option>
                          <option value="ROLE_MANAGER">운영진 (ROLE_MANAGER)</option>
                          <option value="ROLE_LEADER">순장/리더 (ROLE_LEADER)</option>
                          <option value="ROLE_MEMBER">일반 성도 (ROLE_MEMBER)</option>
                          <option value="ROLE_NEWCOMER">새가족 (ROLE_NEWCOMER)</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={newTargetValue}
                          onChange={(e) => setNewTargetValue(e.target.value)}
                          placeholder={newTargetType === 'USER' ? 'User ID (숫자) 입력' : 'Club ID (숫자) 입력'}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                      )}
                    </div>
                  )}
                  <button
                    onClick={addAccessRule}
                    className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    추가
                  </button>
                </div>

                <div className="space-y-2">
                  {accessList.map((access) => (
                    <div key={access.id} className="flex items-center justify-between rounded bg-slate-50 px-3 py-2 text-sm">
                      <div className="flex gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${access.accessType === 'MANAGER' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                          {access.accessType}
                        </span>
                        <span className="font-semibold text-slate-700">{access.targetType}</span>
                        {access.targetValue && <span className="text-slate-600">: {access.targetValue}</span>}
                      </div>
                      <button onClick={() => removeAccessRule(access.id)} className="text-slate-400 hover:text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {accessList.length === 0 && (
                    <p className="text-sm text-slate-500">설정된 권한이 없습니다. (기본: 누구나 접근 불가할 수 있음)</p>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Questions Editor */}
        <div className="space-y-4">
          {sections.map((section, sIdx) => (
            <section key={section.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                    className="w-full bg-transparent text-lg font-bold text-slate-900 focus:outline-none"
                    placeholder="섹션 제목"
                  />
                  <input
                    type="text"
                    value={section.description || ''}
                    onChange={(e) => updateSection(section.id, { description: e.target.value })}
                    className="mt-1 w-full bg-transparent text-sm text-slate-500 focus:outline-none"
                    placeholder="섹션 설명 (선택)"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => moveSectionUp(sIdx)} disabled={sIdx === 0} className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors">
                    <ChevronUp className="h-6 w-6" />
                  </button>
                  <button onClick={() => moveSectionDown(sIdx)} disabled={sIdx === sections.length - 1} className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors">
                    <ChevronDown className="h-6 w-6" />
                  </button>
                  <button onClick={() => removeSection(section.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                    <Trash2 className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {section.questions.map((q, qIdx) => (
                  <div key={q.id} className="relative rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md">
                    {/* Handle & Actions */}
                    <div className="absolute right-4 top-4 flex items-center gap-2">
                      <div className="flex flex-col">
                        <button onClick={() => moveQuestionUp(section.id, qIdx)} disabled={qIdx === 0} className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors">
                          <ChevronUp className="h-5 w-5" />
                        </button>
                        <button onClick={() => moveQuestionDown(section.id, qIdx)} disabled={qIdx === section.questions.length - 1} className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors">
                          <ChevronDown className="h-5 w-5" />
                        </button>
                      </div>
                      <button onClick={() => removeQuestion(section.id, q.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mr-10 grid gap-4 md:grid-cols-12">
                      {/* Question Basic Info */}
                      <div className="md:col-span-8 space-y-3">
                        <input
                          type="text"
                          value={q.label}
                          onChange={(e) => updateQuestion(section.id, q.id, { label: e.target.value })}
                          placeholder="질문 제목을 입력하세요"
                          className="w-full rounded border border-slate-300 px-3 py-2 font-medium focus:border-blue-500 focus:outline-none"
                        />
                        
                        <div className="flex gap-4">
                          <select
                            value={q.inputType}
                            onChange={(e) => updateQuestion(section.id, q.id, { inputType: e.target.value as QuestionType })}
                            className="rounded border border-slate-300 px-2 py-1 text-sm"
                          >
                            {!excludedQuestionTypes.includes('SHORT_TEXT') && <option value="SHORT_TEXT">단답형</option>}
                            {!excludedQuestionTypes.includes('LONG_TEXT') && <option value="LONG_TEXT">서술형</option>}
                            {!excludedQuestionTypes.includes('NUMBER') && <option value="NUMBER">숫자</option>}
                            {!excludedQuestionTypes.includes('BOOLEAN') && <option value="BOOLEAN">참/거짓 (스위치)</option>}
                            {!excludedQuestionTypes.includes('SINGLE_CHOICE') && <option value="SINGLE_CHOICE">객관식 (단일 선택)</option>}
                            {!excludedQuestionTypes.includes('MULTIPLE_CHOICE') && <option value="MULTIPLE_CHOICE">객관식 (다중 선택)</option>}
                            {!excludedQuestionTypes.includes('SCHEDULE_ATTENDANCE') && <option value="SCHEDULE_ATTENDANCE">일정 참석 여부</option>}
                            {/* Special Types only available if member specific */}
                            {q.memberSpecific && (
                              <>
                                {!excludedQuestionTypes.includes('WORSHIP_ATTENDANCE') && <option value="WORSHIP_ATTENDANCE">예배 출석 여부</option>}
                              </>
                            )}
                          </select>
                          
                          <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={(e) => updateQuestion(section.id, q.id, { required: e.target.checked })}
                              className="rounded border-slate-300"
                            />
                            필수
                          </label>

                          {formType === 'GROUP' && (
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                              <input
                                type="checkbox"
                                checked={q.memberSpecific}
                                onChange={(e) => updateQuestion(section.id, q.id, { memberSpecific: e.target.checked })}
                                className="rounded border-slate-300"
                              />
                              순원 개인 질문
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Type Specific Options */}
                      <div className="md:col-span-12 rounded bg-slate-50 p-3">
                        {q.inputType === 'SCHEDULE_ATTENDANCE' ? (
                          <ScheduleManager
                            selectedSchedules={q.linkedSchedules || []}
                            onChange={(schedules) => updateQuestion(section.id, q.id, { linkedSchedules: schedules })}
                          />
                        ) : q.inputType === 'WORSHIP_ATTENDANCE' ? (
                          <div className="flex gap-4 items-center">
                            <label className="text-sm font-medium text-slate-700">연동 예배:</label>
                            <select
                              value={q.linkedWorshipCategory || 'SUNDAY_SERVICE_1'}
                              onChange={(e) => updateQuestion(section.id, q.id, { linkedWorshipCategory: e.target.value as WorshipCategory })}
                              className="rounded border border-slate-300 px-2 py-1 text-sm"
                            >
                              <option value="SUNDAY_SERVICE_1">주일예배 1부</option>
                              <option value="SUNDAY_SERVICE_2">주일예배 2부</option>
                              <option value="SUNDAY_SERVICE_3">주일예배 3부</option>
                              <option value="WEDNESDAY_SERVICE_1">수요예배 1부</option>
                              <option value="WEDNESDAY_SERVICE_2">수요예배 2부</option>
                              <option value="FRIDAY_PRAYER">금요기도회</option>
                              <option value="DAWN_PRAYER">새벽기도회</option>
                              <option value="YOUTH_SERVICE">청년부 예배</option>
                              <option value="ETC">기타</option>
                            </select>
                            <p className="text-xs text-slate-500">
                              * 선택 시 해당 예배 출석 데이터와 자동 연동됩니다.
                            </p>
                          </div>
                        ) : (q.inputType === 'SINGLE_CHOICE' || q.inputType === 'MULTIPLE_CHOICE') ? (
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-500">선택지 (엔터로 구분)</label>
                            <textarea
                              value={q.options?.join('\n') || ''}
                              onChange={(e) => updateQuestion(section.id, q.id, { options: e.target.value.split('\n') })}
                              className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                              rows={3}
                              placeholder="옵션 1&#13;&#10;옵션 2&#13;&#10;옵션 3"
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">추가 설정이 없는 타입입니다.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => addQuestion(section.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  질문 추가하기
                </button>
              </div>
            </section>
          ))}

          <button
            onClick={addSection}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <Layers className="h-5 w-5 text-slate-400" />
            <span className="font-semibold text-slate-700">새 섹션 추가</span>
          </button>
        </div>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 hover:bg-slate-100"
            >
              <X className="h-6 w-6 text-slate-500" />
            </button>
            
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">{title || '(제목 없음)'}</h2>
              <p className="mt-1 text-slate-500">{description}</p>
              <div className="mt-4 flex gap-2 text-xs text-slate-400">
                <span>{category}</span>
                <span>•</span>
                <span>{formType}</span>
              </div>
            </div>

            <div className="space-y-8">
              <DynamicFormRenderer 
                template={{
                  id: 0,
                  title,
                  description,
                  category,
                  type: formType,
                  targetClubId: targetClubId ? Number(targetClubId) : undefined,
                  startDate,
                  endDate,
                  isActive,
                  questions: [],
                  sections: sections
                }}
                answers={{}}
                onChange={() => {}}
                readOnly={true}
              />
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
