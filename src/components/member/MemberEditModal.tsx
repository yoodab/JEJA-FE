import React, { useState, useEffect, useRef } from 'react'
import type { Member } from '../../types/member'
import { uploadMemberImage } from '../../services/memberService'
import { getFileUrl } from '../../services/albumService'
import type { CreateMemberRequest, UpdateMemberRequest } from '../../services/memberService'
import { formatPhoneNumber } from '../../utils/format'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

interface MemberEditModalProps {
  member?: Member | null
  onClose: () => void
  onSave: (data: CreateMemberRequest | UpdateMemberRequest) => Promise<void>
}

export default function MemberEditModal({ member, onClose, onSave }: MemberEditModalProps) {
  const [formData, setFormData] = useState<CreateMemberRequest>({
    name: '',
    phone: '',
    birthDate: '',
    gender: 'MALE', // Default to MALE
    memberStatus: 'NEWCOMER', // Default to NEWCOMER
    memberImageUrl: '',
  })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        phone: member.phone,
        birthDate: member.birthDate || '',
        gender: member.gender || 'MALE',
        memberStatus: (member.memberStatus as string) || 'ACTIVE',
        memberImageUrl: member.memberImageUrl || '',
      })
      // If there is an existing image, prepend API_BASE_URL for display
      setPreviewUrl(member.memberImageUrl ? getFileUrl(member.memberImageUrl) : null)
    } else {
      setFormData({
        name: '',
        phone: '',
        birthDate: '',
        gender: 'MALE',
        memberStatus: 'NEWCOMER',
        memberImageUrl: '',
      })
      setPreviewUrl(null)
    }
  }, [member])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'phone') {
      setFormData((prev) => ({ ...prev, [name]: formatPhoneNumber(value) }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      // Preview immediately
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      // Upload
      const uploadedUrl = await uploadMemberImage(file)
      setFormData((prev) => ({ ...prev, memberImageUrl: uploadedUrl }))
      // The uploadedUrl returned from backend is likely a relative path (e.g., /files/...)
      // So we update preview to include base URL if we want to show it from server, 
      // but we already have objectUrl for immediate preview.
      // However, to be consistent with how it's saved and viewed later:
      setPreviewUrl(`${API_BASE_URL}${uploadedUrl}`) 
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      alert('이미지 업로드에 실패했습니다.')
      setPreviewUrl(member?.memberImageUrl ? `${API_BASE_URL}${member.memberImageUrl}` : null) // Revert
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    try {
      setIsSubmitting(true)
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('저장 실패:', error)
      // Alert is handled by parent usually, but we can do it here too
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {member ? '성도 정보 수정' : '새 성도 등록'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="flex flex-col items-center justify-center">
            <div 
              className="relative h-24 w-24 overflow-hidden rounded-full bg-slate-100 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handleImageClick}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleImageClick}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              사진 변경
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">이름 <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">생년월일</label>
              <input
                type="text"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="YYYY-MM-DD"
                maxLength={10}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">성별</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">연락처 <span className="text-red-500">*</span></label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="010-0000-0000"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">상태</label>
            <select
              name="memberStatus"
              value={formData.memberStatus}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="NEWCOMER">새신자</option>
              <option value="ACTIVE">재적</option>
              <option value="LONG_TERM_ABSENT">장결자</option>
              <option value="MOVED">교회 이동</option>
              <option value="GRADUATED">졸업</option>
            </select>
          </div>

          <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? '저장 중...' : (member ? '수정하기' : '등록하기')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
