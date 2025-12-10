import { Link } from 'react-router-dom'

function LoginPage() {
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
        <div className="space-y-3 text-sm text-slate-600">
          <p>이메일 / 비밀번호 입력 필드를 추가하세요.</p>
          <p>비밀번호 찾기 등 링크도 여기에 배치하세요.</p>
        </div>
        <div className="mt-8">
          <Link
            to="/dashboard"
            className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            대시보드로 이동
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

