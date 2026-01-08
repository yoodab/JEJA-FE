import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMembers } from '../services/memberService'
import type { Member } from '../types/member'

type NewcomerStatus = '관리중' | '보류' | '중단' | '정착완료'

interface Newcomer {
  id: string
  mdName: string
  writeDate: string
  name: string
  registered: 'Y' | 'N'
  gender: '남성' | '여성'
  birthDate: string
  phone: string
  assignedSoon: string
  mentor: string
  address: string
  status: NewcomerStatus
  firstStatus: string
  middleStatus: string
  recentStatus: string
  soonAssignmentNote: string
}

const initialNewcomers: Newcomer[] = [
  {
    id: '1',
    mdName: '조형진',
    writeDate: '2024-12-01',
    name: '김동환',
    registered: 'Y',
    gender: '남성',
    birthDate: '2000-05-15',
    phone: '010-1234-5678',
    assignedSoon: '믿음셀',
    mentor: '김리더',
    address: '서울시 강남구',
    status: '관리중',
    firstStatus: '친구와 함께 첫 방문',
    middleStatus: '순모임 참석 시작',
    recentStatus: '정착 진행 중',
    soonAssignmentNote: '적극적인 성향, 빠른 순배치 권장',
  },
]

const messageTemplates = [
  {
    category: '필수',
    content: '안녕하세요. 000 형제/자매님~ 오늘 함께했던 MD 000입니다. 오늘 만나뵙게 되어서 정말 반가웠습니다. 앞으로 교회생활 하는데 있어서 제가 멘토처럼 함께해 드릴 예정이니 궁금하거나 문의사항 있으시면 언제든지 말해주세요!',
    timing: '당일',
    note: '대화 나누면서 인상깊었던 점이나 공통점 등을 추가적으로 문구에 넣어도 좋음\nex) 저랑 나이가 동갑이어서 그런지 더 반가웠던 것 같아요!',
  },
  {
    category: '필수',
    content: '청년부 공지 및 순모임 안내',
    timing: '정기적',
    note: '순에 배치는 되지만 순모임 단톡방에는 없기 때문에 정기적으로 공지를 공유해 주어야 함',
  },
  {
    category: '필수',
    content: '000 형제/자매님~ 안녕하세요!\n이번주 청년부 공지 공유드립니다.\n------공지------\n혹시 내일은 몇 부 예배 오시나요??\n------- 3부 예배 시 ------\n아 그럼 예배 마치시고, 0000에서 같이 식사 어떠신가요?',
    timing: '매주 토요일',
    note: '공지 보내면서 주일에 몇부에 오는지 확인. 가능하다면 식사도 같이 하자고 제안',
  },
  {
    category: '선택',
    content: '000 형제/자매님~ 이번주에 못뵜던 것 같아요.\n혹시 오셨었나요? (아프셨던 거는 괜찮으세요?)',
    timing: '주일 저녁 또는 월요일 오전',
    note: '안왔을 경우 근황 확인',
  },
  {
    category: '선택',
    content: '000 형제/자매님~  제가 내일은 개인 일정이 있어서\n부득이 하게 식사를 같이 못하게 되었어요. 대신 지난번에 함께 했던 0000이 연락드릴 예정이에요! 3부 예배 후, 1층에서 만나시면 될 것 같습니다.',
    timing: '토요일 오후',
    note: '담당MD가 식사를 챙기지 못할 시',
  },
  {
    category: '선택',
    content: '저희 이번에 (행사명)을 하는데 같이 가시는 건 어떠신가요?\n이 (행사명)이 0000도 하고, 00000 나눔도 있다보니 다녀오면 은혜가 많이 되더라구요. 000님도 함께 가면 너무나 재밌을 것 같아요!',
    timing: '행사 신청 기간',
    note: '비전심기, 수련회 등 청년부 주요 행사 신청기간에 신청 권장 카톡',
  },
]

interface MD {
  id: string
  time: '11시 예배' | '9시 예배'
  gender: '남성' | '여성'
  name: string
  phone: string
  ageGroup: string // 담당 나이대
  memberId?: number // 새신자 팀원 ID
}

const initialMdRnr: MD[] = [
  { id: '1', time: '11시 예배', gender: '남성', name: '조형진', phone: '01031852256', ageGroup: '20대' },
  { id: '2', time: '11시 예배', gender: '여성', name: '김다정', phone: '01097711945', ageGroup: '20대' },
  { id: '3', time: '11시 예배', gender: '여성', name: '최유나', phone: '01099233833', ageGroup: '20대' },
  { id: '4', time: '11시 예배', gender: '남성', name: '여인혁', phone: '01059060278', ageGroup: '20대' },
  { id: '5', time: '9시 예배', gender: '남성', name: '이민규', phone: '01031544017', ageGroup: '20대' },
  { id: '6', time: '9시 예배', gender: '여성', name: '한채은', phone: '01071059473', ageGroup: '20대' },
]

function NewcomerManagePage() {
  const navigate = useNavigate()
  const [newcomers, setNewcomers] = useState<Newcomer[]>(initialNewcomers)
  const [showModal, setShowModal] = useState(false)
  const [editingNewcomer, setEditingNewcomer] = useState<Newcomer | null>(null)
  const [selectedNewcomer, setSelectedNewcomer] = useState<Newcomer | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [openMdMenuId, setOpenMdMenuId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'messages' | 'rnr' | 'meal'>('list')
  const [statusTab, setStatusTab] = useState<'전체' | NewcomerStatus>('전체')
  const [mdList, setMdList] = useState<MD[]>(initialMdRnr)
  const [showMdModal, setShowMdModal] = useState(false)
  const [editingMd, setEditingMd] = useState<MD | null>(null)
  const [teamMembers, setTeamMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusChangeTarget, setStatusChangeTarget] = useState<Newcomer | null>(null)
  const [mdFormData, setMdFormData] = useState<Omit<MD, 'id'>>({
    time: '11시 예배',
    gender: '남성',
    name: '',
    phone: '',
    ageGroup: '',
    memberId: undefined,
  })
  const [formData, setFormData] = useState<Omit<Newcomer, 'id'>>({
    mdName: '',
    writeDate: new Date().toISOString().split('T')[0],
    name: '',
    registered: 'N',
    gender: '남성',
    birthDate: '',
    phone: '',
    assignedSoon: '',
    mentor: '',
    address: '',
    status: '관리중',
    firstStatus: '',
    middleStatus: '',
    recentStatus: '',
    soonAssignmentNote: '',
  })

  const handleCreate = () => {
    setEditingNewcomer(null)
    setFormData({
      mdName: '',
      writeDate: new Date().toISOString().split('T')[0],
      name: '',
      registered: 'N',
      gender: '남성',
      birthDate: '',
      phone: '',
      assignedSoon: '',
      mentor: '',
      address: '',
      status: '관리중',
      firstStatus: '',
      middleStatus: '',
      recentStatus: '',
      soonAssignmentNote: '',
    })
    setShowModal(true)
  }

  const handleEdit = (newcomer: Newcomer) => {
    setEditingNewcomer(newcomer)
    setFormData({
      mdName: newcomer.mdName,
      writeDate: newcomer.writeDate,
      name: newcomer.name,
      registered: newcomer.registered,
      gender: newcomer.gender,
      birthDate: newcomer.birthDate,
      phone: newcomer.phone,
      assignedSoon: newcomer.assignedSoon,
      mentor: newcomer.mentor,
      address: newcomer.address,
      status: newcomer.status,
      firstStatus: newcomer.firstStatus,
      middleStatus: newcomer.middleStatus,
      recentStatus: newcomer.recentStatus,
      soonAssignmentNote: newcomer.soonAssignmentNote,
    })
    setShowModal(true)
  }

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    if (confirm('새신자 정보를 삭제하시겠습니까?')) {
      setNewcomers(newcomers.filter((n) => n.id !== id))
      if (selectedNewcomer?.id === id) {
        setIsDetailModalOpen(false)
        setSelectedNewcomer(null)
      }
    }
  }

  const handleRowClick = (newcomer: Newcomer) => {
    setSelectedNewcomer(newcomer)
    setIsBasicInfoOpen(false)
    setIsDetailModalOpen(true)
  }

  const handleEditClick = (newcomer: Newcomer, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    handleEdit(newcomer)
  }

  // 새신자 팀원 목록 로드
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const allMembers = await getMembers()
        // 새신자팀(clubId: 3) 멤버 필터링 (임시로 모든 멤버 사용, 실제로는 팀별 필터링 필요)
        setTeamMembers(allMembers)
      } catch (error) {
        console.error('팀원 목록 로드 실패:', error)
      }
    }
    fetchTeamMembers()
  }, [])

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null)
      setOpenMdMenuId(null)
    }
    if (openMenuId || openMdMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [openMenuId, openMdMenuId])

  // 상태 변경 핸들러
  const handleStatusChange = (newcomerId: string, newStatus: NewcomerStatus) => {
    setNewcomers(newcomers.map((n) => (n.id === newcomerId ? { ...n, status: newStatus } : n)))
    setShowStatusModal(false)
    setStatusChangeTarget(null)
  }

  // 상태 변경 모달 열기
  const handleOpenStatusModal = (newcomer: Newcomer) => {
    setStatusChangeTarget(newcomer)
    setShowStatusModal(true)
    setOpenMenuId(null)
  }

  // 상태별 필터링 및 검색
  const filteredNewcomers = (statusTab === '전체' 
    ? newcomers 
    : newcomers.filter((n) => n.status === statusTab)
  ).filter((n) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      n.name.toLowerCase().includes(query) ||
      n.mdName.toLowerCase().includes(query) ||
      n.phone.includes(query) ||
      n.address.toLowerCase().includes(query)
    )
  })

  // 페이징 계산
  const totalPages = Math.ceil(filteredNewcomers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedNewcomers = filteredNewcomers.slice(startIndex, endIndex)

  // 검색어 변경 시 첫 페이지로
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusTab])

  // 상태 색상
  const getStatusColor = (status: NewcomerStatus) => {
    switch (status) {
      case '관리중':
        return 'bg-blue-100 text-blue-700'
      case '보류':
        return 'bg-yellow-100 text-yellow-700'
      case '중단':
        return 'bg-red-100 text-red-700'
      case '정착완료':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const handleSave = () => {
    if (!formData.name || !formData.writeDate) {
      alert('새신자명과 작성일자를 입력해주세요.')
      return
    }

    if (editingNewcomer) {
      setNewcomers(newcomers.map((n) => (n.id === editingNewcomer.id ? { ...editingNewcomer, ...formData } : n)))
    } else {
      const newNewcomer: Newcomer = {
        id: Date.now().toString(),
        ...formData,
      }
      setNewcomers([...newcomers, newNewcomer])
    }
    setShowModal(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('클립보드에 복사되었습니다.')
  }

  // MD 관련 함수들
  const handleCreateMd = () => {
    setEditingMd(null)
    setMdFormData({
      time: '11시 예배',
      gender: '남성',
      name: '',
      phone: '',
      ageGroup: '',
      memberId: undefined,
    })
    setShowMdModal(true)
  }

  const handleEditMd = (md: MD) => {
    setEditingMd(md)
    setMdFormData({
      time: md.time,
      gender: md.gender,
      name: md.name,
      phone: md.phone,
      ageGroup: md.ageGroup,
      memberId: md.memberId,
    })
    setShowMdModal(true)
  }

  const handleDeleteMd = (id: string) => {
    if (confirm('MD 배치를 삭제하시겠습니까?')) {
      setMdList(mdList.filter((md) => md.id !== id))
    }
  }

  const handleSaveMd = () => {
    if (!mdFormData.name || !mdFormData.phone || !mdFormData.ageGroup) {
      alert('이름, 연락처, 담당 나이대를 모두 입력해주세요.')
      return
    }

    if (editingMd) {
      setMdList(mdList.map((md) => (md.id === editingMd.id ? { ...editingMd, ...mdFormData } : md)))
    } else {
      const newMd: MD = {
        id: Date.now().toString(),
        ...mdFormData,
      }
      setMdList([...mdList, newMd])
    }
    setShowMdModal(false)
  }

  const handleMemberSelect = (member: Member) => {
    setMdFormData({
      ...mdFormData,
      name: member.name,
      phone: member.phone,
      memberId: member.memberId,
    })
  }

  const tabs = [
    { id: 'list', label: '새신자 목록' },
    { id: 'messages', label: '자주 사용하는 문자 양식' },
    { id: 'rnr', label: 'MD 배치 관리' },
    { id: 'meal', label: '25년도 식권사용내역' },
  ]

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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl">
                🌸
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">새신자 관리</p>
                <p className="text-xs text-slate-500">새신자 등록 및 관리</p>
              </div>
            </div>
          </div>
          {activeTab === 'list' && (
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              + 새신자 등록
            </button>
          )}
        </header>

        {/* 탭 */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex overflow-x-auto border-b border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* 새신자 목록 탭 */}
            {activeTab === 'list' && (
              <div className="space-y-4">
                {/* 검색 및 상태 탭 */}
                <div className="space-y-3">
                  {/* 검색 바 */}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="이름, MD명, 연락처, 거주지로 검색..."
                      className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  {/* 상태 탭 */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                    <div className="flex gap-2">
                      {(['전체', '관리중', '보류', '중단', '정착완료'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setStatusTab(tab)}
                          className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            statusTab === tab
                              ? tab === '전체'
                                ? 'bg-slate-600 text-white'
                                : tab === '관리중'
                                ? 'bg-blue-600 text-white'
                                : tab === '보류'
                                ? 'bg-yellow-600 text-white'
                                : tab === '중단'
                                ? 'bg-red-600 text-white'
                                : 'bg-green-600 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 새신자 테이블 */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">새신자명</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">담당 MD</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">상태</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">등록여부</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">성별</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">생년월일</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">연락처</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">거주지</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">작업</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {paginatedNewcomers.map((newcomer) => (
                          <tr
                            key={newcomer.id}
                            onClick={() => handleRowClick(newcomer)}
                            className="cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm font-medium text-slate-900">{newcomer.name}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{newcomer.mdName || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(newcomer.status)}`}>
                                {newcomer.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                                newcomer.registered === 'Y' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {newcomer.registered === 'Y' ? '등록' : '미등록'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{newcomer.gender}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{newcomer.birthDate || '-'}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{newcomer.phone || '-'}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{newcomer.address || '-'}</td>
                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="relative inline-block">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenMenuId(openMenuId === newcomer.id ? null : newcomer.id)
                                  }}
                                  className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>
                                {openMenuId === newcomer.id && (
                                  <div className="absolute right-0 top-8 z-10 w-40 rounded-lg border border-slate-200 bg-white shadow-lg">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEditClick(newcomer, e)
                                        setOpenMenuId(null)
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
                                    >
                                      수정
                                    </button>
                                    <div className="border-t border-slate-200">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleOpenStatusModal(newcomer)
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                      >
                                        상태 변경
                                      </button>
                                    </div>
                                    <div className="border-t border-slate-200">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDelete(newcomer.id, e)
                                          setOpenMenuId(null)
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {/* 최소 10행 높이 유지를 위한 빈 행 */}
                        {paginatedNewcomers.length < itemsPerPage &&
                          Array.from({ length: itemsPerPage - paginatedNewcomers.length }).map((_, index) => (
                            <tr key={`empty-${index}`} className="h-[52px]">
                              <td colSpan={9} className="px-4 py-3"></td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 페이징 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <div className="text-sm text-slate-600">
                      전체 {filteredNewcomers.length}명 중 {startIndex + 1}-{Math.min(endIndex, filteredNewcomers.length)}명 표시
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
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
                                {page}
                              </button>
                            )
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return <span key={page} className="px-2 text-slate-400">...</span>
                          }
                          return null
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 자주 사용하는 문자 양식 탭 */}
            {activeTab === 'messages' && (
              <div className="space-y-4">
                <div className="mb-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                  <p className="font-semibold">* 파란색(000)이 변경해야 될 문구</p>
                </div>
                {messageTemplates.map((template, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                        template.category === '필수' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {template.category}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">전송시기: {template.timing}</span>
                    </div>
                    <div className="mb-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                      {template.content}
                    </div>
                    <div className="flex items-start justify-between">
                      <p className="text-xs text-slate-500">{template.note}</p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(template.content)}
                        className="ml-4 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                      >
                        복사
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MD R&R 탭 */}
            {activeTab === 'rnr' && (
              <div className="space-y-4">
                {/* MD 배치 버튼 */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCreateMd}
                    className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    + MD 배치
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">구 분</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">성별</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">담당</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">담당 나이대</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">연락처</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-700">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {mdList.map((md) => (
                        <tr key={md.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-900">{md.time}</td>
                          <td className="px-4 py-3 text-slate-600">{md.gender}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{md.name}</td>
                          <td className="px-4 py-3 text-slate-600">{md.ageGroup}</td>
                          <td className="px-4 py-3 text-slate-600">{md.phone}</td>
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="relative inline-block">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenMdMenuId(openMdMenuId === md.id ? null : md.id)
                                }}
                                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                              {openMdMenuId === md.id && (
                                <div className="absolute right-0 top-8 z-10 w-32 rounded-lg border border-slate-200 bg-white shadow-lg">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditMd(md)
                                      setOpenMdMenuId(null)
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
                                  >
                                    수정
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteMd(md.id)
                                      setOpenMdMenuId(null)
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                                  >
                                    삭제
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 25년도 식권사용내역 탭 */}
            {activeTab === 'meal' && (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm text-slate-500">식권사용내역 데이터가 없습니다.</p>
                <p className="mt-2 text-xs text-slate-400">추가 기능은 추후 구현 예정입니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 상세 정보 모달 */}
        {isDetailModalOpen && selectedNewcomer && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => {
              setIsDetailModalOpen(false)
              setSelectedNewcomer(null)
            }}
          >
            <div 
              className="w-full max-w-2xl h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 flex-shrink-0 rounded-t-2xl">
                <h3 className="text-lg font-semibold text-slate-900">새신자 상세 정보</h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    setSelectedNewcomer(null)
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 모달 내용 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 이름 (항상 표시) */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedNewcomer.name}</h3>
                </div>

                {/* 기본 정보 (토글로 접기/펼치기) */}
                <div>
                  <button
                    type="button"
                    onClick={() => setIsBasicInfoOpen(!isBasicInfoOpen)}
                    className="flex w-full items-center justify-between mb-4 text-base font-semibold text-slate-900 hover:text-slate-700"
                  >
                    <span>기본 정보</span>
                    <svg
                      className={`h-5 w-5 transition-transform ${isBasicInfoOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isBasicInfoOpen && (
                    <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">등록여부</p>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          selectedNewcomer.registered === 'Y' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {selectedNewcomer.registered === 'Y' ? '등록' : '미등록'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">성별</p>
                        <p className="text-sm font-medium text-slate-700">{selectedNewcomer.gender}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">생년월일</p>
                        <p className="text-sm font-medium text-slate-700">{selectedNewcomer.birthDate || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">연락처</p>
                        <p className="text-sm font-medium text-slate-700">{selectedNewcomer.phone || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">거주지</p>
                        <p className="text-sm font-medium text-slate-700">{selectedNewcomer.address || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">순</p>
                        <p className="text-sm font-medium text-slate-700">{selectedNewcomer.assignedSoon || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">담당 MD명</p>
                        <p className="text-sm font-medium text-slate-700">{selectedNewcomer.mdName || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">작성일자</p>
                        <p className="text-sm font-medium text-slate-700">{selectedNewcomer.writeDate || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">멘토</p>
                        <p className="text-sm font-medium text-slate-700">{selectedNewcomer.mentor || '-'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 현황 정보 */}
                <div>
                  <h4 className="mb-4 text-base font-semibold text-slate-900">현황 정보</h4>
                  <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-700">처음현황</label>
                      <textarea
                        value={selectedNewcomer.firstStatus}
                        onChange={(e) => {
                          const updated = { ...selectedNewcomer, firstStatus: e.target.value }
                          setSelectedNewcomer(updated)
                          setNewcomers(newcomers.map((n) => (n.id === selectedNewcomer.id ? updated : n)))
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
                        placeholder="처음 현황을 입력하세요..."
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-700">중간현황</label>
                      <textarea
                        value={selectedNewcomer.middleStatus}
                        onChange={(e) => {
                          const updated = { ...selectedNewcomer, middleStatus: e.target.value }
                          setSelectedNewcomer(updated)
                          setNewcomers(newcomers.map((n) => (n.id === selectedNewcomer.id ? updated : n)))
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
                        placeholder="중간 현황을 입력하세요..."
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-700">최근현황</label>
                      <textarea
                        value={selectedNewcomer.recentStatus}
                        onChange={(e) => {
                          const updated = { ...selectedNewcomer, recentStatus: e.target.value }
                          setSelectedNewcomer(updated)
                          setNewcomers(newcomers.map((n) => (n.id === selectedNewcomer.id ? updated : n)))
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
                        placeholder="최근 현황을 입력하세요..."
                      />
                    </div>
                  </div>
                </div>

                {/* 순배치 참고 내용 (마지막) */}
                <div>
                  <h4 className="mb-4 text-base font-semibold text-slate-900">순배치 참고 내용</h4>
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <textarea
                      value={selectedNewcomer.soonAssignmentNote}
                      onChange={(e) => {
                        const updated = { ...selectedNewcomer, soonAssignmentNote: e.target.value }
                        setSelectedNewcomer(updated)
                        setNewcomers(newcomers.map((n) => (n.id === selectedNewcomer.id ? updated : n)))
                      }}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[100px]"
                      placeholder="순배치 참고 내용을 입력하세요..."
                    />
                  </div>
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 flex-shrink-0 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    setSelectedNewcomer(null)
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleEditClick(selectedNewcomer)
                    setIsDetailModalOpen(false)
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  수정
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 등록/수정 모달 */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {editingNewcomer ? '새신자 수정' : '새신자 등록'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">담당 MD명 *</label>
                  <input
                    type="text"
                    value={formData.mdName}
                    onChange={(e) => setFormData({ ...formData, mdName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">작성일자 *</label>
                  <input
                    type="date"
                    value={formData.writeDate}
                    onChange={(e) => setFormData({ ...formData, writeDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">새신자명 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">등록 여부</label>
                  <select
                    value={formData.registered}
                    onChange={(e) => setFormData({ ...formData, registered: e.target.value as 'Y' | 'N' })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">상태</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as NewcomerStatus })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="관리중">관리중</option>
                    <option value="보류">보류</option>
                    <option value="중단">중단</option>
                    <option value="정착완료">정착완료</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">성별</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as '남성' | '여성' })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="남성">남성</option>
                    <option value="여성">여성</option>
                  </select>
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
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">연락처</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="010-0000-0000"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">배치순</label>
                  <input
                    type="text"
                    value={formData.assignedSoon}
                    onChange={(e) => setFormData({ ...formData, assignedSoon: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">멘토</label>
                  <input
                    type="text"
                    value={formData.mentor}
                    onChange={(e) => setFormData({ ...formData, mentor: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">거주지</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">처음에 알게 된 현황</label>
                  <textarea
                    value={formData.firstStatus}
                    onChange={(e) => setFormData({ ...formData, firstStatus: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">중간 현황</label>
                  <textarea
                    value={formData.middleStatus}
                    onChange={(e) => setFormData({ ...formData, middleStatus: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">최근 현황</label>
                  <textarea
                    value={formData.recentStatus}
                    onChange={(e) => setFormData({ ...formData, recentStatus: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">순배치참고</label>
                  <textarea
                    value={formData.soonAssignmentNote}
                    onChange={(e) => setFormData({ ...formData, soonAssignmentNote: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={2}
                  />
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
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MD 배치 모달 */}
        {showMdModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {editingMd ? 'MD 배치 수정' : 'MD 배치 추가'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">새신자 팀원 선택</label>
                  <select
                    value={mdFormData.memberId || ''}
                    onChange={(e) => {
                      const selectedMember = teamMembers.find((m) => m.memberId === Number(e.target.value))
                      if (selectedMember) {
                        handleMemberSelect(selectedMember)
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">팀원을 선택하세요</option>
                    {teamMembers.map((member) => (
                      <option key={member.memberId} value={member.memberId}>
                        {member.name} ({member.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">예배 시간 *</label>
                  <select
                    value={mdFormData.time}
                    onChange={(e) => setMdFormData({ ...mdFormData, time: e.target.value as '11시 예배' | '9시 예배' })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="11시 예배">11시 예배</option>
                    <option value="9시 예배">9시 예배</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">성별 *</label>
                  <select
                    value={mdFormData.gender}
                    onChange={(e) => setMdFormData({ ...mdFormData, gender: e.target.value as '남성' | '여성' })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="남성">남성</option>
                    <option value="여성">여성</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">이름 *</label>
                  <input
                    type="text"
                    value={mdFormData.name}
                    onChange={(e) => setMdFormData({ ...mdFormData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="이름을 입력하세요"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">연락처 *</label>
                  <input
                    type="tel"
                    value={mdFormData.phone}
                    onChange={(e) => setMdFormData({ ...mdFormData, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="010-0000-0000"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">담당 나이대 *</label>
                  <input
                    type="text"
                    value={mdFormData.ageGroup}
                    onChange={(e) => setMdFormData({ ...mdFormData, ageGroup: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="예: 20대, 30대, 20-30대 등"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMdModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveMd}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 상태 변경 모달 */}
        {showStatusModal && statusChangeTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">상태 변경</h3>
              <div className="mb-4">
                <p className="text-sm text-slate-600 mb-2">
                  <span className="font-semibold">{statusChangeTarget.name}</span>님의 상태를 변경하시겠습니까?
                </p>
                <p className="text-xs text-slate-500">
                  현재 상태: <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(statusChangeTarget.status)}`}>{statusChangeTarget.status}</span>
                </p>
              </div>
              <div className="space-y-2 mb-6">
                {(['관리중', '보류', '중단', '정착완료'] as NewcomerStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(statusChangeTarget.id, status)}
                    className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition ${
                      statusChangeTarget.status === status
                        ? getStatusColor(status) + ' ring-2 ring-offset-2 ring-blue-500'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusModal(false)
                    setStatusChangeTarget(null)
                  }}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NewcomerManagePage
