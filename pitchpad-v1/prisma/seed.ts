// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Hash password once for both users
  const hashedPassword = await bcrypt.hash('pitchpad123', 10)

  // Create/update test creator account
  const creator = await prisma.user.upsert({
    where: { email: 'creator@pitchpad.com' },
    update: { password: hashedPassword }, // Always update password
    create: {
      email: 'creator@pitchpad.com',
      name: 'Test Creator',
      password: hashedPassword,
      role: 'CREATOR',
    },
  })

  // Create/update test reviewer account
  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@pitchpad.com' },
    update: { password: hashedPassword }, // Always update password
    create: {
      email: 'reviewer@pitchpad.com',
      name: 'Test Reviewer',
      password: hashedPassword,
      role: 'REVIEWER',
    },
  })

  console.log('Created/updated test users:', creator.email, reviewer.email)
  console.log('Password for both: pitchpad123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
