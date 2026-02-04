import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerPublicNewcomer } from '../services/attendanceService'

export default function NewcomerRegistrationPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '', // YYMMDD -> 변환 필요
    gender: 'MALE' as 'MALE' | 'FEMALE',
    phone: '',
    address: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | null
    text: string
  }>({ type: null, text: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사
    if (!formData.name.trim()) {
      alert('이름을 입력해주세요.')
      return
    }
    if (formData.birthDate.length !== 6) {
      alert('생년월일 6자리를 정확히 입력해주세요.')
      return
    }
    if (!formData.phone.trim()) {
      alert('연락처를 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    setMessage({ type: null, text: '' })

    try {
      // 생년월일 변환 (YYMMDD -> YYYY-MM-DD)
      const yy = parseInt(formData.birthDate.substring(0, 2), 10)
      const mm = formData.birthDate.substring(2, 4)
      const dd = formData.birthDate.substring(4, 6)
      const fullYear = yy > 40 ? 1900 + yy : 2000 + yy
      const parsedBirthDate = `${fullYear}-${mm}-${dd}`

      await registerPublicNewcomer({
        ...formData,
        birthDate: parsedBirthDate,
      })

      setMessage({
        type: 'success',
        text: '등록이 완료되었습니다! 잠시 후 출석 페이지로 이동합니다.',
      })

      // 2초 후 출석 페이지로 이동
      setTimeout(() => {
        navigate('/attendance/guest')
      }, 2000)
    } catch (error: unknown) {
      console.error('새가족 등록 실패:', error)
      const errorMessage = error instanceof Error ? error.message : '등록 중 오류가 발생했습니다.';
      setMessage({
        type: 'error',
        text: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">
            새가족 등록
          </h1>
          <p className="text-slate-600">
            환영합니다! 등록 카드를 작성해주세요.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="이름을 입력하세요"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                생년월일 (6자리) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.birthDate}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
                  setFormData({ ...formData, birthDate: val })
                }}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg tracking-widest outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="예: 980101"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                성별 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-700">
                  <input
                    type="radio"
                    name="gender"
                    value="MALE"
                    checked={formData.gender === 'MALE'}
                    onChange={() => setFormData({ ...formData, gender: 'MALE' })}
                    className="mr-2 h-4 w-4"
                  />
                  형제 (Male)
                </label>
                <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50 has-[:checked]:border-pink-500 has-[:checked]:bg-pink-50 has-[:checked]:text-pink-700">
                  <input
                    type="radio"
                    name="gender"
                    value="FEMALE"
                    checked={formData.gender === 'FEMALE'}
                    onChange={() =>
                      setFormData({ ...formData, gender: 'FEMALE' })
                    }
                    className="mr-2 h-4 w-4"
                  />
                  자매 (Female)
                </label>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="010-0000-0000"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                거주지 (동/구 까지만)
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="예: 서울시 강남구"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full transform rounded-lg bg-blue-600 py-4 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? '등록 중...' : '등록하기'}
            </button>
          </form>

          {message.text && (
            <div
              className={`mt-4 rounded-lg border p-4 font-medium ${
                message.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center">
            <button 
                onClick={() => navigate(-1)}
                className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
                뒤로 가기
            </button>
        </div>
      </div>
    </div>
  )
}
