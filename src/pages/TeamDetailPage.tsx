import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import { getUserRole, isLoggedIn as checkLoggedIn, isManager } from '../utils/auth'
import { getMembers } from '../services/memberService'
import type { Member } from '../types/member'
import { getClub, addClubMember, removeClubMember, updateClub } from '../services/clubService'
import type { Club, ClubMember } from '../types/club'
import { getMyInfo } from '../services/userService'

interface ClubActivity {
  id: number
  date: string
  title: string
  description: string
}

interface TeamApplication {
  id: number
  applicantName: string
  applicantId: number
  submittedAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  answers: {
    question: string
    answer: string
  }[]
}

interface ApplicationTemplate {
  questions: {
    id: number
    question: string
  }[]
}

interface TeamInfo {
  clubId: number
  clubName: string
  leader: string
  leaderId: number
  meetingTime: string
  meetingPlace: string
  description: string
  members: ClubMember[]
  activities: ClubActivity[]
}

// 팀별 데이터 (실제로는 API에서 가져올 데이터) -> Now fetched from API
// const teamData removed

// 임시: 현재 사용자 정보 (실제로는 API에서 가져와야 함)
// const mockCurrentUser removed

// 임시: 신청서 템플릿 (팀장이 수정 가능)
const mockApplicationTemplate: ApplicationTemplate = {
  questions: [
    { id: 1, question: '이 팀에 지원하게 된 동기는 무엇인가요?' },
    { id: 2, question: '이 팀에서 어떤 역할을 하고 싶으신가요?' },
    { id: 3, question: '이 팀에 기여할 수 있는 점은 무엇인가요?' },
  ],
}

// 임시: 신청서 기록 (팀장이 볼 수 있음)
const mockApplications: TeamApplication[] = [
  {
    id: 1,
    applicantName: '지원자1',
    applicantId: 11,
    submittedAt: '2024-12-15T10:00:00',
    status: 'PENDING',
    answers: [
      { question: '이 팀에 지원하게 된 동기는 무엇인가요?', answer: '찬양에 관심이 많아서 지원했습니다.' },
      { question: '이 팀에서 어떤 역할을 하고 싶으신가요?', answer: '보컬로 참여하고 싶습니다.' },
      { question: '이 팀에 기여할 수 있는 점은 무엇인가요?', answer: '열정과 노력으로 팀에 기여하겠습니다.' },
    ],
  },
  {
    id: 2,
    applicantName: '지원자2',
    applicantId: 12,
    submittedAt: '2024-12-14T15:30:00',
    status: 'APPROVED',
    answers: [
      { question: '이 팀에 지원하게 된 동기는 무엇인가요?', answer: '음악을 좋아해서 지원했습니다.' },
      { question: '이 팀에서 어떤 역할을 하고 싶으신가요?', answer: '기타 연주를 하고 싶습니다.' },
      { question: '이 팀에 기여할 수 있는 점은 무엇인가요?', answer: '기타 실력으로 팀에 도움이 되겠습니다.' },
    ],
  },
]

type TabType = 'intro' | 'applications' | 'manage'
type ApplicationStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const teamIdNum = teamId ? parseInt(teamId, 10) : null
  const [team, setTeam] = useState<TeamInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{id: number, name: string} | null>(null)

  const [activeTab, setActiveTab] = useState<TabType>('intro')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [, setUserRole] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isTeamLeader, setIsTeamLeader] = useState(false)
  const [isTeamMember, setIsTeamMember] = useState(false)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [showTemplateEdit, setShowTemplateEdit] = useState(false)
  const [showTeamInfoEdit, setShowTeamInfoEdit] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [openMemberMenuId, setOpenMemberMenuId] = useState<number | null>(null)
  const [applicationTemplate, setApplicationTemplate] = useState<ApplicationTemplate>(mockApplicationTemplate)
  const [applications, setApplications] = useState<TeamApplication[]>(mockApplications)
  const [applicationAnswers, setApplicationAnswers] = useState<Record<number, string>>({})
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [teamInfoForm, setTeamInfoForm] = useState({
    clubName: '',
    description: '',
    meetingTime: '',
    meetingPlace: '',
  })
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<ApplicationStatus>('ALL')
  const [applicationSearchTerm, setApplicationSearchTerm] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      if (!teamIdNum) return
      
      try {
        setLoading(true)
        // Fetch User Info
        let userId = 0
        let userName = ""
        if (checkLoggedIn()) {
           try {
             const userInfo = await getMyInfo()
             userId = userInfo.userId
             userName = userInfo.name
             setCurrentUser({ id: userId, name: userName })
           } catch (e) {
             console.error("Failed to fetch user info", e)
           }
        }

        // Fetch Club Info
        const clubData = await getClub(teamIdNum)
        const teamInfo: TeamInfo = {
          clubId: clubData.id,
          clubName: clubData.name,
          leader: clubData.leaderName || "",
          leaderId: clubData.leaderId || 0,
          meetingTime: clubData.meetingTime || "",
          meetingPlace: clubData.meetingPlace || "",
          description: clubData.description,
          members: clubData.members || [],
          activities: [], 
        }
        setTeam(teamInfo)

        // Set roles based on fetched data
        setIsTeamLeader(clubData.leaderId === userId)
        const memberIds = clubData.members?.map(m => m.memberId) || []
        setIsTeamMember(memberIds.includes(userId))
        
        // Init form
        setTeamInfoForm({
          clubName: clubData.name,
          description: clubData.description,
          meetingTime: clubData.meetingTime || "",
          meetingPlace: clubData.meetingPlace || "",
        })

      } catch (error) {
        console.error("Failed to fetch team data:", error)
      } finally {
        setLoading(false)
      }
    }

    setIsLoggedIn(checkLoggedIn())
    const role = getUserRole()
    setUserRole(role)
    setIsAdmin(isManager())
    
    fetchData()
  }, [teamIdNum])

  // 전체 멤버 목록 로드 (팀원 추가용)
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await getMembers({ page: 0, size: 1000 })
        const data = response.content
        setAllMembers(data)
      } catch (error) {
        console.error('멤버 목록 로드 실패:', error)
        // API 실패 시에도 계속 진행
      }
    }
    if (showAddMemberModal) {
      fetchMembers()
    }
  }, [showAddMemberModal])

  const handleSubmitApplication = () => {
    // 신청서 제출 로직
    const newApplication: TeamApplication = {
      id: applications.length + 1,
      applicantName: mockCurrentUser.name,
      applicantId: mockCurrentUser.id,
      submittedAt: new Date().toISOString(),
      status: 'PENDING',
      answers: applicationTemplate.questions.map(q => ({
        question: q.question,
        answer: applicationAnswers[q.id] || '',
      })),
    }
    setApplications([...applications, newApplication])
    setApplicationAnswers({})
    setShowApplicationModal(false)
    alert('가입 신청이 완료되었습니다.')
  }

  const handleApproveApplication = (applicationId: number) => {
    const application = applications.find(app => app.id === applicationId)
    if (!application) return

    setApplications(applications.map(app => 
      app.id === applicationId ? { ...app, status: 'APPROVED' as const } : app
    ))
    
    // 승인 시 팀원에 추가
    if (team) {
      const newMember: ClubMember = {
        id: application.applicantId,
        name: application.applicantName,
      }
      setTeam({
        ...team,
        members: [...team.members, newMember],
      })
    }
    
    alert('신청이 승인되었습니다.')
  }

  const handleRejectApplication = (applicationId: number) => {
    setApplications(applications.map(app => 
      app.id === applicationId ? { ...app, status: 'REJECTED' as const } : app
    ))
    alert('신청이 거절되었습니다.')
  }

  const handleSaveTemplate = () => {
    // 템플릿 저장 로직
    setShowTemplateEdit(false)
    alert('신청서 양식이 저장되었습니다.')
  }

  const handleSaveTeamInfo = () => {
    if (!team) return
    
    // 팀 정보 저장 로직
    setTeam({
      ...team,
      clubName: teamInfoForm.clubName,
      description: teamInfoForm.description,
      meetingTime: teamInfoForm.meetingTime,
      meetingPlace: teamInfoForm.meetingPlace,
    })
    setShowTeamInfoEdit(false)
    alert('팀 소개가 수정되었습니다.')
  }

  const handleTransferLeadership = (memberId: number) => {
    if (!team) return
    
    const member = team.members.find(m => m.id === memberId)
    if (!member) return
    
    if (confirm(`정말로 ${member.name}님에게 팀장 권한을 양도하시겠습니까?`)) {
      setTeam({
        ...team,
        leader: member.name,
        leaderId: memberId,
        members: team.members.map(m => 
          m.id === memberId 
            ? { ...m, role: '팀장' }
            : m.id === team.leaderId
            ? { ...m, role: undefined }
            : m
        ),
      })
      alert('팀장 권한이 양도되었습니다.')
    }
  }

  const handleAddMember = (memberId: number) => {
    if (!team) return
    
    const member = allMembers.find(m => m.memberId === memberId)
    if (!member) return
    
    // 이미 팀원인지 확인
    if (team.members.some(m => m.id === memberId)) {
      alert('이미 팀원입니다.')
      return
    }
    
    const newMember: ClubMember = {
      id: member.memberId,
      name: member.name,
    }
    setTeam({
      ...team,
      members: [...team.members, newMember],
    })
    alert(`${member.name}님이 팀원으로 추가되었습니다.`)
  }

  const handleRemoveMember = (memberId: number) => {
    if (!team) return
    
    const member = team.members.find(m => m.id === memberId)
    if (!member) return
    
    // 팀장은 삭제할 수 없음
    if (member.role === '팀장') {
      alert('팀장은 삭제할 수 없습니다. 먼저 팀장 권한을 양도해주세요.')
      return
    }
    
    if (confirm(`정말로 ${member.name}님을 팀에서 제외하시겠습니까?`)) {
      setTeam({
        ...team,
        members: team.members.filter(m => m.id !== memberId),
      })
      alert('팀원이 제외되었습니다.')
    }
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <UserHeader />
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">팀을 찾을 수 없습니다</h1>
            <p className="mt-2 text-sm text-slate-600">요청하신 팀 정보가 존재하지 않습니다.</p>
            <Link
              to="/club"
              className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← 팀 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{team.clubName}</h1>
            <p className="mt-1 text-sm text-slate-600">팀 상세 정보를 확인하세요.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/club"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← 팀 목록으로
            </Link>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="border-b border-slate-200 bg-white rounded-t-lg">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab('intro')}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition rounded-t-lg ${
                activeTab === 'intro'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              팀 소개
            </button>
            {(isTeamLeader || isAdmin) && (
              <>
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`flex-1 px-6 py-3 text-sm font-semibold transition rounded-t-lg ${
                    activeTab === 'applications'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  신청서 관리
                </button>
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`flex-1 px-6 py-3 text-sm font-semibold transition rounded-t-lg ${
                    activeTab === 'manage'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  팀 관리
                </button>
              </>
            )}
          </div>
        </div>

        {/* 팀 소개 탭 */}
        {activeTab === 'intro' && (
          <div className="space-y-6 bg-white rounded-b-lg border border-slate-200 border-t-0 p-6">
            {/* 팀 기본 정보 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">{team.clubName}</h2>
                {!isTeamMember && isLoggedIn && (
                  <button
                    onClick={() => setShowApplicationModal(true)}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                  >
                    팀 가입신청
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-600">{team.description}</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-600">팀장:</span>
                  <span className="text-slate-900">{team.leader}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-600">모임 시간:</span>
                  <span className="text-slate-900">{team.meetingTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-600">모임 장소:</span>
                  <span className="text-slate-900">{team.meetingPlace}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-600">팀원 수:</span>
                  <span className="text-slate-900">{team.members.length}명</span>
                </div>
              </div>
            </div>

            {/* 팀원 목록 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">팀원 목록</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-900">{member.name}</span>
                    {member.role && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                        {member.role}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 신청서 관리 탭 */}
        {activeTab === 'applications' && (isTeamLeader || isAdmin) && (
          <div className="space-y-6 bg-white rounded-b-lg border border-slate-200 border-t-0 p-6">
            {/* 필터 및 검색 */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* 상태 필터 */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setApplicationStatusFilter('ALL')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                    applicationStatusFilter === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setApplicationStatusFilter('PENDING')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                    applicationStatusFilter === 'PENDING'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  대기
                </button>
                <button
                  onClick={() => setApplicationStatusFilter('APPROVED')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                    applicationStatusFilter === 'APPROVED'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  승인
                </button>
                <button
                  onClick={() => setApplicationStatusFilter('REJECTED')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                    applicationStatusFilter === 'REJECTED'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  거절
                </button>
              </div>
              
              {/* 검색 */}
              <div className="flex-1">
                <input
                  type="text"
                  value={applicationSearchTerm}
                  onChange={(e) => setApplicationSearchTerm(e.target.value)}
                  placeholder="지원자 이름으로 검색..."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              {/* 신청서 양식 수정 버튼 */}
              <button
                onClick={() => setShowTemplateEdit(true)}
                className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 whitespace-nowrap"
              >
                신청서 양식 수정
              </button>
            </div>

            {/* 신청서 목록 */}
            <div className="h-[500px] overflow-y-auto space-y-4 pr-2">
              {applications
                .filter(app => {
                  // 상태 필터
                  if (applicationStatusFilter !== 'ALL' && app.status !== applicationStatusFilter) {
                    return false
                  }
                  // 검색 필터
                  if (applicationSearchTerm && !app.applicantName.toLowerCase().includes(applicationSearchTerm.toLowerCase())) {
                    return false
                  }
                  return true
                })
                .map((app) => (
                  <div key={app.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-semibold text-slate-900">{app.applicantName}</span>
                        <span className="ml-2 text-xs text-slate-500">
                          {new Date(app.submittedAt).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          app.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {app.status === 'PENDING' ? '대기중' :
                           app.status === 'APPROVED' ? '승인됨' : '거절됨'}
                        </span>
                        {app.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApproveApplication(app.id)}
                              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                            >
                              승인
                            </button>
                            <button
                              onClick={() => handleRejectApplication(app.id)}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                            >
                              거절
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {app.answers.map((answer, idx) => (
                        <div key={idx}>
                          <p className="text-xs font-medium text-slate-600 mb-1">{answer.question}</p>
                          <p className="text-sm text-slate-900 bg-white rounded px-3 py-2">{answer.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              {applications.filter(app => {
                if (applicationStatusFilter !== 'ALL' && app.status !== applicationStatusFilter) {
                  return false
                }
                if (applicationSearchTerm && !app.applicantName.toLowerCase().includes(applicationSearchTerm.toLowerCase())) {
                  return false
                }
                return true
              }).length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  {applicationSearchTerm || applicationStatusFilter !== 'ALL'
                    ? '조건에 맞는 신청서가 없습니다.'
                    : '신청서가 없습니다.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 팀 관리 탭 */}
        {activeTab === 'manage' && (isTeamLeader || isAdmin) && (
          <div className="space-y-6 bg-white rounded-b-lg border border-slate-200 border-t-0 p-6">
            {/* 팀 소개 수정 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">팀 소개</h2>
                <button
                  onClick={() => setShowTeamInfoEdit(true)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  수정하기
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-600">팀 이름:</span>
                  <span className="text-slate-900">{team.clubName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-600">팀 설명:</span>
                  <span className="text-slate-900">{team.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-600">모임 시간:</span>
                  <span className="text-slate-900">{team.meetingTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-600">모임 장소:</span>
                  <span className="text-slate-900">{team.meetingPlace}</span>
                </div>
              </div>
            </div>

            {/* 팀원 관리 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">팀원 관리</h2>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  팀원 추가
                </button>
              </div>
              
              {/* 팀원 명단 */}
              <div className="space-y-2">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-900">{member.name}</span>
                      {member.role && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                          {member.role}
                        </span>
                      )}
                    </div>
                    {member.role !== '팀장' && (isTeamLeader || isAdmin) && (
                      <div className="relative">
                        <button
                          onClick={() => setOpenMemberMenuId(openMemberMenuId === member.id ? null : member.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {openMemberMenuId === member.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMemberMenuId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-200 z-20">
                              <button
                                onClick={() => {
                                  handleTransferLeadership(member.id)
                                  setOpenMemberMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
                              >
                                팀장 양도
                              </button>
                              <button
                                onClick={() => {
                                  handleRemoveMember(member.id)
                                  setOpenMemberMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                              >
                                퇴출
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 가입신청서 모달 */}
        {showApplicationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">팀 가입신청서</h2>
                <button
                  onClick={() => {
                    setShowApplicationModal(false)
                    setApplicationAnswers({})
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {applicationTemplate.questions.map((q) => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {q.question}
                    </label>
                    <textarea
                      value={applicationAnswers[q.id] || ''}
                      onChange={(e) => setApplicationAnswers({ ...applicationAnswers, [q.id]: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      rows={3}
                      placeholder="답변을 입력해주세요"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowApplicationModal(false)
                    setApplicationAnswers({})
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmitApplication}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                >
                  제출하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 신청서 양식 수정 모달 */}
        {showTemplateEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">신청서 양식 수정</h2>
                <button
                  onClick={() => setShowTemplateEdit(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {applicationTemplate.questions.map((q, idx) => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      질문 {idx + 1}
                    </label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => {
                        const newQuestions = [...applicationTemplate.questions]
                        newQuestions[idx] = { ...q, question: e.target.value }
                        setApplicationTemplate({ ...applicationTemplate, questions: newQuestions })
                      }}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="질문을 입력해주세요"
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newQuestions = [...applicationTemplate.questions, { id: Date.now(), question: '' }]
                    setApplicationTemplate({ ...applicationTemplate, questions: newQuestions })
                  }}
                  className="w-full rounded-lg border-2 border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                >
                  + 질문 추가
                </button>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowTemplateEdit(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  저장하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 팀 소개 수정 모달 */}
        {showTeamInfoEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">팀 소개 수정</h2>
                <button
                  onClick={() => setShowTeamInfoEdit(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    팀 이름 *
                  </label>
                  <input
                    type="text"
                    value={teamInfoForm.clubName}
                    onChange={(e) => setTeamInfoForm({ ...teamInfoForm, clubName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="팀 이름을 입력해주세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    팀 설명 *
                  </label>
                  <textarea
                    value={teamInfoForm.description}
                    onChange={(e) => setTeamInfoForm({ ...teamInfoForm, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={4}
                    placeholder="팀에 대한 설명을 입력해주세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    모임 시간 *
                  </label>
                  <input
                    type="text"
                    value={teamInfoForm.meetingTime}
                    onChange={(e) => setTeamInfoForm({ ...teamInfoForm, meetingTime: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="예: 매주 토요일 오후 2시"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    모임 장소 *
                  </label>
                  <input
                    type="text"
                    value={teamInfoForm.meetingPlace}
                    onChange={(e) => setTeamInfoForm({ ...teamInfoForm, meetingPlace: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="예: 교회 본당"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowTeamInfoEdit(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveTeamInfo}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  저장하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 팀원 추가 모달 */}
        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">팀원 추가</h2>
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              
              {/* 청년부 명단 */}
              <div className="max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  {allMembers
                    .filter(m => !team.members.some(tm => tm.id === m.memberId))
                    .map((member) => (
                      <div
                        key={member.memberId}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-900">{member.name}</span>
                          <span className="text-xs text-slate-500">{member.phone}</span>
                        </div>
                        <button
                          onClick={() => {
                            handleAddMember(member.memberId)
                            setShowAddMemberModal(false)
                          }}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                        >
                          추가
                        </button>
                      </div>
                    ))}
                  {allMembers.filter(m => !team.members.some(tm => tm.id === m.memberId)).length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      추가할 수 있는 멤버가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  )
}

export default TeamDetailPage
