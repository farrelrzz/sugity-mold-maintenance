/**
 * update_heater_cooling.ts
 * Update heater_std, core_std, cav_std untuk mold berdasarkan data spesifikasi aktual
 * Run: npx ts-node --project tsconfig.json prisma/update_heater_cooling.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const url = 'mysql://root:@localhost:3306/sugity_mold_db'
const parsed = new URL(url)
const adapter = new PrismaMariaDb({
  host: parsed.hostname || 'localhost',
  port: parsed.port ? parseInt(parsed.port, 10) : 3306,
  user: decodeURIComponent(parsed.username || 'root'),
  password: decodeURIComponent(parsed.password || ''),
  database: parsed.pathname ? decodeURIComponent(parsed.pathname.substring(1)) : '',
})
const prisma = new PrismaClient({ adapter })

// null = XXX (tidak diketahui / tidak terbaca di dokumen)
// null array = tidak pakai heater
const DATA: Record<string, {
  coreStd?: string
  cavStd?: string
  heaterStd?: (number | null)[] | null
}> = {
  '361':  { coreStd: '25',   cavStd: '24.2', heaterStd: null },
  '813':  { coreStd: '47.8', cavStd: '52.0', heaterStd: [32.3,32.6,27.1,26.4,25,25,30.8,103,204,119,201,119,202,90.4,205,90.6] },
  '818':  { coreStd: '44.4', cavStd: '48.0', heaterStd: [48.7,31.9,48.3,33.3,33,61.9,106,201,147,202,121,201,121] },
  '819':  { coreStd: '69.7', cavStd: '69.2', heaterStd: [47.6,46.8,38.1,32.5,32.4,49.6,117.0,204,146,203,123,199,120] },
  '821':  { coreStd: '70.2', cavStd: '69.9', heaterStd: [31.2,31.2,27.1,27.1,24.5,24.5,29.2,206,200,120,211,121,204,68,205,90] },
  '822':  { coreStd: '48.2', cavStd: '42.5', heaterStd: [32.3,26.6,27.0,26.7,106,183,105,26.6,26.9,26.6,31.8,104,103,106,107] },
  '953':  { coreStd: '14.7', cavStd: '13.4', heaterStd: null },
  '961':  { coreStd: '21.5', cavStd: '27.5', heaterStd: [31.9,39.5,29,31.9,28,31.4,39.5,28.8,78.6,58.3,77.1,58.1,157,118,152,154] },
  '962':  { coreStd: '12.2', cavStd: '15',   heaterStd: [32,32.1,37.2,32,32.2,156,150,152,152,151,151] },
  '963':  { coreStd: '22',   cavStd: '22.5', heaterStd: [32.4,33,32.8,35.3,32.2,157,154,152,154,155,155] },
  'K49':  { coreStd: '22.3', cavStd: '19.4', heaterStd: [42.5,43.1,168,253] },
  'K50':  { coreStd: '19.6', cavStd: '13.3', heaterStd: [42.5,42,169,285] },
  'K51':  { coreStd: '8.8',  cavStd: '12',   heaterStd: [40.2,40.5,162,219,165,216] },
  'K52':  { coreStd: '9',    cavStd: '18.9', heaterStd: [42.5,42,165,285,156] },
  'N15':  { coreStd: '23.5', cavStd: '22.5', heaterStd: [26.8,39.7,31.7,204,347,203,348] },
  'N16':  { coreStd: '34.1', cavStd: '36.4', heaterStd: null },
  'N17':  { coreStd: '44.4', cavStd: '39.2', heaterStd: [31.4,39.4,33.9,26.9,26.8,206,180,112,27.1,27,34.3,40.1,31.7,113,211,182] },
  'N20':  { coreStd: '39.2', cavStd: '40.9', heaterStd: [31.2,31.4,31.3,31.4,31.4,26.2,28.5,31.2,120,158,118,157,118,117,117,118,118] },
  'N21':  { coreStd: '38.6', cavStd: '40.1', heaterStd: [32.5,32.8,32.5,32.3,32.8,40.3,29.4,54.1,119.5,119,117,116,118,159,116,118,117] },
  'N22':  { coreStd: '40.0', cavStd: '11.3', heaterStd: [32.6,32.9,33,27.1,27.3,119,158,117,157,117,157,117] },
  // H16/H17/H18 = XXX → null
  'N26':  { coreStd: '18.2', cavStd: '12.3', heaterStd: [74.5,24.7,34.6,23,23.9,27.8,170,100,94.5,125,119,112,126,123,108,null,null,null,172,121,110,169,101,108] },
  'N27':  { coreStd: '23',   cavStd: '33',   heaterStd: [40.4,40.5,157,206,156,220] },
  'N28':  { coreStd: '36',   cavStd: '38.2', heaterStd: [31.7,31.6,31.5,31.4,32.3,52.7,31.3,153,117,154,152,153,155,153,118] },
  'N29':  { coreStd: '21.1', cavStd: '21.5', heaterStd: [32,31.6,31.7,31.7,26.7,68.1,26.5,154,81.3,154,117,152,118,152,81.3] },
  'N35':  { coreStd: '29.7', cavStd: '31.2', heaterStd: [32.6,27.1,32.8,33,28.8,401.4,30.7,119,150,120,118,118,156,118,95.4,89.4] },
  'N36':  { coreStd: '51.0', cavStd: '50.0', heaterStd: [31.9,32.2,31.2,32.2,27.3,32.2,35.3,32.2,94.7,117,155,118,119,118,158,120] },
  'N37':  { coreStd: '46.2', cavStd: '58.3', heaterStd: [32.2,31.7,32.2,27,26.5,120,119,118,159,117,119,118] },
  // H5/H10/H16/H23/H24 = XXX → null
  'N44':  { coreStd: '37.8', cavStd: '39.2', heaterStd: [26.8,26.2,31.7,26.2,null,39.5,33.6,31.2,25.8,null,26.3,26,87.1,97.3,82,null,157,60.2,145,118,164,78.3,null,null] },
  'N45':  { coreStd: '37.5', cavStd: '31.5', heaterStd: [26,31,26,31,24.9,31.6,31.5,31.5,26.3,28.5,26.8,156,79.3,156,94.4,157,68.5,66.8,67,153,94.4,66.6,153,79.7] },
  'N59':  { coreStd: '15.3', cavStd: '16.7', heaterStd: [26.3,31.6,29,36.6,39.7,28.8,31.7,26.3,167,166,168,166,167,165,167,164] },
  'N60':  { coreStd: '21.7', cavStd: '24.0', heaterStd: [31.7,28.8,29,31.7,28.8,35,31.5,39.2,28.8,31.7,154,117,76.7,58.5,154,117] },
  'N61':  { coreStd: '20.1', cavStd: '20.9', heaterStd: [24.4,27.1,27,24.9,27.2,27.3,76.3,175,69.3,174,68.3,174,69.1,49.8,87.6,34.1] },
  'N62':  { heaterStd: [31,26.1,13.3,15.8,15.1,14.9,156.1,31.9,79.1,59.1,179,36.8,152,154,152,155] },
  'Q02':  { coreStd: '22.7', cavStd: '12',   heaterStd: [63.7,39.7,31.7,53.7,40.1,153,118,152,154,153,118,246] },
  'Q12':  { coreStd: '7.6',  cavStd: '15.2', heaterStd: [39.3,29.7,39.8,151,154,154,154] },
  'Q16':  { coreStd: '18.6', cavStd: '23',   heaterStd: [99.3,22.9,22.4,22.1,55.8,54.2,52.4] },
  'Q31':  { coreStd: '15.3', cavStd: '19.3', heaterStd: [136,90.2,26,21.5,94.8,91.3,74.1,90.7,72.1,93.6] },
  'Q37':  { coreStd: '32',   cavStd: '28.5', heaterStd: [70.3,32.7,31.7,31.4,32.7,32.4,32.6,31.8,32.2,32.5,71.2,171,94.2,169,72.2,166,93.5,167,70.5,163,70.3,165,94.5,171] },
  'Q38':  { coreStd: '22.8', cavStd: '24.8', heaterStd: [81.3,32.9,33.3,32.9,33.6,32.9,32.7,32.9,33,71.7,169,68.2,170,68.2,171,67.9,170] },
  'Q40':  { coreStd: '16.3', cavStd: '18.6', heaterStd: [90.8,36.1,31.2,36,36,36.8,36.6,30.7,30,39.2,53.1,62,38.1,40,53.2,45.3] },
  'Q41':  { coreStd: '16',   cavStd: '18',   heaterStd: [93.7,36.1,30.9,387,34.8,36.3,73.7,30.9,30.9,39.5,52.6,61.2,39,39.6,52.9,45.8] },
  'Q42':  { coreStd: '22.9', cavStd: '22.5', heaterStd: [94.2,29.1,23.6,26.5,86.1,94.2,89.1,126,86.3,96.8] },
  'Q43':  { coreStd: '10.7', cavStd: '12.8', heaterStd: [94.3,28.9,23.9,26,81.8,93.5,84.6,126,85.2,94] },
  'Q46':  { coreStd: '5.8',  cavStd: '5.8',  heaterStd: [215.7,93.7,276.9,95.7,54.6,286.6,95.5,217,93.9,33.1,31.7,32.8,66.8] },
  'Q48':  { coreStd: '20',   cavStd: '24.4', heaterStd: [63,30.4,31.4,31.7,29.5,30.1,30.1,30.8,37.9,40,42.1,80.4,85,79.9,85.7] },
  'Q50':  { coreStd: '17.4', cavStd: '20',   heaterStd: [22.6,20.9,19.4,11.5,16.1,19.7,10.7,19.5,18.3,31.8,12.4,22.1,22.2,26,18.7,25] },
  'Q53':  { coreStd: '20',   cavStd: '12',   heaterStd: [90.7,35.4,38,36.8,83.2,93,82.2,93.3,77.7,95.4,78.6,223,108,226] },
  'Q56':  { coreStd: '18.9', cavStd: '19.7', heaterStd: [15.8,19.2,18.1,18.7,13.7,20.5,31.4,41.7,86.7,42.1,85.1,84.4,85.2,81.7,84.7,87.5] },
  'Q57':  { coreStd: '18.2', cavStd: '21',   heaterStd: [19.5,19.1,18.2,13.6,13.6,21.1,47,40.9,83.2,41.9,85.1,82.6,87.3,82,81.4,86.1] },
  'Q58':  { coreStd: '27',   cavStd: '10.8', heaterStd: [82.9,37.2,39.7,46.5,81.7,92.5,81.9,93.8,81.7,93.1,80.5,85.2,82.2,86.4] },
  'Q60':  { coreStd: '10.9', cavStd: '7.8',  heaterStd: [88.9,39.3,43.1,41.2,81.7,99.7,80.1,142] },
  'T37':  { coreStd: '16.2', cavStd: '16.3', heaterStd: [91.5,22.4,31.2,21.8,82.9,208,55.1,87.9,101,82.7,106] },
  'T38':  { coreStd: '16',   cavStd: '19.2', heaterStd: [92,21.3,22.8,30.8,20.8,80,210,54.6,87.6,122,85.9,116] },
  'T46':  { coreStd: '5.6',  cavStd: '6.1',  heaterStd: null },
  'T56':  { coreStd: '13.7', cavStd: '15.1', heaterStd: [97.3,21.1,21.4,81.4,203,81.8,137] },
  'T58':  { coreStd: '13.2', cavStd: '18.9', heaterStd: null },
}

async function main() {
  console.log(`\n🚀 Memulai update heater & cooling untuk ${Object.keys(DATA).length} mold...\n`)
  
  let updated = 0
  let notFound = 0

  for (const [noMold, d] of Object.entries(DATA)) {
    const existing = await prisma.moldBook.findUnique({ where: { noMold } })
    
    if (!existing) {
      console.log(`  ⚠️  Mold ${noMold} tidak ditemukan di database — skip`)
      notFound++
      continue
    }

    const updateData: Record<string, any> = {}
    if (d.coreStd !== undefined) updateData.coreStd = d.coreStd
    if (d.cavStd !== undefined) updateData.cavStd = d.cavStd
    if ('heaterStd' in d) updateData.heaterStd = d.heaterStd as any

    await prisma.moldBook.update({ where: { noMold }, data: updateData })

    const heaterInfo = d.heaterStd === null
      ? '(tidak pakai heater)'
      : d.heaterStd === undefined
        ? '(cooling only)'
        : `${(d.heaterStd).filter(v => v !== null).length}/${d.heaterStd.length} heater`

    console.log(`  ✅ ${noMold.padEnd(5)} core=${(d.coreStd ?? '-').padStart(5)} cav=${(d.cavStd ?? '-').padStart(5)}  ${heaterInfo}`)
    updated++
  }

  console.log(`\n📊 Selesai!`)
  console.log(`   ✅ Berhasil : ${updated}`)
  console.log(`   ⚠️  Tidak ditemukan : ${notFound}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
