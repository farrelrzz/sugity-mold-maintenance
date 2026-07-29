import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const users = [
    { nama: 'FARIED MUSTHOFA', nik: '26700406', shift: 'Nonshift' },
    { nama: 'HARYONO', nik: '10970301', shift: 'Nonshift' },
    { nama: 'EKO SAPUTRO', nik: '27450606', shift: 'Nonshift' },
    { nama: 'ABDULLOH', nik: '4630297', shift: 'Nonshift' },
    { nama: 'AGUNG TJIPTO R', nik: '13710502', shift: 'Nonshift' },
    { nama: 'ROMAS KARDIANSAH', nik: '33520408', shift: 'Nonshift' },
    { nama: 'FATHAN MAJID', nik: '56470213', shift: 'Nonshift' },
    { nama: 'AHMAD SANI', nik: '80470719', shift: 'Nonshift' },
    { nama: 'TRIO IRWANTO WARDOYO', nik: '51470812', shift: 'Nonshift' },
    { nama: 'MARCELLINO NUGRAHA PUTRA', nik: '6620526', shift: 'Nonshift' },
    { nama: 'DIKY HERMAWAN', nik: '6640526', shift: 'Nonshift' },
    { nama: 'MUCHAMAD ALDI SAPUTRA', nik: '2650823', shift: 'Nonshift' },
    { nama: 'ACHMAD DANARY PUJANGGA', nik: '2610823', shift: 'Nonshift' },
    { nama: 'MARIANA EDHI S.', nik: '27460606', shift: 'Shift_A' },
    { nama: 'ARIS SUSANTO', nik: '53271012', shift: 'Shift_A' },
    { nama: 'TANTAN RUSTANDI', nik: '75300917', shift: 'Shift_A' },
    { nama: 'ENDANG RAHMAT', nik: '3150224', shift: 'Shift_A' },
    { nama: 'PRASETYO SYABANDI SETIAWAN', nik: '4681224', shift: 'Shift_A' },
    { nama: 'FAISAL AHMAD IKHSANUDIN', nik: '2791123', shift: 'Shift_A' },
    { nama: 'FAUZI DWI ARIANTO', nik: '5690925', shift: 'Shift_A' },
    { nama: 'CATUR SETIAWAN', nik: null, shift: 'Shift_B' },
    { nama: 'YULIUS WIBOWO', nik: null, shift: 'Shift_B' },
    { nama: 'BAGAS TRI WIJAYANTO', nik: null, shift: 'Shift_B' },
    { nama: 'YUDHA PANGESTU WIBOWO', nik: null, shift: 'Shift_B' },
    { nama: 'SAHATTUA', nik: null, shift: 'Shift_B' },
    { nama: 'SEPTIAN YOGA IRAWAN', nik: null, shift: 'Shift_B' },
    { nama: 'RAHMAT IMAM THABRANI', nik: null, shift: 'Shift_B' }
  ];

  for (const u of users) {
    const username = u.nama.toLowerCase().replace(/ /g, '.').substring(0, 50);
    // password default 'password123'
    const passwordHash = '$2b$10$EP4kS52Vq5q84zX0.YvI8ebM5J/QdG.Q6o2.vL4Xv0v34b07P/X7O';

    // Check if exists
    const existing = await prisma.user.findFirst({ where: { username } })
    if (!existing) {
      await prisma.user.create({
        data: {
          nama: u.nama,
          username,
          passwordHash: passwordHash,
          role: 'PIC',
          factory: 'F1',
          shift: u.shift as any,
          nik: u.nik
        }
      })
      console.log('Created', u.nama)
    } else {
      console.log('Exists', u.nama)
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect())
