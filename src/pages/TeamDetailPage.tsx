import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useConfirm } from '../contexts/ConfirmContext'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import { getUserRole, isLoggedIn as checkLoggedIn, isManager, clearAuth } from '../utils/auth'
import { getMembers } from '../services/memberService'
import type { Member } from '../types/member'
import { getClub, addClubMember, removeClubMember, changeClubLeader } from '../services/clubService'
import ClubType, { type ClubMember } from '../types/club'
import { getMyInfo } from '../services/userService'
import { getTemplateByClubId, submitForm, createFormTemplate, updateFormTemplate, getClubSubmissions, approveSubmission, rejectSubmission, updateTemplateStatus } from '../services/formService'
import type { FormTemplate, ClubSubmissionResponse, FormCategory, FormType } from '../types/form'
import { DynamicFormRenderer } from '../components/forms/DynamicFormRenderer'
import { FormBuilder } from '../components/forms/FormBuilder'
import SubmissionDetailModal from '../components/forms/SubmissionDetailModal'

import { 
  Users, 
  Search, 
  Calendar, 
  Settings, 
  UserPlus, 
  Shield, 
  Info, 
  Edit3,
  Trash2,
  MoreHorizontal,
  ArrowRight
} from 'lucide-react'

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
  const navigate = useNavigate()
  const { teamId } = useParams<{ teamId: string }>()
  const { confirm } = useConfirm()
  const teamIdNum = teamId ? parseInt(teamId, 10) : null
  const [team, setTeam] = useState<TeamInfo | null>(null)
  const [, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{id: number, name: string} | null>(null)

  const [activeTab, setActiveTab] = useState<TabType>('intro')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
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
  const [memberSearchTerm, setMemberSearchTerm] = useState('')
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null)
  const [isSubmissionDetailOpen, setIsSubmissionDetailOpen] = useState(false)

  const loadTeamData = useCallback(async () => {
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
        type: clubData.type
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
  }, [teamIdNum])

  useEffect(() => {
    loadTeamData()
    
    setIsLoggedIn(checkLoggedIn())
    const role = getUserRole()
    setUserRole(role)
    setIsAdmin(isManager())
  }, [loadTeamData, isManager]) // isManager 의존성 추가

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
      toast.success('가입 신청이 완료되었습니다.')
    } catch (error) {
      console.error('Failed to submit application:', error)
      toast.error('가입 신청 제출에 실패했습니다.')
    }
  }

  const handleApproveApplication = async (applicationId: number) => {
    try {
      await approveSubmission(applicationId)
      toast.success('신청이 승인되었습니다.')
      setIsSubmissionDetailOpen(false)
      loadApplications()
      loadTeamData() // 승인 후 팀 데이터(멤버 목록) 새로고침
    } catch (e) {
      console.error(e)
      toast.error('승인 처리에 실패했습니다.')
    }
  }

  const handleRejectApplication = async (applicationId: number) => {
    try {
      await rejectSubmission(applicationId)
      toast.success('신청이 거절되었습니다.')
      setIsSubmissionDetailOpen(false)
      loadApplications()
    } catch (e) {
      console.error(e)
      toast.error('거절 처리에 실패했습니다.')
    }
  }

  const handleToggleTemplateStatus = async () => {
    if (!applicationFormTemplate) return
    
    try {
      const newStatus = !applicationFormTemplate.isActive
      await updateTemplateStatus(applicationFormTemplate.id, newStatus)
      setApplicationFormTemplate({
        ...applicationFormTemplate,
        isActive: newStatus
      })
      toast.success(newStatus ? '신청서가 활성화되었습니다.' : '신청서가 비활성화되었습니다.')
    } catch (error) {
      console.error('Failed to toggle status:', error)
      toast.error('상태 변경에 실패했습니다.')
    }
  }

  const handleSaveTemplate = async (templateData: Partial<FormTemplate>) => {
    if (!team) return

    try {
      if (applicationFormTemplate) {
        await updateFormTemplate(applicationFormTemplate.id, templateData)
        toast.success('신청서 양식이 수정되었습니다.')
      } else {
        const newTemplate = {
          ...templateData,
          category: 'CLUB_APPLICATION' as FormCategory,
          type: 'PERSONAL' as FormType,
          targetClubId: team.clubId,
          isActive: true
        }
        await createFormTemplate(newTemplate)
        toast.success('신청서 양식이 생성되었습니다.')
      }
      
      // Refresh template
      const template = await getTemplateByClubId(team.clubId)
      setApplicationFormTemplate(template)
      
      setShowTemplateEdit(false)
    } catch (error) {
      console.error('Failed to save template:', error)
      toast.error('저장 중 오류가 발생했습니다.')
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
    toast.success('팀 소개가 수정되었습니다.')
  }

  const handleAddMember = async (memberId: number) => {
    if (!team) return
    
    const member = allMembers.find(m => m.memberId === memberId)
    if (!member) return
    
    // 이미 팀원인지 확인
    if (team.members.some(m => m.memberId === memberId)) {
      toast.error('이미 팀원입니다.')
      return
    }
    
    try {
      await addClubMember(team.clubId, memberId)
      
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
      
      toast.success(`${member.name}님이 팀원으로 추가되었습니다.`)
    } catch (error) {
      console.error('Failed to add member:', error)
      toast.error('팀원 추가에 실패했습니다.')
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    if (!team) return
    
    const member = team.members.find(m => m.memberId === memberId)
    if (!member) return
    
    // 팀장은 삭제할 수 없음
    if (member.role === '팀장') {
      toast.error('팀장은 삭제할 수 없습니다. 먼저 팀장 권한을 양도해주세요.')
      return
    }
    
    const isConfirmed = await confirm({
      title: '팀원 제외',
      message: `정말로 ${member.name}님을 팀에서 제외하시겠습니까?`,
      type: 'danger',
      confirmText: '제외',
      cancelText: '취소',
    })

    if (isConfirmed) {
      try {
        await removeClubMember(team.clubId, memberId)
        setTeam({
          ...team,
          members: team.members.filter(m => m.memberId !== memberId),
        })
        toast.success('팀원이 제외되었습니다.')
      } catch (error) {
        console.error('Failed to remove member:', error)
        toast.error('팀원 제외에 실패했습니다.')
      }
    }
  }

  const handleTransferLeadership = async (memberId: number) => {
    if (!team) return
    
    const member = team.members.find(m => m.memberId === memberId)
    if (!member) return
    
    const isConfirmed = await confirm({
      title: '팀장 권한 양도',
      message: `정말로 ${member.name}님에게 팀장 권한을 양도하시겠습니까?`,
      type: 'warning',
      confirmText: '양도',
      cancelText: '취소'
    })

    if (isConfirmed) {
      try {
        await changeClubLeader(team.clubId, memberId)
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
        toast.success('팀장 권한이 양도되었습니다.')
      } catch (error) {
        console.error('Failed to transfer leadership:', error)
        toast.error('팀장 권한 양도에 실패했습니다.')
      }
    }
  }

  const handleLoginLogout = () => {
    if (isLoggedIn) {
      clearAuth()
      setIsLoggedIn(false)
      setUserRole(null)
    } else {
      navigate('/login')
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
        <UserHeader 
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          onLogout={handleLoginLogout}
        />
        
        {/* 데스크톱 전용 히어로 섹션 */}
        <div className="hidden lg:block">
          <div className="pt-8 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                  {team.clubName}
                </h1>
                <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
                  {team.description.split('\n')[0]}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 모바일 전용 헤더 */}
        <div className="lg:hidden mt-2 mb-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">{team.clubName}</h1>
            <Link to="/user-dashboard" className="text-sm font-bold text-blue-600">
              ← 뒤로
            </Link>
          </div>
        </div>

        {/* 탭 메뉴 - 데스크톱 Pill 스타일 */}
        <div className="mb-6 sticky top-0 z-20 -mx-4 px-4 sm:mx-0 sm:px-0 py-2 bg-slate-50/80 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none lg:static">
          <div className="flex p-1 bg-slate-200/50 rounded-2xl lg:w-fit">
            <button
              onClick={() => setActiveTab('intro')}
              className={`flex-1 lg:flex-none px-6 py-2.5 text-sm font-bold transition-all rounded-xl ${
                activeTab === 'intro'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              팀 소개
            </button>
            {(isTeamLeader || isAdmin) && (
              <>
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`flex-1 lg:flex-none px-6 py-2.5 text-sm font-bold transition-all rounded-xl ${
                    activeTab === 'applications'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  신청서
                </button>
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`flex-1 lg:flex-none px-6 py-2.5 text-sm font-bold transition-all rounded-xl ${
                    activeTab === 'manage'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* 왼쪽: 팀 상세 정보 */}
            <div className="lg:col-span-8 space-y-8">
              <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">팀 소개</h3>
                  {!isTeamMember && isLoggedIn && applicationFormTemplate && (
                    <button
                      onClick={() => setShowApplicationModal(true)}
                      disabled={!applicationFormTemplate.isActive}
                      className={`rounded-xl px-6 py-3 text-sm font-bold text-white transition shadow-lg ${
                        applicationFormTemplate.isActive 
                          ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 active:scale-95' 
                          : 'bg-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {applicationFormTemplate.isActive ? '가입 신청하기' : '모집 마감'}
                    </button>
                  )}
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">
                    {team.description}
                  </p>
                </div>

                <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { label: '팀장', value: team.leader, icon: '👑', color: 'amber' },
                    { label: '팀원 수', value: `${team.members.length}명`, icon: '👥', color: 'blue' },
                  ].map((stat) => (
                    <div key={stat.label} className={`p-6 rounded-2xl bg-${stat.color}-50 border border-${stat.color}-100`}>
                      <span className="text-2xl mb-2 block">{stat.icon}</span>
                      <span className={`text-[10px] font-bold text-${stat.color}-600 uppercase tracking-widest`}>
                        {stat.label}
                      </span>
                      <p className="text-xl font-black text-slate-900 mt-1">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 팀 기능 바로가기 */}
              {(isAdmin || isTeamMember) && (team.type === ClubType.NEW_BELIEVER || team.type === ClubType.CONTENT) && (
                <section className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 px-2">팀 도구</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {team.type === ClubType.NEW_BELIEVER && (
                      <>
                        <Link
                          to="/manage/newcomers"
                          className="group relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-8 hover:border-blue-500 hover:shadow-xl transition-all"
                        >
                          <div className="relative z-10 flex items-center justify-between">
                            <div>
                              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                👥
                              </div>
                              <h4 className="text-lg font-bold text-slate-900">새신자 관리</h4>
                              <p className="text-sm text-slate-500 mt-1">등록 및 배정 현황 확인</p>
                            </div>
                            <span className="text-2xl opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all text-blue-500">→</span>
                          </div>
                          <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-blue-50/50 blur-3xl group-hover:bg-blue-100/50 transition-colors"></div>
                        </Link>
                        <Link
                          to="/manage/meal-tickets"
                          className="group relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-8 hover:border-indigo-500 hover:shadow-xl transition-all"
                        >
                          <div className="relative z-10 flex items-center justify-between">
                            <div>
                              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                🎫
                              </div>
                              <h4 className="text-lg font-bold text-slate-900">식권 관리</h4>
                              <p className="text-sm text-slate-500 mt-1">식권 발급 및 사용 내역</p>
                            </div>
                            <span className="text-2xl opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all text-indigo-500">→</span>
                          </div>
                          <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-indigo-50/50 blur-3xl group-hover:bg-indigo-100/50 transition-colors"></div>
                        </Link>
                      </>
                    )}
                    {team.type === ClubType.CONTENT && (
                      <Link
                        to="/manage/group-formation"
                        className="group relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-8 hover:border-purple-500 hover:shadow-xl transition-all"
                      >
                        <div className="relative z-10 flex items-center justify-between">
                          <div>
                            <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                              🧩
                            </div>
                            <h4 className="text-lg font-bold text-slate-900">조편성 관리</h4>
                            <p className="text-sm text-slate-500 mt-1">팀원 조 편성 및 관리</p>
                          </div>
                          <span className="text-2xl opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all text-purple-500">→</span>
                        </div>
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-purple-50/50 blur-3xl group-hover:bg-purple-100/50 transition-colors"></div>
                      </Link>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* 오른쪽: 팀원 목록 사이드바 */}
            <div className="lg:col-span-4">
              <div className="sticky top-8 space-y-6">
                <div className="bg-white rounded-3xl p-8 text-slate-900 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold">팀원 목록</h3>
                    <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-[10px] font-bold">
                      총 {team.members.length}명
                    </span>
                  </div>
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {team.members.map((member) => (
                      <div key={member.memberId} className="flex items-center gap-4 group">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent transition-all duration-300 shadow-sm">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate group-hover:text-blue-600 transition-colors">{member.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">빠른 도움말</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    활동 관련 문의는 팀장 혹은 임원에게 연락주세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 신청서 관리 탭 */}
        {activeTab === 'applications' && (isTeamLeader || isAdmin) && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 sm:p-8 shadow-sm">
              {/* 필터 및 검색 */}
              <div className="flex flex-col xl:flex-row xl:items-center gap-6 mb-8">
                {/* 신청서 양식 관리 버튼 */}
                <div className="flex flex-col sm:flex-row gap-3 xl:w-1/3">
                  {applicationFormTemplate && (
                    <button
                      onClick={handleToggleTemplateStatus}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all duration-300 shadow-sm ${
                        applicationFormTemplate.isActive
                          ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 active:scale-95'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 active:scale-95'
                      }`}
                    >
                      <div className={`h-2 w-2 rounded-full ${applicationFormTemplate.isActive ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
                      {applicationFormTemplate.isActive ? '모집 중단' : '모집 시작'}
                    </button>
                  )}
                  <button
                    onClick={() => setShowTemplateEdit(true)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 border border-slate-800"
                  >
                    <Settings className="h-4 w-4" />
                    {applicationFormTemplate ? '양식 수정' : '양식 생성'}
                  </button>
                </div>

                <div className="h-px xl:h-12 w-full xl:w-px bg-slate-100 hidden xl:block" />

                <div className="flex flex-col md:flex-row gap-4 flex-1">
                  {/* 상태 필터 */}
                  <div className="flex gap-1 bg-slate-50 p-1.5 rounded-[1.25rem] border border-slate-100 md:w-80">
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setApplicationStatusFilter(status as ApplicationStatus)}
                        className={`flex-1 py-2 text-[11px] font-black rounded-xl transition-all duration-300 uppercase tracking-tighter ${
                          applicationStatusFilter === status
                            ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50 ring-1 ring-slate-100'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                        }`}
                      >
                        {status === 'ALL' ? '전체' : status === 'PENDING' ? '대기' : status === 'APPROVED' ? '승인' : '거절'}
                      </button>
                    ))}
                  </div>
                  
                  {/* 검색 */}
                  <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      value={applicationSearchTerm}
                      onChange={(e) => setApplicationSearchTerm(e.target.value)}
                      placeholder="지원자 이름으로 검색..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pl-11 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* 신청서 목록 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {applications
                  .filter((app) => {
                    if (applicationStatusFilter !== 'ALL' && app.status !== applicationStatusFilter) return false
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
                      className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 cursor-pointer overflow-hidden"
                      onClick={() => {
                        setSelectedSubmissionId(app.submissionId)
                        setIsSubmissionDetailOpen(true)
                      }}
                    >
                      <div className={`absolute top-0 left-0 w-2 h-full transition-all duration-500 group-hover:w-3 ${
                        app.status === 'APPROVED' ? 'bg-emerald-500' : 
                        app.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />
                      
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center text-xl font-black text-slate-400 group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white group-hover:border-transparent transition-all duration-500 shadow-inner">
                            {app.submitterName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">
                              {app.submitterName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {app.submitDate}
                              </p>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1.5 text-[10px] font-black border uppercase tracking-widest ${
                            app.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : app.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}
                        >
                          {app.status === 'PENDING' ? '대기 중' : app.status === 'APPROVED' ? '승인됨' : '거절됨'}
                        </span>
                      </div>
                      
                      <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-xs font-black text-slate-400 group-hover:text-blue-600 transition-colors uppercase tracking-widest">상세 보기</span>
                        </div>
                        <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-45 transition-all duration-500 shadow-sm">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {applications.filter((app) => {
                if (applicationStatusFilter !== 'ALL' && app.status !== applicationStatusFilter) return false
                if (applicationSearchTerm && !app.submitterName.toLowerCase().includes(applicationSearchTerm.toLowerCase())) return false
                return true
              }).length === 0 && (
                <div className="text-center py-24 bg-slate-50/30 rounded-[3rem] border-2 border-dashed border-slate-100">
                  <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Search className="h-8 w-8 text-slate-200" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">신청서가 없습니다</h4>
                  <p className="text-slate-400 mt-2 text-sm font-medium">검색어나 필터를 변경해보세요.</p>
                </div>
              )}
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
          template={applicationFormTemplate}
        />

        {/* 팀 관리 탭 */}
        {activeTab === 'manage' && (isTeamLeader || isAdmin) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 왼쪽: 팀 소개 관리 */}
            <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-8">
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Settings className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">팀 정보 관리</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTeamInfoEdit(true)}
                    className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100 transition-all active:scale-95"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">팀 이름</span>
                    </div>
                    <span className="text-lg font-black text-slate-900">{team.clubName}</span>
                  </div>
                  
                  <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">팀 설명</span>
                    </div>
                    <div className="text-sm font-medium text-slate-600 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar pr-2 whitespace-pre-wrap">
                      {team.description}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽: 팀원 관리 */}
            <div className="lg:col-span-7 space-y-8">
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm min-h-[600px]">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">팀원 관리</h2>
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        총 {team.members.length}명의 팀원이 활동 중입니다
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 border border-indigo-500"
                  >
                    <UserPlus className="h-4 w-4" />
                    팀원 추가하기
                  </button>
                </div>
                
                {/* 팀원 명단 */}
                <div className="max-h-[400px] overflow-y-auto pr-2 -mr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {team.members.map((member) => (
                      <div
                        key={member.memberId}
                        className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50/50 p-5 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-lg font-black text-slate-400 shadow-sm group-hover:bg-indigo-600 group-hover:text-white group-hover:border-transparent transition-all duration-500">
                            {member.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">
                              {member.name}
                            </span>
                          </div>
                        </div>

                        {member.role !== '팀장' && (isTeamLeader || isAdmin) && (
                          <div className="relative">
                            <button
                              onClick={() => setOpenMemberMenuId(openMemberMenuId === member.memberId ? null : member.memberId)}
                              className={`p-2 rounded-xl transition-all duration-200 border ${
                                openMemberMenuId === member.memberId
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'text-slate-300 hover:text-slate-600 hover:bg-white hover:border-slate-200'
                              }`}
                            >
                              <MoreHorizontal className="h-5 w-5" />
                            </button>
                            
                            {openMemberMenuId === member.memberId && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMemberMenuId(null)}
                                />
                                <div className="absolute right-0 mt-3 w-48 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-4 ring-slate-900/5">
                                  <button
                                    onClick={() => {
                                      handleTransferLeadership(member.memberId)
                                      setOpenMemberMenuId(null)
                                    }}
                                    className="w-full text-left px-5 py-4 text-xs font-black text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors group/item"
                                  >
                                    <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover/item:bg-amber-100 transition-colors">
                                      <Shield className="h-4 w-4" />
                                    </div>
                                    팀장 권한 위임
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleRemoveMember(member.memberId)
                                      setOpenMemberMenuId(null)
                                    }}
                                    className="w-full text-left px-5 py-4 text-xs font-black text-rose-600 hover:bg-rose-50 flex items-center gap-3 border-t border-slate-50 transition-colors group/item"
                                  >
                                    <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover/item:bg-rose-100 transition-colors">
                                      <Trash2 className="h-4 w-4" />
                                    </div>
                                    팀에서 내보내기
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
            </div>
          </div>
        )}

        {/* 가입신청서 모달 */}
        {showApplicationModal && applicationFormTemplate && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
            <div className="w-full max-w-2xl rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{applicationFormTemplate.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">가입 신청을 위한 정보를 입력해주세요.</p>
                </div>
                <button
                  onClick={() => {
                    setShowApplicationModal(false)
                    setApplicationAnswers({})
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
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
                lockSettings={true}
              />
            </div>
          </div>
        )}

        {/* 팀 소개 수정 모달 */}
        {showTeamInfoEdit && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
            <div className="w-full max-w-2xl rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">팀 소개 수정</h2>
                  <p className="text-xs text-slate-500 mt-0.5">팀의 기본 정보를 변경할 수 있습니다.</p>
                </div>
                <button
                  onClick={() => setShowTeamInfoEdit(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                    팀 이름 *
                  </label>
                  <input
                    type="text"
                    value={teamInfoForm.clubName}
                    onChange={(e) => setTeamInfoForm({ ...teamInfoForm, clubName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="팀 이름을 입력해주세요"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                    팀 설명 *
                  </label>
                  <textarea
                    value={teamInfoForm.description}
                    onChange={(e) => setTeamInfoForm({ ...teamInfoForm, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    rows={5}
                    placeholder="팀에 대한 설명을 입력해주세요"
                  />
                </div>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => setShowTeamInfoEdit(false)}
                  className="order-2 sm:order-1 rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition active:scale-[0.98]"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveTeamInfo}
                  className="order-1 sm:order-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700 transition shadow-md active:scale-[0.98]"
                >
                  변경사항 저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 팀원 추가 모달 */}
        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
            <div className="w-full max-w-2xl rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">팀원 추가</h2>
                  <p className="text-xs text-slate-500 mt-0.5">새로운 팀원을 검색하여 추가하세요.</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddMemberModal(false)
                    setMemberSearchTerm('')
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>

              {/* 검색 입력창 */}
              <div className="mb-6 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={memberSearchTerm}
                  onChange={(e) => setMemberSearchTerm(e.target.value)}
                  placeholder="이름으로 팀원 검색..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pl-11 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                />
              </div>
              
              {/* 청년부 명단 */}
              <div className="max-h-[60vh] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                <div className="grid gap-2">
                  {allMembers
                    .filter(m => !team.members.some(tm => tm.memberId === m.memberId))
                    .filter(m => m.name.toLowerCase().includes(memberSearchTerm.toLowerCase()))
                    .map((member) => (
                      <div
                        key={member.memberId}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shadow-sm">
                            {member.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{member.name}</span>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            await handleAddMember(member.memberId)
                            setShowAddMemberModal(false)
                            setMemberSearchTerm('')
                          }}
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm active:scale-[0.98]"
                        >
                          추가
                        </button>
                      </div>
                    ))}
                  {allMembers
                    .filter(m => !team.members.some(tm => tm.memberId === m.memberId))
                    .filter(m => m.name.toLowerCase().includes(memberSearchTerm.toLowerCase())).length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <span className="text-3xl block mb-2">🔍</span>
                      <p className="text-slate-400 text-sm font-medium">
                        {memberSearchTerm ? '검색 결과가 없습니다.' : '추가할 수 있는 멤버가 없습니다.'}
                      </p>
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
