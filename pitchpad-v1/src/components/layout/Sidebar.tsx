// src/components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user: {
    id: string
    name?: string | null
    email: string
    role: string
  }
}

const creatorNav = [
  { href: '/dashboard',       label: 'Overview',    icon: '◈' },
  { href: '/ideas',           label: 'My Ideas',    icon: '◉' },
  { href: '/ideas/new',       label: 'New Idea',    icon: '+' },
  { href: '/practice',        label: 'Practice',    icon: '◎' },
]

const reviewerNav = [
  { href: '/dashboard',       label: 'Overview',    icon: '◈' },
  { href: '/review',          label: 'Review Queue',icon: '◉' },
]

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const nav = user.role === 'REVIEWER' ? reviewerNav : creatorNav

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase()

  return (
    <aside className="w-56 flex flex-col border-r border-tp-800 bg-tp-900 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-tp-800">
        <div className="w-3.5 h-3.5 bg-lenovo-red shrink-0" />
        <span className="font-mono text-xs tracking-widest text-tp-white uppercase">PitchPad</span>
      </div>

      {/* Role badge */}
      <div className="px-5 py-3 border-b border-tp-800">
        <span className={cn(
          'tp-badge text-2xs',
          user.role === 'REVIEWER'
            ? 'bg-signal-blue/10 text-signal-blue border border-signal-blue/20'
            : 'bg-lenovo-red/10 text-lenovo-red border border-lenovo-red/20'
        )}>
          <span className="status-dot bg-current" />
          {user.role}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-mono transition-all',
                active
                  ? 'bg-tp-700 text-tp-white'
                  : 'text-tp-400 hover:text-tp-200 hover:bg-tp-800'
              )}
            >
              <span className={cn('text-sm w-4 text-center', active && 'text-lenovo-red')}>
                {item.icon}
              </span>
              <span className="uppercase tracking-wider">{item.label}</span>
              {active && <div className="ml-auto w-1 h-1 rounded-full bg-lenovo-red" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-tp-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 rounded-sm bg-tp-700 border border-tp-600 flex items-center justify-center shrink-0">
            <span className="font-mono text-xs text-tp-200">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-tp-200 font-mono truncate">{user.name ?? 'User'}</p>
            <p className="text-2xs text-tp-500 font-mono truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full text-left text-2xs font-mono text-tp-600 hover:text-tp-300 transition-colors px-1 uppercase tracking-wider"
        >
          Sign out →
        </button>
      </div>
    </aside>
  )
}
