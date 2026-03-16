// src/app/account/layout.tsx
'use client'

import TopNav from '@/components/layout/TopNav'
import AccountSidebar from '@/components/layout/AccountSidebar'
import { SessionProvider } from 'next-auth/react'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div style={{ minHeight: '100vh', background: '#F8F8F8' }}>
        <TopNav />
        <div style={{ display: 'flex', maxWidth: 1200, margin: '0 auto' }}>
          <AccountSidebar />
          <main style={{ flex: 1, padding: '32px 40px' }}>
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  )
}
