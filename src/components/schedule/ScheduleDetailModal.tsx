import { useState, useEffect } from 'react'
import type { Schedule } from '../../types/schedule'
import { getScheduleDetail } from '../../services/scheduleService'
import { applyForSchedule, cancelParticipation } from '../../services/attendanceService'
import { getMyInfo } from '../../services/userService'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ScheduleDetailModalProps {
  scheduleId: number
  targetDate: string // YYYY-MM-DD
  onClose: () => void
  onUpdate?: () => void // Callback to refresh parent list if needed
}

export default function ScheduleDetailModal({
  scheduleId,
  targetDate,
  onClose,
  onUpdate,
}: ScheduleDetailModalProps) {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [processing, setProcessing] = useState(false)

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [detail, userInfo] = await Promise.all([
          getScheduleDetail(scheduleId, targetDate),
          getMyInfo().catch(() => null), // Fail gracefully if not logged in (though modal shouldn't open)
        ])
        setSchedule(detail)
        if (userInfo) {
          setCurrentUserId(userInfo.userId)
        }
      } catch (err) {
        console.error('Failed to fetch schedule detail:', err)
        alert('일정 정보를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [scheduleId, targetDate])

  const isParticipating =
    schedule?.attendees?.some((a) => a.memberId === currentUserId) || false

  const handleParticipation = async () => {
    if (!currentUserId) {
      alert('로그인이 필요합니다.')
      return
    }
    if (processing) return

    try {
      setProcessing(true)
      if (isParticipating) {
        if (!confirm('참석 신청을 취소하시겠습니까?')) return
        await cancelParticipation(scheduleId, targetDate)
        alert('참석 신청이 취소되었습니다.')
      } else {
        if (!confirm('이 일정에 참석하시겠습니까?')) return
        await applyForSchedule(scheduleId, targetDate)
        alert('참석 신청이 완료되었습니다.')
      }
      
      // Refresh detail data
      const updatedDetail = await getScheduleDetail(scheduleId, targetDate)
      setSchedule(updatedDetail)
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Participation action failed:', err)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any
      const message = error.response?.data?.message || '작업 처리에 실패했습니다.'
      alert(message)
    } finally {
      setProcessing(false)
    }
  }

  if (!schedule && loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-white shadow-xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!schedule) return null

  // 날짜/시간 포맷팅
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return format(date, 'yyyy년 M월 d일 (EEE) a h:mm', { locale: ko })
    } catch {
      return dateStr
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">{schedule.title}</h3>
          <button
             onClick={onClose}
             className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Info Grid */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-none pt-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">일시</p>
                <p className="text-sm text-slate-600">
                  {formatDateTime(schedule.startDate)} ~ {format(new Date(schedule.endDate), 'a h:mm', { locale: ko })}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-none pt-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">장소</p>
                <p className="text-sm text-slate-600">{schedule.location || '장소 미정'}</p>
              </div>
            </div>

            {schedule.content && (
              <div className="flex gap-3">
                <div className="flex-none pt-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">내용</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{schedule.content}</p>
                </div>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Attendees - WORSHIP 타입은 제외 */}
          {schedule.type !== 'WORSHIP' && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">
                  참석자 명단 <span className="text-blue-600">({schedule.attendees?.length || 0})</span>
                </h4>
              </div>
              
              {schedule.attendees && schedule.attendees.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {schedule.attendees.map((attendee) => (
                    <div
                      key={attendee.memberId}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        attendee.memberId === currentUserId 
                          ? 'border-blue-200 bg-blue-50' 
                          : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white text-xs font-bold text-slate-500 shadow-sm">
                        {attendee.name[0]}
                      </div>
                      <span className={`truncate font-medium ${
                         attendee.memberId === currentUserId ? 'text-blue-700' : 'text-slate-700'
                      }`}>
                        {attendee.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-slate-50 py-6 text-center text-sm text-slate-500">
                  아직 참석 신청한 사람이 없습니다.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions - WORSHIP 타입은 제외 */}
        {schedule.type !== 'WORSHIP' && (
          <div className="border-t border-slate-100 bg-slate-50 p-4">
            <button
              onClick={handleParticipation}
              disabled={processing}
              className={`w-full rounded-xl py-3 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${
                isParticipating
                  ? 'bg-slate-400 hover:bg-slate-500'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  처리 중...
                </span>
              ) : isParticipating ? (
                '참석 취소하기'
              ) : (
                '참석 신청하기'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
