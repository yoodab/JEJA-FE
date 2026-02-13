import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useConfirm } from '../contexts/ConfirmContext'
import type { Member, MemberStats } from '../types/member'
import { getMembers, createMember, updateMember, deleteMember, createMembersBatch, getMemberStats } from '../services/memberService'
import type { CreateMemberRequest, UpdateMemberRequest } from '../services/memberService'
import { formatMemberStatus, getMemberStatusColor, formatGender } from '../types/member'
import MemberDetailModal from '../components/member/MemberDetailModal'
import MemberEditModal from '../components/member/MemberEditModal'
import MemberStatusModal from '../components/member/MemberStatusModal'
import RoleSelectModal from '../components/member/RoleSelectModal'
import MemberExcelUploadModal from '../components/member/MemberExcelUploadModal'
import ImagePreviewModal from '../components/ImagePreviewModal'
import { formatPhoneNumber } from '../utils/format'
import { getFileUrl } from '../services/albumService'

function MemberManagePage() {
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  
  // Data State
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 10

  // Stats State
  const [stats, setStats] = useState<MemberStats>({
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0,
    newcomerCount: 0
  })

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('') // '' means ALL
  
  // Modal State
  const [detailMember, setDetailMember] = useState<Member | null>(null)
  const [editModalData, setEditModalData] = useState<{ open: boolean, member: Member | null }>({ 
    open: false, 
    member: null 
  })
  const [roleModalData, setRoleModalData] = useState<{ open: boolean, member: Member | null }>({ 
    open: false, 
    member: null 
  })
  const [statusModalData, setStatusModalData] = useState<{ open: boolean, member: Member | null }>({ 
    open: false, 
    member: null 
  })
  
  // Excel Upload State
  const [showExcelModal, setShowExcelModal] = useState(false)
  
  // Kebab Menu State
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number; bottom: number } | null>(null)
  const [openMenuUp, setOpenMenuUp] = useState(false)

  // Image Preview State
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Load Stats on Mount
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getMemberStats()
      setStats(data)
    } catch (error) {
      console.error('통계 로드 실패:', error)
    }
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getMembers({
        page: currentPage,
        size: pageSize,
        keyword: debouncedSearchTerm,
        status: selectedStatus || undefined
      })
      setMembers(response.content)
      setTotalPages(response.totalPages)
      setTotalElements(response.totalElements)
    } catch (error) {
      console.error('멤버 목록 로드 실패:', error)
      toast.error('멤버 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, debouncedSearchTerm, selectedStatus])

  // Load members when page, search term, or status changes
  useEffect(() => {
    loadMembers()
  }, [currentPage, debouncedSearchTerm, selectedStatus, loadMembers])

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(0)
  }, [debouncedSearchTerm, selectedStatus])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenuId !== null && !(event.target as Element).closest('.kebab-menu-container')) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeMenuId])

  const handleCreate = () => {
    setEditModalData({ open: true, member: null })
  }

  const handleEdit = (member: Member) => {
    setEditModalData({ open: true, member })
    setActiveMenuId(null)
  }

  const handleRoleEdit = (member: Member) => {
    setRoleModalData({ open: true, member })
    setActiveMenuId(null)
  }

  const handleStatusEdit = (member: Member) => {
    setStatusModalData({ open: true, member })
    setActiveMenuId(null)
  }

  const handleDelete = async (memberId: number) => {
    const isConfirmed = await confirm({
      title: '성도 삭제',
      message: '성도 정보를 삭제하시겠습니까?',
      type: 'danger',
      confirmText: '삭제',
      cancelText: '취소'
    })

    if (isConfirmed) {
      try {
        await deleteMember(memberId)
        toast.success('성도 정보가 삭제되었습니다.')
        loadMembers()
      } catch (error) {
        console.error('멤버 삭제 실패:', error)
        toast.error('멤버 삭제에 실패했습니다.')
      }
    }
    setActiveMenuId(null)
  }

  const handleSaveMember = async (data: CreateMemberRequest | UpdateMemberRequest) => {
    try {
      if (editModalData.member) {
        // Update
        await updateMember(editModalData.member.memberId, data as UpdateMemberRequest)
        toast.success('성도 정보가 수정되었습니다.')
      } else {
        // Create
        await createMember(data as CreateMemberRequest)
        toast.success('성도가 등록되었습니다.')
      }
      loadMembers()
      loadStats() // Reload stats
    } catch (error) {
      console.error('저장 실패:', error)
      toast.error('저장에 실패했습니다.')
    }
  }

  const handleSaveRole = async (memberId: number, roles: string[]) => {
    try {
      // roles만 업데이트하는 API가 별도로 없으므로 updateMember 사용
      // 기존 정보를 유지해야 하지만, updateMember 구현상 전체 필드를 보내야 하는지 확인 필요.
      // MemberController의 updateMember는 MemberUpdateRequestDto를 받음.
      // DTO 필드가 null이면 업데이트 안하는지, 아니면 null로 덮어쓰는지 확인 필요.
      // Member.java의 update 메소드:
      // this.name = dto.getName(); ... this.roles = dto.getRoles();
      // 즉, null이면 null로 덮어쓰거나 에러가 날 수 있음.
      // 따라서 기존 정보를 모두 채워서 보내야 함.

      const member = members.find(m => m.memberId === memberId)
      if (!member) return

      const payload: UpdateMemberRequest = {
        name: member.name,
        phone: member.phone,
        birthDate: member.birthDate,
        gender: member.gender,
        memberStatus: member.memberStatus as string,
        memberImageUrl: member.memberImageUrl || undefined,
        roles: roles
      }

      await updateMember(memberId, payload)
      toast.success('권한이 수정되었습니다.')
      setRoleModalData({ open: false, member: null })
      loadMembers()
    } catch (error) {
      console.error('권한 수정 실패:', error)
      toast.error('권한 수정에 실패했습니다.')
    }
  }

  const handleSaveStatus = async (memberId: number, status: string) => {
    try {
      const member = members.find(m => m.memberId === memberId)
      if (!member) return

      const payload: UpdateMemberRequest = {
        name: member.name,
        phone: member.phone,
        birthDate: member.birthDate,
        gender: member.gender,
        memberStatus: status,
        memberImageUrl: member.memberImageUrl || undefined,
        roles: member.roles.map(r => r.toString())
      }

      await updateMember(memberId, payload)
      toast.success('상태가 변경되었습니다.')
      loadMembers()
      loadStats()
    } catch (error) {
      console.error('상태 변경 실패:', error)
      toast.error('상태 변경에 실패했습니다.')
    }
  }

  const handleSaveExcelBatch = async (data: CreateMemberRequest[]) => {
    try {
      await createMembersBatch(data)
      toast.success(`${data.length}명의 성도가 등록되었습니다.`)
      loadMembers()
      loadStats()
    } catch (error) {
      console.error('엑셀 저장 실패:', error)
      throw error
    }
  }

  // Helper for Gender Display
  const getGenderDisplay = (gender: string) => {
    if (gender === 'MALE') return '남'
    if (gender === 'FEMALE') return '여'
    return '-'
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
              ← 
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowExcelModal(true)}
              className="rounded-full bg-green-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
            >
              📊 엑셀 업로드
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-full bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              + 성도 등록
            </button>
          </div>
        </header>

        {/* Statistics Cards (Grid Layout) */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">총 인원</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalCount}명</p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">재적</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {stats.activeCount}명
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">비활동 (장결/이동/졸업)</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">
              {stats.inactiveCount}명
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">새신자</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">
              {stats.newcomerCount}명
            </p>
          </div>
        </div>

        {/* Filter & Search */}
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
            <div className="w-full sm:w-auto">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">전체 상태</option>
                <option value="NEWCOMER">새신자</option>
                <option value="ACTIVE">재적</option>
                <option value="LONG_TERM_ABSENT">장결자</option>
                <option value="MOVED">교회 이동</option>
                <option value="GRADUATED">졸업</option>
              </select>
            </div>
          </div>
        </div>

        {/* Member Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">로딩 중...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-700 w-16">사진</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-700">이름</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-700 w-16">성별</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-700">생년월일</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-700">연락처</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-700">상태</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                        등록된 성도가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr
                        key={member.memberId}
                        onClick={() => setDetailMember(member)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200 flex items-center justify-center">
                            {member.memberImageUrl ? (
                              <img
                                src={getFileUrl(member.memberImageUrl)}
                                alt={member.name}
                                className="h-full w-full object-cover cursor-zoom-in hover:opacity-80 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setPreviewImage(getFileUrl(member.memberImageUrl || undefined))
                                }}
                              />
                            ) : (
                              <svg className="h-6 w-6 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-900">{member.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{formatGender(member.gender)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{member.birthDate || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{formatPhoneNumber(member.phone)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getMemberStatusColor(member.memberStatus as string)}`}>
                            {formatMemberStatus(member.memberStatus as string)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right kebab-menu-container">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const rect = e.currentTarget.getBoundingClientRect()
                              setMenuPos({ top: rect.top, right: rect.right, bottom: rect.bottom })
                              setOpenMenuUp(rect.bottom + 150 > window.innerHeight)
                              setActiveMenuId(activeMenuId === member.memberId ? null : member.memberId)
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Component */}
        {!loading && totalPages > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 mt-4">
            <div className="text-sm text-slate-600 text-center sm:text-left">
              전체 {totalElements}명 중 {(totalElements === 0 ? 0 : currentPage * pageSize + 1)}-{Math.min((currentPage + 1) * pageSize, totalElements)}명 표시
            </div>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <div className="flex items-center gap-1">
                {(() => {
                  const MAX_VISIBLE_PAGES = 5
                  let startPage = 0
                  let endPage = totalPages - 1

                  if (totalPages > MAX_VISIBLE_PAGES) {
                    const half = Math.floor(MAX_VISIBLE_PAGES / 2)
                    startPage = Math.max(0, currentPage - half)
                    endPage = startPage + MAX_VISIBLE_PAGES - 1

                    if (endPage >= totalPages) {
                      endPage = totalPages - 1
                      startPage = Math.max(0, endPage - MAX_VISIBLE_PAGES + 1)
                    }
                  }

                  const pages = []
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(i)
                  }

                  return pages.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {page + 1}
                    </button>
                  ))
                })()}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Global Kebab Menu */}
      {activeMenuId && menuPos && (
        <div
          className="fixed z-[100] w-24 rounded-lg border border-slate-100 bg-white shadow-lg overflow-hidden kebab-menu-container"
          style={{
            left: menuPos.right,
            top: openMenuUp ? menuPos.top + 10 : menuPos.bottom - 10,
            transform: `translateX(-100%) ${openMenuUp ? 'translateY(-100%)' : ''}`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const member = members.find((m) => m.memberId === activeMenuId)
              if (member) handleStatusEdit(member)
            }}
            className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            상태 변경
          </button>
          <button
            onClick={() => {
              const member = members.find((m) => m.memberId === activeMenuId)
              if (member) handleEdit(member)
            }}
            className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            수정
          </button>
          <button
            onClick={() => {
              const member = members.find((m) => m.memberId === activeMenuId)
              if (member) handleRoleEdit(member)
            }}
            className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            권한 수정
          </button>
          <button
            onClick={() => {
              handleDelete(activeMenuId)
            }}
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      )}

      {/* Modals */}
      {detailMember && (
        <MemberDetailModal 
          member={detailMember} 
          onClose={() => setDetailMember(null)} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
      
      {editModalData.open && (
        <MemberEditModal
          member={editModalData.member}
          onClose={() => setEditModalData({ open: false, member: null })}
          onSave={handleSaveMember}
        />
      )}

      {roleModalData.open && (
        <RoleSelectModal
          member={roleModalData.member}
          onClose={() => setRoleModalData({ open: false, member: null })}
          onSave={handleSaveRole}
        />
      )}

      {statusModalData.open && statusModalData.member && (
        <MemberStatusModal
          member={statusModalData.member}
          onClose={() => setStatusModalData({ open: false, member: null })}
          onSave={handleSaveStatus}
        />
      )}

      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}

      <MemberExcelUploadModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onSave={handleSaveExcelBatch}
      />
    </div>
  )
}

export default MemberManagePage
