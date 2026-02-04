import api from './api'

// --- Types ---

export type AlbumAccessType = 'PUBLIC' | 'MEMBER_ONLY'

// Helper to convert backend permission to frontend AccessType
export const mapPermissionToAccessType = (permission?: string): AlbumAccessType => {
  return permission === 'LOGGED_IN_USERS' || permission === 'LOGGED_IN' ? 'MEMBER_ONLY' : 'PUBLIC'
}

// Helper to convert frontend AccessType to backend permission
export const mapAccessTypeToPermission = (accessType: AlbumAccessType): string => {
  return accessType === 'MEMBER_ONLY' ? 'LOGGED_IN_USERS' : 'ALL'
}

export type ReadPermission = 'PUBLIC_READ' | 'MEMBERS_ONLY_READ' | 'ADMIN_ONLY_READ'
export type WritePermission = 'MEMBERS_WRITE' | 'ADMIN_WRITE'

export interface AlbumListItem {
  albumId: number
  title: string
  description?: string
  coverImageUrl?: string
  readPermission?: ReadPermission | string
  writePermission?: WritePermission | string
  createdAt?: string
}

export interface Photo {
  photoId: number
  imageUrl: string
  caption?: string
  uploaderName?: string
}

export interface AlbumDetail {
  id: number
  title: string
  description?: string
  accessType: AlbumAccessType
  readPermission?: ReadPermission | string
  writePermission?: WritePermission | string
  photos: Photo[]
  date?: string
}

export interface FileUploadResult {
  url: string
  originalName: string
}

export interface CreateAlbumRequest {
  title: string
  description?: string
  readPermission: string
  writePermission: string
}

export interface UpdateAlbumRequest {
  title?: string
  description?: string
  readPermission?: string
  writePermission?: string
}

// --- Utils ---

export const getFileUrl = (path: string | undefined): string => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  return `${cleanBase}/${cleanPath}`
}

export const isVideo = (url: string): boolean => {
  const ext = url.split('.').pop()?.toLowerCase()
  return ['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')
}

// --- API Functions ---

// 1. File Upload
export async function uploadFiles(files: File[], folder: string = 'album'): Promise<FileUploadResult[]> {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  const response = await api.post(`/api/files/upload`, formData, {
    params: { folder },
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data.data
}

// 2. Album List
export async function getAlbums(page: number = 0, size: number = 20): Promise<{ content: AlbumListItem[], totalPages: number, totalElements: number }> {
  const response = await api.get('/api/albums', {
    params: { page, size }
  })
  return response.data.data
}

// 3. Album Detail (Metadata + Photos)
export async function getAlbumPhotos(albumId: number): Promise<Photo[]> {
  const response = await api.get(`/api/albums/${albumId}/photos`)
  return response.data.data
}

// Helper to get full album detail including metadata
export async function getAlbumDetail(albumId: number, cachedMetadata?: AlbumListItem): Promise<AlbumDetail> {
  const photosPromise = getAlbumPhotos(albumId)
  
  let metadata: AlbumListItem | undefined = cachedMetadata

  if (!metadata) {
     try {
        // Fallback: Fetch list to find metadata since /api/albums/{id} is not available
        // Try to find in first 100 items. 
        const res = await getAlbums(0, 100)
        metadata = res.content.find(a => a.albumId === albumId)
     } catch (e) {
        console.warn('Failed to fetch album list for metadata', e)
     }
  }

  const photos = await photosPromise

  return {
    id: albumId,
    title: metadata?.title || 'Unknown Album',
    description: metadata?.description,
    accessType: mapPermissionToAccessType(metadata?.readPermission),
    photos: photos,
    date: metadata?.createdAt ? metadata.createdAt.split('T')[0] : ''
  }
}

// 4. Create Album
export async function createAlbum(payload: CreateAlbumRequest): Promise<number | undefined> {
  const response = await api.post('/api/admin/albums', payload)
  return response.data.data?.albumId
}

// 5. Update Album
export async function updateAlbum(albumId: number, payload: UpdateAlbumRequest): Promise<void> {
  await api.patch(`/api/admin/albums/${albumId}`, payload)
}

// 6. Delete Album
export async function deleteAlbum(albumId: number): Promise<void> {
  await api.delete(`/api/admin/albums/${albumId}`)
}

// 7. Add Photos to Album
export async function addPhotosToAlbum(albumId: number, photoUrls: string[]): Promise<void> {
  await api.post(`/api/albums/${albumId}/photos`, photoUrls)
}

// 8. Update Photo (Caption)
export async function updatePhoto(albumId: number, photoId: number, caption: string): Promise<void> {
  await api.patch(`/api/albums/${albumId}/photos/${photoId}`, { caption })
}

// 9. Delete Photo
export async function deletePhoto(photoId: number): Promise<void> {
  await api.delete(`/api/photos/${photoId}`)
}
