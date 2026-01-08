import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import { isManager } from '../utils/auth'
import {
  getAlbums,
  createAlbum,
  deleteAlbum,
  type AlbumListItem,
  type AlbumAccessType,
} from '../services/albumService'

function YouthAlbumPage() {
  const navigate = useNavigate()
  const [albums, setAlbums] = useState<AlbumListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newAlbumTitle, setNewAlbumTitle] = useState('')
  const [newAlbumDate, setNewAlbumDate] = useState('')
  const [newAlbumAccessType, setNewAlbumAccessType] = useState<AlbumAccessType>('PUBLIC')
  const [isManagerUser, setIsManagerUser] = useState(false)

  useEffect(() => {
    setIsManagerUser(isManager())
    loadAlbums()
  }, [])

  const loadAlbums = async () => {
    try {
      setLoading(true)
      const data = await getAlbums()
      setAlbums(data)
    } catch (error) {
      console.error('앨범 목록 조회 실패:', error)
      // 에러 발생 시 빈 배열로 설정
      setAlbums([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) {
      alert('앨범 제목을 입력해주세요.')
      return
    }
    if (!newAlbumDate) {
      alert('날짜를 선택해주세요.')
      return
    }

    try {
      const albumId = await createAlbum({
        title: newAlbumTitle.trim(),
        date: newAlbumDate,
        accessType: newAlbumAccessType,
      })
      alert('앨범이 생성되었습니다.')
      setIsCreateModalOpen(false)
      setNewAlbumTitle('')
      setNewAlbumDate('')
      setNewAlbumAccessType('PUBLIC')
      loadAlbums()
      // 생성된 앨범 상세 페이지로 이동
      navigate(`/youth-album/${albumId}`)
    } catch (error) {
      console.error('앨범 생성 실패:', error)
      alert('앨범 생성에 실패했습니다.')
    }
  }

  const handleDeleteAlbum = async (albumId: number, title: string) => {
    if (!confirm(`"${title}" 앨범을 삭제하시겠습니까?`)) {
      return
    }

    try {
      await deleteAlbum(albumId)
      alert('앨범이 삭제되었습니다.')
      loadAlbums()
    } catch (error) {
      console.error('앨범 삭제 실패:', error)
      alert('앨범 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">청년부 앨범</h1>
            <p className="mt-1 text-sm text-slate-600">예배와 행사 사진들을 모아두는 공간입니다.</p>
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
            <Link
              to="/user-dashboard"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← 메인으로
            </Link>
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
                key={album.id}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <Link to={`/youth-album/${album.id}`}>
                  <div className="aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={album.thumbnail || 'https://via.placeholder.com/300x200?text=No+Image'}
                      alt={album.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src =
                          'https://via.placeholder.com/300x200?text=No+Image'
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <h2 className="text-base font-semibold text-slate-900">{album.title}</h2>
                      {album.accessType === 'MEMBER_ONLY' && (
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          회원전용
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{album.date}</span>
                      <span>{album.photoCount}장</span>
                    </div>
                  </div>
                </Link>
                {isManagerUser && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleDeleteAlbum(album.id, album.title)
                    }}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow-sm transition hover:bg-red-600 group-hover:opacity-100"
                    title="앨범 삭제"
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
                  </button>
                )}
              </div>
            ))}
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
                  <label className="block text-sm font-medium text-slate-700">날짜</label>
                  <input
                    type="date"
                    value={newAlbumDate}
                    onChange={(e) => setNewAlbumDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">접근 권한</label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="PUBLIC"
                        checked={newAlbumAccessType === 'PUBLIC'}
                        onChange={(e) => setNewAlbumAccessType(e.target.value as AlbumAccessType)}
                        className="mr-2"
                      />
                      <span className="text-sm">전체 공개</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="MEMBER_ONLY"
                        checked={newAlbumAccessType === 'MEMBER_ONLY'}
                        onChange={(e) => setNewAlbumAccessType(e.target.value as AlbumAccessType)}
                        className="mr-2"
                      />
                      <span className="text-sm">로그인한 사용자만</span>
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
                    setNewAlbumAccessType('PUBLIC')
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


