import { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import { getUserRole, isLoggedIn as checkLoggedIn, isManager } from '../utils/auth'
import { getMembers } from '../services/memberService'
import type { Member } from '../types/member'
import { getClub } from '../services/clubService'
import ClubType, { type ClubMember } from '../types/club'
import { getMyInfo } from '../services/userService'
import { getTemplateByClubId, submitForm, createFormTemplate, updateFormTemplate, getClubSubmissions, approveSubmission, rejectSubmission } from '../services/formService'
import type { FormTemplate, ClubSubmissionResponse } from '../types/form'
import { DynamicFormRenderer } from '../components/forms/DynamicFormRenderer'
import { FormBuilder } from '../components/forms/FormBuilder'
import SubmissionDetailModal from '../components/forms/SubmissionDetailModal'

interface ClubActivity {
  id: number
  date: string
  title: string
  description: string
}

interface TeamInfo {
  clubId: number
  clubName: string
  type: ClubType
  leader: string
  leaderId: number
  description: string
  members: ClubMember[]
  activities: ClubActivity[]
}

type TabType = 'intro' | 'applications' | 'manage'
type ApplicationStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const teamIdNum = teamId ? parseInt(teamId, 10) : null
  const [team, setTeam] = useState<TeamInfo | null>(null)
  const [, setLoading] = useState(true)
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
  const [applicationFormTemplate, setApplicationFormTemplate] = useState<FormTemplate | null>(null)
  const [applications, setApplications] = useState<ClubSubmissionResponse[]>([])
  const [applicationAnswers, setApplicationAnswers] = useState<Record<string, any>>({})
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [teamInfoForm, setTeamInfoForm] = useState({
    clubName: '',
    description: '',
  })
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<ApplicationStatus>('ALL')
  const [applicationSearchTerm, setApplicationSearchTerm] = useState('')
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null)
  const [isSubmissionDetailOpen, setIsSubmissionDetailOpen] = useState(false)

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
          description: clubData.description,
          members: clubData.members || [],
          activities: [],
          type: ClubType.NEW_BELIEVER
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
        })

        // Fetch Application Form Template
        try {
          const template = await getTemplateByClubId(clubData.id)
          setApplicationFormTemplate(template)
        } catch {
          console.log('No application form template found')
          setApplicationFormTemplate(null)
        }

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

  const loadApplications = useCallback(async () => {
    if (!teamIdNum || (!isTeamLeader && !isAdmin)) return
    try {
      const data = await getClubSubmissions(teamIdNum)
      setApplications(data)
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    }
  }, [teamIdNum, isTeamLeader, isAdmin])

  // 신청서 목록 로드
  useEffect(() => {
    if (activeTab === 'applications') {
      loadApplications()
    }
  }, [activeTab, loadApplications])

  const handleSubmitApplication = async () => {
    if (!applicationFormTemplate || !currentUser || !team) return

    // Transform answers for API
    const formattedAnswers = Object.entries(applicationAnswers).map(([key, value]) => ({
      questionId: Number(key),
      value: String(value)
    }))

    try {
      await submitForm({
        templateId: applicationFormTemplate.id,
        clubId: team.clubId,
        date: new Date().toISOString().split('T')[0],
        answers: formattedAnswers
      })

      setApplicationAnswers({})
      setShowApplicationModal(false)
      alert('가입 신청이 완료되었습니다.')
    } catch (error) {
      console.error('Failed to submit application:', error)
      alert('가입 신청 제출에 실패했습니다.')
    }
  }

  const handleApproveApplication = async (applicationId: number) => {
    try {
      await approveSubmission(applicationId)
      alert('신청이 승인되었습니다.')
      setIsSubmissionDetailOpen(false)
      loadApplications()
    } catch (e) {
      console.error(e)
      alert('승인 처리에 실패했습니다.')
    }
  }

  const handleRejectApplication = async (applicationId: number) => {
    try {
      await rejectSubmission(applicationId)
      alert('신청이 거절되었습니다.')
      setIsSubmissionDetailOpen(false)
      loadApplications()
    } catch (e) {
      console.error(e)
      alert('거절 처리에 실패했습니다.')
    }
  }

  const handleSaveTemplate = async (templateData: Partial<FormTemplate>) => {
    if (!team) return

    try {
      if (applicationFormTemplate) {
        await updateFormTemplate(applicationFormTemplate.id, templateData)
        alert('신청서 양식이 수정되었습니다.')
      } else {
        await createFormTemplate(templateData)
        alert('신청서 양식이 생성되었습니다.')
      }
      
      // Refresh template
      const template = await getTemplateByClubId(team.clubId)
      setApplicationFormTemplate(template)
      
      setShowTemplateEdit(false)
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  const handleSaveTeamInfo = () => {
    if (!team) return
    
    // 팀 정보 저장 로직
    setTeam({
      ...team,
      clubName: teamInfoForm.clubName,
      description: teamInfoForm.description,
    })
    setShowTeamInfoEdit(false)
    alert('팀 소개가 수정되었습니다.')
  }

  const handleTransferLeadership = (memberId: number) => {
    if (!team) return
    
    const member = team.members.find(m => m.memberId === memberId)
    if (!member) return
    
    if (confirm(`정말로 ${member.name}님에게 팀장 권한을 양도하시겠습니까?`)) {
      setTeam({
        ...team,
        leader: member.name,
        leaderId: memberId,
        members: team.members.map(m => 
          m.memberId === memberId 
            ? { ...m, role: '팀장' }
            : m.memberId === team.leaderId
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
    if (team.members.some(m => m.memberId === memberId)) {
      alert('이미 팀원입니다.')
      return
    }
    
    const newMember: ClubMember = {
          id: 0, // Optimistic update
          memberId: member.memberId,
          name: member.name,
          role: 'MEMBER',
        }
    setTeam({
      ...team,
      members: [...team.members, newMember],
    })
    alert(`${member.name}님이 팀원으로 추가되었습니다.`)
  }

  const handleRemoveMember = (memberId: number) => {
    if (!team) return
    
    const member = team.members.find(m => m.memberId === memberId)
    if (!member) return
    
    // 팀장은 삭제할 수 없음
    if (member.role === '팀장') {
      alert('팀장은 삭제할 수 없습니다. 먼저 팀장 권한을 양도해주세요.')
      return
    }
    
    if (confirm(`정말로 ${member.name}님을 팀에서 제외하시겠습니까?`)) {
      setTeam({
        ...team,
        members: team.members.filter(m => m.memberId !== memberId),
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
              to="/user-dashboard"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← 메인으로
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
                {!isTeamMember && isLoggedIn && applicationFormTemplate && (
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
                  <span className="font-medium text-slate-600">팀원 수:</span>
                  <span className="text-slate-900">{team.members.length}명</span>
                </div>
              </div>

              {/* 팀 기능 바로가기 (특정 팀만 표시) */}
              {(team.type === ClubType.NEW_BELIEVER || team.type === ClubType.CONTENT) && (
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">팀 기능 바로가기</h3>
                  <div className="flex flex-wrap gap-3">
                    {team.type === ClubType.NEW_BELIEVER && (
                      <>
                        <Link
                          to="/manage/newcomers"
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <span>👥</span>
                          <span>새신자 관리</span>
                        </Link>
                        <Link
                          to="/manage/meal-tickets"
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <span>🎫</span>
                          <span>식권 관리</span>
                        </Link>
                      </>
                    )}
                    {team.type === ClubType.CONTENT && (
                      <Link
                        to="/manage/group-formation"
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <span>🧩</span>
                        <span>조편성</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 팀원 목록 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">팀원 목록</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {team.members.map((member) => (
                  <div
                    key={member.memberId}
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
              
              {/* 신청서 양식 관리 버튼 */}
              <button
                onClick={() => setShowTemplateEdit(true)}
                className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 whitespace-nowrap"
              >
                {applicationFormTemplate ? '신청서 양식 수정' : '신청서 양식 생성'}
              </button>
            </div>

            {/* 신청서 목록 */}
            <div className="h-[500px] overflow-y-auto pr-2">
              <div className="flex flex-col gap-4">
                {applications
                  .filter((app) => {
                    // Filter by status
                    if (applicationStatusFilter !== 'ALL' && app.status !== applicationStatusFilter) return false
                    // Filter by search term
                    if (
                      applicationSearchTerm &&
                      !app.submitterName.toLowerCase().includes(applicationSearchTerm.toLowerCase())
                    )
                      return false
                    return true
                  })
                  .map((app) => (
                    <div
                      key={app.submissionId}
                      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition cursor-pointer"
                      onClick={() => {
                        setSelectedSubmissionId(app.submissionId)
                        setIsSubmissionDetailOpen(true)
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-900">{app.submitterName}</span>
                          <span className="text-sm text-slate-500">{app.submitDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              app.status === 'APPROVED'
                                ? 'bg-green-100 text-green-700'
                                : app.status === 'REJECTED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {app.status === 'PENDING' ? '대기' : app.status === 'APPROVED' ? '승인' : '거절'}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-slate-600">
                         {/* 간단 내용 미리보기는 현재 DTO에 없음. 상세보기를 통해 확인하도록 유도 */}
                         클릭하여 상세 내용을 확인하세요.
                      </div>
                    </div>
                  ))}
                
                {applications.length === 0 && (
                   <div className="text-center py-10 text-slate-500">
                     제출된 신청서가 없습니다.
                   </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 신청서 상세 모달 */}
        <SubmissionDetailModal
          isOpen={isSubmissionDetailOpen}
          onClose={() => setIsSubmissionDetailOpen(false)}
          submissionId={selectedSubmissionId}
          onApprove={handleApproveApplication}
          onReject={handleRejectApplication}
        />

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
                    key={member.memberId}
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
                          onClick={() => setOpenMemberMenuId(openMemberMenuId === member.memberId ? null : member.memberId)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {openMemberMenuId === member.memberId && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMemberMenuId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-200 z-20">
                              <button
                                onClick={() => {
                                  handleTransferLeadership(member.memberId)
                                  setOpenMemberMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
                              >
                                팀장 양도
                              </button>
                              <button
                                onClick={() => {
                                  handleRemoveMember(member.memberId)
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
        {showApplicationModal && applicationFormTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">{applicationFormTemplate.title}</h2>
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
                <DynamicFormRenderer
                  template={applicationFormTemplate}
                  answers={applicationAnswers}
                  onChange={setApplicationAnswers}
                  onSubmit={handleSubmitApplication}
                  readOnly={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* 신청서 양식 수정 모달 */}
        {showTemplateEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
              <FormBuilder
                initialTemplate={applicationFormTemplate || undefined}
                initialTitle={applicationFormTemplate ? undefined : `${team.clubName} 가입 신청서`}
                initialCategory="CLUB_APPLICATION"
                initialFormType="PERSONAL"
                initialTargetClubId={team.clubId}
                customTitle="팀 지원서 작성"
                initialAccessList={applicationFormTemplate ? undefined : [
                  { id: 1, accessType: 'RESPONDENT', targetType: 'ALL', targetValue: '' },
                  { id: 2, accessType: 'MANAGER', targetType: 'CLUB', targetValue: team.clubId.toString() }
                ]}
                hideAccessControl={true}
                excludedQuestionTypes={['SCHEDULE_ATTENDANCE']}
                hideBasicInfo={true}
                onSave={handleSaveTemplate}
                onCancel={() => setShowTemplateEdit(false)}
                isModal={true}
              />
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
