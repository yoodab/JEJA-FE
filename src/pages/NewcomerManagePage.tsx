import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Newcomer {
  id: string
  mdName: string
  writeDate: string
  name: string
  registered: 'Y' | 'N'
  gender: '남성' | '여성'
  birthDate: string
  phone: string
  assignedSoon: string
  mentor: string
  address: string
  firstStatus: string
  middleStatus: string
  recentStatus: string
  soonAssignmentNote: string
}

const initialNewcomers: Newcomer[] = [
  {
    id: '1',
    mdName: '조형진',
    writeDate: '2024-12-01',
    name: '김동환',
    registered: 'Y',
    gender: '남성',
    birthDate: '2000-05-15',
    phone: '010-1234-5678',
    assignedSoon: '믿음셀',
    mentor: '김리더',
    address: '서울시 강남구',
    firstStatus: '친구와 함께 첫 방문',
    middleStatus: '순모임 참석 시작',
    recentStatus: '정착 진행 중',
    soonAssignmentNote: '적극적인 성향, 빠른 순배치 권장',
  },
]

const messageTemplates = [
  {
    category: '필수',
    content: '안녕하세요. 000 형제/자매님~ 오늘 함께했던 MD 000입니다. 오늘 만나뵙게 되어서 정말 반가웠습니다. 앞으로 교회생활 하는데 있어서 제가 멘토처럼 함께해 드릴 예정이니 궁금하거나 문의사항 있으시면 언제든지 말해주세요!',
    timing: '당일',
    note: '대화 나누면서 인상깊었던 점이나 공통점 등을 추가적으로 문구에 넣어도 좋음\nex) 저랑 나이가 동갑이어서 그런지 더 반가웠던 것 같아요!',
  },
  {
    category: '필수',
    content: '청년부 공지 및 순모임 안내',
    timing: '정기적',
    note: '순에 배치는 되지만 순모임 단톡방에는 없기 때문에 정기적으로 공지를 공유해 주어야 함',
  },
  {
    category: '필수',
    content: '000 형제/자매님~ 안녕하세요!\n이번주 청년부 공지 공유드립니다.\n------공지------\n혹시 내일은 몇 부 예배 오시나요??\n------- 3부 예배 시 ------\n아 그럼 예배 마치시고, 0000에서 같이 식사 어떠신가요?',
    timing: '매주 토요일',
    note: '공지 보내면서 주일에 몇부에 오는지 확인. 가능하다면 식사도 같이 하자고 제안',
  },
  {
    category: '선택',
    content: '000 형제/자매님~ 이번주에 못뵜던 것 같아요.\n혹시 오셨었나요? (아프셨던 거는 괜찮으세요?)',
    timing: '주일 저녁 또는 월요일 오전',
    note: '안왔을 경우 근황 확인',
  },
  {
    category: '선택',
    content: '000 형제/자매님~  제가 내일은 개인 일정이 있어서\n부득이 하게 식사를 같이 못하게 되었어요. 대신 지난번에 함께 했던 0000이 연락드릴 예정이에요! 3부 예배 후, 1층에서 만나시면 될 것 같습니다.',
    timing: '토요일 오후',
    note: '담당MD가 식사를 챙기지 못할 시',
  },
  {
    category: '선택',
    content: '저희 이번에 (행사명)을 하는데 같이 가시는 건 어떠신가요?\n이 (행사명)이 0000도 하고, 00000 나눔도 있다보니 다녀오면 은혜가 많이 되더라구요. 000님도 함께 가면 너무나 재밌을 것 같아요!',
    timing: '행사 신청 기간',
    note: '비전심기, 수련회 등 청년부 주요 행사 신청기간에 신청 권장 카톡',
  },
]

const mdRnr = [
  { time: '11시 예배', gender: '남성', name: '조형진', phone: '01031852256' },
  { time: '11시 예배', gender: '여성', name: '김다정', phone: '01097711945' },
  { time: '11시 예배', gender: '여성', name: '최유나', phone: '01099233833' },
  { time: '11시 예배', gender: '남성', name: '여인혁', phone: '01059060278' },
  { time: '9시 예배', gender: '남성', name: '이민규', phone: '01031544017' },
  { time: '9시 예배', gender: '여성', name: '한채은', phone: '01071059473' },
]

const mdGuidelines = [
  {
    type: '적극적인 성향의 새신자',
    content: '비슷한 나이또래 점심메이트 바로 배치, 순배치 2~3주차에 바로 진행, 순배치 이후 출석을 1달간 한번도 빠지지 않을 시 잘 적응된 것으로 보고 관리 중단',
  },
  {
    type: '소극적인 성향의 새신자',
    content: '비슷한 나이또래 점심메이트 배치, 순배치 개인의 의사를 묻고 천천히 진행, 꾸준하게 안부인사 / 관리 상태 점검',
  },
  {
    type: '새내기',
    content: '',
  },
  {
    type: '군 제대',
    content: '',
  },
  {
    type: '장기 결석자',
    content: '',
  },
]

const ideas2025 = [
  '랜덤 좌석 앉기 : 가운데 앞자리로 좌석번호 지정, 주보에 있는 좌석번호 랜덤으로 뽑아서 예배 참여. 모르는 새신자 및 청년부원들과 친해지도록 자리 마련이 목적',
  '청년부 카페 오픈 : 파일럿 개념으로 새신자실에 오후 1~2시에 청년부 카페 운영. 점심먹고 청년부 예배까지 시간이 남아 오지 않는 청년들을 위해 마련',
  '멘토 지정 : 새신자를 주로 양육해줄 멘토를 지정하여 인계',
  '집중 심방기간 수립 : 10~11월에 청년부 목사님과 함께 소그룹 심방(교회 카페 등) 진행. 보다 촘촘한 새신자 관리와 적응도를 파악하기 위함',
  '새신자 관리 구글에 사진 추가, 패드들고 맞이(얼굴 확인) : 조형진 형제가 담당하기로 함',
  '프로필 릴레이 진행 : 주보를 통해 진행. 질문 다정이 만들어서 안내 예정',
]

function NewcomerManagePage() {
  const navigate = useNavigate()
  const [newcomers, setNewcomers] = useState<Newcomer[]>(initialNewcomers)
  const [showModal, setShowModal] = useState(false)
  const [editingNewcomer, setEditingNewcomer] = useState<Newcomer | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'messages' | 'rnr' | 'guidelines' | 'ideas' | 'meal'>('list')
  const [formData, setFormData] = useState<Omit<Newcomer, 'id'>>({
    mdName: '',
    writeDate: new Date().toISOString().split('T')[0],
    name: '',
    registered: 'N',
    gender: '남성',
    birthDate: '',
    phone: '',
    assignedSoon: '',
    mentor: '',
    address: '',
    firstStatus: '',
    middleStatus: '',
    recentStatus: '',
    soonAssignmentNote: '',
  })

  const handleCreate = () => {
    setEditingNewcomer(null)
    setFormData({
      mdName: '',
      writeDate: new Date().toISOString().split('T')[0],
      name: '',
      registered: 'N',
      gender: '남성',
      birthDate: '',
      phone: '',
      assignedSoon: '',
      mentor: '',
      address: '',
      firstStatus: '',
      middleStatus: '',
      recentStatus: '',
      soonAssignmentNote: '',
    })
    setShowModal(true)
  }

  const handleEdit = (newcomer: Newcomer) => {
    setEditingNewcomer(newcomer)
    setFormData({
      mdName: newcomer.mdName,
      writeDate: newcomer.writeDate,
      name: newcomer.name,
      registered: newcomer.registered,
      gender: newcomer.gender,
      birthDate: newcomer.birthDate,
      phone: newcomer.phone,
      assignedSoon: newcomer.assignedSoon,
      mentor: newcomer.mentor,
      address: newcomer.address,
      firstStatus: newcomer.firstStatus,
      middleStatus: newcomer.middleStatus,
      recentStatus: newcomer.recentStatus,
      soonAssignmentNote: newcomer.soonAssignmentNote,
    })
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('새신자 정보를 삭제하시겠습니까?')) {
      setNewcomers(newcomers.filter((n) => n.id !== id))
    }
  }

  const handleSave = () => {
    if (!formData.name || !formData.writeDate) {
      alert('새신자명과 작성일자를 입력해주세요.')
      return
    }

    if (editingNewcomer) {
      setNewcomers(newcomers.map((n) => (n.id === editingNewcomer.id ? { ...editingNewcomer, ...formData } : n)))
    } else {
      const newNewcomer: Newcomer = {
        id: Date.now().toString(),
        ...formData,
      }
      setNewcomers([...newcomers, newNewcomer])
    }
    setShowModal(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('클립보드에 복사되었습니다.')
  }

  const tabs = [
    { id: 'list', label: '새신자 목록' },
    { id: 'messages', label: '자주 사용하는 문자 양식' },
    { id: 'rnr', label: 'MD R&R' },
    { id: 'guidelines', label: 'MD관리 기준' },
    { id: 'ideas', label: '25년도 새신자 정착 아이디어' },
    { id: 'meal', label: '25년도 식권사용내역' },
  ]

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
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Warm Welcome</p>
              <p className="text-sm font-semibold text-slate-900">🌸 제자교회 청년부 MD관리파일</p>
            </div>
          </div>
          {activeTab === 'list' && (
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              + 새신자 등록
            </button>
          )}
        </header>

        {/* 탭 */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex overflow-x-auto border-b border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* 새신자 목록 탭 */}
            {activeTab === 'list' && (
              <div className="space-y-4">
                {/* 통계 카드 */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs text-slate-500">총 새신자</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{newcomers.length}명</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs text-slate-500">등록 완료</p>
                    <p className="mt-1 text-2xl font-bold text-blue-600">
                      {newcomers.filter((n) => n.registered === 'Y').length}명
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs text-slate-500">미등록</p>
                    <p className="mt-1 text-2xl font-bold text-yellow-600">
                      {newcomers.filter((n) => n.registered === 'N').length}명
                    </p>
                  </div>
                </div>

                {/* 새신자 테이블 */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-2 py-2 text-left font-semibold text-slate-700">담당 MD명</th>
                        <th className="px-2 py-2 text-left font-semibold text-slate-700">작성일자</th>
                        <th className="px-2 py-2 text-left font-semibold text-slate-700">새신자명</th>
                        <th className="px-2 py-2 text-left font-semibold text-slate-700">등록 여부</th>
                        <th className="px-2 py-2 text-left font-semibold text-slate-700">성별</th>
                        <th className="px-2 py-2 text-left font-semibold text-slate-700">생년월일</th>
                        <th className="px-2 py-2 text-left font-semibold text-slate-700">연락처</th>
                        <th className="px-2 py-2 text-left font-semibold text-slate-700">배치순</th>
                        <th className="px-2 py-2 text-left font-semibold text-slate-700">멘토</th>
                        <th className="px-2 py-2 text-left font-semibold text-slate-700">거주지</th>
                        <th className="px-2 py-2 text-left font-semibold text-slate-700">처음 현황</th>
                        <th className="px-2 py-2 text-left font-semibold text-slate-700">중간 현황</th>
                        <th className="px-2 py-2 text-left font-semibold text-slate-700">최근 현황</th>
                        <th className="px-2 py-2 text-left font-semibold text-slate-700">순배치참고</th>
                        <th className="px-2 py-2 text-center font-semibold text-slate-700">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {newcomers.map((newcomer) => (
                        <tr key={newcomer.id} className="hover:bg-slate-50">
                          <td className="px-2 py-2 text-slate-900">{newcomer.mdName}</td>
                          <td className="px-2 py-2 text-slate-600">{newcomer.writeDate}</td>
                          <td className="px-2 py-2 font-medium text-slate-900">{newcomer.name}</td>
                          <td className="px-2 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              newcomer.registered === 'Y' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {newcomer.registered}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-slate-600">{newcomer.gender}</td>
                          <td className="px-2 py-2 text-slate-600">{newcomer.birthDate}</td>
                          <td className="px-2 py-2 text-slate-600">{newcomer.phone}</td>
                          <td className="px-2 py-2 text-slate-600">{newcomer.assignedSoon || '-'}</td>
                          <td className="px-2 py-2 text-slate-600">{newcomer.mentor || '-'}</td>
                          <td className="px-2 py-2 text-slate-600">{newcomer.address || '-'}</td>
                          <td className="px-2 py-2 text-slate-600 max-w-[150px] truncate" title={newcomer.firstStatus}>
                            {newcomer.firstStatus || '-'}
                          </td>
                          <td className="px-2 py-2 text-slate-600 max-w-[150px] truncate" title={newcomer.middleStatus}>
                            {newcomer.middleStatus || '-'}
                          </td>
                          <td className="px-2 py-2 text-slate-600 max-w-[150px] truncate" title={newcomer.recentStatus}>
                            {newcomer.recentStatus || '-'}
                          </td>
                          <td className="px-2 py-2 text-slate-600 max-w-[150px] truncate" title={newcomer.soonAssignmentNote}>
                            {newcomer.soonAssignmentNote || '-'}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="flex justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEdit(newcomer)}
                                className="rounded px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-100"
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(newcomer.id)}
                                className="rounded px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-50"
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
            )}

            {/* 자주 사용하는 문자 양식 탭 */}
            {activeTab === 'messages' && (
              <div className="space-y-4">
                <div className="mb-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                  <p className="font-semibold">* 파란색(000)이 변경해야 될 문구</p>
                </div>
                {messageTemplates.map((template, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                        template.category === '필수' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {template.category}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">전송시기: {template.timing}</span>
                    </div>
                    <div className="mb-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                      {template.content}
                    </div>
                    <div className="flex items-start justify-between">
                      <p className="text-xs text-slate-500">{template.note}</p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(template.content)}
                        className="ml-4 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                      >
                        복사
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MD R&R 탭 */}
            {activeTab === 'rnr' && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">구 분</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">성별</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">담당</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">연락처</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {mdRnr.map((md, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-900">{md.time}</td>
                          <td className="px-4 py-3 text-slate-600">{md.gender}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{md.name}</td>
                          <td className="px-4 py-3 text-slate-600">{md.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MD관리 기준 탭 */}
            {activeTab === 'guidelines' && (
              <div className="space-y-4">
                <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700">
                  <p className="font-semibold">* 개인별 상황에 따라 상이</p>
                </div>
                {mdGuidelines.map((guideline, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 bg-white p-4">
                    <h4 className="mb-2 text-sm font-semibold text-slate-900">{guideline.type}</h4>
                    {guideline.content && (
                      <p className="text-xs text-slate-600">{guideline.content}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 25년도 새신자 정착 아이디어 탭 */}
            {activeTab === 'ideas' && (
              <div className="space-y-4">
                {ideas2025.map((idea, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                        {index + 1}
                      </span>
                      <p className="text-sm text-slate-700">{idea}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 25년도 식권사용내역 탭 */}
            {activeTab === 'meal' && (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm text-slate-500">식권사용내역 데이터가 없습니다.</p>
                <p className="mt-2 text-xs text-slate-400">추가 기능은 추후 구현 예정입니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 모달 */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {editingNewcomer ? '새신자 수정' : '새신자 등록'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">담당 MD명 *</label>
                  <input
                    type="text"
                    value={formData.mdName}
                    onChange={(e) => setFormData({ ...formData, mdName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">작성일자 *</label>
                  <input
                    type="date"
                    value={formData.writeDate}
                    onChange={(e) => setFormData({ ...formData, writeDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">새신자명 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">등록 여부</label>
                  <select
                    value={formData.registered}
                    onChange={(e) => setFormData({ ...formData, registered: e.target.value as 'Y' | 'N' })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">성별</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as '남성' | '여성' })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="남성">남성</option>
                    <option value="여성">여성</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">생년월일</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
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
                    placeholder="010-0000-0000"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">배치순</label>
                  <input
                    type="text"
                    value={formData.assignedSoon}
                    onChange={(e) => setFormData({ ...formData, assignedSoon: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">멘토</label>
                  <input
                    type="text"
                    value={formData.mentor}
                    onChange={(e) => setFormData({ ...formData, mentor: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">거주지</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">처음에 알게 된 현황</label>
                  <textarea
                    value={formData.firstStatus}
                    onChange={(e) => setFormData({ ...formData, firstStatus: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">중간 현황</label>
                  <textarea
                    value={formData.middleStatus}
                    onChange={(e) => setFormData({ ...formData, middleStatus: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">최근 현황</label>
                  <textarea
                    value={formData.recentStatus}
                    onChange={(e) => setFormData({ ...formData, recentStatus: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">순배치참고</label>
                  <textarea
                    value={formData.soonAssignmentNote}
                    onChange={(e) => setFormData({ ...formData, soonAssignmentNote: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={2}
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
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
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

export default NewcomerManagePage
