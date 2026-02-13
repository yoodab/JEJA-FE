import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useConfirm } from '../contexts/ConfirmContext'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import * as XLSX from 'xlsx'
import { scheduleService } from '../services/scheduleService'
import { financeService } from '../services/financeService'
import { uploadFiles, getFileUrl } from '../services/albumService'
import { getMembers } from '../services/memberService'
import type { Member } from '../types/member'
import type { 
  Schedule, 
  ScheduleAttendee 
} from '../types/schedule'
import type { 
  FinanceResponseDto, 
  FinanceRequestDto, 
  CategoryDto, 
  DuesEventDto,
  DuesRecordDto
} from '../types/finance'

interface FinanceRecord extends Omit<FinanceResponseDto, 'id'> {
  id: string | number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

function FinanceManagePage() {
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 상태 관리
  const [records, setRecords] = useState<FinanceRecord[]>([])
  const [incomeCategories, setIncomeCategories] = useState<CategoryDto[]>([])
  const [expenseCategories, setExpenseCategories] = useState<CategoryDto[]>([])
  const [showCategoryManageModal, setShowCategoryManageModal] = useState(false)
  const [categoryManageType, setCategoryManageType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
  const [categoryInput, setCategoryInput] = useState('')
  const [showEventMenu, setShowEventMenu] = useState(false)
  
  // 필터 상태
  const today = new Date()
  
  // 1. 일반 재정용: 올해 1월 1일 ~ 현재
  const thisYearJan1 = new Date(today.getFullYear(), 0, 1)
  const [generalStartDate, setGeneralStartDate] = useState(thisYearJan1.toISOString().split('T')[0])
  const [generalEndDate, setGeneralEndDate] = useState(today.toISOString().split('T')[0])

  // 데이터 불러오기
  const fetchCategories = useCallback(async () => {
    try {
      const [income, expense] = await Promise.all([
        financeService.getCategories('INCOME'),
        financeService.getCategories('EXPENSE')
      ])
      setIncomeCategories(income)
      setExpenseCategories(expense)
      return { income, expense }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      return { income: [], expense: [] }
    }
  }, [])

  const fetchFinances = useCallback(async () => {
    try {
      const data = await financeService.getFinances(generalStartDate, generalEndDate)
      setRecords(data)
    } catch (error) {
      console.error('Failed to fetch finances:', error)
    }
  }, [generalStartDate, generalEndDate])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchFinances()
  }, [fetchFinances])

  // 2. 통계용: 최근 6개월 ~ 현재
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1)
  const [statsStartDate, setStatsStartDate] = useState(sixMonthsAgo.toISOString().split('T')[0])
  const [statsEndDate, setStatsEndDate] = useState(today.toISOString().split('T')[0])
  const [statsViewMode, setStatsViewMode] = useState<'MONTHLY' | 'DAILY'>('MONTHLY')

  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const [searchKeyword, setSearchKeyword] = useState('')

  // 모달 및 폼 상태
  const [showModal, setShowModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null)
  const [previewRecords, setPreviewRecords] = useState<FinanceRecord[]>([])
  const [formData, setFormData] = useState<Omit<FinanceRecord, 'id' | 'balance'>>({
    date: new Date().toISOString().split('T')[0],
    transactionType: 'INCOME',
    category: '주일헌금',
    detail: '',
    amount: 0,
    receiptImages: []
  })

  const [showReceiptViewModal, setShowReceiptViewModal] = useState(false)
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; left: number } | null>(null)

  const handleMenuClick = (e: React.MouseEvent<HTMLButtonElement>, id: string | number) => {
    e.stopPropagation()
    if (openMenuId === id) {
      setOpenMenuId(null)
      setMenuPosition(null)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const w24 = 96 // w-24 width approx 6rem = 96px

    const style: { top?: number; bottom?: number; left: number } = {
      left: rect.right - w24 + window.scrollX // Add scrollX for horizontal scrolling support if needed, but fixed ignores it. Wait.
    }
    // Fixed position is relative to viewport. 
    // rect.right is relative to viewport.
    // So left should be rect.right - 96.
    
    // However, if the table is scrolled horizontally, rect updates correctly.
    // But if we use fixed, we don't need window.scrollX.
    style.left = rect.right - w24

    // 화면 하단 공간이 150px 미만이면 위로 띄움
    if (spaceBelow < 150) {
      style.bottom = window.innerHeight - rect.top + 4
    } else {
      style.top = rect.bottom + 4
    }
    
    setMenuPosition(style)
    setOpenMenuId(id)
  }

  const handleViewReceipts = (images: string[]) => {
    setSelectedReceipts(images)
    setShowReceiptViewModal(true)
  }

  // --- 회비 관리 State & Logic ---
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'STATS' | 'DUES'>('GENERAL')
  const [duesEvents, setDuesEvents] = useState<DuesEventDto[]>([])
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [duesRecords, setDuesRecords] = useState<DuesRecordDto[]>([])
  const [showEventModal, setShowEventModal] = useState(false)
  const [newEvent, setNewEvent] = useState<{ name: string; targetAmount: number; date: string; scheduleId?: number; targetDate?: string }>({ name: '', targetAmount: 0, date: new Date().toISOString().split('T')[0] })
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [newPriceOptions, setNewPriceOptions] = useState<{optionId: string, name: string, amount: number}[]>([])
  const [isPriceOptionsOpen, setIsPriceOptionsOpen] = useState(false)
  const [optionInput, setOptionInput] = useState({ name: '', amount: 0 })
  const [duesSearch, setDuesSearch] = useState('')

  // 인원 관리 모달 관련 상태
  const [showMemberManageModal, setShowMemberManageModal] = useState(false)
  const [memberManageMode, setMemberManageMode] = useState<'ADD' | 'REMOVE'>('ADD')
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([])
  const [selectedRemoveIds, setSelectedRemoveIds] = useState<number[]>([])
  
  // 동기화 모달 상태
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [syncDiff, setSyncDiff] = useState<{ toAdd: ScheduleAttendee[], toRemove: DuesRecordDto[] }>({ toAdd: [], toRemove: [] })
  const [selectedSyncAdd, setSelectedSyncAdd] = useState<ScheduleAttendee[]>([])
  const [selectedSyncRemove, setSelectedSyncRemove] = useState<DuesRecordDto[]>([])

  // 납부 상세 모달 상태
  const [showDuesDetailModal, setShowDuesDetailModal] = useState(false)
  const [editingDuesRecord, setEditingDuesRecord] = useState<DuesRecordDto | null>(null)

  // 일정 불러오기 관련 상태
  const [isImportMode, setIsImportMode] = useState(false)
  const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0])
  const [scheduleOptions, setScheduleOptions] = useState<Schedule[]>([])
  const [selectedScheduleIdForImport, setSelectedScheduleIdForImport] = useState<number | null>(null)

  const fetchDuesEvents = useCallback(async () => {
    try {
      const data = await financeService.getDuesEvents()
      setDuesEvents(data)
      if (data.length > 0) {
        setSelectedEventId(prev => prev || data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch dues events:', error)
    }
  }, [])

  const fetchDuesRecords = useCallback(async (eventId: number) => {
    try {
      const data = await financeService.getDuesRecords(eventId)
      setDuesRecords(data)
    } catch (error) {
      console.error('Failed to fetch dues records:', error)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'DUES') {
      fetchDuesEvents()
    }
  }, [activeTab, fetchDuesEvents])

  useEffect(() => {
    if (selectedEventId) {
      fetchDuesRecords(selectedEventId)
    }
  }, [selectedEventId, fetchDuesRecords])

  const selectedEvent = useMemo(() => duesEvents.find(e => e.id === selectedEventId), [duesEvents, selectedEventId])
  
  const currentDuesList = useMemo(() => {
    if (!selectedEventId) return []
    return duesRecords.filter(r => r.eventId === selectedEventId && r.memberName.includes(duesSearch))
  }, [duesRecords, selectedEventId, duesSearch])

  const duesStats = useMemo(() => {
    if (!selectedEvent) return { total: 0, collected: 0, uncollected: 0, rate: 0, paidCount: 0, totalCount: 0 }
    const targetList = duesRecords.filter(r => r.eventId === selectedEventId)
    
    // 개별 목표 금액 반영
    const totalExpected = targetList.reduce((acc, cur) => acc + (cur.expectedAmount ?? selectedEvent.targetAmount), 0)
    
    const collected = targetList.reduce((acc, cur) => acc + cur.paidAmount, 0)
    const uncollected = totalExpected - collected
    
    const paidCount = targetList.filter(r => {
      const target = r.expectedAmount ?? selectedEvent.targetAmount
      return r.paidAmount >= target
    }).length
    
    const rate = targetList.length > 0 ? (paidCount / targetList.length) * 100 : 0
    
    return { total: totalExpected, collected, uncollected, rate, paidCount, totalCount: targetList.length }
  }, [duesRecords, selectedEvent, selectedEventId])

  const handleOpenMemberManage = (mode: 'ADD' | 'REMOVE') => {
    setMemberManageMode(mode)
    setMemberSearchQuery('')
    setSearchResults([])
    setSelectedMembers([])
    setSelectedRemoveIds([])
    setShowMemberManageModal(true)
    
    if (mode === 'ADD') {
      // 추가 모드: 초기화
    }
  }

  const handleSearchMembers = async () => {
    if (memberManageMode === 'ADD') {
      try {
        const response = await getMembers({ keyword: memberSearchQuery, size: 20, status: 'ACTIVE' })
        // 현재 행사에 이미 등록된 인원 제외 (이름 기준 매칭)
        const currentMemberNames = new Set(
          duesRecords
            .filter(r => r.eventId === selectedEventId)
            .map(r => r.memberName)
        )
        
        const filtered = response.content.filter(m => !currentMemberNames.has(m.name))
        setSearchResults(filtered)
      } catch (error) {
        console.error('Failed to search members:', error)
      }
    }
  }

  const handleToggleMemberSelection = (member: Member) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.memberId === member.memberId)
      return isSelected ? prev.filter(m => m.memberId !== member.memberId) : [...prev, member]
    })
  }
  
  const handleToggleRemoveSelection = (recordId?: number) => {
    if (!recordId) return
    setSelectedRemoveIds(prev => 
      prev.includes(recordId) ? prev.filter(id => id !== recordId) : [...prev, recordId]
    )
  }

  const handleSaveMemberManage = async () => {
    if (!selectedEvent) return

    if (memberManageMode === 'ADD') {
       const newRecords: DuesRecordDto[] = selectedMembers.map(member => ({
          eventId: selectedEvent.id,
          memberName: member.name,
          paidAmount: 0,
          expectedAmount: selectedEvent.targetAmount,
          paymentMethod: 'ACCOUNT',
          note: ''
        }))
        
        try {
          await financeService.createDuesRecordsBatch(newRecords)
          await fetchDuesRecords(selectedEvent.id)
        } catch (error) {
          console.error('Failed to add members:', error)
          toast.error('인원 추가에 실패했습니다.')
        }
    } else {
        const isConfirmed = await confirm({
          title: '명단 삭제',
          message: `${selectedRemoveIds.length}명의 명단을 삭제하시겠습니까?`,
          type: 'danger',
          confirmText: '삭제',
          cancelText: '취소',
        })
        if (isConfirmed) {
          try {
             await Promise.all(selectedRemoveIds.map(id => financeService.deleteDuesRecord(id)))
             await fetchDuesRecords(selectedEvent.id)
          } catch (error) {
             console.error('Failed to remove members:', error)
             toast.error('인원 삭제에 실패했습니다.')
          }
        } else {
          return
        }
    }
    
    setShowMemberManageModal(false)
    setSelectedMembers([])
    setSelectedRemoveIds([])
    setMemberSearchQuery('')
    setSearchResults([])
  }

  // Unused function removed

  const handleSearchSchedules = async () => {
    if (!importDate) return
    try {
      const dateObj = new Date(importDate)
      const schedules = await scheduleService.getSchedules(dateObj.getFullYear(), dateObj.getMonth() + 1)
      const filtered = schedules.filter(s => s.startDate.startsWith(importDate))
      setScheduleOptions(filtered)
      if (filtered.length === 0) {
        toast.error('해당 날짜에 일정이 없습니다.')
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
      toast.error('일정을 불러오는데 실패했습니다.')
    }
  }

  const handleSyncMembers = async () => {
    if (!selectedEvent) return
    if (!selectedEvent.scheduleId) {
      toast.error('연동된 일정이 없습니다.')
      return
    }

    try {
      const schedule = await scheduleService.getScheduleDetail(selectedEvent.scheduleId, selectedEvent.targetDate)
      const attendees = schedule.attendees || []
      
      const currentNames = new Set(currentDuesList.map(r => r.memberName))
      const attendeeNames = new Set(attendees.map(a => a.name))

      const toAdd = attendees.filter(a => !currentNames.has(a.name))
      const toRemove = currentDuesList.filter(r => !attendeeNames.has(r.memberName))

      if (toAdd.length === 0 && toRemove.length === 0) {
        toast.error('이미 동기화되어 있습니다.')
        return
      }

      setSyncDiff({ toAdd, toRemove })
      setSelectedSyncAdd(toAdd)
      setSelectedSyncRemove(toRemove)
      setShowSyncModal(true)
    } catch (error) {
      console.error('Failed to sync members:', error)
      toast.error('일정 정보를 불러오는데 실패했습니다.')
    }
  }

  const handleConfirmSync = async () => {
    if (!selectedEvent) return

    try {
      if (selectedSyncAdd.length > 0) {
        const newRecords: DuesRecordDto[] = selectedSyncAdd.map(attendee => ({
          eventId: selectedEvent.id,
          memberName: attendee.name,
          paidAmount: 0,
          expectedAmount: selectedEvent.targetAmount,
          paymentMethod: 'ACCOUNT',
          note: ''
        }))
        await financeService.createDuesRecordsBatch(newRecords)
      }

      if (selectedSyncRemove.length > 0) {
        await Promise.all(selectedSyncRemove.map(r => r.id && financeService.deleteDuesRecord(r.id)))
      }

      await fetchDuesRecords(selectedEvent.id)
      setShowSyncModal(false)
      toast.success('동기화가 완료되었습니다.')
    } catch (error) {
      console.error('Failed to confirm sync:', error)
      toast.error('동기화 처리에 실패했습니다.')
    }
  }

  const handleOpenAddEvent = () => {
    setEditingEventId(null)
    setNewEvent({ 
      name: '', 
      targetAmount: 0, 
      date: new Date().toISOString().split('T')[0],
      targetDate: undefined,
      scheduleId: undefined
    })
    setNewPriceOptions([])
    setIsImportMode(false)
    setIsPriceOptionsOpen(false)
    setShowEventModal(true)
  }

  const handleOpenEditEvent = () => {
    if (!selectedEvent) return
    setEditingEventId(selectedEvent.id)
    setNewEvent({ 
      name: selectedEvent.name, 
      targetAmount: selectedEvent.targetAmount, 
      date: selectedEvent.date,
      targetDate: selectedEvent.targetDate,
      scheduleId: selectedEvent.scheduleId
    })
    setNewPriceOptions(selectedEvent.priceOptions || [])
    setIsImportMode(false)
    setIsPriceOptionsOpen(false)
    setShowEventModal(true)
  }

  const handleSaveEvent = async () => {
    let eventName = newEvent.name
    const targetAmount = newEvent.targetAmount
    let eventDate = newEvent.date
    let scheduleId: string | undefined = newEvent.scheduleId ? String(newEvent.scheduleId) : undefined
    let targetDate = newEvent.targetDate

    if (editingEventId) {
      // 수정 모드
      if (!eventName || targetAmount <= 0) {
        toast.error('행사명과 회비를 입력해주세요.')
        return
      }

      try {
        await financeService.updateDuesEvent(editingEventId, {
          id: editingEventId,
          name: eventName,
          targetAmount: targetAmount,
          date: eventDate,
          targetDate: targetDate,
          scheduleId: scheduleId ? Number(scheduleId) : undefined,
          priceOptions: newPriceOptions.length > 0 ? newPriceOptions : undefined
        })
        
        await fetchDuesEvents()
        setShowEventModal(false)
        setNewEvent({ name: '', targetAmount: 0, date: new Date().toISOString().split('T')[0] })
        setNewPriceOptions([])
        setEditingEventId(null)
      } catch (error) {
        console.error('Failed to update event:', error)
        toast.error('행사 수정에 실패했습니다.')
      }
      return
    }

    // 추가 모드
    if (isImportMode) {
      if (!selectedScheduleIdForImport) {
        toast.error('일정을 선택해주세요.')
        return
      }
      const selectedSchedule = scheduleOptions.find(s => s.scheduleId === selectedScheduleIdForImport)
      if (!selectedSchedule) return
      
      eventName = selectedSchedule.title
      scheduleId = String(selectedSchedule.scheduleId)
      eventDate = importDate
      targetDate = importDate
      
      if (targetAmount <= 0) {
        toast.error('회비를 입력해주세요.')
        return
      }
    } else {
      if (!eventName || targetAmount <= 0) {
        toast.error('행사명과 회비를 입력해주세요.')
        return
      }
    }

    try {
      // 1. 행사 생성
      const createdEventId = await financeService.createDuesEvent({
        id: 0, // 서버에서 생성됨
        name: eventName,
        targetAmount: targetAmount,
        date: eventDate,
        targetDate: targetDate,
        scheduleId: scheduleId ? Number(scheduleId) : undefined,
        priceOptions: newPriceOptions.length > 0 ? newPriceOptions : undefined
      })

      // 2. 초기 명단 생성
      let newRecords: DuesRecordDto[] = []
      
      if (isImportMode && scheduleId) {
        try {
          const detail = await scheduleService.getScheduleDetail(Number(scheduleId), targetDate)
          if (detail.attendees && detail.attendees.length > 0) {
             newRecords = detail.attendees.map(a => ({
              eventId: createdEventId,
              memberName: a.name,
              paidAmount: 0,
              expectedAmount: targetAmount,
              paymentMethod: 'ACCOUNT',
              note: '일정 참석자'
             }))
          } else {
             const isConfirmed = await confirm({
               title: '참석자 없음',
               message: '일정에 등록된 참석자가 없습니다. 전체 인원 명단을 불러오시겠습니까?',
               type: 'warning',
               confirmText: '불러오기',
               cancelText: '취소',
             })
             if (isConfirmed) {
               const membersPage = await getMembers({ size: 1000, status: 'ACTIVE' })
               newRecords = membersPage.content.map(m => ({
                 eventId: createdEventId,
                 memberName: m.name,
                 paidAmount: 0,
                 expectedAmount: targetAmount,
                 paymentMethod: 'ACCOUNT',
                 note: ''
               }))
             }
          }
        } catch (e) {
          console.error('Error importing schedule details', e)
          toast.error('일정 상세 정보를 불러오는데 실패하여 빈 명단으로 생성합니다.')
        }
      }

      if (newRecords.length > 0) {
        await financeService.createDuesRecordsBatch(newRecords)
      }

      await fetchDuesEvents()
      
      // 새로 생성된 행사 선택
      setSelectedEventId(createdEventId)
      
      // 상태 초기화
      setNewEvent({ name: '', targetAmount: 0, date: new Date().toISOString().split('T')[0] })
      setNewPriceOptions([])
      setShowEventModal(false)
      setIsImportMode(false)
      setSelectedScheduleIdForImport(null)
      setScheduleOptions([])

    } catch (error) {
      console.error('Failed to create event:', error)
      toast.error('행사 생성에 실패했습니다.')
    }
  }

  const handleDeleteEvent = async () => {
    const isConfirmed = await confirm({
      title: '행사 삭제',
      message: '정말로 이 행사를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.',
      type: 'danger',
      confirmText: '삭제',
      cancelText: '취소',
    })

    if (!isConfirmed) return

    if (!selectedEventId) return

    try {
      await financeService.deleteDuesEvent(selectedEventId)
      await fetchDuesEvents()
      setShowEventModal(false)
      setEditingEventId(null)
      setSelectedEventId(null)
      toast.success('행사가 삭제되었습니다.')
    } catch (error) {
      console.error('Failed to delete event:', error)
      toast.error('행사 삭제에 실패했습니다.')
    }
  }

  const handleFullPayment = async (record: DuesRecordDto) => {
    if (!record.id || !selectedEvent) return
    
    const target = record.expectedAmount ?? selectedEvent.targetAmount
    const updatedRecord: DuesRecordDto = {
      ...record,
      paidAmount: target,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'ACCOUNT'
    }

    try {
      await financeService.updateDuesRecord(record.id, updatedRecord)
      if (selectedEventId) {
          await fetchDuesRecords(selectedEventId)
      }
    } catch (error) {
      console.error('Failed to update payment:', error)
      toast.error('납부 처리에 실패했습니다.')
    }
  }

  const handleOpenDuesDetail = (record: DuesRecordDto) => {
    setEditingDuesRecord({ ...record })
    setShowDuesDetailModal(true)
  }

  const handleSaveDuesDetail = async () => {
    if (!editingDuesRecord || !editingDuesRecord.id) return
    
    try {
      await financeService.updateDuesRecord(editingDuesRecord.id, editingDuesRecord)
      if (selectedEventId) {
          await fetchDuesRecords(selectedEventId)
      }
      setShowDuesDetailModal(false)
      setEditingDuesRecord(null)
    } catch (error) {
      console.error('Failed to update dues detail:', error)
      toast.error('상세 정보 수정에 실패했습니다.')
    }
  }

  const getDuesStatus = (paid: number, target: number) => {
    if (paid === 0) return { label: '미납', color: 'bg-rose-100 text-rose-700' }
    if (paid < target) return { label: '부분납', color: 'bg-orange-100 text-orange-700' }
    return { label: '완납', color: 'bg-emerald-100 text-emerald-700' }
  }


  // 필터링 로직 및 잔액 계산
  const filteredRecords = useMemo(() => {
    // 1. 전체 데이터를 날짜순 정렬하여 잔액 계산
    const sortedAllRecords = [...records].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      // ID가 문자열이 아닐 수 있으므로 String()으로 변환하여 비교
      return String(a.id).localeCompare(String(b.id))
    })

    let runningBalance = 0
    const recordsWithBalance = sortedAllRecords.map(record => {
      if (record.transactionType === 'INCOME') {
        runningBalance += record.amount
      } else {
        runningBalance -= record.amount
      }
      return { ...record, balance: runningBalance }
    })

    // 2. 필터링 적용
    const result = recordsWithBalance.filter((record) => {
      // 1. 날짜 범위 필터
      if (record.date < generalStartDate || record.date > generalEndDate) {
        return false
      }
      // 2. 유형 필터
      if (filterType !== 'ALL' && record.transactionType !== filterType) {
        return false
      }
      // 3. 검색어 필터 (세부내용 또는 카테고리)
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase()
        return (
          record.detail.toLowerCase().includes(keyword) ||
          record.category.toLowerCase().includes(keyword)
        )
      }
      return true
    })

    // 3. 정렬 적용
    return sortOrder === 'DESC' ? result.reverse() : result
  }, [records, generalStartDate, generalEndDate, filterType, searchKeyword, sortOrder])

  // 대시보드 데이터 계산
  // 1. 차트 데이터 (월별/일별 추이)
  const chartStats = useMemo(() => {
    // 1. 조회 기간 이전까지의 초기 잔액 계산
    let initialBalance = 0
    records.forEach(r => {
      if (r.date < statsStartDate) {
        if (r.transactionType === 'INCOME') initialBalance += r.amount
        else initialBalance -= r.amount
      }
    })

    const stats: Record<string, { name: string; income: number; expense: number; balance: number }> = {}
    
    const start = new Date(statsStartDate)
    const end = new Date(statsEndDate)

    if (statsViewMode === 'MONTHLY') {
      // 월별 집계
      const current = new Date(start.getFullYear(), start.getMonth(), 1)
      while (current <= end) {
        const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
        stats[key] = { name: key, income: 0, expense: 0, balance: 0 }
        current.setMonth(current.getMonth() + 1)
      }

      // 기간 내 수입/지출 집계
      records.forEach(r => {
        if (r.date < statsStartDate || r.date > statsEndDate) return
        
        const date = new Date(r.date)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (stats[key]) {
          if (r.transactionType === 'INCOME') {
            stats[key].income += r.amount
          } else {
            stats[key].expense += r.amount
          }
        }
      })

      // 잔액 누적 계산
      let runningBalance = initialBalance
      Object.keys(stats).sort().forEach(key => {
        const monthIncome = stats[key].income
        const monthExpense = stats[key].expense
        runningBalance += (monthIncome - monthExpense)
        stats[key].balance = runningBalance
      })

    } else {
      // 일별 집계
      const current = new Date(start)
      while (current <= end) {
        const key = current.toISOString().split('T')[0]
        const displayDate = `${current.getMonth() + 1}.${current.getDate()}`
        stats[key] = { name: displayDate, income: 0, expense: 0, balance: 0 }
        current.setDate(current.getDate() + 1)
      }

      // 기간 내 수입/지출 집계
      records.forEach(r => {
        if (r.date < statsStartDate || r.date > statsEndDate) return
        
        const key = r.date // YYYY-MM-DD
        
        if (stats[key]) {
          if (r.transactionType === 'INCOME') {
            stats[key].income += r.amount
          } else {
            stats[key].expense += r.amount
          }
        }
      })

      // 잔액 누적 계산
      let runningBalance = initialBalance
      Object.keys(stats).sort().forEach(key => {
        const dayIncome = stats[key].income
        const dayExpense = stats[key].expense
        runningBalance += (dayIncome - dayExpense)
        stats[key].balance = runningBalance
      })
    }

    return Object.values(stats)
  }, [records, statsStartDate, statsEndDate, statsViewMode])

  // 2. 카테고리별 지출 비중 (선택된 기간 기준)
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {}
    records.forEach(r => {
      // 날짜 필터 적용
      if (r.date < statsStartDate || r.date > statsEndDate) return
      
      if (r.transactionType === 'EXPENSE') {
        stats[r.category] = (stats[r.category] || 0) + r.amount
      }
    })
    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [records, statsStartDate, statsEndDate])

  // 3. 요약 카드 (선택된 기간)
  const summaryStats = useMemo(() => {
    let income = 0
    let expense = 0
    
    records.forEach(r => {
      if (r.date >= statsStartDate && r.date <= statsEndDate) {
        if (r.transactionType === 'INCOME') income += r.amount
        else expense += r.amount
      }
    })

    return {
      income,
      expense,
      balance: income - expense
    }
  }, [records, statsStartDate, statsEndDate])

  const handleAddCategory = async () => {
    if (!categoryInput.trim()) return
    
    const list = categoryManageType === 'INCOME' ? incomeCategories : expenseCategories
    if (list.some(c => c.name === categoryInput)) {
      toast.error('이미 존재하는 항목입니다.')
      return
    }

    try {
      await financeService.createCategory({
        name: categoryInput,
        type: categoryManageType
      })
      setCategoryInput('')
      fetchCategories()
    } catch (error) {
      console.error('Failed to add category:', error)
      toast.error('항목 추가 실패')
    }
  }

  const handleDeleteCategory = async (category: CategoryDto) => {
    if (!category.id) return
    const isConfirmed = await confirm({
      title: '항목 삭제',
      message: `'${category.name}' 항목을 삭제하시겠습니까?`,
      type: 'danger',
      confirmText: '삭제',
      cancelText: '취소',
    })
    if (!isConfirmed) return

    try {
      await financeService.deleteCategory(category.id)
      fetchCategories()
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast.error('항목 삭제 실패')
    }
  }

  const handleCreate = async () => {
    setEditingRecord(null)
    const { income } = await fetchCategories()
    setFormData({
      date: new Date().toISOString().split('T')[0],
      transactionType: 'INCOME',
      category: income[0]?.name || '',
      detail: '',
      amount: 0,
      receiptImages: []
    })
    setShowModal(true)
  }

  const handleEdit = (record: FinanceRecord) => {
    setEditingRecord(record)
    setFormData({
      date: record.date,
      transactionType: record.transactionType,
      category: record.category,
      detail: record.detail,
      amount: record.amount,
      receiptImages: record.receiptImages
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string | number) => {
    const isConfirmed = await confirm({
      title: '기록 삭제',
      message: '재정 기록을 삭제하시겠습니까?',
      type: 'danger',
      confirmText: '삭제',
      cancelText: '취소',
    })
    if (!isConfirmed) return
    
    try {
      await financeService.deleteFinance(Number(id))
      fetchFinances()
    } catch (error) {
      console.error('Failed to delete finance:', error)
      toast.error('삭제 실패')
    }
  }

  const handleSave = async () => {
    if (formData.amount <= 0) {
      toast.error('금액을 올바르게 입력해주세요.')
      return
    }

    try {
      const requestData: FinanceRequestDto = {
        date: formData.date,
        transactionType: formData.transactionType,
        category: formData.category,
        detail: formData.detail || '',
        amount: formData.amount,
        receiptImages: formData.receiptImages
      }

      if (editingRecord) {
        await financeService.updateFinance(Number(editingRecord.id), requestData)
      } else {
        await financeService.createFinance(requestData)
      }
      
      fetchFinances()
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save finance:', error)
      toast.error('저장 실패')
    }
  }

  // 엑셀 내보내기 핸들러
  const handleExcelExport = async () => {
    try {
      // 라이브러리 동적 로드
      const ExcelJS = await import('exceljs')
      const { saveAs } = await import('file-saver')
      const JSZip = (await import('jszip')).default

      const zip = new JSZip()
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('재정기록')

      // 영수증 폴더 생성
      const receiptFolder = zip.folder('영수증')

      // 컬럼 설정
      worksheet.columns = [
        { header: '날짜', key: 'date', width: 12 },
        { header: '구분', key: 'transactionType', width: 8 },
        { header: '카테고리', key: 'category', width: 15 },
        { header: '세부내용', key: 'detail', width: 40 },
        { header: '수 입', key: 'income', width: 15, style: { numFmt: '#,##0' } },
        { header: '지 출', key: 'expense', width: 15, style: { numFmt: '#,##0' } },
        { header: '잔 액', key: 'balance', width: 15, style: { numFmt: '#,##0' } },
        { header: '첨부파일', key: 'receiptFiles', width: 50 },
      ]

      // 헤더 스타일
      const headerRow = worksheet.getRow(1)
      headerRow.font = { bold: true }
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
      headerRow.height = 24

      // 데이터 추가
      for (const record of filteredRecords) {
        const receiptFileNames: string[] = []

        // 영수증 이미지 처리
        if (record.receiptImages && record.receiptImages.length > 0 && receiptFolder) {
          for (let idx = 0; idx < record.receiptImages.length; idx++) {
            const imgData = record.receiptImages[idx]
            let filename = ''
            let data: Blob | string | null = null
            let isBase64 = false

            // 파일명 생성 기본값
            const safeDate = record.date.replace(/-/g, '')
            const safeCategory = record.category.replace(/[\\/:*?"<>|]/g, '_')
            const safeDetail = record.detail.replace(/[\\/:*?"<>|]/g, '_').substring(0, 15)

            if (imgData.startsWith('data:image')) {
              const match = imgData.match(/^data:image\/(png|jpeg|jpg);base64,(.*)$/)
              if (match) {
                const ext = match[1] === 'jpg' ? 'jpeg' : match[1]
                filename = `${safeDate}_${safeCategory}_${safeDetail}_${idx + 1}.${ext}`
                data = match[2]
                isBase64 = true
              }
            } else if (imgData.startsWith('http')) {
              try {
                const response = await fetch(imgData)
                const blob = await response.blob()
                let ext = 'jpg'
                if (blob.type === 'image/png') ext = 'png'
                else if (blob.type === 'image/jpeg') ext = 'jpeg'
                else if (blob.type === 'image/gif') ext = 'gif'
                
                filename = `${safeDate}_${safeCategory}_${safeDetail}_${idx + 1}.${ext}`
                data = blob
              } catch (e) {
                console.error('Failed to fetch image for export:', imgData, e)
              }
            }

            if (filename && data) {
              receiptFolder.file(filename, data, isBase64 ? { base64: true } : undefined)
              receiptFileNames.push(filename)
            }
          }
        }

        const row = worksheet.addRow({
          date: record.date,
          transactionType: record.transactionType === 'INCOME' ? '수입' : '지출',
          category: record.category,
          detail: record.detail,
          income: record.transactionType === 'INCOME' ? record.amount : 0,
          expense: record.transactionType === 'EXPENSE' ? record.amount : 0,
          balance: record.balance,
          receiptFiles: receiptFileNames.join(', ')
        })

        // 셀 스타일 정렬
        row.getCell('date').alignment = { vertical: 'middle', horizontal: 'center' }
        row.getCell('transactionType').alignment = { vertical: 'middle', horizontal: 'center' }
        row.getCell('category').alignment = { vertical: 'middle', horizontal: 'center' }
        row.getCell('detail').alignment = { vertical: 'middle', horizontal: 'left' }
        row.getCell('income').alignment = { vertical: 'middle', horizontal: 'right' }
        row.getCell('expense').alignment = { vertical: 'middle', horizontal: 'right' }
        row.getCell('balance').alignment = { vertical: 'middle', horizontal: 'right' }
        row.getCell('receiptFiles').alignment = { vertical: 'middle', horizontal: 'left' }
      }

      // 엑셀 파일 생성
      const excelBuffer = await workbook.xlsx.writeBuffer()
      zip.file('재정기록.xlsx', excelBuffer)

      // ZIP 파일 생성 및 다운로드
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const fileName = `재정기록_및_영수증_${new Date().toISOString().split('T')[0]}.zip`
      saveAs(zipBlob, fileName)

    } catch (error) {
      console.error('Export failed:', error)
      toast.error('내보내기 중 오류가 발생했습니다.')
    }
  }

  // 엑셀 업로드 핸들러
  const handleExcelImportClick = () => {
    setShowGuideModal(true)
  }

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[]

      // 데이터 매핑 및 변환
      const parsedRecords: FinanceRecord[] = data.map((row, index) => {
        // 날짜 파싱 (2026. 1. 4 형식 또는 기존 형식)
        let date = new Date().toISOString().split('T')[0]
        const rawDate = row['날짜']
        if (rawDate) {
          const dateStr = String(rawDate).trim()
          // "2026. 1. 4" 형식 체크
          if (dateStr.includes('.')) {
            const parts = dateStr.split('.').map(p => p.trim()).filter(p => p)
            if (parts.length === 3) {
              const year = parts[0]
              const month = parts[1].padStart(2, '0')
              const day = parts[2].padStart(2, '0')
              date = `${year}-${month}-${day}`
            }
          } else {
            date = dateStr
          }
        }

        const transactionType = row['구분'] === '지출' ? 'EXPENSE' : 'INCOME'
        
        // 금액 처리 (수입/지출 컬럼 확인 및 콤마 제거)
        let amount = 0
        const incomeStr = row['수 입']
        const expenseStr = row['지 출']
        const amountStr = row['금 액'] || row['금액'] // 기존 양식 호환

        if (incomeStr) {
          amount = Number(String(incomeStr).replace(/,/g, ''))
        } else if (expenseStr) {
          amount = Number(String(expenseStr).replace(/,/g, ''))
        } else if (amountStr) {
          amount = Number(String(amountStr).replace(/,/g, ''))
        }

        return {
          id: `imported-${Date.now()}-${index}`,
          date,
          transactionType,
          category: String(row['항 목'] || row['카테고리'] || '기타'),
          detail: String(row['세부내용'] || row['제목'] || ''),
          amount: amount || 0,
          balance: 0,
          receiptImages: []
        }
      })

      setPreviewRecords(parsedRecords)
      setShowGuideModal(false)
      setShowPreviewModal(true)
    }
    reader.readAsBinaryString(file)
  }

  const handleSavePreview = async () => {
    try {
      // 1. 새로운 카테고리 확인 및 등록
      const newIncomeCategories = new Set<string>()
      const newExpenseCategories = new Set<string>()

      previewRecords.forEach(record => {
        const categoryName = record.category.trim()
        if (!categoryName) return

        if (record.transactionType === 'INCOME') {
          if (!incomeCategories.some(c => c.name === categoryName)) {
            newIncomeCategories.add(categoryName)
          }
        } else {
          if (!expenseCategories.some(c => c.name === categoryName)) {
            newExpenseCategories.add(categoryName)
          }
        }
      })

      // 새로운 카테고리 생성 요청
      const categoryPromises: Promise<unknown>[] = []
      
      newIncomeCategories.forEach(name => {
        categoryPromises.push(financeService.createCategory({ name, type: 'INCOME' }))
      })
      
      newExpenseCategories.forEach(name => {
        categoryPromises.push(financeService.createCategory({ name, type: 'EXPENSE' }))
      })

      if (categoryPromises.length > 0) {
        await Promise.all(categoryPromises)
        await fetchCategories() // 카테고리 목록 갱신
      }

      // 2. 재정 기록 일괄 등록
      const requestData: FinanceRequestDto[] = previewRecords.map(record => ({
        date: record.date,
        transactionType: record.transactionType,
        category: record.category,
        detail: record.detail,
        amount: record.amount,
        receiptImages: record.receiptImages || []
      }))

      await financeService.createFinancesBatch(requestData)
      
      const message = categoryPromises.length > 0
        ? `${previewRecords.length}건의 데이터와 신규 카테고리 ${categoryPromises.length}개가 등록되었습니다.`
        : `${previewRecords.length}건의 데이터가 성공적으로 등록되었습니다.`
      
      toast.success(message)
      fetchFinances() // 목록 새로고침
      setShowPreviewModal(false)
      setPreviewRecords([])
    } catch (error) {
      console.error('Failed to batch upload finances:', error)
      toast.error('일괄 등록에 실패했습니다.')
    }
  }

  const transactionTypeColors = {
    INCOME: 'bg-blue-50 text-blue-700',
    EXPENSE: 'bg-rose-50 text-rose-700',
  }

  // Unused function removed

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
              ← 
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-xl">
                💰
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">재정관리</p>
                <p className="text-xs text-slate-500">헌금 및 예산 관리</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".xlsx, .xls" 
              className="hidden" 
            />

            <button
              type="button"
              onClick={handleExcelImportClick}
              className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              📊 Excel 일괄 등록
            </button>
            <button
              type="button"
              onClick={handleExcelExport}
              className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              📥 Excel 내보내기
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-full bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
            >
              + 기록 추가
            </button>
          </div>
        </header>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'GENERAL'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            일반 재정
          </button>
           <button
             onClick={() => setActiveTab('STATS')}
             className={`px-6 py-3 text-sm font-semibold transition-colors ${
               activeTab === 'STATS'
                 ? 'border-b-2 border-amber-500 text-amber-600'
                 : 'text-slate-500 hover:text-slate-700'
             }`}
           >
             통계
           </button>
          <button
            onClick={() => setActiveTab('DUES')}
            className={`px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'DUES'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            회비 관리
          </button>
        </div>

        {activeTab === 'GENERAL' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-end">
            <div className="flex flex-1 gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-slate-700">시작일</label>
                <input
                  type="date"
                  value={generalStartDate}
                  onChange={(e) => setGeneralStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-slate-700">종료일</label>
                <input
                  type="date"
                  value={generalEndDate}
                  onChange={(e) => setGeneralEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            
            <div className="flex flex-1 gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-slate-700">유형</label>
                <div className="flex rounded-lg bg-slate-100 p-1">
                  {(['ALL', 'INCOME', 'EXPENSE'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-all ${
                        filterType === type
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {type === 'ALL' ? '전체' : type === 'INCOME' ? '수입' : '지출'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-24">
                <label className="mb-1 block text-xs font-semibold text-slate-700">정렬</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="DESC">최신순</option>
                  <option value="ASC">과거순</option>
                </select>
              </div>
              <div className="flex-[1.5]">
                <label className="mb-1 block text-xs font-semibold text-slate-700">검색</label>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="세부내용, 카테고리 검색"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-700">날짜</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-700">구분</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-700">항 목</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-700">세부내용</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-slate-700">수 입</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-slate-700">지 출</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-slate-700">잔 액</th>
                    <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold text-slate-700">영수증</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-slate-700">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{record.date}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${transactionTypeColors[record.transactionType]}`}>
                            {record.transactionType === 'INCOME' ? '수입' : '지출'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{record.category}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                          {record.detail}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-blue-600">
                          {record.transactionType === 'INCOME' ? `${record.amount.toLocaleString()}원` : '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-rose-600">
                          {record.transactionType === 'EXPENSE' ? `${record.amount.toLocaleString()}원` : '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-slate-900">
                          {record.balance.toLocaleString()}원
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          {record.receiptImages && record.receiptImages.length > 0 ? (
                            <button
                              onClick={() => handleViewReceipts(record.receiptImages!)}
                              className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                            >
                              🧾 {record.receiptImages.length}장
                            </button>
                          ) : (
                            <span className="text-xs text-slate-300">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={(e) => handleMenuClick(e, record.id)}
                              className="flex items-center justify-center rounded-full p-2 text-slate-500 hover:bg-slate-100"
                            >
                              <span className="text-xl leading-none font-bold">⋮</span>
                            </button>

                            {openMenuId === record.id && menuPosition && (
                              <>
                                <div 
                                  className="fixed inset-0 z-50" 
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div 
                                  className="fixed z-50 w-24 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                  style={{
                                    top: menuPosition.top,
                                    bottom: menuPosition.bottom,
                                    left: menuPosition.left
                                  }}
                                >
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleEdit(record)
                                        setOpenMenuId(null)
                                      }}
                                      className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                    >
                                      수정
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDelete(record.id)
                                        setOpenMenuId(null)
                                      }}
                                      className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-slate-100"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-sm text-slate-500">
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {activeTab === 'STATS' && (
          <div className="space-y-4">
            {/* 날짜 필터 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex flex-1 gap-4">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">시작일</label>
                    <input
                      type="date"
                      value={statsStartDate}
                      onChange={(e) => setStatsStartDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">종료일</label>
                    <input
                      type="date"
                      value={statsEndDate}
                      onChange={(e) => setStatsEndDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="w-24">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">보기 방식</label>
                    <select
                      value={statsViewMode}
                      onChange={(e) => setStatsViewMode(e.target.value as 'MONTHLY' | 'DAILY')}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="MONTHLY">월별</option>
                      <option value="DAILY">일별</option>
                    </select>
                  </div>
                </div>
                <div className="text-xs text-slate-500 pb-2">
                  * 선택한 기간에 해당하는 통계가 표시됩니다.
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">기간 수입</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-blue-600">
                    {summaryStats.income.toLocaleString()}원
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">기간 지출</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-rose-600">
                    {summaryStats.expense.toLocaleString()}원
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">기간 잔액</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className={`text-2xl font-bold ${summaryStats.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                    {summaryStats.balance.toLocaleString()}원
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-slate-900">{statsViewMode === 'MONTHLY' ? '월별' : '일별'} 수입/지출 추이 (조회 기간)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 10000}만`} />
                      <Tooltip 
                        formatter={(value: any) => value.toLocaleString() + '원'}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="income" name="수입" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="expense" name="지출" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-slate-900">지출 카테고리 비중 (조회 기간)</h3>
                <div className="h-64">
                  {categoryStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                        >
                          {categoryStats.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => {
                            const total = summaryStats.expense
                            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                            return [`${value.toLocaleString()}원 (${percent}%)`, '금액']
                          }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      지출 내역이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-slate-900">{statsViewMode === 'MONTHLY' ? '월별' : '일별'} 잔액 추이 (조회 기간)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickFormatter={(value) => {
                        if (statsViewMode === 'MONTHLY') return value.split('-')[1] + '월'
                        return value
                      }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickFormatter={(value) => `${(value / 10000).toLocaleString()}만`}
                    />
                    <Tooltip 
                      formatter={(value: number | undefined) => [`${(value || 0).toLocaleString()}원`, '잔액']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      name="잔액" 
                      stroke="#0ea5e9" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* 회비 관리 탭 컨텐츠 */}
        {activeTab === 'DUES' && (
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* 좌측: 행사 목록 */}
            <div className="w-full lg:w-64 flex-shrink-0">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">행사 목록</h3>
                  <button 
                    onClick={handleOpenAddEvent}
                    className="rounded-full p-1.5 text-amber-600 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
                <div className="space-y-2">
                  {duesEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEventId(event.id)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        selectedEventId === event.id
                          ? 'bg-amber-50 font-semibold text-amber-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {event.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 우측: 납부 명단 테이블 */}
            <div className="flex-1 space-y-6">
              {/* 대시보드 */}
              {selectedEvent && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{selectedEvent.name} 수금 현황</h3>
                      <p className="text-xs text-slate-500">1인당 회비: {selectedEvent.targetAmount.toLocaleString()}원</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <button
                          onClick={() => setShowEventMenu(!showEventMenu)}
                          className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
                        >
                          <span className="text-xl leading-none font-bold">⋮</span>
                        </button>
                        {showEventMenu && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setShowEventMenu(false)}
                            />
                            <div className="absolute right-0 top-full z-20 mt-1 w-24 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleOpenEditEvent()
                                    setShowEventMenu(false)
                                  }}
                                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteEvent()
                                    setShowEventMenu(false)
                                  }}
                                  className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-slate-100"
                                >
                                  삭제
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="mb-1 flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">수금률 {duesStats.rate.toFixed(1)}%</span>
                      <span className="text-slate-600">{duesStats.paidCount}/{duesStats.totalCount}명 완납</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100">
                      <div 
                        className="h-2.5 rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${duesStats.rate}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xs text-slate-500">총 예상 금액</p>
                      <p className="font-bold text-slate-900">{duesStats.total.toLocaleString()}원</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">현재 수금액</p>
                      <p className="font-bold text-blue-600">{duesStats.collected.toLocaleString()}원</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">미수금액</p>
                      <p className="font-bold text-rose-600">{duesStats.uncollected.toLocaleString()}원</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 p-4">
                  <input
                    type="text"
                    placeholder="이름 검색"
                    value={duesSearch}
                    onChange={(e) => setDuesSearch(e.target.value)}
                    className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenMemberManage('ADD')}
                      className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                    >
                      + 인원 추가
                    </button>
                    <button
                      onClick={() => handleOpenMemberManage('REMOVE')}
                      className="rounded-lg bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200"
                    >
                      - 인원 삭제
                    </button>
                    <button
                      onClick={handleSyncMembers}
                      className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      ↻ 인원 동기화
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">이름</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">납부금액 / 목표</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">상태</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">납부방법</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">납부일</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">비고</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {currentDuesList.map(record => {
                        const target = record.expectedAmount ?? selectedEvent?.targetAmount ?? 0
                        const status = getDuesStatus(record.paidAmount, target)
                        return (
                          <tr key={record.id} className="hover:bg-slate-50">
                            <td 
                              className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-900 underline decoration-slate-400 decoration-dotted underline-offset-4 hover:text-amber-600 hover:decoration-amber-600"
                              onClick={() => handleOpenDuesDetail(record)}
                            >
                              {record.memberName}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {record.paidAmount.toLocaleString()} / {target.toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${status.color}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {record.paymentMethod === 'ACCOUNT' ? '계좌이체' : '현금'}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{record.paymentDate || '-'}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{record.note}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                {status.label !== '완납' && (
                                  <button
                                    onClick={() => handleFullPayment(record)}
                                    className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                                  >
                                    완납 처리
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 인원 관리 모달 (추가/삭제 통합) */}
        {showMemberManageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {memberManageMode === 'ADD' ? '인원 추가' : '인원 삭제'}
              </h3>
              
              {memberManageMode === 'ADD' && (
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="이름으로 검색"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchMembers()}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleSearchMembers}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    검색
                  </button>
                </div>
              )}

              <div className="mb-4 h-60 overflow-y-auto rounded-lg border border-slate-200">
                {memberManageMode === 'ADD' ? (
                  searchResults.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {searchResults.map(member => {
                        const isSelected = selectedMembers.some(m => m.memberId === member.memberId)
                        return (
                          <div 
                            key={member.memberId}
                            onClick={() => handleToggleMemberSelection(member)}
                            className={`flex cursor-pointer items-center justify-between p-3 transition-colors ${
                              isSelected ? 'bg-amber-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                              <p className="text-xs text-slate-500">{member.phone}</p>
                            </div>
                            {isSelected && (
                              <span className="text-amber-600">✓</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      검색 결과가 없습니다.
                    </div>
                  )
                ) : (
                  currentDuesList.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {currentDuesList.map(record => (
                        <div 
                          key={record.id}
                          onClick={() => handleToggleRemoveSelection(record.id)}
                          className={`flex cursor-pointer items-center justify-between p-3 transition-colors ${
                            record.id && selectedRemoveIds.includes(record.id) ? 'bg-rose-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{record.memberName}</p>
                            <p className="text-xs text-slate-500">{record.paidAmount.toLocaleString()}원 납부</p>
                          </div>
                          {record.id && selectedRemoveIds.includes(record.id) && (
                            <span className="text-rose-600">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      등록된 명단이 없습니다.
                    </div>
                  )
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowMemberManageModal(false)
                    setSelectedMembers([])
                    setSelectedRemoveIds([])
                    setMemberSearchQuery('')
                    setSearchResults([])
                  }}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveMemberManage}
                  disabled={memberManageMode === 'ADD' ? selectedMembers.length === 0 : selectedRemoveIds.length === 0}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                    memberManageMode === 'ADD' 
                      ? 'bg-amber-600 hover:bg-amber-700' 
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {memberManageMode === 'ADD' 
                    ? `${selectedMembers.length}명 추가` 
                    : `${selectedRemoveIds.length}명 삭제`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 인원 동기화 모달 */}
        {showSyncModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                인원 동기화
              </h3>
              
              <div className="mb-6 space-y-4">
                <p className="text-sm text-slate-600">
                  연동된 일정의 참석자 명단과 현재 회비 명단을 비교하여 동기화합니다.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-blue-600">추가될 인원 ({syncDiff.toAdd.length}명)</p>
                      <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSyncAdd.length === syncDiff.toAdd.length && syncDiff.toAdd.length > 0}
                          onChange={(e) => setSelectedSyncAdd(e.target.checked ? syncDiff.toAdd : [])}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        전체
                      </label>
                    </div>
                    <div className="h-40 overflow-y-auto text-sm text-slate-600">
                      {syncDiff.toAdd.length > 0 ? (
                        <ul className="space-y-1">
                          {syncDiff.toAdd.map((m, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedSyncAdd.some(s => s.memberId === m.memberId)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSyncAdd(prev => [...prev, m])
                                  } else {
                                    setSelectedSyncAdd(prev => prev.filter(s => s.memberId !== m.memberId))
                                  }
                                }}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>{m.name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-400">없음</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-rose-600">삭제될 인원 ({syncDiff.toRemove.length}명)</p>
                      <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSyncRemove.length === syncDiff.toRemove.length && syncDiff.toRemove.length > 0}
                          onChange={(e) => setSelectedSyncRemove(e.target.checked ? syncDiff.toRemove : [])}
                          className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                        />
                        전체
                      </label>
                    </div>
                    <div className="h-40 overflow-y-auto text-sm text-slate-600">
                      {syncDiff.toRemove.length > 0 ? (
                        <ul className="space-y-1">
                          {syncDiff.toRemove.map((m, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedSyncRemove.some(s => s.id === m.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSyncRemove(prev => [...prev, m])
                                  } else {
                                    setSelectedSyncRemove(prev => prev.filter(s => s.id !== m.id))
                                  }
                                }}
                                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                              />
                              <span>{m.memberName}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-400">없음</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmSync}
                  className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  동기화 적용
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 납부 상세 모달 */}
        {showDuesDetailModal && editingDuesRecord && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {editingDuesRecord.memberName} 납부 상세
              </h3>
              
              <div className="space-y-4">
                {selectedEvent.priceOptions && selectedEvent.priceOptions.length > 0 && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-700">회비 옵션 적용</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setEditingDuesRecord({ 
                          ...editingDuesRecord, 
                          expectedAmount: selectedEvent.targetAmount 
                        })}
                        className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                          (!editingDuesRecord.expectedAmount || editingDuesRecord.expectedAmount === selectedEvent.targetAmount)
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        기본 ({selectedEvent.targetAmount.toLocaleString()}원)
                      </button>
                      {selectedEvent.priceOptions?.map(opt => (
                        <button
                            key={String(opt.optionId)}
                            onClick={() => setEditingDuesRecord({ 
                              ...editingDuesRecord, 
                              expectedAmount: opt.amount 
                            })}
                            className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                              editingDuesRecord.expectedAmount === opt.amount
                                ? 'bg-slate-800 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                          {opt.name} ({opt.amount.toLocaleString()}원)
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">회비 금액 (목표)</label>
                  <div className="w-full rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 flex justify-between items-center">
                    <span>{(editingDuesRecord.expectedAmount ?? selectedEvent.targetAmount).toLocaleString()}원</span>
                    {editingDuesRecord.expectedAmount && editingDuesRecord.expectedAmount !== selectedEvent.targetAmount && (
                       <span className="text-xs text-amber-600 font-medium">옵션 적용됨</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">납부 금액</label>
                  <input
                    type="number"
                    value={editingDuesRecord.paidAmount}
                    onChange={(e) => setEditingDuesRecord({ ...editingDuesRecord, paidAmount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <div className="mt-1 flex gap-2">
                     <button
                       type="button"
                       onClick={() => setEditingDuesRecord({ ...editingDuesRecord, paidAmount: editingDuesRecord.expectedAmount ?? selectedEvent.targetAmount })}
                       className="text-xs text-blue-600 underline"
                     >
                       전액 입력
                     </button>
                     <button
                       type="button"
                       onClick={() => setEditingDuesRecord({ ...editingDuesRecord, paidAmount: 0 })}
                       className="text-xs text-rose-600 underline"
                     >
                       0원 (미납)
                     </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">납부 방법</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={editingDuesRecord.paymentMethod === 'ACCOUNT'}
                        onChange={() => setEditingDuesRecord({ ...editingDuesRecord, paymentMethod: 'ACCOUNT' })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-slate-700">계좌이체</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={editingDuesRecord.paymentMethod === 'CASH'}
                        onChange={() => setEditingDuesRecord({ ...editingDuesRecord, paymentMethod: 'CASH' })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-slate-700">현금</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">납부일</label>
                  <input
                    type="date"
                    value={editingDuesRecord.paymentDate}
                    onChange={(e) => setEditingDuesRecord({ ...editingDuesRecord, paymentDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                     type="button"
                     onClick={() => setEditingDuesRecord({ ...editingDuesRecord, paymentDate: new Date().toISOString().split('T')[0] })}
                     className="mt-1 text-xs text-slate-500 underline"
                  >
                    오늘 날짜 입력
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">비고</label>
                  <textarea
                    value={editingDuesRecord.note}
                    onChange={(e) => setEditingDuesRecord({ ...editingDuesRecord, note: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={2}
                    placeholder="분납 사유 등 메모"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setShowDuesDetailModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveDuesDetail}
                  className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 생성/수정 모달 */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {editingRecord ? '재정 기록 수정' : '재정 기록 추가'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">날짜 *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">구분</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="transactionType"
                        checked={formData.transactionType === 'INCOME'}
                        onChange={() => setFormData({ ...formData, transactionType: 'INCOME', category: incomeCategories[0]?.name || '' })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-slate-700">수입</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="transactionType"
                        checked={formData.transactionType === 'EXPENSE'}
                        onChange={() => setFormData({ ...formData, transactionType: 'EXPENSE', category: expenseCategories[0]?.name || '' })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-slate-700">지출</span>
                    </label>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">항 목</label>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryManageType(formData.transactionType)
                        setCategoryInput('')
                        setShowCategoryManageModal(true)
                      }}
                      className="text-xs text-slate-500 underline hover:text-slate-700"
                    >
                      항목 편집
                    </button>
                  </div>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {(formData.transactionType === 'INCOME' ? incomeCategories : expenseCategories).map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">세부내용 *</label>
                  <input
                    type="text"
                    value={formData.detail}
                    onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="예: 1월 첫주 주일헌금"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">금액 (원) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    min="0"
                  />
                </div>
                {formData.transactionType === 'EXPENSE' && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">영수증 (여러 장 선택 가능)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={async (e) => {
                          const files = e.target.files
                          if (!files || files.length === 0) return
                          
                          try {
                            const fileList = Array.from(files)
                            const uploadedFiles = await uploadFiles(fileList, 'finance')
                            const newUrls = uploadedFiles.map(f => f.url)
                            
                            setFormData(prev => ({ 
                              ...prev, 
                              receiptImages: [...(prev.receiptImages || []), ...newUrls] 
                            }))
                          } catch (error) {
                            console.error('Failed to upload receipt images:', error)
                            toast.error('영수증 이미지 업로드에 실패했습니다.')
                          }
                          
                          e.target.value = ''
                        }}
                        className="w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                      />
                    </div>
                    {formData.receiptImages && formData.receiptImages.length > 0 && (
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {formData.receiptImages.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={getFileUrl(img)} 
                              alt={`Receipt ${idx + 1}`} 
                              className="h-20 w-full rounded-lg object-cover"
                            />
                            <button 
                              type="button"
                              onClick={() => setFormData(prev => ({ 
                                ...prev, 
                                receiptImages: prev.receiptImages?.filter((_, i) => i !== idx) 
                              }))}
                              className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <span className="text-xs">✕</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Excel 양식 안내 모달 */}
        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-2 text-lg font-semibold text-slate-900">
                Excel 업로드 양식 안내
              </h3>
              <p className="mb-4 text-sm text-slate-500">
                아래 표의 헤더(첫 번째 줄)와 데이터 형식을 맞춰서 엑셀 파일을 작성해주세요.
              </p>
              
              <div className="mb-6 overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-2 text-left font-semibold text-slate-700">날짜</th>
                      <th className="whitespace-nowrap px-4 py-2 text-left font-semibold text-slate-700">구분</th>
                      <th className="whitespace-nowrap px-4 py-2 text-left font-semibold text-slate-700">항 목</th>
                      <th className="whitespace-nowrap px-4 py-2 text-left font-semibold text-slate-700">세부내용</th>
                      <th className="whitespace-nowrap px-4 py-2 text-right font-semibold text-slate-700">수 입</th>
                      <th className="whitespace-nowrap px-4 py-2 text-right font-semibold text-slate-700">지 출</th>
                      <th className="whitespace-nowrap px-4 py-2 text-right font-semibold text-slate-700">잔 액</th>
                      <th className="whitespace-nowrap px-4 py-2 text-left font-semibold text-slate-700">영수증</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-600">2026. 1. 4</td>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-600">수입</td>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-600">주일헌금</td>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-600">1월 첫주 주일헌금</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-slate-600">50,000</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-slate-600"></td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-slate-600">1,050,000</td>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-600"></td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-600">2026. 1. 7</td>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-600">지출</td>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-600">식비</td>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-600">청년부 회식비</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-slate-600"></td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-slate-600">120,000</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-slate-600">930,000</td>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-600">영수증 첨부</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleFileSelect}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  📁 파일 선택하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Excel 미리보기 모달 */}
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                Excel 데이터 미리보기
              </h3>
              <div className="flex-1 overflow-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">날짜</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">구분</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">항 목</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">세부내용</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-700">금액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-sm text-slate-600">{record.date}</td>
                        <td className="px-4 py-2">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${transactionTypeColors[record.transactionType]}`}>
                            {record.transactionType === 'INCOME' ? '수입' : '지출'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-600">{record.category}</td>
                        <td className="px-4 py-2 text-sm font-medium text-slate-900">{record.detail}</td>
                        <td className={`px-4 py-2 text-right text-sm font-semibold ${
                          record.transactionType === 'INCOME' ? 'text-blue-600' : 'text-rose-600'
                        }`}>
                          {record.amount.toLocaleString()}원
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewModal(false)
                    setPreviewRecords([])
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSavePreview}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                >
                  {previewRecords.length}건 등록하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 행사 추가/수정 모달 */}
        {showEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {editingEventId ? '행사 수정' : '새 행사 추가'}
              </h3>
              
              {!editingEventId && (
                <div className="mb-4 flex rounded-lg bg-slate-100 p-1">
                  <button
                    className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${!isImportMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setIsImportMode(false)}
                  >
                    직접 입력
                  </button>
                  <button
                    className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${isImportMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setIsImportMode(true)}
                  >
                    일정에서 불러오기
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {isImportMode ? (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">날짜 검색</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={importDate}
                          onChange={(e) => setImportDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <button
                          onClick={handleSearchSchedules}
                          className="shrink-0 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-200"
                        >
                          조회
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">일정 선택</label>
                      <select
                        value={selectedScheduleIdForImport || ''}
                        onChange={(e) => setSelectedScheduleIdForImport(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        disabled={scheduleOptions.length === 0}
                      >
                        <option value="">일정을 선택하세요</option>
                        {scheduleOptions.map(s => (
                          <option key={s.scheduleId} value={s.scheduleId}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">행사명</label>
                      <input
                        type="text"
                        value={newEvent.name}
                        onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                        placeholder="예: 2024 여름 수련회"
                        disabled={!!newEvent.scheduleId}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">행사 날짜</label>
                      <input
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                        disabled={!!newEvent.scheduleId}
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">1인당 회비</label>
                  <input
                    type="number"
                    value={newEvent.targetAmount}
                    onChange={(e) => setNewEvent({ ...newEvent, targetAmount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="금액 입력"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPriceOptionsOpen(!isPriceOptionsOpen)}
                    className="flex w-full items-center justify-between py-2 text-left hover:bg-slate-50 rounded-lg px-1 -mx-1 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <label className="block text-xs font-semibold text-slate-700 cursor-pointer">회비 옵션 설정 (선택)</label>
                      <span className="text-[10px] text-slate-400 font-normal">얼리버드, 부분참석 등</span>
                    </div>
                    <span className={`text-slate-400 text-xs transition-transform duration-200 ${isPriceOptionsOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {isPriceOptionsOpen && (
                    <div className="mt-3 animate-in slide-in-from-top-1 fade-in duration-200">
                      <div className="mb-3 space-y-2">
                        {newPriceOptions.length > 0 ? (
                          newPriceOptions.map(opt => (
                            <div key={opt.optionId} className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm hover:border-amber-200 transition-colors">
                              <span className="font-medium text-slate-700">{opt.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-600 font-medium">{opt.amount.toLocaleString()}원</span>
                                <button 
                                  onClick={() => setNewPriceOptions(prev => prev.filter(p => p.optionId !== opt.optionId))}
                                  className="flex h-5 w-5 items-center justify-center rounded-full text-slate-300 hover:bg-rose-100 hover:text-rose-500 transition-colors"
                                  title="삭제"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
                            추가된 옵션이 없습니다.
                          </div>
                        )}
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="옵션명 (예: 얼리버드)"
                              value={optionInput.name}
                              onChange={(e) => setOptionInput(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                          <div className="w-24">
                            <input
                              type="number"
                              placeholder="금액"
                              value={optionInput.amount || ''}
                              onChange={(e) => setOptionInput(prev => ({ ...prev, amount: Number(e.target.value) }))}
                              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (optionInput.name && optionInput.amount > 0) {
                              setNewPriceOptions(prev => [...prev, { optionId: Date.now().toString(), ...optionInput }])
                              setOptionInput({ name: '', amount: 0 })
                            }
                          }}
                          disabled={!optionInput.name || optionInput.amount <= 0}
                          className="mt-2 flex w-full items-center justify-center gap-1 rounded-md bg-white border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-600 transition-all"
                        >
                          + 옵션 추가
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveEvent}
                    className="flex-1 rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
                  >
                    {editingEventId ? '저장' : '추가'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* 카테고리 관리 모달 */}
      {showCategoryManageModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              {categoryManageType === 'INCOME' ? '수입' : '지출'} 항목 관리
            </h3>
            
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="새 항목 이름"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCategory()
                }}
              />
              <button
                onClick={handleAddCategory}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
              >
                추가
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-2">
              <div className="space-y-1">
                {(categoryManageType === 'INCOME' ? incomeCategories : expenseCategories).map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between rounded bg-white px-3 py-2 shadow-sm">
                    <span className="text-sm text-slate-700">{cat.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowCategoryManageModal(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 영수증 보기 모달 */}
      {showReceiptViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">영수증 보기</h2>
              <button
                onClick={() => setShowReceiptViewModal(false)}
                className="rounded-full p-2 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedReceipts.map((img, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 p-2">
                  <img 
                    src={getFileUrl(img)} 
                    alt={`Receipt ${idx + 1}`} 
                    className="w-full h-auto rounded object-contain" 
                  />
                  <p className="mt-2 text-center text-sm text-slate-500">{idx + 1}번째 영수증</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowReceiptViewModal(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FinanceManagePage
