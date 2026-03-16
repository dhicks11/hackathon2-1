// src/app/api/account/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name } = body

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Account update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update account' },
      { status: 500 }
    )
  }
}
