import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import { useState, useEffect } from 'react'
import {
  getPendingUsers,
  approveUser,
  rejectUser,
  getApprovedUsers,
  type PendingUserDto,
  type ApprovedUserDto,
} from '../services/adminService'

// 슬라이드 타입
type SlideType = 'text' | 'image'

// 텍스트 요소 인터페이스
interface TextElement {
  id: string
  text: string
  fontSize: number
  color: string
  x: number // x 좌표 (0-100, 퍼센트)
  y: number // y 좌표 (0-100, 퍼센트)
  fontWeight: 'normal' | 'bold' | 'semibold'
  fontFamily: string
}

interface Slide {
  id: number
  type: SlideType
  // 공통 필드
  title?: string
  subtitle?: string
  // 텍스트 슬라이드 필드
  backgroundColor?: string
  textElements?: TextElement[] // 여러 텍스트 요소 배열
  // 이미지 슬라이드 필드
  url?: string
  linkUrl?: string // 이미지 클릭 시 이동할 링크
}

// 유튜브 링크 타입
interface YoutubeLinks {
  liveUrl: string
  playlistUrl: string
}

type TabType = 'pending' | 'approved' | 'slides' | 'youtube'

function HomepageManagePage() {
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  
  // 회원가입 신청 관리
  const [pendingUsers, setPendingUsers] = useState<PendingUserDto[]>([])
  const [isLoadingPending, setIsLoadingPending] = useState(false)
  
  // 승인된 사용자 관리
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUserDto[]>([])
  const [isLoadingApproved, setIsLoadingApproved] = useState(false)
  
  // 슬라이드 관리
  const [slides, setSlides] = useState<Slide[]>([])
  const [isLoadingSlides, setIsLoadingSlides] = useState(false)
  const [newSlideType, setNewSlideType] = useState<SlideType>('text')
  const [newSlideUrl, setNewSlideUrl] = useState('')
  const [newSlideLinkUrl, setNewSlideLinkUrl] = useState('')
  const [newSlideTitle, setNewSlideTitle] = useState('')
  const [newSlideSubtitle, setNewSlideSubtitle] = useState('')
  const [newSlideBackgroundColor, setNewSlideBackgroundColor] = useState('#1e293b')
  const [newSlideTextElements, setNewSlideTextElements] = useState<TextElement[]>([])
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // 유튜브 링크 관리
  const [youtubeLinks, setYoutubeLinks] = useState<YoutubeLinks>({
    liveUrl: 'https://www.youtube.com/channel/UCJekqH69c4VTieaH4N6ErsA/live',
    playlistUrl: 'https://www.youtube.com/embed/videoseries?list=PL-wQhvG4IAQRsNULw0nwgHKb-FOe-nFAu',
  })
  const [isLoadingYoutube, setIsLoadingYoutube] = useState(false)

  // 승인 대기 사용자 목록 불러오기
  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingUsers()
    }
  }, [activeTab])

  // 승인된 사용자 목록 불러오기
  useEffect(() => {
    if (activeTab === 'approved') {
      loadApprovedUsers()
    }
  }, [activeTab])

  // 슬라이드 목록 불러오기
  useEffect(() => {
    if (activeTab === 'slides') {
      loadSlides()
    }
  }, [activeTab])

  // 유튜브 링크 불러오기
  useEffect(() => {
    if (activeTab === 'youtube') {
      loadYoutubeLinks()
    }
  }, [activeTab])

  const loadPendingUsers = async () => {
    setIsLoadingPending(true)
    try {
      const users = await getPendingUsers()
      setPendingUsers(users)
    } catch (error) {
      console.error('승인 대기 사용자 목록 불러오기 실패:', error)
      alert('승인 대기 사용자 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoadingPending(false)
    }
  }

  const loadApprovedUsers = async () => {
    setIsLoadingApproved(true)
    try {
      const users = await getApprovedUsers()
      setApprovedUsers(users)
    } catch (error) {
      console.error('승인된 사용자 목록 불러오기 실패:', error)
      alert('승인된 사용자 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoadingApproved(false)
    }
  }

  const loadSlides = async () => {
    setIsLoadingSlides(true)
    try {
      // TODO: 실제 API 연동 시 구현
      // const response = await api.get('/api/admin/homepage/slides')
      // setSlides(response.data.data)
      
      // 임시: 로컬 스토리지에서 불러오기
      const savedSlides = localStorage.getItem('homepageSlides')
      if (savedSlides) {
        setSlides(JSON.parse(savedSlides))
      } else {
        // 기본 슬라이드
        setSlides([
          { 
            id: 1, 
            type: 'text', 
            backgroundColor: '#1e293b',
            textElements: [
              { id: '1-1', text: 'Welcome to JEJA Youth', fontSize: 32, color: '#ffffff', x: 50, y: 40, fontWeight: 'bold', fontFamily: 'Arial' },
              { id: '1-2', text: '하나님이 세우시는 교회, 함께 예배하는 청년부', fontSize: 16, color: '#ffffff', x: 50, y: 60, fontWeight: 'normal', fontFamily: 'Arial' },
            ]
          },
          { 
            id: 2, 
            type: 'text', 
            backgroundColor: '#0f172a',
            textElements: [
              { id: '2-1', text: '주일예배 & 순모임', fontSize: 28, color: '#ffffff', x: 50, y: 40, fontWeight: 'bold', fontFamily: 'Arial' },
              { id: '2-2', text: '말씀과 나눔으로 함께 성장해요', fontSize: 14, color: '#ffffff', x: 50, y: 60, fontWeight: 'normal', fontFamily: 'Arial' },
            ]
          },
          { id: 3, type: 'image', url: 'https://via.placeholder.com/600x260?text=슬라이드+3', title: '함께 웃고 울며 기도하는 공동체', subtitle: '청년부 소식과 사진들을 확인해 보세요' },
        ])
      }
    } catch (error) {
      console.error('슬라이드 목록 불러오기 실패:', error)
      alert('슬라이드 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoadingSlides(false)
    }
  }

  const loadYoutubeLinks = async () => {
    setIsLoadingYoutube(true)
    try {
      // TODO: 실제 API 연동 시 구현
      // const response = await api.get('/api/admin/homepage/youtube')
      // setYoutubeLinks(response.data.data)
      
      // 임시: 로컬 스토리지에서 불러오기
      const savedLinks = localStorage.getItem('youtubeLinks')
      if (savedLinks) {
        setYoutubeLinks(JSON.parse(savedLinks))
      }
    } catch (error) {
      console.error('유튜브 링크 불러오기 실패:', error)
      alert('유튜브 링크를 불러오는데 실패했습니다.')
    } finally {
      setIsLoadingYoutube(false)
    }
  }

  const handleApprove = async (userId: number) => {
    if (!confirm('이 사용자를 승인하시겠습니까?')) return

    try {
      await approveUser(userId)
      alert('사용자가 승인되었습니다.')
      loadPendingUsers()
      // 승인된 사용자 목록도 새로고침
      if (activeTab === 'approved') {
        loadApprovedUsers()
      }
    } catch (error) {
      console.error('사용자 승인 실패:', error)
      alert('사용자 승인에 실패했습니다.')
    }
  }

  const handleReject = async (userId: number) => {
    if (!confirm('이 사용자를 거절하시겠습니까?')) return

    try {
      await rejectUser(userId)
      alert('사용자가 거절되었습니다.')
      loadPendingUsers()
    } catch (error) {
      console.error('사용자 거절 실패:', error)
      alert('사용자 거절에 실패했습니다.')
    }
  }

  // 텍스트 요소 추가
  const handleAddTextElement = () => {
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      text: '',
      fontSize: 24,
      color: '#ffffff',
      x: 50, // 중앙
      y: 50, // 중앙
      fontWeight: 'normal',
      fontFamily: 'Arial',
    }
    setNewSlideTextElements([...newSlideTextElements, newElement])
  }

  // 텍스트 요소 드래그 시작
  const handleTextDragStart = (e: React.MouseEvent, elementId: string, currentX: number, currentY: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingElementId(elementId)
    
    const container = (e.currentTarget as HTMLElement).closest('.preview-container') as HTMLElement
    if (!container) return
    
    const rect = container.getBoundingClientRect()
    // 현재 텍스트의 실제 화면 위치 (transform: translate(-50%, -50%) 고려)
    const elementX = (currentX / 100) * rect.width
    const elementY = (currentY / 100) * rect.height
    
    // 마우스 위치와 텍스트 중심점의 차이를 오프셋으로 저장
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    setDragOffset({
      x: mouseX - elementX,
      y: mouseY - elementY,
    })
  }

  // 전역 마우스 이벤트로 드래그 처리
  useEffect(() => {
    if (!draggingElementId) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const container = document.querySelector('.preview-container') as HTMLElement
      if (!container) return
      
      const rect = container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      // 오프셋을 빼서 텍스트 중심점 위치 계산
      const elementX = mouseX - dragOffset.x
      const elementY = mouseY - dragOffset.y
      
      // 퍼센트로 변환
      const x = (elementX / rect.width) * 100
      const y = (elementY / rect.height) * 100
      
      // 0-100 범위로 제한
      const clampedX = Math.max(0, Math.min(100, x))
      const clampedY = Math.max(0, Math.min(100, y))
      
      handleUpdateTextElement(draggingElementId, 'x', clampedX)
      handleUpdateTextElement(draggingElementId, 'y', clampedY)
    }

    const handleGlobalMouseUp = () => {
      setDraggingElementId(null)
      setDragOffset({ x: 0, y: 0 })
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [draggingElementId, dragOffset])


  // 텍스트 요소 수정
  const handleUpdateTextElement = (id: string, field: keyof TextElement, value: string | number) => {
    setNewSlideTextElements(
      newSlideTextElements.map((el) =>
        el.id === id ? { ...el, [field]: value } : el
      )
    )
  }

  // 텍스트 요소 삭제
  const handleRemoveTextElement = (id: string) => {
    setNewSlideTextElements(newSlideTextElements.filter((el) => el.id !== id))
  }

  const handleAddSlide = () => {
    if (newSlideType === 'image' && !newSlideUrl.trim()) {
      alert('이미지 URL을 입력해주세요.')
      return
    }
    if (newSlideType === 'text' && newSlideTextElements.length === 0) {
      alert('최소 하나의 텍스트 요소를 추가해주세요.')
      return
    }
    if (newSlideType === 'text' && newSlideTextElements.some(el => !el.text.trim())) {
      alert('모든 텍스트 요소의 내용을 입력해주세요.')
      return
    }

    const newSlide: Slide = {
      id: Date.now(),
      type: newSlideType,
    }

    if (newSlideType === 'image') {
      newSlide.url = newSlideUrl
      newSlide.title = newSlideTitle || undefined
      newSlide.subtitle = newSlideSubtitle || undefined
      newSlide.linkUrl = newSlideLinkUrl || undefined
    } else {
      newSlide.backgroundColor = newSlideBackgroundColor
      newSlide.textElements = newSlideTextElements
    }

    const updatedSlides = [...slides, newSlide]
    setSlides(updatedSlides)
    
    // 로컬 스토리지에 저장 (임시)
    localStorage.setItem('homepageSlides', JSON.stringify(updatedSlides))
    
    // TODO: 백엔드 API 연동 시 아래 주석을 해제하고 로컬 스토리지 저장을 제거하세요
    // 백엔드 API 예시:
    // POST /api/admin/homepage/slides - 슬라이드 추가
    // GET /api/admin/homepage/slides - 슬라이드 목록 조회
    // DELETE /api/admin/homepage/slides/{id} - 슬라이드 삭제
    // PATCH /api/admin/homepage/slides/{id} - 슬라이드 수정
    // 
    // try {
    //   await api.post('/api/admin/homepage/slides', newSlide)
    //   alert('슬라이드가 추가되었습니다.')
    // } catch (error) {
    //   console.error('슬라이드 추가 실패:', error)
    //   alert('슬라이드 추가에 실패했습니다.')
    // }

    // 폼 초기화
    setNewSlideUrl('')
    setNewSlideLinkUrl('')
    setNewSlideTitle('')
    setNewSlideSubtitle('')
    setNewSlideBackgroundColor('#1e293b')
    setNewSlideTextElements([])
    alert('슬라이드가 추가되었습니다.')
  }

  const handleRemoveSlide = async (id: number) => {
    if (!confirm('이 슬라이드를 삭제하시겠습니까?')) return

    const updatedSlides = slides.filter(slide => slide.id !== id)
    setSlides(updatedSlides)
    
    // 로컬 스토리지에 저장 (임시)
    localStorage.setItem('homepageSlides', JSON.stringify(updatedSlides))
    
    // TODO: 백엔드 API 연동 시 아래 주석을 해제하고 로컬 스토리지 저장을 제거하세요
    // try {
    //   await api.delete(`/api/admin/homepage/slides/${id}`)
    //   alert('슬라이드가 삭제되었습니다.')
    // } catch (error) {
    //   console.error('슬라이드 삭제 실패:', error)
    //   alert('슬라이드 삭제에 실패했습니다.')
    // }

    alert('슬라이드가 삭제되었습니다.')
  }

  const handleSaveYoutubeLinks = async () => {
    if (!youtubeLinks.liveUrl.trim() || !youtubeLinks.playlistUrl.trim()) {
      alert('모든 링크를 입력해주세요.')
      return
    }

    try {
      // 로컬 스토리지에 저장
      localStorage.setItem('youtubeLinks', JSON.stringify(youtubeLinks))
      
      // TODO: 실제 API 연동 시 구현
      // await api.patch('/api/admin/homepage/youtube', youtubeLinks)

      alert('유튜브 링크가 저장되었습니다.')
    } catch (error) {
      console.error('유튜브 링크 저장 실패:', error)
      alert('유튜브 링크 저장에 실패했습니다.')
    }
  }

  const tabs = [
    { id: 'pending' as TabType, label: '회원가입 신청 관리', count: pendingUsers.length },
    { id: 'approved' as TabType, label: '승인된 사용자 관리', count: approvedUsers.length },
    { id: 'slides' as TabType, label: '홈페이지 슬라이드 관리' },
    { id: 'youtube' as TabType, label: '유튜브 링크 관리' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />
        
        <div>
          <h1 className="text-2xl font-bold">홈페이지 관리</h1>
          <p className="mt-1 text-sm text-slate-600">홈페이지 설정을 관리할 수 있습니다.</p>
        </div>

        {/* 탭 메뉴 */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* 회원가입 신청 관리 탭 */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">승인 대기 사용자</h2>
                <button
                  onClick={loadPendingUsers}
                  disabled={isLoadingPending}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  {isLoadingPending ? '로딩 중...' : '새로고침'}
                </button>
              </div>

              {isLoadingPending ? (
                <div className="py-8 text-center text-sm text-slate-500">로딩 중...</div>
              ) : pendingUsers.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  승인 대기 중인 사용자가 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              아이디: {user.loginId} | 전화번호: {user.phone}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              신청일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(user.userId)}
                          className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(user.userId)}
                          className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          거절
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 승인된 사용자 관리 탭 */}
          {activeTab === 'approved' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">승인된 사용자</h2>
                <button
                  onClick={loadApprovedUsers}
                  disabled={isLoadingApproved}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  {isLoadingApproved ? '로딩 중...' : '새로고침'}
                </button>
              </div>

              {isLoadingApproved ? (
                <div className="py-8 text-center text-sm text-slate-500">로딩 중...</div>
              ) : approvedUsers.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  승인된 사용자가 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              아이디: {user.loginId} | 전화번호: {user.phone}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              승인일: {new Date(user.approvedAt).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                          승인됨
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 홈페이지 슬라이드 관리 탭 */}
          {activeTab === 'slides' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">슬라이드 관리</h2>
                <button
                  onClick={loadSlides}
                  disabled={isLoadingSlides}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  {isLoadingSlides ? '로딩 중...' : '새로고침'}
                </button>
              </div>

              {/* 슬라이드 추가 폼 */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">새 슬라이드 추가</h3>
                <div className="space-y-4">
                  {/* 슬라이드 타입 선택 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">
                      슬라이드 타입 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNewSlideType('text')}
                        className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                          newSlideType === 'text'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        텍스트 슬라이드
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewSlideType('image')}
                        className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                          newSlideType === 'image'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        이미지 슬라이드
                      </button>
                    </div>
                  </div>

                  {/* 이미지 슬라이드 전용 필드 */}
                  {newSlideType === 'image' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-700">
                          이미지 URL <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newSlideUrl}
                          onChange={(e) => setNewSlideUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700">클릭 시 이동할 링크 (선택)</label>
                        <input
                          type="url"
                          value={newSlideLinkUrl}
                          onChange={(e) => setNewSlideLinkUrl(e.target.value)}
                          placeholder="https://example.com 또는 /schedules 등"
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          이미지 클릭 시 이동할 링크를 입력하세요. 외부 URL 또는 내부 경로 모두 가능합니다.
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700">제목 (선택)</label>
                        <input
                          type="text"
                          value={newSlideTitle}
                          onChange={(e) => setNewSlideTitle(e.target.value)}
                          placeholder="슬라이드 제목"
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700">부제목 (선택)</label>
                        <input
                          type="text"
                          value={newSlideSubtitle}
                          onChange={(e) => setNewSlideSubtitle(e.target.value)}
                          placeholder="슬라이드 부제목"
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  {/* 텍스트 슬라이드 전용 필드 */}
                  {newSlideType === 'text' && (
                    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          배경 색상 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={newSlideBackgroundColor}
                            onChange={(e) => setNewSlideBackgroundColor(e.target.value)}
                            className="h-10 w-20 cursor-pointer rounded border border-slate-300"
                          />
                          <input
                            type="text"
                            value={newSlideBackgroundColor}
                            onChange={(e) => setNewSlideBackgroundColor(e.target.value)}
                            placeholder="#1e293b"
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* 텍스트 요소 관리 */}
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <label className="block text-xs font-medium text-slate-700">
                            텍스트 요소
                          </label>
                          <button
                            type="button"
                            onClick={handleAddTextElement}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            + 텍스트 추가
                          </button>
                        </div>
                        {newSlideTextElements.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                            <p className="text-xs text-slate-500">텍스트 요소가 없습니다. 추가 버튼을 클릭하세요.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {newSlideTextElements.map((element, index) => (
                              <div
                                key={element.id}
                                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                              >
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-700">
                                    텍스트 {index + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTextElement(element.id)}
                                    className="rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600"
                                  >
                                    삭제
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                      텍스트 내용 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={element.text}
                                      onChange={(e) => handleUpdateTextElement(element.id, 'text', e.target.value)}
                                      placeholder="텍스트를 입력하세요"
                                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        폰트 크기 (px)
                                      </label>
                                      <input
                                        type="number"
                                        min="10"
                                        max="72"
                                        value={element.fontSize}
                                        onChange={(e) => handleUpdateTextElement(element.id, 'fontSize', Number(e.target.value))}
                                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        색상
                                      </label>
                                      <div className="flex gap-1">
                                        <input
                                          type="color"
                                          value={element.color}
                                          onChange={(e) => handleUpdateTextElement(element.id, 'color', e.target.value)}
                                          className="h-8 w-12 cursor-pointer rounded border border-slate-300"
                                        />
                                        <input
                                          type="text"
                                          value={element.color}
                                          onChange={(e) => handleUpdateTextElement(element.id, 'color', e.target.value)}
                                          placeholder="#ffffff"
                                          className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        X 위치 (%)
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={element.x}
                                        onChange={(e) => handleUpdateTextElement(element.id, 'x', Number(e.target.value))}
                                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Y 위치 (%)
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={element.y}
                                        onChange={(e) => handleUpdateTextElement(element.id, 'y', Number(e.target.value))}
                                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        폰트
                                      </label>
                                      <select
                                        value={element.fontFamily}
                                        onChange={(e) => handleUpdateTextElement(element.id, 'fontFamily', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      >
                                        <option value="Arial">Arial</option>
                                        <option value="Helvetica">Helvetica</option>
                                        <option value="Times New Roman">Times New Roman</option>
                                        <option value="Georgia">Georgia</option>
                                        <option value="Verdana">Verdana</option>
                                        <option value="Courier New">Courier New</option>
                                        <option value="Impact">Impact</option>
                                        <option value="Comic Sans MS">Comic Sans MS</option>
                                        <option value="Trebuchet MS">Trebuchet MS</option>
                                        <option value="Lucida Sans Unicode">Lucida Sans Unicode</option>
                                        <option value="맑은 고딕">맑은 고딕</option>
                                        <option value="나눔고딕">나눔고딕</option>
                                        <option value="Noto Sans KR">Noto Sans KR</option>
                                        <option value="Nanum Gothic">Nanum Gothic</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        굵기
                                      </label>
                                      <select
                                        value={element.fontWeight}
                                        onChange={(e) => handleUpdateTextElement(element.id, 'fontWeight', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      >
                                        <option value="normal">보통</option>
                                        <option value="semibold">중간 굵기</option>
                                        <option value="bold">굵게</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="rounded-lg bg-blue-50 p-2">
                                    <p className="text-xs text-blue-700">
                                      💡 미리보기에서 텍스트를 드래그하여 위치를 이동할 수 있습니다.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 미리보기 */}
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-xs font-medium text-slate-700">미리보기 (실제 메인 화면 크기) - 텍스트를 드래그하여 이동 가능</p>
                    <div 
                      className="preview-container relative w-full overflow-hidden rounded-lg border border-slate-300"
                      style={{ userSelect: draggingElementId ? 'none' : 'auto' }}
                    >
                      {newSlideType === 'image' && newSlideUrl ? (
                        <div className="relative h-52 w-full sm:h-72">
                          <img
                            src={newSlideUrl}
                            alt="미리보기"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = 'https://via.placeholder.com/600x260?text=이미지+로드+실패'
                            }}
                          />
                          {(newSlideTitle || newSlideSubtitle) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-4">
                              <div className="text-center text-white">
                                {newSlideTitle && <p className="text-xl font-bold">{newSlideTitle}</p>}
                                {newSlideSubtitle && <p className="mt-2 text-sm">{newSlideSubtitle}</p>}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : newSlideType === 'text' ? (
                        <div
                          style={{
                            backgroundColor: newSlideBackgroundColor,
                          }}
                          className="relative h-52 w-full sm:h-72"
                        >
                          {newSlideTextElements.length === 0 ? (
                            <div className="flex h-full w-full items-center justify-center">
                              <p className="text-sm text-slate-400">텍스트 요소를 추가하세요</p>
                            </div>
                          ) : (
                            newSlideTextElements.map((element) => (
                              <div
                                key={element.id}
                                style={{
                                  color: element.color,
                                  left: `${element.x}%`,
                                  top: `${element.y}%`,
                                  transform: 'translate(-50%, -50%)',
                                  fontFamily: element.fontFamily,
                                }}
                                className={`absolute cursor-move select-none ${
                                  draggingElementId === element.id ? 'opacity-80 z-10' : 'z-0'
                                }`}
                                onMouseDown={(e) => handleTextDragStart(e, element.id, element.x, element.y)}
                              >
                                <p
                                  style={{
                                    fontSize: `${element.fontSize}px`,
                                    fontWeight: element.fontWeight === 'bold' ? 'bold' : element.fontWeight === 'semibold' ? '600' : 'normal',
                                  }}
                                  className="whitespace-pre-wrap"
                                >
                                  {element.text || '(텍스트를 입력하세요)'}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        <div className="flex h-52 w-full items-center justify-center bg-slate-100 sm:h-72">
                          <p className="text-sm text-slate-400">미리보기를 표시하려면 정보를 입력하세요</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleAddSlide}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    슬라이드 추가
                  </button>
                </div>
              </div>

              {/* 슬라이드 목록 */}
              {isLoadingSlides ? (
                <div className="py-8 text-center text-sm text-slate-500">로딩 중...</div>
              ) : slides.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  등록된 슬라이드가 없습니다.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {slides.map((slide) => (
                    <div
                      key={slide.id}
                      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="aspect-video w-full overflow-hidden bg-slate-100">
                        {slide.type === 'image' && slide.url ? (
                          slide.linkUrl ? (
                            <a
                              href={slide.linkUrl}
                              target={slide.linkUrl.startsWith('http') ? '_blank' : undefined}
                              rel={slide.linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                              className="block h-full w-full"
                            >
                              <img
                                src={slide.url}
                                alt={slide.title || `슬라이드 ${slide.id}`}
                                className="h-full w-full object-cover transition hover:opacity-90"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = 'https://via.placeholder.com/600x260?text=이미지+로드+실패'
                                }}
                              />
                            </a>
                          ) : (
                            <img
                              src={slide.url}
                              alt={slide.title || `슬라이드 ${slide.id}`}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = 'https://via.placeholder.com/600x260?text=이미지+로드+실패'
                              }}
                            />
                          )
                        ) : (
                          <div
                            style={{
                              backgroundColor: slide.backgroundColor || '#1e293b',
                            }}
                            className="relative h-full w-full"
                          >
                            {slide.textElements && slide.textElements.length > 0 ? (
                              slide.textElements.map((element) => (
                                <div
                                  key={element.id}
                                  style={{
                                    color: element.color,
                                    left: `${element.x}%`,
                                    top: `${element.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    fontFamily: element.fontFamily,
                                  }}
                                  className="absolute"
                                >
                                  <p
                                    style={{
                                      fontSize: `${element.fontSize}px`,
                                      fontWeight: element.fontWeight === 'bold' ? 'bold' : element.fontWeight === 'semibold' ? '600' : 'normal',
                                    }}
                                    className="whitespace-pre-wrap"
                                  >
                                    {element.text}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <p className="text-sm text-slate-400">텍스트 요소 없음</p>
                              </div>
                            )}
                          </div>
                        )}
                        {(slide.type === 'image' && (slide.title || slide.subtitle)) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-4">
                            <div className="text-center text-white">
                              {slide.title && <p className="text-xl font-bold">{slide.title}</p>}
                              {slide.subtitle && <p className="mt-2 text-sm">{slide.subtitle}</p>}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            slide.type === 'text' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {slide.type === 'text' ? '텍스트' : '이미지'}
                          </span>
                        </div>
                        {slide.type === 'image' ? (
                          <>
                            {slide.title && (
                              <p className="text-sm font-semibold text-slate-900">{slide.title}</p>
                            )}
                            {slide.subtitle && (
                              <p className="mt-1 text-xs text-slate-500">{slide.subtitle}</p>
                            )}
                            {slide.linkUrl && (
                              <p className="mt-1 text-xs text-blue-600">링크: {slide.linkUrl}</p>
                            )}
                          </>
                        ) : (
                          <div className="space-y-1">
                            {slide.textElements && slide.textElements.length > 0 ? (
                              slide.textElements.map((el, idx) => (
                                <p key={el.id} className="text-xs text-slate-600">
                                  {idx + 1}. {el.text || '(빈 텍스트)'}
                                </p>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400">텍스트 요소 없음</p>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveSlide(slide.id)}
                        className="absolute right-2 top-2 rounded-full bg-red-500 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition hover:bg-red-600 group-hover:opacity-100"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 유튜브 링크 관리 탭 */}
          {activeTab === 'youtube' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">유튜브 링크 관리</h2>
                <button
                  onClick={loadYoutubeLinks}
                  disabled={isLoadingYoutube}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  {isLoadingYoutube ? '로딩 중...' : '새로고침'}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    실시간 예배 링크 <span className="text-red-500">*</span>
                  </label>
                  <p className="mt-1 text-xs text-slate-500">
                    유튜브 채널 라이브 스트리밍 링크를 입력하세요.
                  </p>
                  <input
                    type="url"
                    value={youtubeLinks.liveUrl}
                    onChange={(e) =>
                      setYoutubeLinks({ ...youtubeLinks, liveUrl: e.target.value })
                    }
                    placeholder="https://www.youtube.com/channel/..."
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    플레이리스트 링크 <span className="text-red-500">*</span>
                  </label>
                  <p className="mt-1 text-xs text-slate-500">
                    유튜브 플레이리스트 embed 링크를 입력하세요. (예: https://www.youtube.com/embed/videoseries?list=...)
                  </p>
                  <input
                    type="url"
                    value={youtubeLinks.playlistUrl}
                    onChange={(e) =>
                      setYoutubeLinks({ ...youtubeLinks, playlistUrl: e.target.value })
                    }
                    placeholder="https://www.youtube.com/embed/videoseries?list=..."
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveYoutubeLinks}
                    className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    저장
                  </button>
                </div>

                {/* 미리보기 */}
                <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">미리보기</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-medium text-slate-700">실시간 예배 링크:</p>
                      <a
                        href={youtubeLinks.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {youtubeLinks.liveUrl}
                      </a>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium text-slate-700">플레이리스트 미리보기:</p>
                      <div className="relative w-full overflow-hidden rounded-lg bg-slate-100">
                        <div className="aspect-video w-full">
                          <iframe
                            className="h-full w-full"
                            src={youtubeLinks.playlistUrl}
                            title="청년부 설교 영상"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  )
}

export default HomepageManagePage
