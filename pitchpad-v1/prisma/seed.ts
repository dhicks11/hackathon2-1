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

  console.log('Created test user:', creator.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
