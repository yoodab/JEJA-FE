import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useConfirm } from '../contexts/ConfirmContext'
import { getMembers } from '../services/memberService'
import { sendAdminNotification } from '../services/notificationService'
import type { Member } from '../types/member'
import { formatRoles, getMemberStatusColor, formatMemberStatus } from '../types/member'

function NotificationSendPage() {
  const { confirm } = useConfirm()
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  
  // Member Selection State
  const [members, setMembers] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])
  
  const loadMembers = useCallback(async () => {
    try {
      setLoading(true)
      // Fetch all active members or search
      const response = await getMembers({
        page: 0,
        size: 50, // Limit to 50 for search results to avoid overload
        keyword: searchTerm,
        status: 'ACTIVE', // Default to active members
        hasAccount: true
      })
      setMembers(response.content)
    } catch (error) {
      console.error('Failed to load members', error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  // Load members when searching
  useEffect(() => {
    // 순장 전체 모드여도 개별 검색은 가능하게 함 (단, 순장 전체 선택 시 이미 추가된 상태)
    loadMembers()
  }, [loadMembers])

  // 순장 전체 추가 핸들러
  const handleAddAllSoonjangs = async () => {
    try {
      setLoading(true)
      const response = await getMembers({
        page: 0,
        size: 1000, // 충분히 큰 수
        role: 'CELL_LEADER',
        status: 'ACTIVE',
        hasAccount: true
      })
      
      const soonjangIds = response.content.map(m => m.memberId)
      
      setSelectedMemberIds(prev => {
        const newIds = new Set([...prev, ...soonjangIds])
        return Array.from(newIds)
      })
      
      toast.success(`순장 ${soonjangIds.length}명이 추가되었습니다.`)
    } catch (error) {
      console.error('Failed to load soonjangs', error)
      toast.error('순장 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleMemberSelect = (memberId: number) => {
    setSelectedMemberIds(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !body.trim()) {
      toast.error('제목과 내용을 입력해주세요.')
      return
    }

    if (selectedMemberIds.length === 0) {
      toast.error('발송할 대상을 선택해주세요.')
      return
    }

    const isConfirmed = await confirm({
      title: '알림 발송',
      message: `총 ${selectedMemberIds.length}명에게 알림을 발송하시겠습니까?`,
      type: 'warning',
      confirmText: '발송',
      cancelText: '취소'
    })
    
    if (!isConfirmed) return

    try {
      setSending(true)
      await sendAdminNotification({
        targetType: 'USER', // 항상 USER 모드로 전송 (순장도 개별 ID로 처리)
        targetMemberIds: selectedMemberIds,
        title,
        body
      })
      toast.success('알림이 발송되었습니다.')
      setTitle('')
      setBody('')
      setSelectedMemberIds([])
    } catch (error) {
      console.error('Failed to send notification', error)
      toast.error('알림 발송에 실패했습니다.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-xl">
                🔔
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">알림 보내기</h1>
                <p className="text-sm text-slate-500">앱 푸시 알림 발송</p>
              </div>
            </div>
          </header>

          <div className="grid gap-0 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* Left Column: Message Form */}
            <div className="p-6">
              <h2 className="mb-6 text-lg font-bold text-slate-900">메시지 작성</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">발송 대상 추가</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddAllSoonjangs}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      + 순장 전체 추가
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMemberIds([])}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      전체 해제
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">제목</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="알림 제목"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">내용</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={8}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="알림 내용"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {sending ? '발송 중...' : '알림 발송하기'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Target Selection */}
            <div className="p-6 flex flex-col h-[600px] md:h-auto">
              <h2 className="mb-6 text-lg font-bold text-slate-900 flex justify-between items-center">
                <span>대상 선택</span>
                <span className="text-sm font-normal text-slate-500">
                  선택됨: <span className="font-bold text-indigo-600">{selectedMemberIds.length}명</span>
                </span>
              </h2>
              
              <div className="mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="이름 검색..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50">
                {loading ? (
                  <div className="flex h-full items-center justify-center p-4 text-sm text-slate-500">로딩 중...</div>
                ) : members.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-4 text-sm text-slate-500">검색 결과가 없습니다.</div>
                ) : (
                  <div className="divide-y divide-slate-100 bg-white">
                    {members.map(member => (
                      <div
                        key={member.memberId}
                        onClick={() => handleMemberSelect(member.memberId)}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                          selectedMemberIds.includes(member.memberId) ? 'bg-indigo-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                          selectedMemberIds.includes(member.memberId) 
                            ? 'border-indigo-500 bg-indigo-500 text-white' 
                            : 'border-slate-300 bg-white'
                        }`}>
                          {selectedMemberIds.includes(member.memberId) && (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                          <div className="flex gap-2 text-xs text-slate-500">
                            <span>{formatRoles(member.roles)}</span>
                            <span className={getMemberStatusColor(member.memberStatus)}>{formatMemberStatus(member.memberStatus)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationSendPage
