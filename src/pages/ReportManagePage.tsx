import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface ReportField {
  id: string
  label: string
  type: 'number' | 'checkbox' | 'text' | 'textarea'
  score: number
  required: boolean
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  fields: ReportField[]
  createdAt: string
  createdBy: string
}

interface ReportSubmission {
  id: string
  templateId: string
  soonName: string
  leaderName: string
  date: string
  memberData: Record<string, Record<string, any>>
  totalScore: number
  status: '작성중' | '제출완료' | '승인완료'
}

// 기본 보고서 템플릿 (예시)
const defaultTemplate: ReportTemplate = {
  id: 'default',
  name: '순예배 보고서',
  description: '제자교회 청년부 순예배 보고서',
  createdAt: '2024-12-01',
  createdBy: '목사님',
  fields: [
    { id: 'dawn', label: '새벽예배 참석횟수', type: 'number', score: 20, required: false },
    { id: 'wednesday', label: '수요예배 참석여부', type: 'checkbox', score: 10, required: false },
    { id: 'friday', label: '금요기도회 참석여부', type: 'checkbox', score: 10, required: false },
    { id: 'qt', label: 'QT횟수', type: 'number', score: 10, required: false },
    { id: 'sunday_morning', label: '주일오전예배 참석', type: 'checkbox', score: 0, required: false },
    { id: 'sunday_youth', label: '주일청년예배 참석', type: 'checkbox', score: 20, required: false },
    { id: 'prayer', label: '기도제목', type: 'textarea', score: 0, required: false },
    { id: 'remarks', label: '비고', type: 'textarea', score: 0, required: false },
  ],
}

// 임시 순원 데이터
const sampleMembers = [
  '윤다빈', '최인서', '최신정', '이하영', '최영락', '이지훈', '이민규', '홍기정', '유준혁', '김신우', '구자한',
]

const initialTemplates: ReportTemplate[] = [defaultTemplate]

const initialSubmissions: ReportSubmission[] = [
  {
    id: '1',
    templateId: 'default',
    soonName: '믿음셀',
    leaderName: '윤다빈',
    date: '2025-09-07',
    memberData: {
      '윤다빈': { friday: true, sunday_youth: true },
      '최인서': { friday: true, sunday_youth: true },
      '최신정': { sunday_morning: true },
      '이민규': { friday: true, sunday_youth: true },
      '김신우': { sunday_youth: true },
    },
    totalScore: 110,
    status: '제출완료',
  },
]

function ReportManagePage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<ReportTemplate[]>(initialTemplates)
  const [submissions, setSubmissions] = useState<ReportSubmission[]>(initialSubmissions)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<ReportSubmission | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(defaultTemplate)
  const [activeTab, setActiveTab] = useState<'templates' | 'submissions'>('templates')

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setShowTemplateModal(true)
  }

  const handleEditTemplate = (template: ReportTemplate) => {
    setEditingTemplate(template)
    setShowTemplateModal(true)
  }

  const handleSaveTemplate = (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'createdBy'>) => {
    if (editingTemplate) {
      setTemplates(templates.map((t) => (t.id === editingTemplate.id ? { ...editingTemplate, ...template } : t)))
    } else {
      const newTemplate: ReportTemplate = {
        ...template,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: '목사님',
      }
      setTemplates([...templates, newTemplate])
    }
    setShowTemplateModal(false)
  }

  const handleDeleteTemplate = (id: string) => {
    if (confirm('보고서 템플릿을 삭제하시겠습니까?')) {
      setTemplates(templates.filter((t) => t.id !== id))
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(templates.find((t) => t.id !== id) || null)
      }
    }
  }

  const handleCreateSubmission = () => {
    if (!selectedTemplate) {
      alert('보고서 템플릿을 먼저 선택해주세요.')
      return
    }
    setShowSubmissionModal(true)
  }

  const calculateScore = (memberData: Record<string, any>, template: ReportTemplate): number => {
    let score = 0
    template.fields.forEach((field) => {
      if (field.type === 'checkbox' && memberData[field.id]) {
        score += field.score
      } else if (field.type === 'number' && memberData[field.id]) {
        score += field.score * Number(memberData[field.id])
      }
    })
    return score
  }

  const handleSaveSubmission = (submission: Omit<ReportSubmission, 'id' | 'totalScore'>) => {
    if (!selectedTemplate) return

    const memberScores: Record<string, number> = {}
    Object.keys(submission.memberData).forEach((memberName) => {
      memberScores[memberName] = calculateScore(submission.memberData[memberName], selectedTemplate)
    })

    const totalScore = Object.values(memberScores).reduce((sum, score) => sum + score, 0)

    const newSubmission: ReportSubmission = {
      ...submission,
      id: Date.now().toString(),
      totalScore,
    }
    setSubmissions([...submissions, newSubmission])
    setShowSubmissionModal(false)
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl">
                📄
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">보고서 관리</p>
                <p className="text-xs text-slate-500">주간·월간 보고서 작성</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {activeTab === 'templates' && (
              <button
                type="button"
                onClick={handleCreateTemplate}
                className="rounded-full bg-slate-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                + 보고서 형식 추가
              </button>
            )}
            {activeTab === 'submissions' && selectedTemplate && (
              <button
                type="button"
                onClick={handleCreateSubmission}
                className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                + 보고서 작성
              </button>
            )}
          </div>
        </header>

        {/* 탭 */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`flex-1 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === 'templates'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              보고서 형식 관리
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('submissions')}
              className={`flex-1 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === 'submissions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              보고서 작성/조회
            </button>
          </div>

          <div className="p-6">
            {/* 보고서 형식 관리 탭 */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template) => (
                    <div key={template.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{template.name}</h3>
                          <p className="mt-1 text-xs text-slate-500">{template.description}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            생성일: {template.createdAt} | {template.createdBy}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditTemplate(template)}
                            className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-700">항목 ({template.fields.length}개)</p>
                        <div className="space-y-1">
                          {template.fields.slice(0, 3).map((field) => (
                            <div key={field.id} className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">{field.label}</span>
                              <span className="font-semibold text-blue-600">+{field.score}점</span>
                            </div>
                          ))}
                          {template.fields.length > 3 && (
                            <p className="text-xs text-slate-400">외 {template.fields.length - 3}개 항목...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 보고서 작성/조회 탭 */}
            {activeTab === 'submissions' && (
              <div className="space-y-4">
                {/* 템플릿 선택 */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">보고서 형식 선택</label>
                  <select
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => {
                      const template = templates.find((t) => t.id === e.target.value)
                      setSelectedTemplate(template || null)
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">선택하세요</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 제출된 보고서 목록 */}
                {selectedTemplate && (
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">순명</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">순장</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">날짜</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">총점</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">상태</th>
                            <th className="px-3 py-2 text-right font-semibold text-slate-700">작업</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {submissions
                            .filter((s) => s.templateId === selectedTemplate.id)
                            .map((submission) => (
                              <tr key={submission.id} className="hover:bg-slate-50">
                                <td className="px-3 py-2 text-slate-900">{submission.soonName}</td>
                                <td className="px-3 py-2 text-slate-600">{submission.leaderName}</td>
                                <td className="px-3 py-2 text-slate-600">{submission.date}</td>
                                <td className="px-3 py-2 font-semibold text-slate-900">{submission.totalScore}점</td>
                                <td className="px-3 py-2">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                      submission.status === '승인완료'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : submission.status === '제출완료'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-yellow-100 text-yellow-700'
                                    }`}
                                  >
                                    {submission.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSubmission(submission)
                                      setShowDetailModal(true)
                                    }}
                                    className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                                  >
                                    보기
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 보고서 형식 생성/수정 모달 */}
        {showTemplateModal && (
          <TemplateModal
            template={editingTemplate}
            onSave={handleSaveTemplate}
            onClose={() => setShowTemplateModal(false)}
          />
        )}

        {/* 보고서 작성 모달 */}
        {showSubmissionModal && selectedTemplate && (
          <SubmissionModal
            template={selectedTemplate}
            members={sampleMembers}
            onSave={handleSaveSubmission}
            onClose={() => setShowSubmissionModal(false)}
          />
        )}

        {/* 보고서 상세보기 모달 */}
        {showDetailModal && selectedSubmission && selectedTemplate && (
          <DetailModal
            submission={selectedSubmission}
            template={selectedTemplate}
            members={sampleMembers}
            onClose={() => {
              setShowDetailModal(false)
              setSelectedSubmission(null)
            }}
            onStatusChange={(status) => {
              setSubmissions(
                submissions.map((s) => (s.id === selectedSubmission.id ? { ...s, status } : s))
              )
            }}
          />
        )}
      </div>
    </div>
  )
}

// 보고서 형식 생성/수정 모달 컴포넌트
function TemplateModal({
  template,
  onSave,
  onClose,
}: {
  template: ReportTemplate | null
  onSave: (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'createdBy'>) => void
  onClose: () => void
}) {
  const [name, setName] = useState(template?.name || '')
  const [description, setDescription] = useState(template?.description || '')
  const [fields, setFields] = useState<ReportField[]>(template?.fields || [])

  const addField = () => {
    setFields([
      ...fields,
      {
        id: Date.now().toString(),
        label: '',
        type: 'text',
        score: 0,
        required: false,
      },
    ])
  }

  const updateField = (id: string, updates: Partial<ReportField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id))
  }

  const handleSave = () => {
    if (!name || fields.length === 0) {
      alert('보고서 이름과 항목을 입력해주세요.')
      return
    }
    onSave({ name, description, fields })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          {template ? '보고서 형식 수정' : '보고서 형식 생성'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">보고서 이름 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="예: 순예배 보고서"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">설명</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="보고서 설명"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">항목 설정</label>
              <button
                type="button"
                onClick={addField}
                className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
              >
                + 항목 추가
              </button>
            </div>
            <div className="space-y-2">
              {fields.map((field) => (
                <div key={field.id} className="flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="항목명"
                    className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateField(field.id, { type: e.target.value as ReportField['type'] })}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  >
                    <option value="text">텍스트</option>
                    <option value="textarea">긴 텍스트</option>
                    <option value="number">숫자</option>
                    <option value="checkbox">체크박스</option>
                  </select>
                  <input
                    type="number"
                    value={field.score}
                    onChange={(e) => updateField(field.id, { score: Number(e.target.value) })}
                    placeholder="점수"
                    className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    className="rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

// 보고서 작성 모달 컴포넌트
function SubmissionModal({
  template,
  members,
  onSave,
  onClose,
}: {
  template: ReportTemplate
  members: string[]
  onSave: (submission: Omit<ReportSubmission, 'id' | 'totalScore'>) => void
  onClose: () => void
}) {
  const [soonName, setSoonName] = useState('')
  const [leaderName, setLeaderName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [memberData, setMemberData] = useState<Record<string, Record<string, any>>>({})

  const updateMemberField = (memberName: string, fieldId: string, value: any) => {
    setMemberData({
      ...memberData,
      [memberName]: {
        ...memberData[memberName],
        [fieldId]: value,
      },
    })
  }

  const calculateMemberScore = (memberName: string): number => {
    const data = memberData[memberName] || {}
    let score = 0
    template.fields.forEach((field) => {
      if (field.type === 'checkbox' && data[field.id]) {
        score += field.score
      } else if (field.type === 'number' && data[field.id]) {
        score += field.score * Number(data[field.id])
      }
    })
    return score
  }

  const handleSave = () => {
    if (!soonName || !leaderName || !date) {
      alert('순명, 순장명, 날짜를 입력해주세요.')
      return
    }
    onSave({
      templateId: template.id,
      soonName,
      leaderName,
      date,
      memberData,
      status: '작성중',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-7xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">{template.name} 작성</h3>
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">순명 *</label>
            <input
              type="text"
              value={soonName}
              onChange={(e) => setSoonName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">순장명 *</label>
            <input
              type="text"
              value={leaderName}
              onChange={(e) => setLeaderName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">날짜 *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">순원</th>
                {template.fields.map((field) => (
                  <th key={field.id} className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">
                    {field.label}
                    {field.score > 0 && <span className="ml-1 text-blue-600">(+{field.score})</span>}
                  </th>
                ))}
                <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">점수</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member} className="hover:bg-slate-50">
                  <td className="border border-slate-300 px-2 py-2 font-medium text-slate-900">{member}</td>
                  {template.fields.map((field) => (
                    <td key={field.id} className="border border-slate-300 px-2 py-2">
                      {field.type === 'checkbox' ? (
                        <input
                          type="checkbox"
                          checked={memberData[member]?.[field.id] || false}
                          onChange={(e) => updateMemberField(member, field.id, e.target.checked)}
                          className="h-4 w-4"
                        />
                      ) : field.type === 'number' ? (
                        <input
                          type="number"
                          value={memberData[member]?.[field.id] || ''}
                          onChange={(e) => updateMemberField(member, field.id, e.target.value)}
                          className="w-full rounded border border-slate-300 px-2 py-1"
                          min="0"
                        />
                      ) : field.type === 'textarea' ? (
                        <textarea
                          value={memberData[member]?.[field.id] || ''}
                          onChange={(e) => updateMemberField(member, field.id, e.target.value)}
                          className="w-full rounded border border-slate-300 px-2 py-1"
                          rows={2}
                        />
                      ) : (
                        <input
                          type="text"
                          value={memberData[member]?.[field.id] || ''}
                          onChange={(e) => updateMemberField(member, field.id, e.target.value)}
                          className="w-full rounded border border-slate-300 px-2 py-1"
                        />
                      )}
                    </td>
                  ))}
                  <td className="border border-slate-300 px-2 py-2 font-semibold text-slate-900">
                    {calculateMemberScore(member)}점
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td className="border border-slate-300 px-2 py-2 text-slate-900">합계</td>
                {template.fields.map(() => (
                  <td key={Math.random()} className="border border-slate-300 px-2 py-2" />
                ))}
                <td className="border border-slate-300 px-2 py-2 text-slate-900">
                  {members.reduce((sum, member) => sum + calculateMemberScore(member), 0)}점
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

// 보고서 상세보기 모달 컴포넌트
function DetailModal({
  submission,
  template,
  members,
  onClose,
  onStatusChange,
}: {
  submission: ReportSubmission
  template: ReportTemplate
  members: string[]
  onClose: () => void
  onStatusChange: (status: ReportSubmission['status']) => void
}) {
  const calculateMemberScore = (memberName: string): number => {
    const data = submission.memberData[memberName] || {}
    let score = 0
    template.fields.forEach((field) => {
      if (field.type === 'checkbox' && data[field.id]) {
        score += field.score
      } else if (field.type === 'number' && data[field.id]) {
        score += field.score * Number(data[field.id])
      }
    })
    return score
  }

  const formatFieldValue = (field: ReportField, value: any): string => {
    if (field.type === 'checkbox') {
      return value ? '✓' : '-'
    }
    if (field.type === 'number') {
      return value ? String(value) : '-'
    }
    return value || '-'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-7xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{template.name}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {submission.soonName} | 순장: {submission.leaderName} | {submission.date}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* 보고서 정보 요약 */}
        <div className="mb-4 grid grid-cols-4 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-xs text-slate-500">순명</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{submission.soonName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">순장</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{submission.leaderName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">날짜</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{submission.date}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">총점</p>
            <p className="mt-1 text-xl font-bold text-blue-600">{submission.totalScore}점</p>
          </div>
        </div>

        {/* 순원별 상세 데이터 테이블 */}
        <div className="mb-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">순원</th>
                {template.fields.map((field) => (
                  <th key={field.id} className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">
                    <div>{field.label}</div>
                    {field.score > 0 && (
                      <div className="mt-0.5 text-[10px] font-normal text-blue-600">(+{field.score}점)</div>
                    )}
                  </th>
                ))}
                <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">점수</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const memberScore = calculateMemberScore(member)
                const hasData = Object.keys(submission.memberData[member] || {}).length > 0
                return (
                  <tr key={member} className={hasData ? 'hover:bg-slate-50' : 'bg-slate-50/50'}>
                    <td className="border border-slate-300 px-3 py-2 font-medium text-slate-900">{member}</td>
                    {template.fields.map((field) => {
                      const value = submission.memberData[member]?.[field.id]
                      return (
                        <td key={field.id} className="border border-slate-300 px-3 py-2 text-slate-600">
                          {field.type === 'textarea' ? (
                            <div className="max-w-[200px] whitespace-pre-wrap break-words text-xs">
                              {formatFieldValue(field, value)}
                            </div>
                          ) : (
                            <div className="text-center">{formatFieldValue(field, value)}</div>
                          )}
                        </td>
                      )
                    })}
                    <td className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-900">
                      {memberScore}점
                    </td>
                  </tr>
                )
              })}
              <tr className="bg-blue-50 font-semibold">
                <td className="border border-slate-300 px-3 py-2 text-slate-900">합계</td>
                {template.fields.map(() => (
                  <td key={Math.random()} className="border border-slate-300 px-3 py-2" />
                ))}
                <td className="border border-slate-300 px-3 py-2 text-center text-blue-600">
                  {submission.totalScore}점
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 상태 변경 및 액션 */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">상태:</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                submission.status === '승인완료'
                  ? 'bg-emerald-100 text-emerald-700'
                  : submission.status === '제출완료'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {submission.status}
            </span>
          </div>
          <div className="flex gap-2">
            {submission.status === '제출완료' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onStatusChange('승인완료')
                    alert('보고서가 승인되었습니다.')
                  }}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  승인
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onStatusChange('작성중')
                    alert('보고서가 반려되었습니다.')
                  }}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  반려
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportManagePage
