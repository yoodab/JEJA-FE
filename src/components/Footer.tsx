function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white py-6 pb-24 md:pb-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">경기도 구리시 갈매중앙로 56 제자교회</p>
            <p className="text-xs text-slate-600">
              Tel ｜ 031-574-8233~4, Fax 031-571-8235
            </p>
          </div>
          <div>
            <a
              href="http://www.jejachurch.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
            >
              제자교회 홈페이지 →
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

