import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import { useState } from 'react'

const mockSlides = [
  { id: 1, url: 'https://via.placeholder.com/600x260?text=슬라이드+1' },
  { id: 2, url: 'https://via.placeholder.com/600x260?text=슬라이드+2' },
  { id: 3, url: 'https://via.placeholder.com/600x260?text=슬라이드+3' },
]

function HomepageManagePage() {
  const [slides, setSlides] = useState(mockSlides)

  // 더미 삭제 기능
  const handleRemove = (id: number) => {
    setSlides(slides.filter(slide => slide.id !== id))
  }

  // 실제 이미지는 FileUploader 또는 Back 연동 시 구현 -> 임시 input
  const handleDummyAdd = () => {
    setSlides([
      ...slides,
      { id: Date.now(), url: `https://via.placeholder.com/600x260?text=New+${Date.now()}` },
    ])
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <UserHeader />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">홈페이지 슬라이드 관리</h1>
            <p className="mt-1 text-sm text-slate-600">메인 사진슬라이드 이미지를 직접 관리하세요.</p>
          </div>
        </div>
        <div className="space-y-4">
          <button
            onClick={handleDummyAdd}
            className="mb-2 rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            + 이미지 추가 (임시)
          </button>
          <div className="grid gap-4 sm:grid-cols-2">
            {slides.map((slide) => (
              <div key={slide.id} className="relative rounded-xl border border-slate-200 bg-white shadow-sm">
                <img
                  src={slide.url}
                  alt={slide.url}
                  className="aspect-video h-full w-full rounded-t-xl object-cover"
                />
                <button
                  className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-700"
                  onClick={() => handleRemove(slide.id)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  )
}

export default HomepageManagePage


