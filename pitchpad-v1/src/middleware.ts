// src/middleware.ts
// Simple middleware - auth is handled client-side via localStorage token
// Railway backend handles the actual auth validation
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC = ['/', '/auth/login', '/auth/register']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC.some(p => pathname === p)) return NextResponse.next()
  if (pathname.startsWith('/api/')) return NextResponse.next()
  if (pathname.startsWith('/_next/')) return NextResponse.next()
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
