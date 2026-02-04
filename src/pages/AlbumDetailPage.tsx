import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import { isManager } from '../utils/auth'
import {
  getAlbumDetail,
  uploadFiles,
  addPhotosToAlbum,
  updatePhoto,
  deletePhoto,
  getFileUrl,
  isVideo,
  type AlbumDetail,
  type Photo,
  type AlbumListItem,
} from '../services/albumService'

function AlbumDetailPage() {
  const { albumId } = useParams<{ albumId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const initialAlbum = location.state?.album as AlbumListItem | undefined
  
  const [album, setAlbum] = useState<AlbumDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isManagerUser, setIsManagerUser] = useState(false)
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadFilesList, setUploadFilesList] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  // Edit Photo State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [editDescription, setEditDescription] = useState('')
  
  const [activePhotoMenuId, setActivePhotoMenuId] = useState<number | null>(null)
  
  // Multi-Select & Download State
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(new Set())

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activePhotoMenuId !== null && !(event.target as Element).closest('.photo-menu-container')) {
        setActivePhotoMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activePhotoMenuId])

  const loadAlbum = useCallback(async () => {
    if (!albumId) return
    try {
      setLoading(true)
      const data = await getAlbumDetail(Number(albumId), initialAlbum)
      setAlbum(data)
    } catch (error) {
      console.error('앨범 상세 조회 실패:', error)
      alert('앨범을 불러올 수 없습니다.')
      navigate('/youth-album')
    } finally {
      setLoading(false)
    }
  }, [albumId, initialAlbum, navigate])

  useEffect(() => {
    setIsManagerUser(isManager())
    if (albumId) {
      loadAlbum()
    }
  }, [albumId, loadAlbum])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadFilesList(Array.from(e.target.files))
    }
  }

  const handleUploadPhoto = async () => {
    if (uploadFilesList.length === 0) {
      alert('파일을 선택해주세요.')
      return
    }
    if (!albumId) return

    try {
      setIsUploading(true)
      
      // 1. Upload files to get paths
      const uploadResults = await uploadFiles(uploadFilesList, 'album')
      const photoUrls = uploadResults.map(res => res.url)
      
      // 2. Register photos to album
      await addPhotosToAlbum(Number(albumId), photoUrls)
      
      alert('사진이 업로드되었습니다.')
      setIsUploadModalOpen(false)
      setUploadFilesList([])
      loadAlbum()
    } catch (error) {
      console.error('사진 업로드 실패:', error)
      alert('사진 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpdatePhoto = async () => {
    if (!selectedPhoto || !albumId) return

    try {
      await updatePhoto(Number(albumId), selectedPhoto.photoId, editDescription)
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
      await deletePhoto(photo.photoId)
      alert('사진이 삭제되었습니다.')
      loadAlbum()
    } catch (error) {
      console.error('사진 삭제 실패:', error)
      alert('사진 삭제에 실패했습니다.')
    }
  }

  const openEditModal = (photo: Photo) => {
    setSelectedPhoto(photo)
    setEditDescription(photo.caption || '')
    setIsEditModalOpen(true)
  }

  // --- Multi-Select Logic ---

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    setSelectedPhotoIds(new Set())
  }

  const togglePhotoSelection = (photoId: number) => {
    const newSelected = new Set(selectedPhotoIds)
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId)
    } else {
      newSelected.add(photoId)
    }
    setSelectedPhotoIds(newSelected)
  }

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download failed:', error)
      window.open(url, '_blank')
    }
  }

  const handleBatchDownload = async () => {
    if (!album) return
    const selectedPhotos = album.photos.filter(p => selectedPhotoIds.has(p.photoId))
    
    if (selectedPhotos.length === 0) {
      alert('다운로드할 사진을 선택해주세요.')
      return
    }

    // Sequential download
    for (let i = 0; i < selectedPhotos.length; i++) {
      const photo = selectedPhotos[i]
      const url = getFileUrl(photo.imageUrl)
      const ext = photo.imageUrl.split('.').pop() || 'jpg'
      const filename = `${album.title}_${i + 1}.${ext}`
      
      await downloadFile(url, filename)
      await new Promise(resolve => setTimeout(resolve, 500)) // 0.5s delay
    }
    
    setIsSelectMode(false)
    setSelectedPhotoIds(new Set())
  }

  const handleBatchDelete = async () => {
    if (!album) return
    const selectedPhotos = album.photos.filter(p => selectedPhotoIds.has(p.photoId))

    if (selectedPhotos.length === 0) {
      alert('삭제할 사진을 선택해주세요.')
      return
    }

    if (!confirm(`${selectedPhotos.length}장의 사진을 삭제하시겠습니까?`)) {
      return
    }

    try {
      // Sequential delete
      for (const photo of selectedPhotos) {
        await deletePhoto(photo.photoId)
      }
      alert('사진이 삭제되었습니다.')
      setIsSelectMode(false)
      setSelectedPhotoIds(new Set())
      loadAlbum()
    } catch (error) {
      console.error('사진 삭제 실패:', error)
      alert('사진 삭제 중 오류가 발생했습니다.')
    }
  }

  // --- Lightbox Logic ---

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null)
    document.body.style.overflow = 'auto'
  }, [])

  const nextPhoto = useCallback(() => {
    if (album && lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev === null || prev === album.photos.length - 1 ? 0 : prev + 1))
    }
  }, [album, lightboxIndex])

  const prevPhoto = useCallback(() => {
    if (album && lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev === null || prev === 0 ? album.photos.length - 1 : prev - 1))
    }
  }, [album, lightboxIndex])

  const handleDownloadCurrent = () => {
    if (album && lightboxIndex !== null) {
      const photo = album.photos[lightboxIndex]
      const url = getFileUrl(photo.imageUrl)
      const ext = photo.imageUrl.split('.').pop() || 'jpg'
      const filename = `${album.title}_${lightboxIndex + 1}.${ext}`
      downloadFile(url, filename)
    }
  }

  // Keyboard Navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return

      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') prevPhoto()
      if (e.key === 'ArrowRight') nextPhoto()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, album, closeLightbox, prevPhoto, nextPhoto])

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/youth-album"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← 앨범 목록
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{album.title}</h1>
              <p className="mt-1 text-sm text-slate-600">{album.date || album.description}</p>
            </div>
            {album.accessType === 'MEMBER_ONLY' && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                회원전용
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
             <button
              onClick={toggleSelectMode}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                isSelectMode
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {isSelectMode ? '선택 모드 종료' : '사진 선택'}
            </button>

            {isManagerUser && (
              <>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  + 사진 업로드
                </button>
              </>
            )}
          </div>
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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {album.photos.map((photo, index) => {
              const isSelected = selectedPhotoIds.has(photo.photoId)
              
              return (
                <div
                  key={photo.photoId}
                  className={`group relative overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md ${
                    isSelectMode && isSelected ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-200'
                  }`}
                  onClick={() => {
                    if (isSelectMode) {
                      togglePhotoSelection(photo.photoId)
                    } else {
                      openLightbox(index)
                    }
                  }}
                >
                  <div className="aspect-square w-full overflow-hidden bg-slate-100 cursor-pointer">
                    {isVideo(photo.imageUrl) ? (
                      <div className="relative h-full w-full">
                         <video
                            src={getFileUrl(photo.imageUrl)}
                            className="h-full w-full object-cover"
                         />
                         <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                           <svg className="w-12 h-12 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20">
                             <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                           </svg>
                         </div>
                      </div>
                    ) : (
                      <img
                        src={getFileUrl(photo.imageUrl)}
                        alt={photo.caption || '사진'}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src =
                            'https://via.placeholder.com/300x300?text=Image+Error'
                        }}
                      />
                    )}
                    
                    {/* Select Mode Checkbox Overlay */}
                    {isSelectMode && (
                      <div className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                        isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white bg-opacity-50 border-white'
                      }`}>
                         {isSelected && (
                           <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                           </svg>
                         )}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3">
                    {photo.caption && <p className="text-sm text-slate-800 mb-1">{photo.caption}</p>}
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {photo.uploaderName || '익명'}
                    </p>
                  </div>

                  {isManagerUser && !isSelectMode && (
                    <div 
                      className={`absolute right-2 top-2 photo-menu-container transition-opacity ${
                        activePhotoMenuId === photo.photoId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setActivePhotoMenuId(activePhotoMenuId === photo.photoId ? null : photo.photoId)}
                        className="rounded-full bg-white bg-opacity-80 p-1.5 text-slate-700 shadow-sm transition hover:bg-opacity-100"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>

                      {activePhotoMenuId === photo.photoId && (
                        <div className="absolute right-0 top-full mt-1 w-24 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                          <button
                            onClick={() => {
                              setActivePhotoMenuId(null)
                              openEditModal(photo)
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => {
                              setActivePhotoMenuId(null)
                              handleDeletePhoto(photo)
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
              )
            })}
          </div>
        )}

        {/* Floating Action Bar for Select Mode */}
        {isSelectMode && (
           <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full bg-slate-900 px-6 py-3 text-white shadow-xl">
             <span className="font-medium">{selectedPhotoIds.size}장의 사진 선택됨</span>
             <div className="h-4 w-px bg-slate-600"></div>
             <button 
               onClick={handleBatchDownload}
               disabled={selectedPhotoIds.size === 0}
               className="text-sm font-semibold hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               일괄 다운로드
             </button>
             {isManagerUser && (
               <button
                 onClick={handleBatchDelete}
                 disabled={selectedPhotoIds.size === 0}
                 className="text-sm font-semibold hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 삭제
               </button>
             )}
             <button 
               onClick={toggleSelectMode}
               className="text-sm font-semibold hover:text-slate-300"
             >
               취소
             </button>
           </div>
        )}

        {/* Lightbox Modal */}
        {lightboxIndex !== null && album && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 text-white hover:text-slate-300 z-50 p-2"
              onClick={closeLightbox}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation Left */}
            <button 
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/10 rounded-full transition"
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Main Content */}
            <div 
              className="relative max-h-[85vh] max-w-[90vw]" 
              onClick={(e) => e.stopPropagation()}
            >
              {isVideo(album.photos[lightboxIndex].imageUrl) ? (
                <video
                  src={getFileUrl(album.photos[lightboxIndex].imageUrl)}
                  controls
                  autoPlay
                  className="max-h-[80vh] max-w-full rounded-lg"
                />
              ) : (
                <img
                  src={getFileUrl(album.photos[lightboxIndex].imageUrl)}
                  alt={album.photos[lightboxIndex].caption}
                  className="max-h-[80vh] max-w-full rounded-lg object-contain"
                />
              )}
              
              {/* Bottom Info Bar */}
              <div className="absolute -bottom-16 left-0 right-0 text-center">
                 <div className="flex flex-col items-center gap-2">
                    {album.photos[lightboxIndex].caption && (
                      <p className="text-lg font-medium text-white">{album.photos[lightboxIndex].caption}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {album.photos[lightboxIndex].uploaderName || '익명'}
                      </span>
                      <button 
                        onClick={handleDownloadCurrent}
                        className="flex items-center gap-1 hover:text-white transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        다운로드
                      </button>
                    </div>
                 </div>
              </div>
            </div>

            {/* Navigation Right */}
            <button 
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/10 rounded-full transition"
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* 사진 업로드 모달 */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold">사진 업로드</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">파일 선택 (다중 선택 가능)</label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {uploadFilesList.length > 0 && (
                     <p className="mt-2 text-sm text-slate-600">{uploadFilesList.length}개 파일 선택됨</p>
                  )}
                </div>
                {isUploading && (
                    <div className="text-center text-blue-600">
                        <p>업로드 중입니다... 잠시만 기다려주세요.</p>
                    </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsUploadModalOpen(false)
                    setUploadFilesList([])
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  disabled={isUploading}
                >
                  취소
                </button>
                <button
                  onClick={handleUploadPhoto}
                  disabled={isUploading || uploadFilesList.length === 0}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                      isUploading || uploadFilesList.length === 0
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isUploading ? '업로드 중...' : '업로드'}
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
              <div className="mb-4 max-h-60 overflow-hidden rounded-lg">
                 {isVideo(selectedPhoto.imageUrl) ? (
                    <video src={getFileUrl(selectedPhoto.imageUrl)} className="w-full" />
                 ) : (
                    <img
                    src={getFileUrl(selectedPhoto.imageUrl)}
                    alt={selectedPhoto.caption || '사진'}
                    className="w-full object-cover"
                    />
                 )}
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



        <Footer />
      </div>
    </div>
  )
}

export default AlbumDetailPage
