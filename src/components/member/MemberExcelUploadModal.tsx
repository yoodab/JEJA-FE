import React, { useState, useRef } from 'react'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { previewMembersFromExcel } from '../../services/memberService'
import type { CreateMemberRequest } from '../../services/memberService'
import { formatPhoneNumber } from '../../utils/format'
import { formatGender, formatMemberStatus } from '../../types/member'

interface MemberExcelUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateMemberRequest[]) => Promise<void>
}

const MemberExcelUploadModal: React.FC<MemberExcelUploadModalProps> = ({ isOpen, onClose, onSave }) => {
  const [step, setStep] = useState<'guide' | 'preview'>('guide')
  const [previewData, setPreviewData] = useState<CreateMemberRequest[]>([])
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleDownloadTemplate = () => {
    const headers = ['이름', '연락처', '생년월일(YYYY-MM-DD)', '성별(남/여)', '상태(새신자/재적/장결자/교회 이동/졸업)']
    const data = [
      ['홍길동', '01012345678', '1990-01-01', '남', '재적'],
      ['김철수', '010-9876-5432', '1995.05.20', '남', '새신자'],
      ['이영희', '01011112222', '19880315', '여', '재적'],
    ]
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '성도 등록 양식')
    XLSX.writeFile(wb, '성도_등록_양식.xlsx')
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    try {
      const data = await previewMembersFromExcel(file)
      setPreviewData(data)
      
      // 중복이 아닌 항목만 기본 선택
      const initialSelection = new Set<number>()
      data.forEach((item, index) => {
        if (!item.isDuplicate) {
          initialSelection.add(index)
        }
      })
      setSelectedRows(initialSelection)
      setStep('preview')
    } catch (error) {
      console.error('Excel preview error:', error)
      toast.error('엑셀 파일을 분석하는 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const toggleRow = (index: number) => {
    const newSelection = new Set(selectedRows)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      newSelection.add(index)
    }
    setSelectedRows(newSelection)
  }

  const toggleAll = () => {
    if (selectedRows.size === previewData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(previewData.map((_, i) => i)))
    }
  }

  const handleSave = async () => {
    const selectedData = previewData.filter((_, i) => selectedRows.has(i))
    if (selectedData.length === 0) {
      toast.error('저장할 항목을 선택해주세요.')
      return
    }

    setIsProcessing(true)
    try {
      await onSave(selectedData)
      onClose()
      setStep('guide')
      setPreviewData([])
      setSelectedRows(new Set())
    } catch (error) {
      console.error('Save error:', error)
      toast.error('저장 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900">
            {step === 'guide' ? '📊 엑셀로 성도 등록' : `👀 미리보기 (${previewData.length}명)`}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'guide' ? (
            <div className="space-y-6">
              <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-bold">💡 엑셀 업로드 안내</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>아래 표의 형식을 지켜서 작성해 주세요.</li>
                  <li>연락처와 생년월일 형식이 달라도 시스템에서 최대한 보정합니다.</li>
                  <li>이미 등록된 성도(이름+생년월일 또는 이름+연락처 중복)는 미리보기에서 표시됩니다.</li>
                </ul>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-2 font-semibold">이름 (필수)</th>
                      <th className="px-4 py-2 font-semibold">연락처</th>
                      <th className="px-4 py-2 font-semibold">생년월일</th>
                      <th className="px-4 py-2 font-semibold">성별</th>
                      <th className="px-4 py-2 font-semibold">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="px-4 py-2 text-slate-600">홍길동</td>
                      <td className="px-4 py-2 text-slate-600">010-1234-5678</td>
                      <td className="px-4 py-2 text-slate-600">1990-01-01</td>
                      <td className="px-4 py-2 text-slate-600">남/여</td>
                      <td className="px-4 py-2 text-slate-600">재적/새신자...</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  📥 양식 다운로드
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                >
                  📁 엑셀 파일 선택
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <p className="text-slate-500">
                  선택된 항목: <span className="font-bold text-sky-600">{selectedRows.size}</span> / {previewData.length}
                </p>
                <button
                  onClick={toggleAll}
                  className="text-sky-600 hover:underline font-medium"
                >
                  {selectedRows.size === previewData.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        <th className="px-4 py-2 w-10"></th>
                        <th className="px-4 py-2 font-semibold">이름</th>
                        <th className="px-4 py-2 font-semibold">성별</th>
                        <th className="px-4 py-2 font-semibold">생년월일</th>
                        <th className="px-4 py-2 font-semibold">연락처</th>
                        <th className="px-4 py-2 font-semibold">상태</th>
                        <th className="px-4 py-2 font-semibold text-center">중복</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {previewData.map((row, idx) => (
                        <tr 
                          key={idx} 
                          className={`hover:bg-slate-50 cursor-pointer ${row.isDuplicate ? 'bg-amber-50/50' : ''}`}
                          onClick={() => toggleRow(idx)}
                        >
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(idx)}
                              onChange={() => {}} // Row click handles it
                              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            />
                          </td>
                          <td className="px-4 py-2 font-medium text-slate-900">{row.name}</td>
                          <td className="px-4 py-2 text-slate-600">{formatGender(row.gender)}</td>
                          <td className="px-4 py-2 text-slate-600">{row.birthDate || '-'}</td>
                          <td className="px-4 py-2 text-slate-600">{formatPhoneNumber(row.phone)}</td>
                          <td className="px-4 py-2">
                            <span className="text-xs font-medium text-slate-600">
                              {formatMemberStatus(row.memberStatus)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            {row.isDuplicate && (
                              <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                중복 의심
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            onClick={() => {
              if (step === 'preview') {
                setStep('guide')
              } else {
                onClose()
              }
            }}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {step === 'preview' ? '이전으로' : '취소'}
          </button>
          {step === 'preview' && (
            <button
              onClick={handleSave}
              disabled={isProcessing || selectedRows.size === 0}
              className="rounded-xl bg-sky-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
            >
              {isProcessing ? '저장 중...' : `${selectedRows.size}명 저장하기`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default MemberExcelUploadModal
