import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Member {
  id: string
  name: string
  phone: string
  status: '재적' | '휴먼' | '퇴회' | '새신자'
  role: '리더' | '일반' | '순장'
}

interface Soon {
  id: string
  name: string
  leader: string
  leaderPhone: string
  members: Member[]
  year: number
}

// 임시 멤버 데이터 (스크롤 확인용으로 많게 생성)
const allMembers: Member[] = [
  { id: '1', name: '신은혜', phone: '010-1234-5678', status: '재적', role: '일반' },
  { id: '2', name: '최유나', phone: '010-2345-6789', status: '재적', role: '일반' },
  { id: '3', name: '정인아', phone: '010-3456-7890', status: '재적', role: '일반' },
  { id: '4', name: '정현주', phone: '010-4567-8901', status: '재적', role: '일반' },
  { id: '5', name: '한채은', phone: '010-5678-9012', status: '재적', role: '일반' },
  { id: '6', name: '윤다빈', phone: '010-6789-0123', status: '재적', role: '일반' },
  { id: '7', name: '최민규', phone: '010-7890-1234', status: '재적', role: '일반' },
  { id: '8', name: '한은혜', phone: '010-8901-2345', status: '재적', role: '일반' },
  { id: '9', name: '안지은', phone: '010-9012-3456', status: '재적', role: '일반' },
  { id: '10', name: '최성규', phone: '010-0123-4567', status: '재적', role: '일반' },
  { id: '11', name: '김리더', phone: '010-1111-2222', status: '재적', role: '순장' },
  { id: '12', name: '이리더', phone: '010-2222-3333', status: '재적', role: '순장' },
  { id: '13', name: '박리더', phone: '010-3333-4444', status: '재적', role: '순장' },
  { id: '14', name: '임시성도1', phone: '010-0000-0001', status: '재적', role: '일반' },
  { id: '15', name: '임시성도2', phone: '010-0000-0002', status: '재적', role: '일반' },
  { id: '16', name: '임시성도3', phone: '010-0000-0003', status: '재적', role: '일반' },
  { id: '17', name: '임시성도4', phone: '010-0000-0004', status: '재적', role: '일반' },
  { id: '18', name: '임시성도5', phone: '010-0000-0005', status: '재적', role: '일반' },
  { id: '19', name: '임시성도6', phone: '010-0000-0006', status: '재적', role: '일반' },
  { id: '20', name: '임시성도7', phone: '010-0000-0007', status: '재적', role: '일반' },
  { id: '21', name: '임시성도8', phone: '010-0000-0008', status: '재적', role: '일반' },
  { id: '22', name: '임시성도9', phone: '010-0000-0009', status: '재적', role: '일반' },
  { id: '23', name: '임시성도10', phone: '010-0000-0010', status: '재적', role: '일반' },
  { id: '24', name: '임시성도11', phone: '010-0000-0011', status: '재적', role: '일반' },
  { id: '25', name: '임시성도12', phone: '010-0000-0012', status: '재적', role: '일반' },
  { id: '26', name: '임시성도13', phone: '010-0000-0013', status: '재적', role: '일반' },
  { id: '27', name: '임시성도14', phone: '010-0000-0014', status: '재적', role: '일반' },
  { id: '28', name: '임시성도15', phone: '010-0000-0015', status: '재적', role: '일반' },
  { id: '29', name: '임시성도16', phone: '010-0000-0016', status: '재적', role: '일반' },
  { id: '30', name: '임시성도17', phone: '010-0000-0017', status: '재적', role: '일반' },
  { id: '31', name: '임시성도18', phone: '010-0000-0018', status: '재적', role: '일반' },
  { id: '32', name: '임시성도19', phone: '010-0000-0019', status: '재적', role: '일반' },
  { id: '33', name: '임시성도20', phone: '010-0000-0020', status: '재적', role: '일반' },
]

const initialSoons: Soon[] = [
  {
    id: '1',
    name: '김리더',
    leader: '김리더',
    leaderPhone: '010-1111-2222',
    members: [
      { id: '1', name: '신은혜', phone: '010-1234-5678', status: '재적', role: '일반' },
      { id: '2', name: '최유나', phone: '010-2345-6789', status: '재적', role: '일반' },
      { id: '11', name: '김리더', phone: '010-1111-2222', status: '재적', role: '순장' },
    ],
    year: 2024,
  },
  {
    id: '2',
    name: '이리더',
    leader: '이리더',
    leaderPhone: '010-2222-3333',
    members: [
      { id: '3', name: '정인아', phone: '010-3456-7890', status: '재적', role: '일반' },
      { id: '4', name: '정현주', phone: '010-4567-8901', status: '재적', role: '일반' },
      { id: '12', name: '이리더', phone: '010-2222-3333', status: '재적', role: '순장' },
    ],
    year: 2024,
  },
  {
    id: '3',
    name: '박리더',
    leader: '박리더',
    leaderPhone: '010-3333-4444',
    members: [
      { id: '5', name: '한채은', phone: '010-5678-9012', status: '재적', role: '일반' },
      { id: '6', name: '윤다빈', phone: '010-6789-0123', status: '재적', role: '일반' },
      { id: '13', name: '박리더', phone: '010-3333-4444', status: '재적', role: '순장' },
    ],
    year: 2024,
  },
]

function SoonManagePage() {
  const navigate = useNavigate()
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [soons, setSoons] = useState<Soon[]>(initialSoons)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSoonId, setEditingSoonId] = useState<string | null>(null)
  const [draggedMember, setDraggedMember] = useState<Member | null>(null)
  const [draggedFromSoon, setDraggedFromSoon] = useState<string | null>(null)
  const [unassignedSearch, setUnassignedSearch] = useState('')

  // 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    const hasModal = showAssignmentModal || showEditModal
    if (hasModal) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [showAssignmentModal, showEditModal])

  // 선택된 년도의 순들만 필터링
  const filteredSoons = soons.filter((soon) => soon.year === selectedYear)

  // 순에 배정되지 않은 멤버들
  const unassignedMembers = allMembers.filter((member) => {
    const assignedToAnySoon = filteredSoons.some((soon) =>
      soon.members.some((m) => m.id === member.id)
    )
    const notAssigned = !assignedToAnySoon
    const matchesSearch =
      member.name.toLowerCase().includes(unassignedSearch.toLowerCase()) ||
      member.phone.includes(unassignedSearch)
    return notAssigned && matchesSearch
  })

  const handleDragStart = (member: Member, soonId: string | null) => {
    setDraggedMember(member)
    setDraggedFromSoon(soonId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetSoonId: string) => {
    if (!draggedMember) return

    setSoons((prevSoons) => {
      const newSoons = prevSoons.map((soon) => {
        // 드래그 시작한 순에서 멤버 제거
        if (draggedFromSoon && soon.id === draggedFromSoon) {
          return {
            ...soon,
            members: soon.members.filter((m) => m.id !== draggedMember.id),
          }
        }
        // 드롭한 순에 멤버 추가
        if (soon.id === targetSoonId) {
          // 이미 있는 멤버인지 확인
          const exists = soon.members.some((m) => m.id === draggedMember.id)
          if (!exists) {
            return {
              ...soon,
              members: [...soon.members, draggedMember],
            }
          }
        }
        return soon
      })
      return newSoons
    })

    setDraggedMember(null)
    setDraggedFromSoon(null)
  }

  // 순장 위치로 드롭
  const handleDropToLeader = (targetSoonId: string) => {
    if (!draggedMember) return

    setSoons((prevSoons) => {
      const newSoons = prevSoons.map((soon) => {
        // 드래그 시작한 순에서 멤버 제거
        if (draggedFromSoon && soon.id === draggedFromSoon) {
          return {
            ...soon,
            members: soon.members.filter((m) => m.id !== draggedMember.id),
          }
        }
        // 드롭한 순의 순장 영역에 멤버 추가/업데이트
        if (soon.id === targetSoonId) {
          const exists = soon.members.some((m) => m.id === draggedMember.id)
          const baseMembers = exists
            ? soon.members.map((m) =>
                m.id === draggedMember.id ? { ...m, role: '순장' as const } : m
              )
            : [...soon.members, { ...draggedMember, role: '순장' as const }]

          return {
            ...soon,
            members: baseMembers,
          }
        }
        return soon
      })
      return newSoons
    })

    setDraggedMember(null)
    setDraggedFromSoon(null)
  }

  const handleRemoveMember = (soonId: string, memberId: string) => {
    setSoons((prevSoons) =>
      prevSoons.map((soon) =>
        soon.id === soonId
          ? {
              ...soon,
              members: soon.members.filter((m) => m.id !== memberId),
            }
          : soon
      )
    )
  }

  const handleSaveAssignment = () => {
    // 여기서 실제 저장 로직을 구현할 수 있습니다
    alert('순 배정이 저장되었습니다.')
    setShowAssignmentModal(false)
  }

  const handleAddSoon = () => {
    const newSoon: Soon = {
      id: Date.now().toString(),
      name: '',
      leader: '',
      leaderPhone: '',
      members: [],
      year: selectedYear,
    }
    setSoons([...soons, newSoon])
  }


  const handleEditSoon = (soonId: string) => {
    setEditingSoonId(soonId)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingSoonId(null)
  }

  const handleAddMemberToSoon = (soonId: string, memberId: string) => {
    const member = allMembers.find((m) => m.id === memberId)
    if (!member) return

    setSoons((prevSoons) =>
      prevSoons.map((soon) => {
        if (soon.id === soonId) {
          const exists = soon.members.some((m) => m.id === memberId)
          if (!exists) {
            return {
              ...soon,
              members: [...soon.members, member],
            }
          }
        }
        return soon
      })
    )
  }

  const editingSoon = editingSoonId ? soons.find((s) => s.id === editingSoonId) : null
  const editingSoonUnassignedMembers = editingSoon
    ? allMembers.filter((member) => {
        const assignedToEditingSoon = editingSoon.members.some((m) => m.id === member.id)
        const assignedToOtherSoon = filteredSoons
          .filter((s) => s.id !== editingSoonId)
          .some((soon) => soon.members.some((m) => m.id === member.id))
        return !assignedToEditingSoon && !assignedToOtherSoon
      })
    : []

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-xl">
                👥
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">순관리</p>
                <p className="text-xs text-slate-500">순 편성 및 순원 관리</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowAssignmentModal(true)}
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              순배정
            </button>
          </div>
        </header>

        {/* 통계 카드 */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">총 순 개수</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{filteredSoons.length}개</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">총 순원 수</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {filteredSoons.reduce((sum, soon) => sum + soon.members.length, 0)}명
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">미배정 인원</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">{unassignedMembers.length}명</p>
          </div>
        </div>

        {/* 순 목록 (카드 뷰) */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredSoons.map((soon) => {
            const normalMembers = soon.members.filter((m) => m.role !== '순장')
            const memberCount = normalMembers.length

            return (
              <div
                key={soon.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
              >
                <div>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">
                          {soon.name || '순 미정'}
                        </h3>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          {selectedYear}년
                        </span>
                      </div>
                    </div>
                    
                  </div>

                  {memberCount > 0 ? (
                    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 p-2">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-600">순원 목록</span>
                      </div>
                      <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                        {normalMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{member.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-4 text-center">
                      <p className="text-xs font-medium text-slate-500">아직 배정된 순원이 없습니다.</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        상단의 순배정 버튼을 눌러 순원을 배정해 주세요.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => handleEditSoon(soon.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition group-hover:bg-slate-800"
                  >
                    순원 추가
                    <span aria-hidden="true">＋</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* 순배정 모달 */}
        {showAssignmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="w-full max-w-6xl h-[88vh] rounded-2xl border border-slate-200 bg-white p-6 shadow-lg flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">{selectedYear}년 순 배정</h3>
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-hidden min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-[180px,minmax(0,1fr)] gap-4 h-full">
                  {/* 미배정 멤버 리스트 */}
                  <div className="h-full flex flex-col min-h-0 max-w-[180px]">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex-1 flex flex-col min-h-0">
                      <h4 className="mb-3 text-sm font-semibold text-slate-900">미배정 인원</h4>
                      <div className="mb-2">
                        <input
                          type="text"
                          value={unassignedSearch}
                          onChange={(e) => setUnassignedSearch(e.target.value)}
                          placeholder="이름 또는 연락처 검색"
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                        {unassignedMembers.map((member) => (
                          <div
                            key={member.id}
                            draggable
                            onDragStart={() => handleDragStart(member, null)}
                            className="cursor-move rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs hover:bg-blue-50 hover:border-blue-300"
                          >
                            <div className="font-medium text-slate-900">{member.name}</div>
                          </div>
                        ))}
                        {unassignedMembers.length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-4">모든 인원이 배정되었습니다</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 순별 영역 */}
                  <div className="h-full flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto pb-2 min-h-0">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 auto-rows-min">
                        {filteredSoons.map((soon) => {
                          const leaderMembers = soon.members.filter((m) => m.role === '순장')
                          const normalMembers = soon.members.filter((m) => m.role !== '순장')

                          return (
                            <div
                              key={soon.id}
                              className="rounded-lg border border-dashed border-slate-300 bg-white p-2 hover:border-emerald-400"
                            >
                              {/* 순장 위치 */}
                              <div
                                className="mb-3"
                                onDragOver={handleDragOver}
                                onDrop={() => handleDropToLeader(soon.id)}
                              >
                                <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-slate-700">
                                  <span>순장 위치</span>
                                </div>
                                <div className="min-h-[48px] rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 flex flex-col gap-1.5">
                                  {leaderMembers.length === 0 ? (
                                    <p className="text-[10px] text-slate-400 text-center py-2">
                                      여기로 드래그해서 순장을 배정하세요
                                    </p>
                                  ) : (
                                    leaderMembers.map((member) => (
                                      <div
                                        key={member.id}
                                        draggable
                                        onDragStart={() => handleDragStart(member, soon.id)}
                                        className="flex w-full items-center justify-between gap-2 rounded-md bg-white px-2 py-1 text-xs text-slate-900 shadow-sm cursor-move"
                                      >
                                        <span className="truncate">{member.name}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveMember(soon.id, member.id)}
                                          className="rounded-full px-2 py-0.5 text-[11px] text-rose-600 hover:bg-rose-50"
                                          aria-label="제거"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              {/* 순원 위치 */}
                              <div
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(soon.id)}
                              >
                                <p className="mb-1 text-[10px] font-medium text-slate-700">
                                  순원 위치 <span className="ml-1 text-[10px] text-slate-400">({normalMembers.length}명)</span>
                                </p>
                                <div className="min-h-[80px] rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 flex flex-col gap-1.5">
                                  {normalMembers.length === 0 && leaderMembers.length === 0 && (
                                    <p className="text-[10px] text-slate-400 text-center py-3">
                                      여기에 드래그해서 순원을 배정하세요
                                    </p>
                                  )}
                                  {normalMembers.map((member) => (
                                    <div
                                      key={member.id}
                                      draggable
                                      onDragStart={() => handleDragStart(member, soon.id)}
                                      className="flex w-full items-center justify-between gap-2 rounded-md bg-white px-2 py-1 text-xs text-slate-900 shadow-sm cursor-move"
                                    >
                                      <span className="truncate">{member.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveMember(soon.id, member.id)}
                                        className="rounded-full px-2 py-0.5 text-[11px] text-rose-600 hover:bg-rose-50"
                                        aria-label="제거"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        })}

                        {/* 새 순 추가 버튼 */}
                        <button
                          type="button"
                          onClick={handleAddSoon}
                          className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-3 text-sm font-semibold text-slate-600 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          + 새 순 추가
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 저장 버튼 */}
              <div className="mt-4 flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignment}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 순 수정 모달 - 순배정 모달과 유사한 레이아웃 */}
        {showEditModal && editingSoon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              {/* 헤더 */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    순 수정: {editingSoon.name || '순 미정'}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    순원 추가 및 제거는 여기에서, 순장 배정은 순배정 화면에서 관리할 수 있어요.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {/* 본문 */}
              <div className="flex-1 min-h-0">
                <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[220px,minmax(0,1fr)]">
                  {/* 추가 가능한 순원 리스트 (좌측) */}
                  <div className="flex min-h-0 flex-col">
                    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <h4 className="mb-2 text-sm font-semibold text-slate-900">추가 가능한 순원</h4>
                      <p className="mb-2 text-[11px] text-slate-500">
                        아직 어떤 순에도 속해있지 않은 사람들입니다.
                      </p>
                      <div className="mb-2">
                        <input
                          type="text"
                          value={unassignedSearch}
                          onChange={(e) => setUnassignedSearch(e.target.value)}
                          placeholder="이름 또는 연락처 검색"
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                        {editingSoonUnassignedMembers
                          .filter((member) => {
                            if (!unassignedSearch) return true
                            const keyword = unassignedSearch.toLowerCase()
                            return (
                              member.name.toLowerCase().includes(keyword) ||
                              member.phone.includes(unassignedSearch)
                            )
                          })
                          .map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => handleAddMemberToSoon(editingSoon.id, member.id)}
                              className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-left text-xs hover:border-emerald-400 hover:bg-emerald-50"
                            >
                              <div>
                                <div className="font-medium text-slate-900">{member.name}</div>
                                <div className="text-[11px] text-slate-500">{member.phone}</div>
                              </div>
                              <span className="text-[11px] font-semibold text-emerald-600">+ 추가</span>
                            </button>
                          ))}
                        {editingSoonUnassignedMembers.length === 0 && (
                          <p className="py-4 text-center text-xs text-slate-400">
                            추가 가능한 순원이 없습니다.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 선택된 순 정보 및 현재 순원 (우측) */}
                  <div className="flex min-h-0 flex-col gap-3">
                    {/* 순 요약 카드 */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-slate-900">
                              {editingSoon.name || '순 미정'}
                            </h4>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              {selectedYear}년
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            순장: {editingSoon.leader || '순장 미정'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-slate-500">현재 순원</p>
                          <p className="text-lg font-bold text-slate-900">
                            {editingSoon.members.length}
                            <span className="ml-0.5 text-xs font-medium text-slate-500">명</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 현재 순원 목록 */}
                    <div className="flex-1 min-h-0 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-900">
                          현재 순원 ({editingSoon.members.length}명)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          순원 이름 옆 ✕ 버튼으로 제거할 수 있어요.
                        </p>
                      </div>
                      {editingSoon.members.length > 0 ? (
                        <div className="max-h-full space-y-1 overflow-y-auto pt-1">
                          {editingSoon.members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700"
                            >
                              <span>{member.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(editingSoon.id, member.id)}
                                className="ml-1 rounded-full px-2 py-0.5 text-[10px] text-rose-500 hover:bg-rose-50"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-6">
                          <div className="text-center">
                            <p className="text-xs font-medium text-slate-500">
                              아직 이 순에 배정된 순원이 없습니다.
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              왼쪽 목록에서 순원을 선택해 추가해 주세요.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 하단 버튼 */}
              <div className="mt-4 flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SoonManagePage
