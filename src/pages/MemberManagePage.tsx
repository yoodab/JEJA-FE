import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Member } from '../types/member'
import { getMembers, createMember, updateMember, deleteMember } from '../services/memberService'
import type { CreateMemberRequest, UpdateMemberRequest } from '../services/memberService'

type SortField = 'name' | 'role' | 'status' | 'phone' | 'birthDate' | null
type SortDirection = 'asc' | 'desc'

function MemberManagePage() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('전체')
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null)
  const [inlineFormData, setInlineFormData] = useState<UpdateMemberRequest | null>(null)
  const [formData, setFormData] = useState<CreateMemberRequest>({
    name: '',
    phone: '',
    birthDate: '',
    status: '재적',
    role: '일반',
  })

  // 멤버 목록 로드
  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const data = await getMembers()
      setMembers(data)
    } catch (error) {
      console.error('멤버 목록 로드 실패:', error)
      alert('멤버 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingMember(null)
    setFormData({
      name: '',
      phone: '',
      birthDate: '',
      status: '재적',
      role: '일반',
    })
    setShowModal(true)
  }

  const handleEdit = (member: Member) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      phone: member.phone,
      birthDate: member.birthDate,
      status: member.status,
      role: member.role,
    })
    setShowModal(true)
  }

  const handleDelete = async (memberId: number) => {
    if (confirm('성도 정보를 삭제하시겠습니까?')) {
      try {
        await deleteMember(memberId)
        alert('성도 정보가 삭제되었습니다.')
        loadMembers()
      } catch (error) {
        console.error('멤버 삭제 실패:', error)
        alert('멤버 삭제에 실패했습니다.')
      }
    }
  }

  const handleSave = async () => {
    if (!formData.name) {
      alert('이름을 입력해주세요.')
      return
    }

    try {
      if (editingMember) {
        // 수정
        const updateData: UpdateMemberRequest = {
          name: formData.name,
          phone: formData.phone,
          birthDate: formData.birthDate,
          status: formData.status,
          role: formData.role,
        }
        await updateMember(editingMember.memberId, updateData)
        alert('성도 정보가 수정되었습니다.')
      } else {
        // 생성
        await createMember(formData)
        alert('성도가 등록되었습니다.')
      }
      setShowModal(false)
      loadMembers()
    } catch (error) {
      console.error('멤버 저장 실패:', error)
      alert(editingMember ? '멤버 수정에 실패했습니다.' : '멤버 등록에 실패했습니다.')
    }
  }

  const statusColors = {
    재적: 'bg-emerald-100 text-emerald-700',
    휴먼: 'bg-yellow-100 text-yellow-700',
    퇴회: 'bg-slate-100 text-slate-700',
    새신자: 'bg-blue-100 text-blue-700',
  }

  const roleColors = {
    리더: 'bg-purple-100 text-purple-700',
    일반: 'bg-slate-100 text-slate-700',
    순장: 'bg-blue-100 text-blue-700',
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm)
    const matchesStatus = statusFilter === '전체' || member.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (!sortField) return 0

    let aValue: string | number
    let bValue: string | number

    switch (sortField) {
      case 'name':
        aValue = a.name
        bValue = b.name
        break
      case 'role':
        aValue = a.role
        bValue = b.role
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      case 'phone':
        aValue = a.phone
        bValue = b.phone
        break
      case 'birthDate':
        aValue = a.birthDate || ''
        bValue = b.birthDate || ''
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '')

    if (digits.length <= 3) return digits
    if (digits.length <= 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`
    }
    if (digits.length <= 11) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    }

    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
  }

  const startInlineEdit = (member: Member) => {
    setInlineEditingId(member.memberId)
    setInlineFormData({
      name: member.name,
      phone: member.phone,
      birthDate: member.birthDate,
      status: member.status,
      role: member.role,
    })
  }

  const handleInlineChange = (field: keyof UpdateMemberRequest, value: string) => {
    if (!inlineFormData) return
    setInlineFormData({
      ...inlineFormData,
      [field]: value,
    })
  }

  const handleInlineSave = async (memberId: number) => {
    if (!inlineFormData) return

    if (!inlineFormData.name) {
      alert('이름을 입력해주세요.')
      return
    }

    try {
      await updateMember(memberId, inlineFormData)
      alert('성도 정보가 수정되었습니다.')
      setInlineEditingId(null)
      setInlineFormData(null)
      loadMembers()
    } catch (error) {
      console.error('인라인 멤버 수정 실패:', error)
      alert('멤버 수정에 실패했습니다.')
    }
  }

  const handleInlineCancel = () => {
    setInlineEditingId(null)
    setInlineFormData(null)
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-xl">
                📋
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">성도 관리</p>
                <p className="text-xs text-slate-500">전체 성도 명단 관리</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-full bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            + 성도 등록
          </button>
        </header>

        {/* 통계 카드 */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">총 인원</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{members.length}명</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">재적</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {members.filter((m) => m.status === '재적').length}명
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">휴먼</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">
              {members.filter((m) => m.status === '휴먼').length}명
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">새신자</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">
              {members.filter((m) => m.status === '새신자').length}명
            </p>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="이름 또는 연락처로 검색..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="전체">전체</option>
              <option value="재적">재적</option>
              <option value="휴먼">휴먼</option>
              <option value="퇴회">퇴회</option>
              <option value="새신자">새신자</option>
            </select>
          </div>
        </div>

        {/* 성도 목록 */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">로딩 중...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 w-16">번호</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 w-40">
                      <button
                        type="button"
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                      >
                        이름
                        {sortField === 'name' && (
                          <span className="text-sky-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      <button
                        type="button"
                        onClick={() => handleSort('birthDate')}
                        className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                      >
                        생년월일
                        {sortField === 'birthDate' && (
                          <span className="text-sky-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      <button
                        type="button"
                        onClick={() => handleSort('phone')}
                        className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                      >
                        연락처
                        {sortField === 'phone' && (
                          <span className="text-sky-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      <button
                        type="button"
                        onClick={() => handleSort('role')}
                        className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                      >
                        역할
                        {sortField === 'role' && (
                          <span className="text-sky-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      <button
                        type="button"
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                      >
                        상태
                        {sortField === 'status' && (
                          <span className="text-sky-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                        등록된 성도가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    sortedMembers.map((member, index) => {
                      const isEditing = inlineEditingId === member.memberId && inlineFormData

                      return (
                        <tr
                          key={member.memberId}
                          className="hover:bg-slate-50 cursor-pointer"
                          onDoubleClick={() => startInlineEdit(member)}
                        >
                          <td className="px-4 py-3 text-sm text-slate-500">{index + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900 w-40">
                            {isEditing ? (
                              <input
                                type="text"
                                value={inlineFormData?.name || ''}
                                onChange={(e) => handleInlineChange('name', e.target.value)}
                                className="w-full h-8 rounded-lg border border-slate-300 px-2 text-sm"
                              />
                            ) : (
                              member.name
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {isEditing ? (
                              <input
                                type="date"
                                value={inlineFormData?.birthDate || ''}
                                onChange={(e) => handleInlineChange('birthDate', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                              />
                            ) : (
                              member.birthDate || '-'
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {isEditing ? (
                              <input
                                type="tel"
                                value={inlineFormData ? formatPhoneNumber(inlineFormData.phone || '') : ''}
                                onChange={(e) => handleInlineChange('phone', formatPhoneNumber(e.target.value))}
                                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                              />
                            ) : (
                              formatPhoneNumber(member.phone)
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <select
                                value={inlineFormData?.role || '일반'}
                                onChange={(e) => handleInlineChange('role', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                              >
                                <option value="일반">일반</option>
                                <option value="리더">리더</option>
                                <option value="순장">순장</option>
                              </select>
                            ) : (
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  roleColors[member.role as keyof typeof roleColors] || roleColors.일반
                                }`}
                              >
                                {member.role}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <select
                                value={inlineFormData?.status || '재적'}
                                onChange={(e) => handleInlineChange('status', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                              >
                                <option value="재적">재적</option>
                                <option value="휴먼">휴먼</option>
                                <option value="퇴회">퇴회</option>
                                <option value="새신자">새신자</option>
                              </select>
                            ) : (
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  statusColors[member.status as keyof typeof statusColors] || statusColors.재적
                                }`}
                              >
                                {member.status}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right w-24">
                            {isEditing ? (
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleInlineSave(member.memberId)}
                                  className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                  title="저장"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleInlineCancel}
                                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                                  title="취소"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => startInlineEdit(member)}
                                  className="rounded-lg p-2 text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                                  title="수정"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(member.memberId)}
                                  className="rounded-lg p-2 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                  title="삭제"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 모달 */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {editingMember ? '성도 수정' : '성도 등록'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">이름 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">연락처</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: formatPhoneNumber(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">생년월일</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">상태</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="재적">재적</option>
                      <option value="휴먼">휴먼</option>
                      <option value="퇴회">퇴회</option>
                      <option value="새신자">새신자</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">역할</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="일반">일반</option>
                      <option value="리더">리더</option>
                      <option value="순장">순장</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MemberManagePage

