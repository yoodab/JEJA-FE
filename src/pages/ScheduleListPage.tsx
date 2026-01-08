import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import { isLoggedIn as checkLoggedIn } from '../utils/auth'

interface Schedule {
  id: string
  title: string
  date: string
  time: string
  type: '예배' | '행사' | '모임' | '기타'
  location: string
  description: string
  shareScope?: 'loggedIn' | 'guest' | 'private'
}

// 임시 데이터 (실제로는 API에서 가져올 데이터)
const mockSchedules: Schedule[] = [
  {
    id: '1',
    title: '주일예배',
    date: '2024-12-15',
    time: '11:00',
    type: '예배',
    location: '본당',
    description: '청년부 주일예배입니다. 함께 모여 예배드립니다.',
  },
  {
    id: '2',
    title: '순모임',
    date: '2024-12-16',
    time: '19:00',
    type: '모임',
    location: '각 순별 장소',
    description: '주간 순모임입니다. 각 순별로 나뉘어 모임을 가집니다.',
  },
  {
    id: '3',
    title: '찬양팀 연습',
    date: '2024-12-18',
    time: '19:30',
    type: '모임',
    location: '찬양실',
    description: '주일예배 찬양 연습입니다.',
  },
  {
    id: '4',
    title: '주일예배',
    date: '2024-12-22',
    time: '11:00',
    type: '예배',
    location: '본당',
    description: '청년부 주일예배입니다. 함께 모여 예배드립니다.',
  },
  {
    id: '5',
    title: '크리스마스 특별예배',
    date: '2024-12-24',
    time: '19:00',
    type: '예배',
    location: '본당',
    description: '크리스마스 이브 특별예배입니다.',
  },
  {
    id: '6',
    title: '크리스마스 행사',
    date: '2024-12-25',
    time: '14:00',
    type: '행사',
    location: '교회 마당',
    description: '크리스마스 축하 행사입니다.',
  },
  {
    id: '7',
    title: '순모임',
    date: '2024-12-23',
    time: '19:00',
    type: '모임',
    location: '각 순별 장소',
    description: '주간 순모임입니다. 각 순별로 나뉘어 모임을 가집니다.',
  },
  {
    id: '8',
    title: '연말 특별예배',
    date: '2024-12-31',
    time: '22:00',
    type: '예배',
    location: '본당',
    description: '2024년 마지막 예배입니다. 함께 감사하며 새해를 맞이합니다.',
  },
  {
    id: '9',
    title: '신년예배',
    date: '2025-01-01',
    time: '11:00',
    type: '예배',
    location: '본당',
    description: '2025년 첫 주일예배입니다.',
  },
  {
    id: '10',
    title: '청년부 수련회',
    date: '2025-01-05',
    time: '09:00',
    type: '행사',
    location: '수양관',
    description: '신년 수련회입니다. 함께 모여 말씀을 나누고 교제합니다.',
  },
  {
    id: '11',
    title: '주일예배',
    date: '2025-01-05',
    time: '11:00',
    type: '예배',
    location: '본당',
    description: '청년부 주일예배입니다.',
  },
  {
    id: '12',
    title: '찬양팀 연습',
    date: '2025-01-08',
    time: '19:30',
    type: '모임',
    location: '찬양실',
    description: '주일예배 찬양 연습입니다.',
  },
  {
    id: '13',
    title: '순모임',
    date: '2025-01-13',
    time: '19:00',
    type: '모임',
    location: '각 순별 장소',
    description: '주간 순모임입니다.',
  },
  {
    id: '14',
    title: '주일예배',
    date: '2025-01-12',
    time: '11:00',
    type: '예배',
    location: '본당',
    description: '청년부 주일예배입니다.',
  },
  {
    id: '15',
    title: '청년부 모임',
    date: '2025-01-15',
    time: '19:00',
    type: '모임',
    location: '청년부실',
    description: '정기 청년부 모임입니다.',
  },
]

const typeColors: Record<Schedule['type'], string> = {
  예배: 'bg-blue-100 text-blue-700',
  행사: 'bg-purple-100 text-purple-700',
  모임: 'bg-emerald-100 text-emerald-700',
  기타: 'bg-slate-100 text-slate-700',
}

function ScheduleListPage() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(checkLoggedIn())
  }, [])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = weekdays[date.getDay()]
    return `${year}.${month}.${day} (${weekday})`
  }

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
    return mockSchedules.filter((s) => {
      if (s.date !== date) return false
      // 비공개 일정은 제외
      if (s.shareScope === 'private') return false
      // 로그인하지 않은 사용자는 'guest' 공유 범위만 볼 수 있음
      if (!isLoggedIn && s.shareScope === 'loggedIn') return false
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
              {formatDate(selectedDate)} 일정
            </h3>
            <div className="space-y-2">
              {selectedDateSchedules.length === 0 ? (
                <p className="text-xs text-slate-400">등록된 일정이 없습니다.</p>
              ) : (
                selectedDateSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="w-full rounded-lg border border-slate-200 p-3 text-left"
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}

export default ScheduleListPage

