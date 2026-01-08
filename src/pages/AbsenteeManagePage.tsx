import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  type CareLevel,
  type CareMember,
  type CareMemberDetail,
  type CareLog,
  type CareSummary,
  getCareMembers,
  getCareSummary,
  getCareMemberDetail,
  addCareLog,
  updateCareLog,
  deleteCareLog,
  getAttendedMembers,
} from '../services/absenteeService'

// 임시 데이터
const mockLongTermAbsenceMembers: CareMember[] = [
  {
    memberId: 1,
    name: '최성민',
    level: 'LONG_TERM_ABSENCE',
    managerName: '김목사',
    absenceStartDate: '2024-10-15',
    daysAbsent: 62,
    phone: '010-1234-5678',
    email: 'choi@example.com',
  },
  {
    memberId: 2,
    name: '김희수',
    level: 'LONG_TERM_ABSENCE',
    absenceStartDate: '2024-11-01',
    daysAbsent: 45,
    phone: '010-2345-6789',
  },
  {
    memberId: 3,
    name: '조문성',
    level: 'LONG_TERM_ABSENCE',
    managerName: '이목사',
    absenceStartDate: '2024-09-20',
    daysAbsent: 87,
    phone: '010-3456-7890',
    email: 'jo@example.com',
  },
  {
    memberId: 4,
    name: '박지훈',
    level: 'LONG_TERM_ABSENCE',
    absenceStartDate: '2024-10-28',
    daysAbsent: 49,
    phone: '010-4567-8901',
  },
]

const mockNeedsAttentionMembers: CareMember[] = [
  {
    memberId: 5,
    name: '이수진',
    level: 'NEEDS_ATTENTION',
    managerName: '박목사',
    absenceStartDate: '2024-12-01',
    daysAbsent: 15,
    phone: '010-5678-9012',
    email: 'lee@example.com',
  },
  {
    memberId: 6,
    name: '정민호',
    level: 'NEEDS_ATTENTION',
    absenceStartDate: '2024-11-25',
    daysAbsent: 21,
    phone: '010-6789-0123',
  },
  {
    memberId: 7,
    name: '한소영',
    level: 'NEEDS_ATTENTION',
    managerName: '최목사',
    absenceStartDate: '2024-11-18',
    daysAbsent: 28,
    phone: '010-7890-1234',
    email: 'han@example.com',
  },
]

// 케어 완료 후 다시 결석한 케이스 (임시 데이터)
const mockReAbsenceMembers: CareMember[] = [
  {
    memberId: 8,
    name: '강민수',
    level: 'NEEDS_ATTENTION',
    absenceStartDate: '2024-12-05',
    daysAbsent: 11,
    phone: '010-1111-2222',
    email: 'kang@example.com',
  },
  {
    memberId: 9,
    name: '윤지영',
    level: 'LONG_TERM_ABSENCE',
    absenceStartDate: '2024-10-20',
    daysAbsent: 57,
    phone: '010-2222-3333',
    email: 'yoon@example.com',
  },
]

// 출석 확인된 멤버 (임시 데이터)
// managerName 필드를 이전 상태로 사용 (장기결석 또는 관심필요)
const mockAttendedMembers: CareMember[] = [
  {
    memberId: 10,
    name: '송민준',
    level: 'ATTENDED',
    absenceStartDate: '2024-12-10',
    daysAbsent: 0,
    phone: '010-3333-4444',
    email: 'song@example.com',
    managerName: '장기결석', // 이전 상태
  },
  {
    memberId: 11,
    name: '오지은',
    level: 'ATTENDED',
    absenceStartDate: '2024-12-12',
    daysAbsent: 0,
    phone: '010-4444-5555',
    email: 'oh@example.com',
    managerName: '관심필요', // 이전 상태
  },
  {
    memberId: 12,
    name: '임동현',
    level: 'ATTENDED',
    absenceStartDate: '2024-12-08',
    daysAbsent: 0,
    phone: '010-5555-6666',
    managerName: '장기결석', // 이전 상태
  },
]

const mockMemberDetails: Record<number, CareMemberDetail> = {
  1: {
    ...mockLongTermAbsenceMembers[0],
    careLogs: [
      {
        logId: 1,
        memberId: 1,
        createdAt: '2024-12-10T10:30:00',
        content: '전화 연락 완료. 개인 사정으로 잠시 휴식 중이라고 함.',
        createdBy: '김목사',
      },
      {
        logId: 2,
        memberId: 1,
        createdAt: '2024-12-05T14:20:00',
        content: '심방 예정일 확인 필요.',
        createdBy: '김목사',
      },
    ],
  },
  2: {
    ...mockLongTermAbsenceMembers[1],
    careLogs: [
      {
        logId: 3,
        memberId: 2,
        createdAt: '2024-12-08T09:15:00',
        content: '연락 시도했으나 응답 없음. 재연락 필요.',
        createdBy: '이목사',
      },
    ],
  },
  3: {
    ...mockLongTermAbsenceMembers[2],
    careLogs: [
      {
        logId: 4,
        memberId: 3,
        createdAt: '2024-12-12T16:45:00',
        content: '심방 완료. 건강 문제로 출석 어려움. 지속적인 관심 필요.',
        createdBy: '이목사',
      },
    ],
  },
  4: {
    ...mockLongTermAbsenceMembers[3],
    careLogs: [],
  },
  5: {
    ...mockNeedsAttentionMembers[0],
    careLogs: [
      {
        logId: 5,
        memberId: 5,
        createdAt: '2024-12-13T11:00:00',
        content: '전화 통화 완료. 다음 주 참석 예정.',
        createdBy: '박목사',
      },
    ],
  },
  6: {
    ...mockNeedsAttentionMembers[1],
    careLogs: [],
  },
  7: {
    ...mockNeedsAttentionMembers[2],
    careLogs: [
      {
        logId: 6,
        memberId: 7,
        createdAt: '2024-12-11T13:30:00',
        content: '카카오톡으로 연락함. 응답 대기 중.',
        createdBy: '최목사',
      },
    ],
  },
  // 케어 완료 후 다시 결석한 케이스
  8: {
    ...mockReAbsenceMembers[0],
    careLogs: [
      {
        logId: 7,
        memberId: 8,
        createdAt: '2024-12-15T09:00:00',
        content: '이전에 케어 완료 처리되었으나 다시 결석 시작. 관심 필요 상태로 변경.',
        createdBy: '시스템',
      },
      {
        logId: 8,
        memberId: 8,
        createdAt: '2024-11-20T14:00:00',
        content: '케어 완료 처리됨. 출석 확인.',
        createdBy: '김목사',
      },
    ],
  },
  9: {
    ...mockReAbsenceMembers[1],
    careLogs: [
      {
        logId: 9,
        memberId: 9,
        createdAt: '2024-12-15T10:00:00',
        content: '이전에 케어 완료 처리되었으나 장기결석 상태로 변경됨. 즉시 확인 필요.',
        createdBy: '시스템',
      },
      {
        logId: 10,
        memberId: 9,
        createdAt: '2024-09-15T16:00:00',
        content: '케어 완료 처리됨. 출석 확인.',
        createdBy: '이목사',
      },
    ],
  },
  // 출석 확인된 멤버 상세 정보
  10: {
    ...mockAttendedMembers[0],
    careLogs: [
      {
        logId: 11,
        memberId: 10,
        createdAt: '2024-12-10T14:00:00',
        content: '출석 확인됨. 장기결석 상태에서 출석 확인 처리.',
        createdBy: '김목사',
      },
      {
        logId: 12,
        memberId: 10,
        createdAt: '2024-11-10T10:00:00',
        content: '전화 연락 완료. 다음 주 참석 예정이라고 함.',
        createdBy: '김목사',
      },
    ],
  },
  11: {
    ...mockAttendedMembers[1],
    careLogs: [
      {
        logId: 13,
        memberId: 11,
        createdAt: '2024-12-12T15:30:00',
        content: '출석 확인됨. 관심필요 상태에서 출석 확인 처리.',
        createdBy: '박목사',
      },
      {
        logId: 14,
        memberId: 11,
        createdAt: '2024-12-05T11:00:00',
        content: '전화 통화 완료. 개인 사정으로 잠시 휴식 중이었으나 이제 참석 가능하다고 함.',
        createdBy: '박목사',
      },
    ],
  },
  12: {
    ...mockAttendedMembers[2],
    careLogs: [
      {
        logId: 15,
        memberId: 12,
        createdAt: '2024-12-08T16:00:00',
        content: '출석 확인됨. 장기결석 상태에서 출석 확인 처리.',
        createdBy: '이목사',
      },
      {
        logId: 16,
        memberId: 12,
        createdAt: '2024-11-20T09:00:00',
        content: '심방 완료. 건강 문제로 출석 어려웠으나 이제 회복되어 참석 가능.',
        createdBy: '이목사',
      },
    ],
  },
}

function AbsenteeManagePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<CareLevel | 'ALL'>('ALL')
  const [members, setMembers] = useState<CareMember[]>([])
  const [summary, setSummary] = useState<CareSummary>({ 
    longTermAbsenceCount: 0, 
    needsAttentionCount: 0,
    attendedCount: 0 
  })
  const [loading, setLoading] = useState(false)
  const [selectedMember, setSelectedMember] = useState<CareMemberDetail | null>(null)
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [newLogContent, setNewLogContent] = useState('')
  const [editingLogId, setEditingLogId] = useState<number | null>(null)
  const [editingLogContent, setEditingLogContent] = useState('')
  const [openMenuLogId, setOpenMenuLogId] = useState<number | null>(null)
  const [currentUserName] = useState<string>(() => {
    // 개발 모드에서는 임시 사용자 이름 사용
    if (import.meta.env.DEV) {
      return localStorage.getItem('currentUserName') || '현재 사용자'
    }
    // 프로덕션에서는 백엔드에서 가져와야 함
    return localStorage.getItem('currentUserName') || '사용자'
  })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('absenteeSettings')
    if (saved) {
      const parsed = JSON.parse(saved)
      // 기존 일 단위 데이터를 주 단위로 변환 (하위 호환성)
      if (parsed.needsAttentionDays && !parsed.needsAttentionWeeks) {
        return {
          needsAttentionWeeks: Math.ceil(parsed.needsAttentionDays / 7),
          longTermAbsenceWeeks: Math.ceil(parsed.longTermAbsenceDays / 7),
          resettlementWeeks: Math.ceil(parsed.resettlementDays / 7),
        }
      }
      return parsed
    }
    return {
      needsAttentionWeeks: 2, // 관심필요 기간 (주)
      longTermAbsenceWeeks: 8, // 장기결석 기간 (주)
      resettlementWeeks: 1, // 재정착 기간 (주)
    }
  })

  // 초기 로드 및 탭 변경 시 데이터 가져오기
  useEffect(() => {
    loadData()
  }, [activeTab])

  // 요약 정보 로드
  useEffect(() => {
    loadSummary()
  }, [])

  // 모달 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (isSidePanelOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isSidePanelOpen])

  const loadSummary = async () => {
    try {
      const data = await getCareSummary()
      setSummary(data)
    } catch (error) {
      console.error('요약 정보 로드 실패:', error)
      // 개발 모드: 임시 데이터 사용
      if (import.meta.env.DEV) {
        setSummary({
          longTermAbsenceCount: mockLongTermAbsenceMembers.length + 1, // 재결석 케이스 포함
          needsAttentionCount: mockNeedsAttentionMembers.length + 1, // 재결석 케이스 포함
          attendedCount: mockAttendedMembers.length,
        })
      }
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'ALL') {
        // 전체 탭: 모든 멤버 가져오기
        const [needsAttention, longTerm, attended] = await Promise.all([
          getCareMembers('NEEDS_ATTENTION'),
          getCareMembers('LONG_TERM_ABSENCE'),
          getAttendedMembers(),
        ])
        setMembers([...needsAttention, ...longTerm, ...attended])
      } else if (activeTab === 'ATTENDED') {
        const data = await getAttendedMembers()
        setMembers(data)
      } else {
        const data = await getCareMembers(activeTab)
        setMembers(data)
      }
    } catch (error) {
      console.error('멤버 목록 로드 실패:', error)
      // 개발 모드: 임시 데이터 사용
      if (import.meta.env.DEV) {
        if (activeTab === 'ALL') {
          setMembers([
            ...mockNeedsAttentionMembers,
            ...mockLongTermAbsenceMembers,
            ...mockReAbsenceMembers,
            ...mockAttendedMembers,
          ])
        } else if (activeTab === 'LONG_TERM_ABSENCE') {
          setMembers([...mockLongTermAbsenceMembers, mockReAbsenceMembers[1]])
        } else if (activeTab === 'NEEDS_ATTENTION') {
          setMembers([...mockNeedsAttentionMembers, mockReAbsenceMembers[0]])
        } else if (activeTab === 'ATTENDED') {
          setMembers(mockAttendedMembers)
        } else {
          setMembers([])
        }
      } else {
        setMembers([])
      }
    } finally {
      setLoading(false)
    }
  }

  // 상세 관리 버튼 클릭
  const handleManageClick = async (memberId: number) => {
    try {
      const detail = await getCareMemberDetail(memberId)
      setSelectedMember(detail)
      setIsSidePanelOpen(true)
    } catch (error) {
      console.error('멤버 상세 정보 로드 실패:', error)
      // 개발 모드: 임시 데이터 사용
      if (import.meta.env.DEV && mockMemberDetails[memberId]) {
        setSelectedMember(mockMemberDetails[memberId])
        setIsSidePanelOpen(true)
      } else {
        alert('멤버 정보를 불러오는데 실패했습니다.')
      }
    }
  }


  // 로그 추가
  const handleAddLog = async () => {
    if (!selectedMember || !newLogContent.trim()) {
      alert('로그 내용을 입력해주세요.')
      return
    }

    try {
      const newLog = await addCareLog(selectedMember.memberId, newLogContent)
      // 타임라인에 새 로그 추가
      setSelectedMember({
        ...selectedMember,
        careLogs: [newLog, ...selectedMember.careLogs],
      })
      setNewLogContent('')
    } catch (error) {
      console.error('로그 추가 실패:', error)
      // 개발 모드: 로컬에서만 추가
      if (import.meta.env.DEV) {
        const newLog: CareLog = {
          logId: Date.now(),
          memberId: selectedMember.memberId,
          createdAt: new Date().toISOString(),
          content: newLogContent,
          createdBy: currentUserName,
        }
        setSelectedMember({
          ...selectedMember,
          careLogs: [newLog, ...selectedMember.careLogs],
        })
        setNewLogContent('')
      } else {
        alert('로그 추가에 실패했습니다.')
      }
    }
  }

  // 로그 수정 시작
  const handleStartEditLog = (log: CareLog) => {
    setEditingLogId(log.logId)
    setEditingLogContent(log.content)
    setOpenMenuLogId(null)
  }

  // 메뉴 토글
  const handleToggleMenu = (logId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenMenuLogId(openMenuLogId === logId ? null : logId)
  }

  // 메뉴 닫기
  const handleCloseMenu = () => {
    setOpenMenuLogId(null)
  }

  // 로그 수정 취소
  const handleCancelEditLog = () => {
    setEditingLogId(null)
    setEditingLogContent('')
  }

  // 로그 수정 저장
  const handleSaveEditLog = async (logId: number) => {
    if (!selectedMember || !editingLogContent.trim()) {
      alert('로그 내용을 입력해주세요.')
      return
    }

    try {
      const updatedLog = await updateCareLog(selectedMember.memberId, logId, editingLogContent)
      setSelectedMember({
        ...selectedMember,
        careLogs: selectedMember.careLogs.map((log) => (log.logId === logId ? updatedLog : log)),
      })
      setEditingLogId(null)
      setEditingLogContent('')
    } catch (error) {
      console.error('로그 수정 실패:', error)
      // 개발 모드: 로컬에서만 수정
      if (import.meta.env.DEV) {
        setSelectedMember({
          ...selectedMember,
          careLogs: selectedMember.careLogs.map((log) =>
            log.logId === logId ? { ...log, content: editingLogContent } : log
          ),
        })
        setEditingLogId(null)
        setEditingLogContent('')
      } else {
        alert('로그 수정에 실패했습니다.')
      }
    }
  }

  // 로그 삭제
  const handleDeleteLog = async (logId: number) => {
    if (!selectedMember) return

    if (!confirm('이 로그를 삭제하시겠습니까?')) {
      return
    }

    try {
      await deleteCareLog(selectedMember.memberId, logId)
      setSelectedMember({
        ...selectedMember,
        careLogs: selectedMember.careLogs.filter((log) => log.logId !== logId),
      })
    } catch (error) {
      console.error('로그 삭제 실패:', error)
      // 개발 모드: 로컬에서만 삭제
      if (import.meta.env.DEV) {
        setSelectedMember({
          ...selectedMember,
          careLogs: selectedMember.careLogs.filter((log) => log.logId !== logId),
        })
      } else {
        alert('로그 삭제에 실패했습니다.')
      }
    }
  }

  // 로그 작성자 확인
  const isLogAuthor = (log: CareLog) => {
    return log.createdBy === currentUserName
  }


  // CareLevel 표시 텍스트
  const getLevelLabel = (level: CareLevel) => {
    if (level === 'LONG_TERM_ABSENCE') return '장기결석'
    if (level === 'NEEDS_ATTENTION') return '관심필요'
    if (level === 'ATTENDED') return '재정착'
    return ''
  }

  // CareLevel 색상
  const getLevelColor = (level: CareLevel) => {
    if (level === 'LONG_TERM_ABSENCE') return 'bg-red-100 text-red-700 border-red-200'
    if (level === 'NEEDS_ATTENTION') return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    if (level === 'ATTENDED') return 'bg-green-100 text-green-700 border-green-200'
    return ''
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // 날짜 시간 포맷팅
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* 헤더 */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              ← 돌아가기
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-xl">
                💝
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">결석자 관리</p>
                <p className="text-xs text-slate-500">장기결석자 케어 및 관리</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            설정
          </button>
        </header>

        {/* 요약 카드 */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">관심필요</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">{summary.needsAttentionCount}명</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">장기결석</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{summary.longTermAbsenceCount}명</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">재정착</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{summary.attendedCount || 0}명</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'ALL'
                  ? 'bg-slate-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('NEEDS_ATTENTION')}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'NEEDS_ATTENTION'
                  ? 'bg-yellow-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              관심필요
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('LONG_TERM_ABSENCE')}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'LONG_TERM_ABSENCE'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              장기결석
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ATTENDED')}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'ATTENDED'
                  ? 'bg-green-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              재정착
            </button>
          </div>
        </div>

        {/* 멤버 목록 테이블 */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">로딩 중...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">해당 상태의 멤버가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">상태</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">이름</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">전화번호</th>
                    {activeTab === 'ATTENDED' ? (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">출석 확인일</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">이전 상태</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">결석 시작일</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">경과일</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {members.map((member) => (
                    <tr
                      key={member.memberId}
                      onClick={() => handleManageClick(member.memberId)}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${getLevelColor(
                            member.level
                          )}`}
                        >
                          {getLevelLabel(member.level)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{member.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{member.phone || '-'}</td>
                      {activeTab === 'ALL' ? (
                        <>
                          {member.level === 'ATTENDED' ? (
                            <>
                              <td className="px-4 py-3 text-sm text-slate-600">{formatDate(member.absenceStartDate)}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {member.managerName || '-'}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3 text-sm text-slate-600">{formatDate(member.absenceStartDate)}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{member.daysAbsent}일</td>
                            </>
                          )}
                        </>
                      ) : activeTab === 'ATTENDED' ? (
                        <>
                          <td className="px-4 py-3 text-sm text-slate-600">{formatDate(member.absenceStartDate)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {member.managerName || '-'}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm text-slate-600">{formatDate(member.absenceStartDate)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{member.daysAbsent}일</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 설정 모달 */}
        {isSettingsOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setIsSettingsOpen(false)}
          >
            <div 
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 rounded-t-2xl">
                <h3 className="text-lg font-semibold text-slate-900">기간 설정</h3>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 모달 내용 */}
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    관심필요 기간 (주)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.needsAttentionWeeks}
                    onChange={(e) => setSettings({ ...settings, needsAttentionWeeks: parseInt(e.target.value) || 2 })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <p className="text-xs text-slate-500">결석 시작 후 이 기간이 지나면 관심필요 상태로 분류됩니다.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    장기결석 기간 (주)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.longTermAbsenceWeeks}
                    onChange={(e) => setSettings({ ...settings, longTermAbsenceWeeks: parseInt(e.target.value) || 8 })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <p className="text-xs text-slate-500">결석 시작 후 이 기간이 지나면 장기결석 상태로 분류됩니다.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    재정착 기간 (주)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.resettlementWeeks}
                    onChange={(e) => setSettings({ ...settings, resettlementWeeks: parseInt(e.target.value) || 1 })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <p className="text-xs text-slate-500">설정된 주 동안 출석 시 목록에서 삭제되는 기간입니다.</p>
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('absenteeSettings', JSON.stringify(settings))
                    setIsSettingsOpen(false)
                    alert('설정이 저장되었습니다.')
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 모달 */}
        {isSidePanelOpen && selectedMember && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={handleCloseMenu}
          >
            <div 
              className="w-full max-w-2xl h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 flex-shrink-0 rounded-t-2xl">
                <h3 className="text-lg font-semibold text-slate-900">상세 관리</h3>
                <button
                  type="button"
                  onClick={() => setIsSidePanelOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 모달 내용 */}
              <div className="flex-1 flex flex-col overflow-hidden p-6">
                {/* 기본 정보 */}
                <div className="flex-shrink-0 mb-6">
                  <h4 className="mb-4 text-base font-semibold text-slate-900">기본 정보</h4>
                  <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500">이름</p>
                      <p className="text-base font-semibold text-slate-900">{selectedMember.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500">상태</p>
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getLevelColor(
                          selectedMember.level
                        )}`}
                      >
                        {getLevelLabel(selectedMember.level)}
                      </span>
                    </div>
                    {selectedMember.phone && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">연락처</p>
                        <p className="text-sm font-medium text-slate-700">{selectedMember.phone}</p>
                      </div>
                    )}
                    {selectedMember.email && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">이메일</p>
                        <p className="text-sm font-medium text-slate-700">{selectedMember.email}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500">결석 시작일</p>
                      <p className="text-sm font-medium text-slate-700">{formatDate(selectedMember.absenceStartDate)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500">경과일</p>
                      <p className="text-sm font-medium text-slate-700">{selectedMember.daysAbsent}일</p>
                    </div>
                  </div>
                </div>

                {/* 케어 활동 로그 - 스크롤 가능 */}
                <div className="flex-1 flex flex-col min-h-0 mb-6">
                  <h4 className="mb-3 text-sm font-semibold text-slate-900 flex-shrink-0">케어 활동 로그</h4>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {selectedMember.careLogs.length === 0 ? (
                      <p className="text-sm text-slate-500">로그가 없습니다.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedMember.careLogs.map((log) => (
                          <div 
                            key={log.logId} 
                            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 space-y-1">
                                  <p className="text-xs text-slate-500">{formatDateTime(log.createdAt)}</p>
                                  {editingLogId === log.logId ? (
                                    <div className="space-y-2 mt-2">
                                      <textarea
                                        value={editingLogContent}
                                        onChange={(e) => setEditingLogContent(e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        rows={3}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleSaveEditLog(log.logId)
                                          }}
                                          className="rounded px-3 py-1 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
                                        >
                                          저장
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleCancelEditLog()
                                          }}
                                          className="rounded px-3 py-1 text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300"
                                        >
                                          취소
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-sm text-slate-700 leading-relaxed">{log.content}</p>
                                      <p className="text-xs text-slate-400">작성자: {log.createdBy}</p>
                                    </>
                                  )}
                                </div>
                                {isLogAuthor(log) && editingLogId !== log.logId && (
                                  <div className="relative flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => handleToggleMenu(log.logId, e)}
                                      className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                                    >
                                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                      </svg>
                                    </button>
                                    {openMenuLogId === log.logId && (
                                      <div className="absolute right-0 top-8 z-10 w-32 rounded-lg border border-slate-200 bg-white shadow-lg">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleStartEditLog(log)
                                          }}
                                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
                                        >
                                          수정
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteLog(log.logId)
                                            setOpenMenuLogId(null)
                                          }}
                                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                                        >
                                          삭제
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 새 로그 작성 */}
                <div className="flex-shrink-0 border-t border-slate-200 pt-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-900">새 로그 작성</h4>
                  <textarea
                    value={newLogContent}
                    onChange={(e) => setNewLogContent(e.target.value)}
                    placeholder="케어 활동 내용을 입력하세요..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={4}
                  />
                  <button
                    type="button"
                    onClick={handleAddLog}
                    className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    기록하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AbsenteeManagePage
