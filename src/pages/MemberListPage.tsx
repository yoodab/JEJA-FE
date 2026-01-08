import { useEffect, useState } from 'react'
import type { Member } from '../types/member'
import { getMembers } from '../services/memberService'

function MemberListPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getMembers()
        setMembers(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '멤버 목록을 불러오는데 실패했습니다.'
        setError(errorMessage)
        console.error('Failed to fetch members:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [])

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">청년부 인원 관리</h1>
          <p className="mt-1 text-sm text-slate-600">
            청년부 인원 현황을 확인하고 관리하세요.
          </p>
        </div>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
          신규 등록
        </button>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">로딩 중...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {members.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-slate-500">등록된 멤버가 없습니다.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    역할
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    연락처
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    순
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => (
                  <tr key={member.memberId} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {member.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {member.role}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {member.phone ?? '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {member.soonName ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  )
}

export default MemberListPage

