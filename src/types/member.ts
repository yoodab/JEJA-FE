// 백엔드 /api/admin/members 응답 DTO에 맞춘 타입
// {
//   "memberId": 1,
//   "name": "이리더",
//   "phone": "...",
//   "birthDate": "...",
//   "status": "재적",
//   "role": "리더",
//   "soonId": 10,
//   "soonName": "믿음셀",
//   "hasAccount": true
// }
export interface Member {
  memberId: number
  name: string
  phone: string
  birthDate: string
  status: string
  role: string
  soonId?: number
  soonName?: string
  hasAccount: boolean
}

