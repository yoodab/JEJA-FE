import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Schedule {
  id: string
  title: string
  date: string
  time: string
  type: '예배' | '행사' | '모임' | '기타'
  location: string
  description: string
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
  },
  {
    id: '2',
    title: '순모임',
    date: '2024-12-16',
    time: '19:00',
    type: '모임',
    location: '각 순별 장소',
    description: '주간 순모임',
  },
  {
    id: '3',
    title: '연말 특별예배',
    date: '2024-12-31',
    time: '22:00',
    type: '예배',
    location: '본당',
    description: '2024년 마지막 예배',
  },
  {
    id: '4',
    title: '청년부 수련회',
    date: '2025-01-05',
    time: '09:00',
    type: '행사',
    location: '수양관',
    description: '신년 수련회',
  },
]

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
  })

  const currentDate = new Date(selectedDate)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // 달력 생성
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const getSchedulesForDate = (date: string) => {
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
    })
    setShowModal(true)
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
    setSelectedDate(newDate.toISOString().split('T')[0])
  }

  const typeColors: Record<Schedule['type'], string> = {
    예배: 'bg-blue-100 text-blue-700',
    행사: 'bg-purple-100 text-purple-700',
    모임: 'bg-emerald-100 text-emerald-700',
    기타: 'bg-slate-100 text-slate-700',
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
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
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Schedule</p>
              <p className="text-sm font-semibold text-slate-900">일정 관리</p>
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
              <div className="mb-2 grid grid-cols-7 gap-1">
                {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                  <div key={day} className="p-2 text-center text-xs font-semibold text-slate-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
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
                    className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeColors[schedule.type]}`}>
                            {schedule.type}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">{schedule.title}</span>
                        </div>
                        <p className="text-xs text-slate-600">{schedule.time}</p>
                        <p className="text-xs text-slate-500">{schedule.location}</p>
                        {schedule.description && (
                          <p className="mt-1 text-xs text-slate-400">{schedule.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditSchedule(schedule)}
                          className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          삭제
                        </button>
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
      </div>
    </div>
  )
}

export default ScheduleManagePage







