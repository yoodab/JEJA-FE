import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMembers, updateMember } from '../services/memberService'
import type { Member } from '../types/member' // 경로를 types 폴더로 변경



type TabType = 'check' | 'confirmation'

function AttendanceManagePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('check')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [offering, setOffering] = useState<number>(5000)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [editStatus, setEditStatus] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // 출석 상태 관리 (날짜별로 저장)
  const [attendanceData, setAttendanceData] = useState<Record<string, Record<string, boolean>>>({})
  
  // 출석 확인 탭: 기간 필터
  const [dateRangeStart, setDateRangeStart] = useState<string>(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 6) // 6개월 전부터
    return date.toISOString().split('T')[0]
  })
  const [dateRangeEnd, setDateRangeEnd] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })
  
  // 월별 출석부 모달
  const [showMonthModal, setShowMonthModal] = useState(false)
  const [selectedMonthDate, setSelectedMonthDate] = useState<string>('')
  
  // 사람별 출석 상황 검색
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('')

  // 멤버 데이터 로드
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true)
        const allMembers = await getMembers()
        setMembers(allMembers)
        
        // 초기 출석 데이터 설정 (샘플 데이터 - 최근 6개월간의 출석 기록 생성)
        const sampleData: Record<string, Record<string, boolean>> = {}
        const today = new Date()
        
        // 멤버별 출석 패턴 설정 (더 현실적인 패턴)
        const memberAttendancePatterns = new Map<string, number>()
        allMembers.forEach((member, index) => {
          // 일부 멤버는 자주 출석 (80-90%), 일부는 가끔 출석 (40-60%), 일부는 거의 안 나옴 (10-30%)
          if (index < allMembers.length * 0.3) {
            // 상위 30%: 자주 출석
            memberAttendancePatterns.set(member.name, 0.15 + Math.random() * 0.1) // 15-25% 확률로 결석
          } else if (index < allMembers.length * 0.7) {
            // 중간 40%: 보통 출석
            memberAttendancePatterns.set(member.name, 0.4 + Math.random() * 0.2) // 40-60% 확률로 결석
          } else {
            // 하위 30%: 가끔 출석
            memberAttendancePatterns.set(member.name, 0.7 + Math.random() * 0.2) // 70-90% 확률로 결석
          }
        })
        
        // 최근 6개월간 매주 일요일 날짜 생성 (약 26주)
        for (let i = 0; i < 26; i++) {
          const date = new Date(today)
          date.setDate(date.getDate() - i * 7)
          
          // 일요일로 조정
          const dayOfWeek = date.getDay()
          date.setDate(date.getDate() - dayOfWeek)
          
          const dateStr = date.toISOString().split('T')[0]
          
          // 이미 같은 날짜가 있으면 스킵
          if (sampleData[dateStr]) continue
          
          const dateAttendance: Record<string, boolean> = {}
          
          allMembers.forEach((member) => {
            const absenceRate = memberAttendancePatterns.get(member.name) || 0.5
            // 각 멤버의 출석 패턴에 따라 출석 여부 결정
            if (Math.random() > absenceRate) {
              dateAttendance[member.name] = true
            }
          })
          
          // 최소 1명 이상 출석한 날짜만 저장
          if (Object.values(dateAttendance).some(Boolean)) {
            sampleData[dateStr] = dateAttendance
          }
        }
        
        // 특별한 날짜들도 추가 (예: 연합예배, 특별집회 등)
        const specialDates = [
          { weeksAgo: 2, isSpecial: true }, // 2주 전 특별집회
          { weeksAgo: 8, isSpecial: true }, // 8주 전 특별집회
          { weeksAgo: 15, isSpecial: true }, // 15주 전 특별집회
        ]
        
        specialDates.forEach(({ weeksAgo }) => {
          const date = new Date(today)
          date.setDate(date.getDate() - weeksAgo * 7)
          const dayOfWeek = date.getDay()
          date.setDate(date.getDate() - dayOfWeek)
          const dateStr = date.toISOString().split('T')[0]
          
          if (!sampleData[dateStr]) {
            const dateAttendance: Record<string, boolean> = {}
            // 특별집회는 출석률이 더 높음
            allMembers.forEach((member) => {
              const absenceRate = (memberAttendancePatterns.get(member.name) || 0.5) * 0.6 // 40% 더 많이 출석
              if (Math.random() > absenceRate) {
                dateAttendance[member.name] = true
              }
            })
            
            if (Object.values(dateAttendance).some(Boolean)) {
              sampleData[dateStr] = dateAttendance
            }
          }
        })
        
        setAttendanceData(sampleData)
        setSelectedDate(today.toISOString().split('T')[0])
        
        // 날짜 범위도 6개월로 조정
        const sixMonthsAgo = new Date(today)
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        setDateRangeStart(sixMonthsAgo.toISOString().split('T')[0])
      } catch (error) {
        console.error('멤버 데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }
    loadMembers()
  }, [])

  // 새신자와 장결자 필터링
  const regularMembers = members.filter(
    (m) => m.status !== '새신자' && m.status !== '장기결석'
  )
  const newcomers = members.filter((m) => m.status === '새신자')
  const longTermAbsentees = members.filter((m) => m.status === '장기결석')

  // 순 정보로 그룹화
  const membersBySoon = regularMembers.reduce((acc, member) => {
    const soonName = member.soonName || '미배정'
    if (!acc[soonName]) {
      acc[soonName] = []
    }
    acc[soonName].push(member)
    return acc
  }, {} as Record<string, Member[]>)

  const toggleAttendance = (name: string) => {
    setAttendanceData((prev) => {
      const dateData = prev[selectedDate] || {}
      return {
        ...prev,
        [selectedDate]: {
          ...dateData,
          [name]: !dateData[name],
        },
      }
    })
  }

  const getAttendanceCount = () => {
    const dateData = attendanceData[selectedDate] || {}
    return Object.values(dateData).filter(Boolean).length
  }

  // 수정 모달 열기
  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member)
    setEditStatus(member.status)
    setShowEditModal(true)
  }

  // 상태 수정 저장
  const handleSaveStatus = async () => {
    if (!editingMember) return
    
    try {
      await updateMember(editingMember.memberId, { status: editStatus })
      setMembers((prev) =>
        prev.map((m) =>
          m.memberId === editingMember.memberId ? { ...m, status: editStatus } : m
        )
      )
      setShowEditModal(false)
      setEditingMember(null)
    } catch (error) {
      console.error('상태 수정 실패:', error)
      alert('상태 수정에 실패했습니다.')
    }
  }

  // 출석 데이터 저장
  const handleSaveAttendance = async () => {
    const dateData = attendanceData[selectedDate] || {}
    const attendanceCount = Object.values(dateData).filter(Boolean).length

    if (attendanceCount === 0) {
      setSaveMessage({ type: 'error', text: '출석 인원이 없습니다. 최소 1명 이상 출석 체크해주세요.' })
      setTimeout(() => setSaveMessage(null), 3000)
      return
    }

    setIsSaving(true)
    setSaveMessage(null)

    try {
      // TODO: 실제 API 호출로 변경 필요
      // 예: await saveAttendanceData(selectedDate, dateData, offering)
      
      // 임시: 로컬 상태에 저장 (이미 상태에 있음)
      // 실제로는 API를 통해 서버에 저장해야 함
      await new Promise((resolve) => setTimeout(resolve, 500)) // API 호출 시뮬레이션

      setSaveMessage({
        type: 'success',
        text: `${new Date(selectedDate).toLocaleDateString('ko-KR')} 출석 기록이 저장되었습니다. (출석: ${attendanceCount}명, 헌금: ₩${offering.toLocaleString()})`,
      })
      setTimeout(() => setSaveMessage(null), 5000)
    } catch (error) {
      console.error('출석 저장 실패:', error)
      setSaveMessage({
        type: 'error',
        text: '출석 저장에 실패했습니다. 다시 시도해주세요.',
      })
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // 그리드 레이아웃을 위한 데이터 구성 (10열: 8개 일반 + 새신자 + 장결자)
  const columnsPerRow = 8
  const allRegularMembers = regularMembers.map((m) => m.name)
  const memberRows: Array<{ members: string[]; newcomer?: string; absentee?: string }> = []
  
  const newcomerNames = newcomers.map((m) => m.name)
  const absenteeNames = longTermAbsentees.map((m) => m.name)
  
  // 일반 멤버를 8열씩 행으로 구성하고, 각 행에 새신자/장결자도 함께 배치
  for (let i = 0; i < allRegularMembers.length; i += columnsPerRow) {
    const row = allRegularMembers.slice(i, i + columnsPerRow)
    while (row.length < 8) {
      row.push('')
    }
    
    const rowIndex = Math.floor(i / columnsPerRow)
    memberRows.push({
      members: row,
      newcomer: newcomerNames[rowIndex] || undefined,
      absentee: absenteeNames[rowIndex] || undefined,
    })
  }
  
  // 남은 새신자/장결자가 있으면 추가 행 생성
  const maxRows = Math.max(memberRows.length, Math.ceil(newcomerNames.length), Math.ceil(absenteeNames.length))
  for (let i = memberRows.length; i < maxRows; i++) {
    memberRows.push({
      members: Array(8).fill(''),
      newcomer: newcomerNames[i] || undefined,
      absentee: absenteeNames[i] || undefined,
    })
  }

  // 출석 기록이 있는 날짜 목록 가져오기 (기간 필터 적용)
  const getAttendanceDatesInRange = () => {
    const dates = Object.keys(attendanceData)
      .filter((date) => {
        const dateObj = new Date(date)
        const startObj = new Date(dateRangeStart)
        const endObj = new Date(dateRangeEnd)
        endObj.setHours(23, 59, 59, 999) // 종료일 포함
        
        return dateObj >= startObj && dateObj <= endObj
      })
      .filter((date) => {
        // 출석 기록이 실제로 있는 날짜만 (최소 1명 이상 출석)
        const dateData = attendanceData[date] || {}
        return Object.values(dateData).some(Boolean)
      })
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    
    return dates
  }

  // 출석 확인 탭: 전체 출석 동향 계산
  const getAttendanceTrend = () => {
    const dates = getAttendanceDatesInRange()
    return dates.map((date) => {
      const dateData = attendanceData[date] || {}
      return {
        date,
        count: Object.values(dateData).filter(Boolean).length,
      }
    })
  }

  // 출석 확인 탭: 사람별 출석 상황
  const getMemberAttendanceStatus = () => {
    const dates = getAttendanceDatesInRange()
    return members.map((member) => {
      const attendanceCount = dates.filter((date) => {
        const dateData = attendanceData[date] || {}
        return dateData[member.name] === true
      }).length
      
      const attendanceRate = dates.length > 0 
        ? Math.round((attendanceCount / dates.length) * 100) 
        : 0

      return {
        member,
        attendanceCount,
        attendanceRate,
        dates: dates.map((date) => {
          const dateData = attendanceData[date] || {}
          return {
            date,
            present: dateData[member.name] === true,
          }
        }),
      }
    })
  }

  // 선택한 날짜의 월에 해당하는 모든 출석 날짜 가져오기
  const getMonthAttendanceDates = (selectedDate: string) => {
    const dateObj = new Date(selectedDate)
    const year = dateObj.getFullYear()
    const month = dateObj.getMonth()
    
    return Object.keys(attendanceData)
      .filter((date) => {
        const d = new Date(date)
        return d.getFullYear() === year && d.getMonth() === month
      })
      .filter((date) => {
        const dateData = attendanceData[date] || {}
        return Object.values(dateData).some(Boolean)
      })
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  }

  // 날짜 클릭 핸들러
  const handleDateClick = (date: string) => {
    setSelectedMonthDate(date)
    setShowMonthModal(true)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* 헤더 */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              ← 돌아가기
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-xl">
                ✅
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">출석 관리</p>
                <p className="text-xs text-slate-500">주일 및 순 출석 체크</p>
              </div>
            </div>
          </div>
          {activeTab === 'check' && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-500">출석 인원</p>
                <p className="text-lg font-bold text-slate-900">{getAttendanceCount()}명</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">헌금</p>
                <input
                  type="number"
                  value={offering}
                  onChange={(e) => setOffering(Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm text-right"
                />
              </div>
            </div>
          )}
        </header>

        {/* 탭 전환 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('check')}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'check'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              출석 체크
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('confirmation')}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'confirmation'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              출석 확인
            </button>
          </div>
        </div>

        {/* 출석 체크 탭 */}
        {activeTab === 'check' && (
          <>
            {/* 날짜 선택 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-slate-700">날짜 선택:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSaveAttendance}
                    disabled={isSaving}
                    className="ml-auto rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    새신자/장결자 수정
                  </button>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <div className="h-4 w-4 rounded border-2 border-slate-300 bg-white" />
                      미출석
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="h-4 w-4 rounded border-2 border-blue-600 bg-blue-600" />
                      출석
                    </span>
                  </div>
                </div>
                {/* 저장 메시지 */}
                {saveMessage && (
                  <div
                    className={`rounded-lg px-4 py-2 text-sm ${
                      saveMessage.type === 'success'
                        ? 'bg-green-50 text-green-800'
                        : 'bg-red-50 text-red-800'
                    }`}
                  >
                    {saveMessage.text}
                  </div>
                )}
              </div>
            </div>

            {/* 순 정보 표시 */}
            {Object.keys(membersBySoon).length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">순 정보</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(membersBySoon).map(([soonName, soonMembers]) => (
                    <div
                      key={soonName}
                      className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs"
                    >
                      <span className="font-semibold text-slate-700">{soonName}:</span>
                      <span className="ml-1 text-slate-600">{(soonMembers as Member[]).length}명</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 출석부 표 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 text-center">
                <h2 className="text-lg font-bold text-slate-900">청년부 주일 출석부</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {new Date(selectedDate).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {Array.from({ length: 8 }, (_, i) => (
                        <th
                          key={i}
                          className="border border-slate-300 bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-700"
                        >
                          {i + 1}
                        </th>
                      ))}
                      <th className="border border-slate-300 bg-slate-100 px-2 py-2 text-center text-xs font-semibold text-slate-700">
                        새신자
                      </th>
                      <th className="border border-slate-300 bg-slate-100 px-2 py-2 text-center text-xs font-semibold text-slate-700">
                        장결자
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 일반 멤버 행들 (새신자/장결자 포함) */}
                    {memberRows.map((rowData, rowIndex) => {
                      const dateData = attendanceData[selectedDate] || {}
                      
                      return (
                        <tr key={`row-${rowIndex}`}>
                          {/* 일반 멤버 열들 (8개) */}
                          {rowData.members.map((name, colIndex) => {
                            const isChecked = name ? dateData[name] === true : false

                            return (
                              <td
                                key={colIndex}
                                className="border border-slate-300 px-2 py-2 text-center"
                              >
                                {name ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleAttendance(name)}
                                    className={`inline-flex h-8 w-full items-center justify-center rounded border-2 transition hover:opacity-80 ${
                                      isChecked
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-slate-300 bg-white text-slate-700'
                                    }`}
                                  >
                                    <span className="text-xs">{name}</span>
                                  </button>
                                ) : (
                                  <div className="h-8" />
                                )}
                              </td>
                            )
                          })}
                          
                          {/* 새신자 열 (colIndex 8) */}
                          <td className="border border-slate-300 bg-slate-50 px-2 py-2 text-center">
                            {rowData.newcomer ? (
                              <button
                                type="button"
                                onClick={() => toggleAttendance(rowData.newcomer!)}
                                className={`inline-flex h-8 w-full items-center justify-center rounded border-2 transition hover:opacity-80 ${
                                  dateData[rowData.newcomer] === true
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-slate-300 bg-white text-slate-700'
                                }`}
                              >
                                <span className="text-xs">{rowData.newcomer}</span>
                              </button>
                            ) : (
                              <div className="h-8" />
                            )}
                          </td>
                          
                          {/* 장결자 열 (colIndex 9) */}
                          <td className="border border-slate-300 bg-slate-50 px-2 py-2 text-center">
                            {rowData.absentee ? (
                              <button
                                type="button"
                                onClick={() => toggleAttendance(rowData.absentee!)}
                                className={`inline-flex h-8 w-full items-center justify-center rounded border-2 transition hover:opacity-80 ${
                                  dateData[rowData.absentee] === true
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-slate-300 bg-white text-slate-700'
                                }`}
                              >
                                <span className="text-xs">{rowData.absentee}</span>
                              </button>
                            ) : (
                              <div className="h-8" />
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* 통계 요약 */}
              <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-slate-50 p-4">
                <div className="text-center">
                  <p className="text-xs text-slate-500">총 출석</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{getAttendanceCount()}명</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">새신자</p>
                  <p className="mt-1 text-xl font-bold text-blue-600">{newcomers.length}명</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">장기결석자</p>
                  <p className="mt-1 text-xl font-bold text-rose-600">{longTermAbsentees.length}명</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 출석 확인 탭 */}
        {activeTab === 'confirmation' && (
          <div className="space-y-6">
            {/* 기간 필터 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-slate-700">기간 설정:</label>
                  <input
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <span className="text-sm text-slate-600">~</span>
                  <input
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="ml-auto text-xs text-slate-500">
                  출석 기록이 있는 날짜만 표시됩니다
                </div>
              </div>
            </div>

            {/* 전체 출석 동향 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-900">전체 출석 동향</h2>
              {getAttendanceTrend().length > 0 ? (
                <div>
                  {/* 꺽은선 그래프 */}
                  <div className="relative h-80 w-full">
                    <svg
                      className="h-full w-full"
                      viewBox={`0 0 ${Math.max(getAttendanceTrend().length * 60, 800)} 300`}
                      preserveAspectRatio="none"
                    >
                      {/* 그리드 라인 */}
                      <defs>
                        <pattern
                          id="grid"
                          width="60"
                          height="30"
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d="M 60 0 L 0 0 0 30"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="1"
                          />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />

                      {/* Y축 레이블 */}
                      {(() => {
                        const trends = getAttendanceTrend()
                        const maxCount = Math.max(...trends.map((t) => t.count), 1)
                        const yAxisSteps = 5
                        const stepValue = Math.ceil(maxCount / yAxisSteps)
                        const labels = []

                        for (let i = 0; i <= yAxisSteps; i++) {
                          const value = stepValue * i
                          const y = 280 - (value / maxCount) * 250
                          labels.push(
                            <g key={i}>
                              <line
                                x1="0"
                                y1={y}
                                x2="100%"
                                y2={y}
                                stroke="#cbd5e1"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                              />
                              <text
                                x="10"
                                y={y + 4}
                                fontSize="12"
                                fill="#64748b"
                                textAnchor="start"
                              >
                                {value}명
                              </text>
                            </g>
                          )
                        }
                        return labels
                      })()}

                      {/* 꺽은선 그래프 */}
                      {(() => {
                        const trends = getAttendanceTrend()
                        const maxCount = Math.max(...trends.map((t) => t.count), 1)
                        const points: string[] = []
                        const circles: React.ReactElement[] = []

                        trends.forEach((trend, index) => {
                          const x = 50 + index * 60
                          const y = 280 - (trend.count / maxCount) * 250
                          points.push(`${x},${y}`)

                          circles.push(
                            <g key={`point-${index}`}>
                              <circle
                                cx={x}
                                cy={y}
                                r="6"
                                fill="#3b82f6"
                                className="cursor-pointer transition hover:r-8"
                                onClick={() => handleDateClick(trend.date)}
                              />
                              <circle
                                cx={x}
                                cy={y}
                                r="3"
                                fill="white"
                              />
                              {/* 호버 시 툴팁 */}
                              <title>
                                {new Date(trend.date).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  weekday: 'short',
                                })}
                                {'\n'}
                                출석: {trend.count}명 ({Math.round((trend.count / members.length) * 100)}%)
                              </title>
                            </g>
                          )
                        })

                        const pathData = `M ${points.join(' L ')}`

                        return (
                          <>
                            {/* 영역 채우기 */}
                            <path
                              d={`${pathData} L ${50 + (trends.length - 1) * 60},280 L 50,280 Z`}
                              fill="url(#gradient)"
                              opacity="0.2"
                            />
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                              </linearGradient>
                            </defs>
                            {/* 꺽은선 */}
                            <path
                              d={pathData}
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            {/* 점들 */}
                            {circles}
                          </>
                        )
                      })()}

                      {/* X축 레이블 */}
                      {getAttendanceTrend().map((trend, index) => {
                        const x = 50 + index * 60
                        return (
                          <g key={`label-${index}`}>
                            <text
                              x={x}
                              y="295"
                              fontSize="10"
                              fill="#64748b"
                              textAnchor="middle"
                              transform={`rotate(-45 ${x} 295)`}
                            >
                              {new Date(trend.date).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </text>
                          </g>
                        )
                      })}
                    </svg>
                  </div>

                  {/* 날짜별 상세 정보 (클릭 가능한 리스트) */}
                  <div className="mt-6 space-y-2">
                    <h3 className="text-sm font-semibold text-slate-700">날짜별 상세 정보</h3>
                    <div className="max-h-60 space-y-1 overflow-y-auto">
                      {getAttendanceTrend().map((trend) => {
                        const maxCount = Math.max(...getAttendanceTrend().map((t) => t.count), 1)
                        return (
                          <button
                            key={trend.date}
                            type="button"
                            onClick={() => handleDateClick(trend.date)}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-32 text-xs font-medium text-slate-700">
                                {new Date(trend.date).toLocaleDateString('ko-KR', {
                                  month: 'long',
                                  day: 'numeric',
                                  weekday: 'short',
                                })}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200">
                                  <div
                                    className="h-full bg-blue-600"
                                    style={{
                                      width: `${(trend.count / maxCount) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-slate-900">
                                  {trend.count}명
                                </span>
                                <span className="text-xs text-slate-500">
                                  ({Math.round((trend.count / members.length) * 100)}%)
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-slate-400">클릭하여 상세보기</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-slate-500">선택한 기간에 출석 기록이 없습니다.</p>
                </div>
              )}
            </div>

            {/* 사람별 출석 상황 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">사람별 출석 상황</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="이름으로 검색..."
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  {memberSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMemberSearchQuery('')}
                      className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {getMemberAttendanceStatus()
                  .filter((status) => {
                    if (!memberSearchQuery.trim()) return true
                    const query = memberSearchQuery.toLowerCase().trim()
                    return (
                      status.member.name.toLowerCase().includes(query) ||
                      (status.member.soonName && status.member.soonName.toLowerCase().includes(query))
                    )
                  })
                  .sort((a, b) => b.attendanceRate - a.attendanceRate)
                  .map((status) => (
                    <div
                      key={status.member.memberId}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            {status.member.name}
                          </h3>
                          {status.member.soonName && (
                            <p className="mt-1 text-xs text-slate-500">{status.member.soonName}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-lg font-bold ${
                              status.attendanceRate >= 80
                                ? 'text-green-600'
                                : status.attendanceRate >= 50
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {status.attendanceRate}%
                          </div>
                          <div className="text-xs text-slate-500">출석률</div>
                        </div>
                      </div>

                      <div className="mb-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">출석 횟수</span>
                          <span className="font-semibold text-slate-900">
                            {status.attendanceCount}회
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">전체 기간</span>
                          <span className="font-semibold text-slate-900">
                            {status.dates.length}일
                          </span>
                        </div>
                      </div>

                      {/* 출석 현황 미니 차트 */}
                      <div className="mt-4 rounded-lg bg-slate-50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-600">출석 현황</span>
                          <span className="text-xs text-slate-500">
                            {status.attendanceCount}/{status.dates.length}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {status.dates.map((d, idx) => (
                            <div
                              key={idx}
                              className={`h-5 w-5 rounded ${
                                d.present
                                  ? 'bg-green-500 ring-1 ring-green-600'
                                  : 'bg-slate-200'
                              }`}
                              title={`${new Date(d.date).toLocaleDateString('ko-KR')}: ${
                                d.present ? '출석' : '미출석'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* 출석률 진행 바 */}
                      <div className="mt-3">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full transition-all ${
                              status.attendanceRate >= 80
                                ? 'bg-green-500'
                                : status.attendanceRate >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${status.attendanceRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              {getMemberAttendanceStatus().filter((status) => {
                if (!memberSearchQuery.trim()) return false
                const query = memberSearchQuery.toLowerCase().trim()
                return (
                  status.member.name.toLowerCase().includes(query) ||
                  (status.member.soonName && status.member.soonName.toLowerCase().includes(query))
                )
              }).length === 0 && memberSearchQuery && (
                <div className="py-12 text-center">
                  <p className="text-slate-500">
                    &quot;{memberSearchQuery}&quot;에 해당하는 멤버를 찾을 수 없습니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 월별 출석부 모달 */}
        {showMonthModal && selectedMonthDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="w-full max-w-6xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-lg flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {new Date(selectedMonthDate).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                  })}{' '}
                  출석부
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowMonthModal(false)
                    setSelectedMonthDate('')
                  }}
                  className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {getMonthAttendanceDates(selectedMonthDate).map((date) => {
                    const dateData = attendanceData[date] || {}
                    const attendanceCount = Object.values(dateData).filter(Boolean).length
                    const presentMembers = members.filter(
                      (m) => dateData[m.name] === true
                    )

                    return (
                      <div
                        key={date}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-base font-semibold text-slate-900">
                            {new Date(date).toLocaleDateString('ko-KR', {
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long',
                            })}
                          </h4>
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                            {attendanceCount}명 출석
                          </span>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                          {presentMembers.map((member) => (
                            <div
                              key={member.memberId}
                              className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2"
                            >
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              <span className="text-sm text-slate-900">{member.name}</span>
                              {member.soonName && (
                                <span className="text-xs text-slate-500">
                                  ({member.soonName})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 새신자/장결자 수정 모달 */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">새신자/장결자 수정</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingMember(null)
                  }}
                  className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* 새신자 목록 */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-700">새신자</h4>
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                    {newcomers.length > 0 ? (
                      newcomers.map((member) => (
                        <div
                          key={member.memberId}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                        >
                          <span className="text-sm text-slate-900">{member.name}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(member)}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            수정
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-xs text-slate-400">새신자가 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 장결자 목록 */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-700">장기결석자</h4>
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                    {longTermAbsentees.length > 0 ? (
                      longTermAbsentees.map((member) => (
                        <div
                          key={member.memberId}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                        >
                          <span className="text-sm text-slate-900">{member.name}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(member)}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            수정
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-xs text-slate-400">장기결석자가 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 개별 수정 모달 */}
              {editingMember && (
                <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-700">
                    {editingMember.name} 상태 수정
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        상태 선택
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="재적">재적</option>
                        <option value="새신자">새신자</option>
                        <option value="장기결석">장기결석</option>
                        <option value="휴먼">휴먼</option>
                        <option value="퇴회">퇴회</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMember(null)
                          setEditStatus('')
                        }}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveStatus}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AttendanceManagePage
