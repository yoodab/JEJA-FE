// 앨범 접근 권한 타입
export type AlbumAccessType = 'PUBLIC' | 'MEMBER_ONLY'

// 앨범 목록 항목
export interface AlbumListItem {
  id: number
  title: string
  date: string
  photoCount: number
  thumbnail: string
  accessType?: AlbumAccessType
}

// 앨범 상세 정보
export interface AlbumDetail {
  id: number
  title: string
  date: string
  accessType: AlbumAccessType
  photos: Photo[]
}

// 사진 정보
export interface Photo {
  id: number
  url: string
  description?: string
  uploadedAt?: string
}

// 앨범 생성 요청
export interface CreateAlbumRequest {
  title: string
  date: string
  accessType: AlbumAccessType
}

// 앨범 수정 요청
export interface UpdateAlbumRequest {
  title?: string
  date?: string
  accessType?: AlbumAccessType
}

// 사진 업로드 요청
export interface UploadPhotoRequest {
  file: File
  description?: string
}

// 사진 수정 요청
export interface UpdatePhotoRequest {
  description?: string
}

// 로컬 스토리지 키
const STORAGE_KEY = 'youth_albums'

// 내부 저장용 앨범 타입
interface StoredAlbum {
  id: number
  title: string
  date: string
  accessType: AlbumAccessType
  photos: Photo[]
}

// 초기 mock 데이터
const initialMockAlbums: StoredAlbum[] = [
  {
    id: 1,
    title: '2024 전도특공대',
    date: '2024-03-16',
    accessType: 'PUBLIC',
    photos: [
      {
        id: 1,
        url: 'https://via.placeholder.com/800x600?text=전도특공대+1',
        description: '전도특공대 활동 사진',
        uploadedAt: '2024-03-16T10:00:00',
      },
      {
        id: 2,
        url: 'https://via.placeholder.com/800x600?text=전도특공대+2',
        description: '함께하는 시간',
        uploadedAt: '2024-03-16T10:05:00',
      },
    ],
  },
  {
    id: 2,
    title: '청년부 수련회',
    date: '2024-07-20',
    accessType: 'MEMBER_ONLY',
    photos: [
      {
        id: 3,
        url: 'https://via.placeholder.com/800x600?text=수련회+1',
        description: '수련회 첫날',
        uploadedAt: '2024-07-20T09:00:00',
      },
    ],
  },
  {
    id: 3,
    title: '추수감사절 예배',
    date: '2024-11-24',
    accessType: 'PUBLIC',
    photos: [],
  },
]

// 로컬 스토리지에서 앨범 데이터 가져오기
function getStoredAlbums(): StoredAlbum[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    // 초기 데이터 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockAlbums))
    return initialMockAlbums
  } catch (error) {
    console.error('앨범 데이터 로드 실패:', error)
    return initialMockAlbums
  }
}

// 로컬 스토리지에 앨범 데이터 저장
function saveAlbums(albums: StoredAlbum[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(albums))
  } catch (error) {
    console.error('앨범 데이터 저장 실패:', error)
  }
}

// File을 base64로 변환
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 앨범 목록 조회 - GET /api/albums
export async function getAlbums(page?: number, size?: number): Promise<AlbumListItem[]> {
  // 임시: 약간의 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 300))

  const albums = getStoredAlbums()
  return albums.map((album) => ({
    id: album.id,
    title: album.title,
    date: album.date,
    photoCount: album.photos.length,
    thumbnail: album.photos.length > 0 ? album.photos[0].url : 'https://via.placeholder.com/300x200?text=No+Image',
    accessType: album.accessType,
  }))
}

// 앨범 상세 조회 - GET /api/albums/{albumId}
export async function getAlbumById(albumId: number): Promise<AlbumDetail> {
  // 임시: 약간의 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 300))

  const albums = getStoredAlbums()
  const album = albums.find((a) => a.id === albumId)
  if (!album) {
    throw new Error('앨범을 찾을 수 없습니다.')
  }
  return album
}

// 앨범 생성 (관리자) - POST /api/admin/albums
export async function createAlbum(payload: CreateAlbumRequest): Promise<number> {
  // 임시: 약간의 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 300))

  const albums = getStoredAlbums()
  const newId = albums.length > 0 ? Math.max(...albums.map((a) => a.id)) + 1 : 1
  const newAlbum: StoredAlbum = {
    id: newId,
    title: payload.title,
    date: payload.date,
    accessType: payload.accessType,
    photos: [],
  }
  albums.push(newAlbum)
  saveAlbums(albums)
  return newId
}

// 앨범 수정 (관리자) - PATCH /api/admin/albums/{albumId}
export async function updateAlbum(albumId: number, payload: UpdateAlbumRequest): Promise<void> {
  // 임시: 약간의 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 300))

  const albums = getStoredAlbums()
  const album = albums.find((a) => a.id === albumId)
  if (!album) {
    throw new Error('앨범을 찾을 수 없습니다.')
  }
  if (payload.title !== undefined) album.title = payload.title
  if (payload.date !== undefined) album.date = payload.date
  if (payload.accessType !== undefined) album.accessType = payload.accessType
  saveAlbums(albums)
}

// 앨범 삭제 (관리자) - DELETE /api/admin/albums/{albumId}
export async function deleteAlbum(albumId: number): Promise<void> {
  // 임시: 약간의 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 300))

  const albums = getStoredAlbums()
  const filtered = albums.filter((a) => a.id !== albumId)
  saveAlbums(filtered)
}

// 앨범에 사진 추가 (관리자) - POST /api/admin/albums/{albumId}/photos
export async function uploadPhoto(albumId: number, payload: UploadPhotoRequest): Promise<number> {
  // 임시: 약간의 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 500))

  const albums = getStoredAlbums()
  const album = albums.find((a) => a.id === albumId)
  if (!album) {
    throw new Error('앨범을 찾을 수 없습니다.')
  }

  // File을 base64로 변환
  const base64Url = await fileToBase64(payload.file)
  const newPhotoId = album.photos.length > 0 ? Math.max(...album.photos.map((p) => p.id)) + 1 : 1

  const newPhoto: Photo = {
    id: newPhotoId,
    url: base64Url,
    description: payload.description,
    uploadedAt: new Date().toISOString(),
  }

  album.photos.push(newPhoto)
  saveAlbums(albums)
  return newPhotoId
}

// 사진 수정 (관리자) - PATCH /api/admin/albums/{albumId}/photos/{photoId}
export async function updatePhoto(
  albumId: number,
  photoId: number,
  payload: UpdatePhotoRequest
): Promise<void> {
  // 임시: 약간의 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 300))

  const albums = getStoredAlbums()
  const album = albums.find((a) => a.id === albumId)
  if (!album) {
    throw new Error('앨범을 찾을 수 없습니다.')
  }
  const photo = album.photos.find((p) => p.id === photoId)
  if (!photo) {
    throw new Error('사진을 찾을 수 없습니다.')
  }
  if (payload.description !== undefined) {
    photo.description = payload.description
  }
  saveAlbums(albums)
}

// 사진 삭제 (관리자) - DELETE /api/admin/albums/{albumId}/photos/{photoId}
export async function deletePhoto(albumId: number, photoId: number): Promise<void> {
  // 임시: 약간의 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 300))

  const albums = getStoredAlbums()
  const album = albums.find((a) => a.id === albumId)
  if (!album) {
    throw new Error('앨범을 찾을 수 없습니다.')
  }
  album.photos = album.photos.filter((p) => p.id !== photoId)
  saveAlbums(albums)
}

