import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'

interface Team {
  id: number
  name: string
  description: string
  color: string
}

// 6개 팀 데이터 (실제로는 API에서 가져올 데이터)
const initialTeams: Team[] = [
  {
    id: 1,
    name: '예배팀',
    description: '주일예배와 각종 예배를 섬기는 팀입니다.',
    color: 'blue',
  },
  {
    id: 2,
    name: '찬양팀',
    description: '함께 찬양하며 예배하는 팀입니다.',
    color: 'purple',
  },
  {
    id: 3,
    name: '새신자팀',
    description: '새신자들을 돌보고 양육하는 팀입니다.',
    color: 'green',
  },
  {
    id: 4,
    name: '방송팀',
    description: '예배와 행사의 방송을 담당하는 팀입니다.',
    color: 'orange',
  },
  {
    id: 5,
    name: '컨텐츠팀',
    description: '각종 콘텐츠 제작과 관리를 담당하는 팀입니다.',
    color: 'pink',
  },
  {
    id: 6,
    name: '디자인팀',
    description: '각종 디자인 작업을 담당하는 팀입니다.',
    color: 'indigo',
  },
]

function ClubPage() {
  const navigate = useNavigate()
  const [teams] = useState<Team[]>(initialTeams)

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">팀 목록</h1>
            <p className="mt-1 text-sm text-slate-600">각 팀을 클릭하여 상세 정보를 확인하세요.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/user-dashboard"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← 메인으로
            </Link>
          </div>
        </div>

        {/* 팀 카드 그리드 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const colorClasses = {
              blue: 'border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100',
              purple: 'border-purple-200 bg-purple-50 hover:border-purple-300 hover:bg-purple-100',
              green: 'border-green-200 bg-green-50 hover:border-green-300 hover:bg-green-100',
              orange: 'border-orange-200 bg-orange-50 hover:border-orange-300 hover:bg-orange-100',
              pink: 'border-pink-200 bg-pink-50 hover:border-pink-300 hover:bg-pink-100',
              indigo: 'border-indigo-200 bg-indigo-50 hover:border-indigo-300 hover:bg-indigo-100',
            }

            return (
              <div
                key={team.id}
                className={`group relative rounded-xl border p-6 shadow-sm transition ${colorClasses[team.color as keyof typeof colorClasses]}`}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/club/${team.id}`)}
                  className="w-full text-left"
                >
                  <h2 className="text-xl font-bold text-slate-900">{team.name}</h2>
                  <p className="mt-2 text-sm text-slate-600">{team.description}</p>
                  <div className="mt-4 flex items-center text-sm font-semibold text-slate-500 opacity-0 transition group-hover:opacity-100">
                    상세 보기 →
                  </div>
                </button>
              </div>
            )
          })}
        </div>

        <Footer />
      </div>
    </div>
  )
}

export default ClubPage
