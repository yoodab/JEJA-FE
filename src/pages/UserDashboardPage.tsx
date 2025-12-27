import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'

const heroImages = [
  {
    id: 1,
    title: 'Welcome to JEJA Youth',
    subtitle: '하나님이 세우시는 교회, 함께 예배하는 청년부',
  },
  {
    id: 2,
    title: '주일예배 & 순모임',
    subtitle: '말씀과 나눔으로 함께 성장해요',
  },
  {
    id: 3,
    title: '함께 웃고 울며 기도하는 공동체',
    subtitle: '청년부 소식과 사진들을 확인해 보세요',
  },
]

// 임시 데이터
const latestBulletin = {
  date: '2025-12-14',
  title: '12월 둘째주 주보',
  week: '2025년 12월 둘째주',
}

const latestNotices = [
  {
    id: 1,
    date: '2025-12-16',
    title: '[공지] 12월 청년부 모임 일정 안내',
    isImportant: true,
  },
  {
    id: 2,
    date: '2025-12-14',
    title: '[안내] 연말 특별 예배 안내',
    isImportant: true,
  },
]

const latestAlbums = [
  {
    id: 1,
    title: '2024 전도특공대',
    date: '2024-03-16',
    thumbnail: 'https://via.placeholder.com/150x100?text=전도특공대',
  },
  {
    id: 2,
    title: '청년부 수련회',
    date: '2024-07-20',
    thumbnail: 'https://via.placeholder.com/150x100?text=수련회',
  },
]

const mockSoonData = {
  soonName: '믿음셀',
  leader: '김리더',
  meetingTime: '매주 토요일 오후 7시',
  memberCount: 6,
}

const mockMyInfo = {
  name: '김청년',
  role: '일반청년',
  status: '재적',
  thisMonthAttendance: 8,
  thisYearAttendance: 45,
}

const mockClubData = {
  clubName: '찬양동아리',
  leader: '박찬양',
  meetingTime: '매주 금요일 오후 8시',
  memberCount: 12,
  description: '함께 찬양하며 예배하는 동아리',
}

function UserDashboardPage() {
  const navigate = useNavigate()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  // 백엔드에서 ROLE_ADMIN, ROLE_PASTOR, ROLE_EXECUTIVE 등으로 온다고 가정하고 체크
  const isYouthManager = ['ROLE_ADMIN', 'ROLE_PASTOR', 'ROLE_EXECUTIVE'].includes(userRole ?? '')

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % heroImages.length)
  }

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length)
  }

  // 자동 슬라이드
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [])

  // 로그인/권한 상태 초기화
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const storedFlag = localStorage.getItem('isLoggedIn') === 'true'
    setIsLoggedIn(!!token || storedFlag)
    const role = localStorage.getItem('userRole')
    setUserRole(role)
  }, [])

  const handleLoginLogout = () => {
    if (isLoggedIn) {
      localStorage.removeItem('accessToken')
      // 역할 정보도 함께 초기화
      localStorage.removeItem('userRole')
       localStorage.removeItem('isLoggedIn')
      setIsLoggedIn(false)
      setUserRole(null)
      // 로그아웃 시 현재 페이지에 유지
    } else {
      navigate('/login')
    }
  }

  const goToYouthAdmin = () => {
    navigate('/dashboard')
  }

  const current = heroImages[activeIndex]

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader isLoggedIn={isLoggedIn} userRole={userRole} onLogout={handleLoginLogout} />

        {/* 상단 큰 사진 슬라이드 */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/80 shadow-lg">
          {/* 배경 (임시 그라데이션, 나중에 실제 이미지로 교체 가능) */}
          <div className="h-52 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 sm:h-72" />

          {/* 텍스트 오버레이 */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-center px-6 py-6 sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
              JEJA YOUTH
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
              {current.title}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-200 sm:text-base">
              {current.subtitle}
            </p>
          </div>

          {/* 좌우 화살표 */}
          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-black/40 p-2 text-white shadow-sm backdrop-blur hover:bg-black/60"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-black/40 p-2 text-white shadow-sm backdrop-blur hover:bg-black/60"
          >
            ›
          </button>

          {/* 하단 인디케이터 */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {heroImages.map((img, index) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2 w-2 rounded-full transition ${
                  index === activeIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </section>

        {/* 순 / 동아리 / 내 정보 보기 영역 - 로그인 시에만 노출 (상단에 배치) */}
        {isLoggedIn && (
          <section className="grid gap-4 md:grid-cols-3">
            <div className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
              <button
                type="button"
                onClick={() => navigate('/soon')}
                className="absolute right-3 top-3 text-[10px] font-semibold text-slate-300 opacity-0 transition group-hover:opacity-100 group-hover:text-blue-600"
              >
                상세 보기
              </button>
              <h2 className="text-sm font-semibold text-slate-900">순</h2>
              <p className="mt-1 text-xs text-slate-500">내가 속한 순과 모임 정보를 확인하세요.</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600">순 이름</span>
                  <span className="text-sm font-semibold text-slate-900">{mockSoonData.soonName}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600">순장</span>
                  <span className="text-sm font-semibold text-slate-900">{mockSoonData.leader}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600">모임 시간</span>
                  <span className="text-xs font-semibold text-slate-700">{mockSoonData.meetingTime}</span>
                </div>
              </div>
            </div>
            <div className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
              <button
                type="button"
                onClick={() => navigate('/club')}
                className="absolute right-3 top-3 text-[10px] font-semibold text-slate-300 opacity-0 transition group-hover:opacity-100 group-hover:text-blue-600"
              >
                상세 보기
              </button>
              <h2 className="text-sm font-semibold text-slate-900">동아리</h2>
              <p className="mt-1 text-xs text-slate-500">내가 속한 동아리 정보를 확인하세요.</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-purple-50 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600">동아리명</span>
                  <span className="text-sm font-semibold text-slate-900">{mockClubData.clubName}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600">동아리장</span>
                  <span className="text-sm font-semibold text-slate-900">{mockClubData.leader}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600">모임 시간</span>
                  <span className="text-xs font-semibold text-slate-700">{mockClubData.meetingTime}</span>
                </div>
              </div>
            </div>
            <div className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
              <button
                type="button"
                onClick={() => navigate('/my-info')}
                className="absolute right-3 top-3 text-[10px] font-semibold text-slate-300 opacity-0 transition group-hover:opacity-100 group-hover:text-blue-600"
              >
                상세 보기
              </button>
              <h2 className="text-sm font-semibold text-slate-900">내 정보 보기</h2>
              <p className="mt-1 text-xs text-slate-500">
                나의 기본 정보와 출석 현황 등을 한 눈에 확인할 수 있습니다.
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600">이름</span>
                  <span className="text-sm font-semibold text-slate-900">{mockMyInfo.name}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600">역할</span>
                  <span className="text-xs font-semibold text-slate-700">{mockMyInfo.role}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600">이번 달 출석</span>
                  <span className="text-sm font-bold text-green-600">{mockMyInfo.thisMonthAttendance}회</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 하단 여러 블록 영역 */}
        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
          {/* 주보 */}
          <div className="group relative col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <button
              type="button"
              onClick={() => navigate('/bulletin')}
              className="absolute right-3 top-3 text-[10px] font-semibold text-slate-300 opacity-0 transition group-hover:opacity-100 group-hover:text-blue-600"
            >
              자세히 보기
            </button>
            <h2 className="text-sm font-semibold text-slate-900">주보</h2>
            <p className="mt-1 text-xs text-slate-500">이번 주 예배 주보를 확인하세요.</p>
            <div className="mt-3 space-y-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs font-medium text-slate-500">{latestBulletin.week}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{latestBulletin.title}</p>
                <p className="mt-1 text-xs text-slate-500">날짜: {latestBulletin.date}</p>
              </div>
            </div>
          </div>

          {/* 청년부 공지사항 */}
          <div className="group relative col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <button
              type="button"
              onClick={() => navigate('/youth-notices')}
              className="absolute right-3 top-3 text-[10px] font-semibold text-slate-300 opacity-0 transition group-hover:opacity-100 group-hover:text-blue-600"
            >
              자세히 보기
            </button>
            <h2 className="text-sm font-semibold text-slate-900">청년부 공지사항</h2>
            <p className="mt-1 text-xs text-slate-500">새로운 일정과 중요한 소식을 안내합니다.</p>
            <div className="mt-3 space-y-2">
              {latestNotices.map((notice) => (
                <div
                  key={notice.id}
                  className={`rounded-lg border px-3 py-2 ${
                    notice.isImportant
                      ? 'border-red-200 bg-red-50/50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {notice.isImportant && (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        중요
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">{notice.date}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-900">{notice.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 청년부 앨범 */}
          <div className="group relative col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <button
              type="button"
              onClick={() => navigate('/youth-album')}
              className="absolute right-3 top-3 text-[10px] font-semibold text-slate-300 opacity-0 transition group-hover:opacity-100 group-hover:text-blue-600"
            >
              자세히 보기
            </button>
            <h2 className="text-sm font-semibold text-slate-900">청년부 앨범</h2>
            <p className="mt-1 text-xs text-slate-500">예배와 행사 사진들을 모아두는 공간입니다.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {latestAlbums.map((album) => (
                <div key={album.id} className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={album.thumbnail}
                      alt={album.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="line-clamp-1 text-[10px] font-semibold text-slate-900">{album.title}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{album.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  )
}

export default UserDashboardPage


