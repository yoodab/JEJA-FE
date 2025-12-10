export interface Member {
  id: number
  name: string
  role: string // e.g., '일반청년', '순장', '관리자'
  status: string // e.g., '재적', '새신자', '휴학'
  phone?: string
  birthDate?: string
}


