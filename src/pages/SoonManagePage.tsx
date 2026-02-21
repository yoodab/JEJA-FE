import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { useConfirm } from '../contexts/ConfirmContext'
import {
  getCells,
  createCell,
  deleteCell,
  getUnassignedMembers,
  updateCell,
  updateCellMembersBatch,
  activateSeason,
  type Cell,
} from '../services/cellService'
import type { Member } from '../types/member'

function SoonManagePage() {
  const { confirm } = useConfirm()
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [cells, setCells] = useState<Cell[]>([])
  const [unassignedMembers, setUnassignedMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCellId, setEditingCellId] = useState<number | null>(null)
  
  // Drag & Drop states
  const [draggedMember, setDraggedMember] = useState<Member | null>(null)
  
  const [showTextImportModal, setShowTextImportModal] = useState(false)
  const [importText, setImportText] = useState('')

  const [unassignedSearch, setUnassignedSearch] = useState('')

  // 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    const hasModal = showAssignmentModal || showEditModal
    if (hasModal) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [showAssignmentModal, showEditModal])

  // 데이터 불러오기
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [cellsData, unassignedData] = await Promise.all([
        getCells(selectedYear),
        getUnassignedMembers(selectedYear),
      ])
      
      // Filter out any members from unassigned that are already in cells (Frontend Safety)
      const assignedMemberIds = new Set<number>()
      cellsData.forEach(cell => {
        if (cell.leaderMemberId) assignedMemberIds.add(cell.leaderMemberId)
        cell.members.forEach(m => assignedMemberIds.add(m.memberId))
      })
      
      const cleanUnassignedData = unassignedData.filter(m => !assignedMemberIds.has(m.memberId))

      setCells(cellsData)
      setUnassignedMembers(cleanUnassignedData)
    } catch (error) {
      console.error('데이터를 불러오는데 실패했습니다:', error)
      toast.error('데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (member: Member) => {
    setDraggedMember(member)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetCellId: number, zone: 'leader' | 'subLeader' | 'member') => {
    if (!draggedMember) return

    // 1. Remove from source (Uniqueness Guarantee)
    // Remove from unassigned list first
    const cleanUnassigned = unassignedMembers.filter((m) => m.memberId !== draggedMember.memberId)

    // Remove from ALL cells (members list and leader position)
    let nextCells = cells.map((cell) => {
      const isLeader = cell.leaderMemberId === draggedMember.memberId
      const isSubLeader = cell.subLeaderMemberId === draggedMember.memberId
      const isInMembers = cell.members.some(m => m.memberId === draggedMember.memberId)
      
      if (isLeader || isSubLeader || isInMembers) {
        return {
          ...cell,
          // If was leader, clear leader info
          leaderMemberId: isLeader ? null : cell.leaderMemberId,
          leaderName: isLeader ? null : cell.leaderName,
          // If was subLeader, clear subLeader info
          subLeaderMemberId: isSubLeader ? null : cell.subLeaderMemberId,
          subLeaderName: isSubLeader ? null : cell.subLeaderName,
          // Remove from members array
          members: cell.members.filter((m) => m.memberId !== draggedMember.memberId),
        }
      }
      return cell
    })

    // 2. Add to target
    if (targetCellId === -1) {
        // Drop to Unassigned Zone
        // Check if already exists to be double safe
        if (!cleanUnassigned.some(m => m.memberId === draggedMember.memberId)) {
          cleanUnassigned.push(draggedMember)
        }
        setUnassignedMembers(cleanUnassigned)
        setCells(nextCells)
    } else {
        // Add to target cell
        let displacedMember: Member | null = null

        nextCells = nextCells.map((cell) => {
          if (cell.cellId === targetCellId) {
            // Prepare members array: add dragged member if not already present
            const alreadyIn = cell.members.some(m => m.memberId === draggedMember.memberId)
            const newMembers = [...cell.members]
            
            if (!alreadyIn) {
               if (zone !== 'leader' && zone !== 'subLeader') {
                 newMembers.push(draggedMember)
               }
            }

            // If dropped to leader zone
            if (zone === 'leader') {
              // Check if there is an existing leader being displaced
              if (cell.leaderMemberId && cell.leaderMemberId !== draggedMember.memberId) {
                displacedMember = {
                  memberId: cell.leaderMemberId,
                  name: cell.leaderName || 'Unknown',
                  phone: cell.leaderPhone || '',
                  birthDate: cell.leaderBirthDate || '',
                  memberStatus: 'ACTIVE',
                  memberImageUrl: null,
                  hasAccount: false,
                  gender: 'MALE',
                  age: 0,
                  roles: [],
                } as Member
              }

              return {
                ...cell,
                leaderMemberId: draggedMember.memberId,
                leaderName: draggedMember.name,
                leaderPhone: draggedMember.phone,
                leaderBirthDate: draggedMember.birthDate,
                cellName: `${draggedMember.name} 순`, // Auto-naming
                // Ensure leader is NOT in members list or subLeader position
                subLeaderMemberId: cell.subLeaderMemberId === draggedMember.memberId ? null : cell.subLeaderMemberId,
                subLeaderName: cell.subLeaderMemberId === draggedMember.memberId ? null : cell.subLeaderName,
                members: newMembers.filter(m => m.memberId !== draggedMember.memberId),
              }
            } else if (zone === 'subLeader') {
              // If dropped to subLeader zone
              if (cell.subLeaderMemberId && cell.subLeaderMemberId !== draggedMember.memberId) {
                displacedMember = {
                  memberId: cell.subLeaderMemberId,
                  name: cell.subLeaderName || 'Unknown',
                  phone: cell.subLeaderPhone || '',
                  birthDate: cell.subLeaderBirthDate || '',
                  memberStatus: 'ACTIVE',
                  memberImageUrl: null,
                  hasAccount: false,
                  gender: 'MALE',
                  age: 0,
                  roles: [],
                } as Member
              }

              return {
                ...cell,
                subLeaderMemberId: draggedMember.memberId,
                subLeaderName: draggedMember.name,
                subLeaderPhone: draggedMember.phone,
                subLeaderBirthDate: draggedMember.birthDate,
                // Ensure subLeader is NOT in members list or leader position
                leaderMemberId: cell.leaderMemberId === draggedMember.memberId ? null : cell.leaderMemberId,
                leaderName: cell.leaderMemberId === draggedMember.memberId ? null : cell.leaderName,
                members: newMembers.filter(m => m.memberId !== draggedMember.memberId),
              }
            } else {
              // Dropped to member zone
              return {
                ...cell,
                members: newMembers,
              }
            }
          }
          return cell
        })
        
        // Restore displaced member to unassigned list
        if (displacedMember) {
          const member = displacedMember as Member
          if (!cleanUnassigned.some(m => m.memberId === member.memberId)) {
            cleanUnassigned.push(member)
          }
        }

        setUnassignedMembers(cleanUnassigned)
        setCells(nextCells)
    }

    setDraggedMember(null)
  }

  // 멤버 제거 (미배정으로 이동)
  const handleRemoveMember = (cellId: number, memberId: number) => {
    // Find member object first
    const targetCell = cells.find(c => c.cellId === cellId)
    if (!targetCell) return
    
    // Check members list, leader, and subLeader
    let member = targetCell.members.find(m => m.memberId === memberId)
    if (!member) {
      if (targetCell.leaderMemberId === memberId) {
        member = {
          memberId: targetCell.leaderMemberId,
          name: targetCell.leaderName || 'Unknown',
          phone: targetCell.leaderPhone || '',
          birthDate: targetCell.leaderBirthDate || '',
          memberStatus: 'ACTIVE',
        } as Member
      } else if (targetCell.subLeaderMemberId === memberId) {
        member = {
          memberId: targetCell.subLeaderMemberId,
          name: targetCell.subLeaderName || 'Unknown',
          phone: targetCell.subLeaderPhone || '',
          birthDate: targetCell.subLeaderBirthDate || '',
          memberStatus: 'ACTIVE',
        } as Member
      }
    }
    
    if (!member) return

    setCells(prev => prev.map(cell => {
      if (cell.cellId === cellId) {
        const isLeader = cell.leaderMemberId === memberId
        const isSubLeader = cell.subLeaderMemberId === memberId
        return {
          ...cell,
          leaderMemberId: isLeader ? null : cell.leaderMemberId,
          leaderName: isLeader ? null : cell.leaderName,
          subLeaderMemberId: isSubLeader ? null : cell.subLeaderMemberId,
          subLeaderName: isSubLeader ? null : cell.subLeaderName,
          members: cell.members.filter(m => m.memberId !== memberId)
        }
      }
      return cell
    }))

    const memberToUnassigned = member // shadow variable
    setUnassignedMembers(prev => {
       if (prev.some(m => m.memberId === memberToUnassigned.memberId)) {
         return prev
       }
       return [...prev, memberToUnassigned]
    })
  }

  // 변경사항 저장 (일괄 배정 API 호출)
  const handleSaveAssignment = async () => {
    const isConfirmed = await confirm({
      title: '배정 저장',
      message: '현재 배정 상태를 저장하시겠습니까?',
      type: 'info'
    });
    if (!isConfirmed) return

    try {
      setIsLoading(true)
      
      const newCells = cells.filter(cell => cell.cellId < 0)
      const existingCells = cells.filter(cell => cell.cellId > 0)
      
      const createdCellsMap = new Map<number, number>() // tempId -> realId

      // Step 1: 신규 셀 생성 (순차적)
      for (const cell of newCells) {
        try {
          const realId = await createCell({
            cellName: cell.cellName,
            year: cell.year,
            leaderMemberId: cell.leaderMemberId,
            subLeaderMemberId: cell.subLeaderMemberId,
          })
          createdCellsMap.set(cell.cellId, realId)
        } catch (error) {
          console.error(`셀 생성 실패 (${cell.cellName}):`, error)
          throw error
        }
      }
      
      // Step 1.5: 기존 셀 업데이트 (이름/연도 변경 반영)
      await Promise.all(
        existingCells.map(cell => 
          updateCell(cell.cellId, {
            cellName: cell.cellName,
            year: cell.year
          })
        )
      )

      // Step 2: 멤버 배정 API 호출 (전체 일괄 전송)
      const allCellsToSync = [
        ...existingCells,
        ...newCells.map(cell => ({ ...cell, cellId: createdCellsMap.get(cell.cellId)! }))
      ]

      // DTO 생성: 현재 화면(State)에 있는 모든 셀의 정보를 일괄 업데이트 포맷으로 변환
      const batchDto = {
        cellUpdates: allCellsToSync.map(cell => ({
          cellId: cell.cellId,
          leaderId: cell.leaderMemberId,
          subLeaderId: cell.subLeaderMemberId,
          memberIds: cell.members.map(m => m.memberId)
        }))
      }

      await updateCellMembersBatch(batchDto)

      toast.success('순 배정이 저장되었습니다.')
      setShowAssignmentModal(false)
      fetchData() // 최신 데이터 리로드
    } catch (error) {
      console.error('저장 실패:', error)
      toast.error('저장 중 오류가 발생했습니다. (일부 데이터만 저장되었을 수 있습니다)')
    } finally {
      setIsLoading(false)
    }
  }

  // 텍스트 일괄 배정
  const handleTextImport = () => {
    if (!importText.trim()) return

    const rows = importText.trim().split('\n').map(row => row.split('\t').map(cell => cell.trim()))
    const maxCols = Math.max(...rows.map(row => row.length))
    
    let currentUnassigned = [...unassignedMembers]
    const newCells: Cell[] = []
    
    // Helper to find and remove member from unassigned list
    const findAndRemove = (name: string) => {
      const index = currentUnassigned.findIndex(m => m.name === name)
      if (index !== -1) {
        const [member] = currentUnassigned.splice(index, 1)
        return member
      }
      return null
    }

    // Iterate by column
    for (let col = 0; col < maxCols; col++) {
      const leaderName = rows[0][col]
      if (!leaderName) continue

      const leader = findAndRemove(leaderName)
      
      const tempId = -Date.now() - col // Ensure unique temp IDs
      const newCell: Cell = {
        cellId: tempId,
        cellName: leader ? `${leader.name}순` : `${leaderName}순`,
        year: selectedYear,
        active: false,
        leaderMemberId: leader?.memberId || null,
        leaderName: leader?.name || leaderName, // 이름은 있지만 매칭되지 않은 경우 텍스트라도 유지
        leaderPhone: leader?.phone || null,
        leaderBirthDate: leader?.birthDate || null,
        subLeaderMemberId: null,
        subLeaderName: null,
        subLeaderPhone: null,
        subLeaderBirthDate: null,
        members: [],
      }

      // Add members
      for (let row = 1; row < rows.length; row++) {
        const memberName = rows[row][col]
        if (!memberName) continue
        
        const member = findAndRemove(memberName)
        if (member) {
          newCell.members.push(member)
        } else {
            // 멤버를 찾지 못했더라도 이름만이라도 표시하고 싶다면?
            // 현재 구조상 memberId가 필수이므로, 매칭되지 않은 멤버는 스킵하거나 경고해야 함.
            // 여기서는 일단 스킵. (사용자 요구사항: "미배정 인원에서 이름 찾아서 넣고")
            console.warn(`Member not found in unassigned: ${memberName}`)
        }
      }
      
      newCells.push(newCell)
    }

    if (newCells.length > 0) {
      setCells(prev => [...prev, ...newCells])
      setUnassignedMembers(currentUnassigned)
      setImportText('')
      setShowTextImportModal(false)
      toast.success(`${newCells.length}개의 순이 생성되었습니다.`)
    } else {
      toast.error('배정할 수 있는 순이 없습니다. 이름을 확인해주세요.')
    }
  }

  // 순 추가 (로컬 상태만 변경)
  const handleAddSoon = async () => {
    const tempId = -Date.now() // 임시 ID 생성
    const newCell: Cell = {
      cellId: tempId,
      cellName: '새 순', // 초기값
      year: selectedYear,
      active: false,
      leaderMemberId: null,
      leaderName: null,
      leaderPhone: null,
      leaderBirthDate: null,
      subLeaderMemberId: null,
      subLeaderName: null,
      subLeaderPhone: null,
      subLeaderBirthDate: null,
      members: [],
    }
    
    // UI 즉시 반영
    setCells(prev => [...prev, newCell])
  }

  // 순 삭제 (API 즉시 호출 및 로컬 반영)
  const handleDeleteSoon = async (cellId: number) => {
    // 1. 셀 찾기
    const targetCell = cells.find(c => c.cellId === cellId)
    if (!targetCell) return

    // 임시 셀이고 멤버가 없으면 즉시 삭제 (UX 편의성)
    if (cellId < 0 && targetCell.members.length === 0 && !targetCell.leaderMemberId && !targetCell.subLeaderMemberId) {
      setCells(prev => prev.filter(c => c.cellId !== cellId))
      return
    }

    const isConfirmed = await confirm({
      title: '순 삭제',
      message: '정말로 이 순을 삭제하시겠습니까? 배정된 순원들은 미배정 상태가 됩니다.',
      type: 'danger'
    });
    if (!isConfirmed) return

    // 2. API 호출 (기존 셀인 경우)
    if (cellId > 0) {
      try {
        setIsLoading(true)
        await deleteCell(cellId)
        toast.success('순이 삭제되었습니다.')
      } catch (error) {
        console.error('순 삭제 실패:', error)
        toast.error('순 삭제에 실패했습니다.')
        setIsLoading(false)
        return
      } finally {
        setIsLoading(false)
      }
    }

    // 3. 멤버들을 미배정으로 이동 (리더, 부순장 포함)
    const membersToRelease = [...targetCell.members]
    
    // 리더가 있고 멤버 목록에 없다면 추가
    if (targetCell.leaderMemberId && targetCell.leaderName) {
        if (!membersToRelease.some(m => m.memberId === targetCell.leaderMemberId)) {
             membersToRelease.push({
                memberId: targetCell.leaderMemberId,
                name: targetCell.leaderName,
                birthDate: targetCell.leaderBirthDate || '',
                phone: targetCell.leaderPhone || '',
                address: '',
                role: '순장'
             } as unknown as Member)
        }
    }
    
    // 부순장이 있고 멤버 목록에 없다면 추가
    if (targetCell.subLeaderMemberId && targetCell.subLeaderName) {
        if (!membersToRelease.some(m => m.memberId === targetCell.subLeaderMemberId)) {
             membersToRelease.push({
                memberId: targetCell.subLeaderMemberId,
                name: targetCell.subLeaderName,
                birthDate: targetCell.subLeaderBirthDate || '',
                phone: targetCell.subLeaderPhone || '',
                address: '',
                role: '부순장'
             } as unknown as Member)
        }
    }

    setUnassignedMembers(prev => {
      // 중복 방지
      const existingIds = new Set(prev.map(m => m.memberId))
      const newMembers = membersToRelease.filter(m => !existingIds.has(m.memberId))
      return [...prev, ...newMembers]
    })

    // 4. 셀 목록에서 제거
    setCells(prev => prev.filter(c => c.cellId !== cellId))
  }

  // 순 수정 모달 열기 (제거됨)

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingCellId(null)
  }

  // 시즌 활성화
  const handleActivateSeason = async () => {
    const isConfirmed = await confirm({
      title: '시즌 활성화',
      message: `${selectedYear}년도 순을 활성화하시겠습니까? 이전 연도 기록은 종료됩니다.`,
      type: 'warning'
    });
    if (!isConfirmed) return
    
    try {
        setIsLoading(true)
        await activateSeason(selectedYear)
        toast.success('시즌이 활성화되었습니다.')
        fetchData()
    } catch (error) {
        console.error('시즌 활성화 실패:', error)
        toast.error('시즌 활성화에 실패했습니다.')
    } finally {
        setIsLoading(false)
    }
  }

  // 미배정 멤버 검색 필터링
  const filteredUnassignedMembers = unassignedMembers.filter((member) =>
    member.name.toLowerCase().includes(unassignedSearch.toLowerCase()) ||
    member.phone.includes(unassignedSearch)
  )

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // 편집 중인 셀 정보
  const editingCell = editingCellId ? cells.find((c) => c.cellId === editingCellId) : null
  
  // 헬퍼: 출생년도 추출
  const getBirthYear = (dateStr: string | undefined) => {
    if (!dateStr) return ''
    return dateStr.split('-')[0]
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* 헤더 영역 */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-xl">
              🌱
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">순 관리</p>
              <p className="text-xs text-slate-500">순 배정 및 조직 관리</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {(!cells.length || !cells[0].active) && (
            <button
              onClick={handleActivateSeason}
              className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              순 활성화
            </button>
          )}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border-slate-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowAssignmentModal(true)}
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            순 배정
          </button>
        </div>
      </header>

      {/* 통계 카드 영역 */}
      <div className="grid grid-cols-1 gap-4 border-b border-slate-200 p-6 sm:grid-cols-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">순 개수</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{cells.length}개</p>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">재적 인원</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {cells.reduce((acc, cell) => acc + cell.members.length + (cell.leaderMemberId ? 1 : 0), 0) + unassignedMembers.length}명
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">미배정 인원</p>
          <p className="mt-2 text-3xl font-bold text-yellow-600">
            {unassignedMembers.length}명
          </p>
        </div>
      </div>

      {/* 순 목록 그리드 (읽기 전용 뷰) */}
      <div className="bg-slate-50 p-6 rounded-b-2xl">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cells.map((cell) => (
            <div
              key={cell.cellId}
              className="group relative flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold">
                    {cell.cellName.slice(0, 1)}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900">{cell.cellName}</h3>
                    <p className="text-xs text-slate-500">
                      순장: {cell.leaderName || '미정'} | 부순장: {cell.subLeaderName || '미정'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    순원 목록 ({cell.members.filter(m => m.memberId !== cell.leaderMemberId && m.memberId !== cell.subLeaderMemberId).length}명)
                  </span>
                </div>
                <div className="space-y-2">
                  {cell.members.length === 0 && !cell.leaderMemberId && !cell.subLeaderMemberId ? (
                    <p className="text-sm text-slate-400">배정된 인원이 없습니다.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {cell.members
                          .filter(m => m.memberId !== cell.leaderMemberId && m.memberId !== cell.subLeaderMemberId)
                          .map((member) => (
                        <span
                          key={member.memberId}
                          className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
                        >
                          {member.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

      {/* 순 배정 모달 (전체 화면) */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-50">
          {/* 모달 헤더 */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-slate-900">순 배정</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {selectedYear}년도
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                변경사항은 [저장] 버튼을 눌러야 반영됩니다
              </span>
              <button
                onClick={() => setShowTextImportModal(true)}
                className="rounded-lg bg-white border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                텍스트로 배정
              </button>
              <button
                onClick={async () => {
                  const isConfirmed = await confirm({
                    title: '변경사항 취소',
                    message: '저장하지 않은 변경사항이 사라집니다. 닫으시겠습니까?',
                    type: 'warning',
                    confirmText: '닫기',
                    cancelText: '계속 편집'
                  });
                  
                  if (isConfirmed) {
                    setShowAssignmentModal(false)
                    fetchData()
                  }
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                닫기
              </button>
              <button
                onClick={handleSaveAssignment}
                disabled={isLoading}
                className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {isLoading ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>

          {/* 모달 컨텐츠 */}
          <div className="flex flex-1 overflow-hidden">
            {/* 왼쪽: 미배정 멤버 목록 */}
            <div className="w-80 flex flex-col border-r border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">미배정 인원</h3>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    {unassignedMembers.length}명
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="이름 검색..."
                  value={unassignedSearch}
                  onChange={(e) => setUnassignedSearch(e.target.value)}
                  className="w-full rounded-md border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              
              <div 
                className="flex-1 overflow-y-auto p-4 bg-slate-50/50"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(-1, 'member')} 
              >
                <div className="flex flex-col gap-2">
                  {filteredUnassignedMembers.map((member) => (
                    <div
                      key={member.memberId}
                      draggable
                      onDragStart={() => handleDragStart(member)}
                      className="cursor-move rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-blue-50 hover:border-blue-300 shadow-sm flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{member.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">{getBirthYear(member.birthDate)}년생</span>
                    </div>
                  ))}
                  {filteredUnassignedMembers.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">
                      {unassignedSearch ? '검색 결과가 없습니다' : '모든 인원이 배정되었습니다'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 오른쪽: 순 배치 영역 */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-100/50">
                <div className="p-4 overflow-y-auto h-full">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-start">
                        {cells.map((cell) => (
                            <div
                                key={cell.cellId}
                                className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                            >
                                {/* Header / Leader Zone */}
                                <div className="relative border-b border-slate-100 bg-slate-50 p-3">
                                    <button
                                      onClick={() => handleDeleteSoon(cell.cellId)}
                                      className="absolute right-2 top-2 text-slate-400 hover:text-red-500"
                                      title="순 삭제"
                                    >
                                      ✕
                                    </button>
                                    <div className="mb-2 text-center">
                                        <h4 className="text-sm font-bold text-slate-900">{cell.cellName}</h4>
                                    </div>
                                    
                                    {/* Leader & SubLeader Zones */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {/* Leader Drop Zone */}
                                        <div 
                                            onDragOver={handleDragOver}
                                            onDrop={() => handleDrop(cell.cellId, 'leader')}
                                            className={`
                                                relative rounded-lg p-2 min-h-[50px] flex items-center justify-center transition-colors
                                                ${cell.leaderMemberId 
                                                    ? 'bg-emerald-50 border border-emerald-200' 
                                                    : 'bg-white border-2 border-dashed border-emerald-300 hover:bg-emerald-50'
                                                }
                                            `}
                                        >
                                            {cell.leaderMemberId ? (
                                            <div 
                                                draggable
                                                onDragStart={() => {
                                                    let leaderMember = cell.members.find(m => m.memberId === cell.leaderMemberId);
                                                    if (!leaderMember) {
                                                        leaderMember = {
                                                            memberId: cell.leaderMemberId!,
                                                            name: cell.leaderName || '',
                                                            phone: cell.leaderPhone || '',
                                                            birthDate: cell.leaderBirthDate || '',
                                                            memberStatus: 'ACTIVE',
                                                            role: '순장'
                                                        } as unknown as Member;
                                                    }
                                                    handleDragStart(leaderMember);
                                                }}
                                                className="flex flex-col items-center gap-1 cursor-move"
                                            >
                                                    <div className="flex flex-col items-center text-emerald-700">
                                                        <span className="text-[10px] font-bold uppercase opacity-50">순장</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-bold text-sm">{cell.leaderName}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-slate-400 font-medium text-center leading-tight">
                                                    순장<br/>배치
                                                </div>
                                            )}
                                        </div>

                                        {/* SubLeader Drop Zone */}
                                        <div 
                                            onDragOver={handleDragOver}
                                            onDrop={() => handleDrop(cell.cellId, 'subLeader')}
                                            className={`
                                                relative rounded-lg p-2 min-h-[50px] flex items-center justify-center transition-colors
                                                ${cell.subLeaderMemberId 
                                                    ? 'bg-blue-50 border border-blue-200' 
                                                    : 'bg-white border-2 border-dashed border-blue-300 hover:bg-blue-50'
                                                }
                                            `}
                                        >
                                            {cell.subLeaderMemberId ? (
                                            <div 
                                                draggable
                                                onDragStart={() => {
                                                    let subLeaderMember = cell.members.find(m => m.memberId === cell.subLeaderMemberId);
                                                    if (!subLeaderMember) {
                                                        subLeaderMember = {
                                                            memberId: cell.subLeaderMemberId!,
                                                            name: cell.subLeaderName || '',
                                                            phone: cell.subLeaderPhone || '',
                                                            birthDate: cell.subLeaderBirthDate || '',
                                                            memberStatus: 'ACTIVE',
                                                            role: '부순장'
                                                        } as unknown as Member;
                                                    }
                                                    handleDragStart(subLeaderMember);
                                                }}
                                                className="flex flex-col items-center gap-1 cursor-move"
                                            >
                                                    <div className="flex flex-col items-center text-blue-700">
                                                        <span className="text-[10px] font-bold uppercase opacity-50">부순장</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-bold text-sm">{cell.subLeaderName}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-slate-400 font-medium text-center leading-tight">
                                                    부순장<br/>배치
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Member Zone */}
                                <div 
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(cell.cellId, 'member')}
                                    className="flex-1 p-2 min-h-[150px] bg-white"
                                >
                                    <div className="mb-2 flex items-center justify-between px-1">
                                        <span className="text-xs font-semibold text-slate-500">
                                            순원 목록 ({cell.members.filter(m => m.memberId !== cell.leaderMemberId && m.memberId !== cell.subLeaderMemberId).length}명)
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 min-h-[100px] rounded-lg border border-slate-100 bg-slate-50/30 p-2">
                                        {cell.members
                                            .filter(m => m.memberId !== cell.leaderMemberId && m.memberId !== cell.subLeaderMemberId)
                                            .map((member) => (
                                            <div
                                                key={`cell-${cell.cellId}-${member.memberId}`}
                                                draggable
                                                onDragStart={() => handleDragStart(member)}
                                                className="group flex items-center justify-between rounded border border-white bg-white px-2 py-1.5 text-xs shadow-sm cursor-move hover:border-emerald-200 hover:shadow-md transition-all"
                                            >
                                                <div className="flex items-center gap-1">
                                                  <span className="font-medium text-slate-700">{member.name}</span>
                                                  <span className="text-[10px] text-slate-400">
                                                    {getBirthYear(member.birthDate) ? `(${getBirthYear(member.birthDate)})` : ''}
                                                  </span>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveMember(cell.cellId, member.memberId);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 px-1"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        {cell.members.length === 0 && (
                                            <div className="flex h-full items-center justify-center text-xs text-slate-300 py-4">
                                                순원 배치 (드래그)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 새 순 추가 버튼 */}
                        <button
                            onClick={handleAddSoon}
                            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-slate-400 transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 min-h-[250px]"
                        >
                            <span className="mb-2 text-2xl">+</span>
                            <span className="font-medium">새 순 추가</span>
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 순 수정 모달 */}
      {showEditModal && editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-slate-900">순 정보 수정</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">순 이름</label>
                <input
                  type="text"
                  value={editingCell.cellName}
                  onChange={(e) => {
                    setCells(prev => prev.map(c => 
                      c.cellId === editingCell.cellId ? { ...c, cellName: e.target.value } : c
                    ))
                  }}
                  className="w-full rounded-lg border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCloseEditModal}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  onClick={handleCloseEditModal}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 텍스트 배정 모달 */}
      {showTextImportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-xl bg-white p-6 shadow-xl flex flex-col max-h-[90vh]">
            <h3 className="mb-4 text-lg font-bold text-slate-900">텍스트로 순 배정</h3>
            <div className="mb-4 rounded-md bg-blue-50 p-4 text-sm text-blue-700">
              <p className="font-bold mb-1">사용 방법</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>엑셀이나 스프레드시트에서 이름을 복사해서 붙여넣으세요.</li>
                <li><strong>첫 번째 행</strong>은 순장이 되며, 각 열(세로줄)의 아래 이름들은 해당 순의 순원이 됩니다.</li>
                <li>이름은 <strong>탭(Tab)</strong>으로 구분되어야 합니다. (엑셀 복사 시 자동 적용)</li>
                <li>미배정 인원 목록에 있는 이름만 배정됩니다.</li>
              </ul>
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`예시:\n장광희\t구혜린\t최성규\n한유진\t정지윤\t여인혁\n김수민\t박예성\t아드리안`}
              className="flex-1 w-full rounded-lg border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 font-mono whitespace-pre min-h-[300px]"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowTextImportModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                onClick={handleTextImport}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
              >
                배정 적용
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default SoonManagePage
