import { useState, useEffect } from 'react'
import type { Member } from '../../types/member'

interface RoleSelectModalProps {
  member: Member | null
  onClose: () => void
  onSave: (memberId: number, roles: string[]) => void
}

const AVAILABLE_ROLES = [
  { value: 'MEMBER', label: '일반성도' },
  { value: 'EXECUTIVE', label: '임원' },
]

export default function RoleSelectModal({ member, onClose, onSave }: RoleSelectModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  useEffect(() => {
    if (member && member.roles) {
      // member.roles might be an array of strings or objects depending on the API response
      // Assuming it's an array of strings based on MemberDto usually mapping enums to strings
      // If member.roles is not available in Member type yet, we might need to update Member type too.
      // Let's assume Member type has roles: string[]
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedRoles(member.roles)
    }
  }, [member])

  if (!member) return null

  const handleToggle = (role: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role)
      } else {
        return [...prev, role]
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(member.memberId, selectedRoles)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-slate-900">
          권한 수정
        </h2>
        <p className="mb-6 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{member.name}</span> 님의 권한을 선택해주세요.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6 space-y-3">
            {AVAILABLE_ROLES.map((role) => (
              <label 
                key={role.value}
                className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.value)}
                  onChange={() => handleToggle(role.value)}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">{role.label}</span>
              </label>
            ))}
            
            <div className="mt-4 rounded-lg bg-amber-50 p-3">
              <p className="text-xs text-amber-700">
                * 순장, 팀장 권한은 순 관리, 팀 관리 메뉴에서 해당 부여할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
