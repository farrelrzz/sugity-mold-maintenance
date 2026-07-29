const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  const laporan = await prisma.laporan.findMany({
    include: {
      pic: true,
      checksheet: true
    }
  })
  console.log('LAPORAN COUNT:', laporan.length)
  console.log(JSON.stringify(laporan, null, 2))
  await prisma.$disconnect()
}

test()
