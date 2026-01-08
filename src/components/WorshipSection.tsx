import { useState } from 'react'

function WorshipSection() {
  const [isExpanded, setIsExpanded] = useState(false)
  const liveUrl = 'https://www.youtube.com/channel/UCJekqH69c4VTieaH4N6ErsA/live'
  const playlistUrl =
    'https://www.youtube.com/embed/videoseries?list=PL-wQhvG4IAQRsNULw0nwgHKb-FOe-nFAu'

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between"
      >
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">청년부 예배 & 말씀</h2>
        <svg
          className={`h-5 w-5 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4">
          {/* 실시간 예배 바로가기 버튼 */}
          <div className="mb-6">
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 active:bg-red-800 sm:px-6 sm:py-3 sm:text-base"
            >
              <svg
                className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              실시간 예배 바로가기
            </a>
          </div>

          {/* 유튜브 플레이어 */}
          <div className="relative w-full overflow-hidden rounded-lg bg-slate-100">
            <div className="aspect-video w-full">
              <iframe
                className="h-full w-full"
                src={playlistUrl}
                title="청년부 설교 영상"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default WorshipSection

