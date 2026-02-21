import { useState, useEffect, forwardRef, useImperativeHandle, useRef, type ForwardedRef } from 'react';
import type { FormTemplate, FormQuestion, FormCategory, FormType, QuestionType, WorshipCategory, FormAccess, TargetType, FormSection, NextActionType, QuestionOption } from '../../types/form';
import type { Schedule } from '../../types/schedule';
import { scheduleService } from '../../services/scheduleService';
import { getMembers } from '../../services/memberService';
import { getClubs } from '../../services/clubService';
import { uploadFiles, getFileUrl } from '../../services/albumService';
import { Plus, Trash2, Check, ChevronUp, ChevronDown, X, Eye, Layers, Calendar, Search, MoreVertical, Circle, Copy, Image as ImageIcon, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useConfirm } from '../../contexts/ConfirmContext';

// Localization Maps
const TARGET_TYPE_MAP: Record<TargetType, string> = {
  ALL: '전체 (누구나)',
  ROLE: '특정 역할',
  USER: '특정 사용자',
  CLUB: '특정 클럽',
  GUEST: '비회원 (게스트)'
};

const ROLE_MAP: Record<string, string> = {
  'CELL_LEADER': '순장',
  'CELL_SUB_LEADER': '부순장',
  'TEAM_LEADER': '팀장',
  'EXECUTIVE': '임원',
  'MEMBER': '일반성도'
};

const TargetSelectionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  type,
  initialSelected
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (selected: {id: string, name: string}[]) => void;
  type: 'USER' | 'CLUB';
  initialSelected: {id: string, name: string}[];
}) => {
  const [keyword, setKeyword] = useState('');
  const [items, setItems] = useState<{id: string, name: string, subText?: string}[]>([]);
  const [selected, setSelected] = useState<{id: string, name: string}[]>(initialSelected);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelected(initialSelected);
      setKeyword('');
      setItems([]);
      setSearched(false);
      
      // For CLUB type, load all initially as they are few
      if (type === 'CLUB') {
        fetchClubs();
      }
    }
  }, [isOpen]);

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const result = await getClubs();
      setItems(result.map(c => ({ id: c.id.toString(), name: c.name })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (type === 'USER' && !keyword.trim()) return;
    
    setLoading(true);
    try {
      if (type === 'USER') {
        const result = await getMembers({ keyword, size: 20 });
        setItems(result.content.map(m => ({ 
          id: m.memberId.toString(), 
          name: m.name, 
          subText: m.memberId?.toString() || 'ID없음' 
        })));
        setSearched(true);
      } else {
        // Local filter for clubs
        const result = await getClubs();
        const filtered = result.filter(c => c.name.includes(keyword));
        setItems(filtered.map(c => ({ id: c.id.toString(), name: c.name })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (item: {id: string, name: string}) => {
    setSelected(prev => {
      const exists = prev.find(p => p.id === item.id);
      if (exists) {
        return prev.filter(p => p.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="font-bold text-slate-900">
            {type === 'USER' ? '사용자 선택' : '클럽 선택'}
          </h3>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-hidden flex flex-col">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={type === 'USER' ? "이름 검색..." : "클럽명 검색..."}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <button 
              type="submit" 
              className="rounded-lg bg-slate-100 px-3 py-2 hover:bg-slate-200"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          <div className="flex-1 overflow-y-auto min-h-[200px] border rounded-lg border-slate-100 p-2">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                {searched ? '검색 결과가 없습니다.' : type === 'USER' ? '검색어를 입력하세요.' : '데이터가 없습니다.'}
              </div>
            ) : (
              <div className="space-y-1">
                {items.map(item => {
                  const isSelected = selected.some(s => s.id === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleSelection(item)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                        isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                          isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <span className="font-medium">{item.name}</span>
                        {item.subText && <span className="text-xs text-slate-400">({item.subText})</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="text-xs text-slate-500 text-right">
            {selected.length}개 선택됨
          </div>
        </div>

        <div className="border-t border-slate-100 px-4 py-3 flex justify-end gap-2 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(selected)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
          >
            선택 완료
          </button>
        </div>
      </div>
    </div>
  );
};

const ScheduleManager = ({ 
  selectedSchedules,
  onChange,
  singleSelection = false
}: { 
  selectedSchedules: {id: number, title: string, startDate: string, questionId?: number}[];
  onChange: (schedules: {id: number, title: string, startDate: string, questionId?: number}[]) => void;
  singleSelection?: boolean;
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

  // Enforce single selection if mode changes
  // Removed auto-cleanup to prevent data loss and allow user choice
  // User can manually remove extra schedules
  /*
  useEffect(() => {
    if (singleSelection && selectedSchedules.length > 1) {
      onChange([selectedSchedules[0]]);
    }
  }, [singleSelection, selectedSchedules.length]); 
  */

  const handleSelect = (scheduleId: string) => {
    const schedule = schedules.find(s => s.scheduleId === Number(scheduleId));
    if (!schedule) return;
    
    // Prevent duplicates
    if (selectedSchedules.some(s => s.id === schedule.scheduleId)) {
      toast.error('이미 선택된 일정입니다.');
      return;
    }

    let newSchedules;
    if (singleSelection) {
      newSchedules = [{
        id: schedule.scheduleId,
        title: schedule.title,
        startDate: schedule.startDate
      }];
    } else {
      newSchedules = [...selectedSchedules, {
        id: schedule.scheduleId,
        title: schedule.title,
        startDate: schedule.startDate
      }];
    }
    
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
        {singleSelection 
          ? (selectedSchedules.length > 1 
              ? <span className="text-rose-500 font-bold">주의: 개인 질문은 하나의 일정만 선택 가능합니다. 불필요한 일정을 삭제해주세요.</span>
              : '일정 선택 (하나의 일정만 선택 가능합니다)')
          : '일정 관리 (여러 일정 선택 시 자동으로 질문이 생성됩니다)'}
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

const DateSettingsModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  setStartDate: (val: string) => void;
  setEndDate: (val: string) => void;
  category: FormCategory;
  setCategory: (val: FormCategory) => void;
  shouldHideCategory: boolean;
  formType: FormType;
  setFormType: (val: FormType) => void;
  lockSettings?: boolean;
}) => {
  const {
    isOpen,
    onClose,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    category,
    setCategory,
    shouldHideCategory,
    formType,
    setFormType,
    lockSettings = false
  } = props;
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900">설문 날짜 설정</h3>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {!shouldHideCategory && (
              <div className="col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  카테고리
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FormCategory)}
                  disabled={lockSettings}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="CELL_REPORT">셀 보고서</option>
                  <option value="EVENT_APPLICATION">행사 신청서</option>
                  <option value="CLUB_APPLICATION">팀/동아리 가입 신청서</option>
                  <option value="SURVEY">설문조사</option>
                  <option value="ETC">기타</option>
                </select>
                {lockSettings && <p className="mt-1 text-xs text-slate-400">* 이 신청서의 카테고리는 변경할 수 없습니다.</p>}
              </div>
            )}
            <div className="col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                설문 대상 타입
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormType('GROUP')}
                  disabled={lockSettings}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    formType === 'GROUP'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  } ${lockSettings && formType !== 'GROUP' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  순/팀 단위 (Group)
                </button>
                <button
                  onClick={() => setFormType('PERSONAL')}
                  disabled={lockSettings}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    formType === 'PERSONAL'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  } ${lockSettings && formType !== 'PERSONAL' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  개인 단위 (Personal)
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {lockSettings 
                  ? "* 이 신청서의 대상 타입은 변경할 수 없습니다."
                  : "* 순 보고서는 '순 단위', 행사 신청 등은 '개인 단위'를 권장합니다."}
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-100">
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
          </div>
        </div>
        
        <div className="border-t border-slate-100 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export interface FormBuilderHandle {
  saveForm: () => Promise<void>;
  openAccessSettings: () => void;
  openDateSettings: () => void;
  openPreview: () => void;
  getTemplateData: () => Partial<FormTemplate>;
}

export interface FormBuilderProps {
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
  hideHeader?: boolean;
  onDataChange?: (data: Partial<FormTemplate>) => void;
  lockSettings?: boolean;
}

export const FormBuilder = forwardRef((props: FormBuilderProps, ref: ForwardedRef<FormBuilderHandle>) => {
  const {
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
    excludedQuestionTypes: _excludedQuestionTypes = [],
    hideBasicInfo = false,
    hideHeader = false,
    onDataChange,
    lockSettings = false
  } = props;

  const [title, setTitle] = useState(initialTemplate?.title || initialTitle || '');
  const [description, setDescription] = useState(initialTemplate?.description || '');
  const [category, setCategory] = useState<FormCategory>(initialTemplate?.category || initialCategory || 'CELL_REPORT');
  const [formType, setFormType] = useState<FormType>(initialTemplate?.type || initialFormType || 'GROUP');
  const [targetClubId] = useState<string>(initialTemplate?.targetClubId?.toString() || initialTargetClubId?.toString() || '');
  const [startDate, setStartDate] = useState(initialTemplate?.startDate ? initialTemplate.startDate.slice(0, 16) : '');
  const [endDate, setEndDate] = useState(initialTemplate?.endDate ? initialTemplate.endDate.slice(0, 16) : '');
  const [isActive, setIsActive] = useState(initialTemplate?.isActive ?? true);
  
  // New State for UI Refactor
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);

  // Category selection should be hidden for CELL_REPORT
  const shouldHideCategory = category === 'CELL_REPORT';

  // Helper to parse JSON fields from backend and Group Schedule Questions
  const processQuestions = (questions: FormQuestion[], currentFormType: FormType = 'GROUP'): FormQuestion[] => {
    const processed: FormQuestion[] = [];
    let currentScheduleGroup: FormQuestion | null = null;

    // Sort questions by orderIndex
    const sortedQuestions = [...questions].sort((a, b) => a.orderIndex - b.orderIndex);

    for (const q of sortedQuestions) {
      const updated = { ...q };
      
      // Parse optionsJson if options is missing or for rich options
      if (updated.optionsJson) {
        try {
          const parsed = JSON.parse(updated.optionsJson);
          if (Array.isArray(parsed)) {
            // Check if it's Rich Options (QuestionOption[])
            if (parsed.length > 0 && typeof parsed[0] === 'object') {
              (updated as any).richOptions = parsed;
              updated.options = parsed.map((o: any) => o.label);
            } else {
              // String array
              updated.options = parsed;
              (updated as any).richOptions = parsed.map((s: string) => ({ label: s }));
            }
          }
        } catch (e) {
          console.error('Failed to parse optionsJson', e);
        }
      } else if (updated.options) {
        // Legacy options array support
        (updated as any).richOptions = updated.options.map(s => ({ label: s }));
      }

      // Restore UI types from Backend types (Legacy support for BOOLEAN + SyncType -> WORSHIP/SCHEDULE)
      const worshipCategories = [
        'SUNDAY_SERVICE_1', 'SUNDAY_SERVICE_2', 'SUNDAY_SERVICE_3',
        'WEDNESDAY_SERVICE_1', 'WEDNESDAY_SERVICE_2',
        'FRIDAY_PRAYER', 'DAWN_PRAYER', 'YOUTH_SERVICE', 'ETC'
      ];

      if (typeof updated.linkedWorshipCategory === 'number') {
        updated.linkedWorshipCategory = worshipCategories[updated.linkedWorshipCategory] as any;
      }
      
      if (updated.inputType === 'BOOLEAN' || updated.memberSpecific === true) {
        if (updated.syncType === 'PRE_REGISTRATION' && updated.linkedWorshipCategory) {
          updated.inputType = 'WORSHIP_ATTENDANCE';
        } else if (updated.syncType === 'POST_CONFIRMATION' && updated.linkedScheduleId) {
          updated.inputType = 'SCHEDULE_ATTENDANCE';
        }
      }

      // Grouping Logic for SCHEDULE_ATTENDANCE and SCHEDULE_SURVEY
      if ((updated.inputType === 'SCHEDULE_ATTENDANCE' || updated.inputType === 'SCHEDULE_SURVEY') && updated.linkedScheduleId) {
        // Recover schedule title from optionsJson if available
        let scheduleTitle = updated.label;
        if (updated.optionsJson) {
          try {
            const parsed = JSON.parse(updated.optionsJson);
            if (parsed && parsed.scheduleTitle) {
              scheduleTitle = parsed.scheduleTitle;
            }
          } catch (e) {
            // Ignore parsing error
          }
        }

        const scheduleItem = {
          id: updated.linkedScheduleId,
          title: scheduleTitle,
          startDate: updated.linkedScheduleDate || '',
          questionId: updated.id
        };

        // Grouping for Non-Personal Questions (Only in Group Forms)
        // If it's a Personal Form, treat as memberSpecific (don't group)
        const isPersonalQuestion = updated.memberSpecific || currentFormType === 'PERSONAL';

        if (!isPersonalQuestion) {
          // Grouping for Non-Personal Questions
          if (currentScheduleGroup && 
              currentScheduleGroup.inputType === updated.inputType && 
              !currentScheduleGroup.memberSpecific) {
            // Add to existing group
            if (!currentScheduleGroup.linkedSchedules) currentScheduleGroup.linkedSchedules = [];
            
            currentScheduleGroup.linkedSchedules.push(scheduleItem);
            
            // Don't push this question to processed list, it's merged into the group
            continue;
          } else {
            // Start new group
            currentScheduleGroup = {
              ...updated,
              label: updated.label, 
              linkedSchedules: [scheduleItem]
            };
            processed.push(currentScheduleGroup);
            continue;
          }
        } else {
          // Personal Questions - Not grouped, but need linkedSchedules for UI
          updated.linkedSchedules = [scheduleItem];
          // Ensure memberSpecific is true for consistency in UI logic
          if (currentFormType === 'PERSONAL') {
             updated.memberSpecific = true;
          }
          currentScheduleGroup = null;
        }
      } else {
        // Not a schedule question, or end of group
        currentScheduleGroup = null;
      }
      
      processed.push(updated);
    }
    
    return processed;
  };

  // 섹션 및 질문 상태 관리
  const [sections, setSections] = useState<FormSection[]>(() => {
    const type = initialTemplate?.type || initialFormType || 'GROUP';
    if (initialTemplate?.sections && initialTemplate.sections.length > 0) {
      return initialTemplate.sections.map((s, index) => ({
        ...s,
        id: s.id || (Date.now() + index),
        questions: processQuestions(s.questions, type)
      }));
    }
    return [{
      id: Date.now(),
      title: '기본 섹션',
      description: '',
      orderIndex: 0,
      defaultNextAction: 'CONTINUE' as NextActionType,
      questions: initialTemplate?.questions ? processQuestions(initialTemplate.questions, type) : []
    }];
  });

  // Sync state from initialTemplate if it changes
  const initialTemplateId = initialTemplate?.id;
  // Track section IDs to detect when temporary IDs are replaced by real backend IDs
  const sectionIdsStr = initialTemplate?.sections?.map(s => s.id).filter(Boolean).join(',');
  
  // Flag to prevent loop when syncing from props
  const isSyncingFromProps = useRef(false);

  // 1. Sync isActive specifically (Cheap & Frequent)
  useEffect(() => {
    if (initialTemplate && initialTemplate.isActive !== undefined) {
      if (initialTemplate.isActive !== isActive) {
        isSyncingFromProps.current = true;
        setIsActive(initialTemplate.isActive);
      }
    }
  }, [initialTemplate?.isActive]);

  // 2. Sync Structure (Heavy)
  useEffect(() => {
    if (initialTemplate) {
      isSyncingFromProps.current = true;
      setTitle(initialTemplate.title || '');
      setDescription(initialTemplate.description || '');
      setCategory(initialTemplate.category || 'CELL_REPORT');
      setFormType(initialTemplate.type || 'GROUP');
      // isActive is handled in separate effect
      setAccessList(initialTemplate.accessList || []);
      
      if (initialTemplate.sections && initialTemplate.sections.length > 0) {
        setSections(prevSections => {
          // If we already have sections and the number of sections is the same, 
          // we only want to sync IDs to avoid losing unsaved changes in the UI
          if (prevSections.length === initialTemplate.sections!.length) {
            return prevSections.map((ps, idx) => {
              const serverSection = initialTemplate.sections![idx];
              // If server has a real ID and we have a temporary one (timestamp), sync it
              if (serverSection.id && ps.id !== serverSection.id) {
                return { 
                  ...ps, 
                  id: serverSection.id,
                  questions: ps.questions.map((pq, qIdx) => {
                    const serverQuestion = serverSection.questions?.[qIdx];
                    if (serverQuestion?.id && pq.id !== serverQuestion.id) {
                      return { ...pq, id: serverQuestion.id };
                    }
                    return pq;
                  })
                };
              }
              return ps;
            });
          }
          
          // Fallback: Replace all sections (standard initialization)
          return initialTemplate.sections!.map((s, index) => ({
            ...s,
            id: s.id || (Date.now() + index),
            questions: processQuestions(s.questions)
          }));
        });
      } else if (initialTemplate.questions) {
        setSections([{
          id: Date.now(),
          title: '기본 섹션',
          description: '',
          orderIndex: 0,
          defaultNextAction: 'CONTINUE' as NextActionType,
          questions: processQuestions(initialTemplate.questions)
        }]);
      }
    }
  }, [initialTemplateId, sectionIdsStr]); // Run when template ID or section IDs change (removed isActive)

  const [accessList, setAccessList] = useState<FormAccess[]>(() => {
    // Initial Access List
    const initial = initialTemplate?.accessList || initialAccessList || [];
    
    // Auto-add CELL_LEADER/SUB_LEADER if category is CELL_REPORT and access list is empty (new form)
    if ((initialTemplate?.category === 'CELL_REPORT' || initialCategory === 'CELL_REPORT') && initial.length === 0) {
      return [
        {
          accessType: 'RESPONDENT',
          targetType: 'ROLE',
          targetValue: 'CELL_LEADER'
        },
        {
          accessType: 'RESPONDENT',
          targetType: 'ROLE',
          targetValue: 'CELL_SUB_LEADER'
        }
      ];
    }
    
    return initial;
  });

  const [isAccessInfoOpen, setIsAccessInfoOpen] = useState(false);

  // Access Form State
  const [newTargetType, setNewTargetType] = useState<TargetType>('ALL');
  const [newTargetValue, setNewTargetValue] = useState(''); // For single value inputs (ROLE, etc)
  const [selectedTargets, setSelectedTargets] = useState<{id: string, name: string}[]>([]); // For multi-select (USER, CLUB)
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [targetTypeForModal, setTargetTypeForModal] = useState<'USER' | 'CLUB'>('USER');
  const { confirm } = useConfirm();

  // Question Focus & Image Upload
  const [focusedQuestionId, setFocusedQuestionId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [activeAccessTab, setActiveAccessTab] = useState<'RESPONDENT' | 'MANAGER'>('RESPONDENT');

  // Auto-save trigger
  const onDataChangeRef = useRef(onDataChange);
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  // Track previous category to only trigger auto-fill on change
  const prevCategory = useRef(category);

  // Auto-fill access list for CELL_REPORT if empty
  useEffect(() => {
    // Only run if category CHANGED to CELL_REPORT (prevents running on init or when deleting items)
    if (category === 'CELL_REPORT' && prevCategory.current !== 'CELL_REPORT' && accessList.length === 0) {
      setAccessList([
        {
          accessType: 'RESPONDENT',
          targetType: 'ROLE',
          targetValue: 'CELL_LEADER'
        },
        {
          accessType: 'RESPONDENT',
          targetType: 'ROLE',
          targetValue: 'CELL_SUB_LEADER'
        }
      ]);
    }
    prevCategory.current = category;
  }, [category, accessList.length]);

  useEffect(() => {
    // If we just synced from props (e.g. initial load or parent update), don't trigger save
    if (isSyncingFromProps.current) {
      isSyncingFromProps.current = false;
      return;
    }

    if (onDataChangeRef.current) {
      onDataChangeRef.current(getTemplateData());
    }
  }, [title, description, category, formType, targetClubId, startDate, endDate, sections, accessList]); // Removed isActive from dependencies

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionId: number, questionId: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      // 1. Upload file
      const uploadResults = await uploadFiles(Array.from(files), 'form-question');
      if (uploadResults && uploadResults.length > 0) {
        const imageUrl = uploadResults[0].url;
        
        // 2. Update question with imageUrl
        setSections(prev => prev.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              questions: s.questions.map(q => {
                if (q.id === questionId) {
                  return { ...q, imageUrl };
                }
                return q;
              })
            };
          }
          return s;
        }));
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('이미지 업로드에 실패했습니다.');
    } finally {
      // Clear input
      e.target.value = '';
    }
  };

  const addAccessRule = () => {
    // 1. Handle Multi-select targets (USER, CLUB)
    if (selectedTargets.length > 0 && (newTargetType === 'USER' || newTargetType === 'CLUB')) {
      const newRules: FormAccess[] = selectedTargets.map(target => ({
        id: Date.now() + Math.random(), // Ensure unique ID
        accessType: activeAccessTab,
        targetType: newTargetType,
        targetValue: target.id,
        targetName: target.name
      }));
      setAccessList([...accessList, ...newRules]);
      setSelectedTargets([]);
      setNewTargetValue('');
      return;
    }

    // 2. Handle Single value targets (ROLE, ALL, GUEST, or manual input)
    if (newTargetType !== 'USER' && newTargetType !== 'CLUB') {
        const newRule: FormAccess = {
          id: Date.now(),
          accessType: activeAccessTab,
          targetType: newTargetType,
          targetValue: newTargetValue
        };
        setAccessList([...accessList, newRule]);
        setNewTargetValue('');
    }
  };

  const handleTargetTypeChange = (type: TargetType) => {
    setNewTargetType(type);
    setNewTargetValue('');
    setSelectedTargets([]);
    
    // Auto-open modal for USER/CLUB types
    if (type === 'USER' || type === 'CLUB') {
      setTargetTypeForModal(type);
      // We don't open immediately here because we want user to click the button explicitly?
      // Or should we reset selectedTargets? Yes, reset above.
      // The user UI will now show a button to open modal.
    }
  };

  const handleModalConfirm = (selected: {id: string, name: string}[]) => {
    setSelectedTargets(selected);
    setIsSelectionModalOpen(false);
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
      defaultNextAction: 'CONTINUE',
      questions: []
    };
    setSections([...sections, newSection]);
  };

  const removeSection = async (sectionId: number) => {
    if (sections.length <= 1) {
      toast.error('최소 1개의 섹션이 필요합니다.');
      return;
    }
    const isConfirmed = await confirm({
      title: '섹션 삭제',
      message: '섹션을 삭제하시겠습니까? 포함된 질문도 모두 삭제됩니다.',
      type: 'danger',
      confirmText: '삭제',
      cancelText: '취소'
    });
    if (isConfirmed) {
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
      memberSpecific: formType === 'GROUP' || formType === 'PERSONAL', // Default to true for Group/Personal forms
      linkedSchedules: [] // Initialize for schedule questions
    };

    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, questions: [...s.questions, newQuestion] };
      }
      return s;
    }));
    setFocusedQuestionId(newId);
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
              if (updates.inputType) {
                if (updates.inputType === 'WORSHIP_ATTENDANCE' || updates.inputType === 'SCHEDULE_ATTENDANCE' || updates.inputType === 'SCHEDULE_SURVEY') {
                  updatedQ.syncType = 'POST_CONFIRMATION';
                } else if (updates.inputType !== 'BOOLEAN') {
                  // Only reset syncType if not switching to another syncable type
                  updatedQ.syncType = 'NONE';
                }

                if (updates.inputType !== 'SCHEDULE_ATTENDANCE' && updates.inputType !== 'SCHEDULE_SURVEY') {
                  updatedQ.linkedSchedules = [];
                  updatedQ.linkedScheduleId = undefined;
                  updatedQ.linkedScheduleDate = undefined;
                }
                
                if (updates.inputType !== 'WORSHIP_ATTENDANCE') {
                  updatedQ.linkedWorshipCategory = undefined;
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

  const duplicateQuestion = (sectionId: number, questionId: number) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    const question = section.questions.find(q => q.id === questionId);
    if (!question) return;

    const newQuestion = {
      ...question,
      id: Date.now(),
      orderIndex: section.questions.length + 1
    };

    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, questions: [...s.questions, newQuestion] };
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

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('양식 제목을 입력해주세요.');
      return;
    }
    
    await saveFormInternal();
  };

  const handlePreview = () => {
    const templateData = getTemplateData();
    localStorage.setItem('formPreviewData', JSON.stringify(templateData));
    window.open('/manage/forms/preview', '_blank');
  };

  const getTemplateData = (): Partial<FormTemplate> => {
    // Transform questions for saving: Split multi-schedule questions into individual questions
    const processedSections = sections.map(section => ({
      ...section,
      questions: section.questions.flatMap(q => {
        // Create a copy to avoid mutating the state
        const updatedQ = { ...q };
        const qAny = updatedQ as any;
        
        // Prepare options payload
        // Backend expects List<OptionDto> in 'options' field
        if (qAny.richOptions) {
          // Map to OptionDto structure
          updatedQ.options = qAny.richOptions.map((o: any) => ({
            label: o.label,
            nextSectionId: o.nextSectionId
          }));
          updatedQ.optionsJson = JSON.stringify(qAny.richOptions); // Backup for frontend rich features
        }

        // Split multi-schedule questions into individual questions for backend
        if (updatedQ.inputType === 'SCHEDULE_ATTENDANCE' || updatedQ.inputType === 'SCHEDULE_SURVEY') {
          // If it's a grouped schedule question, we need to split it back into individual questions
          if (updatedQ.linkedSchedules && updatedQ.linkedSchedules.length > 0) {
            return updatedQ.linkedSchedules.map((schedule, idx) => ({
              ...updatedQ,
              id: schedule.questionId || (-(Date.now() + idx)), // Use original ID if available, or a stable temporary ID
              label: updatedQ.label, // Use question label instead of schedule title
              linkedScheduleId: schedule.id,
              linkedScheduleDate: schedule.startDate,
              linkedSchedules: undefined, // Remove the group array
              options: undefined,
              richOptions: undefined,
              optionsJson: JSON.stringify({ scheduleTitle: schedule.title }) // Save schedule title to persist it
            }));
          }
        }
        
        return [updatedQ];
      })
    }));

    return {
      title,
      description,
      category,
      type: formType,
      targetClubId: targetClubId ? Number(targetClubId) : undefined,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      isActive,
      sections: processedSections,
      accessList
    };
  };

  const saveFormInternal = async () => {
    await onSave(getTemplateData());
  };

  useImperativeHandle(ref, () => ({
    saveForm: async () => {
      await saveFormInternal();
    },
    openAccessSettings: () => {
      setIsAccessInfoOpen(true);
    },
    openDateSettings: () => {
      setIsDateModalOpen(true);
    },
    openPreview: handlePreview,
    getTemplateData
  }));

  const titleCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (titleCardRef.current && !titleCardRef.current.contains(event.target as Node)) {
        setIsTitleFocused(false);
      }
    }

    if (isTitleFocused) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTitleFocused]);

  return (
    <div className={`flex flex-col h-full bg-slate-50 ${isModal ? '' : 'min-h-screen'}`}>
      {/* Header Area - Sticky/Fixed */}
      {!hideHeader && (
      <div className={`flex-none bg-slate-50 z-10 ${isModal ? 'border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4' : 'px-4 py-6 sm:px-6 sm:py-10'}`}>
        <div className={`mx-auto w-full ${isModal ? '' : 'max-w-4xl'}`}>
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{customTitle || '양식 생성기 (Form Builder)'}</h1>
              {!customTitle && <p className="mt-1 text-xs sm:text-sm text-slate-500">새로운 보고서 양식이나 신청서를 생성합니다.</p>}
            </div>
            <div className="flex items-center gap-2">
              {!lockSettings && (
                <button
                  onClick={() => setIsDateModalOpen(true)}
                  className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                  title="설정 (기간/카테고리)"
                >
                  <Calendar className="h-4 w-4" />
                </button>
              )}
              {!hideAccessControl && (
                <button
                  onClick={() => setIsAccessInfoOpen(true)}
                  className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                  title="권한 설정"
                >
                  <Lock className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handlePreview}
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
      )}

      {/* Scrollable Content Area */}
      <div className={`flex-1 overflow-y-auto ${isModal ? 'p-4 sm:p-6' : 'px-4 pb-10 sm:px-6'}`}>
        <div className={`mx-auto w-full space-y-6 ${isModal ? 'max-w-4xl' : 'max-w-4xl'}`}>
        
        {/* Title & Description Card */}
        {!hideBasicInfo && (
          <div 
            ref={titleCardRef}
            className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-all border-t-8 ${
              isTitleFocused 
                ? 'border-t-blue-600 border-x-slate-200 border-b-slate-200 ring-1 ring-slate-200' 
                : 'border-t-blue-600 border-slate-200 hover:bg-slate-50 cursor-pointer'
            }`}
            onClick={() => setIsTitleFocused(true)}
          >
             <div className="p-6">
                {isTitleFocused ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-3xl font-bold text-slate-900 border-b border-slate-200 focus:border-blue-600 focus:outline-none py-2 placeholder:text-slate-300"
                      placeholder="양식 제목"
                      autoFocus
                    />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="w-full text-base text-slate-600 border-b border-slate-200 focus:border-blue-600 focus:outline-none py-2 placeholder:text-slate-300 resize-none"
                      placeholder="양식 설명"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h1 className={`text-3xl font-bold ${title ? 'text-slate-900' : 'text-slate-300'}`}>
                      {title || '양식 제목 없음'}
                    </h1>
                    <p className={`text-base ${description ? 'text-slate-600' : 'text-slate-300'}`}>
                      {description || '설명이 없습니다.'}
                    </p>
                  </div>
                )}
             </div>
          </div>
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
                {section.questions.map((q, qIdx) => {
                  const isFocused = focusedQuestionId === q.id;
                  
                  return (
                    <div 
                      key={q.id} 
                      className={`relative rounded-lg border transition-all ${
                        isFocused 
                          ? 'border-l-4 border-l-blue-500 border-y-slate-200 border-r-slate-200 bg-white shadow-md p-6' 
                          : 'border-slate-200 bg-white p-4 hover:bg-slate-50 cursor-pointer'
                      }`}
                      onClick={() => !isFocused && setFocusedQuestionId(q.id)}
                    >
                      {!isFocused ? (
                        /* Simplified View */
                        <div className="flex items-center justify-between">
                           <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base font-medium text-slate-900">{typeof q.label === 'string' ? (q.label || '질문 제목 없음') : '질문 제목 오류'}</span>
                                {q.required && <span className="text-rose-500">*</span>}
                              </div>
                              {q.imageUrl && (
                                <div className="mt-2 mb-2">
                                  <img src={getFileUrl(q.imageUrl)} alt="Question" className="h-20 w-auto rounded object-cover border border-slate-200" />
                                </div>
                              )}
                              <div className="text-xs text-slate-500 flex items-center gap-2">
                                 <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                                   {{
                                      SHORT_TEXT: '단답형',
                                      LONG_TEXT: '장문형',
                                      SINGLE_CHOICE: '객관식',
                                      MULTIPLE_CHOICE: '체크박스',
                                      NUMBER: '숫자',
                                      BOOLEAN: '찬반',
                                      WORSHIP_ATTENDANCE: '예배 출석',
                                      SCHEDULE_ATTENDANCE: '일정 참석',
                                     SCHEDULE_SURVEY: '일정 설문'
                                  }[q.inputType] || q.inputType}
                                 </span>
                                 {q.description && <span className="text-slate-400 truncate max-w-[300px]">{q.description}</span>}
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeQuestion(section.id, q.id); }}
                                className="p-2 text-slate-400 hover:text-rose-500 rounded-full hover:bg-rose-50"
                                title="삭제"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                           </div>
                        </div>
                      ) : (
                        /* Detailed View */
                        <div className="space-y-4">
                           {/* Handle & Actions (Move Up/Down) */}
                           <div className="flex justify-center border-b border-slate-100 pb-2 mb-4 -mx-6 -mt-2">
                              <div className="flex gap-1">
                                <button onClick={() => moveQuestionUp(section.id, qIdx)} disabled={qIdx === 0} className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                                <div className="flex gap-0.5 items-center"><div className="w-1 h-1 rounded-full bg-slate-300"></div><div className="w-1 h-1 rounded-full bg-slate-300"></div><div className="w-1 h-1 rounded-full bg-slate-300"></div></div>
                                <button onClick={() => moveQuestionDown(section.id, qIdx)} disabled={qIdx === section.questions.length - 1} className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                              </div>
                           </div>

                           {/* Question Input Row */}
                           <div className="flex flex-col gap-4 md:flex-row md:items-start">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border-b-2 border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                                  <input
                                    type="text"
                                    value={typeof q.label === 'string' ? q.label : ''}
                                    onChange={(e) => updateQuestion(section.id, q.id, { label: e.target.value })}
                                    className="w-full bg-transparent text-base font-medium text-slate-900 focus:outline-none"
                                    placeholder="질문"
                                    autoFocus
                                  />
                                  <label className="cursor-pointer p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors" title="이미지 추가">
                                     <ImageIcon className="h-5 w-5" />
                                     <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, section.id, q.id)} />
                                  </label>
                                </div>
                                
                                {q.imageUrl && (
                                  <div className="relative inline-block group mt-2">
                                     <img src={getFileUrl(q.imageUrl)} alt="Question" className="max-w-full h-auto max-h-80 rounded-lg border border-slate-200 shadow-sm" />
                                     <button 
                                        onClick={() => updateQuestion(section.id, q.id, { imageUrl: undefined })}
                                        className="absolute top-2 right-2 bg-white p-1.5 rounded shadow text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                        title="이미지 삭제"
                                     >
                                        <Trash2 className="h-4 w-4" />
                                     </button>
                                  </div>
                                )}
                                
                                {q.description !== undefined && (
                                  <input
                                    type="text"
                                    value={q.description || ''}
                                    onChange={(e) => updateQuestion(section.id, q.id, { description: e.target.value })}
                                    className="w-full border-b border-slate-200 py-1 text-sm text-slate-600 focus:border-blue-500 focus:outline-none placeholder:text-slate-400"
                                    placeholder="설명 텍스트"
                                  />
                                )}
                              </div>
                              
                              <div className="w-full md:w-64 flex-shrink-0">
                                <select
                                  value={q.inputType}
                                  onChange={(e) => updateQuestion(section.id, q.id, { inputType: e.target.value as QuestionType })}
                                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
                                >
                                  <optgroup label="기본형">
                                    <option value="SHORT_TEXT">단답형</option>
                                    <option value="LONG_TEXT">장문형</option>
                                    <option value="SINGLE_CHOICE">객관식 질문</option>
                                    <option value="MULTIPLE_CHOICE">체크박스</option>
                                    <option value="NUMBER">숫자 입력</option>
                                    <option value="BOOLEAN">찬성/반대 (O/X)</option>
                                  </optgroup>
                                  <optgroup label="특수형">
                                    <option value="WORSHIP_ATTENDANCE">예배 출석</option>
                                    <option value="SCHEDULE_ATTENDANCE">일정 출석 체크</option>
                                    <option value="SCHEDULE_SURVEY">일정 참석 조사</option>
                                  </optgroup>
                                </select>
                              </div>
                           </div>
                           
                           {/* Type Specific Options */}
                           <div className="rounded bg-slate-50 p-3">
                              {q.inputType === 'SCHEDULE_ATTENDANCE' || q.inputType === 'SCHEDULE_SURVEY' ? (
                                <ScheduleManager
                                  selectedSchedules={q.linkedSchedules || []}
                                  onChange={(schedules) => updateQuestion(section.id, q.id, { linkedSchedules: schedules })}
                                  singleSelection={q.memberSpecific || formType === 'PERSONAL'}
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
                                <div className="space-y-3">
                                  {((q as any).richOptions || []).map((option: QuestionOption, idx: number) => (
                                    <div key={idx} className="group flex items-center gap-3 py-1">
                                      {/* Radio Circle Icon */}
                                      <Circle className="h-5 w-5 text-slate-300 flex-shrink-0" />
                                      
                                      {/* Option Input */}
                                      <div className="flex-1 relative">
                                        <input
                                          type="text"
                                          value={option.label}
                                          onChange={(e) => {
                                            const newOptions = [...((q as any).richOptions || [])];
                                            newOptions[idx] = { ...newOptions[idx], label: e.target.value };
                                            updateQuestion(section.id, q.id, { richOptions: newOptions } as any);
                                          }}
                                          className="w-full border-b border-transparent hover:border-slate-200 focus:border-blue-600 bg-transparent px-0 py-1.5 text-sm outline-none transition-colors placeholder:text-slate-400"
                                          placeholder={`옵션 ${idx + 1}`}
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-slate-200 group-hover:bg-slate-300 peer-focus:bg-blue-600" />
                                      </div>

                                      {/* Remove Button (Hidden by default, shown on hover) */}
                                      <button
                                        onClick={() => {
                                          const newOptions = ((q as any).richOptions || []).filter((_: any, i: number) => i !== idx);
                                          updateQuestion(section.id, q.id, { richOptions: newOptions } as any);
                                        }}
                                        className="p-2 text-slate-400 opacity-0 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-all group-hover:opacity-100"
                                        title="삭제"
                                      >
                                        <X className="h-5 w-5" />
                                      </button>
                                        
                                      {/* Unified Branching Logic Dropdown */}
                                      {q.inputType === 'SINGLE_CHOICE' && (q as any).showBranchingLogic && (
                                        <div className="w-48 flex-shrink-0">
                                          <select
                                            value={
                                              option.nextAction === 'GO_TO_SECTION' && option.targetSectionIndex !== undefined
                                                ? `SECTION_${option.targetSectionIndex}`
                                                : option.nextAction || 'CONTINUE'
                                            }
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              const newOptions = [...((q as any).richOptions || [])];
                                              
                                              if (value === 'CONTINUE') {
                                                newOptions[idx] = { ...newOptions[idx], nextAction: 'CONTINUE', targetSectionIndex: undefined };
                                              } else if (value === 'SUBMIT') {
                                                newOptions[idx] = { ...newOptions[idx], nextAction: 'SUBMIT', targetSectionIndex: undefined };
                                              } else if (value.startsWith('SECTION_')) {
                                                const sectionIndex = parseInt(value.split('_')[1]);
                                                newOptions[idx] = { ...newOptions[idx], nextAction: 'GO_TO_SECTION', targetSectionIndex: sectionIndex };
                                              }
                                              
                                              updateQuestion(section.id, q.id, { richOptions: newOptions } as any);
                                            }}
                                            className="w-full rounded border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-blue-500 focus:outline-none"
                                          >
                                            <option value="CONTINUE">다음 섹션으로 진행하기</option>
                                            <option value="SUBMIT">양식 제출하기</option>
                                            {sections.map((s, i) => (
                                              <option key={s.id} value={`SECTION_${i}`} disabled={i === sIdx}>
                                                {i + 1} 섹션 ({s.title || '제목 없음'})으로 이동
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  
                                  <div className="flex items-center gap-3 py-1 pl-[1px]">
                                    <Circle className="h-5 w-5 text-slate-300 flex-shrink-0" />
                                    <div className="flex items-center gap-1 text-sm">
                                      <button
                                        onClick={() => {
                                          const newOptions = [...((q as any).richOptions || []), { label: '', nextAction: 'CONTINUE' }];
                                          updateQuestion(section.id, q.id, { richOptions: newOptions } as any);
                                        }}
                                        className="text-slate-500 hover:text-blue-600 hover:underline"
                                      >
                                        옵션 추가
                                      </button>
                                      <span className="text-slate-300">또는</span>
                                      <button
                                        onClick={() => {
                                          // Logic for adding "Other" option
                                          const newOptions = [...((q as any).richOptions || []), { label: '기타...', nextAction: 'CONTINUE' }];
                                          updateQuestion(section.id, q.id, { richOptions: newOptions } as any);
                                        }}
                                        className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                                      >
                                        '기타' 추가
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400">추가 설정이 없는 타입입니다.</p>
                              )}
                           </div>
                           
                           {/* Footer Actions */}
                           <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-4">
                              <div className="flex items-center gap-4 border-r border-slate-200 pr-4 mr-2">
                                 {formType === 'GROUP' && (
                                    <label className="flex items-center gap-1 cursor-pointer text-sm text-slate-600 hover:text-slate-800" title="순원 개인 질문">
                                      <input
                                        type="checkbox"
                                        checked={q.memberSpecific}
                                        onChange={(e) => updateQuestion(section.id, q.id, { memberSpecific: e.target.checked })}
                                        className="h-4 w-4 rounded border-slate-300 focus:ring-blue-500"
                                      />
                                      <span>개인질문</span>
                                    </label>
                                 )}
                                 <button onClick={() => duplicateQuestion(section.id, q.id)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full" title="복사"><Copy className="h-5 w-5" /></button>
                                 <button onClick={() => removeQuestion(section.id, q.id)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full hover:text-rose-500" title="삭제"><Trash2 className="h-5 w-5" /></button>
                              </div>
                              <div className="flex items-center gap-2">
                                 <span className="text-sm text-slate-600">필수</span>
                                 <button
                                   onClick={() => updateQuestion(section.id, q.id, { required: !q.required })}
                                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${q.required ? 'bg-blue-600' : 'bg-slate-200'}`}
                                 >
                                   <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${q.required ? 'translate-x-6' : 'translate-x-1'}`} />
                                 </button>
                              </div>
                              <div className="relative ml-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === q.id ? null : q.id);
                                  }}
                                  className={`p-2 rounded-full transition-colors ${openMenuId === q.id ? 'bg-slate-100 text-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}
                                >
                                  <MoreVertical className="h-5 w-5" />
                                </button>
                                
                                {/* Dropdown menu for more options */}
                                {openMenuId === q.id && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                    <div className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-lg shadow-lg border border-slate-100 z-20 p-1">
                                       <button 
                                         onClick={() => {
                                           updateQuestion(section.id, q.id, { description: q.description !== undefined ? undefined : '' });
                                           setOpenMenuId(null);
                                         }}
                                         className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded"
                                       >
                                         {q.description !== undefined && <Check className="h-4 w-4" />}
                                         <span className={q.description !== undefined ? 'ml-0' : 'ml-6'}>설명 추가</span>
                                       </button>
                                       
                                       {q.inputType === 'SINGLE_CHOICE' && (
                                         <button 
                                           onClick={() => {
                                              const current = (q as any).showBranchingLogic;
                                              updateQuestion(section.id, q.id, { showBranchingLogic: !current } as any);
                                              setOpenMenuId(null);
                                           }}
                                           className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded"
                                         >
                                           {(q as any).showBranchingLogic && <Check className="h-4 w-4" />}
                                           <span className={(q as any).showBranchingLogic ? 'ml-0' : 'ml-6'}>답변을 기준으로 섹션 이동</span>
                                         </button>
                                       )}
                                    </div>
                                  </>
                                )}
                              </div>
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={() => addQuestion(section.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  질문 추가하기
                </button>

                {/* Section Footer: Next Action */}
                {sIdx < sections.length - 1 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 -mx-6 -mb-6 px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-slate-700">섹션 {sIdx + 1} 완료 후 이동:</span>
                      <p className="text-xs text-slate-400">이 섹션의 마지막 질문까지 응답한 후의 동작을 선택하세요.</p>
                    </div>
                    <div className="w-64">
                      <select
                        value={
                          section.defaultNextAction === 'GO_TO_SECTION' && section.defaultTargetSectionIndex !== undefined
                            ? `SECTION_${section.defaultTargetSectionIndex}`
                            : section.defaultNextAction || 'CONTINUE'
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          let updates: Partial<FormSection> = {};
                          if (value === 'CONTINUE') {
                            updates = { defaultNextAction: 'CONTINUE', defaultTargetSectionIndex: undefined };
                          } else if (value === 'SUBMIT') {
                            updates = { defaultNextAction: 'SUBMIT', defaultTargetSectionIndex: undefined };
                          } else if (value.startsWith('SECTION_')) {
                            const idx = parseInt(value.split('_')[1]);
                            updates = { defaultNextAction: 'GO_TO_SECTION', defaultTargetSectionIndex: idx };
                          }
                          updateSection(section.id, updates);
                        }}
                        className="w-full rounded border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:border-blue-500 focus:outline-none bg-white"
                      >
                        <option value="CONTINUE">다음 섹션으로 진행하기</option>
                        <option value="SUBMIT">양식 제출하기</option>
                        {sections.map((s, i) => (
                          <option key={s.id} value={`SECTION_${i}`} disabled={i === sIdx}>
                            {i + 1} 섹션 ({s.title || '제목 없음'})으로 이동
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
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

      {/* Access Control Modal */}
      {isAccessInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">접근 권한 설정</h3>
              <button onClick={() => setIsAccessInfoOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setActiveAccessTab('RESPONDENT')}
                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeAccessTab === 'RESPONDENT' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                응답자 (제출 가능)
              </button>
              <button
                onClick={() => setActiveAccessTab('MANAGER')}
                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeAccessTab === 'MANAGER' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                관리자 (수정/조회)
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Existing Rules List */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900">현재 적용된 권한</h4>
                {accessList.filter(a => a.accessType === activeAccessTab).length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center bg-slate-50 rounded-lg">설정된 권한이 없습니다 ({activeAccessTab === 'RESPONDENT' ? '모두 가능' : '작성자만 가능'})</p>
                ) : (
                  accessList
                    .filter(a => a.accessType === activeAccessTab)
                    .map((rule, idx) => (
                    <div key={rule.id || `access-${idx}`} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 bg-white mb-2">
                      <div className="flex items-center gap-3">
                        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                          {TARGET_TYPE_MAP[rule.targetType]}
                        </span>
                        <span className="text-sm font-medium text-slate-700">
                          {rule.targetType === 'ROLE' ? 
                            (rule.targetValue ? (ROLE_MAP[rule.targetValue] || rule.targetValue) : '') :
                           rule.targetType === 'ALL' ? '모든 사용자' :
                           rule.targetName || rule.targetValue}
                        </span>
                      </div>
                      <button onClick={() => removeAccessRule(rule.id)} className="text-slate-400 hover:text-rose-500">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Rule */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900">권한 추가</h4>
                <div className="flex gap-2">
                  <select
                    value={newTargetType}
                    onChange={(e) => handleTargetTypeChange(e.target.value as TargetType)}
                    className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ALL">전체</option>
                    <option value="ROLE">직분/역할</option>
                    <option value="USER">특정 사용자</option>
                    <option value="CLUB">부서/클럽</option>
                    <option value="GUEST">비회원</option>
                  </select>

                  <div className="flex-1">
                    {newTargetType === 'ROLE' ? (
                      <select
                        value={newTargetValue}
                        onChange={(e) => setNewTargetValue(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">역할 선택...</option>
                        {Object.entries(ROLE_MAP).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    ) : (newTargetType === 'USER' || newTargetType === 'CLUB') ? (
                      <button
                        onClick={() => {
                          setTargetTypeForModal(newTargetType);
                          setIsSelectionModalOpen(true);
                        }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
                      >
                        {selectedTargets.length > 0 
                          ? `${selectedTargets[0].name} 외 ${selectedTargets.length - 1}명 선택됨`
                          : '대상 검색하기...'}
                      </button>
                    ) : (
                      <input
                        type="text"
                        value={newTargetType === 'ALL' ? '모든 사용자' : newTargetType === 'GUEST' ? '비회원 (게스트)' : newTargetValue}
                        disabled
                        className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                      />
                    )}
                  </div>

                  <button
                    onClick={addAccessRule}
                    disabled={
                      (newTargetType === 'ROLE' && !newTargetValue) ||
                      ((newTargetType === 'USER' || newTargetType === 'CLUB') && selectedTargets.length === 0)
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-300"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 rounded-b-xl flex justify-end">
              <button
                onClick={() => setIsAccessInfoOpen(false)}
                className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-bold text-white hover:bg-slate-800"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Settings Modal */}
      <DateSettingsModal 
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
         category={category}
         setCategory={(val) => {
             setCategory(val);
             if (val === 'CELL_REPORT') {
                 // Check if CELL_LEADER respondent exists
                 const hasLeader = accessList.some(a => 
                     a.accessType === 'RESPONDENT' && 
                     a.targetType === 'ROLE' && 
                     (a.targetValue === 'CELL_LEADER' || a.targetValue === 'ROLE_CELL_LEADER')
                 );

                 // Check if CELL_SUB_LEADER respondent exists
                 const hasSubLeader = accessList.some(a => 
                     a.accessType === 'RESPONDENT' && 
                     a.targetType === 'ROLE' && 
                     (a.targetValue === 'CELL_SUB_LEADER' || a.targetValue === 'ROLE_CELL_SUB_LEADER')
                 );
                 
                 const newAccessRules: FormAccess[] = [];

                 if (!hasLeader) {
                     newAccessRules.push({
                         accessType: 'RESPONDENT',
                         targetType: 'ROLE',
                         targetValue: 'CELL_LEADER'
                     });
                 }

                 if (!hasSubLeader) {
                     newAccessRules.push({
                         accessType: 'RESPONDENT',
                         targetType: 'ROLE',
                         targetValue: 'CELL_SUB_LEADER'
                     });
                 }

                 if (newAccessRules.length > 0) {
                     setAccessList(prev => [...prev, ...newAccessRules]);
                     toast.success('순보고서 설정에 맞춰 순장/부순장 권한이 자동으로 추가되었습니다.');
                 }
             }
         }}
         shouldHideCategory={shouldHideCategory}
         formType={formType}
         setFormType={setFormType}
         lockSettings={lockSettings}
       />
      <TargetSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        onConfirm={handleModalConfirm}
        type={targetTypeForModal}
        initialSelected={selectedTargets}
      />
     </div>
   );
 });
