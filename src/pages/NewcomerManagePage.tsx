import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFileUrl } from '../services/albumService'
import { getMembers } from '../services/memberService'
import { 
  getNewcomers, 
  getNewcomerById, 
  createNewcomer, 
  updateNewcomer, 
  updateNewcomerStatus, 
  deleteNewcomer, 
  getMdAssignments, 
  createMdAssignment, 
  updateMdAssignment, 
  deleteMdAssignment,
  uploadNewcomerImage,
  createNewcomersBatch,
  graduateNewcomer,
  assignNewcomerCell
} from '../services/newcomerService'
import type { 
  Newcomer, 
  NewcomerStatus, 
  MdAssignment, 
  CreateNewcomerRequest,
  CreateMdAssignmentRequest,
} from '../types/newcomer'
import { NewcomerStatusMap } from '../types/newcomer'
import type { Member } from '../types/member'
import { getCells, type Cell } from '../services/cellService'
import { formatPhoneNumber } from '../utils/format'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

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

// 내보내기 필드 타입 정의
type ExportField = keyof Newcomer | 'photo'

interface ExportFieldOption {
  id: ExportField
  label: string
}

const exportFields: ExportFieldOption[] = [
  { id: 'photo', label: '사진' },
  { id: 'name', label: '이름' },
  { id: 'gender', label: '성별' },
  { id: 'birthDate', label: '생년월일' },
  { id: 'phone', label: '연락처' },
  { id: 'address', label: '거주지' },
  { id: 'managerName', label: '담당MD' },
  { id: 'registrationDate', label: '등록일자' },
  { id: 'cellName', label: '등반예정순' },
  { id: 'isChurchRegistered', label: '교회등록여부' },
  { id: 'status', label: '상태' },
  { id: 'firstStatus', label: '처음 현황' },
  { id: 'middleStatus', label: '중간 현황' },
  { id: 'recentStatus', label: '최근 현황' },
  { id: 'assignmentNote', label: '순배치 특이사항' },
]

const getStatusFromTab = (tab: string): string | undefined => {
  switch (tab) {
    case '관리중': return 'MAIN_WORSHIP'
    case '보류': return 'HOLD'
    case '중단': return 'STOPPED'
    case '정착완료': return 'SETTLED'
    default: return undefined
  }
}

function NewcomerManagePage() {
  const navigate = useNavigate()
  const [newcomers, setNewcomers] = useState<Newcomer[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingNewcomer, setEditingNewcomer] = useState<Newcomer | null>(null)
  const [selectedNewcomer, setSelectedNewcomer] = useState<Newcomer | null>(null)
  const [originalNewcomer, setOriginalNewcomer] = useState<Newcomer | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [openDetailMenu, setOpenDetailMenu] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [openMdMenuId, setOpenMdMenuId] = useState<number | null>(null)
  const [openMenuUp, setOpenMenuUp] = useState(false)
  const [openMdMenuUp, setOpenMdMenuUp] = useState(false)
  const [listMenuPos, setListMenuPos] = useState<{ top: number; right: number; bottom: number } | null>(null)
  const [mdMenuPos, setMdMenuPos] = useState<{ top: number; right: number; bottom: number } | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'messages' | 'rnr'>('list')
  const [statusTab, setStatusTab] = useState<string>('전체')
  const [mdList, setMdList] = useState<MdAssignment[]>([])
  const [showMdModal, setShowMdModal] = useState(false)
  const [editingMd, setEditingMd] = useState<MdAssignment | null>(null)
  const [teamMembers, setTeamMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusChangeTarget, setStatusChangeTarget] = useState<Newcomer | null>(null)
  
  // 순 배정 모달 상태
  const [showCellAssignModal, setShowCellAssignModal] = useState(false)
  const [cellAssignTargetId, setCellAssignTargetId] = useState<number | null>(null)
  const [selectedCellId, setSelectedCellId] = useState<number | null>(null)
  const [cellList, setCellList] = useState<Cell[]>([])

  // Year Filter State
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  
  // Race condition prevention for detail fetching
  const lastRequestedIdRef = useRef<number | null>(null)

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = 0; i < 5; i++) {
      years.push(String(currentYear - i))
    }
    return years
  }, [])

  const loadNewcomers = useCallback(async () => {
    try {
      const response = await getNewcomers({
        page: currentPage - 1,
        size: itemsPerPage,
        year: parseInt(selectedYear),
        status: getStatusFromTab(statusTab),
        keyword: searchQuery 
      })
      setNewcomers(response.content)
      setTotalPages(response.totalPages)
      setTotalElements(response.totalElements)
    } catch (error) {
      console.error('Failed to load newcomers', error)
    }
  }, [currentPage, itemsPerPage, selectedYear, statusTab, searchQuery])

  const loadMds = async () => {
    try {
      const data = await getMdAssignments()
      setMdList(data)
    } catch (error) {
      console.error('Failed to load MDs', error)
    }
  }

  const loadCells = async () => {
    try {
      const cells = await getCells(parseInt(selectedYear))
      setCellList(cells)
    } catch (error) {
      console.error('Failed to load cells', error)
    }
  }

  useEffect(() => {
    if (activeTab === 'list') {
      loadNewcomers()
    }
  }, [loadNewcomers, activeTab])

  useEffect(() => {
    loadMds()
  }, [])

  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  
  // 내보내기 설정 모달 상태
  const [showExportSettingsModal, setShowExportSettingsModal] = useState(false)
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'image' | null>(null)
  const [selectedExportFields, setSelectedExportFields] = useState<ExportField[]>([
    'photo', 'name', 'gender', 'birthDate', 'phone', 'address', 'managerName', 'registrationDate', 'cellName',
    'isMemberRegistered', 'status', 'firstStatus', 'middleStatus', 'recentStatus', 'assignmentNote'
  ])
  const [exportModalTab, setExportModalTab] = useState<'people' | 'fields'>('people')

  // 내보내기 대상 선택 상태
  const [exportCandidates, setExportCandidates] = useState<Newcomer[]>([])
  const [selectedExportNewcomerIds, setSelectedExportNewcomerIds] = useState<Set<number>>(new Set())
  const [isExportLoading, setIsExportLoading] = useState(false)

  useEffect(() => {
    if (showExportSettingsModal) {
      const fetchCandidates = async () => {
        setIsExportLoading(true)
        try {
          const response = await getNewcomers({
            page: 0,
            size: 10000,
            year: parseInt(selectedYear),
            status: getStatusFromTab(statusTab),
            keyword: searchQuery
          })
          setExportCandidates(response.content)
          // 기본값: 전체 선택
          setSelectedExportNewcomerIds(new Set(response.content.map(n => n.newcomerId)))
          
          // 모든 포맷에서 대상 선택 탭을 기본으로 설정
          setExportModalTab('people')
        } catch (error) {
          console.error('Failed to fetch export candidates', error)
          alert('데이터를 불러오는 중 오류가 발생했습니다.')
        } finally {
          setIsExportLoading(false)
        }
      }
      fetchCandidates()
    } else {
      setExportCandidates([])
      setSelectedExportNewcomerIds(new Set())
      setExportModalTab('people') // Reset tab
    }
  }, [showExportSettingsModal, selectedYear, statusTab, searchQuery, exportFormat])

  // 엑셀 업로드 안내 모달 상태
  const [showExcelUploadModal, setShowExcelUploadModal] = useState(false)
  const excelFileInputRef = useRef<HTMLInputElement>(null)

  // 엑셀 미리보기 및 선택 상태
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [excelPreviewData, setExcelPreviewData] = useState<
    (CreateNewcomerRequest & {
      isDuplicate?: boolean
      middleStatus?: string
      recentStatus?: string
      assignmentNote?: string
      mdName?: string
      registrationDate?: string
      isMemberRegistered?: boolean
      firstStatus?: string
    })[]
  >([])
  const [selectedPreviewRows, setSelectedPreviewRows] = useState<Set<number>>(new Set())

  // 엑셀 양식 다운로드
  const handleDownloadTemplate = () => {
    const headers = [
      '담당 MD명', '작성일자', '새신자명', '등록여부', '성별', 
      '생년월일', '연락처', '배치순', '거주지', 
      '처음에 알게 된 현황', '중간 현황', '최근 현황', '순배치참고'
    ]
    const ws = XLSX.utils.aoa_to_sheet([headers])
    
    // 열 너비 설정
    const wscols = [
      { wch: 10 }, // 담당 MD명
      { wch: 10 }, // 작성일자
      { wch: 10 }, // 새신자명
      { wch: 8 },  // 등록여부
      { wch: 6 },  // 성별
      { wch: 12 }, // 생년월일
      { wch: 15 }, // 연락처
      { wch: 10 }, // 배치순
      { wch: 20 }, // 거주지
      { wch: 20 }, // 처음 현황
      { wch: 20 }, // 중간 현황
      { wch: 20 }, // 최근 현황
      { wch: 20 }, // 순배치참고
    ]
    ws['!cols'] = wscols

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '새신자 등록 양식')
    XLSX.writeFile(wb, '새신자_등록_양식.xlsx')
  }

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)

        // 기존 등록된 새신자 명단 가져오기 (중복 체크용)
        const existingSet = new Set<string>()
        try {
          const response = await getNewcomers({ page: 0, size: 10000 })
          response.content.forEach((n) => {
            // 이름 + 생년월일 조합
            if (n.birthDate) {
              existingSet.add(`${n.name}|${n.birthDate}`)
            }
            // 이름 + 연락처(숫자만) 조합
            if (n.phone) {
              const cleanPhone = n.phone.replace(/[^0-9]/g, '')
              if (cleanPhone.length >= 4) {
                 existingSet.add(`${n.name}|${cleanPhone}`)
              }
            }
            // 이름 + 등록일 조합
            if (n.registrationDate) {
              existingSet.add(`${n.name}|${n.registrationDate}`)
            }
          })
        } catch (err) {
          console.error('중복 체크를 위한 명단 조회 실패:', err)
        }

        // 날짜 변환 (YYMMDD -> YYYY-MM-DD)
        const parseDate = (val: unknown) => {
          if (!val) return ''
          const str = String(val).replace(/\./g, '')
          if (str.length === 6) {
            const y = parseInt(str.substring(0, 2))
            const m = str.substring(2, 4)
            const d = str.substring(4, 6)
            const fullYear = y > 50 ? 1900 + y : 2000 + y
            return `${fullYear}-${m}-${d}`
          }
          return String(val)
        }

        // 생년월일 변환 (98.03.14 -> 1998-03-14)
        const parseBirth = (val: unknown) => {
          if (!val) return ''
          const str = String(val).trim()
          if (str.includes('.')) {
            const parts = str.split('.')
            if (parts.length === 3) {
              const y = parseInt(parts[0])
              const m = parts[1].padStart(2, '0')
              const d = parts[2].padStart(2, '0')
              const fullYear = y > 50 ? 1900 + y : 2000 + y
              return `${fullYear}-${m}-${d}`
            }
          }
          return str
        }

        // Helper to find value by multiple possible keys, ignoring whitespace
        const getValue = (row: Record<string, unknown>, possibleKeys: string[]) => {
          const rowKeys = Object.keys(row)
          for (const key of possibleKeys) {
            // 1. Try exact match
            if (row[key] !== undefined) return row[key]
            
            // 2. Try matching without spaces
            const cleanKey = key.replace(/\s/g, '')
            const matchedKey = rowKeys.find(k => k.replace(/\s/g, '') === cleanKey)
            if (matchedKey && row[matchedKey] !== undefined) return row[matchedKey]
          }
          return undefined
        }

        const newNewcomers = data.map((row: unknown) => {
          const r = row as Record<string, unknown>;
          const rawManagerName = getValue(r, ['담당MD', '담당자', 'MD', '인도자', '담당 MD명', '담당MD명']) || ''
          const managerName = String(rawManagerName).trim()

          const name = String(getValue(r, ['새신자명', '이름', '성명']) || '').trim()
          const birthDate = parseBirth(getValue(r, ['생년월일']))
          const phone = getValue(r, ['연락처', '전화번호', '휴대폰']) || ''
          const cleanPhone = String(phone).replace(/[^0-9]/g, '')
          const address = String(getValue(r, ['거주지', '주소']) || '')
          const regDate = getValue(r, ['작성일자', '등록일', '등록일자'])
          const regYn = getValue(r, ['등록여부', '등록 여부'])
          const gender = getValue(r, ['성별'])
          
          // 중복 여부 확인
          const parsedRegDate = parseDate(regDate)
          const isDuplicate = 
            (birthDate && existingSet.has(`${name}|${birthDate}`)) ||
            (cleanPhone.length >= 4 && existingSet.has(`${name}|${cleanPhone}`)) ||
            (parsedRegDate && existingSet.has(`${name}|${parsedRegDate}`))

          return {
            name: name,
            gender: ((gender === '여성' || gender === 'FEMALE') ? 'FEMALE' : 'MALE') as 'MALE' | 'FEMALE',
            birthDate: birthDate,
            phone: cleanPhone,
            address: address,
            mdName: managerName, // 백엔드로 전달할 MD 이름 (managerName -> mdName)
            registrationDate: parseDate(regDate),
            isMemberRegistered: false,
            isChurchRegistered: regYn === 'O' || regYn === 'o', // 엑셀에서 O/o 표시는 교회 등록 여부로 처리
            status: 'MAIN_WORSHIP', // 기본값
            firstStatus: String(getValue(r, ['처음에 알게 된 현황', '초기상태']) || ''),
            middleStatus: String(getValue(r, ['중간 현황', '중간상태']) || ''),
            recentStatus: String(getValue(r, ['최근 현황', '최근상태']) || ''),
            assignmentNote: String(getValue(r, ['순배치참고', '비고']) || ''),
            profileImageUrl: '', // 엑셀에는 이미지 없음
            isDuplicate: !!isDuplicate
          }
        })

        setExcelPreviewData(newNewcomers)
        // 중복이 아닌 항목만 선택
        const validIndices = newNewcomers
          .map((n, idx) => !n.isDuplicate ? idx : -1)
          .filter(idx => idx !== -1)
        
        setSelectedPreviewRows(new Set(validIndices))
        setShowPreviewModal(true)
        setShowExcelUploadModal(false)
      } catch (error) {
        console.error('Excel upload error:', error)
        alert('엑셀 업로드 중 오류가 발생했습니다.')
      }
    }
    reader.readAsBinaryString(file)
    if (excelFileInputRef.current) {
      excelFileInputRef.current.value = ''
    }
  }

  // 선택된 엑셀 데이터 저장
  const handleSaveSelectedExcelData = async () => {
    try {
      const selectedData = excelPreviewData.filter((_, idx) => selectedPreviewRows.has(idx))
      if (selectedData.length === 0) {
        alert('저장할 데이터가 없습니다.')
        return
      }

      await createNewcomersBatch(selectedData)
      await loadNewcomers()
      
      alert(`${selectedData.length}명의 새신자가 추가되었습니다.`)
      setShowPreviewModal(false)
      setExcelPreviewData([])
      setSelectedPreviewRows(new Set())
    } catch (error) {
      console.error('Excel save error:', error)
      alert('데이터 저장 중 오류가 발생했습니다.')
    }
  }

  // 미리보기 행 선택 토글
  const togglePreviewRowSelection = (index: number) => {
    const newSelection = new Set(selectedPreviewRows)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      newSelection.add(index)
    }
    setSelectedPreviewRows(newSelection)
  }

  // 전체 선택 토글
  const toggleAllPreviewRows = () => {
    if (selectedPreviewRows.size === excelPreviewData.length) {
      setSelectedPreviewRows(new Set())
    } else {
      setSelectedPreviewRows(new Set(excelPreviewData.map((_, idx) => idx)))
    }
  }

  // 외부 클릭 감지 (내보내기 메뉴 닫기 및 MD 메뉴 닫기)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 내보내기 메뉴 닫기
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
      
      // MD 메뉴 닫기 (메뉴 내부 클릭은 stopPropagation으로 인해 여기 도달하지 않음)
      setOpenMdMenuId(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 이미지 뷰어 모달
  const [imageViewUrl, setImageViewUrl] = useState<string | null>(null)
  const [imageViewName, setImageViewName] = useState('')



  // MD 폼 데이터
  const [mdFormData, setMdFormData] = useState<{
    charge: string
    gender: string
    name: string
    phone: string
    ageGroup: string
    memberId: number
  }>({
    charge: '',
    gender: '남성',
    name: '',
    phone: '',
    ageGroup: '',
    memberId: 0,
  })

  // 새신자 폼 데이터
  const [formData, setFormData] = useState<CreateNewcomerRequest & { 
    mdName: string
    registrationDate: string
    isMemberRegistered: boolean
    status: NewcomerStatus
    firstStatus: string
    middleStatus: string
    recentStatus: string
    assignmentNote: string
  }>({
    name: '',
    gender: 'MALE',
    birthDate: '',
    phone: '',
    address: '',
    mdName: '',
    managerMemberId: undefined,
    registrationDate: new Date().toISOString().split('T')[0],
    isMemberRegistered: false,
    isChurchRegistered: true,
    status: 'MAIN_WORSHIP',
    firstStatus: '',
    middleStatus: '',
    recentStatus: '',
    assignmentNote: '',
    profileImageUrl: '',
  })

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCreate = () => {
    setEditingNewcomer(null)
    setFormData({
      name: '',
      gender: 'MALE',
      birthDate: '',
      phone: '',
      address: '',
      mdName: '',
      managerMemberId: undefined,
      registrationDate: new Date().toISOString().split('T')[0],
      isMemberRegistered: false,
      isChurchRegistered: true,
      status: 'MAIN_WORSHIP',
      firstStatus: '',
      middleStatus: '',
      recentStatus: '',
      assignmentNote: '',
      profileImageUrl: '',
    })
    setImagePreview(null)
    setShowModal(true)
  }

  const handleEdit = (newcomer: Newcomer) => {
    setEditingNewcomer(newcomer)

    // 전화번호 포맷팅
    const cleanPhone = newcomer.phone.replace(/[^0-9]/g, '')
    let formattedPhone = cleanPhone
    if (cleanPhone.length > 3 && cleanPhone.length <= 7) {
      formattedPhone = `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3)}`
    } else if (cleanPhone.length > 7) {
      formattedPhone = `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 7)}-${cleanPhone.slice(7, 11)}`
    }

    setFormData({
      name: newcomer.name,
      gender: newcomer.gender,
      birthDate: newcomer.birthDate,
      phone: formattedPhone,
      address: newcomer.address,
      mdName: newcomer.managerName || '',
      managerMemberId: undefined, // 편집 시에는 managerName을 사용하지만, 저장 시에는 다시 매핑이 필요할 수 있음 (현재 로직에서는 mdName을 사용)
      registrationDate: newcomer.registrationDate,
      isMemberRegistered: newcomer.isMemberRegistered,
      isChurchRegistered: newcomer.isChurchRegistered,
      status: newcomer.status,
      firstStatus: newcomer.firstStatus,
      middleStatus: newcomer.middleStatus,
      recentStatus: newcomer.recentStatus,
      assignmentNote: newcomer.assignmentNote,
      profileImageUrl: newcomer.profileImageUrl || '',
    })
    setImagePreview(newcomer.profileImageUrl ? getFileUrl(newcomer.profileImageUrl) : null)
    setShowModal(true)
  }

  const handleDelete = async (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    if (!confirm('새신자 정보를 삭제하시겠습니까?')) {
      return
    }
    try {
      await deleteNewcomer(id)
      await loadNewcomers()
      if (selectedNewcomer?.newcomerId === id) {
        setIsDetailModalOpen(false)
        setSelectedNewcomer(null)
        setOriginalNewcomer(null)
      }
    } catch (error) {
      console.error('새신자 삭제 실패:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleOpenCellAssignModal = async (id: number) => {
    setCellAssignTargetId(id)
    setSelectedCellId(null) // 초기화
    await loadCells()
    setShowCellAssignModal(true)
  }

  const handleAssignCell = async () => {
    if (!cellAssignTargetId || !selectedCellId) {
      alert('순을 선택해주세요.')
      return
    }
    
    const selectedCell = cellList.find(c => c.cellId === selectedCellId)
    if (!selectedCell) {
      alert('유효하지 않은 순입니다.')
      return
    }

    try {
      await assignNewcomerCell(cellAssignTargetId, selectedCell.cellName)
      alert('순 배정이 완료되었습니다.')
      setShowCellAssignModal(false)
      
      // 목록 새로고침
      await loadNewcomers()
      
      // 상세 모달이 열려있다면 해당 정보도 업데이트
      if (selectedNewcomer && selectedNewcomer.newcomerId === cellAssignTargetId) {
        const updatedNewcomer = await getNewcomerById(cellAssignTargetId)
        setSelectedNewcomer(updatedNewcomer)
        setOriginalNewcomer(updatedNewcomer)
      }
    } catch (error) {
      console.error('순 배정 실패:', error)
      alert('순 배정 중 오류가 발생했습니다.')
    }
  }

  const handleCloseDetailModal = () => {
    if (selectedNewcomer && originalNewcomer && JSON.stringify(selectedNewcomer) !== JSON.stringify(originalNewcomer)) {
      if (!confirm('저장하지 않은 변경사항이 있습니다. 정말 닫으시겠습니까?')) {
        return
      }
    }
    setIsDetailModalOpen(false)
    setSelectedNewcomer(null)
    setOriginalNewcomer(null)
  }

  const handleRowClick = async (newcomer: Newcomer) => {
    console.log('Row clicked:', newcomer)
    // 열려있는 메뉴들 닫기
    setOpenMenuId(null)
    setOpenMdMenuId(null)
    
    // Race condition prevention
    lastRequestedIdRef.current = newcomer.newcomerId

    setSelectedNewcomer(newcomer)
    setOriginalNewcomer(newcomer)
    setIsDetailModalOpen(true)

    try {
      const detailData = await getNewcomerById(newcomer.newcomerId)
      // Only update if this is still the most recently requested item
      if (lastRequestedIdRef.current === newcomer.newcomerId) {
        console.log('Detail data fetched:', detailData)
        setSelectedNewcomer(detailData)
        setOriginalNewcomer(detailData)
      }
    } catch (error) {
      console.error('Failed to fetch newcomer details:', error)
    }
  }

  const handleEditClick = (newcomer: Newcomer, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    handleEdit(newcomer)
  }

  // 새신자 팀원 목록 로드
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

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null)
      setOpenMdMenuId(null)
    }
    if (openMenuId || openMdMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [openMenuId, openMdMenuId])

  // 상태 변경 핸들러
  const handleStatusChange = async (newcomerId: number, newStatus: NewcomerStatus) => {
    const target = newcomers.find((n) => n.newcomerId === newcomerId)
    // 같은 상태 그룹(예: MAIN_WORSHIP, YOUTH_WORSHIP은 모두 '관리중')이면 변경하지 않음
    if (target && NewcomerStatusMap[target.status] === NewcomerStatusMap[newStatus]) {
      alert('이미 해당 상태입니다.')
      return
    }

    try {
      await updateNewcomerStatus(newcomerId, newStatus)
      setNewcomers(newcomers.map((n) => (n.newcomerId === newcomerId ? { ...n, status: newStatus } : n)))
      setShowStatusModal(false)
      setStatusChangeTarget(null)
    } catch (error) {
      console.error('Status update failed:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  // 상태 변경 모달 열기
  const handleOpenStatusModal = (newcomer: Newcomer) => {
    setStatusChangeTarget(newcomer)
    setShowStatusModal(true)
    setOpenMenuId(null)
  }

  // 등반 처리 핸들러
  const handleGraduate = async (id: number) => {
    if (!confirm('해당 새신자를 청년부 등록 처리하시겠습니까?')) {
      return
    }
    try {
      await graduateNewcomer(id)
      await loadNewcomers()
      alert('청년부 등록 처리가 완료되었습니다.')
    } catch (error) {
      console.error('Graduate processing failed:', error)
      alert('청년부 등록 처리에 실패했습니다.')
    }
  }

  // 검색어 변경 시 첫 페이지로
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusTab, selectedYear])

  // 상태 색상
  const getStatusColor = (status: NewcomerStatus | string) => {
    // 백엔드 Enum 값에 대응
    if (status === 'MAIN_WORSHIP' || status === 'YOUTH_WORSHIP') return 'bg-blue-100 text-blue-700'
    if (status === 'HOLD') return 'bg-yellow-100 text-yellow-700'
    if (status === 'STOPPED') return 'bg-red-100 text-red-700'
    if (status === 'SETTLED') return 'bg-green-100 text-green-700'
    
    // 기존 한글 값 대응 (혹시 모를 하위 호환)
    switch (status) {
      case '관리중':
        return 'bg-blue-100 text-blue-700'
      case '보류':
        return 'bg-yellow-100 text-yellow-700'
      case '중단':
        return 'bg-red-100 text-red-700'
      case '정착완료':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  // 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const url = URL.createObjectURL(file)
        setImagePreview(url)
        
        // 실제 파일 업로드 (선택 사항: 미리 업로드하거나 저장 시 업로드할 수 있음)
        // 여기서는 바로 업로드하여 URL을 받아온다고 가정
        const uploadedUrl = await uploadNewcomerImage(file)
        setFormData({ ...formData, profileImageUrl: uploadedUrl })
      } catch (error) {
        console.error('Image upload failed:', error)
        alert('이미지 업로드에 실패했습니다.')
      }
    }
  }

  const handleSave = async () => {
    if (!formData.name) {
      alert('새신자 이름을 입력해주세요.')
      return
    }

    try {
      setIsSaving(true)

      // MD 이름으로 MD ID 찾기
      const selectedMd = mdList.find(md => md.name === formData.mdName)
      const managerMemberId = selectedMd ? selectedMd.memberId : undefined

      // 요청 페이로드 구성
      const payload: CreateNewcomerRequest = {
        name: formData.name,
        gender: formData.gender,
        birthDate: formData.birthDate,
        phone: formData.phone.replace(/[^0-9]/g, ''),
        address: formData.address,
        managerMemberId: managerMemberId,
        isChurchRegistered: formData.isChurchRegistered,
        profileImageUrl: formData.profileImageUrl
      }
      
      if (editingNewcomer) {
        // 수정 시에는 기존 API 구조 유지 또는 필요에 따라 수정
        // 여기서는 생성 요청만 변경 요청이 있었으므로 생성 부분만 확실히 변경
        // 하지만 updateNewcomerRequest 타입도 확인 필요. 현재는 그대로 둠.
        const updatePayload = { 
          ...formData,
          phone: formData.phone.replace(/[^0-9]/g, '')
        }
        await updateNewcomer(editingNewcomer.newcomerId, updatePayload)
      } else {
        await createNewcomer(payload)
      }
      await loadNewcomers()
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save newcomer', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 엑셀 다운로드 (사진 및 상세정보 포함)
  const handleDownloadExcel = async () => {
    try {
      if (selectedExportNewcomerIds.size === 0) {
        alert('선택된 대상이 없습니다.')
        return
      }

      setIsExportLoading(true)

      // 상세 정보 조회를 위해 API 호출
      const selectedIds = Array.from(selectedExportNewcomerIds)
      const allData = await Promise.all(
        selectedIds.map(id => getNewcomerById(id))
      )

      const JSZip = (await import('jszip')).default
      const { saveAs } = await import('file-saver')

      const includePhotos = selectedExportFields.includes('photo')
      const zip = new JSZip()
      const folder = zip.folder('photos')
      
      const dataToExport = await Promise.all(allData.map(async (n) => {
        let imageFileName = ''
        if (includePhotos && n.profileImageUrl) {
          try {
            const response = await fetch(n.profileImageUrl)
            const blob = await response.blob()
            const extension = blob.type.split('/')[1] || 'jpg'
            // 파일명에 ID를 포함하여 고유성 보장
            imageFileName = `${n.name}_${n.newcomerId}.${extension}`
            folder?.file(imageFileName, blob)
          } catch (error) {
            console.error('Image fetch error:', error)
          }
        }

        const rowData: Record<string, unknown> = {}
        if (selectedExportFields.includes('name')) rowData['이름'] = String(n.name || '')
        if (selectedExportFields.includes('managerName')) rowData['담당MD'] = String(n.managerName || '')
        if (selectedExportFields.includes('status')) rowData['상태'] = String(NewcomerStatusMap[n.status] || n.status || '')
        if (selectedExportFields.includes('isChurchRegistered')) rowData['교회등록여부'] = n.isChurchRegistered ? '등록' : '미등록'
        if (selectedExportFields.includes('gender')) rowData['성별'] = n.gender === 'MALE' ? '남' : (n.gender === 'FEMALE' ? '여' : String(n.gender || ''))
        if (selectedExportFields.includes('birthDate')) rowData['생년월일'] = String(n.birthDate || '')
        if (selectedExportFields.includes('phone')) rowData['연락처'] = formatPhoneNumber(n.phone)
        if (selectedExportFields.includes('address')) rowData['거주지'] = String(n.address || '')
        if (selectedExportFields.includes('registrationDate')) rowData['등록일자'] = String(n.registrationDate || '')
        if (selectedExportFields.includes('cellName')) rowData['등반예정순'] = String(n.cellName || n.assignedSoon || '')
        if (selectedExportFields.includes('firstStatus')) rowData['처음 현황'] = String(n.firstStatus || '')
        if (selectedExportFields.includes('middleStatus')) rowData['중간 현황'] = String(n.middleStatus || '')
        if (selectedExportFields.includes('recentStatus')) rowData['최근 현황'] = String(n.recentStatus || '')
        if (selectedExportFields.includes('assignmentNote')) rowData['순배치 특이사항'] = String(n.assignmentNote || '')
        if (includePhotos) rowData['사진'] = imageFileName ? `photos/${imageFileName}` : ''
        
        return rowData
      }))

      const worksheet = XLSX.utils.json_to_sheet(dataToExport)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '새신자 목록')
      
      // 사진이 포함되지 않은 경우 바로 엑셀 파일 다운로드
      if (!includePhotos) {
        XLSX.writeFile(workbook, `새신자_목록_${statusTab}_${new Date().toISOString().split('T')[0]}.xlsx`)
      } else {
        // 사진이 포함된 경우 ZIP 파일 생성
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        zip.file(`새신자_목록.xlsx`, excelBuffer)
        
        const content = await zip.generateAsync({ type: 'blob' })
        saveAs(content, `새신자_관리_데이터_${statusTab}_${new Date().toISOString().split('T')[0]}.zip`)
      }
      
      setShowExportSettingsModal(false)
    } catch (error) {
      console.error('Export failed:', error)
      alert('데이터 내보내기에 실패했습니다.')
    } finally {
      setIsExportLoading(false)
    }
  }

  // PDF 다운로드
  const handleDownloadPdf = async () => {
    try {
      if (selectedExportNewcomerIds.size === 0) {
        alert('선택된 대상이 없습니다.')
        return
      }

      setIsExportLoading(true)

      // 상세 정보 업데이트 및 렌더링 대기
      const selectedIds = Array.from(selectedExportNewcomerIds)
      const detailedData = await Promise.all(
        selectedIds.map(id => getNewcomerById(id))
      )

      // 상세 정보로 상태 업데이트 (화면 렌더링용)
      setExportCandidates(prev => prev.map(p => {
        const detailed = detailedData.find(d => d.newcomerId === p.newcomerId)
        return detailed ? detailed : p
      }))

      // DOM 렌더링 대기 (2초로 증가하여 안정성 확보)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 1. 숨겨진 인쇄 영역 요소 가져오기
      const printArea = document.getElementById('print-area')
      if (!printArea) {
        alert('인쇄 영역을 찾을 수 없습니다.')
        return
      }

      // 2. html2canvas로 캡처
      const canvas = await html2canvas(printArea, {
        scale: 2, // 고해상도
        useCORS: true, // 이미지 로드 허용
        logging: false,
        backgroundColor: '#ffffff'
      })

      // 3. PDF 생성
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * pdfWidth) / canvas.width
      
      let heightLeft = imgHeight
      let position = 0

      // 첫 페이지
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      // 내용이 길면 페이지 추가
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save(`새신자_목록_${statusTab}_${new Date().toISOString().split('T')[0]}.pdf`)
      setShowExportMenu(false)
      setShowExportSettingsModal(false)
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('PDF 내보내기에 실패했습니다.')
    } finally {
      setIsExportLoading(false)
    }
  }

  // 이미지 다운로드
  const handleDownloadImage = async () => {
    try {
      if (selectedExportNewcomerIds.size === 0) {
        alert('선택된 대상이 없습니다.')
        return
      }

      setIsExportLoading(true)

      // 상세 정보 업데이트 및 렌더링 대기
      const selectedIds = Array.from(selectedExportNewcomerIds)
      const detailedData = await Promise.all(
        selectedIds.map(id => getNewcomerById(id))
      )

      // 상세 정보로 상태 업데이트 (화면 렌더링용)
      setExportCandidates(prev => prev.map(p => {
        const detailed = detailedData.find(d => d.newcomerId === p.newcomerId)
        return detailed ? detailed : p
      }))

      // DOM 렌더링 대기 (2초로 증가하여 안정성 확보)
      await new Promise(resolve => setTimeout(resolve, 2000))

      const printArea = document.getElementById('print-area')
      if (!printArea) {
        alert('인쇄 영역을 찾을 수 없습니다.')
        return
      }

      const canvas = await html2canvas(printArea, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })

      const link = document.createElement('a')
      link.download = `새신자_목록_${statusTab}_${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      setShowExportMenu(false)
      setShowExportSettingsModal(false)
    } catch (error) {
      console.error('Image export failed:', error)
      alert('이미지 내보내기에 실패했습니다.')
    } finally {
      setIsExportLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('클립보드에 복사되었습니다.')
  }

  // MD 관련 함수들
  const handleCreateMd = () => {
    setEditingMd(null)
    setMdFormData({
      charge: '',
      gender: '남성',
      name: '',
      phone: '',
      ageGroup: '',
      memberId: 0,
    })
    setShowMdModal(true)
  }

  const handleEditMd = (md: MdAssignment) => {
    setEditingMd(md)
    setMdFormData({
      charge: md.charge,
      gender: md.gender,
      name: md.name,
      phone: md.phone,
      ageGroup: md.ageGroup,
      memberId: md.memberId,
    })
    setShowMdModal(true)
  }

  const handleDeleteMd = async (id: number) => {
    if (confirm('MD 배치를 삭제하시겠습니까?')) {
      try {
        await deleteMdAssignment(id)
        await loadMds()
      } catch (error) {
        console.error('MD 삭제 실패:', error)
        alert('삭제 중 오류가 발생했습니다.')
      }
    }
  }

  const handleSaveMd = async () => {
    if (!mdFormData.memberId || !mdFormData.charge) {
      alert('팀원 선택과 담당(역할)을 모두 입력해주세요.')
      return
    }

    try {
      const payload: CreateMdAssignmentRequest = {
        memberId: mdFormData.memberId,
        charge: mdFormData.charge,
        ageGroup: mdFormData.ageGroup
      }

      if (editingMd) {
        await updateMdAssignment(editingMd.id, payload)
      } else {
        await createMdAssignment(payload)
      }
      await loadMds()
      setShowMdModal(false)
    } catch (error) {
      console.error('MD 저장 실패:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  const handleMdMemberSelect = (member: Member) => {
    setMdFormData({
      ...mdFormData,
      name: member.name,
      phone: member.phone,
      memberId: member.memberId,
      gender: member.gender === 'MALE' ? '남성' : '여성',
    })
  }

  const tabs = [
    { id: 'list', label: '새신자 목록' },
    { id: 'messages', label: '자주 사용하는 문자 양식' },
    { id: 'rnr', label: 'MD 배치' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              ← 
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl">
                🌸
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">새신자 관리</p>
                <p className="text-xs text-slate-500">새신자 등록 및 관리</p>
              </div>
            </div>
          </div>

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
                {/* 검색 및 상태 탭 */}
                <div className="space-y-3">
                  {/* 검색 바 및 엑셀 다운로드 */}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative w-full sm:flex-1 flex gap-2">
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="전체">전체 연도</option>
                        {availableYears.map((year) => (
                          <option key={year} value={year}>
                            {year}년
                          </option>
                        ))}
                      </select>
                      <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="이름, MD명, 연락처, 거주지로 검색..."
                          className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>

                    <div className="flex w-full gap-2 sm:w-auto">
            <div className="relative flex-1 sm:flex-none" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
              >
                <span>📤</span>
                <span className="whitespace-nowrap">내보내기</span>
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 top-full z-10 mt-1 w-full sm:w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                  <button
                    onClick={() => {
                      setExportFormat('excel')
                      setShowExportSettingsModal(true)
                      setShowExportMenu(false)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <span>📊</span> 엑셀 (ZIP)
                  </button>
                  <button
                    onClick={() => {
                      setExportFormat('pdf')
                      setShowExportSettingsModal(true)
                      setShowExportMenu(false)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <span>📄</span> PDF 저장
                  </button>
                  <button
                    onClick={() => {
                      setExportFormat('image')
                      setShowExportSettingsModal(true)
                      setShowExportMenu(false)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <span>🖼️</span> 이미지 저장
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowExcelUploadModal(true)}
              className="flex-1 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto sm:flex-none"
            >
              📂 엑셀 등록
            </button>

            <button
              type="button"
              onClick={handleCreate}
                        className="flex-1 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto sm:flex-none"
                      >
                        + 새신자 등록
                      </button>
                    </div>
                  </div>
                  {/* 상태 탭 */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {(['전체', '관리중', '보류', '중단', '정착완료'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setStatusTab(tab)}
                          className={`flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition ${
                            statusTab === tab
                              ? tab === '전체'
                                ? 'bg-slate-600 text-white'
                                : tab === '관리중'
                                ? 'bg-blue-600 text-white'
                                : tab === '보류'
                                ? 'bg-yellow-600 text-white'
                                : tab === '중단'
                                ? 'bg-red-600 text-white'
                                : 'bg-green-600 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 새신자 테이블 */}
{/* 새신자 리스트 - 모바일 (카드 뷰) */}
                <div className="md:hidden space-y-4">
                  {newcomers.map((newcomer) => (
                    <div 
                      key={newcomer.newcomerId} 
                      onClick={() => handleRowClick(newcomer)}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-slate-200 flex items-center justify-center cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setImageViewName(newcomer.name)
                              if (newcomer.profileImageUrl) {
                                setImageViewUrl(getFileUrl(newcomer.profileImageUrl))
                                  } else {
                                    setImageViewUrl('DEFAULT')
                                  }
                                }}
                              >
                                {newcomer.profileImageUrl ? (
                                  <img src={getFileUrl(newcomer.profileImageUrl)} alt={newcomer.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 font-bold">
                                {newcomer.name?.[0] || '🙂'}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-slate-900">{newcomer.name}</span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(newcomer.status)}`}>
                                {NewcomerStatusMap[newcomer.status] || newcomer.status}
                              </span>
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500">
                              {newcomer.gender === 'MALE' ? '남' : '여'}{newcomer.birthDate ? ` · ${newcomer.birthDate}` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const rect = e.currentTarget.getBoundingClientRect()
                              setListMenuPos({ top: rect.top, right: rect.right, bottom: rect.bottom })
                              setOpenMenuUp(rect.bottom + 120 > window.innerHeight)
                              setOpenMenuId(openMenuId === String(newcomer.newcomerId) ? null : String(newcomer.newcomerId))
                            }}
                            className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          >
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-sm border-t border-slate-100 pt-3">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500 mb-0.5">담당 MD</span>
                          <span className="font-medium text-slate-700">{newcomer.managerName}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500 mb-0.5">등록여부</span>
                          <span className={`font-medium ${newcomer.isChurchRegistered ? 'text-blue-600' : 'text-slate-400'}`}>
                            {newcomer.isChurchRegistered ? '등록' : '미등록'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500 mb-0.5">연락처</span>
                          <div className="flex items-center gap-2">
                             <a href={`tel:${newcomer.phone}`} onClick={(e) => e.stopPropagation()} className="text-slate-700 hover:text-blue-600 underline decoration-slate-300 underline-offset-2">
                               {formatPhoneNumber(newcomer.phone)}
                             </a>
                             {newcomer.phone && (
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation()
                                   copyToClipboard(newcomer.phone)
                                 }} 
                                 className="text-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 hover:bg-slate-50"
                               >
                                 복사
                               </button>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {newcomers.length === 0 && (
                     <div className="py-10 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                       데이터가 없습니다.
                     </div>
                  )}
                </div>

                {/* 새신자 리스트 - 데스크탑 (테이블 뷰) */}
                <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">담당 MD</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">사진</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">새신자명</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">성별</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">생년월일</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">연락처</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">상태</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">등록여부</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">작업</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {newcomers.map((newcomer) => (
                          <tr
                            key={newcomer.newcomerId}
                            onClick={() => handleRowClick(newcomer)}
                            className="cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm text-slate-600">{newcomer.managerName}</td>
                            <td className="px-4 py-3">
                              <div 
                                className="h-10 w-10 overflow-hidden rounded-full bg-slate-200 flex items-center justify-center cursor-pointer hover:opacity-80"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setImageViewName(newcomer.name)
                                  if (newcomer.profileImageUrl) {
                                    setImageViewUrl(getFileUrl(newcomer.profileImageUrl))
                                  } else {
                                    setImageViewUrl('DEFAULT')
                                  }
                                }}
                              >
                                {newcomer.profileImageUrl ? (
                                  <img src={getFileUrl(newcomer.profileImageUrl)} alt={newcomer.name} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 font-bold">
                                    {newcomer.name?.[0] || '🙂'}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900">{newcomer.name}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{newcomer.gender === 'MALE' ? '남' : '여'}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{newcomer.birthDate}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{formatPhoneNumber(newcomer.phone)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(newcomer.status)}`}>
                                {NewcomerStatusMap[newcomer.status] || newcomer.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                                newcomer.isChurchRegistered ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {newcomer.isChurchRegistered ? '등록' : '미등록'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="relative inline-block">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  setListMenuPos({ top: rect.top, right: rect.right, bottom: rect.bottom })
                                  setOpenMenuUp(rect.bottom + 120 > window.innerHeight)
                                  setOpenMenuId(openMenuId === String(newcomer.newcomerId) ? null : String(newcomer.newcomerId))
                                  }}
                                  className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {/* 최소 10행 높이 유지를 위한 빈 행 */}
                        {newcomers.length < itemsPerPage &&
                          Array.from({ length: itemsPerPage - newcomers.length }).map((_, index) => (
                            <tr key={`empty-${index}`} className="h-[52px]">
                              <td colSpan={9} className="px-4 py-3"></td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 페이징 */}
                {totalPages > 1 && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <div className="text-sm text-slate-600 text-center sm:text-left">
                      전체 {totalElements}명 중 {(totalElements === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1)}-{Math.min(currentPage * itemsPerPage, totalElements)}명 표시
                    </div>
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                                  currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return <span key={page} className="px-2 text-slate-400">...</span>
                          }
                          return null
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                )}
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
                {/* MD 배치 버튼 */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCreateMd}
                    className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    + MD 배치
                  </button>
                </div>
                {/* MD 리스트 - 모바일 (카드 뷰) */}
                <div className="md:hidden space-y-3">
                  {mdList.map((md) => (
                    <div key={md.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="inline-block px-2 py-1 rounded-md bg-slate-100 text-xs font-semibold text-slate-600 mb-1">
                            {md.charge}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-slate-900">{md.name}</span>
                            <span className="text-xs text-slate-500">{md.gender}</span>
                          </div>
                        </div>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const rect = e.currentTarget.getBoundingClientRect()
                              setMdMenuPos({ top: rect.top, right: rect.right, bottom: rect.bottom })
                              setOpenMdMenuUp(rect.bottom + 100 > window.innerHeight)
                              setOpenMdMenuId(openMdMenuId === md.id ? null : md.id)
                            }}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm border-t border-slate-100 pt-3">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500 mb-0.5">담당 나이대</span>
                          <span className="text-slate-700">{md.ageGroup}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500 mb-0.5">연락처</span>
                          <div className="flex items-center gap-2">
                            <a href={`tel:${md.phone}`} className="text-slate-700 hover:text-blue-600 underline decoration-slate-300 underline-offset-2">
                              {formatPhoneNumber(md.phone)}
                            </a>
                            <button 
                              onClick={() => copyToClipboard(md.phone)} 
                              className="text-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 hover:bg-slate-50"
                            >
                              복사
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {mdList.length === 0 && (
                     <div className="py-10 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                       MD 배치가 없습니다.
                     </div>
                  )}
                </div>

                {/* MD 리스트 - 데스크탑 (테이블 뷰) */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-xs whitespace-nowrap">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">구 분 (담당)</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">성별</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">이름</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">담당 나이대</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">연락처</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-700">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {mdList.map((md) => (
                        <tr key={md.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-900">{md.charge}</td>
                          <td className="px-4 py-3 text-slate-900">{md.gender}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{md.name}</td>
                          <td className="px-4 py-3 text-slate-600">{md.ageGroup}</td>
                          <td className="px-4 py-3 text-slate-600">{formatPhoneNumber(md.phone)}</td>
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="relative inline-block">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  setMdMenuPos({ top: rect.top, right: rect.right, bottom: rect.bottom })
                                  setOpenMdMenuUp(rect.bottom + 100 > window.innerHeight)
                                  setOpenMdMenuId(openMdMenuId === md.id ? null : md.id)
                                }}
                                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
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



          </div>
        </div>

        {/* 상세 정보 모달 (개선된 디자인) */}
        {isDetailModalOpen && selectedNewcomer && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={handleCloseDetailModal}
          >
            <div 
              className="w-full max-w-7xl h-[85vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 flex-shrink-0">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>👤</span> 새신자 상세 정보
                </h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenDetailMenu(!openDetailMenu)
                      }}
                      className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    {openDetailMenu && (
                      <div className="absolute right-0 top-10 z-10 w-32 rounded-lg border border-slate-200 bg-white shadow-lg">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(selectedNewcomer)
                            setOpenDetailMenu(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenCellAssignModal(selectedNewcomer.newcomerId)
                            setOpenDetailMenu(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          순 배정
                        </button>
                        {!selectedNewcomer.isMemberRegistered && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleGraduate(selectedNewcomer.newcomerId)
                              setOpenDetailMenu(false)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50"
                          >
                            청년부 등록
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(selectedNewcomer.newcomerId, e)
                            setOpenDetailMenu(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseDetailModal}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 모달 내용 (2단 레이아웃) */}
              <div className="flex-1 flex flex-col md:flex-row bg-slate-50/50 overflow-y-auto md:overflow-hidden">
                
                {/* 왼쪽: 프로필 및 기본 정보 */}
                <div className="w-full md:w-80 px-4 pt-4 pb-2 md:p-6 border-b md:border-b-0 md:border-r border-slate-200 bg-white flex-shrink-0 md:overflow-y-auto">
                  <div className="flex flex-row md:flex-col items-center md:text-center gap-4 md:gap-0 mb-0 md:mb-8">
                    {/* 사진 */}
                    <div 
                      className="relative h-16 w-16 md:h-40 md:w-40 flex-shrink-0 overflow-hidden rounded-full border-2 md:border-4 border-slate-50 shadow-md cursor-pointer hover:opacity-90 transition-opacity md:mb-4 group"
                      onClick={() => {
                        setImageViewName(selectedNewcomer.name)
                        if (selectedNewcomer.profileImageUrl) {
                          setImageViewUrl(getFileUrl(selectedNewcomer.profileImageUrl))
                        } else {
                          setImageViewUrl('DEFAULT')
                        }
                      }}
                    >
                      {selectedNewcomer.profileImageUrl ? (
                        <img src={getFileUrl(selectedNewcomer.profileImageUrl)} alt={selectedNewcomer.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 font-bold text-2xl md:text-5xl">
                          {selectedNewcomer.name?.[0] || '🙂'}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-medium hidden md:inline">크게 보기</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 md:flex-none text-left md:text-center">
                      {/* 이름 */}
                      <h3 className="text-lg md:text-2xl font-bold text-slate-900 mb-1 md:mb-3">{selectedNewcomer.name}</h3>
                      
                      {/* 상태 뱃지 */}
                      <div className="flex flex-wrap justify-start md:justify-center gap-2 mb-0 md:mb-2">
                        <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm ${getStatusColor(selectedNewcomer.status)}`}>
                          {NewcomerStatusMap[selectedNewcomer.status] || selectedNewcomer.status}
                        </span>
                        <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm ${
                        selectedNewcomer.isChurchRegistered ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {selectedNewcomer.isChurchRegistered ? '등록' : '미등록'}
                      </span>
                      <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm ${
                        selectedNewcomer.isMemberRegistered ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {selectedNewcomer.isMemberRegistered ? '청년부등록' : '청년부미등록'}
                      </span>
                    </div>

                    {/* 모바일용 추가 정보 (작게 표시) */}
                    <div className="mt-2 space-y-1 md:hidden">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      <a href={`tel:${selectedNewcomer.phone}`} className="hover:text-blue-600 hover:underline">{selectedNewcomer.phone}</a>
                      <span className="text-slate-300 mx-1">|</span>
                      <button onClick={() => copyToClipboard(selectedNewcomer.phone)} className="text-slate-400 hover:text-blue-600 text-[10px]" title="복사">복사</button>
                    </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      <span>{selectedNewcomer.gender === 'MALE' ? '남' : '여'} · {selectedNewcomer.birthDate}</span>
                    </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="truncate max-w-[180px]">{selectedNewcomer.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                  {/* 기본 정보 리스트 (PC에서만 보임) */}
                  <div className="space-y-4 hidden md:block">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-slate-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">연락처</p>
                        <p className="text-sm font-semibold text-slate-900">{formatPhoneNumber(selectedNewcomer.phone)}</p>
                      </div>
                      <button onClick={() => copyToClipboard(selectedNewcomer.phone)} className="text-slate-400 hover:text-blue-600" title="복사">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-slate-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">성별 / 생년월일</p>
                        <p className="text-sm font-semibold text-slate-900">{selectedNewcomer.gender === 'MALE' ? '남' : '여'} · {selectedNewcomer.birthDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-slate-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">거주지</p>
                        <p className="text-sm font-semibold text-slate-900">{selectedNewcomer.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 오른쪽: 상세 정보 및 히스토리 */}
                <div className="flex-1 px-4 py-3 md:p-6 space-y-4 md:space-y-6 bg-white md:overflow-y-auto flex flex-col md:h-full min-h-0 pb-10">
                  
                  {/* 사역 정보 카드 (모바일: 최하단, PC: 최상단) */}
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <div className="bg-slate-50 md:bg-white p-2 md:p-4 rounded-lg md:rounded-xl border border-slate-100 md:border-slate-200 text-center md:text-left">
                      <p className="text-[10px] md:text-xs text-slate-500 mb-0.5 md:mb-1">담당 MD</p>
                      <p className="text-sm md:text-base font-bold text-slate-900 truncate">{selectedNewcomer.managerName}</p>
                    </div>
                    <div className="bg-slate-50 md:bg-white p-2 md:p-4 rounded-lg md:rounded-xl border border-slate-100 md:border-slate-200 text-center md:text-left">
                      <p className="text-[10px] md:text-xs text-slate-500 mb-0.5 md:mb-1">등록일자</p>
                      <p className="text-sm md:text-base font-bold text-slate-900 truncate">{selectedNewcomer.registrationDate}</p>
                    </div>
                    <div className="bg-slate-50 md:bg-white p-2 md:p-4 rounded-lg md:rounded-xl border border-slate-100 md:border-slate-200 text-center md:text-left">
                      <p className="text-[10px] md:text-xs text-slate-500 mb-0.5 md:mb-1">등반예정순</p>
                      <p className="text-sm md:text-base font-bold text-blue-600 truncate">{selectedNewcomer.cellName || selectedNewcomer.assignedSoon}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* 관리 현황 (Editable) */}
                    <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>📊</span> 관리 현황
                        </h4>
                      </div>
                      <div className="p-5 grid grid-cols-1 gap-6 relative">
                        <div className="space-y-2 bg-white relative">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
                            <span className="text-xs font-semibold text-slate-700">처음 현황</span>
                          </div>
                          <textarea
                            value={selectedNewcomer.firstStatus}
                            onChange={(e) => {
                              const updated = { ...selectedNewcomer, firstStatus: e.target.value }
                              setSelectedNewcomer(updated)
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[80px] resize-none"
                            placeholder="처음 현황 입력"
                          />
                        </div>

                        <div className="space-y-2 bg-white relative">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</span>
                            <span className="text-xs font-semibold text-slate-700">중간 현황</span>
                          </div>
                          <textarea
                            value={selectedNewcomer.middleStatus}
                            onChange={(e) => {
                              const updated = { ...selectedNewcomer, middleStatus: e.target.value }
                              setSelectedNewcomer(updated)
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[80px] resize-none"
                            placeholder="중간 현황 입력"
                          />
                        </div>

                        <div className="space-y-2 bg-white relative">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">3</span>
                            <span className="text-xs font-semibold text-slate-700">최근 현황</span>
                          </div>
                          <textarea
                            value={selectedNewcomer.recentStatus}
                            onChange={(e) => {
                              const updated = { ...selectedNewcomer, recentStatus: e.target.value }
                              setSelectedNewcomer(updated)
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[80px] resize-none"
                            placeholder="최근 현황 입력"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 순배치 특이사항 (Editable) */}
                    <div className="xl:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>📝</span> 순배치 특이사항
                        </h4>
                      </div>
                      <div className="p-5">
                        <textarea
                          value={selectedNewcomer.assignmentNote || ''}
                          onChange={(e) => {
                            const updated = { ...selectedNewcomer, assignmentNote: e.target.value }
                            setSelectedNewcomer(updated)
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-yellow-50/50 px-4 py-3 text-sm focus:bg-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all min-h-[200px] xl:min-h-[400px] resize-none"
                          placeholder="순배치 시 참고할 특이사항을 입력하세요..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* 모바일 하단 공간 확보용 */}
                  <div className="h-4 md:hidden"></div>
                  
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className="flex items-center justify-end border-t border-slate-200 bg-white px-6 py-4 flex-shrink-0">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseDetailModal}
                    className="rounded-lg px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    닫기
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={async () => {
                      if (!selectedNewcomer) return
                      setIsSaving(true)
                      try {
                        await updateNewcomer(selectedNewcomer.newcomerId, {
                          firstStatus: selectedNewcomer.firstStatus,
                          middleStatus: selectedNewcomer.middleStatus,
                          recentStatus: selectedNewcomer.recentStatus,
                          assignmentNote: selectedNewcomer.assignmentNote
                        })
                        
                        // 목록 업데이트 (저장 성공 시에만)
                        setNewcomers(newcomers.map(n => n.newcomerId === selectedNewcomer.newcomerId ? selectedNewcomer : n))
                        setOriginalNewcomer(selectedNewcomer)
                        
                        // 성공 피드백
                        setTimeout(() => setIsSaving(false), 500)
                      } catch (error) {
                        console.error('Update failed:', error)
                        alert('저장에 실패했습니다.')
                        setIsSaving(false)
                      }
                    }}
                    className={`rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors shadow-sm flex items-center gap-2 ${
                      isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        저장 중...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        저장
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 등록/수정 모달 (간소화됨) */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {editingNewcomer ? '새신자 수정' : '새신자 등록'}
              </h3>
              <div className="space-y-4">
                {/* 사진 업로드 */}
                <div className="flex flex-col items-center justify-center mb-6">
                  <div 
                    className="h-24 w-24 mb-3 overflow-hidden rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center relative group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-white font-medium">사진 변경</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <p className="text-xs text-slate-500">프로필 사진을 등록하세요</p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">이름 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="이름"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">성별</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="MALE">남성</option>
                    <option value="FEMALE">여성</option>
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
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">주소</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="시/구/동 까지만 입력"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">연락처</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      let formatted = value
                      if (value.length > 3 && value.length <= 7) {
                        formatted = `${value.slice(0, 3)}-${value.slice(3)}`
                      } else if (value.length > 7) {
                        formatted = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`
                      }
                      setFormData({ ...formData, phone: formatted })
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="010-0000-0000"
                    maxLength={13}
                  />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">담당 MD 이름</label>
                    <select
                      value={formData.mdName || ''}
                      onChange={(e) => setFormData({ ...formData, mdName: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">담당 MD 선택</option>
                      {mdList.map((md) => (
                        <option key={md.id} value={md.name}>
                          {md.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">등록일자</label>
                    <input
                      type="date"
                      value={formData.registrationDate}
                      onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">교회 등록 여부</label>
                    <select
                      value={formData.isChurchRegistered ? 'Y' : 'N'}
                      onChange={(e) => setFormData({ ...formData, isChurchRegistered: e.target.value === 'Y' })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="Y">등록</option>
                      <option value="N">미등록</option>
                    </select>
                  </div>
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

        {/* 내보내기 설정 모달 */}
        {showExportSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                내보내기 설정 ({exportFormat === 'excel' ? '엑셀' : exportFormat === 'pdf' ? 'PDF' : '이미지'})
              </h3>
              
              {/* 탭 버튼 */}
              <div className="mb-4 flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setExportModalTab('people')}
                  className={`flex-1 px-4 py-2 text-sm font-semibold transition ${
                    exportModalTab === 'people'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  대상 선택 ({selectedExportNewcomerIds.size}/{exportCandidates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setExportModalTab('fields')}
                  className={`flex-1 px-4 py-2 text-sm font-semibold transition ${
                    exportModalTab === 'fields'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  항목 선택
                </button>
              </div>

              {exportModalTab === 'people' ? (
                <div className="mb-6">
                  <div className="mb-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedExportNewcomerIds(new Set(exportCandidates.map(n => n.newcomerId)))}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      전체 선택
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedExportNewcomerIds(new Set())}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      전체 해제
                    </button>
                  </div>
                  
                  {isExportLoading ? (
                     <div className="flex items-center justify-center py-10">
                       <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></div>
                     </div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2">
                      {exportCandidates.map(newcomer => (
                        <label key={newcomer.newcomerId} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedExportNewcomerIds.has(newcomer.newcomerId)}
                            onChange={(e) => {
                              const newSet = new Set(selectedExportNewcomerIds)
                              if (e.target.checked) newSet.add(newcomer.newcomerId)
                              else newSet.delete(newcomer.newcomerId)
                              setSelectedExportNewcomerIds(newSet)
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-slate-900">{newcomer.name}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${getStatusColor(newcomer.status)}`}>
                                {NewcomerStatusMap[newcomer.status]}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {newcomer.gender === 'MALE' ? '남' : '여'} · {newcomer.birthDate} · {newcomer.phone}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="mb-2 text-sm font-semibold text-slate-700">포함할 항목 선택</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedExportFields(exportFields.map(f => f.id))}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        전체 선택
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedExportFields([])}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        전체 해제
                      </button>
                    </div>
                  </div>

                  <div className="mb-6 grid max-h-[300px] grid-cols-2 gap-3 overflow-y-auto pr-2">
                    {exportFields.map((field) => (
                      <label key={field.id} className="flex items-center gap-2 cursor-pointer rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selectedExportFields.includes(field.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedExportFields([...selectedExportFields, field.id])
                            } else {
                              setSelectedExportFields(selectedExportFields.filter((id) => id !== field.id))
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowExportSettingsModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={isExportLoading}
                  onClick={() => {
                    if (exportFormat === 'excel') handleDownloadExcel()
                    else if (exportFormat === 'pdf') handleDownloadPdf()
                    else if (exportFormat === 'image') handleDownloadImage()
                  }}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                    isExportLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isExportLoading ? '로딩 중...' : '내보내기'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MD 배치 모달 (수정됨) */}
        {showMdModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {editingMd ? 'MD 배치 수정' : 'MD 배치 추가'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">새신자 팀원 선택</label>
                  <select
                    value={mdFormData.memberId || ''}
                    onChange={(e) => {
                      const selectedMember = teamMembers.find((m) => m.memberId === Number(e.target.value))
                      if (selectedMember) {
                        handleMdMemberSelect(selectedMember)
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">팀원을 선택하세요</option>
                    {teamMembers.map((member) => (
                      <option key={member.memberId} value={member.memberId}>
                        {member.name} ({member.phone})
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 선택된 팀원 정보 표시 (읽기 전용) */}
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">이름</label>
                    <input
                      type="text"
                      value={mdFormData.name}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                    />
                   </div>
                   <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">연락처</label>
                    <input
                      type="text"
                      value={mdFormData.phone}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                    />
                   </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">담당 (역할)</label>
                  <input
                    type="text"
                    value={mdFormData.charge}
                    onChange={(e) => setMdFormData({ ...mdFormData, charge: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="예: 11시 예배, 9시 예배, 팀장 등"
                  />
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">담당 나이대</label>
                  <input
                    type="text"
                    value={mdFormData.ageGroup}
                    onChange={(e) => setMdFormData({ ...mdFormData, ageGroup: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="예: 20대, 24또래 등"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMdModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveMd}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 상태 변경 모달 */}
        {showStatusModal && statusChangeTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">상태 변경</h3>
              <div className="mb-4">
                <p className="text-sm text-slate-600 mb-2">
                  <span className="font-semibold">{statusChangeTarget.name}</span>님의 상태를 변경하시겠습니까?
                </p>
                <p className="text-xs text-slate-500">
                  현재 상태: <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(statusChangeTarget.status)}`}>{NewcomerStatusMap[statusChangeTarget.status]}</span>
                </p>
              </div>
              <div className="space-y-2 mb-6">
                {[
                  { value: 'MAIN_WORSHIP', label: '관리중' },
                  { value: 'HOLD', label: '보류' },
                  { value: 'STOPPED', label: '중단' },
                  { value: 'SETTLED', label: '정착완료' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    disabled={NewcomerStatusMap[statusChangeTarget.status] === label}
                    onClick={() => handleStatusChange(statusChangeTarget.newcomerId, value as NewcomerStatus)}
                    className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition ${
                      NewcomerStatusMap[statusChangeTarget.status] === label
                        ? getStatusColor(value) + ' ring-2 ring-offset-2 ring-blue-500 cursor-not-allowed opacity-80'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusModal(false)
                    setStatusChangeTarget(null)
                  }}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 엑셀 업로드 안내 모달 */}
        {showExcelUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                엑셀 일괄 등록
              </h3>
              
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                  <h4 className="mb-2 font-bold">📢 엑셀 파일 작성 가이드</h4>
                  <p className="mb-3 text-xs">
                    엑셀 파일의 첫 번째 줄(헤더)은 아래 형식과 일치해야 합니다.
                    <br />
                    (좌우로 스크롤하여 전체 예시를 확인하세요)
                  </p>
                  
                  {/* 시각적 예시 테이블 */}
                  <div className="mb-3 rounded-lg border border-blue-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-blue-100 text-blue-900 font-semibold">
                          <tr>
                            <th className="px-2 py-1.5 border-b border-blue-200 whitespace-nowrap">담당 MD명</th>
                            <th className="px-2 py-1.5 border-b border-blue-200 whitespace-nowrap">작성일자</th>
                            <th className="px-2 py-1.5 border-b border-blue-200 whitespace-nowrap">새신자명</th>
                            <th className="px-2 py-1.5 border-b border-blue-200 whitespace-nowrap">등록<br/>여부</th>
                            <th className="px-2 py-1.5 border-b border-blue-200 whitespace-nowrap">성별</th>
                            <th className="px-2 py-1.5 border-b border-blue-200 whitespace-nowrap">생년월일</th>
                            <th className="px-2 py-1.5 border-b border-blue-200 whitespace-nowrap">연락처</th>
                            <th className="px-2 py-1.5 border-b border-blue-200 whitespace-nowrap">배치순</th>
                            <th className="px-2 py-1.5 border-b border-blue-200 whitespace-nowrap">거주지</th>
                            <th className="px-2 py-1.5 border-b border-blue-200 whitespace-nowrap">처음에 알게 된 현황</th>
                            <th className="px-2 py-1.5 border-b border-blue-200 whitespace-nowrap">중간 현황</th>
                            <th className="px-2 py-1.5 border-b border-blue-200 whitespace-nowrap">최근 현황</th>
                            <th className="px-2 py-1.5 border-b border-blue-200 whitespace-nowrap">순배치참고</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-100 text-slate-600">
                          <tr className="bg-white">
                            <td className="px-2 py-1.5 whitespace-nowrap">조형진</td>
                            <td className="px-2 py-1.5 whitespace-nowrap">241225</td>
                            <td className="px-2 py-1.5 whitespace-nowrap">홍길동</td>
                            <td className="px-2 py-1.5 whitespace-nowrap">O</td>
                            <td className="px-2 py-1.5 whitespace-nowrap">남성</td>
                            <td className="px-2 py-1.5 whitespace-nowrap">98.03.14</td>
                            <td className="px-2 py-1.5 whitespace-nowrap">010-1234...</td>
                            <td className="px-2 py-1.5 whitespace-nowrap">믿음셀</td>
                            <td className="px-2 py-1.5 whitespace-nowrap">서울 강남구...</td>
                            <td className="px-2 py-1.5 whitespace-nowrap">친구 초청...</td>
                            <td className="px-2 py-1.5 whitespace-nowrap">순모임 참석...</td>
                            <td className="px-2 py-1.5 whitespace-nowrap">정착 중...</td>
                            <td className="px-2 py-1.5 whitespace-nowrap">활발함...</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-blue-600/80">
                      * 등록여부는 O/X로 입력 (O: 등록, X: 미등록)
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="text-xs font-bold underline hover:text-blue-600"
                    >
                      📥 등록 양식 다운로드
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    파일 선택
                  </label>
                  <input
                    ref={excelFileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleExcelUpload}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-slate-500">
                    .xlsx 또는 .xls 파일만 업로드 가능합니다.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowExcelUploadModal(false)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 엑셀 미리보기 및 선택 모달 */}
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-6xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-900">
                  엑셀 데이터 미리보기 및 선택
                </h2>
                <button
                  onClick={() => {
                    setShowPreviewModal(false)
                    setExcelPreviewData([])
                    setSelectedPreviewRows(new Set())
                  }}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="mb-4 flex justify-between items-center">
                  <div className="text-sm text-slate-600">
                    총 <span className="font-bold text-blue-600">{excelPreviewData.length}</span>건 중 
                    <span className="font-bold text-blue-600 ml-1">{selectedPreviewRows.size}</span>건 선택됨
                  </div>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={toggleAllPreviewRows}
                      className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-50"
                    >
                      {selectedPreviewRows.size === excelPreviewData.length ? '전체 해제' : '전체 선택'}
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0">
                        <tr>
                          <th className="px-4 py-3 border-b whitespace-nowrap w-10">
                            <input 
                              type="checkbox" 
                              checked={selectedPreviewRows.size === excelPreviewData.length && excelPreviewData.length > 0}
                              onChange={toggleAllPreviewRows}
                              className="rounded border-slate-300"
                            />
                          </th>
                          <th className="px-4 py-3 border-b whitespace-nowrap">이름</th>
                          <th className="px-4 py-3 border-b whitespace-nowrap">담당 MD</th>
                          <th className="px-4 py-3 border-b whitespace-nowrap">성별</th>
                          <th className="px-4 py-3 border-b whitespace-nowrap">생년월일</th>
                          <th className="px-4 py-3 border-b whitespace-nowrap">연락처</th>
                          <th className="px-4 py-3 border-b whitespace-nowrap">거주지</th>
                          <th className="px-4 py-3 border-b whitespace-nowrap">등록일</th>
                          <th className="px-4 py-3 border-b whitespace-nowrap">등록여부</th>
                          <th className="px-4 py-3 border-b whitespace-nowrap">초기상태</th>
                          <th className="px-4 py-3 border-b whitespace-nowrap">중간상태</th>
                          <th className="px-4 py-3 border-b whitespace-nowrap">최근상태</th>
                          <th className="px-4 py-3 border-b whitespace-nowrap">비고</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {excelPreviewData.map((data, idx) => (
                          <tr 
                            key={idx} 
                            className={`hover:bg-blue-50 cursor-pointer ${selectedPreviewRows.has(idx) ? 'bg-blue-50/50' : ''} ${data.isDuplicate ? 'bg-red-50/30' : ''}`}
                            onClick={() => togglePreviewRowSelection(idx)}
                          >
                            <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox"
                                checked={selectedPreviewRows.has(idx)}
                                onChange={() => togglePreviewRowSelection(idx)}
                                className="rounded border-slate-300"
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                              {data.name}
                              {data.isDuplicate && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                  중복
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600">{data.mdName}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                              {data.gender === 'MALE' ? '남성' : '여성'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600">{data.birthDate}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatPhoneNumber(data.phone)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600 truncate max-w-[150px]" title={data.address}>
                              {data.address}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600">{data.registrationDate}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${data.isMemberRegistered ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                {data.isMemberRegistered ? '등록' : '미등록'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600 truncate max-w-[150px]" title={data.firstStatus}>{data.firstStatus}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600 truncate max-w-[150px]" title={data.middleStatus}>{data.middleStatus}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600 truncate max-w-[150px]" title={data.recentStatus}>{data.recentStatus}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600 truncate max-w-[150px]" title={data.assignmentNote}>{data.assignmentNote}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewModal(false)
                    setExcelPreviewData([])
                    setSelectedPreviewRows(new Set())
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveSelectedExcelData}
                  disabled={selectedPreviewRows.size === 0}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  선택한 {selectedPreviewRows.size}명 저장하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 이미지 뷰어 모달 */}
        {imageViewUrl && (
          <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setImageViewUrl(null)}
          >
             <div className="relative max-w-4xl max-h-[90vh]">
               {imageViewUrl === 'DEFAULT' ? (
                 <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-slate-100 text-6xl font-bold text-slate-400 shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
                   {imageViewName?.[0] || '🙂'}
                 </div>
               ) : (
                 <img 
                   src={imageViewUrl} 
                   alt="Enlarged" 
                   className="max-w-full max-h-[90vh] object-contain rounded-lg"
                   onClick={(e) => e.stopPropagation()}
                 />
               )}
               <button
                 type="button"
                 onClick={() => setImageViewUrl(null)}
                 className="absolute top-2 right-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
               >
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
          </div>
        )}

        {/* 순 배정 모달 */}
        {showCellAssignModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-bold text-slate-900">순 배정</h3>
              <p className="mb-4 text-sm text-slate-600">
                배정할 순을 선택해주세요.
              </p>
              
              <div className="mb-6">
                <select
                  value={selectedCellId || ''}
                  onChange={(e) => setSelectedCellId(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">순 선택</option>
                  {cellList.map((cell) => (
                    <option key={cell.cellId} value={cell.cellId}>
                      {cell.cellName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCellAssignModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleAssignCell}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {openMenuId && listMenuPos && (
          <div
            className="fixed z-[100] w-40 rounded-lg border border-slate-200 bg-white shadow-xl"
            style={{
              left: listMenuPos.right,
              top: openMenuUp ? listMenuPos.top + 10 : listMenuPos.bottom - 10,
              transform: `translateX(-100%) ${openMenuUp ? 'translateY(-100%)' : ''}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                const target = newcomers.find((n) => n.newcomerId === Number(openMenuId))
                if (target) handleEditClick(target)
                setOpenMenuId(null)
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
            >
              수정
            </button>
            <div className="border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  const target = newcomers.find((n) => n.newcomerId === Number(openMenuId))
                  if (target) handleOpenStatusModal(target)
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                상태 변경
              </button>
            </div>
            {(() => {
              const target = newcomers.find((n) => n.newcomerId === Number(openMenuId))
              if (target && !target.isMemberRegistered) {
                return (
                  <div className="border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        if (openMenuId) handleGraduate(Number(openMenuId))
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50"
                    >
                      청년부 등록
                    </button>
                  </div>
                )
              }
              return null
            })()}
            <div className="border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  if (openMenuId) handleDelete(Number(openMenuId))
                  setOpenMenuId(null)
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
              >
                삭제
              </button>
            </div>
          </div>
        )}

        {openMdMenuId && mdMenuPos && (
          <div
            className="fixed z-[100] w-32 rounded-lg border border-slate-200 bg-white shadow-xl"
            style={{
              left: mdMenuPos.right,
              top: openMdMenuUp ? mdMenuPos.top + 10 : mdMenuPos.bottom - 10,
              transform: `translateX(-100%) ${openMdMenuUp ? 'translateY(-100%)' : ''}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                const md = mdList.find((m) => m.id === Number(openMdMenuId))
                if (md) handleEditMd(md)
                setOpenMdMenuId(null)
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
            >
              수정
            </button>
            <button
              type="button"
              onClick={() => {
                if (openMdMenuId) handleDeleteMd(Number(openMdMenuId))
                setOpenMdMenuId(null)
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
            >
              삭제
            </button>
          </div>
        )}

        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div id="print-area" className="w-[210mm] bg-white p-8">
            <h1 className="mb-6 text-2xl font-bold text-center">새신자 목록 ({statusTab})</h1>
            <div className="mb-4 text-right text-sm text-slate-500">
              출력일: {new Date().toLocaleDateString()}
            </div>
            
            <div className="space-y-6">
              {((showExportSettingsModal && exportCandidates.length > 0) 
                ? exportCandidates.filter(n => selectedExportNewcomerIds.has(n.newcomerId)) 
                : newcomers).map((newcomer) => (
                <div key={newcomer.newcomerId} className="break-inside-avoid rounded-xl border border-slate-300 p-5 shadow-sm">
                  <div className="flex gap-5">
                    {/* 사진 영역 */}
                    {selectedExportFields.includes('photo') && (
                      <div className="h-40 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                        {newcomer.profileImageUrl ? (
                          <img 
                            src={getFileUrl(newcomer.profileImageUrl)} 
                            alt={newcomer.name} 
                            className="h-full w-full object-cover"
                            crossOrigin="anonymous" 
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-4xl font-bold text-slate-400">
                            {newcomer.name?.[0] || '🙂'}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* 기본 정보 영역 */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-3">
                          {selectedExportFields.includes('name') && (
                            <span className="text-xl font-bold text-slate-900">{newcomer.name}</span>
                          )}
                          <span className="text-sm text-slate-500">
                            {[
                              selectedExportFields.includes('gender') && (newcomer.gender === 'MALE' ? '남' : (newcomer.gender === 'FEMALE' ? '여' : newcomer.gender)),
                              selectedExportFields.includes('birthDate') && newcomer.birthDate,
                              selectedExportFields.includes('phone') && newcomer.phone ? `(${formatPhoneNumber(newcomer.phone)})` : null
                            ].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                        {selectedExportFields.includes('status') && (
                          <span className={`text-sm font-bold ${getStatusColor(newcomer.status).replace(/bg-[^ ]+/, '').trim()}`}>
                            {NewcomerStatusMap[newcomer.status] || newcomer.status}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        {selectedExportFields.includes('address') && (
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-slate-500 min-w-[60px]">거주지:</span>
                            <span className="text-slate-900">{newcomer.address}</span>
                          </div>
                        )}
                        {selectedExportFields.includes('managerName') && (
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-slate-500 min-w-[60px]">담당MD:</span>
                            <span className="text-slate-900">{newcomer.managerName}</span>
                          </div>
                        )}
                        {selectedExportFields.includes('registrationDate') && (
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-slate-500 min-w-[60px]">등록일자:</span>
                            <span className="text-slate-900">{newcomer.registrationDate}</span>
                          </div>
                        )}
                        {selectedExportFields.includes('cellName') && (
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-slate-500 min-w-[60px]">등반예정순:</span>
                            <span className="text-slate-900">{newcomer.cellName || newcomer.assignedSoon || '-'}</span>
                          </div>
                        )}
                        {selectedExportFields.includes('isChurchRegistered') && (
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-slate-500 min-w-[60px]">교회등록여부:</span>
                            <span className="text-slate-900">{newcomer.isChurchRegistered ? '등록' : '미등록'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 상세 상태 및 비고 영역 */}
                  {(selectedExportFields.includes('firstStatus') || selectedExportFields.includes('middleStatus') || selectedExportFields.includes('recentStatus') || selectedExportFields.includes('assignmentNote')) && (
                    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                      <div className="grid grid-cols-3 gap-4">
                        {selectedExportFields.includes('firstStatus') && (
                          <div className="space-y-1">
                            <span className="block text-xs font-semibold text-slate-500">처음 현황</span>
                            <div className="rounded bg-slate-50 p-2 text-sm text-slate-700 min-h-[40px]">
                              {newcomer.firstStatus || '-'}
                            </div>
                          </div>
                        )}
                        {selectedExportFields.includes('middleStatus') && (
                          <div className="space-y-1">
                            <span className="block text-xs font-semibold text-slate-500">중간 현황</span>
                            <div className="rounded bg-slate-50 p-2 text-sm text-slate-700 min-h-[40px]">
                              {newcomer.middleStatus || '-'}
                            </div>
                          </div>
                        )}
                        {selectedExportFields.includes('recentStatus') && (
                          <div className="space-y-1">
                            <span className="block text-xs font-semibold text-slate-500">최근 현황</span>
                            <div className="rounded bg-slate-50 p-2 text-sm text-slate-700 min-h-[40px]">
                              {newcomer.recentStatus || '-'}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {selectedExportFields.includes('assignmentNote') && newcomer.assignmentNote && (
                        <div className="space-y-1">
                          <span className="block text-xs font-semibold text-slate-500">순배치 특이사항</span>
                          <div className="rounded bg-yellow-50 p-2 text-sm text-slate-700">
                            {newcomer.assignmentNote}
                          </div>
                        </div>
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
  )
}

export default NewcomerManagePage
