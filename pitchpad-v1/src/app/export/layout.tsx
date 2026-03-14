import TopNav from '@/components/layout/TopNav'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8' }}>
      <TopNav />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {children}
      </main>
    </div>
  )
}
