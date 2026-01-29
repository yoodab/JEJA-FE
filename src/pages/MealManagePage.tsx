import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMembers } from '../services/memberService'
import type { Member } from '../types/member'

interface MealTicket {
  id: string
  date: string
  userId: string
  userName: string
  place: string
  count: number
}

interface MealTicketIssuance {
  id: string
  date: string
  newcomerId: string
  newcomerName: string
  type: '중식' | '석식' | '커피'
  issuer: string
}

interface MealTicketStock {
  id: string
  date: string
  amount: number
  note: string
}

function MealManagePage() {
  const navigate = useNavigate()
  const [teamMembers, setTeamMembers] = useState<Member[]>([])
  
  // 식권 관련 State
  const [mealTickets, setMealTickets] = useState<MealTicket[]>([])
  const [mealForm, setMealForm] = useState({
    userId: '',
    place: '',
    count: 1
  })
  
  // 식권 모달 State
  const [showStockModal, setShowStockModal] = useState(false)
  const [showUsageModal, setShowUsageModal] = useState(false)

  // 식권 발급 관련 State (이전 데이터 호환성을 위해 유지)
  const [mealIssuances, setMealIssuances] = useState<MealTicketIssuance[]>([])
  const [mealStocks, setMealStocks] = useState<MealTicketStock[]>([])
  const [stockForm, setStockForm] = useState({
    amount: 10,
    note: ''
  })

  // 팀원 목록 로드
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await getMembers({ page: 0, size: 1000 })
        const allMembers = response.content
        setTeamMembers(allMembers)
      } catch (error) {
        console.error('팀원 목록 로드 실패:', error)
      }
    }
    fetchTeamMembers()
  }, [])

  // 식권 관련 함수
  const handleAddMealTicket = () => {
    if (!mealForm.userId || !mealForm.place) {
      alert('대상자와 사용처를 모두 입력해주세요.')
      return
    }
    
    const user = teamMembers.find(m => m.memberId.toString() === mealForm.userId)
    if (!user) return

    const newTicket: MealTicket = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      userId: user.memberId.toString(),
      userName: user.name,
      place: mealForm.place,
      count: mealForm.count
    }

    setMealTickets([newTicket, ...mealTickets])
    setMealForm({ userId: '', place: '', count: 1 })
    setShowUsageModal(false)
  }

  const handleAddStock = () => {
    if (stockForm.amount <= 0) {
      alert('추가할 수량을 올바르게 입력해주세요.')
      return
    }

    const newStock: MealTicketStock = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      amount: stockForm.amount,
      note: stockForm.note
    }

    setMealStocks([newStock, ...mealStocks])
    setStockForm({ amount: 10, note: '' })
    setShowStockModal(false)
  }

  // 식권 재고 계산
  const totalStock = mealStocks.reduce((sum, stock) => sum + stock.amount, 0)
  const totalUsed = mealTickets.reduce((sum, ticket) => sum + ticket.count, 0)
  const totalIssued = mealIssuances.length // 발급 건당 1장으로 가정
  const currentStock = totalStock - totalUsed - totalIssued

  // 통합 거래 내역 정렬
  const allTransactions = [
    ...mealStocks.map(s => ({ ...s, category: 'stock', dateStr: s.date })),
    ...mealTickets.map(t => ({ ...t, category: 'usage', dateStr: t.date })),
    ...mealIssuances.map(i => ({ ...i, category: 'issuance', dateStr: i.date }))
  ]
  .filter(item => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    
    // 대상자 이름으로 검색
    const targetName = item.category === 'stock' 
      ? '' 
      : item.category === 'issuance' 
        ? item.newcomerName 
        : item.userName
        
    return targetName.toLowerCase().includes(query)
  })
  .sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime())

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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-xl">
                🎫
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">식권 관리</p>
                <p className="text-xs text-slate-500">식권 추가/사용 및 재고 현황 관리</p>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {/* 재고 현황 카드 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">현재 보유 식권</p>
              <p className={`text-2xl font-bold ${currentStock < 10 ? 'text-red-600' : 'text-slate-900'}`}>
                {currentStock}장
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">총 입고 수량</p>
              <p className="text-2xl font-bold text-slate-700">{totalStock}장</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">총 사용 수량</p>
              <p className="text-2xl font-bold text-slate-700">{totalUsed + totalIssued}장</p>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowStockModal(true)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-green-700 active:scale-95"
            >
              <span>📥</span>
              식권 추가
            </button>
            <button
              onClick={() => setShowUsageModal(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95"
            >
              <span>📤</span>
              식권 사용
            </button>
          </div>

          {/* 통합 거래 내역 */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">일자</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">구분</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">대상/담당</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">상세내용</th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-700">수량/변동</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    allTransactions.map((item: any) => (
                      <tr key={`${item.category}-${item.id}`} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-slate-600">{item.dateStr}</td>
                        <td className="px-6 py-3">
                          {item.category === 'stock' ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              입고
                            </span>
                          ) : item.category === 'issuance' ? (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                              발급(새신자)
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                              사용(팀)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-900">
                          {item.category === 'stock' 
                            ? '-' 
                            : item.category === 'issuance' 
                              ? item.newcomerName 
                              : item.userName}
                        </td>
                        <td className="px-6 py-3 text-slate-600">
                          {item.category === 'stock' 
                            ? item.note 
                            : item.category === 'issuance' 
                              ? `${item.type} (발급: ${item.issuer})` 
                              : item.place}
                        </td>
                        <td className={`px-6 py-3 text-right font-medium ${
                          item.category === 'stock' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.category === 'stock' 
                            ? `+${item.amount}` 
                            : item.category === 'issuance' 
                              ? '-1' 
                              : `-${item.count}`}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 식권 입고 모달 */}
        {showStockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600 text-sm">
                  +
                </span>
                식권 재고 추가
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">추가 수량</label>
                    <input
                      type="number"
                      min="1"
                      value={stockForm.amount}
                      onChange={(e) => setStockForm({ ...stockForm, amount: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">비고</label>
                    <input
                      type="text"
                      value={stockForm.note}
                      onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })}
                      placeholder="예: 2024년 1분기 식권 구매"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                   <button
                    type="button"
                    onClick={() => setShowStockModal(false)}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleAddStock}
                    className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                  >
                    추가하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 식권 사용 모달 */}
        {showUsageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 text-sm">
                  -
                </span>
                식권 사용 (팀원)
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">대상자 (팀원)</label>
                    <select
                      value={mealForm.userId}
                      onChange={(e) => setMealForm({ ...mealForm, userId: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">대상자를 선택하세요</option>
                      {teamMembers.map((member) => (
                        <option key={member.memberId} value={member.memberId}>
                          {member.name} ({member.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">사용처</label>
                    <input
                      type="text"
                      value={mealForm.place}
                      onChange={(e) => setMealForm({ ...mealForm, place: e.target.value })}
                      placeholder="예: 카페, 식당"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">차감 개수</label>
                    <input
                      type="number"
                      min="1"
                      value={mealForm.count}
                      onChange={(e) => setMealForm({ ...mealForm, count: parseInt(e.target.value) || 1 })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUsageModal(false)}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMealTicket}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    사용하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MealManagePage
