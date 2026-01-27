import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { 
  Schedule, 
  ScheduleType, 
  SharingScope, 
  RecurrenceRule, 
  UpdateType,
  WorshipCategory,
  CreateScheduleRequest,
  UpdateScheduleRequest
} from '../types/schedule'
import type { Member } from '../types/member'
import { scheduleService } from '../services/scheduleService'
import { getMembers } from '../services/memberService'
import { getAlbumDetail, getFileUrl, type AlbumDetail } from '../services/albumService'

// UI용 폼 데이터 인터페이스
interface ScheduleFormData {
  title: string
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  type: ScheduleType
  location: string
  content: string
  recurrenceRule: RecurrenceRule
  recurrenceEndDate: string // YYYY-MM-DD
  sharingScope: SharingScope
  worshipCategory?: string
  createAlbum: boolean
}

const initialFormData: ScheduleFormData = {
  title: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  type: 'MEETING',
  location: '',
  content: '',
  recurrenceRule: 'NONE',
  recurrenceEndDate: '',
  sharingScope: 'LOGGED_IN_USERS',
  worshipCategory: undefined,
  createAlbum: false,
}

const typeColors: Record<ScheduleType, string> = {
  WORSHIP: 'bg-blue-100 text-blue-700',
  EVENT: 'bg-purple-100 text-purple-700',
  MEETING: 'bg-emerald-100 text-emerald-700',
}

const typeLabels: Record<ScheduleType, string> = {
  WORSHIP: '예배',
  EVENT: '행사',
  MEETING: '모임',
}

function ScheduleManagePage() {
  const navigate = useNavigate()
  
  // Data States
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [worshipCategories, setWorshipCategories] = useState<WorshipCategory[]>([])
  
  // UI States
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [showModal, setShowModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [formData, setFormData] = useState<ScheduleFormData>(initialFormData)
  
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [linkedAlbum, setLinkedAlbum] = useState<AlbumDetail | null>(null)

  useEffect(() => {
    if (selectedSchedule?.linkedAlbumId) {
      getAlbumDetail(selectedSchedule.linkedAlbumId)
        .then(setLinkedAlbum)
        .catch((err) => {
          console.error('Failed to load linked album:', err)
          setLinkedAlbum(null)
        })
    } else {
      setLinkedAlbum(null)
    }
  }, [selectedSchedule])
  
  // 반복 일정 처리 모달 상태
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false)
  const [recurrenceAction, setRecurrenceAction] = useState<'UPDATE' | 'DELETE' | null>(null)
  const [pendingActionData, setPendingActionData] = useState<{ id: number; data?: UpdateScheduleRequest; originalStartDate?: string } | null>(null)
  
  // 반복 일정 수정 시, 사용자가 선택한 범위(THIS_ONLY | FUTURE | ALL)를 저장하는 상태
  const [selectedUpdateType, setSelectedUpdateType] = useState<UpdateType | null>(null)

  // 삭제 확인 모달 상태
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null)

  // 필터 상태
  const [selectedFilters, setSelectedFilters] = useState<ScheduleType[]>([])

  const toggleFilter = (type: ScheduleType) => {
    setSelectedFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  // 명단 관리 모달 상태
  const [showMemberManageModal, setShowMemberManageModal] = useState(false)
  const [memberManageMode, setMemberManageMode] = useState<'ADD' | 'REMOVE' | null>(null)
  const [availableMembers, setAvailableMembers] = useState<Member[]>([])
  const [selectedMemberIdsForManage, setSelectedMemberIdsForManage] = useState<number[]>([])
  const [memberSearchKeyword, setMemberSearchKeyword] = useState('')
  const [memberListLoading, setMemberListLoading] = useState(false)

  // Loading & Error
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentDate = new Date(selectedDate)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // 달력 생성
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  
  // 이전 달의 마지막 날짜들
  const emptyCellsBefore = firstDay
  
  // 다음 달의 시작 날짜들 (총 6주 = 42일 채우기 위함)
  const totalCells = emptyCellsBefore + daysInMonth
  // 35칸(5주)으로 충분한 경우와 42칸(6주)이 필요한 경우 분기
  const totalSlots = totalCells <= 35 ? 35 : 42
  const emptyCellsAfter = totalSlots - totalCells

  // 반복 일정 여부 확인 헬퍼
  const isRecurringSchedule = (schedule: Schedule | null) => {
    if (!schedule) return false
    return schedule.recurrenceRule && schedule.recurrenceRule !== 'NONE'
  }

  // 초기 데이터 로드
  useEffect(() => {
    fetchWorshipCategories()
  }, [])

  // 월 변경 시 일정 로드
  useEffect(() => {
    fetchSchedules(year, month + 1)
  }, [year, month])

  const fetchWorshipCategories = async () => {
    try {
      const categories = await scheduleService.getWorshipCategories()
      console.log('Worship Categories loaded:', categories)
      setWorshipCategories(categories)
    } catch (err) {
      console.error('Failed to fetch worship categories:', err)
    }
  }

  const fetchSchedules = async (y: number, m: number) => {
    setLoading(true)
    try {
      const data = await scheduleService.getSchedules(y, m)
      setSchedules(data)
    } catch (err) {
      setError('일정을 불러오는데 실패했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const changeMonth = (delta: number) => {
    const newDate = new Date(year, month + delta, 1)
    const newYear = newDate.getFullYear()
    const newMonth = newDate.getMonth() + 1
    const dateStr = `${newYear}-${String(newMonth).padStart(2, '0')}-01`
    setSelectedDate(dateStr)
  }

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
    setFormData((prev) => ({ ...prev, startDate: dateStr, endDate: dateStr }))
  }

  const getSchedulesForDate = (dateStr: string) => {
    return schedules.filter((s) => {
      const sDate = s.startDate.split('T')[0]
      const eDate = s.endDate.split('T')[0]
      const matchesDate = dateStr >= sDate && dateStr <= eDate
      const matchesType =
        selectedFilters.length === 0 || selectedFilters.includes(s.type)
      return matchesDate && matchesType
    })
  }

  const handleCreateSchedule = () => {
    setEditingSchedule(null)
    setSelectedUpdateType(null) // 초기화
    setFormData({
      ...initialFormData,
      startDate: selectedDate,
      endDate: selectedDate,
      startTime: '10:00',
      endTime: '11:00',
    })
    setShowModal(true)
  }

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setSelectedUpdateType(null) // 초기화
    
    // Parse start/end date time
    const start = new Date(schedule.startDate)
    const end = new Date(schedule.endDate)
    
    setFormData({
      title: schedule.title,
      startDate: schedule.startDate.split('T')[0],
      endDate: schedule.endDate.split('T')[0],
      startTime: start.toTimeString().slice(0, 5),
      endTime: end.toTimeString().slice(0, 5),
      type: schedule.type,
      location: schedule.location || '',
      content: schedule.content || '',
      recurrenceRule: schedule.recurrenceRule,
      recurrenceEndDate: schedule.recurrenceEndDate || '',
      sharingScope: schedule.sharingScope,
      worshipCategory: schedule.worshipCategory,
      createAlbum: false,
    })

    // 반복 일정이라면 "먼저" 범위를 선택하게 함
    if (isRecurringSchedule(schedule)) {
      setRecurrenceAction('UPDATE')
      setPendingActionData({ 
        id: schedule.scheduleId, 
        originalStartDate: schedule.startDate.split('T')[0]
        // data는 아직 없음 (수정 전)
      })
      setShowRecurrenceModal(true)
    } else {
      setShowModal(true)
    }
  }

  const handleViewSchedule = async (schedule: Schedule) => {
    // 먼저 기존 정보로 모달 띄우기 (UX 반응성)
    setSelectedSchedule(schedule)
    setShowDetailModal(true)
    
    try {
      // 상세 정보 조회 (앨범 ID, 출석 명단 등)
      const detail = await scheduleService.getScheduleDetail(schedule.scheduleId)
      setSelectedSchedule(detail)
    } catch (err) {
      console.error('Failed to fetch schedule detail:', err)
      // 실패해도 기존 정보는 보여줌
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const year = date.getFullYear()
    const m = date.getMonth() + 1
    const d = date.getDate()
    const weekday = weekdays[date.getDay()]
    return `${year}년 ${m}월 ${d}일 (${weekday})`
  }

  // 일정 저장 (생성/수정)
  const handleSaveSchedule = async () => {
    if (!formData.title || !formData.startDate || !formData.endDate || !formData.startTime || !formData.endTime) {
      alert('제목, 날짜, 시간을 모두 입력해주세요.')
      return
    }

    const startDate = `${formData.startDate}T${formData.startTime}:00`
    const endDate = `${formData.endDate}T${formData.endTime}:00`

    // Basic request payload
    const requestData: CreateScheduleRequest = {
      title: formData.title,
      content: formData.content,
      startDate,
      endDate,
      type: formData.type,
      location: formData.location,
      sharingScope: formData.sharingScope,
      worshipCategory: formData.type === 'WORSHIP' ? formData.worshipCategory : undefined,
      recurrenceRule: formData.recurrenceRule,
      recurrenceEndDate: formData.recurrenceRule !== 'NONE' ? formData.recurrenceEndDate : undefined,
      createAlbum: formData.createAlbum,
    }

    try {
      if (editingSchedule) {
        // 수정 로직
        const updateData: UpdateScheduleRequest = {
          ...requestData,
        }
        
        // 반복 일정인 경우 처리
        if (isRecurringSchedule(editingSchedule)) {
          // 이미 handleEditSchedule -> RecurrenceModal에서 선택된 범위가 있어야 함
          if (selectedUpdateType) {
            const finalUpdateData: UpdateScheduleRequest = {
              ...updateData,
              updateType: selectedUpdateType,
              targetDate: editingSchedule.startDate.split('T')[0]
            }
            await scheduleService.updateSchedule(editingSchedule.scheduleId, finalUpdateData)
          } else {
             // 예외 상황: 범위 선택 없이 저장됨 (혹은 비반복 -> 반복 전환 시?)
             // 기존 로직: 그냥 저장 (혹은 에러 처리)
             console.warn('반복 일정 수정인데 범위가 선택되지 않았습니다. 기본 업데이트로 진행합니다.')
             await scheduleService.updateSchedule(editingSchedule.scheduleId, updateData)
          }
        } else {
          // 반복 일정이 아닌 경우 바로 수정
          await scheduleService.updateSchedule(editingSchedule.scheduleId, updateData)
        }
      } else {
        // 생성 로직
        await scheduleService.createSchedule(requestData)
      }

      // 성공 시
      setShowModal(false)
      fetchSchedules(year, month + 1)
      setSelectedUpdateType(null)
    } catch (err) {
      console.error(err)
      alert('일정 저장 중 오류가 발생했습니다.')
    }
  }

  // 일정 삭제 (삭제 확인 모달 띄우기)
  const handleDeleteClick = (schedule: Schedule) => {
    setScheduleToDelete(schedule)
    setShowDeleteConfirmModal(true)
  }

  // 삭제 확인 후 실제 처리
  const handleConfirmDelete = () => {
    if (!scheduleToDelete) return
    
    const schedule = scheduleToDelete
    setShowDeleteConfirmModal(false)

    if (isRecurringSchedule(schedule)) {
      setRecurrenceAction('DELETE')
      // 반복 일정 삭제 시에도 targetDate는 해당 일정의 시작 날짜
      const originalStartDate = schedule.startDate.split('T')[0]
      setPendingActionData({ 
        id: schedule.scheduleId,
        originalStartDate: originalStartDate
      })
      setShowRecurrenceModal(true)
    } else {
      // 일반 삭제
      scheduleService.deleteSchedule(schedule.scheduleId)
        .then(() => {
          setShowDetailModal(false)
          fetchSchedules(year, month + 1)
        })
        .catch((err) => {
          console.error(err)
          alert('삭제 실패')
        })
    }
    // scheduleToDelete 초기화는 비동기 처리 완료 후 혹은 모달 닫힐 때 적절히 수행
    // 여기서는 로직 분기 후 바로 초기화해도 무방 (Recurrence 모달 등에서 별도 state 사용)
    setScheduleToDelete(null)
  }

  // 반복 일정 처리 모달 확인 핸들러
  const handleRecurrenceConfirm = async (updateType: UpdateType) => {
    if (!pendingActionData) return

    try {
      // 수정/삭제하려는 일정의 기준 날짜 (YYYY-MM-DD)
      const targetDate = pendingActionData.originalStartDate

      if (recurrenceAction === 'UPDATE') {
        // 데이터가 없으면 "수정 전 범위 선택" 단계임
        if (!pendingActionData.data) {
           setSelectedUpdateType(updateType)
           setShowRecurrenceModal(false)
           setShowModal(true)
           return
        }
        
        // (구) 저장 시점 확인 로직 - 현재 흐름상 도달하지 않아야 함
        const updateData: UpdateScheduleRequest = {
          ...pendingActionData.data!,
          updateType,
          targetDate
        }
        await scheduleService.updateSchedule(pendingActionData.id, updateData)
      } else if (recurrenceAction === 'DELETE') {
        await scheduleService.deleteSchedule(pendingActionData.id, updateType, targetDate)
      }

      setShowRecurrenceModal(false)
      setShowModal(false)
      setShowDetailModal(false)
      setPendingActionData(null)
      setRecurrenceAction(null)
      setSelectedUpdateType(null)
      
      // 목록 갱신
      fetchSchedules(year, month + 1)
    } catch (err) {
      console.error(err)
      alert('요청 처리 중 오류가 발생했습니다.')
    }
  }

  // --- 명단 관리 핸들러 ---

  // 추가 가능한 멤버 목록 조회
  const fetchAvailableMembers = async (keyword?: string, mode?: 'ADD' | 'REMOVE') => {
    if (!selectedSchedule) return
    
    const targetMode = mode || memberManageMode
    setMemberListLoading(true)
    
    try {
      if (targetMode === 'REMOVE') {
        // 삭제 모드: 현재 참석자 중에서 검색
        let attendees = selectedSchedule.attendees || []
        if (keyword) {
          attendees = attendees.filter(a => a.name.includes(keyword))
        }
        
        // ScheduleAttendee -> Member 변환
        const mappedMembers: Member[] = attendees.map(a => ({
          memberId: a.memberId,
          name: a.name,
          phone: a.phoneNumber || '',
          roles: ['MEMBER'],
          gender: 'MALE',
          birthDate: '',
          memberStatus: 'ACTIVE',
          memberImageUrl: null,
          hasAccount: false,
          age: 0
        }))
        setAvailableMembers(mappedMembers)
      } else {
        // 추가 모드: 전체 멤버 중 미참석자 검색
        // 1. 전체 멤버 조회 (검색어 적용)
        const response = await getMembers({ 
          page: 0, 
          size: 1000, 
          sort: 'name,asc',
          keyword: keyword,
          status: 'ACTIVE'
        })
        
        const allMembers = response.content
        
        // 2. 이미 등록된 멤버 제외
        const currentAttendeeIds = selectedSchedule.attendees?.map(a => a.memberId) || []
        const filtered = allMembers.filter(m => !currentAttendeeIds.includes(m.memberId))
        
        setAvailableMembers(filtered)
      }
    } catch (err) {
      console.error('Failed to fetch members:', err)
      alert('멤버 목록을 불러오는데 실패했습니다.')
    } finally {
      setMemberListLoading(false)
    }
  }

  // 명단 추가 모달 열기
  const handleOpenMemberAdd = () => {
    if (!selectedSchedule) return
    
    setMemberSearchKeyword('')
    setMemberManageMode('ADD')
    setSelectedMemberIdsForManage([])
    setShowMemberManageModal(true)
    fetchAvailableMembers('', 'ADD')
  }

  // 명단 삭제 모달 열기
  const handleOpenMemberRemove = () => {
    if (!selectedSchedule) return
    
    setMemberSearchKeyword('')
    setMemberManageMode('REMOVE')
    setSelectedMemberIdsForManage([])
    setShowMemberManageModal(true)
    fetchAvailableMembers('', 'REMOVE')
  }

  // 멤버 검색 핸들러
  const handleSearchMembers = (e: React.FormEvent) => {
    e.preventDefault()
    fetchAvailableMembers(memberSearchKeyword)
  }

  // 멤버 선택 토글
  const toggleMemberSelection = (memberId: number) => {
    if (memberManageMode === 'REMOVE') {
      // 이미 출석한 멤버인지 확인 (attendees에서 찾음)
      const attendee = selectedSchedule?.attendees?.find(a => a.memberId === memberId)
      if (attendee?.attended) {
        alert('이미 출석 체크된 인원은 제외할 수 없습니다.')
        return
      }
    }

    setSelectedMemberIdsForManage(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  // 명단 저장 (추가/삭제)
  const handleSaveMemberManage = async () => {
    if (!selectedSchedule || !memberManageMode) return

    try {
      const selectedIds = selectedMemberIdsForManage
      
      if (selectedIds.length === 0) {
        setShowMemberManageModal(false)
        return
      }

      if (memberManageMode === 'ADD') {
        await scheduleService.registerScheduleMembers(selectedSchedule.scheduleId, selectedIds)
        alert('명단이 추가되었습니다.')
      } else {
        await scheduleService.removeScheduleAttendees(selectedSchedule.scheduleId, selectedIds)
        alert('명단이 삭제되었습니다.')
      }
      
      // 성공 후 데이터 갱신
      const detail = await scheduleService.getScheduleDetail(selectedSchedule.scheduleId)
      setSelectedSchedule(detail)
      
      setShowMemberManageModal(false)
    } catch (err: any) {
      console.error(err)
      alert(err.message || '요청 처리에 실패했습니다.')
    }
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl shadow-sm">
                🗓️
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">일정 관리</p>
                <p className="text-xs text-slate-500">예배 및 행사 일정 관리</p>
              </div>
            </div>
          </div>
        </header>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-semibold text-slate-700">일정 분류</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFilters([])}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedFilters.length === 0
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 ring-1 ring-slate-200'
                  }`}
                >
                  전체
                </button>
                {(['WORSHIP', 'EVENT', 'MEETING'] as ScheduleType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleFilter(type)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedFilters.includes(type)
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 ring-1 ring-slate-200'
                    }`}
                  >
                    {typeLabels[type]}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreateSchedule}
              className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              + 일정 추가
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 캘린더 */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {/* 월 네비게이션 */}
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ←
                </button>
                <h2 className="text-lg font-bold text-slate-900">
                  {year}년 {month + 1}월
                </h2>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  →
                </button>
              </div>

              {/* 요일 헤더 */}
              <div className="mb-2 grid grid-cols-7 text-center">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                  <div
                    key={day}
                    className={`text-xs font-semibold ${i === 0 ? 'text-rose-600' : 'text-slate-500'}`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-1">
                {/* 지난 달 빈 셀 */}
                {Array.from({ length: emptyCellsBefore }).map((_, i) => (
                  <div key={`empty-before-${i}`} className="aspect-square bg-slate-50/50" />
                ))}

                {/* 이번 달 날짜 */}
                {days.map((day, index) => {
                  // 전체 그리드 내에서의 인덱스 (빈 셀 포함)
                  const gridIndex = emptyCellsBefore + index
                  const isSunday = gridIndex % 7 === 0
                  
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const daySchedules = getSchedulesForDate(dateStr)
                  const isSelected = dateStr === selectedDate
                  const isToday = dateStr === new Date().toISOString().split('T')[0]

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDateClick(day)}
                      className={`aspect-square rounded-lg border p-1 text-left text-xs transition hover:bg-slate-50 ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                      } ${isToday ? 'font-bold text-blue-600' : isSunday ? 'text-rose-600' : 'text-slate-700'}`}
                    >
                      <div className="mb-1">{day}</div>
                      <div className="space-y-0.5 overflow-hidden">
                        {daySchedules.slice(0, 3).map((schedule) => (
                          <div
                            key={schedule.scheduleId}
                            className={`truncate rounded px-1 py-0.5 text-[10px] ${typeColors[schedule.type]}`}
                          >
                            {schedule.title}
                          </div>
                        ))}
                        {daySchedules.length > 3 && (
                          <div className="text-[10px] text-slate-400">+{daySchedules.length - 3}</div>
                        )}
                      </div>
                    </button>
                  )
                })}
                
                {/* 다음 달 빈 셀 */}
                {Array.from({ length: emptyCellsAfter }).map((_, i) => (
                  <div key={`empty-after-${i}`} className="aspect-square bg-slate-50/50" />
                ))}
              </div>
            </div>
          </div>

          {/* 선택된 날짜의 일정 목록 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm h-fit">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">
              {selectedDate} 일정
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {loading ? (
                <p className="text-center text-xs text-slate-400 py-4">로딩 중...</p>
              ) : error ? (
                <p className="text-center text-xs text-red-500 py-4">{error}</p>
              ) : getSchedulesForDate(selectedDate).length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">등록된 일정이 없습니다.</p>
              ) : (
                getSchedulesForDate(selectedDate).map((schedule) => (
                  <div
                    key={schedule.scheduleId}
                    className="group relative rounded-lg border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer transition"
                    onClick={() => handleViewSchedule(schedule)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeColors[schedule.type]}`}>
                            {typeLabels[schedule.type]}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">{schedule.title}</span>
                          {/* 예배 카테고리 표시 (숨김 처리) */}
                          {/* {schedule.worshipCategoryName && (
                            <span className="text-[10px] text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                              {schedule.worshipCategoryName}
                            </span>
                          )} */}
                          {isRecurringSchedule(schedule) && (
                            <span className="text-[10px] text-slate-500 border border-slate-200 rounded px-1">
                              반복
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">
                          {new Date(schedule.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ~ 
                          {new Date(schedule.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        <p className="text-xs text-slate-500">{schedule.location}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 일정 추가/수정 모달 */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {editingSchedule ? '일정 수정' : '일정 추가'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">제목</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="일정 제목"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">시작 날짜</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">종료 날짜</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">시작 시간</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">종료 시간</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">유형</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as ScheduleType })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="WORSHIP">예배</option>
                      <option value="EVENT">행사</option>
                      <option value="MEETING">모임</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">공개 범위</label>
                    <select
                      value={formData.sharingScope}
                      onChange={(e) => setFormData({ ...formData, sharingScope: e.target.value as SharingScope })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="PUBLIC">전체 공개</option>
                      <option value="LOGGED_IN_USERS">로그인 회원</option>
                      <option value="PRIVATE">비공개</option>
                    </select>
                  </div>
                </div>

                {/* 예배 카테고리 선택 (유형이 예배일 때만) */}
                {formData.type === 'WORSHIP' && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">예배 카테고리</label>
                    <select
                      value={formData.worshipCategory || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        setFormData((prev) => ({ 
                          ...prev, 
                          worshipCategory: value === "" ? undefined : value
                        }))
                      }}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">선택하세요</option>
                      {worshipCategories.map((cat) => (
                        <option key={cat.code} value={cat.code}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">장소</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="예: 본당, 소예배실"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">설명</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={3}
                    placeholder="일정 상세 설명"
                  />
                </div>

                {/* 반복 설정 */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">반복</label>
                    <select
                      value={formData.recurrenceRule}
                      onChange={(e) => setFormData({ ...formData, recurrenceRule: e.target.value as RecurrenceRule })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      disabled={!!editingSchedule} // 수정 시에는 반복 규칙 변경 제한
                    >
                      <option value="NONE">반복 없음</option>
                      <option value="DAILY">매일</option>
                      <option value="WEEKLY">매주</option>
                      <option value="MONTHLY">매월</option>
                      <option value="YEARLY">매년</option>
                    </select>
                  </div>
                  {formData.recurrenceRule !== 'NONE' && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">반복 종료일</label>
                      <input
                        type="date"
                        value={formData.recurrenceEndDate}
                        onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        disabled={!!editingSchedule}
                      />
                    </div>
                  )}
                </div>

                {/* 앨범 생성 옵션 (신규 생성 시에만 표시) */}
                {!editingSchedule && (
                  <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <input
                      type="checkbox"
                      id="createAlbum"
                      checked={formData.createAlbum}
                      onChange={(e) => setFormData({ ...formData, createAlbum: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="createAlbum" className="text-sm font-medium text-slate-700">
                      이 일정의 앨범도 함께 생성하기
                    </label>
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSchedule}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 일정 상세보기 모달 */}
        {showDetailModal && selectedSchedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg max-h-[90vh] flex flex-col">
              <div className="mb-4 flex items-center justify-between flex-shrink-0">
                <h3 className="text-lg font-semibold text-slate-900">일정 상세보기</h3>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                {/* 기본 정보 */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${typeColors[selectedSchedule.type]}`}>
                          {typeLabels[selectedSchedule.type]}
                        </span>
                        {/* 예배 카테고리 표시 (숨김 처리) */}
                        {/* {selectedSchedule.worshipCategoryName && (
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 rounded px-2 py-0.5">
                            {selectedSchedule.worshipCategoryName}
                          </span>
                        )} */}
                        {selectedSchedule.sharingScope === 'PRIVATE' && (
                          <span className="rounded-full px-2 py-1 text-xs font-semibold bg-slate-200 text-slate-600">
                            비공개
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedSchedule.title}</h2>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowDetailModal(false)
                          handleEditSchedule(selectedSchedule)
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteClick(selectedSchedule)}
                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-100"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">일시</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        {formatDate(selectedSchedule.startDate)}
                      </p>
                      <p className="text-sm text-slate-600">
                        {new Date(selectedSchedule.startDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} ~ 
                        {new Date(selectedSchedule.endDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">장소</p>
                      <p className="mt-2 text-base font-semibold text-slate-900">{selectedSchedule.location || '장소 미정'}</p>
                    </div>
                  </div>
                  
                  {selectedSchedule.content && (
                    <div className="mt-4 rounded-lg border border-slate-200 p-4">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedSchedule.content}</p>
                    </div>
                  )}
                </div>

                {/* 앨범 및 출석 정보 */}
                <div className="grid gap-6 sm:grid-cols-2">
                   {/* 앨범 연동 */}
                   <div className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                            📷
                          </div>
                          <h4 className="text-sm font-bold text-slate-900">앨범</h4>
                        </div>
                      </div>

                      {selectedSchedule.linkedAlbumId ? (
                        <div className="flex flex-col w-full">
                          {linkedAlbum && linkedAlbum.photos && linkedAlbum.photos.length > 0 ? (
                            <div className="grid grid-cols-3 gap-1 mb-3">
                              {linkedAlbum.photos.slice(0, 6).map((photo) => (
                                <div 
                                  key={photo.photoId}
                                  className="aspect-square cursor-pointer overflow-hidden rounded-md bg-slate-100"
                                  onClick={() => navigate(`/youth-album/${linkedAlbum.id}`)}
                                >
                                  <img 
                                    src={getFileUrl(photo.imageUrl)} 
                                    alt="앨범 사진" 
                                    className="h-full w-full object-cover transition hover:scale-105"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mb-3 text-xs text-slate-500">연동된 앨범이 있습니다.</p>
                          )}
                          <button
                            onClick={() => navigate(`/youth-album/${selectedSchedule.linkedAlbumId}`)}
                            className="mt-auto w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                          >
                            앨범 보러가기 →
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col h-32 items-center justify-center py-4">
                           <p className="text-xs text-slate-400">연동된 앨범이 없습니다.</p>
                        </div>
                      )}
                   </div>

                   {/* 출석 명단 */}
                   <div className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                             ✅
                           </div>
                           <h4 className="text-sm font-bold text-slate-900">
                             {selectedSchedule.type === 'WORSHIP' ? '출석 인원' : '출석 현황'}
                           </h4>
                         </div>
                         <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                           {selectedSchedule.type === 'WORSHIP' 
                             ? `${selectedSchedule.attendees?.length || 0}명`
                             : `${selectedSchedule.attendees?.filter(a => a.attended).length || 0} / ${selectedSchedule.attendees?.length || 0}명`
                           }
                         </span>
                      </div>
                      
                      <div className="flex flex-col w-full flex-1">
                        {selectedSchedule.attendees && selectedSchedule.attendees.length > 0 ? (
                          <ul className="max-h-60 overflow-y-auto grid grid-cols-2 gap-2 pr-1 custom-scrollbar mb-3">
                            {selectedSchedule.attendees.map(attendee => (
                              <li 
                                key={attendee.memberId} 
                                className={`flex items-center justify-center rounded-lg px-2 py-1.5 ${
                                  attendee.attended ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${attendee.attended ? 'text-blue-700' : 'text-slate-700'}`}>
                                    {attendee.name}
                                  </span>
                                  {attendee.attended && <span>✅</span>}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="flex h-32 flex-col items-center justify-center text-center mb-3">
                            <p className="text-xs text-slate-400">등록된 명단이 없습니다.</p>
                          </div>
                        )}

                        {/* WORSHIP이 아닐 때만 명단 추가/삭제 버튼 노출 */}
                        {selectedSchedule.type !== 'WORSHIP' && (
                          <div className="mt-auto mb-3 flex gap-2">
                            <button
                              onClick={handleOpenMemberAdd}
                              className="flex-1 rounded-lg border border-dashed border-slate-300 p-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition"
                            >
                              + 명단 추가
                            </button>
                            <button
                              onClick={handleOpenMemberRemove}
                              className="flex-1 rounded-lg border border-dashed border-slate-300 p-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-red-600 hover:border-red-300 transition"
                            >
                              - 명단 삭제
                            </button>
                          </div>
                        )}
  
                        {/* 출석표 보러가기 버튼 */}
                        <button
                          onClick={() => navigate(`/manage/attendance?scheduleId=${selectedSchedule.scheduleId}&date=${selectedSchedule.startDate.split('T')[0]}`)}
                          className={`w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition ${selectedSchedule.type === 'WORSHIP' ? 'mt-auto' : ''}`}
                        >
                          출석표 보러가기 →
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 삭제 확인 모달 */}
        {showDeleteConfirmModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  🗑️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">일정 삭제</h3>
                  <p className="text-xs text-slate-500">정말로 삭제하시겠습니까?</p>
                </div>
              </div>
              
              <p className="mb-6 text-sm text-slate-600">
                삭제된 일정은 복구할 수 없습니다.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false)
                    setScheduleToDelete(null)
                  }}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 반복 일정 처리 범위 선택 모달 */}
        {showRecurrenceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border-t-4 border-amber-500">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {recurrenceAction === 'UPDATE' ? '반복 일정 수정' : '반복 일정 삭제'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    이 일정은 반복되는 일정입니다.
                  </p>
                </div>
              </div>
              
              <p className="mb-6 text-sm text-slate-600">
                변경 사항을 어떻게 적용하시겠습니까?<br/>
                <span className="text-xs text-slate-400">선택한 날짜: {pendingActionData?.originalStartDate}</span>
              </p>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleRecurrenceConfirm('THIS_ONLY')}
                  className="group rounded-lg border border-slate-200 p-3 text-left transition hover:border-blue-500 hover:bg-blue-50"
                >
                  <span className="block text-sm font-semibold text-slate-700 group-hover:text-blue-700">
                    {recurrenceAction === 'UPDATE' ? '이번만 수정 ' : '이번만 삭제 '}
                  </span>
                  <span className="block text-xs text-slate-500 group-hover:text-blue-600">
                    {recurrenceAction === 'UPDATE' 
                      ? '클릭한 날짜의 일정만 변경' 
                      : '클릭한 날짜의 일정만 삭제'}
                  </span>
                </button>
                <button
                  onClick={() => handleRecurrenceConfirm('FUTURE')}
                  className="group rounded-lg border border-slate-200 p-3 text-left transition hover:border-blue-500 hover:bg-blue-50"
                >
                  <span className="block text-sm font-semibold text-slate-700 group-hover:text-blue-700">
                    {recurrenceAction === 'UPDATE' ? '이후 모든 일정' : '이후 모든 일정 삭제'}
                  </span>
                  <span className="block text-xs text-slate-500 group-hover:text-blue-600">
                    {recurrenceAction === 'UPDATE'
                      ? '클릭한 날짜부터 향후 일정 모두 변경'
                      : '클릭한 날짜부터 향후 일정 모두 삭제'}
                  </span>
                </button>
                <button
                  onClick={() => handleRecurrenceConfirm('ALL')}
                  className="group rounded-lg border border-slate-200 p-3 text-left transition hover:border-blue-500 hover:bg-blue-50"
                >
                  <span className="block text-sm font-semibold text-slate-700 group-hover:text-blue-700">
                    {recurrenceAction === 'UPDATE' ? '전체 수정' : '전체 삭제'}
                  </span>
                  <span className="block text-xs text-slate-500 group-hover:text-blue-600">
                    {recurrenceAction === 'UPDATE'
                      ? '과거 포함 모든 반복 내용 변경'
                      : '과거 포함 모든 반복 내용 삭제'}
                  </span>
                </button>
              </div>
              
              <button
                onClick={() => {
                  setShowRecurrenceModal(false)
                  setRecurrenceAction(null)
                  setPendingActionData(null)
                }}
                className="mt-4 w-full rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                취소
              </button>
            </div>
          </div>
        )}
        {/* 명단 관리 모달 */}
        {showMemberManageModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[80vh] flex flex-col">
              <h3 className="mb-4 text-lg font-bold text-slate-900">
                {memberManageMode === 'ADD' ? '명단 추가' : '명단 삭제'}
              </h3>
              
              {/* 검색 */}
              <form onSubmit={handleSearchMembers} className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={memberSearchKeyword}
                  onChange={(e) => setMemberSearchKeyword(e.target.value)}
                  placeholder="이름으로 검색..."
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
                >
                  검색
                </button>
              </form>

              {/* 목록 */}
              <div className="flex-1 overflow-y-auto border rounded-lg border-slate-200 p-2 mb-4">
                {memberListLoading ? (
                  <div className="py-8 text-center text-xs text-slate-400">로딩 중...</div>
                ) : availableMembers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    멤버가 없습니다.
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {availableMembers.map((member) => {
                       const isSelected = selectedMemberIdsForManage.includes(member.memberId)
                       const isRemoveMode = memberManageMode === 'REMOVE'
                       
                       // 출석 여부 확인 (삭제 모드일 때만 체크)
                       const attendee = selectedSchedule?.attendees?.find(a => a.memberId === member.memberId)
                       const isAttended = isRemoveMode && attendee?.attended

                       const activeColorClass = isRemoveMode ? 'bg-red-50' : 'bg-blue-50'
                       const activeBorderClass = isRemoveMode ? 'border-red-500 bg-red-500' : 'border-blue-500 bg-blue-500'
                       
                       return (
                         <li
                           key={member.memberId}
                           className={`flex items-center gap-3 rounded-lg px-3 py-2 transition ${
                             isAttended 
                               ? 'cursor-not-allowed bg-slate-100 opacity-60' 
                               : `cursor-pointer hover:bg-slate-50 ${isSelected ? activeColorClass : ''}`
                           }`}
                           onClick={() => !isAttended && toggleMemberSelection(member.memberId)}
                         >
                           <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                              isAttended
                                ? 'border-slate-200 bg-slate-100'
                                : isSelected 
                                  ? `${activeBorderClass} text-white` 
                                  : 'border-slate-300 bg-white'
                           }`}>
                             {isSelected && !isAttended && (
                               <span className="text-xs">✓</span>
                             )}
                             {isAttended && (
                               <span className="text-xs">🔒</span>
                             )}
                           </div>
                           <div>
                             <div className="flex items-center gap-2">
                               <p className={`text-sm font-medium ${isAttended ? 'text-slate-500' : 'text-slate-900'}`}>
                                 {member.name}
                               </p>
                               {isAttended && (
                                 <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                                   출석완료
                                 </span>
                               )}
                             </div>
                             <p className="text-xs text-slate-500">{member.phone}</p>
                           </div>
                         </li>
                       )
                     })}
                  </ul>
                )}
              </div>

              {/* 하단 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMemberManageModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveMemberManage}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                    memberManageMode === 'ADD' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {memberManageMode === 'ADD' ? '추가' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScheduleManagePage
