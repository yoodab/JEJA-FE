import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { getMeals, addMealStock, consumeMealTicket, updateMeal, deleteMeal, type MealHistoryItem } from '../services/mealService'

function MealManagePage() {
  
  // Data from Server
  const [currentStock, setCurrentStock] = useState(0)
  const [history, setHistory] = useState<MealHistoryItem[]>([])

  // Forms
  const [mealForm, setMealForm] = useState({
    place: '',
    count: 1
  })
  
  const [stockForm, setStockForm] = useState({
    amount: 10,
    note: ''
  })
  
  // Modals
  const [showStockModal, setShowStockModal] = useState(false)
  const [showUsageModal, setShowUsageModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Update/Delete State
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null)
  const [listMenuPos, setListMenuPos] = useState<{ top: number; right: number; bottom: number } | null>(null)
  const [openMenuUp, setOpenMenuUp] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MealHistoryItem | null>(null)
  const [updateForm, setUpdateForm] = useState({
    date: '',
    note: '',
    amount: 0
  })

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const data = await getMeals()
      console.log('API Response Data:', data) // 디버깅용 로그
      if (data) {
        setCurrentStock(data.currentStock || 0)
        setHistory(data.history || [])
      } else {
        console.warn('식권 데이터가 비어 있습니다.')
        setHistory([])
      }
    } catch (error) {
      console.error('식권 데이터 로드 실패:', error)
      setHistory([])
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handlers
  const handleAddMealTicket = async () => {
    if (!mealForm.place) {
      toast.error('사용처를 입력해주세요.')
      return
    }
    
    try {
      await consumeMealTicket({
        userName: '-',
        place: mealForm.place,
        count: mealForm.count
      })
      
      await loadData()
      setMealForm({ place: '', count: 1 })
      setShowUsageModal(false)
      toast.success('식권 사용이 등록되었습니다.')
    } catch (error) {
      console.error('식권 사용 등록 실패:', error)
      toast.error('식권 사용 등록 중 오류가 발생했습니다.')
    }
  }

  const handleAddStock = async () => {
    if (stockForm.amount <= 0) {
      toast.error('추가할 수량을 올바르게 입력해주세요.')
      return
    }

    try {
      await addMealStock({
        amount: stockForm.amount,
        note: stockForm.note
      })

      await loadData()
      setStockForm({ amount: 10, note: '' })
      setShowStockModal(false)
      toast.success('식권 재고가 추가되었습니다.')
    } catch (error) {
      console.error('재고 추가 실패:', error)
      toast.error('재고 추가 중 오류가 발생했습니다.')
    }
  }

  // Update/Delete Handlers
  const handleMenuClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setListMenuPos({ top: rect.top, right: rect.right, bottom: rect.bottom })
    setOpenMenuUp(rect.bottom + 120 > window.innerHeight)
    setActiveMenuId(activeMenuId === id ? null : id)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  const handleEditClick = (item: MealHistoryItem) => {
    setSelectedItem(item)
    setUpdateForm({
      date: item.date,
      note: item.note || '',
      amount: Math.abs(item.amount)
    })
    setShowUpdateModal(true)
    setActiveMenuId(null)
  }

  const handleDeleteClick = (item: MealHistoryItem) => {
    setSelectedItem(item)
    setShowDeleteModal(true)
    setActiveMenuId(null)
  }

  const handleUpdateSubmit = async () => {
    if (!selectedItem) return
    if (updateForm.amount <= 0) {
      toast.error('수량은 0보다 커야 합니다.')
      return
    }

    try {
      await updateMeal(selectedItem.id, {
        date: updateForm.date,
        targetName: selectedItem.targetName || '-',
        note: updateForm.note,
        amount: updateForm.amount
      })
      
      await loadData()
      setShowUpdateModal(false)
      setSelectedItem(null)
      toast.success('내역이 수정되었습니다.')
    } catch (error) {
      console.error('내역 수정 실패:', error)
      toast.error('내역 수정 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteSubmit = async () => {
    if (!selectedItem) return

    try {
      await deleteMeal(selectedItem.id)
      await loadData()
      setShowDeleteModal(false)
      setSelectedItem(null)
      toast.success('내역이 삭제되었습니다.')
    } catch (error) {
      console.error('내역 삭제 실패:', error)
      toast.error('내역 삭제 중 오류가 발생했습니다.')
    }
  }

  // Calculate totals for display (Client-side calculation for stats cards)
  const totalUsed = (history || [])
    .filter(item => item.category === 'USE')
    .reduce((sum, item) => sum + Math.abs(item.amount), 0)

  // Filter logic
  const filteredHistory = [...(history || [])].sort((a, b) => {
    // 1. 날짜 기준 내림차순 (최신순)
    if (b.date !== a.date) return b.date.localeCompare(a.date)
    // 2. 날짜가 같으면 ID 기준 내림차순 (최신순)
    return b.id - a.id
  })

  // Calculate Balance for each item (Reverse calculation from currentStock)
  // Assuming filteredHistory is sorted by newest first
  const historyWithBalance: (MealHistoryItem & { balance: number })[] = []
  let runningBalance = currentStock

  for (const item of filteredHistory) {
    const balance = runningBalance
    // 현재 항목의 변화량만큼 빼서 이전 잔고를 계산
    runningBalance = runningBalance - item.amount
    historyWithBalance.push({ ...item, balance })
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-green-50 text-2xl shadow-inner">
                🎫
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">식권 관리</h1>
                <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Inventory & History</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* 현재 보유 식권 */}
        <div className="col-span-2 sm:col-span-1 p-5 relative overflow-hidden group rounded-xl bg-slate-50">
          <div className="absolute top-0 right-0 p-3 text-3xl opacity-10 group-hover:scale-110 transition-transform">🎫</div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">현재 보유 식권</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black ${currentStock < 10 ? 'text-red-500' : 'text-slate-900'}`}>
              {currentStock}
            </span>
            <span className="text-sm font-bold text-slate-500">장</span>
          </div>
          {currentStock < 10 && (
            <p className="mt-2 text-[10px] font-bold text-red-400 animate-pulse">재고가 부족합니다!</p>
          )}
        </div>

        {/* 이번달 사용량 */}
        <div className="col-span-2 sm:col-span-1 p-5 relative overflow-hidden group rounded-xl bg-slate-50">
          <div className="absolute top-0 right-0 p-3 text-3xl opacity-10 group-hover:scale-110 transition-transform">📊</div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">이번달 사용량</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900">{totalUsed}</span>
            <span className="text-sm font-bold text-slate-500">장</span>
          </div>
        </div>
      </div>

          {/* 액션 버튼 */}
          <div className="flex flex-row justify-end gap-2 sm:gap-3">
            <button
              onClick={() => setShowStockModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 sm:px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-green-700 active:scale-95"
            >
              <span className="text-lg">📥</span>
              식권 추가
            </button>
            <button
              onClick={() => setShowUsageModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 sm:px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
            >
              <span className="text-lg">📤</span>
              식권 사용
            </button>
          </div>

          {/* 통합 거래 내역 */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">일자</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">구분</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">상세내용</th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-700">추가</th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-700">사용</th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-700">총계</th>
                    <th className="px-6 py-3 text-center font-semibold text-slate-700">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {historyWithBalance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    historyWithBalance.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-slate-600 whitespace-nowrap">{item.date}</td>
                        <td className="px-6 py-3">
                          {item.category === 'STOCK' ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                              추가
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                              사용
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-slate-600 max-w-[200px] truncate">
                          {item.note}
                        </td>
                        {/* 추가 (입고) */}
                        <td className="px-6 py-3 text-right font-medium text-green-600">
                          {item.amount > 0 ? `+${item.amount}` : '-'}
                        </td>
                        {/* 사용 (지출) */}
                        <td className="px-6 py-3 text-right font-medium text-red-600">
                          {item.amount < 0 ? `${item.amount}` : '-'}
                        </td>
                        {/* 총계 (잔고) */}
                        <td className="px-6 py-3 text-right font-bold text-slate-900">
                          {item.balance}
                        </td>
                        {/* 관리 메뉴 */}
                        <td className="px-6 py-3 text-center relative">
                          <button
                            type="button"
                            onClick={(e) => handleMenuClick(item.id, e)}
                            className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
             <div className="block md:hidden divide-y divide-slate-100">
               {historyWithBalance.length === 0 ? (
                 <div className="px-4 py-12 text-center text-slate-500">
                   <div className="text-4xl mb-3">📄</div>
                   <p className="text-sm font-medium">내역이 없습니다.</p>
                 </div>
               ) : (
                 historyWithBalance.map((item) => (
                   <div key={item.id} className="p-4 active:bg-slate-50 transition-colors relative">
                     <div className="flex items-start justify-between mb-3">
                       <div className="flex flex-col gap-1">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.date}</span>
                         <div className="flex items-center gap-2">
                            {item.category === 'STOCK' ? (
                              <span className="inline-flex items-center rounded-lg bg-green-50 px-2 py-0.5 text-[10px] font-black text-green-600 border border-green-100 uppercase">
                                추가
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-lg bg-slate-50 px-2 py-0.5 text-[10px] font-black text-slate-500 border border-slate-100 uppercase">
                                사용
                              </span>
                            )}
                           <p className="text-sm font-bold text-slate-800 line-clamp-1">
                             {item.note || (item.category === 'STOCK' ? '식권 충전' : '식권 사용')}
                           </p>
                         </div>
                       </div>
                       <button
                         type="button"
                         onClick={(e) => handleMenuClick(item.id, e)}
                         className="p-2 -mr-2 rounded-full text-slate-300 active:bg-slate-100 transition-colors"
                       >
                         <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                           <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                         </svg>
                       </button>
                     </div>

                     <div className="flex items-center justify-between bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                       <div className="flex flex-col">
                         <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-0.5">변동 수량</span>
                         <span className={`text-sm font-black ${item.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                           {item.amount > 0 ? `+${item.amount}` : item.amount}
                         </span>
                       </div>
                       <div className="h-6 w-px bg-slate-200"></div>
                       <div className="flex flex-col items-end">
                         <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-0.5">최종 잔액</span>
                         <span className="text-sm font-black text-slate-900">
                           {item.balance}장
                         </span>
                       </div>
                     </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      </div>

        {/* Dropdown Menu Portal */}
        {activeMenuId !== null && listMenuPos && (
          <div
            className="fixed z-[100] w-40 rounded-lg border border-slate-200 bg-white shadow-xl"
            style={{
              top: openMenuUp ? listMenuPos.top : listMenuPos.bottom,
              left: listMenuPos.right,
              transform: `translateX(-100%) ${openMenuUp ? 'translateY(-100%)' : ''}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                const item = history.find(h => h.id === activeMenuId)
                if (item) handleEditClick(item)
                setActiveMenuId(null)
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
            >
              <span></span> 수정
            </button>
            <div className="border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  const item = history.find(h => h.id === activeMenuId)
                  if (item) handleDeleteClick(item)
                  setActiveMenuId(null)
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50 rounded-b-lg"
              >
                <span></span> 삭제
              </button>
            </div>
          </div>
        )}

        {/* 식권 입고 모달 */}
        {showStockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
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
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 text-sm">
                  -
                </span>
                식권 사용
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">사용내용</label>
                    <input
                      type="text"
                      value={mealForm.place}
                      onChange={(e) => setMealForm({ ...mealForm, place: e.target.value })}
                      placeholder="예: 카페, 식당, 팀회식"
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

        {/* 식권 내역 수정 모달 */}
        {showUpdateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 text-sm">
                  ✏️
                </span>
                식권 내역 수정
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">날짜 (YYYY-MM-DD)</label>
                    <input
                      type="date"
                      value={updateForm.date}
                      onChange={(e) => setUpdateForm({ ...updateForm, date: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">상세내용 (비고)</label>
                    <input
                      type="text"
                      value={updateForm.note}
                      onChange={(e) => setUpdateForm({ ...updateForm, note: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">수량</label>
                    <input
                      type="number"
                      min="1"
                      value={updateForm.amount}
                      onChange={(e) => setUpdateForm({ ...updateForm, amount: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <p className="mt-1 text-xs text-slate-500">* 입고/사용 구분은 유지됩니다.</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateSubmit}
                    className="flex-1 rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
                  >
                    수정하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 식권 내역 삭제 모달 */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 text-sm">
                  🗑️
                </span>
                내역 삭제
              </h3>
              <p className="mb-6 text-sm text-slate-600">
                정말 이 내역을 삭제하시겠습니까?<br />
                삭제된 내역은 복구할 수 없습니다.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubmit}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  삭제하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MealManagePage
