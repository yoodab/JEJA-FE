import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import { isManager } from '../utils/auth'
import {
  getAlbumById,
  uploadPhoto,
  updatePhoto,
  deletePhoto,
  updateAlbum,
  type AlbumDetail,
  type Photo,
  type AlbumAccessType,
} from '../services/albumService'

function AlbumDetailPage() {
  const { albumId } = useParams<{ albumId: string }>()
  const navigate = useNavigate()
  const [album, setAlbum] = useState<AlbumDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isManagerUser, setIsManagerUser] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadDescription, setUploadDescription] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isEditAlbumModalOpen, setIsEditAlbumModalOpen] = useState(false)
  const [editAlbumTitle, setEditAlbumTitle] = useState('')
  const [editAlbumDate, setEditAlbumDate] = useState('')
  const [editAlbumAccessType, setEditAlbumAccessType] = useState<AlbumAccessType>('PUBLIC')

  useEffect(() => {
    setIsManagerUser(isManager())
    if (albumId) {
      loadAlbum()
    }
  }, [albumId])

  const loadAlbum = async () => {
    if (!albumId) return
    try {
      setLoading(true)
      const data = await getAlbumById(Number(albumId))
      setAlbum(data)
      setEditAlbumTitle(data.title)
      setEditAlbumDate(data.date)
      setEditAlbumAccessType(data.accessType)
    } catch (error) {
      console.error('앨범 상세 조회 실패:', error)
      alert('앨범을 불러올 수 없습니다.')
      navigate('/youth-album')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadPhoto = async () => {
    if (!uploadFile) {
      alert('파일을 선택해주세요.')
      return
    }
    if (!albumId) return

    try {
      await uploadPhoto(Number(albumId), {
        file: uploadFile,
        description: uploadDescription.trim() || undefined,
      })
      alert('사진이 업로드되었습니다.')
      setIsUploadModalOpen(false)
      setUploadFile(null)
      setUploadDescription('')
      loadAlbum()
    } catch (error) {
      console.error('사진 업로드 실패:', error)
      alert('사진 업로드에 실패했습니다.')
    }
  }

  const handleUpdatePhoto = async () => {
    if (!selectedPhoto || !albumId) return

    try {
      await updatePhoto(Number(albumId), selectedPhoto.id, {
        description: editDescription.trim() || undefined,
      })
      alert('사진이 수정되었습니다.')
      setIsEditModalOpen(false)
      setSelectedPhoto(null)
      setEditDescription('')
      loadAlbum()
    } catch (error) {
      console.error('사진 수정 실패:', error)
      alert('사진 수정에 실패했습니다.')
    }
  }

  const handleDeletePhoto = async (photo: Photo) => {
    if (!confirm('이 사진을 삭제하시겠습니까?')) {
      return
    }
    if (!albumId) return

    try {
      await deletePhoto(Number(albumId), photo.id)
      alert('사진이 삭제되었습니다.')
      loadAlbum()
    } catch (error) {
      console.error('사진 삭제 실패:', error)
      alert('사진 삭제에 실패했습니다.')
    }
  }

  const handleUpdateAlbum = async () => {
    if (!editAlbumTitle.trim()) {
      alert('앨범 제목을 입력해주세요.')
      return
    }
    if (!editAlbumDate) {
      alert('날짜를 선택해주세요.')
      return
    }
    if (!albumId) return

    try {
      await updateAlbum(Number(albumId), {
        title: editAlbumTitle.trim(),
        date: editAlbumDate,
        accessType: editAlbumAccessType,
      })
      alert('앨범 정보가 수정되었습니다.')
      setIsEditAlbumModalOpen(false)
      loadAlbum()
    } catch (error) {
      console.error('앨범 수정 실패:', error)
      alert('앨범 수정에 실패했습니다.')
    }
  }

  const openEditModal = (photo: Photo) => {
    setSelectedPhoto(photo)
    setEditDescription(photo.description || '')
    setIsEditModalOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <UserHeader />
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-500">로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!album) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/youth-album"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← 앨범 목록
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{album.title}</h1>
              <p className="mt-1 text-sm text-slate-600">{album.date}</p>
            </div>
            {album.accessType === 'MEMBER_ONLY' && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                회원전용
              </span>
            )}
          </div>
          {isManagerUser && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditAlbumModalOpen(true)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                앨범 수정
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                + 사진 업로드
              </button>
            </div>
          )}
        </div>

        {album.photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-12">
            <p className="text-slate-500">등록된 사진이 없습니다.</p>
            {isManagerUser && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                첫 사진 업로드하기
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {album.photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="aspect-square w-full overflow-hidden bg-slate-100">
                  <img
                    src={photo.url}
                    alt={photo.description || '사진'}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src =
                        'https://via.placeholder.com/300x300?text=Image+Error'
                    }}
                  />
                </div>
                {photo.description && (
                  <div className="p-3">
                    <p className="text-sm text-slate-600">{photo.description}</p>
                  </div>
                )}
                {isManagerUser && (
                  <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => openEditModal(photo)}
                      className="rounded-full bg-blue-500 p-1.5 text-white shadow-sm transition hover:bg-blue-600"
                      title="사진 수정"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(photo)}
                      className="rounded-full bg-red-500 p-1.5 text-white shadow-sm transition hover:bg-red-600"
                      title="사진 삭제"
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
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 사진 업로드 모달 */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold">사진 업로드</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">파일 선택</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">설명 (선택)</label>
                  <textarea
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="사진에 대한 설명을 입력하세요"
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsUploadModalOpen(false)
                    setUploadFile(null)
                    setUploadDescription('')
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleUploadPhoto}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  업로드
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 사진 수정 모달 */}
        {isEditModalOpen && selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold">사진 수정</h2>
              <div className="mb-4">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.description || '사진'}
                  className="w-full rounded-lg"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">설명</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="사진에 대한 설명을 입력하세요"
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setSelectedPhoto(null)
                    setEditDescription('')
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdatePhoto}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  수정
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 앨범 수정 모달 */}
        {isEditAlbumModalOpen && (
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
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">날짜</label>
                  <input
                    type="date"
                    value={editAlbumDate}
                    onChange={(e) => setEditAlbumDate(e.target.value)}
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
                        checked={editAlbumAccessType === 'PUBLIC'}
                        onChange={(e) =>
                          setEditAlbumAccessType(e.target.value as AlbumAccessType)
                        }
                        className="mr-2"
                      />
                      <span className="text-sm">전체 공개</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="MEMBER_ONLY"
                        checked={editAlbumAccessType === 'MEMBER_ONLY'}
                        onChange={(e) =>
                          setEditAlbumAccessType(e.target.value as AlbumAccessType)
                        }
                        className="mr-2"
                      />
                      <span className="text-sm">로그인한 사용자만</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsEditAlbumModalOpen(false)}
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

        <Footer />
      </div>
    </div>
  )
}

export default AlbumDetailPage

