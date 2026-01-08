import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Schedule {
  id: string
  title: string
  date: string
  time: string
  type: '예배' | '행사' | '모임' | '기타'
  location: string
  description: string
  isRepeating?: boolean
  repeatType?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  repeatEndDate?: string
  createAlbum?: boolean
  shareScope?: 'loggedIn' | 'guest' | 'private'
}

interface AttendanceInfo {
  totalCount: number
  presentCount: number
  absentCount: number
  attendanceList: {
    memberId: string
    name: string
    status: 'PRESENT' | 'ABSENT'
    attendanceTime?: string
  }[]
}

interface AlbumInfo {
  id: string
  title: string
  date: string
  thumbnail: string
  photoCount: number
}

// 임시 데이터
const initialSchedules: Schedule[] = [
  {
    id: '1',
    title: '주일예배',
    date: '2024-12-15',
    time: '11:00',
    type: '예배',
    location: '본당',
    description: '청년부 주일예배',
    shareScope: 'loggedIn',
  },
  {
    id: '2',
    title: '순모임',
    date: '2024-12-16',
    time: '19:00',
    type: '모임',
    location: '각 순별 장소',
    description: '주간 순모임',
    shareScope: 'loggedIn',
  },
  {
    id: '3',
    title: '연말 특별예배',
    date: '2024-12-31',
    time: '22:00',
    type: '예배',
    location: '본당',
    description: '2024년 마지막 예배',
    shareScope: 'guest',
  },
  {
    id: '4',
    title: '청년부 수련회',
    date: '2025-01-05',
    time: '09:00',
    type: '행사',
    location: '수양관',
    description: '신년 수련회',
    shareScope: 'private',
  },
]

// 일정별 출석 정보 임시 데이터
const mockAttendanceData: Record<string, AttendanceInfo> = {
  '1': {
    totalCount: 50,
    presentCount: 45,
    absentCount: 5,
    attendanceList: [
      { memberId: '1', name: '김청년', status: 'PRESENT', attendanceTime: '2024-12-15T11:05:00' },
      { memberId: '2', name: '이청년', status: 'PRESENT', attendanceTime: '2024-12-15T11:02:00' },
      { memberId: '3', name: '박청년', status: 'PRESENT', attendanceTime: '2024-12-15T11:10:00' },
      { memberId: '4', name: '최청년', status: 'ABSENT' },
      { memberId: '5', name: '정청년', status: 'PRESENT', attendanceTime: '2024-12-15T11:00:00' },
    ],
  },
  '4': {
    totalCount: 40,
    presentCount: 38,
    absentCount: 2,
    attendanceList: [
      { memberId: '1', name: '김청년', status: 'PRESENT', attendanceTime: '2025-01-05T09:00:00' },
      { memberId: '2', name: '이청년', status: 'PRESENT', attendanceTime: '2025-01-05T08:55:00' },
      { memberId: '3', name: '박청년', status: 'PRESENT', attendanceTime: '2025-01-05T09:10:00' },
    ],
  },
}

// 일정별 앨범 정보 임시 데이터
const mockAlbumData: Record<string, AlbumInfo[]> = {
  '1': [
    {
      id: '1',
      title: '2024년 12월 주일예배',
      date: '2024-12-15',
      thumbnail: 'https://via.placeholder.com/200x150?text=주일예배',
      photoCount: 15,
    },
  ],
  '4': [
    {
      id: '6',
      title: '청년부 수련회 2025',
      date: '2025-01-05',
      thumbnail: 'https://via.placeholder.com/200x150?text=수련회',
      photoCount: 50,
    },
  ],
}

function ScheduleManagePage() {
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [showModal, setShowModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [formData, setFormData] = useState<Omit<Schedule, 'id'>>({
    title: '',
    date: selectedDate,
    time: '',
    type: '모임',
    location: '',
    description: '',
    isRepeating: false,
    repeatType: 'none',
    repeatEndDate: '',
    createAlbum: false,
    shareScope: 'loggedIn',
  })
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [showMenuForSchedule, setShowMenuForSchedule] = useState<string | null>(null)

  const currentDate = new Date(selectedDate)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // 달력 생성
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  // 항상 6주(42일)를 표시하기 위한 빈 셀 계산
  const totalCells = 42 // 7일 * 6주
  const emptyCellsAfter = totalCells - firstDay - daysInMonth

  const getSchedulesForDate = (date: string) => {
    // 일정관리페이지에서는 모든 일정(비공개 포함)을 표시
    return schedules.filter((s) => s.date === date)
  }

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
    setFormData((prev) => ({ ...prev, date: dateStr }))
  }

  const handleCreateSchedule = () => {
    setEditingSchedule(null)
    setFormData({
      title: '',
      date: selectedDate,
      time: '',
      type: '모임',
      location: '',
      description: '',
      isRepeating: false,
      repeatType: 'none',
      repeatEndDate: '',
      createAlbum: false,
      shareScope: 'loggedIn',
    })
    setShowModal(true)
  }

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setFormData({
      title: schedule.title,
      date: schedule.date,
      time: schedule.time,
      type: schedule.type,
      location: schedule.location,
      description: schedule.description,
      isRepeating: schedule.isRepeating || false,
      repeatType: schedule.repeatType || 'none',
      repeatEndDate: schedule.repeatEndDate || '',
      createAlbum: schedule.createAlbum || false,
      shareScope: schedule.shareScope || 'loggedIn',
    })
    setShowModal(true)
  }

  const handleViewSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setShowDetailModal(true)
    setShowMenuForSchedule(null)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = weekdays[date.getDay()]
    return `${year}년 ${month}월 ${day}일 (${weekday})`
  }

  const handleDeleteSchedule = (id: string) => {
    if (confirm('일정을 삭제하시겠습니까?')) {
      setSchedules(schedules.filter((s) => s.id !== id))
    }
  }

  const handleSaveSchedule = () => {
    if (!formData.title || !formData.date || !formData.time) {
      alert('제목, 날짜, 시간을 모두 입력해주세요.')
      return
    }

    if (editingSchedule) {
      setSchedules(schedules.map((s) => (s.id === editingSchedule.id ? { ...editingSchedule, ...formData } : s)))
    } else {
      const newSchedule: Schedule = {
        id: Date.now().toString(),
        ...formData,
      }
      setSchedules([...schedules, newSchedule])
    }
    setShowModal(false)
  }

  const changeMonth = (delta: number) => {
    const newDate = new Date(year, month + delta, 1)
    const newYear = newDate.getFullYear()
    const newMonth = newDate.getMonth() + 1
    const dateStr = `${newYear}-${String(newMonth).padStart(2, '0')}-01`
    setSelectedDate(dateStr)
  }

  const handleYearMonthSelect = () => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
    setSelectedDate(dateStr)
    setShowDatePicker(false)
  }

  const typeColors: Record<Schedule['type'], string> = {
    예배: 'bg-blue-100 text-blue-700',
    행사: 'bg-purple-100 text-purple-700',
    모임: 'bg-emerald-100 text-emerald-700',
    기타: 'bg-slate-100 text-slate-700',
  }

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenuForSchedule) {
        setShowMenuForSchedule(null)
      }
    }
    if (showMenuForSchedule) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMenuForSchedule])

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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-xl">
                📅
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">일정 관리</p>
                <p className="text-xs text-slate-500">예배 및 행사 일정</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreateSchedule}
            className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + 일정 추가
          </button>
        </header>

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
                <button
                  type="button"
                  onClick={() => {
                    setSelectedYear(year)
                    setSelectedMonth(month + 1)
                    setShowDatePicker(true)
                  }}
                  className="text-lg font-bold text-slate-900 hover:text-blue-600"
                >
                  {year}년 {month + 1}월
                </button>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  →
                </button>
              </div>

              {/* 요일 헤더 */}
              <div className="mb-2 grid grid-cols-7 gap-1">
                {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                  <div key={day} className="p-2 text-center text-xs font-semibold text-slate-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-1">
                {/* 첫 주 빈 셀 */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-before-${i}`} className="aspect-square" />
                ))}
                {/* 실제 날짜 셀 */}
                {days.map((day) => {
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
                      } ${isToday ? 'font-bold text-blue-600' : 'text-slate-700'}`}
                    >
                      <div className="mb-1">{day}</div>
                      <div className="space-y-0.5">
                        {daySchedules.slice(0, 2).map((schedule) => (
                          <div
                            key={schedule.id}
                            className={`truncate rounded px-1 py-0.5 text-[10px] ${typeColors[schedule.type]}`}
                          >
                            {schedule.title}
                          </div>
                        ))}
                        {daySchedules.length > 2 && (
                          <div className="text-[10px] text-slate-400">+{daySchedules.length - 2}</div>
                        )}
                      </div>
                    </button>
                  )
                })}
                {/* 마지막 주 빈 셀 (항상 6주가 되도록) */}
                {Array.from({ length: emptyCellsAfter }).map((_, i) => (
                  <div key={`empty-after-${i}`} className="aspect-square" />
                ))}
              </div>
            </div>
          </div>

          {/* 선택된 날짜의 일정 목록 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">
              {selectedDate} 일정
            </h3>
            <div className="space-y-2">
              {getSchedulesForDate(selectedDate).length === 0 ? (
                <p className="text-xs text-slate-400">등록된 일정이 없습니다.</p>
              ) : (
                getSchedulesForDate(selectedDate).map((schedule) => (
                  <div
                    key={schedule.id}
                    className="group relative rounded-lg border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleViewSchedule(schedule)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeColors[schedule.type]}`}>
                            {schedule.type}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">{schedule.title}</span>
                          {schedule.shareScope === 'private' && (
                            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-slate-200 text-slate-600">
                              비공개
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">{schedule.time}</p>
                        <p className="text-xs text-slate-500">{schedule.location}</p>
                        {schedule.description && (
                          <p className="mt-1 text-xs text-slate-400">{schedule.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMenuForSchedule(showMenuForSchedule === schedule.id ? null : schedule.id)
                        }}
                        className="rounded px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        ⋮
                      </button>
                    </div>
                    {showMenuForSchedule === schedule.id && (
                      <div className="absolute right-2 top-10 z-10 rounded-lg border border-slate-200 bg-white shadow-lg">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowMenuForSchedule(null)
                            handleEditSchedule(schedule)
                          }}
                          className="block w-full rounded-t-lg px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowMenuForSchedule(null)
                            handleDeleteSchedule(schedule.id)
                          }}
                          className="block w-full rounded-b-lg px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 일정 추가/수정 모달 */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">날짜</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">시간</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">유형</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Schedule['type'] })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="예배">예배</option>
                    <option value="행사">행사</option>
                    <option value="모임">모임</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">장소</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="장소"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={3}
                    placeholder="일정 설명"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">일정 반복</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isRepeating || false}
                        onChange={(e) => setFormData({ ...formData, isRepeating: e.target.checked, repeatType: e.target.checked ? 'weekly' : 'none' })}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-700">반복 일정으로 설정</span>
                    </label>
                    {formData.isRepeating && (
                      <div className="ml-6 space-y-2">
                        <select
                          value={formData.repeatType || 'none'}
                          onChange={(e) => setFormData({ ...formData, repeatType: e.target.value as Schedule['repeatType'] })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        >
                          <option value="none">반복 없음</option>
                          <option value="daily">매일</option>
                          <option value="weekly">매주</option>
                          <option value="monthly">매월</option>
                          <option value="yearly">매년</option>
                        </select>
                        <div>
                          <label className="mb-1 block text-xs text-slate-600">반복 종료일</label>
                          <input
                            type="date"
                            value={formData.repeatEndDate || ''}
                            onChange={(e) => setFormData({ ...formData, repeatEndDate: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">앨범 생성</label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.createAlbum || false}
                      onChange={(e) => setFormData({ ...formData, createAlbum: e.target.checked })}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">이 일정에 대한 앨범 자동 생성</span>
                  </label>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">공유 범위</label>
                  <select
                    value={formData.shareScope || 'loggedIn'}
                    onChange={(e) => setFormData({ ...formData, shareScope: e.target.value as Schedule['shareScope'] })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="loggedIn">로그인한 사용자만</option>
                    <option value="guest">로그인하지 않은 사용자도</option>
                    <option value="private">비공개 (일정관리페이지에서만 표시)</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
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
        )}

        {/* 일정 상세보기 모달 */}
        {showDetailModal && selectedSchedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">일정 상세보기</h3>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-6">
                {/* 일정 기본 정보 */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="space-y-6">
                    <div>
                      <div className="mb-3 flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${typeColors[selectedSchedule.type]}`}>
                          {selectedSchedule.type}
                        </span>
                        {selectedSchedule.shareScope === 'private' && (
                          <span className="rounded-full px-2 py-1 text-xs font-semibold bg-slate-200 text-slate-600">
                            비공개
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedSchedule.title}</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">날짜</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(selectedSchedule.date)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">시간</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{selectedSchedule.time}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">장소</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{selectedSchedule.location}</p>
                    </div>
                    {selectedSchedule.description && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">설명</p>
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                          {selectedSchedule.description}
                        </p>
                      </div>
                    )}
                    {selectedSchedule.isRepeating && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">반복 설정</p>
                        <p className="mt-2 text-sm text-slate-700">
                          {selectedSchedule.repeatType === 'daily' && '매일'}
                          {selectedSchedule.repeatType === 'weekly' && '매주'}
                          {selectedSchedule.repeatType === 'monthly' && '매월'}
                          {selectedSchedule.repeatType === 'yearly' && '매년'}
                          {selectedSchedule.repeatEndDate && ` (종료일: ${selectedSchedule.repeatEndDate})`}
                        </p>
                      </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">앨범 생성</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {selectedSchedule.createAlbum ? '예' : '아니오'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">공유 범위</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {selectedSchedule.shareScope === 'loggedIn' && '로그인한 사용자만'}
                          {selectedSchedule.shareScope === 'guest' && '로그인하지 않은 사용자도'}
                          {selectedSchedule.shareScope === 'private' && '비공개'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 출석 정보 */}
                {mockAttendanceData[selectedSchedule.id] && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-slate-900">출석 정보</h2>
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                            출석 {mockAttendanceData[selectedSchedule.id].presentCount}명
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                            결석 {mockAttendanceData[selectedSchedule.id].absentCount}명
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-600">
                        총 <span className="font-semibold text-slate-900">{mockAttendanceData[selectedSchedule.id].totalCount}명</span> 중{' '}
                        <span className="font-semibold text-blue-600">{mockAttendanceData[selectedSchedule.id].presentCount}명</span> 출석
                      </p>
                    </div>
                    {mockAttendanceData[selectedSchedule.id].attendanceList.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-700">출석자 목록</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {mockAttendanceData[selectedSchedule.id].attendanceList.map((record) => (
                            <div
                              key={record.memberId}
                              className={`rounded-lg border p-3 ${
                                record.status === 'PRESENT'
                                  ? 'border-blue-200 bg-blue-50'
                                  : 'border-slate-200 bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-900">{record.name}</span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    record.status === 'PRESENT'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {record.status === 'PRESENT' ? '출석' : '결석'}
                                </span>
                              </div>
                              {record.attendanceTime && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {new Date(record.attendanceTime).toLocaleTimeString('ko-KR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 연결된 앨범 */}
                {mockAlbumData[selectedSchedule.id] && mockAlbumData[selectedSchedule.id].length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-bold text-slate-900">연결된 앨범</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {mockAlbumData[selectedSchedule.id].map((album) => (
                        <button
                          key={album.id}
                          onClick={() => navigate(`/youth-album/${album.id}`)}
                          className="group rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
                        >
                          <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-slate-100">
                            <img
                              src={album.thumbnail}
                              alt={album.title}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="mb-1 text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                              {album.title}
                            </h3>
                            <p className="text-xs text-slate-500">{album.date}</p>
                            <p className="mt-2 text-xs text-slate-400">사진 {album.photoCount}장</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!mockAttendanceData[selectedSchedule.id] && (!mockAlbumData[selectedSchedule.id] || mockAlbumData[selectedSchedule.id].length === 0) && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-center text-sm text-slate-500">
                      이 일정에 연결된 출석 정보나 앨범이 없습니다.
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailModal(false)
                    handleEditSchedule(selectedSchedule)
                  }}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 년월 선택 모달 */}
        {showDatePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">년월 선택</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">년도</label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    min={2000}
                    max={2100}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">월</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {m}월
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleYearMonthSelect}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  확인
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









