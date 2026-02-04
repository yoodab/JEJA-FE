import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { sendPasswordResetVerification, verifyPasswordResetCode, resetPassword } from '../services/authService'

function FindPasswordPage() {
  const navigate = useNavigate()
  
  // Steps: 'identify' (ID/Email), 'verify' (AuthCode), 'reset' (NewPassword)
  const [step, setStep] = useState<'identify' | 'verify' | 'reset'>('identify')

  // Timer State
  const [timer, setTimer] = useState(300)
  const [isSendingCode, setIsSendingCode] = useState(false)

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 'verify' && !isSendingCode && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [step, isSendingCode, timer])

  const [loginId, setLoginId] = useState('')
  const [email, setEmail] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleError = (err: unknown) => {
    let errorMessage = '오류가 발생했습니다.'
    if (err instanceof Error) {
      errorMessage = err.message
    } else if (err instanceof AxiosError) {
      if (err.response?.status === 400) {
        errorMessage = '인증 실패'
      } else {
        const serverMessage = err.response?.data?.message || err.response?.data?.error
        if (serverMessage) {
          errorMessage = serverMessage
        } else if (err.message) {
          errorMessage = err.message
        }
      }
    }
    setError(errorMessage)
  }

  // Step 1: Send Verification Code
  const handleSendCode = (e: FormEvent) => {
    e.preventDefault()
    if (!loginId || !email) {
      setError('아이디와 이메일을 모두 입력해주세요.')
      return
    }

    setError(null)
    setSuccess(null)
    // setIsLoading(true) // 즉시 전환을 위해 로딩 상태 제거

    // Optimistic UI update
    setStep('verify')
    setSuccess('인증번호를 전송하고 있습니다...')
    setIsSendingCode(true)

    // Send API request in background
    sendPasswordResetVerification(loginId, email)
      .then(() => {
        setIsSendingCode(false)
        setSuccess('인증번호가 이메일로 전송되었습니다.')
      })
      .catch((err: unknown) => {
        // If failed, revert UI state
        setStep('identify')
        setIsSendingCode(false)
        handleError(err)
      })
  }

  // Step 2: Verify Code
  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault()
    if (!authCode) {
      setError('인증번호를 입력해주세요.')
      return
    }

    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const isValid = await verifyPasswordResetCode(email, authCode)
      if (isValid) {
        setStep('reset')
        setSuccess('인증에 성공했습니다. 새 비밀번호를 설정해주세요.')
      } else {
        setError('인증번호가 올바르지 않습니다.')
      }
    } catch (err: unknown) {
      handleError(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Reset Password
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!newPassword) {
      setError('새 비밀번호를 입력해주세요.')
      return
    }

    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      await resetPassword({ email, authCode, newPassword })
      setSuccess('비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1500)
    } catch (err: unknown) {
      handleError(err)
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
          <h1 className="mt-2 text-2xl font-bold">비밀번호 찾기</h1>
          <p className="mt-1 text-sm text-slate-600">
            {step === 'identify' && '아이디와 이메일을 입력하여 본인 인증을 진행하세요.'}
            {step === 'verify' && '이메일로 전송된 인증번호를 입력하세요.'}
            {step === 'reset' && '새로운 비밀번호를 입력하세요.'}
          </p>
        </div>

        {step === 'identify' && (
          <form onSubmit={handleSendCode} className="mt-6 space-y-5">
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
                placeholder="아이디 입력"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                이메일
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="가입 시 등록한 이메일"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {isLoading ? '전송 중...' : '인증번호 전송'}
            </button>
          </form>
        )}

        {step === 'verify' && (
          <div className="mt-6 space-y-5 animate-fadeIn">
            <div className="space-y-1">
              <label htmlFor="authCode" className="block text-sm font-medium text-slate-700">
                인증번호
              </label>
              <div className="relative">
                <input
                  id="authCode"
                  type="text"
                  required
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-24 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="인증번호 6자리"
                  maxLength={6}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-red-500">
                  {formatTime(timer)}
                </div>
              </div>
              <p className="text-xs text-slate-500">이메일({email})로 전송된 인증번호를 입력해주세요.</p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={isLoading || timer === 0}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {isLoading ? '확인 중...' : '인증번호 확인'}
              </button>
              <button
                type="button"
                onClick={(e) => handleSendCode(e)} // Re-send using existing state
                disabled={isLoading || timer > 0}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                재전송
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => setStep('identify')}
              className="mt-2 w-full text-center text-xs text-slate-500 hover:underline"
            >
              처음으로 돌아가기
            </button>
          </div>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-5">
            <div className="space-y-1">
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
                새 비밀번호
              </label>
              <input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="새로운 비밀번호 입력"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {isLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        )}

        <div className="mt-4 text-center">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
          <span>비밀번호가 기억나셨나요?</span>
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            로그인
          </Link>
        </div>
      </div>
    </div>
  )
}

export default FindPasswordPage