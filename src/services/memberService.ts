import axios from 'axios'
import { Member } from '../types/member'

// Example axios instance if you later point to a real API.
// const api = axios.create({ baseURL: '/api' })

const mockMembers: Member[] = [
  { id: 1, name: '김민수', role: '일반청년', status: '재적', phone: '010-1234-5678' },
  { id: 2, name: '이수정', role: '순장', status: '재적', phone: '010-2345-6789' },
  { id: 3, name: '박지훈', role: '일반청년', status: '새신자', phone: '010-3456-7890' },
  { id: 4, name: '정하늘', role: '관리자', status: '재적', phone: '010-4567-8901' },
  { id: 5, name: '최예린', role: '일반청년', status: '휴학', phone: '010-5678-9012' },
]

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getMembers(): Promise<Member[]> {
  await delay(1000)
  return mockMembers
}

export async function getMemberById(id: number): Promise<Member | undefined> {
  await delay(500)
  return mockMembers.find((member) => member.id === id)
}

export async function createMember(memberData: Omit<Member, 'id'>): Promise<Member> {
  await delay(500)
  const newMember: Member = { ...memberData, id: mockMembers.length + 1 }
  mockMembers.push(newMember)
  return newMember
}


