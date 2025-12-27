import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Absentee {
  id: string
  name: string
  phone: string
  lastAttendance: string
  weeksAbsent: number
  careStatus: '미연락' | '연락중' | '케어완료'
  careNotes: string
  nextContactDate?: string
}

const initialAbsentees: Absentee[] = [
  {
    id: '1',
    name: '최성민',
    phone: '010-1234-5678',
    lastAttendance: '2024-10-15',
    weeksAbsent: 8,
    careStatus: '연락중',
    careNotes: '전화 통화 완료, 다음 주 참석 예정',
    nextContactDate: '2024-12-20',
  },
  {
    id: '2',
    name: '김희수',
    phone: '010-2345-6789',
    lastAttendance: '2024-11-01',
    weeksAbsent: 6,
    careStatus: '미연락',
    careNotes: '',
  },
  {
    id: '3',
    name: '조문성',
    phone: '010-3456-7890',
    lastAttendance: '2024-09-20',
    weeksAbsent: 12,
    careStatus: '케어완료',
    careNotes: '심방 완료, 개인 사정으로 잠시 휴식',
  },
]

function AbsenteeManagePage() {
  const navigate = useNavigate()
  const [absentees, setAbsentees] = useState<Absentee[]>(initialAbsentees)
  const [showModal, setShowModal] = useState(false)
  const [editingAbsentee, setEditingAbsentee] = useState<Absentee | null>(null)
  const [formData, setFormData] = useState<Omit<Absentee, 'id'>>({
    name: '',
    phone: '',
    lastAttendance: '',
    weeksAbsent: 0,
    careStatus: '미연락',
    careNotes: '',
  })

  const handleCreate = () => {
    setEditingAbsentee(null)
    setFormData({
      name: '',
      phone: '',
      lastAttendance: '',
      weeksAbsent: 0,
      careStatus: '미연락',
      careNotes: '',
    })
    setShowModal(true)
  }

  const handleEdit = (absentee: Absentee) => {
    setEditingAbsentee(absentee)
    setFormData({
      name: absentee.name,
      phone: absentee.phone,
      lastAttendance: absentee.lastAttendance,
      weeksAbsent: absentee.weeksAbsent,
      careStatus: absentee.careStatus,
      careNotes: absentee.careNotes,
      nextContactDate: absentee.nextContactDate,
    })
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('장기결석자 정보를 삭제하시겠습니까?')) {
      setAbsentees(absentees.filter((a) => a.id !== id))
    }
  }

  const handleSave = () => {
    if (!formData.name || !formData.lastAttendance) {
      alert('이름과 마지막 출석일을 입력해주세요.')
      return
    }

    if (editingAbsentee) {
      setAbsentees(absentees.map((a) => (a.id === editingAbsentee.id ? { ...editingAbsentee, ...formData } : a)))
    } else {
      const newAbsentee: Absentee = {
        id: Date.now().toString(),
        ...formData,
      }
      setAbsentees([...absentees, newAbsentee])
    }
    setShowModal(false)
  }

  const statusColors = {
    미연락: 'bg-slate-100 text-slate-700',
    연락중: 'bg-yellow-100 text-yellow-700',
    케어완료: 'bg-emerald-100 text-emerald-700',
  }

  const urgentAbsentees = absentees.filter((a) => a.weeksAbsent >= 8)

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              ← 돌아가기
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Care List</p>
              <p className="text-sm font-semibold text-slate-900">장기결석자</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-full bg-rose-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
          >
            + 결석자 추가
          </button>
        </header>

        {/* 통계 카드 */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">총 장기결석자</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{absentees.length}명</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">8주 이상 결석</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">{urgentAbsentees.length}명</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">케어 필요</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">
              {absentees.filter((a) => a.careStatus === '미연락' || a.careStatus === '연락중').length}명
            </p>
          </div>
        </div>

        {/* 결석자 목록 */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">이름</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">연락처</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">마지막 출석</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">결석 주수</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">케어 상태</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">다음 연락일</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">케어 메모</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {absentees.map((absentee) => (
                  <tr key={absentee.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{absentee.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{absentee.phone}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{absentee.lastAttendance}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${absentee.weeksAbsent >= 8 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {absentee.weeksAbsent}주
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColors[absentee.careStatus]}`}>
                        {absentee.careStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{absentee.nextContactDate || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{absentee.careNotes || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(absentee)}
                          className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(absentee.id)}
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
                {editingAbsentee ? '결석자 수정' : '결석자 추가'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">이름 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">연락처</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">마지막 출석일 *</label>
                  <input
                    type="date"
                    value={formData.lastAttendance}
                    onChange={(e) => setFormData({ ...formData, lastAttendance: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">결석 주수</label>
                  <input
                    type="number"
                    value={formData.weeksAbsent}
                    onChange={(e) => setFormData({ ...formData, weeksAbsent: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    min="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">케어 상태</label>
                  <select
                    value={formData.careStatus}
                    onChange={(e) => setFormData({ ...formData, careStatus: e.target.value as Absentee['careStatus'] })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="미연락">미연락</option>
                    <option value="연락중">연락중</option>
                    <option value="케어완료">케어완료</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">다음 연락일</label>
                  <input
                    type="date"
                    value={formData.nextContactDate || ''}
                    onChange={(e) => setFormData({ ...formData, nextContactDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">케어 메모</label>
                  <textarea
                    value={formData.careNotes}
                    onChange={(e) => setFormData({ ...formData, careNotes: e.target.value })}
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
                  className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
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

export default AbsenteeManagePage







