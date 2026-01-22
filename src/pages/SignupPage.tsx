import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { signup } from '../services/authService'

function SignupPage() {
  const navigate = useNavigate()
  const [loginId, setLoginId] = useState('')
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      await signup({ loginId, name, password, birthDate, phone })
      setSuccess('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.')
      // 잠깐 메시지를 보여준 뒤 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1500)
    } catch (err: unknown) {
      // 에러 메시지 추출
      let errorMessage = '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (err instanceof AxiosError) {
        // Axios 에러인 경우 서버 응답에서 메시지 추출
        const serverMessage = err.response?.data?.message || err.response?.data?.error
        if (serverMessage) {
          errorMessage = serverMessage
        } else if (err.message) {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-900">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            JEJA
          </p>
          <h1 className="mt-2 text-2xl font-bold">회원가입</h1>
          <p className="mt-1 text-sm text-slate-600">
            기본 정보를 입력하고 계정을 생성하세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="space-y-1">
            <label htmlFor="loginId" className="block text-sm font-medium text-slate-700">
              아이디
            </label>
            <input
              id="loginId"
              type="text"
              required
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="로그인에 사용할 아이디"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              이름
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="홍길동"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700">
              생년월일
            </label>
            <input
              id="birthDate"
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
              연락처
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="010-0000-0000"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isLoading ? '회원가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
          <span>이미 계정이 있으신가요?</span>
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            로그인
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignupPage


