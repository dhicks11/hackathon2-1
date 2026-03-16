// src/app/account/layout.tsx
import TopNav from '@/components/layout/TopNav'
import Sidebar from '@/components/layout/Sidebar'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8' }}>
      <TopNav />
      <div style={{ display: 'flex', maxWidth: 1200, margin: '0 auto' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '32px 40px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
