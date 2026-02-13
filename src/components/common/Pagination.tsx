import React from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalElements?: number
  pageSize?: number
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalElements,
  pageSize,
}) => {
  if (totalPages <= 0) return null

  const MAX_VISIBLE_PAGES = 5
  let startPage = 0
  let endPage = totalPages - 1

  if (totalPages > MAX_VISIBLE_PAGES) {
    const half = Math.floor(MAX_VISIBLE_PAGES / 2)
    startPage = Math.max(0, currentPage - half)
    endPage = startPage + MAX_VISIBLE_PAGES - 1

    if (endPage >= totalPages) {
      endPage = totalPages - 1
      startPage = Math.max(0, endPage - MAX_VISIBLE_PAGES + 1)
    }
  }

  const pages = []
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 mt-4">
      {totalElements !== undefined && pageSize !== undefined && (
        <div className="text-sm text-slate-600 text-center sm:text-left">
          전체 {totalElements}개 중 {(totalElements === 0 ? 0 : currentPage * pageSize + 1)}-{Math.min((currentPage + 1) * pageSize, totalElements)}개 표시
        </div>
      )}
      <div className={`flex justify-center gap-2 ${totalElements === undefined ? 'w-full' : ''}`}>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          이전
        </button>
        <div className="flex items-center gap-1">
          {pages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {page + 1}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </div>
    </div>
  )
}

export default Pagination
