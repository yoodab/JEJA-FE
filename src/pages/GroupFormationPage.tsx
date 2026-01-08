import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
// import { getMembers } from '../services/memberService'
// import type { Member } from '../types/member'

interface SelectedMember {
  memberId: number
  name: string
  phone: string
  birthDate: string
  status: string
  role: string
  gender?: 'M' | 'F' // 성별 (임시로 추가, 실제로는 API에서 가져와야 함)
  age?: number // 나이 (생년월일로 계산)
}

interface Group {
  id: number
  name: string
  members: SelectedMember[]
}

function GroupFormationPage() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<SelectedMember[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set())
  const [groups, setGroups] = useState<Group[]>([])
  const [groupCount, setGroupCount] = useState(4)
  const [formationMethod, setFormationMethod] = useState<'random' | 'age'>('random')
  const [considerGender, setConsiderGender] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [newMember, setNewMember] = useState({
    name: '',
    gender: 'M' as 'M' | 'F',
    age: '',
  })
  const [nextMemberId, setNextMemberId] = useState(13)

  // 임시 멤버 데이터 (실제로는 API에서 가져올 데이터)
  const mockMembers: SelectedMember[] = [
    {
      memberId: 1,
      name: '김철수',
      phone: '010-1234-5678',
      birthDate: '1998-05-15',
      status: '재적',
      role: '일반',
      gender: 'M',
      age: 27,
    },
    {
      memberId: 2,
      name: '이영희',
      phone: '010-2345-6789',
      birthDate: '1999-08-20',
      status: '재적',
      role: '리더',
      gender: 'F',
      age: 26,
    },
    {
      memberId: 3,
      name: '박민수',
      phone: '010-3456-7890',
      birthDate: '2000-03-10',
      status: '재적',
      role: '일반',
      gender: 'M',
      age: 25,
    },
    {
      memberId: 4,
      name: '최지은',
      phone: '010-4567-8901',
      birthDate: '1997-11-25',
      status: '재적',
      role: '일반',
      gender: 'F',
      age: 28,
    },
    {
      memberId: 5,
      name: '정대현',
      phone: '010-5678-9012',
      birthDate: '1999-01-05',
      status: '재적',
      role: '일반',
      gender: 'M',
      age: 26,
    },
    {
      memberId: 6,
      name: '한소영',
      phone: '010-6789-0123',
      birthDate: '2001-07-18',
      status: '재적',
      role: '일반',
      gender: 'F',
      age: 24,
    },
    {
      memberId: 7,
      name: '윤성호',
      phone: '010-7890-1234',
      birthDate: '1998-12-30',
      status: '재적',
      role: '일반',
      gender: 'M',
      age: 27,
    },
    {
      memberId: 8,
      name: '강미라',
      phone: '010-8901-2345',
      birthDate: '2000-09-14',
      status: '재적',
      role: '일반',
      gender: 'F',
      age: 25,
    },
    {
      memberId: 9,
      name: '조현우',
      phone: '010-9012-3456',
      birthDate: '1999-04-22',
      status: '재적',
      role: '일반',
      gender: 'M',
      age: 26,
    },
    {
      memberId: 10,
      name: '임수진',
      phone: '010-0123-4567',
      birthDate: '2001-06-08',
      status: '재적',
      role: '일반',
      gender: 'F',
      age: 24,
    },
    {
      memberId: 11,
      name: '오준혁',
      phone: '010-1234-5678',
      birthDate: '1998-10-03',
      status: '재적',
      role: '일반',
      gender: 'M',
      age: 27,
    },
    {
      memberId: 12,
      name: '신유진',
      phone: '010-2345-6789',
      birthDate: '2000-02-17',
      status: '재적',
      role: '일반',
      gender: 'F',
      age: 25,
    },
  ]

  // 멤버 목록 로드
  useEffect(() => {
    // TODO: API 연동 시 주석 해제
    // const fetchMembers = async () => {
    //   try {
    //     setLoading(true)
    //     const data = await getMembers()
    //     const membersWithGender: SelectedMember[] = data.map((member) => {
    //       const birthYear = parseInt(member.birthDate.split('-')[0])
    //       const currentYear = new Date().getFullYear()
    //       const age = currentYear - birthYear + 1
    //       return {
    //         ...member,
    //         gender: member.gender || (Math.random() > 0.5 ? 'M' : 'F'),
    //         age,
    //       }
    //     })
    //     setMembers(membersWithGender)
    //   } catch (error) {
    //     console.error('멤버 목록 로드 실패:', error)
    //     alert('멤버 목록을 불러오는데 실패했습니다.')
    //   } finally {
    //     setLoading(false)
    //   }
    // }
    // fetchMembers()

    // 임시 데이터 사용
    setLoading(true)
    setTimeout(() => {
      setMembers(mockMembers)
      setLoading(false)
    }, 300)
  }, [])

  const toggleMemberSelection = (memberId: number) => {
    const newSelected = new Set(selectedMemberIds)
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId)
    } else {
      newSelected.add(memberId)
    }
    setSelectedMemberIds(newSelected)
  }

  const selectAll = () => {
    setSelectedMemberIds(new Set(members.map(m => m.memberId)))
  }

  const deselectAll = () => {
    setSelectedMemberIds(new Set())
  }

  const calculateAge = (birthDate: string): number => {
    const birthYear = parseInt(birthDate.split('-')[0])
    const currentYear = new Date().getFullYear()
    return currentYear - birthYear + 1
  }

  const handleAddMember = () => {
    if (!newMember.name.trim()) {
      alert('이름을 입력해주세요.')
      return
    }
    if (!newMember.age || isNaN(Number(newMember.age)) || Number(newMember.age) < 1 || Number(newMember.age) > 150) {
      alert('올바른 나이를 입력해주세요.')
      return
    }

    const age = Number(newMember.age)
    const currentYear = new Date().getFullYear()
    const birthYear = currentYear - age + 1
    const addedMember: SelectedMember = {
      memberId: nextMemberId,
      name: newMember.name,
      phone: '-',
      birthDate: `${birthYear}-01-01`,
      status: '재적',
      role: '일반',
      gender: newMember.gender,
      age,
    }

    setMembers([...members, addedMember])
    setSelectedMemberIds(new Set([...selectedMemberIds, nextMemberId]))
    setNextMemberId(nextMemberId + 1)
    setNewMember({ name: '', gender: 'M', age: '' })
    setShowAddMemberModal(false)
  }

  const formGroups = () => {
    if (selectedMemberIds.size === 0) {
      alert('최소 1명 이상의 인원을 선택해주세요.')
      return
    }
    if (groupCount < 1) {
      alert('조 개수는 1개 이상이어야 합니다.')
      return
    }
    if (selectedMemberIds.size < groupCount) {
      alert('선택한 인원 수가 조 개수보다 적습니다.')
      return
    }

    const selectedMembers = members.filter(m => selectedMemberIds.has(m.memberId))
    const newGroups: Group[] = []

    if (formationMethod === 'random') {
      // 랜덤 편성
      const shuffled = [...selectedMembers].sort(() => Math.random() - 0.5)
      
      if (considerGender) {
        // 성별 고려하여 편성
        const males = shuffled.filter(m => m.gender === 'M')
        const females = shuffled.filter(m => m.gender === 'F')
        
        // 모든 조를 먼저 생성
        for (let i = 0; i < groupCount; i++) {
          newGroups.push({
            id: i + 1,
            name: `${i + 1}조`,
            members: [],
          })
        }
        
        // 남성과 여성을 순환하면서 각 조에 고르게 배분
        let maleIndex = 0
        let femaleIndex = 0
        let groupIndex = 0
        
        // 남성과 여성을 번갈아가며 배분
        while (maleIndex < males.length || femaleIndex < females.length) {
          // 남성 배분
          if (maleIndex < males.length) {
            newGroups[groupIndex].members.push(males[maleIndex])
            maleIndex++
            groupIndex = (groupIndex + 1) % groupCount
          }
          
          // 여성 배분
          if (femaleIndex < females.length) {
            newGroups[groupIndex].members.push(females[femaleIndex])
            femaleIndex++
            groupIndex = (groupIndex + 1) % groupCount
          }
        }
      } else {
        // 성별 고려하지 않고 랜덤 편성
        const membersPerGroup = Math.floor(shuffled.length / groupCount)
        const remainder = shuffled.length % groupCount
        
        for (let i = 0; i < groupCount; i++) {
          const start = i * membersPerGroup + Math.min(i, remainder)
          const end = start + membersPerGroup + (i < remainder ? 1 : 0)
          newGroups.push({
            id: i + 1,
            name: `${i + 1}조`,
            members: shuffled.slice(start, end),
          })
        }
      }
    } else {
      // 나이대로 편성
      const sorted = [...selectedMembers].sort((a, b) => (b.age || 0) - (a.age || 0))
      
      if (considerGender) {
        // 성별과 나이 모두 고려
        const males = sorted.filter(m => m.gender === 'M')
        const females = sorted.filter(m => m.gender === 'F')
        
        // 모든 조를 먼저 생성
        for (let i = 0; i < groupCount; i++) {
          newGroups.push({
            id: i + 1,
            name: `${i + 1}조`,
            members: [],
          })
        }
        
        // 남성과 여성을 순환하면서 각 조에 고르게 배분 (나이순 유지)
        let maleIndex = 0
        let femaleIndex = 0
        let groupIndex = 0
        
        // 남성과 여성을 번갈아가며 배분
        while (maleIndex < males.length || femaleIndex < females.length) {
          // 남성 배분 (나이순)
          if (maleIndex < males.length) {
            newGroups[groupIndex].members.push(males[maleIndex])
            maleIndex++
            groupIndex = (groupIndex + 1) % groupCount
          }
          
          // 여성 배분 (나이순)
          if (femaleIndex < females.length) {
            newGroups[groupIndex].members.push(females[femaleIndex])
            femaleIndex++
            groupIndex = (groupIndex + 1) % groupCount
          }
        }
      } else {
        // 나이만 고려하여 편성
        const membersPerGroup = Math.floor(sorted.length / groupCount)
        const remainder = sorted.length % groupCount
        
        for (let i = 0; i < groupCount; i++) {
          const start = i * membersPerGroup + Math.min(i, remainder)
          const end = start + membersPerGroup + (i < remainder ? 1 : 0)
          newGroups.push({
            id: i + 1,
            name: `${i + 1}조`,
            members: sorted.slice(start, end),
          })
        }
      }
    }

    setGroups(newGroups)
  }

  const resetFormation = () => {
    setGroups([])
    setSelectedMemberIds(new Set())
  }

  const selectedMembers = members.filter(m => selectedMemberIds.has(m.memberId))
  const selectedMales = selectedMembers.filter(m => m.gender === 'M').length
  const selectedFemales = selectedMembers.filter(m => m.gender === 'F').length

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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-xl">
                🔀
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">조 편성</p>
                <p className="text-xs text-slate-500">자동 조 편성 시스템</p>
              </div>
            </div>
          </div>
        </header>

        {/* 1. 인원 선택 */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">인원 선택</h2>
            <div className="flex items-center gap-2">
              {selectedMemberIds.size > 0 && (
                <div className="text-sm text-slate-600">
                  선택: <span className="font-semibold text-slate-900">{selectedMemberIds.size}명</span>
                  {considerGender && (
                    <span className="ml-2 text-xs text-slate-500">
                      (남: {selectedMales}명, 여: {selectedFemales}명)
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700"
              >
                + 새 신자 추가
              </button>
              <button
                onClick={selectAll}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                전체 선택
              </button>
              <button
                onClick={deselectAll}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                전체 해제
              </button>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8 text-slate-500">로딩 중...</div>
          ) : (
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
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // 멤버를 행별로 그룹화 (8개 열 + 새신자 열)
                    const rows: (SelectedMember | null)[][] = []
                    const colsPerRow = 8
                    
                    for (let i = 0; i < members.length; i += colsPerRow) {
                      const row: (SelectedMember | null)[] = []
                      for (let j = 0; j < colsPerRow; j++) {
                        row.push(members[i + j] || null)
                      }
                      // 새신자 열은 마지막에 추가 (현재는 빈 값, 추후 확장 가능)
                      rows.push(row)
                    }
                    
                    return rows.map((row, rowIndex) => (
                      <tr key={`row-${rowIndex}`}>
                        {row.map((member, colIndex) => {
                          const isSelected = member ? selectedMemberIds.has(member.memberId) : false
                          
                          return (
                            <td
                              key={colIndex}
                              className="border border-slate-300 px-2 py-2 text-center"
                            >
                              {member ? (
                                <button
                                  type="button"
                                  onClick={() => toggleMemberSelection(member.memberId)}
                                  className={`inline-flex h-8 w-full items-center justify-center rounded border-2 transition hover:opacity-80 ${
                                    isSelected
                                      ? 'border-blue-600 bg-blue-600 text-white'
                                      : 'border-slate-300 bg-white text-slate-700'
                                  }`}
                                >
                                  <span className="text-xs">{member.name}</span>
                                </button>
                              ) : (
                                <div className="h-8" />
                              )}
                            </td>
                          )
                        })}
                        {/* 새신자 열 */}
                        <td className="border border-slate-300 bg-slate-50 px-2 py-2 text-center">
                          <div className="h-8" />
                        </td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2. 편성 설정 */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">편성 설정</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                조 개수
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={groupCount}
                onChange={(e) => setGroupCount(parseInt(e.target.value) || 1)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                편성 방법
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormationMethod('random')}
                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                    formationMethod === 'random'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  랜덤
                </button>
                <button
                  type="button"
                  onClick={() => setFormationMethod('age')}
                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                    formationMethod === 'age'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  나이순
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={considerGender}
                  onChange={(e) => setConsiderGender(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">성별 고려하여 편성</span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={formGroups}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              조 편성하기
            </button>
            {groups.length > 0 && (
              <button
                onClick={resetFormation}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                초기화
              </button>
            )}
          </div>
        </div>

        {/* 3. 편성 결과 */}
        {groups.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">편성 결과</h2>
              <button
                onClick={() => setShowFullscreen(true)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                전체화면 보기
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">조</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">인원</th>
                    {considerGender && (
                      <>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">남성</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">여성</th>
                      </>
                    )}
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">멤버</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groups.map((group) => {
                    const maleCount = group.members.filter(m => m.gender === 'M').length
                    const femaleCount = group.members.filter(m => m.gender === 'F').length
                    const avgAge =
                      group.members.length > 0
                        ? group.members.reduce((sum, m) => sum + (m.age || calculateAge(m.birthDate)), 0) / group.members.length
                        : 0

                    return (
                      <tr key={group.id} className="bg-white hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-slate-900">{group.name}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {group.members.length}명
                          {considerGender && (
                            <span className="ml-2 text-xs text-slate-500">
                              (평균 {avgAge.toFixed(1)}세)
                            </span>
                          )}
                        </td>
                        {considerGender && (
                          <>
                            <td className="px-6 py-4 text-sm text-slate-600">{maleCount}명</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{femaleCount}명</td>
                          </>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {group.members.map((member) => (
                              <div
                                key={member.memberId}
                                className="rounded-lg bg-slate-100 px-2.5 py-1.5"
                              >
                                <span className="text-sm font-medium text-slate-900">{member.name}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 새 신자 추가 모달 */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">새 신자 추가</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  나이 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={newMember.age}
                  onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="나이를 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">성별</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewMember({ ...newMember, gender: 'M' })}
                    className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                      newMember.gender === 'M'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    남성
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMember({ ...newMember, gender: 'F' })}
                    className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                      newMember.gender === 'F'
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    여성
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowAddMemberModal(false)
                  setNewMember({ name: '', gender: 'M', age: '' })
                }}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                취소
              </button>
              <button
                onClick={handleAddMember}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 전체화면 편성 결과 */}
      {showFullscreen && groups.length > 0 && (
        <div className="fixed inset-0 z-50 bg-white p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">편성 결과</h2>
              <button
                onClick={() => setShowFullscreen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                닫기
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-8 py-4 text-left text-base font-semibold text-slate-900">조</th>
                    <th className="px-8 py-4 text-left text-base font-semibold text-slate-900">인원</th>
                    {considerGender && (
                      <>
                        <th className="px-8 py-4 text-left text-base font-semibold text-slate-900">남성</th>
                        <th className="px-8 py-4 text-left text-base font-semibold text-slate-900">여성</th>
                      </>
                    )}
                    <th className="px-8 py-4 text-left text-base font-semibold text-slate-900">멤버</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groups.map((group) => {
                    const maleCount = group.members.filter(m => m.gender === 'M').length
                    const femaleCount = group.members.filter(m => m.gender === 'F').length
                    const avgAge =
                      group.members.length > 0
                        ? group.members.reduce((sum, m) => sum + (m.age || calculateAge(m.birthDate)), 0) / group.members.length
                        : 0

                    return (
                      <tr key={group.id} className="bg-white hover:bg-slate-50">
                        <td className="px-8 py-5">
                          <span className="text-xl font-bold text-slate-900">{group.name}</span>
                        </td>
                        <td className="px-8 py-5 text-base text-slate-600">
                          {group.members.length}명
                          {considerGender && (
                            <span className="ml-2 text-sm text-slate-500">
                              (평균 {avgAge.toFixed(1)}세)
                            </span>
                          )}
                        </td>
                        {considerGender && (
                          <>
                            <td className="px-8 py-5 text-base text-slate-600">{maleCount}명</td>
                            <td className="px-8 py-5 text-base text-slate-600">{femaleCount}명</td>
                          </>
                        )}
                        <td className="px-8 py-5">
                          <div className="flex flex-wrap gap-2">
                            {group.members.map((member) => (
                              <div
                                key={member.memberId}
                                className="rounded-lg bg-slate-100 px-3 py-2"
                              >
                                <span className="text-base font-medium text-slate-900">{member.name}</span>
                              </div>
                            ))}
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
      )}
    </div>
  )
}

export default GroupFormationPage
