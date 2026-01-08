import { useParams, useNavigate } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'

interface Schedule {
  id: string
  title: string
  date: string
  time: string
  type: '예배' | '행사' | '모임' | '기타'
  location: string
  description: string
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
    totalCount: 50,
    presentCount: 48,
    absentCount: 2,
    attendanceList: [
      { memberId: '1', name: '김청년', status: 'PRESENT', attendanceTime: '2024-12-22T11:05:00' },
      { memberId: '2', name: '이청년', status: 'PRESENT', attendanceTime: '2024-12-22T11:02:00' },
      { memberId: '3', name: '박청년', status: 'PRESENT', attendanceTime: '2024-12-22T11:10:00' },
      { memberId: '4', name: '최청년', status: 'PRESENT', attendanceTime: '2024-12-22T11:00:00' },
    ],
  },
  '5': {
    totalCount: 60,
    presentCount: 58,
    absentCount: 2,
    attendanceList: [
      { memberId: '1', name: '김청년', status: 'PRESENT', attendanceTime: '2024-12-24T19:00:00' },
      { memberId: '2', name: '이청년', status: 'PRESENT', attendanceTime: '2024-12-24T18:55:00' },
      { memberId: '3', name: '박청년', status: 'PRESENT', attendanceTime: '2024-12-24T19:05:00' },
      { memberId: '4', name: '최청년', status: 'PRESENT', attendanceTime: '2024-12-24T19:00:00' },
    ],
  },
  '8': {
    totalCount: 60,
    presentCount: 58,
    absentCount: 2,
    attendanceList: [
      { memberId: '1', name: '김청년', status: 'PRESENT', attendanceTime: '2024-12-31T22:00:00' },
      { memberId: '2', name: '이청년', status: 'PRESENT', attendanceTime: '2024-12-31T21:55:00' },
      { memberId: '3', name: '박청년', status: 'PRESENT', attendanceTime: '2024-12-31T22:05:00' },
      { memberId: '4', name: '최청년', status: 'PRESENT', attendanceTime: '2024-12-31T22:00:00' },
    ],
  },
  '10': {
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
      id: '2',
      title: '2024년 12월 주일예배',
      date: '2024-12-22',
      thumbnail: 'https://via.placeholder.com/200x150?text=주일예배',
      photoCount: 18,
    },
  ],
  '5': [
    {
      id: '3',
      title: '크리스마스 특별예배',
      date: '2024-12-24',
      thumbnail: 'https://via.placeholder.com/200x150?text=크리스마스',
      photoCount: 30,
    },
  ],
  '6': [
    {
      id: '4',
      title: '크리스마스 행사',
      date: '2024-12-25',
      thumbnail: 'https://via.placeholder.com/200x150?text=크리스마스행사',
      photoCount: 40,
    },
  ],
  '8': [
    {
      id: '5',
      title: '연말 특별예배',
      date: '2024-12-31',
      thumbnail: 'https://via.placeholder.com/200x150?text=연말예배',
      photoCount: 25,
    },
  ],
  '10': [
    {
      id: '6',
      title: '청년부 수련회 2025',
      date: '2025-01-05',
      thumbnail: 'https://via.placeholder.com/200x150?text=수련회',
      photoCount: 50,
    },
  ],
}

const typeColors: Record<Schedule['type'], string> = {
  예배: 'bg-blue-100 text-blue-700',
  행사: 'bg-purple-100 text-purple-700',
  모임: 'bg-emerald-100 text-emerald-700',
  기타: 'bg-slate-100 text-slate-700',
}

function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const schedule = mockSchedules.find((s) => s.id === id)
  const attendanceInfo = id ? mockAttendanceData[id] : null
  const albums = id ? mockAlbumData[id] || [] : []

  if (!schedule) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <UserHeader />
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-600">일정을 찾을 수 없습니다.</p>
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = weekdays[date.getDay()]
    return `${year}년 ${month}월 ${day}일 (${weekday})`
  }

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
          <button
            onClick={() => navigate('/schedules')}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            ← 목록으로
          </button>
        </div>

        {/* 일정 상세 정보 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-6">
            {/* 제목 및 유형 */}
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${typeColors[schedule.type]}`}>
                  {schedule.type}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{schedule.title}</h2>
            </div>

            {/* 날짜 및 시간 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">날짜</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(schedule.date)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">시간</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{schedule.time}</p>
              </div>
            </div>

            {/* 장소 */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">장소</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{schedule.location}</p>
            </div>

            {/* 설명 */}
            {schedule.description && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">설명</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {schedule.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 출석 정보 */}
        {attendanceInfo && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">출석 정보</h2>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                    출석 {attendanceInfo.presentCount}명
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    결석 {attendanceInfo.absentCount}명
                  </span>
                </div>
              </div>
            </div>
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                총 <span className="font-semibold text-slate-900">{attendanceInfo.totalCount}명</span> 중{' '}
                <span className="font-semibold text-blue-600">{attendanceInfo.presentCount}명</span> 출석
              </p>
            </div>
            {attendanceInfo.attendanceList.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">출석자 목록</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {attendanceInfo.attendanceList.map((record) => (
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
        {albums.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-slate-900">연결된 앨범</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((album) => (
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

        {!attendanceInfo && albums.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-center text-sm text-slate-500">
              이 일정에 연결된 출석 정보나 앨범이 없습니다.
            </p>
          </div>
        )}

        <Footer />
      </div>
    </div>
  )
}

export default ScheduleDetailPage

