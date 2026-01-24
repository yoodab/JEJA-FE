import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Member } from '../types/member'
import { getMembers, uploadMembersFromExcel } from '../services/memberService'
import { formatRoles, formatMemberStatus } from '../types/member'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

function MemberListPage() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMembers = async (page: number, size: number, searchKeyword?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getMembers({
        page,
        size,
        ...(searchKeyword && { keyword: searchKeyword }),
      })
      setMembers(response.content)
      setTotalPages(response.totalPages)
      setTotalElements(response.totalElements)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '멤버 목록을 불러오는데 실패했습니다.'
      setError(errorMessage)
      console.error('Failed to fetch members:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers(currentPage, pageSize, keyword)
  }, [currentPage, pageSize, keyword])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(0) // 검색 시 첫 페이지로 (useEffect가 자동으로 fetchMembers 호출)
  }

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 엑셀 파일인지 확인
    const validExtensions = ['.xlsx', '.xls']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!validExtensions.includes(fileExtension)) {
      alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.')
      e.target.value = '' // 파일 선택 초기화
      return
    }

    try {
      setIsUploading(true)
      await uploadMembersFromExcel(file)
      alert('엑셀 업로드가 완료되었습니다.')
      // 파일 선택 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      // 멤버 목록 새로고침
      fetchMembers(currentPage, pageSize, keyword)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '엑셀 업로드에 실패했습니다.'
      alert(errorMessage)
      console.error('Failed to upload Excel:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleExcelUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">청년부 인원 관리</h1>
          <p className="mt-1 text-sm text-slate-600">
            청년부 인원 현황을 확인하고 관리하세요. (총 {totalElements}명)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExcelUploadClick}
            disabled={isUploading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? '업로드 중...' : '엑셀 업로드'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => navigate('/manage/members')}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            신규 등록
          </button>
        </div>
      </header>

      {/* 검색 바 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="이름으로 검색..."
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          검색
        </button>
        {keyword && (
          <button
            type="button"
            onClick={() => {
              setKeyword('')
              setCurrentPage(0)
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            초기화
          </button>
        )}
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">로딩 중...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {members.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-slate-500">등록된 멤버가 없습니다.</p>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-20">
                      사진
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      이름
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      역할
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      연락처
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      성별
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      나이
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      계정
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((member) => (
                    <tr key={member.memberId} className="hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200 flex items-center justify-center">
                          {member.memberImageUrl ? (
                            <img
                              src={`${API_BASE_URL}${member.memberImageUrl}`}
                              alt={member.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <svg className="h-6 w-6 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {member.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          {formatRoles(member.roles)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {formatMemberStatus(member.memberStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {member.phone || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {member.gender || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {member.age || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {member.hasAccount ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                            있음
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                            없음
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      페이지 {currentPage + 1} / {totalPages} (총 {totalElements}개)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number
                          if (totalPages <= 5) {
                            pageNum = i
                          } else if (currentPage < 3) {
                            pageNum = i
                          } else if (currentPage > totalPages - 4) {
                            pageNum = totalPages - 5 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }

                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {pageNum + 1}
                            </button>
                          )
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage === totalPages - 1}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default MemberListPage

