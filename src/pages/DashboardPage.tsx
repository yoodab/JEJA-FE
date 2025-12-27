import { useNavigate } from 'react-router-dom'

const topStats = [
  { label: '이번 주 출석', value: '128명', trend: '+8명', trendColor: 'text-emerald-600', badge: '주일예배' },
  { label: '이번 달 새신자', value: '5명', trend: '정착 진행 중', trendColor: 'text-blue-600', badge: '새가족' },
  { label: '장기결석자', value: '12명', trend: '케어 필요', trendColor: 'text-rose-600', badge: '리텐션' },
]

const managementMenus = [
  {
    title: '새신자 관리',
    desc: '등록·정착 현황, 멘토/순 배정, 환영 케어 리스트.',
    accent: 'bg-blue-50 text-blue-700',
    badge: 'Warm Welcome',
    route: '/manage/newcomers',
  },
  {
    title: '이번달 생일자',
    desc: '이번 달 생일자, 축하 진행, 선물/케이크 체크.',
    accent: 'bg-purple-50 text-purple-700',
    badge: 'Celebrate',
    route: '/manage/birthdays',
  },
  {
    title: '장기결석자',
    desc: '4·8주 이상 결석자 파악, 심방/연락 플래너.',
    accent: 'bg-rose-50 text-rose-700',
    badge: 'Care List',
    route: '/manage/absentees',
  },
  {
    title: '순관리',
    desc: '순 편성·순장 관리, 순별 출석/양육 현황.',
    accent: 'bg-emerald-50 text-emerald-700',
    badge: 'Cell',
    route: '/manage/soon',
  },
  {
    title: '성도 관리',
    desc: '전체 명단, 연락처, 상태(등록/휴먼/퇴회) 정리.',
    accent: 'bg-sky-50 text-sky-700',
    badge: 'Member DB',
    route: '/manage/members',
  },
  {
    title: '출석관리',
    desc: '주일/순 출석 입력, 기간별 통계 및 누락 체크.',
    accent: 'bg-indigo-50 text-indigo-700',
    badge: 'Attendance',
    route: '/manage/attendance',
  },
  {
    title: '보고서 관리',
    desc: '주간·월간 보고서, 행사 리포트 업로드 및 내보내기.',
    accent: 'bg-slate-50 text-slate-700',
    badge: 'Reports',
    route: '/manage/reports',
  },
  {
    title: '재정관리',
    desc: '주일 헌금·행사 예산·정산 내역, 다운로드 및 공유.',
    accent: 'bg-amber-50 text-amber-700',
    badge: 'Finance',
    route: '/manage/finance',
  },
  {
    title: '일정 관리',
    desc: '예배/행사/모임 일정 등록·공유, 리마인드 확인.',
    accent: 'bg-teal-50 text-teal-700',
    badge: 'Schedule',
    route: '/manage/schedule',
  },
]

function DashboardPage() {
  const navigate = useNavigate()

  const goTo = (route: string) => {
    navigate(route)
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* 상단 헤더 - 청년부 메인과 동일한 톤 */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              JEJA
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Youth Admin</p>
              <p className="text-sm font-semibold text-slate-900">청년부 관리</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="rounded-full bg-slate-100 px-3 py-1">관리자 전용</span>
            <button
              type="button"
              onClick={() => navigate('/user-dashboard')}
              className="rounded-full bg-slate-900 px-4 py-1.5 text-white shadow-sm transition hover:bg-slate-700"
            >
              메인으로
            </button>
          </div>
        </header>

        {/* 핵심 요약 */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{stat.badge}</p>
                <span className="text-[11px] font-semibold text-slate-500">{stat.trend}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className={`mt-1 text-[11px] font-semibold ${stat.trendColor}`}>{stat.trendColor ? stat.trend : ''}</p>
            </div>
          ))}
        </section>

        {/* 관리 메뉴 */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {managementMenus.map((menu) => (
            <div
              key={menu.title}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold ${menu.accent}`}>
                    {menu.badge}
                  </div>
                  <h2 className="mt-3 text-sm font-semibold text-slate-900">{menu.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">{menu.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => goTo(menu.route)}
                  className="rounded-full px-3 py-1 text-[11px] font-semibold text-slate-300 transition hover:bg-slate-100 hover:text-blue-700"
                >
                  바로가기
                </button>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-50/80 via-white/40 to-transparent opacity-0 transition group-hover:opacity-100" />
            </div>
          ))}
        </section>



      </div>
    </div>
  )
}

export default DashboardPage

