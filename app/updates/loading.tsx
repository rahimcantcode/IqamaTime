import BottomNav from '@/components/bottom-nav'

export default function LoadingUpdates() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 pb-28 pt-8">
      <h1 className="text-xl font-bold">Updates</h1>
      <p role="status" className="mt-3 text-sm text-[#595550]">Loading masjid events…</p>
      <div aria-hidden="true" className="mt-6 space-y-5">
        {[0, 1].map(key => <div key={key} className="h-64 animate-pulse rounded-3xl bg-[#EEF2ED] motion-reduce:animate-none" />)}
      </div>
      <BottomNav />
    </main>
  )
}
