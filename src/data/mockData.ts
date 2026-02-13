import type { FormTemplate, FormSubmission } from '../types/form';

export const mockMembers = ['김철수', '이영희', '박민수'];

// 1. 템플릿: 2026 청년부 순 보고서
const cellReportTemplate: FormTemplate = {
  id: 1,
  title: "2026년 청년부 순 보고서",
  description: "매주 주일 순 모임 후 작성하는 보고서입니다.",
  category: "CELL_REPORT",
  type: "GROUP",
  isActive: true,
  questions: [
    // 출석 연동 질문들
    { id: 101, label: "주일예배", inputType: "BOOLEAN", required: true, orderIndex: 1, memberSpecific: true, linkedWorshipCategory: "SUNDAY_SERVICE_1" },
    { id: 102, label: "수요예배", inputType: "BOOLEAN", required: false, orderIndex: 2, memberSpecific: true, linkedWorshipCategory: "WEDNESDAY_SERVICE_1" },
    { id: 103, label: "금요기도회", inputType: "BOOLEAN", required: false, orderIndex: 3, memberSpecific: true, linkedWorshipCategory: "FRIDAY_PRAYER" },
    // 일반 질문
    { id: 104, label: "기도제목 및 나눔", inputType: "LONG_TEXT", required: false, orderIndex: 4, memberSpecific: true },
    // 순 전체에 대한 질문 (순장이 작성)
    { id: 105, label: "금주 순 모임 특이사항", inputType: "LONG_TEXT", required: false, orderIndex: 5, memberSpecific: false }
  ]
};

// 2. 제출 데이터: 1월 2주차 (1월 11일 기준)
const submissionJan11: FormSubmission = {
  id: 501,
  templateId: 1,
  submitterName: "윤다빈 순장",
  submitDate: "2026-01-10",
  submitTime: "2026-01-10T10:00:00",
  targetSundayDate: "2026-01-11", // 1월 2주차 데이터
  status: "APPROVED",
  answers: [
    // 최인서 순원 데이터
    { questionId: 101, targetMemberName: "최인서", value: "true" }, // 주일예배 O
    { questionId: 102, targetMemberName: "최인서", value: "false" }, // 수요예배 X
    { questionId: 104, targetMemberName: "최인서", value: "취업 준비로 인해 기도가 필요함." },
    // 이민규 순원 데이터
    { questionId: 101, targetMemberName: "이민규", value: "true" },
    { questionId: 102, targetMemberName: "이민규", value: "true" },
    { questionId: 103, targetMemberName: "이민규", value: "true" },
    { questionId: 104, targetMemberName: "이민규", value: "건강 회복 감사." },
    // 순 전체 데이터 (targetMemberName 없음)
    { questionId: 105, value: "이번 주 순 모임 분위기가 아주 좋았습니다." }
  ]
};

const submissionMyInfo: FormSubmission = {
  id: 502,
  templateId: 1,
  submitterName: "김청년",
  submitDate: "2026-01-10",
  submitTime: "2026-01-10T10:00:00",
  targetSundayDate: "2026-01-11",
  status: "PENDING",
  answers: []
};

export const mockTemplates: FormTemplate[] = [cellReportTemplate];
export const mockSubmissions: FormSubmission[] = [submissionJan11, submissionMyInfo];
