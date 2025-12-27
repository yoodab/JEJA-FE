import type { Member } from '../types/member'

// 백엔드 DTO에 맞춘 목 데이터
const members: Member[] = [
  {
    memberId: 1,
    name: '이리더',
    phone: '010-1111-2222',
    birthDate: '1995-03-10',
    status: '재적',
    role: '리더',
    soonId: 10,
    soonName: '믿음셀',
    hasAccount: true,
  },
  {
    memberId: 2,
    name: '김새신',
    phone: '010-7777-8888',
    birthDate: '2002-01-15',
    status: '새신자',
    role: '일반',
    soonId: 10,
    soonName: '믿음셀',
    hasAccount: false,
  },
]

function MemberListPage() {
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default MemberListPage

