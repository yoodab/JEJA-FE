import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface FinanceRecord {
  id: string
  date: string
  type: '주일헌금' | '행사예산' | '정산'
  title: string
  amount: number
  description: string
  status: '예정' | '완료' | '정산완료'
}

const initialRecords: FinanceRecord[] = [
  {
    id: '1',
    date: '2024-12-14',
    type: '주일헌금',
    title: '12월 둘째주 주일헌금',
    amount: 500000,
    description: '청년부 주일헌금',
    status: '완료',
  },
  {
    id: '2',
    date: '2024-12-31',
    type: '행사예산',
    title: '연말 특별예배 예산',
    amount: 300000,
    description: '연말 예배 준비비',
    status: '예정',
  },
  {
    id: '3',
    date: '2024-11-30',
    type: '정산',
    title: '11월 재정 정산',
    amount: 2000000,
    description: '11월 전체 재정 정산',
    status: '정산완료',
  },
]

function FinanceManagePage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<FinanceRecord[]>(initialRecords)
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null)
  const [formData, setFormData] = useState<Omit<FinanceRecord, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    type: '주일헌금',
    title: '',
    amount: 0,
    description: '',
    status: '예정',
  })

  const handleCreate = () => {
    setEditingRecord(null)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: '주일헌금',
      title: '',
      amount: 0,
      description: '',
      status: '예정',
    })
    setShowModal(true)
  }

  const handleEdit = (record: FinanceRecord) => {
    setEditingRecord(record)
    setFormData({
      date: record.date,
      type: record.type,
      title: record.title,
      amount: record.amount,
      description: record.description,
      status: record.status,
    })
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('재정 기록을 삭제하시겠습니까?')) {
      setRecords(records.filter((r) => r.id !== id))
    }
  }

  const handleSave = () => {
    if (!formData.title || formData.amount <= 0) {
      alert('제목과 금액을 올바르게 입력해주세요.')
      return
    }

    if (editingRecord) {
      setRecords(records.map((r) => (r.id === editingRecord.id ? { ...editingRecord, ...formData } : r)))
    } else {
      const newRecord: FinanceRecord = {
        id: Date.now().toString(),
        ...formData,
      }
      setRecords([...records, newRecord])
    }
    setShowModal(false)
  }

  const statusColors = {
    예정: 'bg-yellow-100 text-yellow-700',
    완료: 'bg-blue-100 text-blue-700',
    정산완료: 'bg-emerald-100 text-emerald-700',
  }

  const typeColors = {
    주일헌금: 'bg-blue-50 text-blue-700',
    행사예산: 'bg-purple-50 text-purple-700',
    정산: 'bg-emerald-50 text-emerald-700',
  }

  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)
  const thisMonthAmount = records
    .filter((r) => {
      const recordMonth = new Date(r.date).getMonth()
      return recordMonth === new Date().getMonth()
    })
    .reduce((sum, r) => sum + r.amount, 0)

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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-xl">
                💰
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">재정관리</p>
                <p className="text-xs text-slate-500">헌금 및 예산 관리</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-full bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
          >
            + 기록 추가
          </button>
        </header>

        {/* 통계 카드 */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">이번 달 총액</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {thisMonthAmount.toLocaleString()}원
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">전체 총액</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {totalAmount.toLocaleString()}원
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">총 기록 수</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{records.length}개</p>
          </div>
        </div>

        {/* 재정 기록 목록 */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">날짜</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">유형</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">제목</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">금액</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">설명</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">{record.date}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${typeColors[record.type]}`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{record.title}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                      {record.amount.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColors[record.status]}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{record.description}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(record)}
                          className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(record.id)}
                          className="rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 모달 */}
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
                  <label className="mb-1 block text-xs font-semibold text-slate-700">유형</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as FinanceRecord['type'] })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="주일헌금">주일헌금</option>
                    <option value="행사예산">행사예산</option>
                    <option value="정산">정산</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">제목 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">상태</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as FinanceRecord['status'] })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="예정">예정</option>
                    <option value="완료">완료</option>
                    <option value="정산완료">정산완료</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
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
      </div>
    </div>
  )
}

export default FinanceManagePage









