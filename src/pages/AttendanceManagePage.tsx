import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  getAttendanceSheet,
  checkInByAdmin,
  registerNewcomer,
  createMember,
  getPeriodStatistics,
  getMemberStats,
  type AttendanceRecordDto,
  type AttendanceStatisticsResponseDto,
  type MemberAttendanceStatResponseDto,
  type AttendanceSheetResponseDto,
} from '../services/attendanceService'
import { getCells, getUnassignedMembers, type Cell } from '../services/cellService'
import { getMembers } from '../services/memberService'
import { scheduleService } from '../services/scheduleService'
import { formatPhoneNumber } from '../utils/format'
import type { Schedule, WorshipCategory } from '../types/schedule'
import type { Member } from '../types/member'

type TabType = 'check' | 'confirmation'
type SubTabType = 'OVERVIEW' | 'INDIVIDUAL'

interface CellColumn {
  key: number
  title: string
  members: Member[]
}

function AttendanceManagePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState<TabType>('check')
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('OVERVIEW')

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return searchParams.get('date') || new Date().toISOString().split('T')[0]
  })
  const [offering, setOffering] = useState<number>(0)

  const [allSchedules, setAllSchedules] = useState<Schedule[]>([])
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null)
  const [schedulesLoading, setSchedulesLoading] = useState(false)
  const [schedulesError, setSchedulesError] = useState<string | null>(null)

  const [attendanceSheet, setAttendanceSheet] =
    useState<AttendanceSheetResponseDto | null>(null)
  const [attendanceModeOverride, setAttendanceModeOverride] =
    useState<'GENERAL' | null>(null)
  const [attendedMemberIds, setAttendedMemberIds] = useState<Set<number>>(new Set())
  const [sheetLoading, setSheetLoading] = useState(false)
  const [sheetError, setSheetError] = useState<string | null>(null)

  const [cells, setCells] = useState<Cell[]>([])
  const [unassignedMembers, setUnassignedMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)

  const [isSavingAttendance, setIsSavingAttendance] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const [visibleMemberIds, setVisibleMemberIds] = useState<Set<number> | null>(null)
  const [isListManageOpen, setIsListManageOpen] = useState(false)
  const [listManageSelection, setListManageSelection] = useState<Set<number>>(
    new Set(),
  )

  const [isNewcomerModalOpen, setIsNewcomerModalOpen] = useState(false)
  const [newNewcomerName, setNewNewcomerName] = useState('')
  const [newNewcomerGender, setNewNewcomerGender] = useState<'MALE' | 'FEMALE'>('MALE')
  const [isNewcomerSaving, setIsNewcomerSaving] = useState(false)

  const [dateRangeStart, setDateRangeStart] = useState<string>(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 6)
    return date.toISOString().split('T')[0]
  })
  const [dateRangeEnd, setDateRangeEnd] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })

  const [filterScheduleTypes, setFilterScheduleTypes] = useState<
    ('WORSHIP' | 'EVENT' | 'MEETING')[]
  >([])
  const [filterWorshipCategories, setFilterWorshipCategories] = useState<string[]>([])
  const [worshipCategories, setWorshipCategories] = useState<WorshipCategory[]>([])

  const [statSelectedSchedule, setStatSelectedSchedule] = useState<{
    id: number
    name: string
  } | null>(null)
  const [isStatListOpen, setIsStatListOpen] = useState(false)
  const [statAttendanceList, setStatAttendanceList] = useState<AttendanceRecordDto[]>([])
  const [statListLoading, setStatListLoading] = useState(false)

  const handleStatPointClick = async (
    scheduleId: number,
    scheduleName: string,
    dateStr: string,
  ) => {
    setStatSelectedSchedule({ id: scheduleId, name: scheduleName })
    setIsStatListOpen(true)
    setStatListLoading(true)
    try {
      const sheet = await getAttendanceSheet(scheduleId, dateStr)
      const sorted = sheet.records
        .filter((r) => r.attended)
        .sort((a, b) => a.name.localeCompare(b.name))
      setStatAttendanceList(sorted)
    } catch (err) {
      console.error(err)
      alert('출석 명단을 불러오는데 실패했습니다.')
    } finally {
      setStatListLoading(false)
    }
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await scheduleService.getWorshipCategories()
        setWorshipCategories(categories)
      } catch (err) {
        console.error('Failed to fetch worship categories:', err)
      }
    }
    fetchCategories()
  }, [])

  const [periodStats, setPeriodStats] = useState<AttendanceStatisticsResponseDto | null>(
    null,
  )
  const [periodLoading, setPeriodLoading] = useState(false)
  const [periodError, setPeriodError] = useState<string | null>(null)

  const [memberStats, setMemberStatsState] = useState<MemberAttendanceStatResponseDto[]>(
    [],
  )
  const [memberStatsLoading, setMemberStatsLoading] = useState(false)
  const [memberStatsError, setMemberStatsError] = useState<string | null>(null)
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [newcomerList, setNewcomerList] = useState<Member[]>([])

  // 명단 관리 모달 상태
  const [memberManageMode, setMemberManageMode] = useState<'ADD' | 'REMOVE' | null>(null)
  const [showMemberManageModal, setShowMemberManageModal] = useState(false)
  const [availableMembers, setAvailableMembers] = useState<Member[]>([])
  const [selectedMemberIdsForManage, setSelectedMemberIdsForManage] = useState<number[]>([])
  const [memberSearchKeyword, setMemberSearchKeyword] = useState('')
  const [memberListLoading, setMemberListLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('visible_member_ids')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as number[]
        setVisibleMemberIds(new Set(parsed))
      } catch {
        setVisibleMemberIds(null)
      }
    } else {
      setVisibleMemberIds(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadSchedules = async () => {
      setSchedulesLoading(true)
      setSchedulesError(null)
      try {
        const date = new Date(selectedDate)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const data = await scheduleService.getAdminSchedules(year, month)
        if (cancelled) return
        setAllSchedules(data)
        const filtered = data.filter(
          (schedule) => schedule.startDate.slice(0, 10) === selectedDate,
        )
        
        const paramScheduleId = searchParams.get('scheduleId')
        const targetId = paramScheduleId ? Number(paramScheduleId) : null

        setSelectedScheduleId((prev) => {
          if (targetId && filtered.some((s) => s.scheduleId === targetId)) {
            return targetId
          }
          if (prev && filtered.some((s) => s.scheduleId === prev)) {
            return prev
          }
          return filtered.length > 0 ? filtered[0].scheduleId : null
        })
      } catch (error) {
        if (!cancelled) {
          console.error(error)
          setSchedulesError('일정을 불러오는데 실패했습니다.')
          alert('일정을 불러오는데 실패했습니다.')
        }
      } finally {
        if (!cancelled) {
          setSchedulesLoading(false)
        }
      }
    }
    loadSchedules()
    return () => {
      cancelled = true
    }
  }, [selectedDate, searchParams])

  const loadAttendanceAndMembers = useCallback(
    async (scheduleId: number, dateStr: string) => {
      setSheetLoading(true)
      setMembersLoading(true)
      setSheetError(null)
      setMembersError(null)
      try {
        const year = new Date(dateStr).getFullYear()
        const [sheet, cellsData, unassignedData] = await Promise.all([
          getAttendanceSheet(scheduleId, dateStr),
          getCells(year),
          getUnassignedMembers(year),
        ])

        const assignedMemberIds = new Set<number>()
        cellsData.forEach((cell) => {
          if (cell.leaderMemberId) {
            assignedMemberIds.add(cell.leaderMemberId)
          }
          cell.members.forEach((member) => {
            assignedMemberIds.add(member.memberId)
          })
        })
        const cleanUnassigned = unassignedData.filter(
          (member) => !assignedMemberIds.has(member.memberId),
        )

        setAttendanceSheet(sheet)
        setAttendedMemberIds(
          new Set(
            sheet.records
              .filter((record) => record.attended)
              .map((record) => record.memberId),
          ),
        )
        setCells(cellsData)
        setUnassignedMembers(cleanUnassigned)

        try {
          const newcomerPage = await getMembers({
            page: 0,
            size: 100,
            sort: 'name,asc',
            status: 'NEWCOMER',
          })
          setNewcomerList(newcomerPage.content)
        } catch (error) {
          console.error(error)
        }
      } catch (error) {
        console.error(error)
        setSheetError('출석 명단을 불러오는데 실패했습니다.')
        setMembersError('순 데이터를 불러오는데 실패했습니다.')
        alert('출석 명단 또는 순 데이터를 불러오는데 실패했습니다.')
      } finally {
        setSheetLoading(false)
        setMembersLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (!selectedScheduleId) {
      setAttendanceSheet(null)
      setAttendanceModeOverride(null)
      setAttendedMemberIds(new Set())
      setCells([])
      setUnassignedMembers([])
      return
    }
    loadAttendanceAndMembers(selectedScheduleId, selectedDate)
  }, [selectedScheduleId, selectedDate, loadAttendanceAndMembers])

  useEffect(() => {
    setAttendanceModeOverride(null)
  }, [selectedScheduleId])

  useEffect(() => {
    if (activeTab !== 'confirmation' || activeSubTab !== 'OVERVIEW') {
      return
    }
    let cancelled = false
    const loadPeriodStats = async () => {
      setPeriodLoading(true)
      setPeriodError(null)
      try {
        const data = await getPeriodStatistics({
          startDate: dateRangeStart,
          endDate: dateRangeEnd,
          scheduleTypes:
            filterScheduleTypes.length > 0
              ? filterScheduleTypes.join(',')
              : undefined,
          worshipCategories:
            filterScheduleTypes.includes('WORSHIP') &&
            filterWorshipCategories.length > 0
              ? filterWorshipCategories.join(',')
              : undefined,
        })
        if (cancelled) return
        setPeriodStats(data)
      } catch (error) {
        if (!cancelled) {
          console.error(error)
          setPeriodError('통계를 불러오는데 실패했습니다.')
          alert('통계를 불러오는데 실패했습니다.')
        }
      } finally {
        if (!cancelled) {
          setPeriodLoading(false)
        }
      }
    }
    loadPeriodStats()
    return () => {
      cancelled = true
    }
  }, [
    activeTab,
    activeSubTab,
    dateRangeStart,
    dateRangeEnd,
    filterScheduleTypes,
    filterWorshipCategories,
  ])

  useEffect(() => {
    if (activeTab !== 'confirmation' || activeSubTab !== 'INDIVIDUAL') {
      return
    }
    let cancelled = false
    const loadMemberStats = async () => {
      setMemberStatsLoading(true)
      setMemberStatsError(null)
      try {
        const year = new Date().getFullYear()
        const data = await getMemberStats({ year })
        if (cancelled) return
        setMemberStatsState(data)
      } catch (error) {
        if (!cancelled) {
          console.error(error)
          setMemberStatsError('인원별 통계를 불러오는데 실패했습니다.')
          alert('인원별 통계를 불러오는데 실패했습니다.')
        }
      } finally {
        if (!cancelled) {
          setMemberStatsLoading(false)
        }
      }
    }
    loadMemberStats()
    return () => {
      cancelled = true
    }
  }, [activeTab, activeSubTab])

  const schedulesForSelectedDate = useMemo(
    () =>
      allSchedules.filter(
        (schedule) => schedule.startDate.slice(0, 10) === selectedDate,
      ),
    [allSchedules, selectedDate],
  )

  const selectedSchedule = useMemo(
    () =>
      allSchedules.find((schedule) => schedule.scheduleId === selectedScheduleId) ||
      null,
    [allSchedules, selectedScheduleId],
  )

  const baseAttendanceMode: 'GENERAL' | 'PARTICIPANT' =
    attendanceSheet?.attendanceMode ?? 'GENERAL'
  const effectiveAttendanceMode = attendanceModeOverride ?? baseAttendanceMode

  const attendanceCount = useMemo(
    () => attendedMemberIds.size,
    [attendedMemberIds],
  )

  const newcomerMembers = useMemo(
    () => newcomerList,
    [newcomerList],
  )

  const unassignedNonSpecialMembers = useMemo(
    () =>
      unassignedMembers.filter(
        (member) =>
          member.memberStatus !== 'NEWCOMER' &&
          member.memberStatus !== 'LONG_TERM_ABSENT',
      ),
    [unassignedMembers],
  )

  const visibleNewcomers = useMemo(() => {
    if (!visibleMemberIds) {
      return newcomerMembers
    }
    return newcomerMembers.filter((member) => visibleMemberIds.has(member.memberId))
  }, [newcomerMembers, visibleMemberIds])

  const visibleUnassignedMembers = useMemo(() => {
    if (!visibleMemberIds) {
      return unassignedNonSpecialMembers
    }
    return unassignedNonSpecialMembers.filter((member) =>
      visibleMemberIds.has(member.memberId),
    )
  }, [unassignedNonSpecialMembers, visibleMemberIds])

  const cellColumns: CellColumn[] = useMemo(
    () =>
      cells.map((cell) => {
        const members: Member[] = []
        if (cell.leaderMemberId && cell.leaderName) {
          members.push({
            memberId: cell.leaderMemberId,
            name: cell.leaderName,
            phone: cell.leaderPhone || '',
            birthDate: '',
            memberStatus: 'ACTIVE',
            memberImageUrl: null,
            soonName: cell.cellName,
            roles: ['CELL_LEADER'],
            hasAccount: false,
            gender: 'NONE',
            age: 0,
          })
        }
        cell.members.forEach((member) => {
          members.push({
            ...member,
            soonName: cell.cellName,
          })
        })
        return {
          key: cell.cellId,
          title: cell.cellName,
          members,
        }
      }),
    [cells],
  )

  const filteredMemberStats = useMemo(() => {
    const query = memberSearchQuery.trim().toLowerCase()
    if (!query) {
      return memberStats
    }
    return memberStats.filter(
      (stat) =>
        stat.name.toLowerCase().includes(query) ||
        stat.cellName.toLowerCase().includes(query),
    )
  }, [memberStats, memberSearchQuery])

  const dailyStats = periodStats?.scheduleStats ?? []
  const maxDailyCount =
    dailyStats.length > 0 ? Math.max(...dailyStats.map((d) => d.count)) : 0

  const handleToggleAttendance = useCallback((memberId: number) => {
    setAttendedMemberIds((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
        next.add(memberId)
      }
      return next
    })
  }, [])

  const handleSaveAttendance = async () => {
    if (!selectedScheduleId) {
      alert('일정을 먼저 선택해주세요.')
      return
    }
    if (attendedMemberIds.size === 0) {
      setSaveMessage({
        type: 'error',
        text: '출석 인원이 없습니다. 최소 1명 이상 출석 체크해주세요.',
      })
      setTimeout(() => setSaveMessage(null), 3000)
      return
    }
    setIsSavingAttendance(true)
    setSaveMessage(null)
    try {
      await checkInByAdmin(selectedScheduleId, {
        targetDate: selectedDate,
        attendedMemberIds: Array.from(attendedMemberIds),
      })
      setSaveMessage({
        type: 'success',
        text: `출석 기록이 저장되었습니다. (출석: ${attendedMemberIds.size}명)`,
      })
      setTimeout(() => setSaveMessage(null), 5000)
    } catch (error) {
      console.error(error)
      setSaveMessage({
        type: 'error',
        text: '출석 저장에 실패했습니다. 다시 시도해주세요.',
      })
      alert('출석 저장에 실패했습니다.')
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setIsSavingAttendance(false)
    }
  }

  const handleOpenListManage = () => {
    const base = visibleMemberIds
      ? Array.from(visibleMemberIds)
      : [...newcomerMembers, ...unassignedNonSpecialMembers].map(
          (member) => member.memberId,
        )
    setListManageSelection(new Set(base))
    setIsListManageOpen(true)
  }

  const handleToggleVisibleMember = (memberId: number) => {
    setListManageSelection((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
        next.add(memberId)
      }
      return next
    })
  }

  const isAllNewcomersSelected = useMemo(
    () =>
      newcomerMembers.length > 0 &&
      newcomerMembers.every((member) => listManageSelection.has(member.memberId)),
    [newcomerMembers, listManageSelection],
  )

  const isAllUnassignedSelected = useMemo(
    () =>
      unassignedNonSpecialMembers.length > 0 &&
      unassignedNonSpecialMembers.every((member) =>
        listManageSelection.has(member.memberId),
      ),
    [unassignedNonSpecialMembers, listManageSelection],
  )

  const handleToggleAllNewcomers = () => {
    setListManageSelection((prev) => {
      const next = new Set(prev)
      if (isAllNewcomersSelected) {
        newcomerMembers.forEach((member) => {
          next.delete(member.memberId)
        })
      } else {
        newcomerMembers.forEach((member) => {
          next.add(member.memberId)
        })
      }
      return next
    })
  }

  const handleToggleAllUnassignedMembers = () => {
    setListManageSelection((prev) => {
      const next = new Set(prev)
      if (isAllUnassignedSelected) {
        unassignedNonSpecialMembers.forEach((member) => {
          next.delete(member.memberId)
        })
      } else {
        unassignedNonSpecialMembers.forEach((member) => {
          next.add(member.memberId)
        })
      }
      return next
    })
  }

  const handleSaveVisibleList = () => {
    const ids = Array.from(listManageSelection)
    localStorage.setItem('visible_member_ids', JSON.stringify(ids))
    setVisibleMemberIds(new Set(ids))
    setIsListManageOpen(false)
  }

  const handleSaveNewcomer = async () => {
    if (!newNewcomerName.trim()) {
      alert('이름을 입력해주세요.')
      return
    }
    if (!selectedScheduleId) {
      alert('일정을 먼저 선택해주세요.')
      return
    }
    setIsNewcomerSaving(true)
    try {
      const name = newNewcomerName.trim()
      await registerNewcomer({
        name,
        gender: newNewcomerGender,
        birthDate: '1900-01-01',
        phone: '',
      })
      const newMemberId = await createMember({
        name,
        phone: '',
        birthDate: '1900-01-01',
        gender: newNewcomerGender,
        memberStatus: 'NEWCOMER',
        memberImageUrl: undefined,
        roles: [],
      })
      await loadAttendanceAndMembers(selectedScheduleId, selectedDate)
      setAttendedMemberIds((prev) => {
        const next = new Set(prev)
        next.add(newMemberId)
        return next
      })
      setVisibleMemberIds((prev) => {
        const base = prev ? Array.from(prev) : []
        const next = new Set<number>([...base, newMemberId])
        localStorage.setItem('visible_member_ids', JSON.stringify(Array.from(next)))
        return next
      })
      setNewNewcomerName('')
      setNewNewcomerGender('MALE')
      setIsNewcomerModalOpen(false)
    } catch (error) {
      console.error(error)
      alert('새신자 등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsNewcomerSaving(false)
    }
  }

  const fetchAvailableMembers = useCallback(
    async (keyword?: string, mode?: 'ADD' | 'REMOVE') => {
      if (!selectedScheduleId) return

      const targetMode = mode || memberManageMode
      setMemberListLoading(true)

      try {
        if (targetMode === 'REMOVE') {
          // 삭제 모드: 현재 참석자 중에서 검색 (이미 출석한 인원은 제외할 수도 있지만, 선택 시 제한하는 방식 사용)
          // 여기서는 전체 리스트를 보여주고 선택 시 제한하거나, 아예 리스트에서 뺄 수도 있음.
          // 사용자 요청: "참가자 출석부인 경우 ... 명단 추가 명단 삭제"
          // 그리고 "이미 출석한 인원은 삭제 불가"
          
          if (!attendanceSheet) return

          // 현재 명단에 있는 사람들
          let candidates = attendanceSheet.records

          if (keyword) {
            candidates = candidates.filter((r) => r.name.includes(keyword))
          }

          // 이미 출석한 사람은 삭제 대상에서 제외 (리스트에서 아예 안 보여주는 게 깔끔함)
          candidates = candidates.filter((r) => !r.attended)

          const mappedMembers: Member[] = candidates.map((r) => ({
            memberId: r.memberId,
            name: r.name,
            phone: r.phone || '',
            birthDate: '',
            memberStatus: 'ACTIVE',
            memberImageUrl: null,
            roles: [],
            hasAccount: false,
            gender: 'NONE',
            age: 0,
          }))
          setAvailableMembers(mappedMembers)
        } else {
          // 추가 모드: 전체 멤버 중 미참석자 검색
          const response = await getMembers({
            page: 0,
            size: 1000,
            sort: 'name,asc',
            keyword: keyword,
            status: 'ACTIVE',
          })

          const allMembers = response.content

          // 이미 명단에 있는 멤버 제외
          const currentMemberIds = new Set(
            attendanceSheet?.records.map((r) => r.memberId) || [],
          )
          const filtered = allMembers.filter(
            (m) => !currentMemberIds.has(m.memberId),
          )

          setAvailableMembers(filtered)
        }
      } catch (err) {
        console.error('Failed to fetch members:', err)
        alert('멤버 목록을 불러오는데 실패했습니다.')
      } finally {
        setMemberListLoading(false)
      }
    },
    [selectedScheduleId, memberManageMode, attendanceSheet],
  )

  const handleOpenMemberAdd = () => {
    if (!selectedScheduleId) return
    setMemberSearchKeyword('')
    setMemberManageMode('ADD')
    setSelectedMemberIdsForManage([])
    setShowMemberManageModal(true)
    fetchAvailableMembers('', 'ADD')
  }

  const handleOpenMemberRemove = () => {
    if (!selectedScheduleId) return
    setMemberSearchKeyword('')
    setMemberManageMode('REMOVE')
    setSelectedMemberIdsForManage([])
    setShowMemberManageModal(true)
    fetchAvailableMembers('', 'REMOVE')
  }

  const handleSearchMembers = (e: React.FormEvent) => {
    e.preventDefault()
    fetchAvailableMembers(memberSearchKeyword)
  }

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMemberIdsForManage((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    )
  }

  const handleSaveMemberManage = async () => {
    if (!selectedScheduleId || !memberManageMode) return

    try {
      const selectedIds = selectedMemberIdsForManage

      if (selectedIds.length === 0) {
        setShowMemberManageModal(false)
        return
      }

      if (memberManageMode === 'ADD') {
        await scheduleService.registerScheduleMembers(
          selectedScheduleId,
          selectedIds,
          selectedDate,
        )
        alert('명단이 추가되었습니다.')
      } else {
        await scheduleService.removeScheduleAttendees(
          selectedScheduleId,
          selectedIds,
          selectedDate,
        )
        alert('명단에서 삭제되었습니다.')
      }

      // 성공 후 데이터 갱신
      await loadAttendanceAndMembers(selectedScheduleId, selectedDate)
      setShowMemberManageModal(false)
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : '요청 처리에 실패했습니다.'
      alert(message)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
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
                <p className="text-xs text-slate-500">
                  출석 체크와 통계를 한 화면에서 관리합니다
                </p>
              </div>
            </div>
          </div>
        </header>

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

        {activeTab === 'check' && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">날짜</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">일정</span>
                    <select
                      value={selectedScheduleId ?? ''}
                      onChange={(e) =>
                        setSelectedScheduleId(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      className="min-w-[220px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      disabled={schedulesLoading}
                    >
                      {schedulesForSelectedDate.length === 0 && (
                        <option value="">선택 가능한 일정이 없습니다</option>
                      )}
                      {schedulesForSelectedDate.map((schedule) => (
                        <option key={schedule.scheduleId} value={schedule.scheduleId}>
                          {schedule.title}
                        </option>
                      ))}
                    </select>
                    {schedulesLoading && (
                      <span className="text-xs text-slate-500">일정 불러오는 중...</span>
                    )}
                    {schedulesError && (
                      <span className="text-xs text-red-600">{schedulesError}</span>
                    )}
                  </div>
                  <div className="ml-auto flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">출석</span>
                      <span className="text-sm font-bold text-slate-900">
                        {attendanceCount}명
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">헌금</span>
                      <input
                        type="number"
                        value={offering}
                        onChange={(e) => setOffering(Number(e.target.value))}
                        step={1000}
                        min={0}
                        className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm text-right"
                        placeholder="0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveAttendance}
                      disabled={isSavingAttendance || !selectedScheduleId}
                      className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSavingAttendance ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className="h-4 w-4 rounded border-2 border-slate-300 bg-white" />
                    <span>미출석</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-4 w-4 rounded border-2 border-blue-600 bg-blue-600" />
                    <span>출석</span>
                  </div>
                  {selectedSchedule && (
                    <span className="ml-2 text-xs text-slate-400">
                      선택된 일정: {selectedSchedule.title}
                    </span>
                  )}
                </div>
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

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-900">출석 명단</h2>
                    {selectedScheduleId && attendanceSheet && (
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            effectiveAttendanceMode === 'PARTICIPANT'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {effectiveAttendanceMode === 'PARTICIPANT'
                            ? '참가자 출석부'
                            : '전체 명단 출석부'}
                        </span>
                        {baseAttendanceMode === 'PARTICIPANT' &&
                          (attendanceModeOverride === null ? (
                            <button
                              type="button"
                              onClick={() => setAttendanceModeOverride('GENERAL')}
                              className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                            >
                              전체 명단 불러오기
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAttendanceModeOverride(null)}
                              className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                            >
                              참가자 명단으로 돌아가기
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {new Date(selectedDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {effectiveAttendanceMode === 'PARTICIPANT' ? (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenMemberAdd}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        명단 추가
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenMemberRemove}
                        className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200"
                      >
                        명단 삭제
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenListManage}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        명단 관리
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedScheduleId) {
                            alert('일정을 먼저 선택해주세요.')
                            return
                          }
                          setIsNewcomerModalOpen(true)
                        }}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        새신자 추가
                      </button>
                    </>
                  )}
                </div>
              </div>

              {!selectedScheduleId && (
                <div className="py-16 text-center text-sm text-slate-500">
                  선택한 날짜에 출석 체크 가능한 일정이 없습니다.
                </div>
              )}

              {selectedScheduleId && (sheetLoading || membersLoading) && (
                <div className="py-16 text-center text-sm text-slate-500">
                  출석 명단을 불러오는 중입니다...
                </div>
              )}

              {selectedScheduleId &&
                !sheetLoading &&
                !membersLoading &&
                (sheetError || membersError) && (
                  <div className="py-16 text-center text-sm text-red-600">
                    출석 데이터를 불러오지 못했습니다.
                  </div>
                )}

              {selectedScheduleId &&
                !sheetLoading &&
                !membersLoading &&
                !sheetError &&
                !membersError &&
                attendanceSheet && (
                  <>
                    {effectiveAttendanceMode === 'GENERAL' && (
                      <div className="relative max-h-[520px] overflow-x-auto overflow-y-auto">
                        <div className="inline-flex min-w-full gap-2">
                          {cellColumns.map((column) => (
                            <div
                              key={column.key}
                              className="flex w-28 flex-col border border-slate-200 bg-white"
                            >
                              <div className="border-b border-slate-200 bg-slate-50 px-2 py-2 text-center text-[11px] font-semibold text-slate-700">
                                {column.title}
                              </div>
                              <div className="flex flex-col">
                                {column.members.map((member) => {
                                  const checked = attendedMemberIds.has(member.memberId)
                                  return (
                                    <button
                                      key={member.memberId}
                                      type="button"
                                      onClick={() =>
                                        handleToggleAttendance(member.memberId)
                                      }
                                      className={`flex h-8 items-center justify-center border-b border-slate-100 px-1 text-[11px] transition hover:bg-slate-50 ${
                                        checked
                                          ? 'bg-blue-50 font-semibold text-blue-700'
                                          : 'text-slate-700'
                                      }`}
                                    >
                                      <span className="truncate">{member.name}</span>
                                    </button>
                                  )
                                })}
                                {column.members.length === 0 && (
                                  <div className="px-2 py-4 text-center text-[11px] text-slate-400">
                                    등록된 인원이 없습니다.
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          <div className="flex w-28 flex-col border border-slate-200 bg-white">
                            <div className="border-b border-slate-200 bg-slate-50 px-2 py-2 text-center text-[11px] font-semibold text-slate-700">
                              미배정
                            </div>
                            <div className="flex flex-col">
                              {visibleUnassignedMembers.map((member) => {
                                const checked = attendedMemberIds.has(member.memberId)
                                return (
                                  <button
                                    key={member.memberId}
                                    type="button"
                                    onClick={() =>
                                      handleToggleAttendance(member.memberId)
                                    }
                                    className={`flex h-8 items-center justify-center border-b border-slate-100 px-1 text-[11px] transition hover:bg-slate-50 ${
                                      checked
                                        ? 'bg-blue-50 font-semibold text-blue-700'
                                        : 'text-slate-700'
                                    }`}
                                  >
                                    <span className="truncate">{member.name}</span>
                                  </button>
                                )
                              })}
                              {visibleUnassignedMembers.length === 0 && (
                                <div className="px-2 py-4 text-center text-[11px] text-slate-400">
                                  미배정 인원이 없습니다.
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex w-28 flex-col border border-slate-200 bg-white">
                            <div className="border-b border-slate-200 bg-slate-50 px-2 py-2 text-center text-[11px] font-semibold text-slate-700">
                              새신자
                            </div>
                            <div className="flex flex-col">
                              {visibleNewcomers.map((member) => {
                                const checked = attendedMemberIds.has(member.memberId)
                                return (
                                  <button
                                    key={member.memberId}
                                    type="button"
                                    onClick={() =>
                                      handleToggleAttendance(member.memberId)
                                    }
                                    className={`flex h-8 items-center justify-center border-b border-slate-100 px-1 text-[11px] transition hover:bg-slate-50 ${
                                      checked
                                        ? 'bg-blue-50 font-semibold text-blue-700'
                                        : 'text-slate-700'
                                    }`}
                                  >
                                    <span className="truncate">{member.name}</span>
                                  </button>
                                )
                              })}
                              {visibleNewcomers.length === 0 && (
                                <div className="px-2 py-4 text-center text-[11px] text-slate-400">
                                  표시할 새신자가 없습니다.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {effectiveAttendanceMode === 'PARTICIPANT' && (
                      <div className="relative max-h-[520px] overflow-y-auto rounded-lg border border-slate-200 bg-white">
                        <div className="flex flex-col divide-y divide-slate-100">
                          {attendanceSheet.records.map((record) => {
                            const checked = attendedMemberIds.has(record.memberId)
                            return (
                              <button
                                key={record.memberId}
                                type="button"
                                onClick={() => handleToggleAttendance(record.memberId)}
                                className={`flex items-center justify-between px-4 py-3 text-sm transition ${
                                  checked
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`font-semibold ${
                                      checked ? 'text-blue-700' : 'text-slate-900'
                                    }`}
                                  >
                                    {record.name}
                                  </span>
                                  {record.phone && (
                                    <>
                                      <span className="text-slate-300">|</span>
                                      <span className="text-slate-500">
                                       {formatPhoneNumber(record.phone)}
                                     </span>
                                    </>
                                  )}
                                </div>
                                {checked && (
                                  <span className="text-xs font-semibold text-blue-600">
                                    출석
                                  </span>
                                )}
                              </button>
                            )
                          })}
                          {attendanceSheet.records.length === 0 && (
                            <div className="py-16 text-center text-sm text-slate-500">
                              참가자 명단이 없습니다.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
            </div>
          </>
        )}

        {activeTab === 'confirmation' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">기간</span>
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
                <div className="ml-auto flex items-center gap-3">
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    출석 기록이 있는 날짜만 그래프에 표시됩니다
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm font-semibold text-slate-700">
                    일정 분류
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterScheduleTypes([])
                        setFilterWorshipCategories([])
                      }}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        filterScheduleTypes.length === 0
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 ring-1 ring-slate-200'
                      }`}
                    >
                      전체
                    </button>
                    {(['WORSHIP', 'EVENT', 'MEETING'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setFilterScheduleTypes((prev) => {
                            if (prev.includes(type)) {
                              return prev.filter((t) => t !== type)
                            } else {
                              return [...prev, type]
                            }
                          })
                        }}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                          filterScheduleTypes.includes(type)
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 ring-1 ring-slate-200'
                        }`}
                      >
                        {type === 'WORSHIP'
                          ? '예배'
                          : type === 'EVENT'
                          ? '행사'
                          : '모임'}
                      </button>
                    ))}
                  </div>
                </div>

                {filterScheduleTypes.includes('WORSHIP') && (
                  <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-4">
                    <span className="text-sm font-semibold text-slate-700">
                      예배 종류
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setFilterWorshipCategories([])}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                          filterWorshipCategories.length === 0
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 ring-1 ring-slate-200'
                        }`}
                      >
                        전체 예배
                      </button>
                      {worshipCategories.map((cat) => (
                        <button
                          key={cat.code}
                          type="button"
                          onClick={() => {
                            setFilterWorshipCategories((prev) => {
                              if (prev.includes(cat.code)) {
                                return prev.filter((c) => c !== cat.code)
                              } else {
                                return [...prev, cat.code]
                              }
                            })
                          }}
                          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                            filterWorshipCategories.includes(cat.code)
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 ring-1 ring-slate-200'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('OVERVIEW')}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    activeSubTab === 'OVERVIEW'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  전체 통계
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('INDIVIDUAL')}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    activeSubTab === 'INDIVIDUAL'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  인원별 현황
                </button>
              </div>
            </div>

            {activeSubTab === 'OVERVIEW' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">평균 출석</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {periodStats?.summary.averageAttendance ?? '-'}
                      <span className="ml-1 text-sm font-normal text-slate-500">명</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">최다 출석일</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {periodStats?.summary.maxAttendanceDate ? (
                        <>
                          {new Date(
                            periodStats.summary.maxAttendanceDate,
                          ).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short',
                          })}
                          {periodStats.summary.maxAttendanceScheduleName && (
                            <span className="mt-1 block text-sm font-normal text-slate-500">
                              {periodStats.summary.maxAttendanceScheduleName}
                            </span>
                          )}
                        </>
                      ) : (
                        '-'
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">총 헌금액</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-600">
                      ₩
                      {periodStats
                        ? periodStats.summary.totalOffering.toLocaleString('ko-KR')
                        : '-'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-bold text-slate-900">
                    일별 출석 추이
                    {filterScheduleTypes.length > 0 && (
                      <span className="ml-2 text-sm font-medium text-slate-500">
                        -{' '}
                        {filterScheduleTypes
                          .map((type) =>
                            type === 'WORSHIP'
                              ? '예배'
                              : type === 'EVENT'
                              ? '행사'
                              : '모임',
                          )
                          .join(', ')}
                        {filterWorshipCategories.length > 0 && (
                          <>
                            {' ('}
                            {filterWorshipCategories
                              .map(
                                (code) =>
                                  worshipCategories.find((c) => c.code === code)
                                    ?.name || code,
                              )
                              .join(', ')}
                            {')'}
                          </>
                        )}
                      </span>
                    )}
                  </h2>
                  {periodLoading && (
                    <div className="py-16 text-center text-sm text-slate-500">
                      통계를 불러오는 중입니다...
                    </div>
                  )}
                  {!periodLoading && periodError && (
                    <div className="py-16 text-center text-sm text-red-600">
                      {periodError}
                    </div>
                  )}
                  {!periodLoading && !periodError && dailyStats.length === 0 && (
                    <div className="py-16 text-center text-sm text-slate-500">
                      선택한 조건에 대한 출석 기록이 없습니다.
                    </div>
                  )}
                  {!periodLoading && !periodError && dailyStats.length > 0 && (
                    <div className="relative h-80 w-full overflow-x-auto">
                      <svg
                        style={{ width: `${Math.max(dailyStats.length * 100, 800)}px` }}
                        className="h-full"
                        viewBox={`0 0 ${Math.max(dailyStats.length * 100, 800)} 320`}
                      >
                        <defs>
                          <pattern
                            id="attendance-grid"
                            width="100"
                            height="35"
                            patternUnits="userSpaceOnUse"
                          >
                            <path
                              d="M 100 0 L 0 0 0 35"
                              fill="none"
                              stroke="#e2e8f0"
                              strokeWidth="1"
                            />
                          </pattern>
                          <linearGradient
                            id="attendance-gradient"
                            x1="0%"
                            y1="0%"
                            x2="0%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                          </linearGradient>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#attendance-grid)" />

                        {(() => {
                          if (!maxDailyCount) {
                            return null
                          }
                          const steps = 5
                          const stepValue = Math.ceil(maxDailyCount / steps)
                          const labels = []
                          const chartBottom = 280
                          const chartHeight = 240
                          
                          for (let i = 0; i <= steps; i += 1) {
                            const value = stepValue * i
                            const y = chartBottom - (value / (stepValue * steps)) * chartHeight
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
                                  y={y - 4}
                                  fontSize="12"
                                  fontWeight="600"
                                  fill="#64748b"
                                  textAnchor="start"
                                >
                                  {value}명
                                </text>
                              </g>,
                            )
                          }
                          return labels
                        })()}

                        {(() => {
                          if (!maxDailyCount) {
                            return null
                          }
                          const points: string[] = []
                          const circles: React.ReactNode[] = []
                          const chartBottom = 280
                          const chartHeight = 240
                          // maxDailyCount가 0일 수 없으므로(위에서 체크) 안전하지만, 
                          // steps 계산과 일치시키기 위해 stepValue * steps를 max로 사용하는 것이 그래프 눈금과 일치함
                          const steps = 5
                          const stepValue = Math.ceil(maxDailyCount / steps)
                          const maxScale = stepValue * steps

                          dailyStats.forEach((stat, index) => {
                            const x = 50 + index * 100
                            const y = chartBottom - (stat.count / maxScale) * chartHeight
                            points.push(`${x},${y}`)
                            circles.push(
                              <g
                                key={stat.scheduleId || `${stat.date}-${index}`}
                                onClick={() =>
                                  stat.scheduleId &&
                                  handleStatPointClick(
                                    stat.scheduleId,
                                    stat.scheduleName || '',
                                    stat.date,
                                  )
                                }
                                className="cursor-pointer"
                              >
                                <circle
                                  cx={x}
                                  cy={y}
                                  r="6"
                                  fill="#3b82f6"
                                  className="transition hover:r-8"
                                />
                                <circle cx={x} cy={y} r="3" fill="white" />
                                <text
                                  x={x}
                                  y={y - 12}
                                  fontSize="12"
                                  fontWeight="bold"
                                  fill="#1e293b"
                                  textAnchor="middle"
                                >
                                  {stat.count}
                                </text>
                                <title>
                                  {new Date(stat.date).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    weekday: 'short',
                                  })}
                                  {stat.scheduleName ? `\n${stat.scheduleName}` : ''}
                                  {'\n'}
                                  출석: {stat.count}명
                                  {'\n'}
                                  헌금: ₩{stat.offering.toLocaleString('ko-KR')}
                                </title>
                              </g>,
                            )
                          })
                          const pathData = `M ${points.join(' L ')}`
                          return (
                            <>
                              <path
                                d={`${pathData} L ${
                                  50 + (dailyStats.length - 1) * 100
                                },${chartBottom} L 50,${chartBottom} Z`}
                                fill="url(#attendance-gradient)"
                                opacity="0.2"
                              />
                              <path
                                d={pathData}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              {circles}
                            </>
                          )
                        })()}

                        {dailyStats.map((stat, index) => {
                          const x = 50 + index * 100
                          return (
                            <g
                              key={stat.scheduleId || `${stat.date}-${index}`}
                              onClick={() =>
                                stat.scheduleId &&
                                handleStatPointClick(
                                  stat.scheduleId,
                                  stat.scheduleName || '',
                                  stat.date,
                                )
                              }
                              className="cursor-pointer hover:opacity-75"
                            >
                              <text
                                x={x}
                                y="295"
                                fontSize="12"
                                fontWeight="bold"
                                fill="#334155"
                                textAnchor="middle"
                              >
                                {new Date(stat.date).toLocaleDateString('ko-KR', {
                                  month: 'numeric',
                                  day: 'numeric',
                                })}
                              </text>
                              <text
                                x={x}
                                y="312"
                                fontSize="11"
                                fontWeight="500"
                                fill="#64748b"
                                textAnchor="middle"
                              >
                                {stat.scheduleName || '-'}
                              </text>
                            </g>
                          )
                        })}
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSubTab === 'INDIVIDUAL' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">인원별 출석 현황</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      최근 출석률과 연속 결석 상태를 한눈에 확인합니다
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="이름 또는 순명 검색..."
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

                {memberStatsLoading && (
                  <div className="py-16 text-center text-sm text-slate-500">
                    인원별 통계를 불러오는 중입니다...
                  </div>
                )}

                {!memberStatsLoading && memberStatsError && (
                  <div className="py-16 text-center text-sm text-red-600">
                    {memberStatsError}
                  </div>
                )}

                {!memberStatsLoading && !memberStatsError && filteredMemberStats.length === 0 && (
                  <div className="py-16 text-center text-sm text-slate-500">
                    표시할 인원별 통계가 없습니다.
                  </div>
                )}

                {!memberStatsLoading && !memberStatsError && filteredMemberStats.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredMemberStats.map((stat) => {
                      const isDanger = stat.consecutiveAbsenceCount >= 3
                      const recentHistory = stat.attendanceHistory.slice(-4)
                      return (
                        <div
                          key={stat.memberId}
                          className={`rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
                            isDanger ? 'border-rose-400' : 'border-slate-200'
                          }`}
                        >
                          <div className="mb-3 flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-base font-bold text-slate-900">
                                {stat.name}
                              </h3>
                              <p className="mt-1 text-xs text-slate-500">
                                {stat.cellName || '미배정'}
                              </p>
                            </div>
                            <div className="text-right">
                              <div
                                className={`text-lg font-bold ${
                                  stat.attendanceRate >= 80
                                    ? 'text-green-600'
                                    : stat.attendanceRate >= 50
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {stat.attendanceRate}%
                              </div>
                              <div className="text-xs text-slate-500">출석률</div>
                            </div>
                          </div>
                          <div className="mb-3 flex items-center justify-between text-xs">
                            <span className="text-slate-600">
                              출석 {stat.attendanceCount}회
                            </span>
                            <span className="text-slate-500">
                              연속 결석 {stat.consecutiveAbsenceCount}회
                            </span>
                          </div>
                          {isDanger && (
                            <div className="mb-3">
                              <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                                심방 요망
                              </span>
                            </div>
                          )}
                          <div className="mt-2 rounded-lg bg-slate-50 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-medium text-slate-600">
                                최근 4주 현황
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {recentHistory.map((present, index) => (
                                <div
                                  key={index}
                                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                                    present
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-slate-200 text-slate-500'
                                  }`}
                                >
                                  {present ? '출석' : '결석'}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isListManageOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="flex w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">명단 관리</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsListManageOpen(false)}
                    className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-700">새신자</h4>
                    <button
                      type="button"
                      onClick={handleToggleAllNewcomers}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      {isAllNewcomersSelected ? '전체 해제' : '전체 추가'}
                    </button>
                  </div>
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                    {newcomerMembers.length === 0 && (
                      <div className="py-6 text-center text-xs text-slate-400">
                        등록된 새신자가 없습니다.
                      </div>
                    )}
                    {newcomerMembers.map((member) => (
                      <label
                        key={member.memberId}
                        className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={listManageSelection.has(member.memberId)}
                            onChange={() => handleToggleVisibleMember(member.memberId)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-slate-900">{member.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                    <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-700">미배정 인원</h4>
                    <button
                      type="button"
                      onClick={handleToggleAllUnassignedMembers}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      {isAllUnassignedSelected ? '전체 해제' : '전체 추가'}
                    </button>
                  </div>
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                        {unassignedNonSpecialMembers.length === 0 && (
                          <div className="py-6 text-center text-xs text-slate-400">
                            등록된 미배정 인원이 없습니다.
                          </div>
                        )}
                        {unassignedNonSpecialMembers.map((member) => (
                          <label
                            key={member.memberId}
                            className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={listManageSelection.has(member.memberId)}
                                onChange={() => handleToggleVisibleMember(member.memberId)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-slate-900">{member.name}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsListManageOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveVisibleList}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {isNewcomerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">새신자 추가</h3>
                <button
                  type="button"
                  onClick={() => setIsNewcomerModalOpen(false)}
                  className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    이름
                  </label>
                  <input
                    type="text"
                    value={newNewcomerName}
                    onChange={(e) => setNewNewcomerName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="새신자 이름을 입력하세요"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    성별
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="gender"
                        value="MALE"
                        checked={newNewcomerGender === 'MALE'}
                        onChange={(e) =>
                          setNewNewcomerGender(e.target.value as 'MALE')
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">남성</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="gender"
                        value="FEMALE"
                        checked={newNewcomerGender === 'FEMALE'}
                        onChange={(e) =>
                          setNewNewcomerGender(e.target.value as 'FEMALE')
                        }
                        className="h-4 w-4 text-rose-600 focus:ring-rose-500"
                      />
                      <span className="text-sm text-slate-700">여성</span>
                    </label>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  생년월일, 연락처 등은 추후 멤버 관리 화면에서 수정할 수 있습니다.
                </p>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewcomerModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewcomer}
                  disabled={isNewcomerSaving}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isNewcomerSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showMemberManageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="flex w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  {memberManageMode === 'ADD' ? '명단 추가' : '명단 삭제'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMemberManageModal(false)}
                  className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSearchMembers} className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={memberSearchKeyword}
                  onChange={(e) => setMemberSearchKeyword(e.target.value)}
                  placeholder="이름 검색..."
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  검색
                </button>
              </form>

              <div className="mb-2 text-xs text-slate-500">
                {memberManageMode === 'ADD' 
                  ? '추가할 멤버를 선택해주세요.' 
                  : '삭제할 멤버를 선택해주세요. (이미 출석한 인원은 삭제 불가)'}
              </div>

              <div className="flex-1 overflow-y-auto" style={{ maxHeight: '50vh' }}>
                {memberListLoading ? (
                  <div className="py-8 text-center text-slate-500">
                    멤버 목록을 불러오는 중입니다...
                  </div>
                ) : availableMembers.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    검색 결과가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableMembers.map((member) => (
                      <label
                        key={member.memberId}
                        className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 ${
                          selectedMemberIdsForManage.includes(member.memberId)
                            ? 'bg-blue-50 ring-1 ring-blue-200'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedMemberIdsForManage.includes(member.memberId)}
                            onChange={() => toggleMemberSelection(member.memberId)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {member.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {member.phone || '연락처 없음'}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMemberManageModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveMemberManage}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold text-white ${
                    memberManageMode === 'ADD'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {memberManageMode === 'ADD' ? '추가' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isStatListOpen && statSelectedSchedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div
              className="flex w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
              style={{ maxHeight: '80vh' }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {statSelectedSchedule.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    출석 명단 ({statAttendanceList.length}명)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStatListOpen(false)}
                  className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {statListLoading ? (
                  <div className="py-8 text-center text-slate-500">
                    명단을 불러오는 중입니다...
                  </div>
                ) : statAttendanceList.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    출석 인원이 없습니다.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {statAttendanceList.map((member) => (
                      <div
                        key={member.memberId}
                        className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                      >
                        {member.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsStatListOpen(false)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AttendanceManagePage
