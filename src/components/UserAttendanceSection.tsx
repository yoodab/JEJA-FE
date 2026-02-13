import { useState, useEffect } from 'react'
import {
  getSchedules as getCheckableSchedules,
  checkIn,
} from '../services/attendanceService'
import type { Schedule } from '../types/schedule'

interface ApiError {
  response?: {
    data?: {
      message?: string;
      code?: string;
    };
  };
}

export default function UserAttendanceSection() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null)
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | null
    text: string
  }>({ type: null, text: '' })

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const todaySchedules = await getCheckableSchedules()
        
        // 시간 필터링 (현재 시간 기준 +- 20분)
        const now = new Date()
        const validSchedules = todaySchedules.filter(s => {
          const start = new Date(s.startDate)
          const diffMinutes = (now.getTime() - start.getTime()) / (1000 * 60)
          return diffMinutes >= -20 && diffMinutes <= 20
        })

        // 타입 호환성을 위해 형변환
        setSchedules(validSchedules as unknown as Schedule[])

        if (validSchedules.length === 1) {
          setSelectedScheduleId(validSchedules[0].scheduleId)
        }
      } catch (error) {
        console.error('일정 조회 실패:', error)
      } finally {
        setIsLoadingSchedules(false)
      }
    }

    fetchSchedules()
  }, [])

  const handleCheckIn = async () => {
    if (!selectedScheduleId) {
      setMessage({ type: 'error', text: '참석할 일정을 선택해주세요.' })
      return
    }

    setIsSubmitting(true)
    setMessage({ type: null, text: '' })

    try {
      let latitude: number | undefined
      let longitude: number | undefined

      // 예배인 경우에만 위치 정보 가져오기
      const selectedSchedule = schedules.find(s => s.scheduleId === selectedScheduleId)
      if (selectedSchedule?.type === 'WORSHIP') {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("위치 정보를 지원하지 않는 브라우저입니다."))
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          })
        })
        latitude = position.coords.latitude
        longitude = position.coords.longitude
      }

      await checkIn(selectedScheduleId, {
        latitude,
        longitude
      })
      setMessage({ type: 'success', text: '출석이 완료되었습니다!' })
      // 성공 후 3초 뒤 메시지 초기화
      setTimeout(() => setMessage({ type: null, text: '' }), 3000)
    } catch (error: unknown) {
      console.error('출석 체크 실패:', error)
      let errorMsg = '출석 체크 중 오류가 발생했습니다.'
      
      const apiError = error as ApiError;
      if (error && typeof error === 'object' && 'response' in error) {
        errorMsg = apiError.response?.data?.message || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      // 위치 정보 에러 처리
      if (error instanceof GeolocationPositionError) {
        if (error.code === error.PERMISSION_DENIED) {
           errorMsg = "위치 정보 권한이 차단되었습니다. 브라우저 주소창의 자물쇠/설정 아이콘을 눌러 위치 권한을 '허용'해주세요.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
           errorMsg = "위치 정보를 가져올 수 없습니다. GPS가 켜져 있는지 확인해주세요.";
        } else if (error.code === error.TIMEOUT) {
           errorMsg = "위치 정보 확인 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
        }
      } else if ((error as Error).message === "위치 정보를 지원하지 않는 브라우저입니다.") {
        errorMsg = (error as Error).message;
      }

      // 시간 만료 에러 처리
      if (apiError?.response?.data?.code === 'ATT14') {
        setMessage({ type: 'error', text: '출석 가능 시간이 지났습니다.' })
        // 목록 갱신을 위해 페이지 리로드 또는 다시 조회 등을 할 수도 있음
      } else {
        setMessage({ type: 'error', text: errorMsg })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingSchedules) return null // 로딩 중에는 아무것도 표시하지 않음 (깜빡임 방지)
  if (schedules.length === 0) return null // 출석 가능한 일정이 없으면 섹션을 숨김

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">출석 체크</h2>
          <p className="mt-1 text-xs text-slate-500">
            현재 진행 중인 예배나 모임에 출석하세요.
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
          <select
            value={selectedScheduleId || ''}
            onChange={(e) => setSelectedScheduleId(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none sm:w-auto"
          >
            <option value="">일정 선택</option>
            {schedules.map((schedule) => (
              <option key={schedule.scheduleId} value={schedule.scheduleId}>
                {schedule.title} ({schedule.startDate.substring(11, 16)})
              </option>
            ))}
          </select>

          <button
            onClick={handleCheckIn}
            disabled={isSubmitting || !selectedScheduleId}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
              isSubmitting || !selectedScheduleId
                ? 'cursor-not-allowed bg-slate-300'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? '처리 중...' : '출석하기'}
          </button>
        </div>
      </div>

      {message.text && (
        <div
          className={`mt-3 rounded-lg p-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
    </section>
  )
}
