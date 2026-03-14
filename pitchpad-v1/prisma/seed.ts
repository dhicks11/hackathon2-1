// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create test creator account
  const creatorPassword = await bcrypt.hash('pitchpad123', 12)

  const creator = await prisma.user.upsert({
    where: { email: 'creator@pitchpad.com' },
    update: {},
    create: {
      email: 'creator@pitchpad.com',
      name: 'Test Creator',
      password: creatorPassword,
      role: 'CREATOR',
    },
  })

  // Create test reviewer account
  const reviewerPassword = await bcrypt.hash('pitchpad123', 12)

  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@pitchpad.com' },
    update: {},
    create: {
      email: 'reviewer@pitchpad.com',
      name: 'Test Reviewer',
      password: reviewerPassword,
      role: 'REVIEWER',
    },
  })

  console.log('Created test users:', creator.email, reviewer.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
