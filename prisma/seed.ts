import { PrismaClient, UserRole, Factory, Shift } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcryptjs'

function createPrisma() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const parsed = new URL(url)
  const adapter = new PrismaMariaDb({
    host: parsed.hostname || 'localhost',
    port: parsed.port ? parseInt(parsed.port, 10) : 3306,
    user: decodeURIComponent(parsed.username || 'root'),
    password: decodeURIComponent(parsed.password || ''),
    database: parsed.pathname ? decodeURIComponent(parsed.pathname.substring(1)) : '',
    connectionLimit: 5,
  })
  return new PrismaClient({ adapter })
}

const prisma = createPrisma()

// ============================================================
// MOLD DATABASE (dari Index_v21.html const MOLD_DB)
// Factory '-' = mold lama/arsip, tidak ada factory aktif
// ============================================================
const MOLD_DATA = [
  // F2
  { no: "813", mc: "-", factory: "F2", shift: "B", part: "COVER FR BUMPER", tonase: "3500T", customer: "ADM", model: "D40D", coreStd: "47.8", cavStd: "52", heaterStd: [32.3,32.6,27.1,26.4,25,25,30.8,103,204,119,201,119,202,90.4,205,90.6] },
  { no: "818", mc: "-", factory: "F2", shift: "B", part: "COVER RR BUMPER (H) SWING)", tonase: "2500T", customer: "ADM", model: "D40D", coreStd: "44.4", cavStd: "48", heaterStd: [48.7,31.9,48.3,33.3,33,61.9,106,201,147,202,121,201,121] },
  { no: "819", mc: "6", factory: "F2", shift: "A", part: "COVER RR BUMPER (V) JUMP", tonase: "2500T", customer: "ADM", model: "D40D", coreStd: "69.7", cavStd: "69.2", heaterStd: [47.6,46.8,38.1,32.5,32.4,49.6,117,204,146,203,123,199,120] },
  { no: "821", mc: "-", factory: "F2", shift: "B", part: "COVER FR BUMPER NO EMBOSS", tonase: "3500T", customer: "ADM", model: "D40D", coreStd: "70.2", cavStd: "69.9", heaterStd: [31.2,31.2,27.1,27.1,24.5,24.5,29.2,206,200,120,211,121,204,68,205,90] },
  { no: "822", mc: "5", factory: "F2", shift: "A", part: "COVER RR BUMPER NO EMBOSS", tonase: "2500T", customer: "ADM", model: "D40D", coreStd: "48.2", cavStd: "42.5", heaterStd: [32.3,26.6,27,26.7,106,183,105,26.6,26.9,26.6,31.8,104,103,106,107] },
  { no: "N16", mc: "5", factory: "F2", shift: "A", part: "BOARD FR DOOR TRIM RH / LH", tonase: "3500T", customer: "ABA", model: "660A", coreStd: "34.1", cavStd: "36.4", heaterStd: [] },
  { no: "N17", mc: "-", factory: "F2", shift: "B", part: "BOARD RR DOOR TRIM RH / LH", tonase: "3500T", customer: "TMMIN", model: "660A", coreStd: "44.4", cavStd: "39.2", heaterStd: [31.4,39.4,33.9,26.9,26.8,206,180,112,27.1,27,34.3,40.1,31.7,113,211,182] },
  { no: "N20", mc: "-", factory: "F2", shift: "B", part: "PANEL ASSY QUARTER TRIM RH", tonase: "2500T", customer: "TMMIN", model: "660A", coreStd: "39.2", cavStd: "40.9", heaterStd: [31.2,31.4,31.3,31.4,31.4,26.2,28.5,31.2,120,158,118,157,118,117,117,118,118] },
  { no: "N21", mc: "4", factory: "F2", shift: "A", part: "PANEL ASSY QTR TRIM LH", tonase: "2500T", customer: "TMMIN", model: "660A", coreStd: "38.6", cavStd: "40.1", heaterStd: [32.5,32.8,32.5,32.3,32.8,40.3,29.4,54.1,119.5,119,117,116,118,159,116,118,117] },
  { no: "N22", mc: "4", factory: "F2", shift: "A", part: "BOARD ASSY BACK DOOR TRIM", tonase: "2500T", customer: "TMMIN", model: "660A", coreStd: "40", cavStd: "11.3", heaterStd: [32.6,32.9,33,27.1,27.3,119,158,117,157,117,157,117] },
  { no: "N35", mc: "4", factory: "F2", shift: "A", part: "PANEL, QUARTER TRIM, RH", tonase: "2500T", customer: "TMMIN", model: "650A", coreStd: "29.7", cavStd: "31.2", heaterStd: [32.6,27.1,32.8,33,28.8,401.4,30.7,119,150,120,118,118,156,118,95.4,89.4] },
  { no: "N36", mc: "-", factory: "F2", shift: "B", part: "PANEL, QUARTER TRIM, LH", tonase: "2500T", customer: "TMMIN", model: "650A", coreStd: "51", cavStd: "50", heaterStd: [31.9,32.2,31.2,32.2,27.3,32.2,35.3,32.2,94.7,117,155,118,119,118,158,120] },
  { no: "N37", mc: "-", factory: "F2", shift: "B", part: "BACK DOOR TRIM (W/O WOOFER),(W/ WOOFER)", tonase: "2500T", customer: "TMMIN", model: "650A", coreStd: "46.2", cavStd: "58.3", heaterStd: [32.2,31.7,32.2,27,26.5,120,119,118,159,117,119,118] },
  { no: "N44", mc: "-", factory: "F2", shift: "B", part: "COVER, RR BUMPER", tonase: "3500T", customer: "ADM", model: "D79L/D52B", coreStd: "37.8", cavStd: "39.2", heaterStd: [26.8,26.2,31.7,26.2,"-",39.5,33.6,31.2,25.8,"-",26.3,26,87.1,97.3,82,"-",157,60.2,145,118,164,78.3,"-","-"] },
  { no: "N45", mc: "2", factory: "F2", shift: "A", part: "PANEL, INSTRUMENT", tonase: "2500T", customer: "ADM", model: "D30D/D79L", coreStd: "37.5", cavStd: "31.5", heaterStd: [26,31,26,31,24.9,31.6,31.5,31.5,26.3,28.5,26.8,156,79.3,156,94.4,157,68.5,66.8,67,153,94.4,66.6,153,79.7] },
  { no: "N59", mc: "B3", factory: "F2", shift: "A", part: "BASE RR DOOR TRIM RH/LH", tonase: "3500T", customer: "ADM", model: "D21N", coreStd: "15.3", cavStd: "16.7", heaterStd: [26.3,31.6,29,36.6,39.7,28.8,31.7,26.3,167,166,168,166,167,165,167,164] },
  { no: "W10", mc: "-", factory: "F2", shift: "B", part: "COVER FR BUMPER", tonase: "3500T", customer: "TMMIN", model: "D03B", coreStd: "-", cavStd: "-", heaterStd: [26.3,26.3,27.1,26.9,29.1,39.3,31.4,26.2,26,26,156,116,155,73.2,154,73.5,156,74.6,149,95.4,163,94.7] },
  { no: "W11", mc: "B2", factory: "F2", shift: "A", part: "COVER FR BUMPER D BRAND", tonase: "3500T", customer: "ADM", model: "D79L", coreStd: "25.8", cavStd: "26.1", heaterStd: [] },
  { no: "W13", mc: "-", factory: "F2", shift: "B", part: "COVER, FR BUMPER (PAINT)", tonase: "3500T", customer: "ADM", model: "D40L", coreStd: "31.8", cavStd: "34.2", heaterStd: [21.7,20.9,20.8,19.6,20.9,21.4,21.9,21.7,21.9,22.1,84.3,64.3,86.6,76.4,86.1,74.6,84.8,84.3,85,75.1,86.1,65.1,54.8] },
  { no: "W14", mc: "B3", factory: "F2", shift: "A", part: "COVER, FR BUMPER (SHIBO)", tonase: "3500T", customer: "ADM", model: "D40L", coreStd: "41.9", cavStd: "43.4", heaterStd: [21.1,20.9,20.4,19.7,20.8,21.6,22.6,21.8,21.6,21.6,67.4,78.3,72.6,90.2,71.4,91.6,68.3,94.1,71.3,92.1,66.4,93.1,54.4] },
  { no: "W24", mc: "-", factory: "F2", shift: "A", part: "CVR RR BUMPER LWR", tonase: "3500T", customer: "TMMIN", model: "655B Hi+", coreStd: "26.7", cavStd: "24.2", heaterStd: [26,26.3,26,26.1,26,26,31.4,26,26,26,158,117,155,116,156,73.6,154,73.7,149,73.9,156,79,156,73.9] },
  { no: "W28", mc: "B2", factory: "F2", shift: "A", part: "COVER FR BUMPER T-BRAND", tonase: "3500T", customer: "ADM", model: "D26A", coreStd: "29.2", cavStd: "30.1", heaterStd: [87.1,20.3,20,19.8,19.9,21.4,21.9,20.3,23.5,23.4,83.4,100,79.5,87.1,80.2,86.1,41,53.3,94] },
  { no: "W29", mc: "-", factory: "F2", shift: "B", part: "COVER FR BUMPER D-BRAND", tonase: "3500T", customer: "ADM", model: "D26A", coreStd: "-", cavStd: "-", heaterStd: [21.7,20.9,20.9,21.7,22.6,20.8,20.9,21,39.4,39.7,42.3,41.6,34.7,38.5,48.2,49.7,81.2,82.4,43.5,82.2,79.8,79.8,83.3,83.3] },
  { no: "W30", mc: "B2", factory: "F2", shift: "A", part: "COVER RR BUMPER STD", tonase: "3500T", customer: "ADM", model: "D26A", coreStd: "16.3", cavStd: "19", heaterStd: [20.1,20.2,20.5,20.2,21,18.9,20.5,20.3,42.1,41.5,41.6,41,73.5,88,36.8,89.2,81.2,43.2,47.8,83.4,84.1,36.7,86.8,87.5] },
  { no: "W37", mc: "3", factory: "F2", shift: "A", part: "FR BOARD DOOR TRIM RH/LH", tonase: "3500T", customer: "ADM", model: "D26A", coreStd: "46.7", cavStd: "34.6", heaterStd: [23.6,23.8,23.6,89,23.6,24,40.5,40,91.6,24.1,39.5,40.5,107,87.7,108,89,84.7,53.9,88.3,90.5,87.9,63.2,87.8,93.9] },
  { no: "W38", mc: "-", factory: "F2", shift: "B", part: "RR BOARD DOOR TRIM RH/LH", tonase: "2500T", customer: "ADM", model: "D26A", coreStd: "59.2", cavStd: "59.9", heaterStd: [68.4,31.2,30.7,31.6,30.9,30.6,31.7,67.4,171,71.9,169,68.1,169,66.9,170,70.8,170,65.4,169] },
  { no: "W43", mc: "-", factory: "F2", shift: "B", part: "BOARD, FR DOOR TRIM RH/LH", tonase: "3500T", customer: "TMMIN", model: "560B", coreStd: "40", cavStd: "30.9", heaterStd: [71.4,34,30.8,32.2,33.3,32.9,33.2,32.2,32.3,31.4,31.9,32.3,32.2,30.5,30.4,41,52.8,53.7,30.5,41.3,30.7,30.5,41.5,30.6,30.2,40.8,30.4,30.6,40.1] },
  { no: "W44", mc: "3", factory: "F2", shift: "A", part: "BOARD, RR DOOR TRIM, RH/LH", tonase: "3500T", customer: "TMMIN", model: "560B", coreStd: "40.8", cavStd: "41.8", heaterStd: [73.2,30.8,32.2,31.2,31,32,31.4,31.2,30.9,31.4,32.1,53.5,53.9,30.3,41.5,53.1,53.4,30.4,41.4,30.6,29.7,41,30.6,29.7] },
  { no: "W45", mc: "-", factory: "F2", shift: "B", part: "PANEL, QURTER TRIM, RH", tonase: "2500T", customer: "TMMIN", model: "560B", coreStd: "40.8", cavStd: "24.8", heaterStd: [64.6,46.3,47,40,40,50.4,40.2,40,82.1,74.4,80,35.5,76.7,33.7,80.5,35.2,79.4,34.8,81.6,34.2] },
  { no: "W46", mc: "7", factory: "F2", shift: "A", part: "PANEL, QUARTER TRIM,LH", tonase: "2500T", customer: "TMMIN", model: "560B", coreStd: "40.2", cavStd: "27.7", heaterStd: [79.7,24,20.8,21.9,24.3,21.6,79,64.4,87.5,78.7,63.3,87.4,80.3,65.6,85.3,78.7,63.9,72,80.9,64.4,85.9,79.6,63.6,72.6] },
  { no: "W48", mc: "7", factory: "F2", shift: "A", part: "BOARD BACK DOOR TRIM", tonase: "3500T", customer: "TMMIN", model: "560B", coreStd: "43.2", cavStd: "40.6", heaterStd: [93.2,37.1,38.2,37.1,41.9,81.1,62.4,86.1,80.4,65.9,85.4,79.5,66,85.7,78.1,65.3,85.1,82,65.4,85.1,82.6,72.1,85.9] },
  { no: "W50", mc: "-", factory: "F2", shift: "B", part: "BOARD QTR TRIM RR RH/LH, COVER,QTR TRIM RH", tonase: "3500T", customer: "ADM", model: "D74A", coreStd: "40.8", cavStd: "42.5", heaterStd: [90.9,37.4,37.8,42.7,39.6,41.9,46.9,46.1,47.3,42.8,42.8,39.6,78.9,43.1,47,39.7,84.1,31.6,81,31.4,82.2,30.6,83.3,31.5] },
  { no: "W51", mc: "1", factory: "F2", shift: "A", part: "BOARD, RR DOOR TRIM, RH/LH", tonase: "3500T", customer: "ADM", model: "D74A", coreStd: "40", cavStd: "37", heaterStd: [61.5,20.8,22,21.2,27.3,21.4,21.7,21.1,42.1,31.1,80.8,36.7,31.7,81,35.5,30.9,"-",36.8,32.7,79.7,81.2,80.1,79.4,79.9] },
  { no: "W56", mc: "8", factory: "F2", shift: "A", part: "PANEL, QUARTER TRIM, RR LH", tonase: "3500T", customer: "TMMIN", model: "D03B", coreStd: "46.1", cavStd: "45.4", heaterStd: [91.1,46.3,42.5,45.3,39.2,53.2,39,30.1,39.1,53.3,39,36.5,81.8,32.2,81.4,39.7,80.8,35.1,80.4,102,104,60.3,79.2] },
  // F3
  { no: "361", mc: "14", factory: "F3", shift: "A", part: "POLYBOX", tonase: "-", customer: "SUGITY", model: "-", coreStd: "25", cavStd: "24.2", heaterStd: [] },
  { no: "953", mc: "-", factory: "F3", shift: "B", part: "RR COOLER UPPER CASE", tonase: "1300T", customer: "ADM", model: "D14L", coreStd: "14.7", cavStd: "13.4", heaterStd: [] },
  { no: "961", mc: "3", factory: "F3", shift: "A", part: "GRILLE RADIATOR LWR (PAINT)", tonase: "1050T", customer: "TMMIN", model: "660A", coreStd: "21.5", cavStd: "27.5", heaterStd: [31.9,39.5,29,31.9,28,31.4,39.5,28.8,78.6,58.3,77.1,58.1,157,118,152,154] },
  { no: "962", mc: "4", factory: "F3", shift: "A", part: "PANEL, INSTRUMENT PANEL FINISH, UPR (LHD)", tonase: "1050T", customer: "TMMIN", model: "660A", coreStd: "12.2", cavStd: "15", heaterStd: [32,32.1,37.2,32,32.2,156,150,152,152,151,151] },
  { no: "963", mc: "3", factory: "F3", shift: "A", part: "PANEL ISTRUMENT PNL FINISH UPR LHD (RESIN)", tonase: "1050T", customer: "TMMIN", model: "660A", coreStd: "22", cavStd: "22.5", heaterStd: [32.4,33,32.8,35.3,32.2,157,154,152,154,155,155] },
  { no: "K49", mc: "13", factory: "F3", shift: "A", part: "DOOR, GLOVE COMPARTMENT, OUTER (RHD)", tonase: "650T", customer: "TMMIN", model: "660A", coreStd: "22.3", cavStd: "19.4", heaterStd: [42.5,43.1,168,253] },
  { no: "N15", mc: "-", factory: "F3", shift: "B", part: "BOARD S/A FR DOOR TRIM RH/LH", tonase: "1600T", customer: "TMMIN", model: "660A", coreStd: "23.5", cavStd: "22.5", heaterStd: [26.8,39.7,31.7,204,347,203,348] },
  { no: "N27", mc: "7", factory: "F3", shift: "A", part: "BOARD DECK TRIM SIDE LH", tonase: "2500T", customer: "ADM", model: "D30D/D79L", coreStd: "23", cavStd: "33", heaterStd: [40.4,40.5,157,206,156,220] },
  { no: "N28", mc: "5", factory: "F3", shift: "A", part: "COVER FR DOOR TRIM LWR, RH/LH", tonase: "3500T", customer: "TMMIN", model: "650A", coreStd: "36", cavStd: "38.2", heaterStd: [31.7,31.6,31.5,31.4,32.3,52.7,31.3,153,117,154,152,153,155,153,118] },
  { no: "N60", mc: "-", factory: "F3", shift: "B", part: "PANEL INSTRUMENT (RHD)", tonase: "2500T", customer: "ADM", model: "D14N", coreStd: "21.7", cavStd: "24", heaterStd: [31.7,28.8,29,31.7,28.8,35,31.5,39.2,28.8,31.7,154,117,76.7,58.5,154,117] },
  { no: "N61", mc: "2", factory: "F3", shift: "A", part: "GARNISH ROOF SIDE, INNER, RH/LH (STD)", tonase: "2500T", customer: "ADM", model: "D14N", coreStd: "20.1", cavStd: "20.9", heaterStd: [24.4,27.1,27,24.9,27.2,27.3,76.3,175,69.3,174,68.3,174,69.1,49.8,87.6,34.1] },
  { no: "N62", mc: "10", factory: "F3", shift: "A", part: "PANEL INSTRUMENT (LHD)", tonase: "3500T", customer: "ADM", model: "D14N", coreStd: "25", cavStd: "24.2", heaterStd: [31,26.1,13.3,15.8,15.1,14.9,156.1,31.9,79.1,59.1,179,36.8,152,154,152,155] },
  { no: "Q02", mc: "6", factory: "F3", shift: "A", part: "GRILLE, RADIATOR (LOW-GRADE)", tonase: "1300T", customer: "TMMIN", model: "660A", coreStd: "22.7", cavStd: "12", heaterStd: [63.7,39.7,31.7,53.7,40.1,153,118,152,154,153,118,246] },
  { no: "Q37", mc: "6", factory: "F3", shift: "A", part: "GRILLE T BRAND", tonase: "1600T", customer: "ADM", model: "D26A", coreStd: "32", cavStd: "28.5", heaterStd: [70.3,32.7,31.7,31.4,32.7,32.4,32.6,31.8,32.2,32.5,71.2,171,94.2,169,72.2,166,93.5,167,70.5,163,70.3,165,94.5,171] },
  { no: "Q46", mc: "3", factory: "F3", shift: "A", part: "GARNISH, BACK DOOR, OUTSIDE (STD)", tonase: "1300T", customer: "ADM", model: "D26A", coreStd: "5.8", cavStd: "5.8", heaterStd: [215.7,93.7,276.9,95.7,54.6,286.6,95.5,217,93.9,33.1,31.7,32.8,66.8] },
  { no: "Q50", mc: "-", factory: "F3", shift: "B", part: "INSTRUMENT PANEL RHD", tonase: "1600T", customer: "ADM", model: "D26A", coreStd: "17.4", cavStd: "20", heaterStd: [22.6,20.9,19.4,11.5,16.1,19.7,10.7,19.5,18.3,31.8,12.4,22.1,22.2,26,18.7,25] },
  { no: "Q56", mc: "-", factory: "F3", shift: "B", part: "PANEL INSTRUMENT (RHD)", tonase: "2500T", customer: "TMMIN", model: "D55L", coreStd: "18.9", cavStd: "19.7", heaterStd: [15.8,19.2,18.1,18.7,13.7,20.5,31.4,41.7,86.7,42.1,85.1,84.4,85.2,81.7,84.7,87.5] },
  { no: "Q57", mc: "9", factory: "F3", shift: "A", part: "PANEL INSTRUMENT (LHD)", tonase: "1600T", customer: "ADM", model: "D55L", coreStd: "18.2", cavStd: "21", heaterStd: [19.5,19.1,18.2,13.6,13.6,21.1,47,40.9,83.2,41.9,85.1,82.6,87.3,82,81.4,86.1] },
  { no: "T37", mc: "-", factory: "F3", shift: "B", part: "GRILLE RADIATOR T-BRAND", tonase: "650T", customer: "ADM", model: "D79L", coreStd: "16.2", cavStd: "16.3", heaterStd: [91.5,22.4,31.2,21.8,82.9,208,55.1,87.9,101,82.7,106] },
  { no: "T38", mc: "14", factory: "F3", shift: "A", part: "GRILLE RADIATOR D-BRAND", tonase: "650T", customer: "ADM", model: "D79L", coreStd: "16", cavStd: "19.2", heaterStd: [92,21.3,22.8,30.8,20.8,80,210,54.6,87.6,122,85.9,116] },
  { no: "Y26", mc: "-", factory: "F3", shift: "B", part: "DOOR, GLOVE COMPARTMENT, OUTER RHD", tonase: "650T", customer: "TMMIN", model: "560B", coreStd: "10.3", cavStd: "14.2", heaterStd: [22,50.4] },
  { no: "Y27", mc: "13", factory: "F3", shift: "A", part: "DOOR, GLOVE COMPARTMENT, INNER RHD", tonase: "650T", customer: "TMMIN", model: "560B", coreStd: "11.1", cavStd: "22", heaterStd: [92.6,24.2,23.9,79.7,129,79.2,128] },
  { no: "Y32", mc: "-", factory: "F3", shift: "B", part: "GRILLE RADIATOR UPR (PAINT)", tonase: "650T", customer: "ADM", model: "D52B", coreStd: "12.7", cavStd: "6.8", heaterStd: [91.7,21.8,21.7,22.9,21.4,21.7,82,116,80.2,103,80,138,80.2,103,80.4,119] },
  // F4
  { no: "324", mc: "-", factory: "F4", shift: "A", part: "GRIP ASSY,DOOR ASSIST,RH", tonase: "350T", customer: "SUGITY", model: "913L", coreStd: "5.4", cavStd: "4.6", heaterStd: [] },
  { no: "P16", mc: "-", factory: "F4", shift: "A", part: "MOULDING, RR DOOR BELT, RR RH/LH", tonase: "170T", customer: "TMMIN", model: "650A", coreStd: "13.2", cavStd: "11.9", heaterStd: [] },
  { no: "R26", mc: "-", factory: "F4", shift: "A", part: "PNL INSTRUMENT PNL FIN LWR CENTER LHD", tonase: "350T", customer: "TMMIN", model: "660A", coreStd: "14.8", cavStd: "13.7", heaterStd: [] },
  { no: "R31", mc: "-", factory: "F4", shift: "A", part: "PANEL INSTRUMENT SIDE RH/LH", tonase: "350T", customer: "TMMIN", model: "660A", coreStd: "8.4", cavStd: "7.9", heaterStd: [] },
  { no: "U60", mc: "-", factory: "F4", shift: "A", part: "MOULDING FR BUMPER SIDE RH/LH T-BRAND", tonase: "350T", customer: "ADM", model: "D79L", coreStd: "-", cavStd: "-", heaterStd: [] },
]

// Mapping factory string ke Prisma enum
function toFactory(f: string): Factory {
  if (f === 'F2') return 'F2'
  if (f === 'F3') return 'F3'
  if (f === 'F4') return 'F4'
  return 'F2' // default
}

// Mapping shift ke Prisma enum
function toShift(s: string): Shift | undefined {
  if (s === 'A' || s === 'Shift A') return 'Shift_A'
  if (s === 'B' || s === 'Shift B') return 'Shift_B'
  if (s === 'Nonshift') return 'Nonshift'
  return undefined
}

async function main() {
  console.log('🌱 Seeding database...')

  // ============================================================
  // 1. Seed Users (akun awal)
  // ============================================================
  console.log('👤 Seeding users...')

  const PIC_SHIFT_GROUPS = {
    'Nonshift': [
      "Abdulloh", "Agung Tjipto R", "Romas Kardiansah", "Fathan Majid", "Ahmad Sani",
      "Marcellino Nugraha Putra", "Diky Hermawan", "Muchamad Aldi Saputra", "Achmad Danary Pujangga"
    ],
    'Shift A': [
      "Mariana Edhi S.", "Aris Susanto", "Tantan Rustandi", "Endang Rahmat",
      "Prasetyo Syabandi Setiawan", "Faisal Ahmad Ihksanudin", "Fauzi Dwi Arianto"
    ],
    'Shift B': [
      "Catur Setiawan", "Yulius Wibowo", "Bagas Tri Wijayanto", "Yudha Pangestu Wibowo",
      "Sahattua", "Septian Yoga Irawan", "Rahmat Imam Thabrani"
    ]
  }

  const users = [
    { nama: 'Administrator', username: 'admin', password: 'admin123', role: 'ADM' as UserRole, factory: 'F2' as Factory, shift: 'Nonshift' as Shift, nik: '1234567890123456', tempatLahir: 'Jakarta', tanggalLahir: new Date('1990-01-01') },
    { nama: 'Group Leader F2', username: 'gl_f2', password: 'gl123', role: 'GL' as UserRole, factory: 'F2' as Factory, shift: 'Nonshift' as Shift, nik: '1234567890123457', tempatLahir: 'Bandung', tanggalLahir: new Date('1988-06-15') },
    { nama: 'Team Leader A', username: 'tl_a', password: 'tl123', role: 'TL' as UserRole, factory: 'F2' as Factory, shift: 'Shift_A' as Shift, nik: '1234567890123458', tempatLahir: 'Surabaya', tanggalLahir: new Date('1992-03-20') },
    { nama: 'Team Leader B', username: 'tl_b', password: 'tl123', role: 'TL' as UserRole, factory: 'F2' as Factory, shift: 'Shift_B' as Shift, nik: '1234567890123459', tempatLahir: 'Semarang', tanggalLahir: new Date('1993-07-10') },
  ]

  let nikCounter = 100
  Object.entries(PIC_SHIFT_GROUPS).forEach(([shiftName, names]) => {
    names.forEach((name) => {
      const username = name.toLowerCase().replace(/[^a-z0-9]/g, '')
      const prismaShift = shiftName === 'Shift A' ? 'Shift_A' : shiftName === 'Shift B' ? 'Shift_B' : 'Nonshift'
      users.push({
        nama: name,
        username,
        password: 'pic123',
        role: 'PIC' as UserRole,
        factory: 'F2' as Factory,
        shift: prismaShift as Shift,
        nik: `1234567890123${nikCounter++}`,
        tempatLahir: 'Bekasi',
        tanggalLahir: new Date('1995-01-01'),
      })
    })
  })


  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10)
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        nama: u.nama,
        username: u.username,
        passwordHash: hash,
        role: u.role,
        factory: u.factory,
        shift: u.shift,
        nik: u.nik,
        tempatLahir: u.tempatLahir,
        tanggalLahir: u.tanggalLahir,
      },
    })
  }
  console.log(`✅ ${users.length} users seeded`)

  // ============================================================
  // 2. Seed Mold Book
  // ============================================================
  console.log('📚 Seeding mold book...')

  let moldCount = 0
  for (const m of MOLD_DATA) {
    const factory = toFactory(m.factory)
    const shift = toShift(m.shift)

    await prisma.moldBook.upsert({
      where: { noMold: m.no },
      update: {
        mc: String(m.mc),
        part: m.part,
        tonase: m.tonase,
        customer: m.customer,
        model: m.model,
        coreStd: String(m.coreStd),
        cavStd: String(m.cavStd),
        heaterStd: m.heaterStd as any,
        factory,
      },
      create: {
        noMold: m.no,
        mc: String(m.mc),
        factory,
        part: m.part,
        tonase: m.tonase,
        customer: m.customer,
        model: m.model,
        coreStd: String(m.coreStd),
        cavStd: String(m.cavStd),
        heaterStd: m.heaterStd as any,
      },
    })
    moldCount++
  }
  console.log(`✅ ${moldCount} molds seeded`)

  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
