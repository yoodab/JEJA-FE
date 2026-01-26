import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMembers } from '../services/memberService'
import type { Member } from '../types/member'

interface Team {
  id: number
  name: string
  description: string
  color: string
  leaderId?: number
  leaderName?: string
  memberIds?: number[]
  memberCount?: number
}

const colorOptions = [
  { value: 'blue', label: '파란색' },
  { value: 'purple', label: '보라색' },
  { value: 'green', label: '초록색' },
  { value: 'orange', label: '주황색' },
  { value: 'pink', label: '분홍색' },
  { value: 'indigo', label: '남색' },
  { value: 'red', label: '빨간색' },
  { value: 'yellow', label: '노란색' },
]

// 임시 데이터 (실제로는 API에서 가져올 데이터)
const initialTeams: Team[] = [
  {
    id: 1,
    name: '예배팀',
    description: '주일예배와 각종 예배를 섬기는 팀입니다.',
    color: 'blue',
    leaderId: 1,
    leaderName: '홍길동',
    memberIds: [1, 2, 3],
    memberCount: 3,
  },
  {
    id: 2,
    name: '찬양팀',
    description: '함께 찬양하며 예배하는 팀입니다.',
    color: 'purple',
    leaderId: 2,
    leaderName: '김찬양',
    memberIds: [2, 4, 5],
    memberCount: 3,
  },
  {
    id: 3,
    name: '새신자팀',
    description: '새신자들을 돌보고 양육하는 팀입니다.',
    color: 'green',
    leaderId: 3,
    leaderName: '이리더',
    memberIds: [3, 6],
    memberCount: 2,
  },
  {
    id: 4,
    name: '방송팀',
    description: '예배와 행사의 방송을 담당하는 팀입니다.',
    color: 'orange',
    leaderId: 4,
    leaderName: '박방송',
    memberIds: [4, 7, 8, 9],
    memberCount: 4,
  },
  {
    id: 5,
    name: '컨텐츠팀',
    description: '각종 콘텐츠 제작과 관리를 담당하는 팀입니다.',
    color: 'pink',
    leaderId: 5,
    leaderName: '최컨텐츠',
    memberIds: [5, 10],
    memberCount: 2,
  },
  {
    id: 6,
    name: '디자인팀',
    description: '각종 디자인 작업을 담당하는 팀입니다.',
    color: 'indigo',
    leaderId: 6,
    leaderName: '정디자인',
    memberIds: [6, 11, 12],
    memberCount: 3,
  },
]

function TeamManagePage() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [members, setMembers] = useState<Member[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue',
    leaderId: undefined as number | undefined,
    memberIds: [] as number[],
  })

  // 멤버 목록 로드
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await getMembers({ page: 0, size: 1000 })
        const data = response.content
        setMembers(data)
      } catch (error) {
        console.error('멤버 목록 로드 실패:', error)
        // API 실패 시에도 계속 진행 (임시 데이터 사용)
      }
    }
    fetchMembers()
  }, [])

  // 실제로는 API 호출: GET /api/admin/clubs
  useEffect(() => {
    // TODO: API 호출로 변경
    // const fetchTeams = async () => {
    //   const data = await getTeams()
    //   setTeams(data)
    // }
    // fetchTeams()
  }, [])

  const handleCreateTeam = () => {
    if (!formData.name.trim()) {
      alert('팀 이름을 입력해주세요.')
      return
    }
    if (!formData.description.trim()) {
      alert('팀 설명을 입력해주세요.')
      return
    }
    if (!formData.leaderId) {
      alert('팀장을 선택해주세요.')
      return
    }

    // 실제로는 API 호출: POST /api/admin/clubs
    const newId = Math.max(...teams.map(t => t.id), 0) + 1
    const leader = members.find(m => m.memberId === formData.leaderId)
    const createdTeam: Team = {
      id: newId,
      name: formData.name,
      description: formData.description,
      color: formData.color,
      leaderId: formData.leaderId,
      leaderName: leader?.name,
      memberIds: formData.memberIds,
      memberCount: formData.memberIds.length + 1, // 팀장 포함
    }
    setTeams([...teams, createdTeam])
    setFormData({ name: '', description: '', color: 'blue', leaderId: undefined, memberIds: [] })
    setShowCreateModal(false)
    alert('팀이 생성되었습니다.')
  }

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team)
    setFormData({
      name: team.name,
      description: team.description,
      color: team.color,
      leaderId: team.leaderId,
      memberIds: team.memberIds || [],
    })
    setShowEditModal(true)
  }

  const handleEditMembers = (team: Team) => {
    setEditingTeam(team)
    setFormData({
      name: team.name,
      description: team.description,
      color: team.color,
      leaderId: team.leaderId,
      memberIds: team.memberIds || [],
    })
    setShowMemberModal(true)
  }

  const handleUpdateTeam = () => {
    if (!formData.name.trim()) {
      alert('팀 이름을 입력해주세요.')
      return
    }
    if (!formData.description.trim()) {
      alert('팀 설명을 입력해주세요.')
      return
    }
    if (!editingTeam) return

    // 실제로는 API 호출: PATCH /api/admin/clubs/{clubId}
    const leader = members.find(m => m.memberId === formData.leaderId)
    setTeams(
      teams.map(t =>
        t.id === editingTeam.id
          ? {
              ...t,
              name: formData.name,
              description: formData.description,
              color: formData.color,
              leaderId: formData.leaderId,
              leaderName: leader?.name,
              memberIds: formData.memberIds,
              memberCount: formData.memberIds.length + (formData.leaderId ? 1 : 0),
            }
          : t
      )
    )
    setFormData({ name: '', description: '', color: 'blue', leaderId: undefined, memberIds: [] })
    setShowEditModal(false)
    setEditingTeam(null)
    alert('팀 정보가 수정되었습니다.')
  }

  const handleUpdateMembers = () => {
    if (!formData.leaderId) {
      alert('팀장을 선택해주세요.')
      return
    }
    if (!editingTeam) return

    // 실제로는 API 호출: POST /api/admin/clubs/{clubId}/members
    const leader = members.find(m => m.memberId === formData.leaderId)
    setTeams(
      teams.map(t =>
        t.id === editingTeam.id
          ? {
              ...t,
              leaderId: formData.leaderId,
              leaderName: leader?.name,
              memberIds: formData.memberIds,
              memberCount: formData.memberIds.length + 1, // 팀장 포함
            }
          : t
      )
    )
    setFormData({ name: '', description: '', color: 'blue', leaderId: undefined, memberIds: [] })
    setShowMemberModal(false)
    setEditingTeam(null)
    alert('팀 인원이 수정되었습니다.')
  }

  const handleDeleteTeam = (teamId: number, teamName: string) => {
    if (confirm(`정말로 "${teamName}" 팀을 삭제하시겠습니까?`)) {
      // 실제로는 API 호출: DELETE /api/admin/clubs/{clubId}
      setTeams(teams.filter(t => t.id !== teamId))
      alert('팀이 삭제되었습니다.')
    }
  }

  const openCreateModal = () => {
    setFormData({ name: '', description: '', color: 'blue', leaderId: undefined, memberIds: [] })
    setShowCreateModal(true)
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowMemberModal(false)
    setEditingTeam(null)
    setFormData({ name: '', description: '', color: 'blue', leaderId: undefined, memberIds: [] })
  }

  const toggleMemberSelection = (memberId: number) => {
    if (formData.leaderId === memberId) {
      alert('팀장은 팀원 목록에서 제외됩니다.')
      return
    }
    const newMemberIds = formData.memberIds.includes(memberId)
      ? formData.memberIds.filter(id => id !== memberId)
      : [...formData.memberIds, memberId]
    setFormData({ ...formData, memberIds: newMemberIds })
  }

  const toggleMenu = (teamId: number) => {
    setOpenMenuId(openMenuId === teamId ? null : teamId)
  }

  const closeMenu = () => {
    setOpenMenuId(null)
  }

  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    purple: 'border-purple-200 bg-purple-50',
    green: 'border-green-200 bg-green-50',
    orange: 'border-orange-200 bg-orange-50',
    pink: 'border-pink-200 bg-pink-50',
    indigo: 'border-indigo-200 bg-indigo-50',
    red: 'border-red-200 bg-red-50',
    yellow: 'border-yellow-200 bg-yellow-50',
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* 헤더 */}
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-xl">
                🎯
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">팀 관리</p>
                <p className="text-xs text-slate-500">팀 생성 및 팀원 관리</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-full bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            + 새 팀 생성
          </button>
        </header>

        {/* 팀 목록 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className={`group relative rounded-xl border p-6 shadow-sm transition hover:shadow-md ${
                colorClasses[team.color as keyof typeof colorClasses]
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-slate-900">{team.name}</h2>
                      <p className="mt-2 text-sm text-slate-600">{team.description}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                        {team.leaderName && (
                          <span>팀장: {team.leaderName}</span>
                        )}
                        <span>인원: {team.memberCount || 0}명</span>
                      </div>
                    </div>
                    {/* 메뉴 버튼 */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleMenu(team.id)
                        }}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        aria-label="메뉴"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>
                      {/* 드롭다운 메뉴 */}
                      {openMenuId === team.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={closeMenu}
                          />
                          <div className="absolute right-0 top-10 z-20 w-40 rounded-lg border border-slate-200 bg-white shadow-lg">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditTeam(team)
                                closeMenu()
                              }}
                              className="flex w-full items-center gap-2 rounded-t-lg px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              <svg
                                className="h-4 w-4 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              <span>팀 정보 수정</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditMembers(team)
                                closeMenu()
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              <svg
                                className="h-4 w-4 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                              <span>인원 수정</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/club/${team.id}`)
                                closeMenu()
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              <svg
                                className="h-4 w-4 text-slate-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              <span>상세보기</span>
                            </button>
                            <div className="border-t border-slate-200" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteTeam(team.id, team.name)
                                closeMenu()
                              }}
                              className="flex w-full items-center gap-2 rounded-b-lg px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              <span>삭제</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 팀 생성 모달 */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">새 팀 생성</h2>
                <button
                  onClick={closeModals}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    팀 이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="예: 찬양팀"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    팀 설명 *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    placeholder="팀에 대한 설명을 입력해주세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    색상
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition ${
                          formData.color === color.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    팀장 *
                  </label>
                  <select
                    value={formData.leaderId || ''}
                    onChange={(e) => setFormData({ ...formData, leaderId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">팀장을 선택하세요</option>
                    {members.map((member) => (
                      <option key={member.memberId} value={member.memberId}>
                        {member.name} ({member.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    팀원 선택
                  </label>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-300 p-2">
                    {members.length === 0 ? (
                      <p className="text-sm text-slate-500">멤버 목록을 불러오는 중...</p>
                    ) : (
                      members
                        .filter(m => m.memberId !== formData.leaderId)
                        .map((member) => (
                          <label
                            key={member.memberId}
                            className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.memberIds.includes(member.memberId)}
                              onChange={() => toggleMemberSelection(member.memberId)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">
                              {member.name} ({member.phone})
                            </span>
                          </label>
                        ))
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    선택된 팀원: {formData.memberIds.length}명
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeModals}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateTeam}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  생성하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 팀 수정 모달 */}
        {showEditModal && editingTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">팀 수정</h2>
                <button
                  onClick={closeModals}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    팀 이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="예: 찬양팀"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    팀 설명 *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    placeholder="팀에 대한 설명을 입력해주세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    색상
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition ${
                          formData.color === color.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    팀장 *
                  </label>
                  <select
                    value={formData.leaderId || ''}
                    onChange={(e) => setFormData({ ...formData, leaderId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">팀장을 선택하세요</option>
                    {members.map((member) => (
                      <option key={member.memberId} value={member.memberId}>
                        {member.name} ({member.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    팀원 선택
                  </label>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-300 p-2">
                    {members.length === 0 ? (
                      <p className="text-sm text-slate-500">멤버 목록을 불러오는 중...</p>
                    ) : (
                      members
                        .filter(m => m.memberId !== formData.leaderId)
                        .map((member) => (
                          <label
                            key={member.memberId}
                            className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.memberIds.includes(member.memberId)}
                              onChange={() => toggleMemberSelection(member.memberId)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">
                              {member.name} ({member.phone})
                            </span>
                          </label>
                        ))
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    선택된 팀원: {formData.memberIds.length}명
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeModals}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateTeam}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  수정하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 팀 인원 수정 모달 */}
        {showMemberModal && editingTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">팀 인원 수정</h2>
                <button
                  onClick={closeModals}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    팀명
                  </label>
                  <input
                    type="text"
                    value={editingTeam.name}
                    disabled
                    className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    팀장 *
                  </label>
                  <select
                    value={formData.leaderId || ''}
                    onChange={(e) => setFormData({ ...formData, leaderId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">팀장을 선택하세요</option>
                    {members.map((member) => (
                      <option key={member.memberId} value={member.memberId}>
                        {member.name} ({member.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    팀원 선택
                  </label>
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-300 p-2">
                    {members.length === 0 ? (
                      <p className="text-sm text-slate-500">멤버 목록을 불러오는 중...</p>
                    ) : (
                      members
                        .filter(m => m.memberId !== formData.leaderId)
                        .map((member) => (
                          <label
                            key={member.memberId}
                            className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.memberIds.includes(member.memberId)}
                              onChange={() => toggleMemberSelection(member.memberId)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">
                              {member.name} ({member.phone})
                            </span>
                          </label>
                        ))
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    선택된 팀원: {formData.memberIds.length}명 (팀장 포함 총 {formData.memberIds.length + (formData.leaderId ? 1 : 0)}명)
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeModals}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateMembers}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  수정하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamManagePage

