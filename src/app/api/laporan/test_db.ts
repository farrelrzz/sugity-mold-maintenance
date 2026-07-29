import { prisma } from '../../../lib/prisma'

async function test() {
  const laporan = await prisma.laporan.findMany({
    include: {
      pic: true,
      checksheet: true
    }
  })
  console.log('LAPORAN COUNT:', laporan.length)
  console.log(JSON.stringify(laporan, null, 2))
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
