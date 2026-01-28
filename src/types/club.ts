import type { Member } from './member'

export enum ClubType {
  NEW_BELIEVER = 'NEW_BELIEVER', // 새신자관리팀 / Green
  WORSHIP = 'WORSHIP', // 찬양팀 / Purple
  BROADCAST = 'BROADCAST', // 방송팀 / Orange
  CONTENT = 'CONTENT', // 컨텐츠팀 / Pink
  DESIGN = 'DESIGN', // 디자인팀 / Indigo
  SERVICE = 'SERVICE', // 예배팀 / Blue
  HOBBY = 'HOBBY', // 취미/친목 / Yellow
}

export const ClubTypeLabels: Record<ClubType, string> = {
  [ClubType.NEW_BELIEVER]: '새신자관리팀',
  [ClubType.WORSHIP]: '찬양팀',
  [ClubType.BROADCAST]: '방송팀',
  [ClubType.CONTENT]: '컨텐츠팀',
  [ClubType.DESIGN]: '디자인팀',
  [ClubType.SERVICE]: '예배팀',
  [ClubType.HOBBY]: '취미/친목',
}

export interface ClubMember {
  memberId: number
  name: string
  phone?: string
  role?: string
}

export interface Club {
  id: number
  name: string
  description: string
  type: ClubType
  leaderId?: number
  leaderName?: string
  memberCount: number
  members?: ClubMember[] // Only in detail view
  meetingTime?: string
  meetingPlace?: string
}

export interface CreateClubRequest {
  name: string
  description: string
  type: ClubType
  leaderMemberId: number
}

export interface UpdateClubRequest {
  name: string
  description: string
}
