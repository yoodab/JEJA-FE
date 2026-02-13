import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import type { Member } from '../types/member'
import { getMembers, createMembersBatch } from '../services/memberService'
import { formatRoles, formatMemberStatus, formatGender } from '../types/member'
import { getFileUrl } from '../services/albumService'
import { updateMember } from '../services/memberService'
import * as XLSX from 'xlsx'

interface ExcelPreviewData {
  name: string
  birthDate: string
  phone: string
  gender: string
  memberStatus: string
  isDuplicate?: boolean
}

function MemberListPage() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 엑셀 업로드 미리보기 상태
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [excelPreviewData, setExcelPreviewData] = useState<ExcelPreviewData[]>([])
  const [selectedPreviewRows, setSelectedPreviewRows] = useState<Set<number>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  // 권한 수정 모달 상태
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

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

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        setIsUploading(true)
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)

        // 기존 등록된 멤버 명단 가져오기 (중복 체크용)
        const existingSet = new Set<string>()
        try {
          const response = await getMembers({ page: 0, size: 10000 })
          response.content.forEach((m) => {
            if (m.birthDate) {
              existingSet.add(`${m.name}|${m.birthDate}`)
            }
          })
        } catch (err) {
          console.error('중복 체크를 위한 명단 조회 실패:', err)
        }

        // 생년월일 정규화 (YYYY-MM-DD)
        const normalizeBirthDate = (val: unknown) => {
          if (!val) return ''
          
          // JS Date 객체인 경우 (cellDates: true 설정 시)
          if (val instanceof Date) {
            const y = val.getFullYear()
            const m = String(val.getMonth() + 1).padStart(2, '0')
            const d = String(val.getDate()).padStart(2, '0')
            return `${y}-${m}-${d}`
          }

          let str = String(val).trim().replace(/\./g, '-').replace(/\//g, '-')
          
          // YYYY-MM-DD 형식 확인
          if (str.match && str.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
            const parts = str.split('-')
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
          }

          // YY-MM-DD 형식 처리
          if (str.match && str.match(/^\d{2}-\d{1,2}-\d{1,2}$/)) {
            const parts = str.split('-')
            const year = parseInt(parts[0])
            const currentYearShort = new Date().getFullYear() % 100
            const fullYear = year > currentYearShort ? 1900 + year : 2000 + year
            return `${fullYear}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
          }

          return str
        }

        const getValue = (row: Record<string, unknown>, possibleKeys: string[]) => {
          const rowKeys = Object.keys(row)
          for (const key of possibleKeys) {
            if (row[key] !== undefined) return row[key]
            const cleanKey = key.replace(/\s/g, '')
            const matchedKey = rowKeys.find(k => k.replace(/\s/g, '') === cleanKey)
            if (matchedKey && row[matchedKey] !== undefined) return row[matchedKey]
          }
          return undefined
        }

        const parsedData: ExcelPreviewData[] = data.map((row: unknown) => {
          const r = row as Record<string, unknown>
          const name = String(getValue(r, ['이름', '성명']) || '').trim()
          const rawBirthDate = getValue(r, ['생년월일', '생일'])
          const birthDate = normalizeBirthDate(rawBirthDate)
          const phone = String(getValue(r, ['연락처', '전화번호', '휴대폰']) || '').replace(/[^0-9]/g, '')
          const genderStr = String(getValue(r, ['성별']) || '').trim()
          const gender = (genderStr === '여' || genderStr === '여성' || genderStr === 'FEMALE') ? 'FEMALE' : 'MALE'
          
          const isDuplicate = birthDate && existingSet.has(`${name}|${birthDate}`)

          return {
            name,
            birthDate,
            phone,
            gender,
            memberStatus: 'ACTIVE', // 기본값
            isDuplicate: !!isDuplicate
          }
        })

        setExcelPreviewData(parsedData)
        // 중복이 아닌 항목만 선택
        const validIndices = parsedData
          .map((n, idx) => !n.isDuplicate ? idx : -1)
          .filter(idx => idx !== -1)
        
        setSelectedPreviewRows(new Set(validIndices))
        setShowPreviewModal(true)
      } catch (error) {
        console.error('Excel upload error:', error)
        toast.error('엑셀 업로드 중 오류가 발생했습니다.')
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleSaveSelectedExcelData = async () => {
    try {
      setIsSaving(true)
      const selectedData = excelPreviewData.filter((_, idx) => selectedPreviewRows.has(idx))
      if (selectedData.length === 0) {
        toast.error('저장할 데이터가 없습니다.')
        return
      }

      await createMembersBatch(selectedData.map(d => ({
        name: d.name,
        phone: d.phone,
        birthDate: d.birthDate,
        gender: d.gender,
        memberStatus: d.memberStatus
      })))
      
      toast.success(`${selectedData.length}명의 멤버가 추가되었습니다.`)
      setShowPreviewModal(false)
      setExcelPreviewData([])
      setSelectedPreviewRows(new Set())
      fetchMembers(currentPage, pageSize, keyword)
    } catch (error) {
      console.error('Excel save error:', error)
      toast.error('데이터 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const togglePreviewRowSelection = (index: number) => {
    const newSelection = new Set(selectedPreviewRows)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      newSelection.add(index)
    }
    setSelectedPreviewRows(newSelection)
  }

  const toggleAllPreviewRows = () => {
    if (selectedPreviewRows.size === excelPreviewData.length) {
      setSelectedPreviewRows(new Set())
    } else {
      setSelectedPreviewRows(new Set(excelPreviewData.map((_, idx) => idx)))
    }
  }

  const handleExcelUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleUpdateRole = async (member: Member, newRole: string) => {
    // console.log('DEBUG: Updating role for:', member.name, 'to:', newRole)
    try {
      setIsUpdatingRole(true)
      await updateMember(member.memberId, {
        roles: [newRole]
      })
      toast.success('권한이 수정되었습니다.')
      setIsRoleModalOpen(false)
      fetchMembers(currentPage, pageSize, keyword)
    } catch (err) {
      toast.error('권한 수정에 실패했습니다.')
      console.error(err)
    } finally {
      setIsUpdatingRole(false)
    }
  }

  // console.log('DEBUG: Rendering MemberListPage, members:', members)

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            ← 
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-xl">
              👥
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">청년부 인원 관리</p>
              <p className="text-xs text-slate-500">청년부 인원 현황 (총 {totalElements}명)</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExcelUploadClick}
            disabled={isUploading}
            className="rounded-full bg-green-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
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
                              src={getFileUrl(member.memberImageUrl)}
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
                      <button
                        onClick={() => {
                          setSelectedMember(member)
                          setIsRoleModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-200 transition-colors"
                      >
                        {formatRoles(member.roles)}
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
                      </button>
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
                      {formatGender(member.gender)}
                      {/* {console.log('DEBUG: member.gender for', member.name, 'is:', member.gender)} */}
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
              {totalPages > 0 && (
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

      {/* 권한 수정 모달 */}
      {isRoleModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">권한 수정 - {selectedMember.name}</h2>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-4">수정할 권한을 선택해주세요. (임원만 설정 가능)</p>
              
              <button
                onClick={() => handleUpdateRole(selectedMember, 'MEMBER')}
                disabled={isUpdatingRole}
                className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition flex items-center justify-between ${
                  (!selectedMember.roles || selectedMember.roles.length === 0 || selectedMember.roles.includes('MEMBER'))
                    ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-2 border-transparent'
                }`}
              >
                <span>일반성도</span>
                {(!selectedMember.roles || selectedMember.roles.length === 0 || selectedMember.roles.includes('MEMBER')) && <span>✓</span>}
              </button>

              <button
                onClick={() => handleUpdateRole(selectedMember, 'EXECUTIVE')}
                disabled={isUpdatingRole}
                className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition flex items-center justify-between ${
                  selectedMember.roles?.includes('EXECUTIVE')
                    ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-2 border-transparent'
                }`}
              >
                <span>임원</span>
                {selectedMember.roles?.includes('EXECUTIVE') && <span>✓</span>}
              </button>

              <div className="mt-4 rounded-lg bg-amber-50 p-3">
                <p className="text-xs text-amber-700">
                  * 순장, 팀장 권한은 순 관리, 팀 관리 메뉴에서 해당 부여할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 엑셀 업로드 미리보기 모달 */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex h-full max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">엑셀 데이터 미리보기</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPreviewRows.size === excelPreviewData.length && excelPreviewData.length > 0}
                      onChange={toggleAllPreviewRows}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-slate-700">전체 선택 ({selectedPreviewRows.size}/{excelPreviewData.length})</span>
                  </label>
                </div>
                <div className="text-xs text-amber-600 font-medium">
                  * 빨간색 배경은 중복 의심 항목입니다.
                </div>
              </div>

              <div className="rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">선택</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">이름</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">생년월일</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">연락처</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">성별</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {excelPreviewData.map((row, idx) => (
                      <tr key={idx} className={`${row.isDuplicate ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedPreviewRows.has(idx)}
                            onChange={() => togglePreviewRowSelection(idx)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-900 font-medium">{row.name}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">{row.birthDate}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">{row.phone}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">{formatGender(row.gender)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveSelectedExcelData}
                disabled={isSaving || selectedPreviewRows.size === 0}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : `${selectedPreviewRows.size}명 저장하기`}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default MemberListPage

