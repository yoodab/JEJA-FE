import type { Member } from '../types/member'

const members: Member[] = [
  {
    id: 1,
    name: '김민수',
    role: '일반청년',
    status: '재적',
    phone: '010-1234-5678',
  },
  {
    id: 2,
    name: '이수정',
    role: '순장',
    status: '재적',
    phone: '010-2345-6789',
  },
  {
    id: 3,
    name: '박지훈',
    role: '일반청년',
    status: '새신자',
    phone: '010-3456-7890',
  },
  {
    id: 4,
    name: '정하늘',
    role: '관리자',
    status: '재적',
    phone: '010-4567-8901',
  },
  {
    id: 5,
    name: '최예린',
    role: '일반청년',
    status: '휴학',
    phone: '010-5678-9012',
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
              <tr key={member.id} className="hover:bg-slate-50/60">
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

