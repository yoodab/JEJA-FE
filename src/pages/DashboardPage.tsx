import { useNavigate } from 'react-router-dom'

const managementMenus = [
  {
    title: '새신자 관리',
    desc: '등록·정착 현황, 멘토/순 배정, 환영 케어 리스트.',
    accent: 'bg-blue-50 text-blue-700',
    icon: '🌸',
    iconBg: 'bg-blue-100',
    route: '/manage/newcomers',
  },
  {
    title: '이번달 생일자',
    desc: '이번 달 생일자 확인',
    accent: 'bg-purple-50 text-purple-700',
    icon: '🎂',
    iconBg: 'bg-purple-100',
    route: '/manage/birthdays',
  },
  {
    title: '장기결석자',
    desc: '4·8주 이상 결석자 파악, 심방/연락 플래너.',
    accent: 'bg-rose-50 text-rose-700',
    icon: '💝',
    iconBg: 'bg-rose-100',
    route: '/manage/absentees',
  },
  {
    title: '순관리',
    desc: '순 편성·순장 관리, 순별 출석/양육 현황.',
    accent: 'bg-emerald-50 text-emerald-700',
    icon: '👥',
    iconBg: 'bg-emerald-100',
    route: '/manage/soon',
  },
  {
    title: '성도 관리',
    desc: '전체 명단, 연락처, 상태(등록/휴먼/퇴회) 정리.',
    accent: 'bg-sky-50 text-sky-700',
    icon: '📋',
    iconBg: 'bg-sky-100',
    route: '/manage/members',
  },
  {
    title: '출석관리',
    desc: '주일/순 출석 입력, 기간별 통계 및 누락 체크.',
    accent: 'bg-indigo-50 text-indigo-700',
    icon: '✅',
    iconBg: 'bg-indigo-100',
    route: '/manage/attendance',
  },
  {
    title: '보고서 관리',
    desc: '주간·월간 보고서, 행사 리포트 업로드 및 내보내기.',
    accent: 'bg-slate-50 text-slate-700',
    icon: '📄',
    iconBg: 'bg-slate-100',
    route: '/manage/reports',
  },
  {
    title: '재정관리',
    desc: '주일 헌금·행사 예산·정산 내역, 다운로드 및 공유.',
    accent: 'bg-amber-50 text-amber-700',
    icon: '💰',
    iconBg: 'bg-amber-100',
    route: '/manage/finance',
  },
  {
    title: '식권 관리',
    desc: '식권 추가/사용 및 재고 현황 관리.',
    accent: 'bg-green-50 text-green-700',
    icon: '🎫',
    iconBg: 'bg-green-100',
    route: '/manage/meal-tickets',
  },
  {
    title: '일정 관리',
    desc: '예배/행사/모임 일정 등록·공유, 리마인드 확인.',
    accent: 'bg-teal-50 text-teal-700',
    icon: '📅',
    iconBg: 'bg-teal-100',
    route: '/manage/schedule',
  },
  {
    title: '팀관리',
    desc: '팀 생성·수정·삭제, 팀원 관리 및 팀 정보 관리.',
    accent: 'bg-violet-50 text-violet-700',
    icon: '🎯',
    iconBg: 'bg-violet-100',
    route: '/manage/teams',
  },
  {
    title: '조편성',
    desc: '인원 선택 후 성별·나이를 고려하여 조를 자동 편성.',
    accent: 'bg-rose-50 text-rose-700',
    icon: '🔀',
    iconBg: 'bg-rose-100',
    route: '/manage/group-formation',
  },
  {
    title: '롤링페이퍼',
    desc: '롤링페이퍼 생성 및 관리',
    accent: 'bg-pink-50 text-pink-700',
    icon: '💌',
    iconBg: 'bg-pink-100',
    route: '/manage/rolling-papers',
  },
  {
    title: '알림 보내기',
    desc: '앱 푸시 알림 발송 (개별/전체/그룹).',
    accent: 'bg-indigo-50 text-indigo-700',
    icon: '🔔',
    iconBg: 'bg-indigo-100',
    route: '/manage/notifications',
  },
]

function DashboardPage() {
  const navigate = useNavigate()

  const goTo = (route: string) => {
    navigate(route)
  }

  return (
    <div className="bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* 관리 메뉴 */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {managementMenus.map((menu) => (
            <div
              key={menu.title}
              onClick={() => goTo(menu.route)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${menu.iconBg} text-2xl transition-transform group-hover:scale-110`}>
                      {menu.icon}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-bold text-slate-900">{menu.title}</h2>
                    </div>
                  </div>
                  <p className="mb-4 text-xs leading-relaxed text-slate-600">{menu.desc}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goTo(menu.route)
                }}
                className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-all hover:bg-blue-600 hover:text-white hover:shadow-md group-hover:scale-110"
                aria-label="바로가기"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${menu.iconBg} opacity-20 blur-xl transition-transform group-hover:scale-150`} />
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

export default DashboardPage

