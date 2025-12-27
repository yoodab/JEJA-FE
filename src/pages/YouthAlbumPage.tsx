import { Link } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'

interface Album {
  id: number
  title: string
  date: string
  photoCount: number
  thumbnail: string
}

const mockAlbums: Album[] = [
  {
    id: 1,
    title: '2024 전도특공대',
    date: '2024-03-16',
    photoCount: 24,
    thumbnail: 'https://via.placeholder.com/300x200?text=전도특공대',
  },
  {
    id: 2,
    title: '청년부 수련회',
    date: '2024-07-20',
    photoCount: 45,
    thumbnail: 'https://via.placeholder.com/300x200?text=수련회',
  },
  {
    id: 3,
    title: '추수감사절 예배',
    date: '2024-11-24',
    photoCount: 18,
    thumbnail: 'https://via.placeholder.com/300x200?text=추수감사절',
  },
  {
    id: 4,
    title: '성탄절 특별예배',
    date: '2024-12-25',
    photoCount: 32,
    thumbnail: 'https://via.placeholder.com/300x200?text=성탄절',
  },
  {
    id: 5,
    title: '순모임 모임',
    date: '2024-12-10',
    photoCount: 15,
    thumbnail: 'https://via.placeholder.com/300x200?text=순모임',
  },
  {
    id: 6,
    title: '청년부 야외활동',
    date: '2024-09-15',
    photoCount: 28,
    thumbnail: 'https://via.placeholder.com/300x200?text=야외활동',
  },
]

function YouthAlbumPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">청년부 앨범</h1>
            <p className="mt-1 text-sm text-slate-600">예배와 행사 사진들을 모아두는 공간입니다.</p>
          </div>
          <Link
            to="/user-dashboard"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← 메인으로
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockAlbums.map((album) => (
            <div
              key={album.id}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-video w-full overflow-hidden bg-slate-100">
                <img
                  src={album.thumbnail}
                  alt={album.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h2 className="text-base font-semibold text-slate-900">{album.title}</h2>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{album.date}</span>
                  <span>{album.photoCount}장</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Footer />
      </div>
    </div>
  )
}

export default YouthAlbumPage


