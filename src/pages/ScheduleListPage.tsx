import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import { isLoggedIn as checkLoggedIn } from '../utils/auth'
import { getSchedules } from '../services/scheduleService'
import type { Schedule } from '../types/schedule'
import ScheduleDetailModal from '../components/schedule/ScheduleDetailModal'

const typeColors: Record<string, string> = {
  WORSHIP: 'bg-blue-100 text-blue-700',
  EVENT: 'bg-purple-100 text-purple-700',
  MEETING: 'bg-emerald-100 text-emerald-700',
  ETC: 'bg-slate-100 text-slate-700',
}

const typeLabels: Record<string, string> = {
  WORSHIP: '예배',
  EVENT: '행사',
  MEETING: '모임',
  ETC: '기타',
}

function ScheduleListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [isLoggedIn] = useState(checkLoggedIn)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  
  // Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null)
  const [selectedTargetDate, setSelectedTargetDate] = useState<string | null>(null)

  // Handle query parameters for direct modal opening
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const scheduleId = params.get('scheduleId')
    const date = params.get('date')

    if (scheduleId && date) {
      if (!isLoggedIn) {
        toast.error('로그인이 필요한 서비스입니다.')
        return
      }
      setSelectedScheduleId(Number(scheduleId))
      setSelectedTargetDate(date)
      setSelectedDate(date) // 캘린더 날짜도 해당 날짜로 변경
      setDetailModalOpen(true)
    }
  }, [location.search, isLoggedIn])

  const currentDate = new Date(selectedDate)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchSchedules = useCallback(async () => {
    try {
      const data = await getSchedules(year, month + 1)
      setSchedules(data)
    } catch (err) {
      console.error('Failed to fetch schedules:', err)
    }
  }, [year, month])

  useEffect(() => {
    const load = async () => {
      await fetchSchedules()
    }
    load()
  }, [fetchSchedules])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = weekdays[date.getDay()]
    return `${year}.${month}.${day} (${weekday})`
  }

  // 달력 생성
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  // 항상 6주(42일)를 표시하기 위한 빈 셀 계산
  const totalCells = 42 // 7일 * 6주
  const emptyCellsAfter = totalCells - firstDay - daysInMonth

  const getSchedulesForDate = (date: string) => {
    return schedules.filter((s) => {
      // startDate: YYYY-MM-DDTHH:mm:ss
      const sDate = s.startDate.split('T')[0]
      if (sDate !== date) return false
      // 비공개 일정은 제외
      if (s.sharingScope === 'PRIVATE') return false
      // 로그인하지 않은 사용자는 'LOGGED_IN_USERS' 공유 범위만 볼 수 있음
      if (!isLoggedIn && s.sharingScope === 'LOGGED_IN_USERS') return false
      return true
    })
  }

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
  }

  const changeMonth = (delta: number) => {
    const newDate = new Date(year, month + delta, 1)
    const newYear = newDate.getFullYear()
    const newMonth = newDate.getMonth() + 1
    const dateStr = `${newYear}-${String(newMonth).padStart(2, '0')}-01`
    setSelectedDate(dateStr)
  }

  const selectedDateSchedules = getSchedulesForDate(selectedDate)

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">청년부 일정</h1>
            <p className="mt-1 text-sm text-slate-600">다가오는 예배와 행사 일정을 확인하세요.</p>
          </div>
          <button
            onClick={() => navigate('/user-dashboard')}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            ← 메인으로
          </button>
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
                      className={`relative aspect-square w-full overflow-hidden rounded-lg border p-0.5 text-left transition hover:bg-slate-50 ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                      }`}
                    >
                      <span className={`absolute left-1 top-1 text-[10px] leading-none z-10 ${isToday ? 'font-bold text-blue-600' : 'text-slate-700'}`}>
                        {day}
                      </span>
                      
                      <div className="mt-4 flex flex-col gap-0.5 w-full">
                        {daySchedules.slice(0, 2).map((schedule) => (
                          <div
                            key={schedule.scheduleId}
                            className={`truncate rounded px-1 py-[1px] text-[8px] md:text-[10px] font-medium leading-tight ${typeColors[schedule.type] || typeColors.ETC}`}
                          >
                            {schedule.title}
                          </div>
                        ))}
                        {daySchedules.length > 2 && (
                          <div className="px-1 text-[8px] md:text-[10px] leading-none text-slate-400">+{daySchedules.length - 2}</div>
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
              {formatDate(selectedDate)} 일정
            </h3>
            <div className="space-y-2">
              {selectedDateSchedules.length === 0 ? (
                <p className="text-xs text-slate-400">등록된 일정이 없습니다.</p>
              ) : (
                selectedDateSchedules.map((schedule) => {
                  const timeStr = new Date(schedule.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div
                      key={schedule.scheduleId}
                      onClick={() => {
                        if (!isLoggedIn) {
                          toast.error('로그인이 필요한 서비스입니다.')
                          return
                        }
                        setSelectedScheduleId(schedule.scheduleId)
                        setSelectedTargetDate(schedule.startDate.split('T')[0])
                        setDetailModalOpen(true)
                      }}
                      className="w-full rounded-lg border border-slate-200 p-3 text-left cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeColors[schedule.type] || typeColors.ETC}`}>
                              {typeLabels[schedule.type] || schedule.type}
                            </span>
                            <span className="text-xs font-semibold text-slate-900">{schedule.title}</span>
                          </div>
                          <p className="text-xs text-slate-600">{timeStr}</p>
                          <p className="text-xs text-slate-500">{schedule.location}</p>
                          {schedule.content && (
                            <p className="mt-1 text-xs text-slate-400">{schedule.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {detailModalOpen && selectedScheduleId && selectedTargetDate && (
        <ScheduleDetailModal
          scheduleId={selectedScheduleId}
          targetDate={selectedTargetDate}
          onClose={() => setDetailModalOpen(false)}
          onUpdate={fetchSchedules}
        />
      )}
    </div>
  )
}

export default ScheduleListPage

