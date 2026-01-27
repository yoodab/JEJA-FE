import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Member } from '../types/member'
import { getMembers } from '../services/memberService'
import { formatPhoneNumber } from '../utils/format'

function BirthdayManagePage() {
  const navigate = useNavigate()
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 멤버 목록 조회
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getMembers({ page: 0, size: 1000 })
        const data = response.content
        setMembers(data)
      } catch (err) {
        console.error('생일자 목록 로드 실패:', err)
        setError('멤버 목록을 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadMembers()
  }, [])

  // 선택된 월의 생일자 필터링 (연도는 무시하고 월만 비교)
  const filteredBirthdays = members.filter((member) => {
    if (!member.birthDate) return false

    // birthDate 형식: "YYYY-MM-DD" 또는 그 외 문자열일 수 있음
    const birth = new Date(member.birthDate)
    if (Number.isNaN(birth.getTime())) {
      // 날짜 파싱이 안 되면 "MM-DD" 또는 "MM/DD" 형태를 가정하고 처리
      const match = member.birthDate.match(/(\d{1,2})[/-](\d{1,2})/)
      if (!match) return false
      const month = Number(match[1])
      return month === selectedMonth
    }

    return birth.getMonth() + 1 === selectedMonth
  })

  // 생일 순으로 정렬
  const sortedBirthdays = [...filteredBirthdays].sort((a, b) => {
    const dateA = new Date(a.birthDate).getDate()
    const dateB = new Date(b.birthDate).getDate()
    return dateA - dateB
  })

  const months = [
    { value: 1, label: '1월' },
    { value: 2, label: '2월' },
    { value: 3, label: '3월' },
    { value: 4, label: '4월' },
    { value: 5, label: '5월' },
    { value: 6, label: '6월' },
    { value: 7, label: '7월' },
    { value: 8, label: '8월' },
    { value: 9, label: '9월' },
    { value: 10, label: '10월' },
    { value: 11, label: '11월' },
    { value: 12, label: '12월' },
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}월 ${date.getDate()}일`
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              ← 돌아가기
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-xl">
                🎂
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">생일자 조회</p>
                <p className="text-xs text-slate-500">이번 달 생일자 확인</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* 로딩 / 에러 상태 */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-sm text-slate-500">생일자 정보를 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-12 text-center shadow-sm">
            <p className="text-sm text-rose-600">{error}</p>
          </div>
        ) : (
          <>
            {/* 통계 카드 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{selectedMonth}월 생일자</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{sortedBirthdays.length}명</p>
            </div>

            {/* 생일자 목록 */}
            {sortedBirthdays.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">이름</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">생일</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">연락처</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {sortedBirthdays.map((member) => (
                        <tr key={member.memberId} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{member.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{formatDate(member.birthDate)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{formatPhoneNumber(member.phone)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <p className="text-sm text-slate-500">{selectedMonth}월 생일자가 없습니다.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default BirthdayManagePage
