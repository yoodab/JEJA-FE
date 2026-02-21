import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useConfirm } from '../contexts/ConfirmContext'
import { getMembers } from '../services/memberService'
import { 
  getClubs, 
  getClub, 
  createClub, 
  updateClub, 
  deleteClub, 
  addClubMember, 
  removeClubMember, 
  changeClubLeader 
} from '../services/clubService'
import ClubType, { ClubTypeLabels } from '../types/club'
import type { Club } from '../types/club'
import type { Member } from '../types/member'

const getClubColor = (type: ClubType) => {
  switch (type) {
    case ClubType.NEW_BELIEVER: return 'border-green-200 bg-green-50'
    case ClubType.WORSHIP: return 'border-purple-200 bg-purple-50'
    case ClubType.BROADCAST: return 'border-orange-200 bg-orange-50'
    case ClubType.CONTENT: return 'border-pink-200 bg-pink-50'
    case ClubType.DESIGN: return 'border-indigo-200 bg-indigo-50'
    case ClubType.SERVICE: return 'border-blue-200 bg-blue-50'
    case ClubType.HOBBY: return 'border-yellow-200 bg-yellow-50'
    default: return 'border-slate-200 bg-slate-50'
  }
}

const getClubColorText = (type: ClubType) => {
  switch (type) {
    case ClubType.NEW_BELIEVER: return 'text-green-700 bg-green-100'
    case ClubType.WORSHIP: return 'text-purple-700 bg-purple-100'
    case ClubType.BROADCAST: return 'text-orange-700 bg-orange-100'
    case ClubType.CONTENT: return 'text-pink-700 bg-pink-100'
    case ClubType.DESIGN: return 'text-indigo-700 bg-indigo-100'
    case ClubType.SERVICE: return 'text-blue-700 bg-blue-100'
    case ClubType.HOBBY: return 'text-yellow-700 bg-yellow-100'
    default: return 'text-slate-700 bg-slate-100'
  }
}

function TeamManagePage() {
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const [teams, setTeams] = useState<Club[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  
  const [editingTeam, setEditingTeam] = useState<Club | null>(null)
  const [detailTeam, setDetailTeam] = useState<Club | null>(null) // For member modal
  
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  // Form Data
  const [createFormData, setCreateFormData] = useState<{
    name: string
    description: string
    type: ClubType
    leaderMemberId: number | undefined
  }>({
    name: '',
    description: '',
    type: ClubType.SERVICE,
    leaderMemberId: undefined,
  })

  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
  })

  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])
  const [memberSearchTerm, setMemberSearchTerm] = useState('')

  // Initial Data Load
  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [clubsData, membersResponse] = await Promise.all([
        getClubs(),
        getMembers({ page: 0, size: 1000 })
      ])
      setTeams(clubsData)
      setMembers(membersResponse.content)
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      toast.error('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const data = await getClubs()
      setTeams(data)
    } catch (error) {
      console.error('팀 목록 로드 실패:', error)
    }
  }

  // Handlers
  const handleCreateTeam = async () => {
    if (!createFormData.name.trim()) {
      toast.error('팀 이름을 입력해주세요.')
      return
    }
    if (!createFormData.leaderMemberId) {
      toast.error('팀장을 선택해주세요.')
      return
    }

    try {
      await createClub({
        name: createFormData.name,
        description: createFormData.description,
        type: createFormData.type,
        leaderMemberId: createFormData.leaderMemberId,
      })
      toast.success('팀이 생성되었습니다.')
      setShowCreateModal(false)
      fetchTeams()
      resetCreateForm()
    } catch (error) {
      console.error('팀 생성 실패:', error)
      toast.error('팀 생성에 실패했습니다.')
    }
  }

  const handleEditTeam = (team: Club) => {
    setEditingTeam(team)
    setEditFormData({
      name: team.name,
      description: team.description,
    })
    setShowEditModal(true)
  }

  const handleUpdateTeam = async () => {
    if (!editingTeam) return
    if (!editFormData.name.trim()) {
      toast.error('팀 이름을 입력해주세요.')
      return
    }

    try {
      await updateClub(editingTeam.id, {
        name: editFormData.name,
        description: editFormData.description,
      })
      toast.success('팀 정보가 수정되었습니다.')
      setShowEditModal(false)
      setEditingTeam(null)
      fetchTeams()
    } catch (error) {
      console.error('팀 수정 실패:', error)
      toast.error('팀 수정에 실패했습니다.')
    }
  }

  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    const isConfirmed = await confirm({
      title: '팀 삭제',
      message: `정말로 "${teamName}" 팀을 삭제하시겠습니까?`,
      type: 'danger',
      confirmText: '삭제',
      cancelText: '취소',
    })

    if (isConfirmed) {
      try {
        await deleteClub(teamId)
        toast.success('팀이 삭제되었습니다.')
        fetchTeams()
      } catch (error) {
        console.error('팀 삭제 실패:', error)
        toast.error('팀 삭제에 실패했습니다.')
      }
    }
  }

  // Member Management Handlers
  const openMemberModal = async (team: Club) => {
    try {
      const detail = await getClub(team.id)
      setDetailTeam(detail)
      setShowMemberModal(true)
    } catch (error) {
      console.error('팀 상세 정보 로드 실패:', error)
      toast.error('팀 정보를 불러오는데 실패했습니다.')
    }
  }

  const handleAddMembers = async () => {
    if (!detailTeam || selectedMemberIds.length === 0) return

    try {
      // Run all add requests in parallel
      await Promise.all(
        selectedMemberIds.map(id => addClubMember(detailTeam.id, id))
      )
      
      // Refresh detail
      const updated = await getClub(detailTeam.id)
      setDetailTeam(updated)
      setSelectedMemberIds([])
      setMemberSearchTerm('')
      toast.success(`${selectedMemberIds.length}명의 팀원이 추가되었습니다.`)
      fetchTeams() // Update list count
    } catch (error) {
      console.error('팀원 추가 실패:', error)
      toast.error('일부 팀원 추가에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    if (!detailTeam) return
    const isConfirmed = await confirm({
      title: '팀원 제외',
      message: '정말로 이 팀원을 제외하시겠습니까?',
      type: 'danger',
      confirmText: '제외',
      cancelText: '취소',
    })

    if (!isConfirmed) return

    try {
      await removeClubMember(detailTeam.id, memberId)
      // Refresh detail
      const updated = await getClub(detailTeam.id)
      setDetailTeam(updated)
      toast.success('팀원이 제외되었습니다.')
      fetchTeams() // Update list count
    } catch (error) {
      console.error('팀원 제외 실패:', error)
      toast.error('팀원 제외에 실패했습니다.')
    }
  }

  const handleChangeLeader = async (newLeaderId: number) => {
    if (!detailTeam) return
    const isConfirmed = await confirm({
      title: '팀장 변경',
      message: '팀장을 변경하시겠습니까?',
      type: 'warning',
      confirmText: '변경',
      cancelText: '취소',
    })
    if (!isConfirmed) return

    try {
      await changeClubLeader(detailTeam.id, newLeaderId)
      // Refresh detail
      const updated = await getClub(detailTeam.id)
      setDetailTeam(updated)
      toast.success('팀장이 변경되었습니다.')
      fetchTeams() // Update list info
    } catch (error) {
      console.error('팀장 변경 실패:', error)
      toast.error('팀장 변경에 실패했습니다.')
    }
  }

  // Helper Functions
  const getFilteredCandidates = () => {
    if (!detailTeam) return []
    const existingIds = new Set(detailTeam.members?.map(m => m.memberId) || [])
    return members.filter(m => 
      !existingIds.has(m.memberId) && 
      (m.name || '').includes(memberSearchTerm)
    )
  }

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMemberIds(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const resetCreateForm = () => {
    setCreateFormData({
      name: '',
      description: '',
      type: ClubType.SERVICE,
      leaderMemberId: undefined,
    })
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowMemberModal(false)
    setEditingTeam(null)
    setDetailTeam(null)
    resetCreateForm()
  }

  const toggleMenu = (teamId: number) => {
    setOpenMenuId(openMenuId === teamId ? null : teamId)
  }

  const closeMenu = () => {
    setOpenMenuId(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* 헤더 */}
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-xl">
                🎯
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">팀 관리</p>
                <p className="text-xs text-slate-500">팀 생성 및 팀원 관리</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="rounded-full bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              + 새 팀 생성
            </button>
          </header>

          {/* 팀 목록 */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-10">
                <p className="text-slate-500">데이터를 불러오는 중입니다...</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className={`group relative rounded-xl border p-6 shadow-sm transition hover:shadow-md ${getClubColor(team.type)}`}
                  >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${getClubColorText(team.type)}`}>
                            {ClubTypeLabels[team.type]}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{team.name}</h2>
                        <p className="mt-2 text-sm text-slate-600 line-clamp-2">{team.description}</p>
                        <div className="mt-4 space-y-1 text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">팀장:</span> {team.leaderName || '미지정'}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">인원:</span> {team.memberCount}명
                          </div>
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
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        {/* 드롭다운 메뉴 */}
                        {openMenuId === team.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={closeMenu} />
                            <div className="absolute right-0 top-10 z-20 w-40 rounded-lg border border-slate-200 bg-white shadow-lg">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditTeam(team)
                                  closeMenu()
                                }}
                                className="flex w-full items-center gap-2 rounded-t-lg px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                              >
                                <span>✏️ 팀 정보 수정</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openMemberModal(team)
                                  closeMenu()
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                              >
                                <span>👥 인원 관리</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/club/${team.id}`)
                                  closeMenu()
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                              >
                                <span>🔍 상세보기</span>
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
                                <span>🗑️ 삭제</span>
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
        )}
      </div>
    </div>

        {/* 팀 생성 모달 */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">새 팀 생성</h2>
                <button onClick={closeModals} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">팀 이름 *</label>
                  <input
                    type="text"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="예: 찬양팀"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">팀 유형 *</label>
                  <select
                    value={createFormData.type}
                    onChange={(e) => setCreateFormData({ ...createFormData, type: e.target.value as ClubType })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    {Object.entries(ClubTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">팀 설명</label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">팀장 *</label>
                  <select
                    value={createFormData.leaderMemberId || ''}
                    onChange={(e) => setCreateFormData({ ...createFormData, leaderMemberId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="">팀장을 선택하세요</option>
                    {members.map((member) => (
                      <option key={member.memberId} value={member.memberId}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={closeModals} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">취소</button>
                <button onClick={handleCreateTeam} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">생성하기</button>
              </div>
            </div>
          </div>
        )}

        {/* 팀 정보 수정 모달 */}
        {showEditModal && editingTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">팀 정보 수정</h2>
                <button onClick={closeModals} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">팀 이름 *</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">팀 설명</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={closeModals} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">취소</button>
                <button onClick={handleUpdateTeam} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">수정하기</button>
              </div>
            </div>
          </div>
        )}

        {/* 팀 인원/리더 관리 모달 */}
        {showMemberModal && detailTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">팀 인원 관리 - {detailTeam.name}</h2>
                <button onClick={closeModals} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              
              {/* 팀장 관리 */}
              <div className="mb-6 rounded-lg bg-slate-50 p-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">팀장 위임</label>
                <select
                  value={detailTeam.leaderId || ''}
                  onChange={(e) => handleChangeLeader(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option value="" disabled>팀장 선택</option>
                  {detailTeam.members?.map((member) => (
                    <option key={member.memberId} value={member.memberId}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  * 팀원은 현재 팀에 소속된 인원 중에서만 선택 가능합니다.
                </p>
              </div>

              {/* 팀원 추가 */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">팀원 추가</label>
                
                {/* 검색 및 추가 버튼 */}
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={memberSearchTerm}
                      onChange={(e) => setMemberSearchTerm(e.target.value)}
                      placeholder="이름으로 검색..."
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={handleAddMembers}
                    disabled={selectedMemberIds.length === 0}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {selectedMemberIds.length}명 추가
                  </button>
                </div>

                {/* 후보 목록 (체크박스) */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 h-48 overflow-y-auto">
                  {getFilteredCandidates().length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-2">
                      {memberSearchTerm ? '검색 결과가 없습니다.' : '추가할 수 있는 팀원이 없습니다.'}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {getFilteredCandidates().map((member) => (
                        <label 
                          key={member.memberId} 
                          className="flex items-center gap-3 p-2 rounded hover:bg-white hover:shadow-sm cursor-pointer transition"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMemberIds.includes(member.memberId)}
                            onChange={() => toggleMemberSelection(member.memberId)}
                            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-slate-900">{member.name}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 팀원 목록 */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <h3 className="text-sm font-semibold text-slate-700">현재 팀원 ({detailTeam.members?.length || 0}명)</h3>
                {detailTeam.members?.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">등록된 팀원이 없습니다.</p>
                ) : (
                  detailTeam.members?.map((member) => (
                    <div key={member.memberId} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                      <div>
                        <span className="font-medium text-slate-900">{member.name}</span>
                        {member.memberId === detailTeam.leaderId && (
                          <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-xs font-bold text-violet-700">팀장</span>
                        )}
                      </div>
                      {member.memberId !== detailTeam.leaderId && (
                        <button
                          onClick={() => handleRemoveMember(member.memberId)}
                          className="text-slate-400 hover:text-red-600"
                          title="팀에서 제외"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button onClick={closeModals} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">닫기</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamManagePage
