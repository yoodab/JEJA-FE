import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import { scheduleService } from '../services/scheduleService'
import { checkIn } from '../services/attendanceService'
import { getAlbumDetail, getFileUrl, type AlbumDetail } from '../services/albumService'
import { isLoggedIn as checkLoggedIn } from '../utils/auth'
import type { Schedule } from '../types/schedule'

// Helper to translate schedule type
const getScheduleTypeLabel = (type: string) => {
  switch (type) {
    case 'WORSHIP': return '예배'
    case 'EVENT': return '행사'
    case 'MEETING': return '모임'
    default: return '기타'
  }
}

const typeColors: Record<string, string> = {
  WORSHIP: 'bg-blue-100 text-blue-700',
  EVENT: 'bg-purple-100 text-purple-700',
  MEETING: 'bg-emerald-100 text-emerald-700',
  ETC: 'bg-slate-100 text-slate-700',
}

function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [album, setAlbum] = useState<AlbumDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(checkLoggedIn())
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        // 1. Fetch Schedule Detail
        const scheduleData = await scheduleService.getScheduleDetail(Number(id))
        setSchedule(scheduleData)

        // 2. If linked album exists, fetch album details
        if (scheduleData.linkedAlbumId) {
          try {
            const albumData = await getAlbumDetail(scheduleData.linkedAlbumId)
            setAlbum(albumData)
          } catch (err) {
            console.error('Failed to load linked album:', err)
            // Don't fail the whole page if album fails
          }
        }
      } catch (err) {
        console.error('Failed to load schedule:', err)
        setError('일정을 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleCheckIn = async () => {
    if (!schedule) return
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.')
      navigate('/login')
      return
    }

    if (!confirm('출석하시겠습니까?')) return

    setIsCheckingIn(true)
    try {
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

      await checkIn(schedule.scheduleId, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      })

      alert('출석이 완료되었습니다!')
      // Refresh schedule to update attendee list
      const updatedSchedule = await scheduleService.getScheduleDetail(schedule.scheduleId)
      setSchedule(updatedSchedule)
    } catch (error) {
      console.error('출석 체크 실패:', error)
      let errorMsg = '출석 체크 중 오류가 발생했습니다.'
      const httpErr = error as { response?: { data?: { message?: string } } };
      if (httpErr.response?.data?.message) {
        errorMsg = httpErr.response.data.message
      }
      
      if (error instanceof GeolocationPositionError) {
        if (error.code === error.PERMISSION_DENIED) {
           errorMsg = "위치 정보 권한이 차단되었습니다. 브라우저 설정에서 권한을 허용해주세요.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
           errorMsg = "위치 정보를 가져올 수 없습니다. GPS를 확인해주세요.";
        } else if (error.code === error.TIMEOUT) {
           errorMsg = "위치 확인 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
        }
      }

      if ((error as { response?: { data?: { code?: string } } }).response?.data?.code === 'ATT14') {
        errorMsg = '출석 가능 시간(20분 전후)이 아닙니다.'
      }

      alert(errorMsg)
    } finally {
      setIsCheckingIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <UserHeader />
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-500">로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !schedule) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <UserHeader />
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-600">{error || '일정을 찾을 수 없습니다.'}</p>
            <button
              onClick={() => navigate('/schedules')}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              일정 목록으로 돌아가기
            </button>
          </div>
          <Footer />
        </div>
      </div>
    )
  }

  const startDate = new Date(schedule.startDate)
  const dateStr = startDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })
  const timeStr = startDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const now = new Date()
  const diffMinutes = (now.getTime() - startDate.getTime()) / (1000 * 60)
  const isAvailable = diffMinutes >= -20 && diffMinutes <= 20

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">일정 상세보기</h1>
            <p className="mt-1 text-sm text-slate-600">청년부 일정 정보를 확인하세요.</p>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn && isAvailable && (
              <button
                onClick={handleCheckIn}
                disabled={isCheckingIn}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isCheckingIn ? '처리 중...' : '출석하기'}
              </button>
            )}
            <button
              onClick={() => navigate('/schedules')}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              ← 목록으로
            </button>
          </div>
        </div>

        {/* 일정 상세 정보 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-6">
            {/* 제목 및 유형 */}
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${typeColors[schedule.type] || typeColors.ETC}`}>
                  {getScheduleTypeLabel(schedule.type)}
                </span>
                {schedule.sharingScope === 'LOGGED_IN_USERS' && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    회원공개
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{schedule.title}</h2>
            </div>

            {/* 날짜 및 시간 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">날짜</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{dateStr}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">시간</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{timeStr}</p>
              </div>
            </div>

            {/* 장소 */}
            {schedule.location && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">장소</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{schedule.location}</p>
              </div>
            )}

            {/* 설명 */}
            {schedule.content && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">설명</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {schedule.content}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 출석 정보 (API 데이터 구조에 맞춰 표시) */}
        {schedule.attendees && schedule.attendees.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">출석 정보</h2>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                    참석 {schedule.attendees.filter(a => a.attended).length}명
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">참석자 목록</p>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {schedule.attendees.map((attendee) => (
                  <div
                    key={attendee.memberId}
                    className={`rounded-lg border p-3 ${
                      attendee.attended
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">{attendee.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          attendee.attended
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {attendee.attended ? '참석' : '불참'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 연결된 앨범 미리보기 */}
        {album && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">연결된 앨범</h2>
              <button
                onClick={() => navigate(`/youth-album/${album.id}`)}
                className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                앨범 전체보기 →
              </button>
            </div>
            
            <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
               {/* 앨범 정보 헤더 */}
               <div className="border-b border-slate-200 bg-white p-4">
                  <h3 className="font-bold text-slate-900">{album.title}</h3>
                  <p className="text-sm text-slate-500">{album.date || album.description}</p>
               </div>

               {/* 사진 미리보기 그리드 (최대 5장) */}
               {album.photos && album.photos.length > 0 ? (
                 <div className="grid grid-cols-2 gap-1 p-1 sm:grid-cols-3 md:grid-cols-5">
                    {album.photos.slice(0, 5).map((photo, index) => (
                      <div 
                        key={photo.photoId} 
                        className="aspect-square cursor-pointer overflow-hidden rounded-md bg-slate-200"
                        onClick={() => navigate(`/youth-album/${album.id}`)}
                      >
                        <img 
                          src={getFileUrl(photo.imageUrl)} 
                          alt={photo.caption || `사진 ${index + 1}`}
                          className="h-full w-full object-cover transition hover:scale-105"
                        />
                      </div>
                    ))}
                    {/* 더보기 플레이스홀더 */}
                    {album.photos.length > 5 && (
                      <div 
                        className="flex aspect-square cursor-pointer items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200"
                        onClick={() => navigate(`/youth-album/${album.id}`)}
                      >
                        <span className="font-semibold">+{album.photos.length - 5}장 더보기</span>
                      </div>
                    )}
                 </div>
               ) : (
                 <div className="flex items-center justify-center py-12 text-slate-500">
                    등록된 사진이 없습니다.
                 </div>
               )}
            </div>
          </div>
        )}

        {!schedule.linkedAlbumId && !schedule.attendees && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-center text-sm text-slate-500">
              추가 정보가 없습니다.
            </p>
          </div>
        )}

        <Footer />
      </div>
    </div>
  )
}

export default ScheduleDetailPage

