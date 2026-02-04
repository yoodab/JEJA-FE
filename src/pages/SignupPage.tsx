import { type FormEvent, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { signup, sendSignupVerification, verifySignupCode } from '../services/authService'

function SignupPage() {
  const navigate = useNavigate()
  
  // Steps: 'email', 'details'
  const [step, setStep] = useState<'email' | 'details'>('email')

  // Email Verification State
  const [email, setEmail] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [timer, setTimer] = useState(300) // 5 minutes in seconds
  const [isSendingCode, setIsSendingCode] = useState(false) // Track sending status

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    // Only run timer if code is sent AND sending process is finished
    if (isCodeSent && !isSendingCode && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    } else if (timer === 0) {
      // Optional: Handle timer expiration
    }
    return () => clearInterval(interval)
  }, [isCodeSent, isSendingCode, timer])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // User Details State
  const [loginId, setLoginId] = useState('')
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 1. Send Verification Code
  const handleSendCode = () => {
    if (!email) {
      setError('이메일을 입력해주세요.')
      return
    }
    setError(null)
    setSuccess(null)
    // setIsLoading(true) // 즉시 전환을 위해 로딩 상태 제거

    // Optimistic UI update: Assume email will be sent successfully
    setIsCodeSent(true)
    setIsSendingCode(true) // Start sending state
    setTimer(300) // Reset timer
    setSuccess('인증번호를 전송하고 있습니다...')

    // Send API request in background
    sendSignupVerification(email)
      .then(() => {
        setIsSendingCode(false) // Sending finished, timer starts
        setSuccess('인증번호가 전송되었습니다. 이메일을 확인해주세요.')
      })
      .catch((err: unknown) => {
        // If failed, revert UI state
        setIsCodeSent(false)
        setIsSendingCode(false)
        handleError(err)
      })
  }

  // 2. Verify Code
  const handleVerifyCode = async () => {
    if (!authCode) {
      setError('인증번호를 입력해주세요.')
      return
    }
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      await verifySignupCode(email, authCode)
      setIsEmailVerified(true)
      setStep('details')
      setSuccess('이메일 인증이 완료되었습니다. 나머지 정보를 입력해주세요.')
    } catch (err: unknown) {
      handleError(err)
    } finally {
      setIsLoading(false)
    }
  }

  // 3. Final Sign Up
  const handleSignup = async (e: FormEvent) => {
    e.preventDefault()
    if (!isEmailVerified) {
      setError('이메일 인증을 먼저 완료해주세요.')
      return
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      await signup({ 
        loginId, 
        password, 
        email, 
        name, 
        phone, 
        birthDate, 
        address 
      })
      setSuccess('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1500)
    } catch (err: unknown) {
      handleError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleError = (err: unknown) => {
    let errorMessage = '오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-900">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            JEJA
          </p>
          <h1 className="mt-2 text-2xl font-bold">회원가입</h1>
          <p className="mt-1 text-sm text-slate-600">
            {step === 'email' ? '이메일 인증을 진행해주세요.' : '기본 정보를 입력하고 계정을 생성하세요.'}
          </p>
        </div>

        {step === 'email' && (
          <div className="mt-6 space-y-5">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                이메일
              </label>
              <div className="flex gap-2">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isCodeSent}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                  placeholder="email@example.com"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isLoading || isCodeSent}
                  className="whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {isCodeSent ? '전송됨' : '인증번호 전송'}
                </button>
              </div>
            </div>

            {isCodeSent && (
              <div className="space-y-1 animate-fadeIn">
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
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={isLoading || timer === 0}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                  >
                    인증확인
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                       handleSendCode() // Re-send code
                    }}
                    disabled={isLoading || timer > 0}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    재전송
                  </button>
                </div>
                {timer === 0 && <p className="text-xs text-red-500">인증 시간이 만료되었습니다. 재전송 버튼을 눌러주세요.</p>}
              </div>
            )}
            
            {/* Removed separate back button logic since we have Re-send button above */}
          </div>
        )}

        {step === 'details' && (
          <form onSubmit={handleSignup} className="mt-6 space-y-4">
            <div className="space-y-1">
               <label className="block text-sm font-medium text-slate-700">이메일</label>
               <input 
                 type="text" 
                 value={email} 
                 disabled 
                 className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
               />
            </div>

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
                placeholder="아이디"
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
                placeholder="비밀번호"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="비밀번호 확인"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <label htmlFor="address" className="block text-sm font-medium text-slate-700">
                주소
              </label>
              <input
                id="address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="서울시 강남구"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {isLoading ? '가입 처리 중...' : '회원가입 완료'}
            </button>
          </form>
        )}

        <div className="mt-4">
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          {success && <p className="text-sm text-green-600 text-center">{success}</p>}
        </div>

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