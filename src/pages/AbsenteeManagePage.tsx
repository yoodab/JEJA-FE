import { useState, useEffect, useCallback, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatPhoneNumber } from '../utils/format'
import {
  type CareMember,
  type CareMemberDetail,
  type CareLog,
  type CareSummary,
  type CareSettings,
  type CareMethod,
  getCareMembers,
  getCareSummary,
  getCareMemberDetail,
  addCareLog,
  updateCareLog,
  deleteCareLog,
  getCareSettings,
  updateCareSettings,
  completeCare,
  updateManager,
} from '../services/absenteeService'

// Tab type definition matching API statuses where possible
type TabType = 'ALL' | 'NEEDS_ATTENTION' | 'LONG_TERM_ABSENCE' | 'ATTENDED'

function AbsenteeManagePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('ALL')
  const [members, setMembers] = useState<CareMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<CareMember[]>([])
  const [summary, setSummary] = useState<CareSummary>({ 
    resettlingCount: 0,
    longTermCount: 0, 
    needsAttentionCount: 0 
  })
  const [loading, setLoading] = useState(false)
  const [selectedMember, setSelectedMember] = useState<CareMemberDetail | null>(null)
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isBasicOpen, setIsBasicOpen] = useState(false)
  const [openMemberMenuId, setOpenMemberMenuId] = useState<number | null>(null)
  const [openMemberMenuTop, setOpenMemberMenuTop] = useState<number>(0)
  const [openMemberMenuLeft, setOpenMemberMenuLeft] = useState<number>(0)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('클립보드에 복사되었습니다.')
  }
  
  // Completion Modal
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false)
  const [completionType, setCompletionType] = useState<'COMPLETED' | 'STOPPED'>('COMPLETED')
  const [completionNote, setCompletionNote] = useState('')

  // Log Inputs
  const [newLogContent, setNewLogContent] = useState('')
  const [newLogMethod, setNewLogMethod] = useState<CareMethod>('전화')
  
  // Log Editing
  const [editingLogId, setEditingLogId] = useState<number | null>(null)
  const [editingLogContent, setEditingLogContent] = useState('')
  const [editingLogMethod, setEditingLogMethod] = useState<CareMethod>('전화')
  const [openMenuLogId, setOpenMenuLogId] = useState<number | null>(null)
  
  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<CareSettings>({
    attentionWeeks: 2,
    longTermWeeks: 8,
    resettlementWeeks: 4,
  })

  // Load Initial Data
  useEffect(() => {
    loadSummary()
    loadMembers()
    loadSettings()
  }, [])

  // Filter members when activeTab or members change
  const filterMembers = useCallback(() => {
    let filtered = members
    
    if (activeTab === 'NEEDS_ATTENTION') {
      filtered = members.filter(m => m.status === 'NEEDS_ATTENTION')
    } else if (activeTab === 'LONG_TERM_ABSENCE') {
      filtered = members.filter(m => m.status === 'LONG_TERM_ABSENCE')
    } else if (activeTab === 'ATTENDED') {
      filtered = members.filter(m => m.status === 'RESETTLING' || m.status === 'COMPLETED' || m.attendanceWeeks > 0)
    }
    // 'ALL' shows everyone
    
    setFilteredMembers(filtered)
  }, [activeTab, members])

  useEffect(() => {
    filterMembers()
  }, [filterMembers])

  // Body scroll lock for modal
  useEffect(() => {
    if (isSidePanelOpen || isSettingsOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isSidePanelOpen, isSettingsOpen])

  const loadSettings = async () => {
    try {
      const data = await getCareSettings()
      if (data) setSettings(data)
    } catch (error) {
      console.error('설정 로드 실패:', error)
    }
  }

  const loadSummary = async () => {
    try {
      const data = await getCareSummary()
      setSummary(data)
    } catch (error) {
      console.error('요약 정보 로드 실패:', error)
    }
  }

  const loadMembers = async () => {
    setLoading(true)
    try {
      const data = await getCareMembers()
      setMembers(data)
    } catch (error) {
      console.error('멤버 목록 로드 실패:', error)
      alert('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Settings Save
  const handleSaveSettings = async () => {
    try {
      await updateCareSettings(settings)
      setIsSettingsOpen(false)
      alert('설정이 저장되었습니다.')
      // Reload data as settings might affect statuses
      loadMembers()
      loadSummary()
    } catch (error) {
      console.error('설정 저장 실패:', error)
      alert('설정 저장에 실패했습니다.')
    }
  }

  // Manage Member Click
  const handleManageClick = async (memberId: number) => {
    try {
      const detail = await getCareMemberDetail(memberId)
      setSelectedMember(detail)
      setIsSidePanelOpen(true)
      setIsBasicOpen(false)
    } catch (error) {
      console.error('멤버 상세 정보 로드 실패:', error)
      alert('멤버 정보를 불러오는데 실패했습니다.')
    }
  }

  // Add Log
  const handleAddLog = async () => {
    if (!selectedMember || !newLogContent.trim()) {
      alert('로그 내용을 입력해주세요.')
      return
    }

    try {
      await addCareLog(selectedMember.currentInfo.memberId, newLogContent, newLogMethod)
      // Refresh detail
      const detail = await getCareMemberDetail(selectedMember.currentInfo.memberId)
      setSelectedMember(detail)
      setNewLogContent('')
      setNewLogMethod('전화')
    } catch (error) {
      console.error('로그 추가 실패:', error)
      alert('로그 추가에 실패했습니다.')
    }
  }

  // Edit Log
  const handleStartEditLog = (log: CareLog) => {
    setEditingLogId(log.logId)
    setEditingLogContent(log.content)
    setEditingLogMethod(log.careMethod)
    setOpenMenuLogId(null)
  }

  const handleSaveEditLog = async (logId: number) => {
    if (!selectedMember || !editingLogContent.trim()) {
      alert('로그 내용을 입력해주세요.')
      return
    }

    try {
      await updateCareLog(selectedMember.currentInfo.memberId, logId, editingLogContent, editingLogMethod)
      // Refresh detail
      const detail = await getCareMemberDetail(selectedMember.currentInfo.memberId)
      setSelectedMember(detail)
      setEditingLogId(null)
      setEditingLogContent('')
      setEditingLogMethod('전화')
    } catch (error) {
      console.error('로그 수정 실패:', error)
      alert('로그 수정에 실패했습니다.')
    }
  }

  const handleDeleteLog = async (logId: number) => {
    if (!selectedMember) return
    if (!confirm('이 로그를 삭제하시겠습니까?')) return

    try {
      await deleteCareLog(selectedMember.currentInfo.memberId, logId)
      // Refresh detail
      const detail = await getCareMemberDetail(selectedMember.currentInfo.memberId)
      setSelectedMember(detail)
    } catch (error) {
      console.error('로그 삭제 실패:', error)
      alert('로그 삭제에 실패했습니다.')
    }
  }

  // Handle Completion
  const handleOpenCompletionModal = () => {
    setCompletionType('COMPLETED')
    setCompletionNote('')
    setIsCompletionModalOpen(true)
  }

  const handleSubmitCompletion = async () => {
    if (!selectedMember) return
    if (!completionNote.trim()) {
      alert('종료 사유를 입력해주세요.')
      return
    }

    try {
      await completeCare(selectedMember.currentInfo.memberId, completionType, completionNote)
      alert('케어가 종료되었습니다.')
      setIsCompletionModalOpen(false)
      setIsSidePanelOpen(false)
      loadMembers()
      loadSummary()
    } catch (error) {
      console.error('케어 종료 실패:', error)
      alert('케어 종료 처리에 실패했습니다.')
    }
  }

  // UI Helpers
  const getLevelLabel = (status: string) => {
    if (status === 'LONG_TERM_ABSENCE') return '장기결석'
    if (status === 'NEEDS_ATTENTION') return '관심필요'
    if (status === 'RESETTLING') return '재정착'
    if (status === 'COMPLETED') return '정착완료'
    if (status === 'CARE_STOPPED') return '케어중단'
    return status
  }

  const getLevelColor = (status: string) => {
    if (status === 'LONG_TERM_ABSENCE') return 'bg-red-100 text-red-700 border-red-200'
    if (status === 'NEEDS_ATTENTION') return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    if (status === 'RESETTLING') return 'bg-green-100 text-green-700 border-green-200'
    if (status === 'COMPLETED') return 'bg-blue-100 text-blue-700 border-blue-200'
    if (status === 'CARE_STOPPED') return 'bg-gray-100 text-gray-700 border-gray-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const careMethods: CareMethod[] = ['전화', '심방', '문자', '기타']

  // Helper: unify log date field (careDate or createdAt)
  const getLogDate = (log: CareLog) => {
    // Some APIs return 'careDate' instead of 'createdAt'
    const logData = log as unknown as { careDate?: string }
    return logData.careDate || log.createdAt || ''
  }
  const getLogAuthor = (log: CareLog) => {
    const logData = log as unknown as { managerName?: string; createdBy?: string }
    return logData.managerName || logData.createdBy || ''
  }

  const openCompletionWithType = (type: 'COMPLETED' | 'STOPPED') => {
    setCompletionType(type)
    setCompletionNote('')
    setIsCompletionModalOpen(true)
  }
  const toggleMemberMenu = (memberId: number, e: MouseEvent) => {
    if (openMemberMenuId === memberId) {
      setOpenMemberMenuId(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const menuWidth = 160
    const menuHeight = 132
    const spaceBelow = viewportHeight - rect.bottom
    const placement = spaceBelow >= menuHeight + 8 ? 'down' : 'up'
    const left = Math.max(8, Math.min(rect.right - menuWidth, viewportWidth - menuWidth - 8))
    const top = placement === 'down' ? rect.bottom + 8 : rect.top - (menuHeight + 8)
    setOpenMemberMenuTop(top)
    setOpenMemberMenuLeft(left)
    setOpenMemberMenuId(memberId)
  }

  const handleAssignManager = async (memberId: number) => {
    const input = prompt('담당자 ID를 입력하세요')
    if (!input) return
    const newManagerId = parseInt(input, 10)
    if (Number.isNaN(newManagerId)) {
      alert('숫자 ID를 입력해주세요.')
      return
    }
    try {
      await updateManager(memberId, newManagerId)
      alert('담당자가 지정되었습니다.')
      setOpenMemberMenuId(null)
      loadMembers()
      loadSummary()
    } catch (error) {
      console.error('담당자 지정 실패:', error)
      alert('담당자 지정에 실패했습니다.')
    }
  }

  // Filter logs for current care period (compare date part only)
  const currentLogs = selectedMember
    ? selectedMember.logs.filter(log => {
        const dateStr = getLogDate(log)
        if (!dateStr) return false
        const datePart = dateStr.split('T')[0]
        return datePart >= selectedMember.currentInfo.startDate
      })
    : []

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              ←
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
            className="flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
            title="설정"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm text-center md:text-left">
            <p className="text-xs text-slate-500">관심필요</p>
            <p className="mt-1 text-xl md:text-2xl font-bold text-yellow-600">{summary.needsAttentionCount}명</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm text-center md:text-left">
            <p className="text-xs text-slate-500">장기결석</p>
            <p className="mt-1 text-xl md:text-2xl font-bold text-red-600">{summary.longTermCount}명</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm text-center md:text-left">
            <p className="text-xs text-slate-500">재정착</p>
            <p className="mt-1 text-xl md:text-2xl font-bold text-green-600">{summary.resettlingCount}명</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'ALL' ? 'bg-slate-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setActiveTab('NEEDS_ATTENTION')}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'NEEDS_ATTENTION' ? 'bg-yellow-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              관심필요
            </button>
            <button
              onClick={() => setActiveTab('LONG_TERM_ABSENCE')}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'LONG_TERM_ABSENCE' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              장기결석
            </button>
            <button
              onClick={() => setActiveTab('ATTENDED')}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'ATTENDED' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              재정착
            </button>
          </div>
        </div>

        {/* Members List */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm min-h-[360px] p-8 text-center text-sm text-slate-500">
            로딩 중...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm min-h-[360px] p-8 text-center text-sm text-slate-500">
            해당 상태의 멤버가 없습니다.
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.memberId}
                  onClick={() => handleManageClick(member.memberId)}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-slate-200 flex items-center justify-center cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setImagePreviewUrl(member.memberImageUrl || null)
                        }}
                      >
                        {member.memberImageUrl ? (
                          <img
                            src={member.memberImageUrl}
                            alt={member.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 font-bold">
                            {member.name?.[0] || '🙂'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-slate-900">{member.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getLevelColor(member.status)}`}>
                            {getLevelLabel(member.status)}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {member.status === 'RESETTLING' || member.status === 'COMPLETED' || member.attendanceWeeks > 0 ? (
                            <span className="text-green-600">출석 {member.attendanceWeeks}주차</span>
                          ) : (
                            <span className="text-red-600">결석 {member.absenceWeeks}주차</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleMemberMenu(member.memberId, e)
                        }}
                        className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-sm border-t border-slate-100 pt-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 mb-0.5">결석 시작일</span>
                      <span className="font-medium text-slate-700">{formatDate(member.startDate)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 mb-0.5">연락처</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${member.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-700 hover:text-blue-600 underline decoration-slate-300 underline-offset-2"
                        >
                          {formatPhoneNumber(member.phone || '')}
                        </a>
                        {member.phone && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(member.phone)
                            }}
                            className="text-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 hover:bg-slate-50"
                          >
                            복사
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm min-h-[360px]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">사진</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">이름</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">전화번호</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">결석 시작일</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">경과</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">메뉴</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredMembers.map((member) => (
                      <tr
                        key={member.memberId}
                        onClick={() => handleManageClick(member.memberId)}
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          {member.memberImageUrl ? (
                            <img
                              src={member.memberImageUrl}
                              alt={member.name}
                              className="h-10 w-10 rounded-xl object-cover border border-slate-200 cursor-zoom-in"
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setImagePreviewUrl(member.memberImageUrl || null)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setImagePreviewUrl(member.memberImageUrl || null)
                                }
                              }}
                            />
                          ) : (
                            <div
                              className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 text-sm font-bold cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setImagePreviewUrl('DEFAULT')
                              }}
                            >
                              {member.name?.[0] || '🙂'}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{member.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{member.phone || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{formatDate(member.startDate)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {member.status === 'RESETTLING' || member.status === 'COMPLETED' || member.attendanceWeeks > 0 ? (
                            <span className="text-green-600">출석 {member.attendanceWeeks}주차</span>
                          ) : (
                            <span>결석 {member.absenceWeeks}주차</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600" onClick={(e) => e.stopPropagation()}>
                          <div className="relative flex justify-end">
                            <button
                              onClick={(e) => toggleMemberMenu(member.memberId, e)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-500"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                            {/* menu rendered as fixed overlay below */}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Settings Modal */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsSettingsOpen(false)}>
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 rounded-t-2xl">
                <h3 className="text-lg font-semibold text-slate-900">기간 설정</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">관심필요 기간 (주)</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.attentionWeeks}
                    onChange={(e) => setSettings({ ...settings, attentionWeeks: parseInt(e.target.value) || 1 })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">장기결석 기간 (주)</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.longTermWeeks}
                    onChange={(e) => setSettings({ ...settings, longTermWeeks: parseInt(e.target.value) || 1 })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">재정착 기간 (주)</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.resettlementWeeks}
                    onChange={(e) => setSettings({ ...settings, resettlementWeeks: parseInt(e.target.value) || 1 })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-2xl">
                <button onClick={() => setIsSettingsOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200">취소</button>
                <button onClick={handleSaveSettings} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">저장</button>
              </div>
            </div>
          </div>
        )}

        {imagePreviewUrl && (
          <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 p-4" onClick={() => setImagePreviewUrl(null)}>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              {imagePreviewUrl === 'DEFAULT' ? (
                <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-slate-100 text-6xl font-bold text-slate-400 shadow-2xl border border-slate-200">
                  {selectedMember?.currentInfo.name?.[0] || '🙂'}
                </div>
              ) : (
                <img
                  src={imagePreviewUrl}
                  alt="미리보기"
                  className="max-h-[80vh] max-w-[80vw] rounded-2xl object-contain shadow-2xl border border-slate-200 bg-white"
                />
              )}
              <button
                className="absolute -top-3 -right-3 rounded-full bg-white/90 p-2 shadow border border-slate-200"
                onClick={() => setImagePreviewUrl(null)}
              >
                <svg className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        {openMemberMenuId !== null && (
          <div className="fixed inset-0 z-[70]" onClick={() => setOpenMemberMenuId(null)}>
            <div
              className="fixed z-[71] w-40 rounded-lg border border-slate-200 bg-white shadow-lg"
              style={{ top: openMemberMenuTop, left: openMemberMenuLeft }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { if (selectedMember) handleAssignManager(selectedMember.currentInfo.memberId); setOpenMemberMenuId(null); }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
              >
                담당자 지정
              </button>
              <button
                onClick={() => { openCompletionWithType('COMPLETED'); setOpenMemberMenuId(null); }}
                className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50"
              >
                케어 완료
              </button>
              <button
                onClick={() => { openCompletionWithType('STOPPED'); setOpenMemberMenuId(null); }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-b-lg"
              >
                케어 중단
              </button>
            </div>
          </div>
        )}
        {/* Detail Modal */}
        {isSidePanelOpen && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsSidePanelOpen(false)}>
            <div className="w-full max-w-2xl h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0 rounded-t-2xl">
                <h3 className="text-lg font-semibold text-slate-900">상세 관리</h3>
                <button onClick={() => setIsSidePanelOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="flex-1 flex flex-col overflow-hidden p-6">
                {/* Basic Info */}
                <div className="flex-shrink-0 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-slate-900">기본 정보</h4>
                    <button
                      onClick={() => setIsBasicOpen(prev => !prev)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      {isBasicOpen ? '접기' : '펼치기'}
                    </button>
                  </div>
                  {isBasicOpen ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {selectedMember.currentInfo.memberImageUrl ? (
                            <img
                              src={selectedMember.currentInfo.memberImageUrl}
                              alt={selectedMember.currentInfo.name}
                              className="h-20 w-20 rounded-xl object-cover border border-slate-200 cursor-zoom-in"
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImagePreviewUrl(selectedMember.currentInfo.memberImageUrl || null) }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setImagePreviewUrl(selectedMember.currentInfo.memberImageUrl || null)
                                }
                              }}
                            />
                          ) : (
                            <div
                              className="h-20 w-20 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 text-lg font-bold cursor-pointer"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImagePreviewUrl('DEFAULT') }}
                            >
                              {selectedMember.currentInfo.name?.[0] || '🙂'}
                            </div>
                          )}
                          <div>
                            <p className="text-lg font-bold text-slate-900">{selectedMember.currentInfo.name}</p>
                            <p className="text-sm font-medium text-slate-700">{selectedMember.currentInfo.phone || '-'}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getLevelColor(selectedMember.currentInfo.status)}`}>
                          {getLevelLabel(selectedMember.currentInfo.status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-slate-500">담당자</p>
                          <p className="text-sm font-medium text-slate-700">{selectedMember.currentInfo.managerName || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-slate-500">결석 시작일</p>
                          <p className="text-sm font-medium text-slate-700">{formatDate(selectedMember.currentInfo.startDate)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-slate-500">진행 상황</p>
                          <p className="text-sm font-medium text-slate-700">
                            {selectedMember.currentInfo.status === 'RESETTLING' || selectedMember.currentInfo.status === 'COMPLETED' || selectedMember.currentInfo.attendanceWeeks > 0
                              ? `출석 ${selectedMember.currentInfo.attendanceWeeks}주차` 
                              : `결석 ${selectedMember.currentInfo.absenceWeeks}주차`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {selectedMember.currentInfo.memberImageUrl ? (
                            <img
                              src={selectedMember.currentInfo.memberImageUrl}
                              alt={selectedMember.currentInfo.name}
                              className="h-14 w-14 rounded-xl object-cover border border-slate-200 cursor-zoom-in"
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImagePreviewUrl(selectedMember.currentInfo.memberImageUrl || null) }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setImagePreviewUrl(selectedMember.currentInfo.memberImageUrl || null)
                                }
                              }}
                            />
                          ) : (
                            <div
                              className="h-14 w-14 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 text-sm font-bold cursor-pointer"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImagePreviewUrl('DEFAULT') }}
                            >
                              {selectedMember.currentInfo.name?.[0] || '🙂'}
                            </div>
                          )}
                          <div>
                            <p className="text-base font-semibold text-slate-900">{selectedMember.currentInfo.name}</p>
                            <p className="text-sm font-medium text-slate-700">{selectedMember.currentInfo.phone || '-'}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getLevelColor(selectedMember.currentInfo.status)}`}>
                          {getLevelLabel(selectedMember.currentInfo.status)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* History Button */}
                {selectedMember.history && selectedMember.history.length > 0 && (
                  <div className="flex-shrink-0 mb-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">이전 케어 기록</h4>
                      <button 
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        이전 기록 보기 ({selectedMember.history.length})
                      </button>
                    </div>
                  </div>
                )}

                {/* Logs */}
                <div className="flex-1 flex flex-col min-h-0 mb-6">
                  <div className="flex items-center justify-between mb-3 flex-shrink-0">
                    <h4 className="text-sm font-semibold text-slate-900">케어 활동 로그</h4>
                    <span className="text-xs text-slate-500">현재 기간: {currentLogs.length}건</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {currentLogs.length === 0 ? (
                      <p className="text-sm text-slate-500">로그가 없습니다.</p>
                    ) : (
                      <div className="space-y-3">
                        {currentLogs.map((log) => (
                          <div key={log.logId} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-100">
                                    {log.careMethod}
                                  </span>
                              <p className="text-xs text-slate-500">{formatDateTime(getLogDate(log))}</p>
                                </div>
                                
                                {editingLogId === log.logId ? (
                                  <div className="space-y-2 mt-2">
                                    <div className="flex gap-2">
                                      {careMethods.map(method => (
                                        <label key={method} className="flex items-center text-xs">
                                          <input
                                            type="radio"
                                            name={`edit-care-method-${log.logId}`}
                                            checked={editingLogMethod === method}
                                            onChange={() => setEditingLogMethod(method)}
                                            className="mr-1"
                                          />
                                          {method}
                                        </label>
                                      ))}
                                    </div>
                                    <textarea
                                      value={editingLogContent}
                                      onChange={(e) => setEditingLogContent(e.target.value)}
                                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                      rows={3}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex gap-2">
                                      <button onClick={(e) => { e.stopPropagation(); handleSaveEditLog(log.logId); }} className="rounded px-3 py-1 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700">저장</button>
                                      <button onClick={(e) => { e.stopPropagation(); setEditingLogId(null); }} className="rounded px-3 py-1 text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300">취소</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{log.content}</p>
                                    <p className="text-xs text-slate-400">담당자: {getLogAuthor(log) || '-'}</p>
                                  </>
                                )}
                              </div>
                              
                              {/* Log Menu */}
                              {editingLogId !== log.logId && (
                                <div className="relative flex-shrink-0">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setOpenMenuLogId(openMenuLogId === log.logId ? null : log.logId); }}
                                    className="p-1 rounded hover:bg-slate-100 text-slate-500"
                                  >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                                  </button>
                                  {openMenuLogId === log.logId && (
                                    <div className="absolute right-0 top-8 z-10 w-32 rounded-lg border border-slate-200 bg-white shadow-lg">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleStartEditLog(log); }}
                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
                                      >
                                        수정
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteLog(log.logId); setOpenMenuLogId(null); }}
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
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* New Log Input */}
                <div className="flex-shrink-0 border-t border-slate-200 pt-3">
                  <h4 className="mb-2 text-sm font-semibold text-slate-900">새 로그 작성</h4>
                  <div className="mb-2 flex gap-3">
                    {careMethods.map(method => (
                      <label key={method} className="flex items-center text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="new-care-method"
                          checked={newLogMethod === method}
                          onChange={() => setNewLogMethod(method)}
                          className="mr-1 text-blue-600 focus:ring-blue-500"
                        />
                        {method}
                      </label>
                    ))}
                  </div>
                  <textarea
                    value={newLogContent}
                    onChange={(e) => setNewLogContent(e.target.value)}
                    placeholder="케어 활동 내용을 입력하세요..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    rows={3}
                  />
                  <button
                    onClick={handleAddLog}
                    className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    기록하기
                  </button>
                </div>
                
                {/* Completion Action */}
                {selectedMember.currentInfo.status !== 'COMPLETED' && selectedMember.currentInfo.status !== 'CARE_STOPPED' && (
                  <div className="flex-shrink-0 pt-4 mt-2 border-t border-slate-100">
                    <button
                      onClick={handleOpenCompletionModal}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>🏁</span> 케어 완료 / 중단 처리
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Completion Modal */}
        {isCompletionModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setIsCompletionModalOpen(false)}>
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 rounded-t-2xl">
                <h3 className="text-lg font-semibold text-slate-900">케어 종료 처리</h3>
                <button onClick={() => setIsCompletionModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">종료 유형</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 transition-all ${completionType === 'COMPLETED' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="completionType" className="hidden" checked={completionType === 'COMPLETED'} onChange={() => setCompletionType('COMPLETED')} />
                      <span className="font-bold">정착 완료 (성공)</span>
                    </label>
                    <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 transition-all ${completionType === 'STOPPED' ? 'border-slate-500 bg-slate-100 text-slate-700 ring-1 ring-slate-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="completionType" className="hidden" checked={completionType === 'STOPPED'} onChange={() => setCompletionType('STOPPED')} />
                      <span className="font-bold">케어 중단 (종료)</span>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    {completionType === 'COMPLETED' ? '종료 코멘트' : '중단 사유'}
                  </label>
                  <textarea
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    placeholder={completionType === 'COMPLETED' ? "정착 과정이나 특이사항을 입력하세요." : "케어를 중단하는 구체적인 사유를 입력하세요."}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-2xl">
                <button onClick={() => setIsCompletionModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200">취소</button>
                <button 
                  onClick={handleSubmitCompletion} 
                  className={`rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm ${completionType === 'COMPLETED' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-600 hover:bg-slate-700'}`}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {isHistoryModalOpen && selectedMember && selectedMember.history && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setIsHistoryModalOpen(false)}>
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 rounded-t-2xl">
                <h3 className="text-lg font-semibold text-slate-900">이전 케어 기록</h3>
                <button onClick={() => setIsHistoryModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="space-y-6">
                  {selectedMember.history.map((h) => {
                    const historyLogs = selectedMember.logs.filter(log => {
                      const dateStr = getLogDate(log)
                      if (!dateStr) return false
                      const logDate = dateStr.split('T')[0]
                      return (!h.startDate || logDate >= h.startDate) && (!h.endDate || logDate <= h.endDate)
                    })

                    return (
                      <div key={h.historyId} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                        {/* Header */}
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${h.status === 'CARE_STOPPED' ? 'text-slate-600' : 'text-blue-600'}`}>
                                {h.status === 'COMPLETED' ? '정착 완료' : h.status === 'CARE_STOPPED' ? '케어 중단' : h.status}
                              </span>
                              <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{h.period}</span>
                            </div>
                            <span className="text-xs font-medium text-slate-500">담당: {h.managerName}</span>
                          </div>
                          
                          {/* Closing Note */}
                          {h.closingNote ? (
                            <div className="mt-2 text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                              <span className="text-xs font-semibold text-slate-400 block mb-1">종료 사유</span>
                              {h.closingNote}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic mt-1">종료 사유 없음</p>
                          )}
                        </div>

                        {/* Logs */}
                        <div className="px-4 py-3 bg-white">
                          <p className="text-xs font-semibold text-slate-500 mb-3">당시 활동 로그 ({historyLogs.length})</p>
                          {historyLogs.length > 0 ? (
                            <div className="space-y-3 pl-2 border-l-2 border-slate-100">
                              {historyLogs.map(log => (
                                <div key={log.logId} className="relative pl-4 pb-1">
                                  <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-slate-300 ring-2 ring-white"></div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-slate-500">{(getLogDate(log) || '').split('T')[0]}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">{log.careMethod}</span>
                                  </div>
                                  <p className="text-sm text-slate-700">{log.content}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400">기록된 로그가 없습니다.</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="border-t border-slate-200 px-6 py-4 rounded-b-2xl bg-slate-50 flex justify-end">
                <button onClick={() => setIsHistoryModalOpen(false)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AbsenteeManagePage
