function DashboardPage() {
  return (
    <section className="space-y-3">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          요약
        </p>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="mt-1 text-sm text-slate-600">
          요약 카드와 차트를 여기에 배치하세요.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">지표 A</p>
          <p className="text-2xl font-semibold">123</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">지표 B</p>
          <p className="text-2xl font-semibold">456</p>
        </div>
      </div>
    </section>
  )
}

export default DashboardPage

