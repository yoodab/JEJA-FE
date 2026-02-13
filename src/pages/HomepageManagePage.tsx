import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { useConfirm } from '../contexts/ConfirmContext'
import {
  getUsers,
  updateUserStatus,
  type UserDto,
  type UserStatus,
} from '../services/adminService'
import {
  getSlidesAdmin,
  createSlide,
  deleteSlide,
  updateSlide,
  reorderSlides,
  getYoutubeConfigAdmin,
  updateYoutubeConfig,
  type Slide,
  type SlideType,
  type TextElement,
  type YoutubeConfig,
  type SlideRequestDto
} from '../services/homepageService'
import { uploadFiles, getFileUrl } from '../services/albumService'

type TabType = 'users' | 'slides' | 'youtube'

function HomepageManagePage() {
  const { confirm } = useConfirm()
  const [activeTab, setActiveTab] = useState<TabType>('users')
  
  // 사용자 관리
  const [users, setUsers] = useState<UserDto[]>([])
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('PENDING')
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [openMenuUserId, setOpenMenuUserId] = useState<number | null>(null)
  
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
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isUploading, setIsUploading] = useState(false)
  const [editingSlideId, setEditingSlideId] = useState<number | null>(null)
  const [openSlideMenuId, setOpenSlideMenuId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 유튜브 링크 관리
  const [youtubeLinks, setYoutubeLinks] = useState<YoutubeConfig>({
    liveUrl: 'https://www.youtube.com/channel/UCJekqH69c4VTieaH4N6ErsA/live',
    playlistUrl: 'https://www.youtube.com/embed/videoseries?list=PL-wQhvG4IAQRsNULw0nwgHKb-FOe-nFAu',
  })
  const [isLoadingYoutube, setIsLoadingYoutube] = useState(false)

  // 메뉴 외부 클릭 감지용 ref
  const menuRef = useRef<HTMLDivElement>(null)

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuUserId(null)
        setOpenSlideMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 사용자 목록 불러오기
  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true)
    try {
      const status = statusFilter === 'ALL' ? undefined : statusFilter
      const data = await getUsers(status)
      setUsers(data)
    } catch (error) {
      console.error('사용자 목록 불러오기 실패:', error)
      toast.error('사용자 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoadingUsers(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers()
    }
  }, [activeTab, loadUsers])

  // 슬라이드 목록 불러오기
  const loadSlides = useCallback(async () => {
    setIsLoadingSlides(true)
    try {
      const data = await getSlidesAdmin()
      setSlides(data)
    } catch (error) {
      console.error('슬라이드 목록 불러오기 실패:', error)
      toast.error('슬라이드 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoadingSlides(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'slides') {
      loadSlides()
    }
  }, [activeTab, loadSlides])

  // 유튜브 링크 불러오기
  const loadYoutubeLinks = useCallback(async () => {
    setIsLoadingYoutube(true)
    try {
      const data = await getYoutubeConfigAdmin()
      if (data) {
        setYoutubeLinks(data)
      }
    } catch (error) {
      console.error('유튜브 링크 불러오기 실패:', error)
      toast.error('유튜브 링크를 불러오는데 실패했습니다.')
    } finally {
      setIsLoadingYoutube(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'youtube') {
      loadYoutubeLinks()
    }
  }, [activeTab, loadYoutubeLinks])

  const handleUpdateStatus = async (userId: number, newStatus: UserStatus) => {
    const isConfirmed = await confirm({
      title: '상태 변경',
      message: `사용자 상태를 '${getStatusLabel(newStatus)}'(으)로 변경하시겠습니까?`,
      type: 'warning',
      confirmText: '변경',
      cancelText: '취소'
    })

    if (!isConfirmed) return

    try {
      await updateUserStatus(userId, newStatus)
      toast.success('사용자 상태가 변경되었습니다.')
      loadUsers()
      setOpenMenuUserId(null)
    } catch (error) {
      console.error('상태 변경 실패:', error)
      toast.error('상태 변경에 실패했습니다.')
    }
  }

  // 주요 색상 추출 함수
  const extractDominantColor = (imageUrl: string, file?: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      // File 객체가 있으면 URL.createObjectURL 사용 (CORS 회피)
      if (file) {
        img.src = URL.createObjectURL(file)
      } else {
        img.crossOrigin = 'Anonymous'
        img.src = imageUrl
      }
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve('#1e293b') // 기본값
          return
        }
        
        // 이미지를 1x1 픽셀로 리사이징하여 그리면 평균 색상이 됨
        canvas.width = 1
        canvas.height = 1
        ctx.drawImage(img, 0, 0, 1, 1)
        
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
        const color = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
        
        // 메모리 해제
        if (file) {
          URL.revokeObjectURL(img.src)
        }
        
        resolve(color)
      }
      
      img.onerror = () => {
        console.warn('이미지 로드 실패, 기본 색상 사용')
        resolve('#1e293b') // 로드 실패 시 기본값
      }
    })
  }

  // 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      
      // 1. 먼저 로컬 파일로 색상 추출 (CORS 문제 원천 차단)
      const dominantColor = await extractDominantColor('', file)
      setNewSlideBackgroundColor(dominantColor)

      // 2. 파일 업로드
      const uploadResults = await uploadFiles([file], 'homepage')
      const uploadedUrl = uploadResults[0].url
      
      // 3. URL 적용 (상대 경로로 저장)
      setNewSlideUrl(uploadedUrl)
      
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      toast.error('이미지 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
      // input 초기화 (같은 파일 다시 선택 가능하도록)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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

  // 텍스트 요소 선택 (레이어 클릭 시)
  const handleSelectTextElement = (elementId: string) => {
    setSelectedElementId(elementId)
  }

  // 텍스트 요소 드래그 시작
  const handleTextDragStart = (e: React.MouseEvent | React.TouchEvent, elementId: string, currentX: number, currentY: number) => {
    // e.preventDefault() // Touch event에서 preventDefault 호출 시 스크롤 등 기본 동작 막힘 주의
    e.stopPropagation()
    setDraggingElementId(elementId)
    setSelectedElementId(elementId)
    
    const container = (e.currentTarget as HTMLElement).closest('.preview-container') as HTMLElement
    if (!container) return
    
    const rect = container.getBoundingClientRect()
    // 현재 텍스트의 실제 화면 위치 (transform: translate(-50%, -50%) 고려)
    const elementX = (currentX / 100) * rect.width
    const elementY = (currentY / 100) * rect.height
    
    let clientX, clientY
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = (e as React.MouseEvent).clientX
      clientY = (e as React.MouseEvent).clientY
    }

    // 마우스 위치와 텍스트 중심점의 차이를 오프셋으로 저장
    const mouseX = clientX - rect.left
    const mouseY = clientY - rect.top
    
    setDragOffset({
      x: mouseX - elementX,
      y: mouseY - elementY,
    })
  }

  // 전역 마우스/터치 이벤트로 드래그 처리
  useEffect(() => {
    if (!draggingElementId) return

    const handleGlobalMove = (clientX: number, clientY: number) => {
      const container = document.querySelector('.preview-container') as HTMLElement
      if (!container) return
      
      const rect = container.getBoundingClientRect()
      const mouseX = clientX - rect.left
      const mouseY = clientY - rect.top
      
      // 오프셋을 빼서 텍스트 중심점 위치 계산
      const elementX = mouseX - dragOffset.x
      const elementY = mouseY - dragOffset.y
      
      // 퍼센트로 변환
      const x = (elementX / rect.width) * 100
      const y = (elementY / rect.height) * 100
      
      // 0-100 범위로 제한
      const clampedX = Math.max(0, Math.min(100, x))
      const clampedY = Math.max(0, Math.min(100, y))
      
      // 일괄 업데이트로 변경 (상태 덮어쓰기 방지)
      setNewSlideTextElements(prevElements => 
        prevElements.map(el => 
          el.id === draggingElementId ? { ...el, x: clampedX, y: clampedY } : el
        )
      )
    }

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleGlobalMove(e.clientX, e.clientY)
    }

    const handleGlobalTouchMove = (e: TouchEvent) => {
      // 터치 스크롤 방지
      if (e.cancelable) e.preventDefault()
      handleGlobalMove(e.touches[0].clientX, e.touches[0].clientY)
    }

    const handleGlobalUp = () => {
      setDraggingElementId(null)
      setDragOffset({ x: 0, y: 0 })
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalUp)
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
    document.addEventListener('touchend', handleGlobalUp)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalUp)
      document.removeEventListener('touchmove', handleGlobalTouchMove)
      document.removeEventListener('touchend', handleGlobalUp)
    }
  }, [draggingElementId, dragOffset])

  // 텍스트 요소 수정
  const handleUpdateTextElement = useCallback((id: string, field: keyof TextElement, value: string | number) => {
    setNewSlideTextElements(prev =>
      prev.map((el) =>
        el.id === id ? { ...el, [field]: value } : el
      )
    )
  }, [])

  // 키보드 방향키로 미세 조정
  useEffect(() => {
    if (!selectedElementId) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있는 경우 제외
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return

      const element = newSlideTextElements.find(el => el.id === selectedElementId)
      if (!element) return

      let newX = element.x
      let newY = element.y
      const step = e.shiftKey ? 5 : 1 // Shift 누르면 5% 이동, 아니면 1% 이동

      switch (e.key) {
        case 'ArrowLeft':
          newX = Math.max(0, element.x - step)
          e.preventDefault()
          break
        case 'ArrowRight':
          newX = Math.min(100, element.x + step)
          e.preventDefault()
          break
        case 'ArrowUp':
          newY = Math.max(0, element.y - step)
          e.preventDefault()
          break
        case 'ArrowDown':
          newY = Math.min(100, element.y + step)
          e.preventDefault()
          break
        default:
          return
      }

      handleUpdateTextElement(selectedElementId, 'x', newX)
      handleUpdateTextElement(selectedElementId, 'y', newY)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedElementId, newSlideTextElements, handleUpdateTextElement])

  // 텍스트 요소 삭제
  const handleRemoveTextElement = (id: string) => {
    setNewSlideTextElements(newSlideTextElements.filter((el) => el.id !== id))
  }

  const handleEditSlide = (slide: Slide) => {
    setEditingSlideId(slide.id)
    // 타입 변환 (대문자 -> 소문자)
    const type = slide.type === 'IMAGE' ? 'image' : slide.type === 'TEXT' ? 'text' : slide.type
    setNewSlideType(type)
    setNewSlideUrl(slide.url || '')
    setNewSlideLinkUrl(slide.linkUrl || '')
    setNewSlideTitle(slide.title || '')
    setNewSlideSubtitle(slide.subtitle || '')
    setNewSlideBackgroundColor(slide.backgroundColor || '#1e293b')
    setNewSlideTextElements(slide.textElements || [])
    
    setOpenSlideMenuId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingSlideId(null)
    setNewSlideUrl('')
    setNewSlideLinkUrl('')
    setNewSlideTitle('')
    setNewSlideSubtitle('')
    setNewSlideBackgroundColor('#1e293b')
    setNewSlideTextElements([])
    setNewSlideType('text') // 기본값으로 리셋
  }

  const handleAddSlide = async () => {
    if (newSlideType === 'image' && !newSlideUrl.trim()) {
      toast.error('이미지 URL을 입력해주세요.')
      return
    }
    if (newSlideType === 'text' && newSlideTextElements.length === 0) {
      toast.error('최소 하나의 텍스트 요소를 추가해주세요.')
      return
    }
    if (newSlideType === 'text' && newSlideTextElements.some(el => !el.text.trim())) {
      toast.error('모든 텍스트 요소의 내용을 입력해주세요.')
      return
    }

    try {
      const slideData: SlideRequestDto = {
        type: newSlideType,
        url: newSlideType === 'image' ? newSlideUrl : undefined,
        linkUrl: newSlideLinkUrl,
        title: newSlideTitle,
        subtitle: newSlideType === 'image' ? undefined : undefined, // 부제목 필드 사용 안함
        backgroundColor: newSlideBackgroundColor,
        textElements: newSlideType === 'text' ? newSlideTextElements : undefined,
      }

      if (editingSlideId) {
        await updateSlide(editingSlideId, slideData)
        toast.success('슬라이드가 수정되었습니다.')
      } else {
        await createSlide(slideData)
        toast.success('슬라이드가 추가되었습니다.')
      }
      
      // 목록 새로고침
      loadSlides()
      
      // 폼 초기화
      handleCancelEdit()
    } catch (error) {
      console.error(editingSlideId ? '슬라이드 수정 실패:' : '슬라이드 추가 실패:', error)
      toast.error(editingSlideId ? '슬라이드 수정에 실패했습니다.' : '슬라이드 추가에 실패했습니다.')
    }
  }

  const handleRemoveSlide = async (id: number) => {
    const isConfirmed = await confirm({
      title: '슬라이드 삭제',
      message: '이 슬라이드를 삭제하시겠습니까?',
      type: 'danger',
      confirmText: '삭제',
      cancelText: '취소'
    })

    if (!isConfirmed) return

    try {
      await deleteSlide(id)
      toast.success('슬라이드가 삭제되었습니다.')
      loadSlides()
    } catch (error) {
      console.error('슬라이드 삭제 실패:', error)
      toast.error('슬라이드 삭제에 실패했습니다.')
    }
  }

  const handleSaveYoutubeLinks = async () => {
    if (!youtubeLinks.liveUrl.trim() || !youtubeLinks.playlistUrl.trim()) {
      toast.error('모든 링크를 입력해주세요.')
      return
    }

    try {
      await updateYoutubeConfig(youtubeLinks)
      toast.success('유튜브 링크가 저장되었습니다.')
      loadYoutubeLinks()
    } catch (error) {
      console.error('유튜브 링크 저장 실패:', error)
      toast.error('유튜브 링크 저장에 실패했습니다.')
    }
  }

  const handleMoveSlide = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === slides.length - 1) return

    const newSlides = [...slides]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap
    const temp = newSlides[index]
    newSlides[index] = newSlides[targetIndex]
    newSlides[targetIndex] = temp

    // Optimistic update
    setSlides(newSlides)

    try {
      const slideIds = newSlides.map(slide => slide.id)
      await reorderSlides(slideIds)
    } catch (error) {
      console.error('슬라이드 순서 변경 실패:', error)
      toast.error('슬라이드 순서 변경에 실패했습니다.')
      loadSlides() // Revert on error
    }
  }

  const getStatusLabel = (status: UserStatus) => {
    switch (status) {
      case 'PENDING': return '승인 대기'
      case 'ACTIVE': return '활성'
      case 'INACTIVE': return '비활성'
      default: return status
    }
  }

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700'
      case 'ACTIVE': return 'bg-green-100 text-green-700'
      case 'INACTIVE': return 'bg-slate-100 text-slate-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const tabs = [
    { id: 'users' as TabType, label: '사용자 관리' },
    { id: 'slides' as TabType, label: '홈페이지 슬라이드 관리' },
    { id: 'youtube' as TabType, label: '유튜브 링크 관리' },
  ]

  const statusFilters: { value: UserStatus | 'ALL', label: string }[] = [
    { value: 'ALL', label: '전체' },
    { value: 'PENDING', label: '승인 대기' },
    { value: 'ACTIVE', label: '활성' },
    { value: 'INACTIVE', label: '비활성' },
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
              </button>
            ))}
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* 사용자 관리 탭 */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">사용자 목록</h2>
                <div className="flex gap-2">
                  {statusFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setStatusFilter(filter.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        statusFilter === filter.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                  <button
                    onClick={loadUsers}
                    disabled={isLoadingUsers}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 ml-2"
                  >
                    새로고침
                  </button>
                </div>
              </div>

              {isLoadingUsers ? (
                <div className="py-8 text-center text-sm text-slate-500">로딩 중...</div>
              ) : users.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  사용자가 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900">{user.name}</p>
                              <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${getStatusColor(user.status)}`}>
                                {getStatusLabel(user.status)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              아이디: {user.loginId} | 전화번호: {user.phone}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuUserId(openMenuUserId === user.userId ? null : user.userId)
                          }}
                          className="rounded-full p-2 hover:bg-slate-200 text-slate-500 transition"
                        >
                          {/* 점 세개 아이콘 */}
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </button>

                        {/* 드롭다운 메뉴 */}
                        {openMenuUserId === user.userId && (
                          <div 
                            ref={menuRef}
                            className="absolute right-0 top-full z-10 mt-1 w-32 origin-top-right rounded-lg border border-slate-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                          >
                            <div className="py-1">
                              {(['PENDING', 'ACTIVE', 'INACTIVE'] as UserStatus[]).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleUpdateStatus(user.userId, status)}
                                  disabled={user.status === status}
                                  className={`block w-full px-4 py-2 text-left text-sm ${
                                    user.status === status
                                      ? 'bg-slate-50 text-slate-400 cursor-default'
                                      : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  {getStatusLabel(status)}로 변경
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
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
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  {editingSlideId ? '슬라이드 수정' : '새 슬라이드 추가'}
                </h3>
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
                        <label className="block text-xs font-medium text-slate-700">클릭 시 이동할 링크 (선택)</label>
                        <input
                          type="url"
                          value={newSlideLinkUrl}
                          onChange={(e) => setNewSlideLinkUrl(e.target.value)}
                          placeholder="https://example.com 또는 /schedules 등"
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          슬라이드 클릭 시 이동할 링크를 입력하세요. 외부 URL 또는 내부 경로 모두 가능합니다.
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700">
                          이미지 파일 또는 URL <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 flex gap-2">
                          <input
                            type="text"
                            value={newSlideUrl}
                            onChange={(e) => setNewSlideUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            readOnly={newSlideUrl.startsWith('/files/')}
                            className={`flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${newSlideUrl.startsWith('/files/') ? 'bg-slate-100 text-slate-500' : ''}`}
                          />
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                          >
                            {isUploading ? '업로드 중...' : '파일 선택'}
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          권장 비율: 4:1 (예: 1200x300). 모바일에서는 이미지가 작게 보일 수 있지만, 배경색이 자동으로 채워져 자연스럽게 보입니다. (글씨는 크게 넣는 것을 추천합니다)
                        </p>
                      </div>
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
                    </>
                  )}

                  {/* 텍스트 슬라이드 전용 필드 */}
                  {newSlideType === 'text' && (
                    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700">제목 (관리용)</label>
                        <input
                          type="text"
                          value={newSlideTitle}
                          onChange={(e) => setNewSlideTitle(e.target.value)}
                          placeholder="관리용 제목 (목록에서 확인용)"
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
                          슬라이드 클릭 시 이동할 링크를 입력하세요. 외부 URL 또는 내부 경로 모두 가능합니다.
                        </p>
                      </div>
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

                      {/* 텍스트 요소 관리 (레이어 패널 스타일) */}
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
                        
                        <div className="flex gap-4">
                          {/* 좌측: 레이어 목록 */}
                          <div className="w-1/3 space-y-2">
                            {newSlideTextElements.length === 0 ? (
                              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                                <p className="text-xs text-slate-500">요소 없음</p>
                              </div>
                            ) : (
                              <div className="max-h-[300px] overflow-y-auto rounded-lg border border-slate-200 bg-white">
                                {newSlideTextElements.map((element, index) => (
                                  <div
                                    key={element.id}
                                    onClick={() => handleSelectTextElement(element.id)}
                                    className={`flex cursor-pointer items-center justify-between border-b border-slate-100 px-3 py-2 last:border-0 hover:bg-slate-50 ${
                                      selectedElementId === element.id ? 'bg-blue-50 hover:bg-blue-50' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <span className="flex h-5 w-5 flex-none items-center justify-center rounded bg-slate-200 text-[10px] font-bold text-slate-600">
                                        T
                                      </span>
                                      <span className="truncate text-xs text-slate-700">
                                        {element.text || `텍스트 ${index + 1}`}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemoveTextElement(element.id)
                                      }}
                                      className="text-slate-400 hover:text-red-500"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6 6 18"></path>
                                        <path d="m6 6 12 12"></path>
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 우측: 속성 편집 패널 */}
                          <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 p-4 relative min-h-[300px]">
                            {(() => {
                              const element = newSlideTextElements.find(el => el.id === selectedElementId)
                              const isDisabled = !element
                              // 기본값 객체 (선택된 요소가 없을 때 보여줄 값)
                              const displayValues = element || {
                                id: '',
                                text: '',
                                fontSize: 24,
                                color: '#000000',
                                x: 50,
                                y: 50,
                                fontWeight: 'normal',
                                fontFamily: 'Arial'
                              }
                              
                              return (
                                <>
                                  {/* 비활성화 오버레이 */}
                                  {isDisabled && (
                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-slate-50/60 backdrop-blur-[1px]">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-slate-400">
                                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                                        <line x1="9" x2="15" y1="15" y2="9"></line>
                                      </svg>
                                      <p className="text-xs text-slate-500 font-medium">편집할 텍스트 요소를 선택하세요</p>
                                    </div>
                                  )}

                                  <div className={`space-y-3 transition-opacity duration-200 ${isDisabled ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                      <span className="text-xs font-bold text-slate-700">속성 편집</span>
                                      <span className="text-[10px] text-slate-400">ID: {displayValues.id ? displayValues.id.slice(-6) : '-'}</span>
                                    </div>
                                    
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        텍스트 내용
                                      </label>
                                      <input
                                        type="text"
                                        value={displayValues.text}
                                        onChange={(e) => element && handleUpdateTextElement(element.id, 'text', e.target.value)}
                                        placeholder="텍스트를 입력하세요"
                                        disabled={isDisabled}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                          폰트 크기
                                        </label>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="range"
                                            min="10"
                                            max="120"
                                            value={displayValues.fontSize}
                                            onChange={(e) => element && handleUpdateTextElement(element.id, 'fontSize', Number(e.target.value))}
                                            disabled={isDisabled}
                                            className="h-2 flex-1 cursor-pointer rounded-lg bg-slate-200 appearance-none accent-blue-600 disabled:opacity-50"
                                          />
                                          <input
                                            type="number"
                                            value={displayValues.fontSize}
                                            onChange={(e) => element && handleUpdateTextElement(element.id, 'fontSize', Number(e.target.value))}
                                            disabled={isDisabled}
                                            className="w-12 rounded border border-slate-300 px-1 py-1 text-center text-xs disabled:bg-slate-100"
                                          />
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                          색상
                                        </label>
                                        <div className="flex gap-1">
                                          <input
                                            type="color"
                                            value={displayValues.color}
                                            onChange={(e) => element && handleUpdateTextElement(element.id, 'color', e.target.value)}
                                            disabled={isDisabled}
                                            className="h-8 w-8 cursor-pointer rounded border border-slate-300 p-0 disabled:opacity-50"
                                          />
                                          <input
                                            type="text"
                                            value={displayValues.color}
                                            onChange={(e) => element && handleUpdateTextElement(element.id, 'color', e.target.value)}
                                            disabled={isDisabled}
                                            className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs uppercase disabled:bg-slate-100"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                          위치 (X, Y %)
                                        </label>
                                        <div className="flex gap-2">
                                          <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={Math.round(displayValues.x)}
                                            onChange={(e) => element && handleUpdateTextElement(element.id, 'x', Number(e.target.value))}
                                            disabled={isDisabled}
                                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs disabled:bg-slate-100"
                                            placeholder="X"
                                          />
                                          <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={Math.round(displayValues.y)}
                                            onChange={(e) => element && handleUpdateTextElement(element.id, 'y', Number(e.target.value))}
                                            disabled={isDisabled}
                                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs disabled:bg-slate-100"
                                            placeholder="Y"
                                          />
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                          스타일
                                        </label>
                                        <div className="flex gap-2">
                                          <select
                                            value={displayValues.fontWeight}
                                            onChange={(e) => element && handleUpdateTextElement(element.id, 'fontWeight', e.target.value)}
                                            disabled={isDisabled}
                                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs disabled:bg-slate-100"
                                          >
                                            <option value="normal">Regular</option>
                                            <option value="semibold">Semibold</option>
                                            <option value="bold">Bold</option>
                                          </select>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        폰트 패밀리
                                      </label>
                                      <select
                                        value={displayValues.fontFamily}
                                        onChange={(e) => element && handleUpdateTextElement(element.id, 'fontFamily', e.target.value)}
                                        disabled={isDisabled}
                                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs disabled:bg-slate-100"
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
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                        </div>
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
                        <div 
                          className="relative h-52 w-full sm:h-72"
                          style={{ backgroundColor: newSlideBackgroundColor }}
                        >
                          <img
                            src={getFileUrl(newSlideUrl)}
                            alt="미리보기"
                            className="h-full w-full object-contain"
                            draggable={false}
                          />
                        </div>
                      ) : newSlideType === 'text' ? (
                        <div 
                          className="relative h-52 w-full sm:h-72"
                          style={{ backgroundColor: newSlideBackgroundColor }}
                          onClick={() => setSelectedElementId(null)}
                        >
                          {newSlideTextElements.map((element) => (
                            <div
                              key={element.id}
                              onMouseDown={(e) => handleTextDragStart(e, element.id, element.x, element.y)}
                              onTouchStart={(e) => handleTextDragStart(e, element.id, element.x, element.y)}
                              className={`absolute cursor-move select-none whitespace-nowrap ${draggingElementId === element.id || selectedElementId === element.id ? 'opacity-70 ring-2 ring-blue-400' : ''}`}
                              style={{
                                left: `${element.x}%`,
                                top: `${element.y}%`,
                                transform: 'translate(-50%, -50%)',
                                fontSize: `${element.fontSize}px`,
                                color: element.color,
                                fontWeight: element.fontWeight,
                                fontFamily: element.fontFamily,
                              }}
                            >
                              {element.text}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-52 w-full items-center justify-center bg-slate-100 sm:h-72">
                          <p className="text-slate-400">이미지 URL을 입력하거나 텍스트 슬라이드를 구성하세요</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {editingSlideId && (
                      <button
                        onClick={handleCancelEdit}
                        className="w-full rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                      >
                        취소
                      </button>
                    )}
                    <button
                      onClick={handleAddSlide}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      {editingSlideId ? '슬라이드 수정' : '슬라이드 추가'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 슬라이드 목록 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">등록된 슬라이드 ({slides?.length || 0})</h3>
                {!slides || slides.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                    등록된 슬라이드가 없습니다.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {slides.map((slide, index) => (
                      <div
                        key={slide.id}
                        className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                      >
                        <div className="relative h-40 w-full bg-slate-100">
                          {/* 순서 표시 및 변경 버튼 */}
                          <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-white backdrop-blur-sm">
                            <span className="mr-1 text-xs font-bold">{index + 1}</span>
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMoveSlide(index, 'up')
                                }}
                                disabled={index === 0}
                                className="flex h-3 w-3 items-center justify-center rounded bg-white/20 hover:bg-white/40 disabled:opacity-30"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m18 15-6-6-6 6"/>
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMoveSlide(index, 'down')
                                }}
                                disabled={index === slides.length - 1}
                                className="flex h-3 w-3 items-center justify-center rounded bg-white/20 hover:bg-white/40 disabled:opacity-30"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m6 9 6 6 6-6"/>
                                </svg>
                              </button>
                            </div>
                          </div>

                          {slide.type === 'image' || slide.type === 'IMAGE' ? (
                            <div 
                              className="relative h-full w-full"
                              style={{ backgroundColor: slide.backgroundColor || '#1e293b' }}
                            >
                              <img
                                src={getFileUrl(slide.url)}
                                alt="슬라이드"
                                className="h-full w-full object-contain"
                              />
                            </div>
                          ) : (
                            <div 
                              className="relative h-full w-full"
                              style={{ backgroundColor: slide.backgroundColor }}
                            >
                              {slide.textElements?.map((element) => (
                                <div
                                  key={element.id}
                                  className="absolute whitespace-nowrap"
                                  style={{
                                    left: `${element.x}%`,
                                    top: `${element.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    fontSize: `${Math.max(10, element.fontSize * 0.6)}px`, // 미리보기 축소 비율 적용
                                    color: element.color,
                                    fontWeight: element.fontWeight,
                                    fontFamily: element.fontFamily,
                                  }}
                                >
                                  {element.text}
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="absolute right-2 top-2 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenSlideMenuId(openSlideMenuId === slide.id ? null : slide.id)
                              }}
                              className="rounded-full bg-white/80 p-1.5 text-slate-600 hover:bg-white transition shadow-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </button>

                            {openSlideMenuId === slide.id && (
                              <div 
                                className="absolute right-0 top-full mt-1 w-32 origin-top-right rounded-lg border border-slate-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
                              >
                                <div className="py-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditSlide(slide)
                                    }}
                                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRemoveSlide(slide.id)
                                    }}
                                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-100"
                                  >
                                    삭제
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                              {slide.type === 'image' || slide.type === 'IMAGE' ? '이미지' : '텍스트'}
                            </span>
                            {slide.linkUrl && (
                              <span className="text-xs text-blue-600">🔗 링크 있음</span>
                            )}
                          </div>
                          <div className="mt-2 space-y-0.5">
                            {slide.title && <p className="truncate text-sm font-medium text-slate-900">{slide.title}</p>}
                            {slide.subtitle && <p className="truncate text-xs text-slate-500">{slide.subtitle}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                    실시간 예배 링크 (Live URL)
                  </label>
                  <input
                    type="url"
                    value={youtubeLinks.liveUrl}
                    onChange={(e) => setYoutubeLinks({ ...youtubeLinks, liveUrl: e.target.value })}
                    placeholder="https://www.youtube.com/..."
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    홈페이지 상단 '실시간 예배' 버튼 클릭 시 이동할 링크입니다.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    지난 설교 재생목록 (Playlist Embed URL)
                  </label>
                  <input
                    type="url"
                    value={youtubeLinks.playlistUrl}
                    onChange={(e) => setYoutubeLinks({ ...youtubeLinks, playlistUrl: e.target.value })}
                    placeholder="https://www.youtube.com/embed/videoseries?list=..."
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    홈페이지 하단에 표시될 유튜브 플레이리스트 임베드 URL입니다.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveYoutubeLinks}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    저장하기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default HomepageManagePage
