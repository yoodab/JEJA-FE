import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  getAttendanceSheet,
} from '../services/attendanceService'
import { getMembers } from '../services/memberService'
import { scheduleService } from '../services/scheduleService'
import type { Schedule } from '../types/schedule'
import type { Member } from '../types/member'

interface Group {
  id: number
  name: string
  members: Member[]
}

interface FormationSettings {
  groupCount: number
  method: 'random' | 'age'
  considerGender: boolean
}

function GroupFormationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // --- 1. Schedule & Data State ---
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return searchParams.get('date') || new Date().toISOString().split('T')[0]
  })
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([])
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null)
  const [schedulesLoading, setSchedulesLoading] = useState(false)
  
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // --- 2. Selection State ---
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set())

  // --- 3. Formation State ---
  const [groups, setGroups] = useState<Group[]>([])
  const [settings, setSettings] = useState<FormationSettings>({
    groupCount: 4,
    method: 'random',
    considerGender: true
  })
  const [showLargeView, setShowLargeView] = useState(false)
  // const [showResultModal, setShowResultModal] = useState(false) // Removed modal state

  // --- Load Schedules ---
  useEffect(() => {
    let cancelled = false
    const loadSchedules = async () => {
      setSchedulesLoading(true)
      try {
        const date = new Date(selectedDate)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const data = await scheduleService.getSchedules(year, month)
        if (cancelled) return
        setAllSchedules(data)
        
        const filtered = data.filter(
          (schedule) => schedule.startDate.slice(0, 10) === selectedDate,
        )
        
        const paramScheduleId = searchParams.get('scheduleId')
        const targetId = paramScheduleId ? Number(paramScheduleId) : null

        setSelectedScheduleId((prev) => {
          if (targetId && filtered.some((s) => s.scheduleId === targetId)) return targetId
          if (prev && filtered.some((s) => s.scheduleId === prev)) return prev
          return filtered.length > 0 ? filtered[0].scheduleId : null
        })
      } catch (error) {
        if (!cancelled) console.error(error)
      } finally {
        if (!cancelled) setSchedulesLoading(false)
      }
    }
    loadSchedules()
    return () => { cancelled = true }
  }, [selectedDate, searchParams])

  // --- Load Members & Attendance ---
  const loadData = useCallback(async (scheduleId: number | null, dateStr: string) => {
    setDataLoading(true)
    try {
      // 1. Load All Members (always)
      const membersPage = await getMembers({ page: 0, size: 2000, sort: 'name,asc' })
      setAllMembers(membersPage.content)

      // 2. Load Attendance Sheet for selection if scheduleId exists
      if (scheduleId) {
        const sheet = await getAttendanceSheet(scheduleId, dateStr).catch(() => null)
        
        // Set selected members based on attendance
        const attendedIds = new Set<number>()
        if (sheet?.records) {
          sheet.records.forEach((record) => {
            if (record.attended) {
              attendedIds.add(record.memberId)
            }
          })
        }
        setSelectedMemberIds(attendedIds)
      } else {
        // If no schedule, we don't clear selectedMemberIds automatically 
        // because user might want to manually select.
        // But if they just switched to a date with no schedule, 
        // maybe they expect a fresh state? 
        // The previous behavior was clearing allMembers, so clearing selection seems consistent.
        setSelectedMemberIds(new Set())
      }

    } catch (error) {
      console.error(error)
      toast.error('데이터를 불러오는데 실패했습니다.')
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(selectedScheduleId, selectedDate)
  }, [selectedScheduleId, selectedDate, loadData])


  // --- Helper: Map for fast lookup ---
  const allMembersMap = useMemo(() => {
    const map = new Map<number, Member>()
    allMembers.forEach(m => map.set(m.memberId, m))
    return map
  }, [allMembers])

  // --- Filtered Members ---
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return allMembers
    return allMembers.filter(m => m.name.includes(searchTerm))
  }, [allMembers, searchTerm])

  // --- Actions ---
  const toggleMemberSelection = (memberId: number) => {
    setSelectedMemberIds(prev => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  const selectAll = () => {
    const newSet = new Set<number>()
    allMembers.forEach(m => newSet.add(m.memberId))
    setSelectedMemberIds(newSet)
  }

  const deselectAll = () => setSelectedMemberIds(new Set())

  // --- Formation Logic ---
  const formGroups = () => {
    if (selectedMemberIds.size === 0) {
      toast.error('최소 1명 이상의 인원을 선택해주세요.')
      return
    }
    if (selectedMemberIds.size < settings.groupCount) {
      toast.error('선택한 인원 수가 조 개수보다 적습니다.')
      return
    }

    const selectedMembers = Array.from(selectedMemberIds)
      .map(id => allMembersMap.get(id))
      .filter((m): m is Member => !!m)

    const newGroups: Group[] = []

    // Normalize gender/age
    const normalizedMembers = selectedMembers.map(m => ({
      ...m,
      genderCode: (m.gender === 'MALE' || m.gender === 'M' || m.gender === '남자') ? 'M' : (m.gender === 'FEMALE' || m.gender === 'F' || m.gender === '여자') ? 'F' : 'U',
      sortAge: m.age || 20
    }))

    // Initialize groups
    for (let i = 0; i < settings.groupCount; i++) {
      newGroups.push({ id: i + 1, name: `${i + 1}조`, members: [] })
    }

    if (settings.method === 'random') {
      const shuffled = [...normalizedMembers].sort(() => Math.random() - 0.5)
      
      if (settings.considerGender) {
        const males = shuffled.filter(m => m.genderCode === 'M')
        const females = shuffled.filter(m => m.genderCode === 'F')
        const others = shuffled.filter(m => m.genderCode === 'U')

        let gIdx = 0
        // Distribute Males
        males.forEach(m => {
          newGroups[gIdx].members.push(m)
          gIdx = (gIdx + 1) % settings.groupCount
        })
        // Distribute Females
        females.forEach(m => {
          newGroups[gIdx].members.push(m)
          gIdx = (gIdx + 1) % settings.groupCount
        })
        // Distribute Others
        others.forEach(m => {
          newGroups[gIdx].members.push(m)
          gIdx = (gIdx + 1) % settings.groupCount
        })
      } else {
        shuffled.forEach((m, idx) => {
          newGroups[idx % settings.groupCount].members.push(m)
        })
      }
    } else {
      // Age Sort
      const sorted = [...normalizedMembers].sort((a, b) => b.sortAge - a.sortAge)
      
      if (settings.considerGender) {
        const males = sorted.filter(m => m.genderCode === 'M')
        const females = sorted.filter(m => m.genderCode === 'F')
        const others = sorted.filter(m => m.genderCode === 'U')

        let gIdx = 0
        males.forEach(m => {
          newGroups[gIdx].members.push(m)
          gIdx = (gIdx + 1) % settings.groupCount
        })
        females.forEach(m => {
          newGroups[gIdx].members.push(m)
          gIdx = (gIdx + 1) % settings.groupCount
        })
        others.forEach(m => {
          newGroups[gIdx].members.push(m)
          gIdx = (gIdx + 1) % settings.groupCount
        })
      } else {
        sorted.forEach((m, idx) => {
          newGroups[idx % settings.groupCount].members.push(m)
        })
      }
    }

    setGroups(newGroups)
    // setShowResultModal(true)
  }

  // Stats
  const selectedList = Array.from(selectedMemberIds).map(id => allMembersMap.get(id)).filter(Boolean)
  const selectedMaleCount = selectedList.filter(m => m?.gender === 'MALE' || m?.gender === 'M' || m?.gender === '남자').length
  const selectedFemaleCount = selectedList.filter(m => m?.gender === 'FEMALE' || m?.gender === 'F' || m?.gender === '여자').length

  return (
    <div className="min-h-screen bg-slate-50 px-2 py-4 text-slate-900 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-[1800px] space-y-4">
        
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              ←
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-lg">
                🔀
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">조 편성</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <select
              value={selectedScheduleId || ''}
              onChange={(e) => setSelectedScheduleId(Number(e.target.value))}
              className="max-w-[200px] rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none"
            >
              {schedulesLoading ? (
                <option>로딩 중...</option>
              ) : allSchedules.filter(s => s.startDate.slice(0, 10) === selectedDate).length === 0 ? (
                <option value="">일정 없음</option>
              ) : (
                allSchedules.filter(s => s.startDate.slice(0, 10) === selectedDate).map((s) => (
                  <option key={s.scheduleId} value={s.scheduleId}>
                    {s.title}
                  </option>
                ))
              )}
            </select>
          </div>
        </header>

        {/* Control Bar */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          {/* Top: Formation Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
             <div className="flex items-center gap-2">
               <span className="text-sm font-bold text-slate-800">조 편성 설정</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-slate-700">조 개수</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.groupCount}
                    onChange={(e) => setSettings(prev => ({ ...prev, groupCount: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-12 rounded border border-slate-300 px-1 py-1 text-sm text-center"
                  />
                </div>
                
                <div className="flex rounded bg-slate-100 p-0.5">
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, method: 'random' }))}
                    className={`rounded px-2 py-1 text-xs font-medium transition ${settings.method === 'random' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    랜덤
                  </button>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, method: 'age' }))}
                    className={`rounded px-2 py-1 text-xs font-medium transition ${settings.method === 'age' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    나이
                  </button>
                </div>

                <button
                  onClick={() => setSettings(prev => ({ ...prev, considerGender: !prev.considerGender }))}
                  className={`rounded px-2 py-1 text-xs font-medium border transition ${settings.considerGender ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}`}
                >
                  성별 {settings.considerGender ? 'ON' : 'OFF'}
                </button>

                <button
                  onClick={formGroups}
                  className="ml-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  편성
                </button>
             </div>
          </div>

          {/* Bottom: Selection & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-slate-700">
                선택: <span className="text-emerald-600 font-bold">{selectedMemberIds.size}</span>
                <span className="ml-1 text-slate-500 text-xs">
                  (남{selectedMaleCount}/여{selectedFemaleCount})
                </span>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex gap-1">
                <button onClick={selectAll} className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded">전체</button>
                <button onClick={deselectAll} className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded">해제</button>
              </div>
            </div>

            <div className="flex items-center gap-2">
               <span className="text-xs text-slate-500">🔍</span>
               <input
                 type="text"
                 placeholder="이름 검색"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-32 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none"
               />
            </div>
          </div>
        </div>

        {/* Main Grid - Compact View */}
        <div className="relative w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm min-h-[500px]">
            {dataLoading ? (
              <div className="flex h-full items-center justify-center py-20">
                <div className="text-slate-500">데이터를 불러오는 중입니다...</div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12">
                {filteredMembers.map(member => {
                  const isSelected = selectedMemberIds.has(member.memberId)
                  const isMale = member.gender === 'MALE' || member.gender === 'M' || member.gender === '남자'
                  const isFemale = member.gender === 'FEMALE' || member.gender === 'F' || member.gender === '여자'
                  
                  return (
                    <div
                      key={member.memberId}
                      onClick={() => toggleMemberSelection(member.memberId)}
                      className={`cursor-pointer select-none rounded border px-1.5 py-1 transition-all hover:shadow-md ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                          : 'border-slate-100 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 overflow-hidden">
                          <span className={`truncate text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                            {member.name}
                          </span>
                          {isMale && <span className="text-[10px] text-blue-400">M</span>}
                          {isFemale && <span className="text-[10px] text-rose-400">F</span>}
                          {member.birthDate && <span className="text-[10px] text-slate-500">{member.birthDate.slice(2, 4)}년생</span>}
                        </div>
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
        </div>

        {/* Formation Result */}
        {groups.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-lg font-bold text-slate-900">편성 결과</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLargeView(true)}
                  className="rounded px-3 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50 border border-emerald-200"
                >
                  크게 보기
                </button>
                <button
                  onClick={() => setGroups([])}
                  className="rounded px-3 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  초기화
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groups.map((group) => {
                const maleCount = group.members.filter(m => m.gender === 'MALE' || m.gender === 'M' || m.gender === '남자').length
                const femaleCount = group.members.filter(m => m.gender === 'FEMALE' || m.gender === 'F' || m.gender === '여자').length
                
                return (
                  <div key={group.id} className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">{group.name}</h3>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 shadow-sm border border-slate-100">
                          {group.members.length}명
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400 flex gap-2">
                        <span>남 {maleCount}</span>
                        <span>여 {femaleCount}</span>
                      </div>
                    </div>
                    <div className="flex-1 p-3">
                      <ul className="space-y-1">
                        {group.members.map((member) => (
                          <li key={member.memberId} className="flex items-center justify-between rounded px-2 py-1 hover:bg-slate-50">
                            <span className="text-sm text-slate-700">{member.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400">{member.soonName}</span>
                              {member.gender && (
                                <span className={`text-[10px] ${
                                  (member.gender === 'MALE' || member.gender === 'M' || member.gender === '남자') ? 'text-blue-400' : 
                                  (member.gender === 'FEMALE' || member.gender === 'F' || member.gender === '여자') ? 'text-rose-400' : 'text-slate-300'
                                }`}>
                                  {(member.gender === 'MALE' || member.gender === 'M' || member.gender === '남자') ? 'M' : (member.gender === 'FEMALE' || member.gender === 'F' || member.gender === '여자') ? 'F' : ''}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Full Screen Result Modal */}
        {showLargeView && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h2 className="text-3xl font-bold text-slate-800">조 편성 결과</h2>
              <button 
                onClick={() => setShowLargeView(false)}
                className="rounded-lg bg-slate-200 px-6 py-3 text-xl font-bold text-slate-700 hover:bg-slate-300 transition-colors"
              >
                닫기
              </button>
            </div>
            <div className="flex-1 p-4 bg-slate-100 overflow-hidden">
               <div className="grid h-full w-full gap-4" style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }}>
                  {groups.map((group) => {
                    const maleCount = group.members.filter(m => m.gender === 'MALE' || m.gender === 'M' || m.gender === '남자').length
                    const femaleCount = group.members.filter(m => m.gender === 'FEMALE' || m.gender === 'F' || m.gender === '여자').length
                    
                    return (
                      <div key={group.id} className="flex flex-col rounded-2xl border-2 border-slate-300 bg-white shadow-xl overflow-hidden">
                        <div className="border-b-2 border-slate-100 bg-emerald-50 py-3 text-center shrink-0">
                          <h3 className="text-3xl font-extrabold text-emerald-900 mb-1">{group.name}</h3>
                          <div className="flex justify-center gap-2 text-base font-medium text-slate-600">
                            <span>{group.members.length}명</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-blue-600">남{maleCount}</span>
                            <span className="text-rose-600">여{femaleCount}</span>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                          <div className="flex flex-col gap-2">
                            {group.members.map((member) => (
                              <div key={member.memberId} className="flex h-24 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-2 shadow-sm border border-slate-100">
                                <span className="text-4xl font-extrabold text-slate-800 text-center leading-none tracking-tight break-keep">
                                  {member.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GroupFormationPage
