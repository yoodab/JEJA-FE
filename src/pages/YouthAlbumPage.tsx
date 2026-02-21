import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useConfirm } from '../contexts/ConfirmContext'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import { isManager } from '../utils/auth'
import {
  getAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  getFileUrl,
  type ReadPermission,
  type WritePermission,
  type AlbumListItem,
} from '../services/albumService'

function YouthAlbumPage() {
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const [albums, setAlbums] = useState<AlbumListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newAlbumTitle, setNewAlbumTitle] = useState('')
  const [newAlbumDate, setNewAlbumDate] = useState('')
  
  // New Permissions State for Create
  const [newReadPermission, setNewReadPermission] = useState<ReadPermission>('PUBLIC_READ')
  const [newWritePermission, setNewWritePermission] = useState<WritePermission>('ADMIN_WRITE')

  const [isManagerUser, setIsManagerUser] = useState(false)

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingAlbumId, setEditingAlbumId] = useState<number | null>(null)
  const [editAlbumTitle, setEditAlbumTitle] = useState('')
  const [editAlbumDate, setEditAlbumDate] = useState('')
  
  // New Permissions State for Edit
  const [editReadPermission, setEditReadPermission] = useState<ReadPermission>('PUBLIC_READ')
  const [editWritePermission, setEditWritePermission] = useState<WritePermission>('ADMIN_WRITE')

  // Dropdown Menu State
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null)

  useEffect(() => {
    setIsManagerUser(isManager())
    loadAlbums()
  }, [])

  const loadAlbums = async () => {
    try {
      setLoading(true)
      const data = await getAlbums(0, 100) // Load first 100
      setAlbums(data.content)
    } catch (error) {
      console.error('앨범 목록 조회 실패:', error)
      setAlbums([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) {
      toast.error('앨범 제목을 입력해주세요.')
      return
    }
    
    try {
      const albumId = await createAlbum({
        title: newAlbumTitle.trim(),
        description: newAlbumDate, // Use description field for date/info
        readPermission: newReadPermission,
        writePermission: newWritePermission,
      })
      toast.success('앨범이 생성되었습니다.')
      setIsCreateModalOpen(false)
      setNewAlbumTitle('')
      setNewAlbumDate('')
      setNewReadPermission('PUBLIC_READ')
      setNewWritePermission('ADMIN_WRITE')
      loadAlbums()
      
      if (albumId) {
        navigate(`/youth-album/${albumId}`)
      }
    } catch (error) {
      console.error('앨범 생성 실패:', error)
      toast.error('앨범 생성에 실패했습니다.')
    }
  }

  const handleUpdateAlbum = async () => {
    if (!editAlbumTitle.trim()) {
      toast.error('앨범 제목을 입력해주세요.')
      return
    }
    if (!editingAlbumId) return

    try {
      await updateAlbum(editingAlbumId, {
        title: editAlbumTitle.trim(),
        description: editAlbumDate,
        readPermission: editReadPermission,
        writePermission: editWritePermission,
      })
      toast.success('앨범이 수정되었습니다.')
      setIsEditModalOpen(false)
      setEditingAlbumId(null)
      loadAlbums()
    } catch (error) {
      console.error('앨범 수정 실패:', error)
      toast.error('앨범 수정에 실패했습니다.')
    }
  }

  const handleDeleteAlbum = async (albumId: number, title: string) => {
    const isConfirmed = await confirm({
      title: '앨범 삭제',
      message: `"${title}" 앨범을 삭제하시겠습니까?`,
      type: 'danger',
      confirmText: '삭제'
    })

    if (!isConfirmed) return

    try {
      await deleteAlbum(albumId)
      toast.success('앨범이 삭제되었습니다.')
      loadAlbums()
    } catch (error) {
      console.error('앨범 삭제 실패:', error)
      toast.error('앨범 삭제에 실패했습니다.')
    }
  }

  const handleEditClick = (album: AlbumListItem) => {
    setEditingAlbumId(album.albumId)
    setEditAlbumTitle(album.title)
    setEditAlbumDate(album.description || '')
    
    // Map Read Permission
    let rPerm: ReadPermission = 'PUBLIC_READ'
    if (album.readPermission === 'LOGGED_IN_USERS' || album.readPermission === 'MEMBERS_ONLY_READ') {
      rPerm = 'MEMBERS_ONLY_READ'
    } else if (album.readPermission === 'ADMIN_ONLY_READ') {
      rPerm = 'ADMIN_ONLY_READ'
    }
    setEditReadPermission(rPerm)

    // Map Write Permission
    let wPerm: WritePermission = 'ADMIN_WRITE'
    if (album.writePermission === 'MEMBERS_WRITE') {
      wPerm = 'MEMBERS_WRITE'
    }
    setEditWritePermission(wPerm)

    setIsEditModalOpen(true)
    setActiveMenuId(null)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenuId !== null && !(event.target as Element).closest('.album-menu-container')) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeMenuId])

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">청년부 앨범</h1>
            <p className="mt-1 text-sm text-slate-500">
              우리들의 소중한 추억을 기록하는 공간입니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isManagerUser && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                + 폴더 생성
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-500">로딩 중...</p>
          </div>
        ) : albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-12">
            <p className="text-slate-500">등록된 앨범이 없습니다.</p>
            {isManagerUser && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                첫 앨범 만들기
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <div
          key={album.albumId}
          className="group relative transition"
        >
                <Link 
                  to={`/youth-album/${album.albumId}`}
                  state={{ album }}
                  className="block"
                >
                  <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-slate-100">
                    {album.coverImageUrl ? (
                      <img
                        src={getFileUrl(album.coverImageUrl)}
                        alt={album.title}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Image'
                          e.currentTarget.onerror = null // Prevent infinite loop
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-200 transition group-hover:bg-slate-300">
                        <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4 rounded-b-xl">
                    <div className="flex items-start justify-between pr-6">
                      <h2 className="text-base font-semibold text-slate-900">{album.title}</h2>
                      {album.readPermission === 'LOGGED_IN_USERS' && (
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 whitespace-nowrap">
                          회원전용
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{album.description || album.createdAt?.split('T')[0]}</span>
                    </div>
                  </div>
                </Link>
                
                {isManagerUser && (
                  <div className={`album-menu-container absolute right-2 top-2 transition-opacity ${
                    activeMenuId === album.albumId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setActiveMenuId(activeMenuId === album.albumId ? null : album.albumId)
                      }}
                      className="rounded-full bg-black/20 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/40"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    
                    {activeMenuId === album.albumId && (
                      <div className="absolute right-0 top-full mt-1 w-28 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleEditClick(album)
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                        >
                          수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDeleteAlbum(album.albumId, album.title)
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 앨범 수정 모달 */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold">앨범 정보 수정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">앨범 제목</label>
                  <input
                    type="text"
                    value={editAlbumTitle}
                    onChange={(e) => setEditAlbumTitle(e.target.value)}
                    placeholder="예: 2024 전도특공대"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">설명 / 날짜</label>
                  <input
                    type="text"
                    value={editAlbumDate}
                    onChange={(e) => setEditAlbumDate(e.target.value)}
                    placeholder="예: 2024-03-16"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">읽기 권한</label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="PUBLIC_READ"
                        checked={editReadPermission === 'PUBLIC_READ'}
                        onChange={(e) => setEditReadPermission(e.target.value as ReadPermission)}
                        className="mr-2"
                      />
                      <span className="text-sm">전체 공개</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="MEMBERS_ONLY_READ"
                        checked={editReadPermission === 'MEMBERS_ONLY_READ'}
                        onChange={(e) => setEditReadPermission(e.target.value as ReadPermission)}
                        className="mr-2"
                      />
                      <span className="text-sm">로그인한 사용자만</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="ADMIN_ONLY_READ"
                        checked={editReadPermission === 'ADMIN_ONLY_READ'}
                        onChange={(e) => setEditReadPermission(e.target.value as ReadPermission)}
                        className="mr-2"
                      />
                      <span className="text-sm">관리자 그룹만</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">쓰기 권한</label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="MEMBERS_WRITE"
                        checked={editWritePermission === 'MEMBERS_WRITE'}
                        onChange={(e) => setEditWritePermission(e.target.value as WritePermission)}
                        className="mr-2"
                      />
                      <span className="text-sm">로그인한 사용자 쓰기</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="ADMIN_WRITE"
                        checked={editWritePermission === 'ADMIN_WRITE'}
                        onChange={(e) => setEditWritePermission(e.target.value as WritePermission)}
                        className="mr-2"
                      />
                      <span className="text-sm">관리자 그룹만 쓰기</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingAlbumId(null)
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateAlbum}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  수정
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 폴더 생성 모달 */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold">새 앨범 폴더 생성</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">앨범 제목</label>
                  <input
                    type="text"
                    value={newAlbumTitle}
                    onChange={(e) => setNewAlbumTitle(e.target.value)}
                    placeholder="예: 2024 전도특공대"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">설명 / 날짜</label>
                  <input
                    type="text"
                    value={newAlbumDate}
                    onChange={(e) => setNewAlbumDate(e.target.value)}
                    placeholder="예: 2024-03-16"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">읽기 권한</label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="PUBLIC_READ"
                        checked={newReadPermission === 'PUBLIC_READ'}
                        onChange={(e) => setNewReadPermission(e.target.value as ReadPermission)}
                        className="mr-2"
                      />
                      <span className="text-sm">전체 공개</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="MEMBERS_ONLY_READ"
                        checked={newReadPermission === 'MEMBERS_ONLY_READ'}
                        onChange={(e) => setNewReadPermission(e.target.value as ReadPermission)}
                        className="mr-2"
                      />
                      <span className="text-sm">로그인한 사용자만</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="ADMIN_ONLY_READ"
                        checked={newReadPermission === 'ADMIN_ONLY_READ'}
                        onChange={(e) => setNewReadPermission(e.target.value as ReadPermission)}
                        className="mr-2"
                      />
                      <span className="text-sm">관리자 그룹만</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">쓰기 권한</label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="MEMBERS_WRITE"
                        checked={newWritePermission === 'MEMBERS_WRITE'}
                        onChange={(e) => setNewWritePermission(e.target.value as WritePermission)}
                        className="mr-2"
                      />
                      <span className="text-sm">로그인한 사용자 쓰기</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="ADMIN_WRITE"
                        checked={newWritePermission === 'ADMIN_WRITE'}
                        onChange={(e) => setNewWritePermission(e.target.value as WritePermission)}
                        className="mr-2"
                      />
                      <span className="text-sm">관리자 그룹만 쓰기</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setNewAlbumTitle('')
                    setNewAlbumDate('')
                    setNewReadPermission('PUBLIC_READ')
                    setNewWritePermission('ADMIN_WRITE')
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateAlbum}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  생성
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  )
}

export default YouthAlbumPage
