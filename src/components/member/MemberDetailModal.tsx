import { useState } from 'react'
import type { Member } from '../../types/member'
import { formatPhoneNumber } from '../../utils/format'
import { formatGender, formatRoles, formatMemberStatus } from '../../types/member'
import ImagePreviewModal from '../ImagePreviewModal'
import { getFileUrl } from '../../services/albumService'

interface MemberDetailModalProps {
  member: Member
  onClose: () => void
  onEdit: (member: Member) => void
  onDelete: (memberId: number) => void
}

export default function MemberDetailModal({ member, onClose, onEdit, onDelete }: MemberDetailModalProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const handleEdit = () => {
    onEdit(member)
    onClose()
  }

  const handleDelete = () => {
    onDelete(member.memberId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Kebab Menu */}
        <div className="absolute top-4 right-12 z-20">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-32 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-30">
              <button
                onClick={handleEdit}
                className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center mb-6 mt-4">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-slate-200 mb-4 shadow-md flex items-center justify-center">
            {member.memberImageUrl ? (
              <img 
                src={getFileUrl(member.memberImageUrl)} 
                alt={member.name} 
                className="h-full w-full object-cover cursor-zoom-in hover:opacity-80 transition-opacity" 
                onClick={() => setPreviewImage(getFileUrl(member.memberImageUrl || ''))}
              />
            ) : (
              <svg className="h-12 w-12 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
          <p className="text-sm text-slate-500 mt-1">{formatRoles(member.roles)}</p>
        </div>

        <div className="space-y-4 px-2">
          <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">생년월일</label>
              <p className="text-sm font-medium text-slate-900">{member.birthDate || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">성별</label>
              <p className="text-sm font-medium text-slate-900">{formatGender(member.gender)}</p>
            </div>
          </div>
          <div className="border-b border-slate-100 pb-4">
            <label className="text-xs font-semibold text-slate-500 block mb-1">연락처</label>
            <p className="text-sm font-medium text-slate-900">{formatPhoneNumber(member.phone)}</p>
          </div>
          <div>
             <label className="text-xs font-semibold text-slate-500 block mb-1">상태</label>
             <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
               member.memberStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
               member.memberStatus === 'NEWCOMER' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'
             }`}>
               {formatMemberStatus(member.memberStatus)}
             </span>
          </div>
        </div>
        
        <div className="mt-8">
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-slate-100 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              닫기
            </button>
        </div>
      </div>
      
      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  )
}
