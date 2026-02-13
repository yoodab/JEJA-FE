import type { Member } from '../../types/member'
import { formatMemberStatus, getMemberStatusColor } from '../../types/member'

interface MemberStatusModalProps {
  member: Member
  onClose: () => void
  onSave: (memberId: number, status: string) => void
}

export default function MemberStatusModal({ member, onClose, onSave }: MemberStatusModalProps) {
  const statuses = [
    { value: 'NEWCOMER', label: '새신자' },
    { value: 'ACTIVE', label: '재적' },
    { value: 'LONG_TERM_ABSENT', label: '장결자' },
    { value: 'MOVED', label: '교회 이동' },
    { value: 'GRADUATED', label: '졸업' },
  ]

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 text-center">
          <h3 className="text-lg font-bold text-slate-900">{member.name} 성도 상태 변경</h3>
          <p className="mt-1 text-sm text-slate-500">변경할 상태를 선택해주세요.</p>
        </div>

        <div className="space-y-2">
          {statuses.map((status) => (
            <button
              key={status.value}
              onClick={() => {
                onSave(member.memberId, status.value)
                onClose()
              }}
              className={`w-full flex items-center justify-between rounded-xl border p-4 transition-all ${
                member.memberStatus === status.value
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-sm font-semibold text-slate-700">{status.label}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getMemberStatusColor(status.value)}`}>
                {formatMemberStatus(status.value)}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
