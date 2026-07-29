import { PrismaClient, Prisma } from '@prisma/client'

const p = new PrismaClient()

async function main() {
  // Use raw query to avoid TypeScript Json filter issues
  const molds: any[] = await p.$queryRaw`SELECT no_mold, heater_std FROM mold_book WHERE heater_std IS NOT NULL LIMIT 5`
  console.log('Sample with heater:', JSON.stringify(molds))
  const countResult: any[] = await p.$queryRaw`SELECT COUNT(*) as cnt FROM mold_book WHERE heater_std IS NOT NULL`
  console.log('Total with heater:', countResult[0]?.cnt?.toString())
  const totalResult: any[] = await p.$queryRaw`SELECT COUNT(*) as cnt FROM mold_book`
  console.log('Total molds:', totalResult[0]?.cnt?.toString())
}

main().catch(console.error).finally(() => p.$disconnect())
