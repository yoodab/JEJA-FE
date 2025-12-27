import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/authService'

function LoginPage() {
  const navigate = useNavigate()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await login({ loginId, password })
      // 로그인 성공 시 일반 유저 메인으로 이동
      navigate('/user-dashboard', { replace: true })
    } catch (err: unknown) {
      // 백엔드에서 내려주는 에러 메시지가 있다면 여기서 파싱해서 보여줄 수 있습니다.
      setError('이메일 또는 비밀번호를 다시 확인해주세요.')
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
          <h1 className="mt-2 text-2xl font-bold">로그인</h1>
          <p className="mt-1 text-sm text-slate-600">
            로그인 폼을 여기에 추가해주세요.
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
              placeholder="로그인 아이디를 입력하세요"
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

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
          <button type="button" className="hover:text-slate-700">
            비밀번호를 잊으셨나요?
          </button>
          <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

