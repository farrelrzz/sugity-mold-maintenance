import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TIDB_URL = 'mysql://2UVNBvRtUAd5zyR.root:vFEouGzVawSvJ0hP@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/sugity?sslaccept=strict&connect_timeout=30'

function createPrisma() {
  const parsed = new URL(TIDB_URL)
  const adapter = new PrismaMariaDb({
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : 4000,
    user: decodeURIComponent(parsed.username || 'root'),
    password: decodeURIComponent(parsed.password || ''),
    database: parsed.pathname ? decodeURIComponent(parsed.pathname.substring(1)) : 'sugity',
    connectionLimit: 10,
    connectTimeout: 30000,
    ssl: { rejectUnauthorized: false },
  } as any)
  return new PrismaClient({ adapter })
}

const prisma = createPrisma()

interface MoldUpdateData {
  noMold: string;
  part: string;
  model?: string;
  customer?: string;
  tonase?: string;
  coreStd?: string | null;
  cavStd?: string | null;
  heaterStd?: (number | string)[];
}

const batch1Data: MoldUpdateData[] = [
  {
    noMold: "361",
    part: "POLYBOX",
    customer: "SUGITY",
    coreStd: "25",
    cavStd: "24.2",
    heaterStd: []
  },
  {
    noMold: "813",
    part: "COVER FR BUMPER",
    model: "D40D",
    customer: "ADM",
    tonase: "3500T",
    coreStd: "47.8",
    cavStd: "52",
    heaterStd: [32.3, 32.6, 27.1, 26.4, 25, 25, 30.8, 103, 204, 119, 201, 119, 202, 90.4, 205, 90.6]
  },
  {
    noMold: "818",
    part: "COVER FR BUMPER ( H ) ( SWING )",
    model: "D40D",
    customer: "ADM",
    tonase: "2500T",
    coreStd: "44.4",
    cavStd: "48",
    heaterStd: [48.7, 31.9, 48.3, 33.3, 33, 61.9, 106, 201, 147, 202, 121, 201, 121]
  },
  {
    noMold: "819",
    part: "COVER RR BUMPER ( V ) JUMP",
    model: "D40D",
    customer: "ADM",
    tonase: "2500T",
    coreStd: "69.7",
    cavStd: "69.2",
    heaterStd: [47.6, 46.8, 38.1, 32.5, 32.4, 49.6, 117.0, 204, 146, 203, 123, 199, 120]
  },
  {
    noMold: "821",
    part: "COVER FR BUMPER NO EMBOSS",
    model: "D40D",
    customer: "ADM",
    tonase: "3500T",
    coreStd: "70.2",
    cavStd: "69.9",
    heaterStd: [31.2, 31.2, 27.1, 27.1, 24.5, 24.5, 29.2, 206, 200, 120, 211, 121, 204, 68, 205, 90]
  },
  {
    noMold: "822",
    part: "COVER RR BUMPER NO EMBOSS",
    model: "D40D",
    customer: "ADM",
    tonase: "2500T",
    coreStd: "48.2",
    cavStd: "42.5",
    heaterStd: [32.3, 26.6, 27.0, 26.7, 106, 183, 105, 26.6, 26.9, 26.6, 31.8, 104, 103, 106, 107]
  },
  {
    noMold: "953",
    part: "RR COOLER UPPER CASE",
    model: "D14L",
    customer: "ADM",
    tonase: "1300T",
    coreStd: "14.7",
    cavStd: "13.4",
    heaterStd: []
  },
  {
    noMold: "961",
    part: "GRILLE RADIATOR LOWER ( PAINT )",
    model: "660A",
    customer: "TMMIN",
    tonase: "1050T",
    coreStd: "21.5",
    cavStd: "27.5",
    heaterStd: [31.9, 39.5, 29, 31.9, 28, 31.4, 39.5, 28.8, 78.6, 58.3, 77.1, 58.1, 157, 118, 152, 154]
  },
  {
    noMold: "962",
    part: "PANEL INSTRUMENT PANEL FINISH UPPER LHD",
    model: "660A",
    customer: "TMMIN",
    tonase: "1050T",
    coreStd: "12.2",
    cavStd: "15",
    heaterStd: [32, 32.1, 37.2, 32, 32.2, 156, 150, 152, 152, 151, 151]
  },
  {
    noMold: "963",
    part: "PANEL INSTRUMENT PANEL FINISH UPPER LHD ( RESIN )",
    model: "660A",
    customer: "TMMIN",
    tonase: "1050T",
    coreStd: "22",
    cavStd: "22.5",
    heaterStd: [32.4, 33, 32.8, 35.3, 32.2, 157, 154, 152, 154, 155, 155]
  },
  {
    noMold: "K49",
    part: "DOOR GLOVE COMPARTMENT OUTER RHD",
    model: "660A",
    customer: "TMMIN",
    tonase: "650T",
    coreStd: "22.3",
    cavStd: "19.4",
    heaterStd: [42.5, 43.1, 168, 253]
  },
  {
    noMold: "K50",
    part: "DOOR GLOVE COMPARTMENT OUTER LHD",
    model: "660A",
    customer: "TMMIN",
    tonase: "650T",
    coreStd: "19.6",
    cavStd: "13.3",
    heaterStd: [42.5, 42, 169, 285]
  },
  {
    noMold: "K51",
    part: "DOOR GLOVE COMPARTMENT OUTER RHD",
    model: "660A",
    customer: "TMMIN",
    tonase: "650T",
    coreStd: "8.8",
    cavStd: "12",
    heaterStd: [40.2, 40.5, 162, 219, 165, 216]
  },
  {
    noMold: "K52",
    part: "DOOR GLOVE COMPARTMENT INNER LHD",
    model: "660A",
    customer: "TMMIN",
    tonase: "650T",
    coreStd: "9",
    cavStd: "18.9",
    heaterStd: [42.5, 42, 165, 285, 156]
  },
  {
    noMold: "N15",
    part: "BOARD S/A FR DOOR TRIM RH/LH",
    model: "660A",
    customer: "TMMIN",
    tonase: "1600T",
    coreStd: "23.5",
    cavStd: "22.5",
    heaterStd: [26.8, 39.7, 31.7, 204, 347, 203, 348]
  },
  {
    noMold: "N16",
    part: "BOARD FR DOOR TRIM RH/LH",
    model: "660A",
    customer: "TMMIN",
    tonase: "3500T",
    coreStd: "34.1",
    cavStd: "36.4",
    heaterStd: []
  },
  {
    noMold: "N17",
    part: "BOARD RR DOOR TRIM RH/LH",
    model: "660A",
    customer: "TMMIN",
    tonase: "3500T",
    coreStd: "44.4",
    cavStd: "39.2",
    heaterStd: [31.4, 39.4, 33.9, 26.9, 26.8, 206, 180, 112, 27.1, 27, 34.3, 40.1, 31.7, 113, 211, 182]
  },
  {
    noMold: "N20",
    part: "PANEL ASSY QUARTER TRIM RH",
    model: "660A",
    customer: "TMMIN",
    tonase: "2500T",
    coreStd: "39.2",
    cavStd: "40.9",
    heaterStd: [31.2, 31.4, 31.3, 31.4, 31.4, 26.2, 28.5, 31.2, 120, 158, 118, 157, 118, 117, 117, 118, 118]
  },
  {
    noMold: "N21",
    part: "PANEL ASSY QUARTER TRIM LH",
    model: "660A",
    customer: "TMMIN",
    tonase: "2500T",
    coreStd: "38.6",
    cavStd: "40.1",
    heaterStd: [32.5, 32.8, 32.5, 32.3, 32.8, 40.3, 29.4, 54.1, 119.5, 119, 117, 116, 118, 159, 116, 118, 117]
  },
  {
    noMold: "N22",
    part: "BOARD ASSY BACK DOOR TRIM",
    model: "660A",
    customer: "TMMIN",
    tonase: "2500T",
    coreStd: "40",
    cavStd: "11.3",
    heaterStd: [32.6, 32.9, 33, 27.1, 27.3, 119, 158, 117, 157, 117, 157, 117]
  },
  {
    noMold: "N26",
    part: "BOARD FR DOOR TRIM SIDE RH",
    model: "D30D/D79L",
    customer: "ADM",
    tonase: "2500T",
    coreStd: "18.2",
    cavStd: "12.3",
    heaterStd: [74.5, 24.7, 34.6, 23, 23.9, 27.8, 170, 100, 94.5, 125, 119, 112, 126, 123, 108, 'XXX', 'XXX', 'XXX', 172, 121, 110, 169, 101, 108]
  },
  {
    noMold: "N27",
    part: "BOARD DECK TRIM SIDE LH",
    model: "D30D/D79L",
    customer: "ADM",
    tonase: "2500T",
    coreStd: "23",
    cavStd: "33",
    heaterStd: [40.4, 40.5, 157, 206, 156, 220]
  },
  {
    noMold: "N28",
    part: "COVER FR DOOR TRIM LOWER RH/LH",
    model: "650A",
    customer: "TMMIN",
    tonase: "3500T",
    coreStd: "36",
    cavStd: "38.2",
    heaterStd: [31.7, 31.6, 31.5, 31.4, 32.3, 52.7, 31.3, 153, 117, 154, 152, 153, 155, 153, 118]
  },
  {
    noMold: "N29",
    part: "BOARD RR DOOR TRIM LOWER RH/LH",
    model: "650A",
    customer: "TMMIN",
    tonase: "3500T",
    coreStd: "21.1",
    cavStd: "21.5",
    heaterStd: [32, 31.6, 31.7, 31.7, 26.7, 68.1, 26.5, 154, 81.3, 154, 117, 152, 118, 152, 81.3]
  },
  {
    noMold: "N35",
    part: "PANEL QUARTER TRIM RH",
    model: "650A",
    customer: "TMMIN",
    tonase: "2500T",
    coreStd: "29.7",
    cavStd: "31.2",
    heaterStd: [32.6, 27.1, 32.8, 33, 28.8, 401.4, 30.7, 119, 150, 120, 118, 118, 156, 118, 95.4, 89.4]
  },
  {
    noMold: "N36",
    part: "PANEL QUARTER TRIM LH",
    model: "650A",
    customer: "TMMIN",
    tonase: "2500T",
    coreStd: "51",
    cavStd: "50",
    heaterStd: [31.9, 32.2, 31.2, 32.2, 27.3, 32.2, 35.3, 32.2, 94.7, 117, 155, 118, 119, 118, 158, 120]
  },
  {
    noMold: "N37",
    part: "BACK DOOR TRIM ( W/O WOOFER ) ( W/WOOFER )",
    model: "650A",
    customer: "TMMIN",
    tonase: "2500T",
    coreStd: "46.2",
    cavStd: "58.3",
    heaterStd: [32.2, 31.7, 32.2, 27, 26.5, 120, 119, 118, 159, 117, 119, 118]
  },
  {
    noMold: "N44",
    part: "COVER RR BUMPER",
    model: "D79L/D52B",
    customer: "ADM",
    tonase: "3500T",
    coreStd: "37.8",
    cavStd: "39.2",
    heaterStd: [26.8, 26.2, 31.7, 26.2, 'XXX', 39.5, 33.6, 31.2, 25.8, 'XXX', 26.3, 26, 87.1, 97.3, 82, 'XXX', 157, 60.2, 145, 118, 164, 78.3, 'XXX', 'XXX']
  },
  {
    noMold: "N45",
    part: "PANEL INSTRUMENT",
    model: "D30D/D79L",
    customer: "ADM",
    tonase: "2500T",
    coreStd: "37.5",
    cavStd: "31.5",
    heaterStd: [26, 31, 26, 31, 24.9, 31.6, 31.5, 31.5, 26.3, 28.5, 26.8, 156, 79.3, 156, 94.4, 157, 68.5, 66.8, 67, 153, 94.4, 66.6, 153, 79.7]
  },
  {
    noMold: "N59",
    part: "BASE RR DOOR TRIM RH/LH",
    model: "D21N",
    customer: "ADM",
    tonase: "3500T",
    coreStd: "15.3",
    cavStd: "16.7",
    heaterStd: [26.3, 31.6, 29, 36.6, 39.7, 28.8, 31.7, 26.3, 167, 166, 168, 166, 167, 165, 167, 164]
  },
  {
    noMold: "N60",
    part: "PANEL INSTRUMENT RHD",
    model: "D14N",
    customer: "ADM",
    tonase: "2500T",
    coreStd: "21.7",
    cavStd: "24",
    heaterStd: [31.7, 28.8, 29, 31.7, 28.8, 35, 31.5, 39.2, 28.8, 31.7, 154, 117, 76.7, 58.5, 154, 117, 154, 95, 155, 94, 153, 79, 155, 117]
  },
  {
    noMold: "N61",
    part: "GARNISH ROOF SIDE INNER RH/LH ( STD )",
    model: "D14N",
    customer: "ADM",
    tonase: "2500T",
    coreStd: "20.1",
    cavStd: "20.9",
    heaterStd: [24.4, 27.1, 27, 24.9, 27.2, 27.3, 76.3, 175, 69.3, 174, 68.3, 174, 69.1, 49.8, 87.6, 34.1]
  },
  {
    noMold: "N62",
    part: "PANEL INSTRUMENT LHD",
    model: "D14N",
    customer: "ADM",
    tonase: "3500T",
    coreStd: "21.7",
    cavStd: "24",
    heaterStd: [31, 26.1, 13.3, 15.8, 15.1, 14.9, 156.1, 31.9, 79.1, 59.1, 179, 36.8, 152, 154, 152, 155]
  },
  {
    noMold: "Q02",
    part: "GRILLE RADIATOR ( LOW-GRADE )",
    model: "660A",
    customer: "TMMIN",
    tonase: "1300T",
    coreStd: "22.7",
    cavStd: "12",
    heaterStd: [63.7, 39.7, 31.7, 53.7, 40.1, 153, 118, 152, 154, 153, 118, 246]
  },
  {
    noMold: "Q12",
    part: "BOARD FR DOOR TRIM UPPER RH/LH",
    model: "650A",
    customer: "TMMIN",
    tonase: "1300T",
    coreStd: "7.6",
    cavStd: "15.2",
    heaterStd: [39.3, 29.7, 39.8, 151, 154, 154, 154]
  },
  {
    noMold: "Q16",
    part: "COVER RR BUMPER LOWER",
    model: "650A",
    customer: "TMMIN",
    tonase: "1300T",
    coreStd: "18.6",
    cavStd: "23",
    heaterStd: [99.3, 22.9, 22.4, 22.1, 55.8, 54.2, 52.4]
  },
  {
    noMold: "Q31",
    part: "DOOR ASSY GLOVE COMPARTMENT",
    model: "D55L",
    customer: "ADM",
    tonase: "1300T",
    coreStd: "15.3",
    cavStd: "19.3",
    heaterStd: [136, 90.2, 26, 21.5, 94.8, 91.3, 74.1, 90.7, 72.1, 93.6]
  },
  {
    noMold: "Q37",
    part: "GRILLE RADIATOR T-BRAND",
    model: "D26A",
    customer: "ADM",
    tonase: "1600T",
    coreStd: "32",
    cavStd: "28.5",
    heaterStd: [70.3, 32.7, 31.7, 31.4, 32.7, 32.4, 32.6, 31.8, 32.2, 32.5, 71.2, 171, 94.2, 169, 72.2, 166, 93.5, 167, 70.5, 163, 70.3, 165, 94.5, 171]
  },
  {
    noMold: "Q38",
    part: "GRILLE RADIATOR AERO",
    model: "D26A",
    customer: "ADM",
    tonase: "1300T",
    coreStd: "22.8",
    cavStd: "24.8",
    heaterStd: [81.3, 32.9, 33.3, 32.9, 33.6, 32.9, 32.7, 32.9, 33, 71.7, 169, 68.2, 170, 68.2, 171, 67.9, 170]
  },
  {
    noMold: "Q40",
    part: "FR- RR BUMPER GARNISH LOWER ( GRAIN )",
    model: "3K6A",
    customer: "HPM",
    tonase: "1300T",
    coreStd: "16.3",
    cavStd: "18.6",
    heaterStd: [90.8, 36.1, 31.2, 36, 36, 36.8, 36.6, 30.7, 30, 39.2, 53.1, 62, 38.1, 40, 53.2, 45.3]
  },
  {
    noMold: "Q41",
    part: "FR-RR BUMPER GARNISH LOWER ( PAINT )",
    model: "3K6A",
    customer: "HPM",
    tonase: "1300T",
    coreStd: "16",
    cavStd: "18",
    heaterStd: [93.7, 36.1, 30.9, 387, 34.8, 36.3, 73.7, 30.9, 30.9, 39.5, 52.6, 61.2, 39, 39.6, 52.9, 45.8]
  },
  {
    noMold: "Q42",
    part: "DOOR ASSY GLOVE COMPARTMENT RHD",
    model: "D26A",
    customer: "ADM",
    tonase: "1300T",
    coreStd: "22.9",
    cavStd: "22.5",
    heaterStd: [94.2, 29.1, 23.6, 26.5, 86.1, 94.2, 89.1, 126, 86.3, 96.8]
  },
  {
    noMold: "Q43",
    part: "DOOR ASSY GLOVE COMPARTMENT LHD",
    model: "D26A",
    customer: "ADM",
    tonase: "1300T",
    coreStd: "10.7",
    cavStd: "12.8",
    heaterStd: [94.3, 28.9, 23.9, 26, 81.8, 93.5, 84.6, 126, 85.2, 94]
  },
  {
    noMold: "Q46",
    part: "GARNISH BACK DOOR OUTSIDE ( STD )",
    model: "D26A",
    customer: "ADM",
    tonase: "1300T",
    coreStd: "5.8",
    cavStd: "5.8",
    heaterStd: [215.7, 93.7, 276.9, 95.7, 54.6, 286.6, 95.5, 217, 93.9, 33.1, 31.7, 32.8, 66.8]
  },
  {
    noMold: "Q48",
    part: "FR-RR BUMPER SKIF GARNISH ( GRAIN-PAINT )",
    model: "3MOA",
    customer: "HPM",
    tonase: "1300T",
    coreStd: "20",
    cavStd: "24.4",
    heaterStd: [63, 30.4, 31.4, 31.7, 29.5, 30.1, 30.1, 30.8, 37.9, 40, 42.1, 80.4, 85, 79.9, 85.7]
  },
  {
    noMold: "Q50",
    part: "INSTRUMENT PANEL RHD",
    model: "D26A",
    customer: "ADM",
    tonase: "1600T",
    coreStd: "17.4",
    cavStd: "20",
    heaterStd: [22.6, 20.9, 19.4, 11.5, 16.1, 19.7, 10.7, 19.5, 18.3, 31.8, 12.4, 22.1, 22.2, 26, 18.7, 25]
  },
  {
    noMold: "Q53",
    part: "COVER FR BUMPER LOWER",
    model: "560B",
    customer: "TMMIN",
    tonase: "1300T",
    coreStd: "20",
    cavStd: "12",
    heaterStd: [90.7, 35.4, 38, 36.8, 83.2, 93, 82.2, 93.3, 77.7, 95.4, 78.6, 223, 108, 226]
  },
  {
    noMold: "Q56",
    part: "PANEL INSTRUMENT RHD",
    model: "D55L",
    customer: "TMMIN",
    tonase: "2500T",
    coreStd: "18.9",
    cavStd: "19.7",
    heaterStd: [15.8, 19.2, 18.1, 18.7, 13.7, 20.5, 31.4, 41.7, 86.7, 42.1, 85.1, 84.4, 85.2, 81.7, 84.7, 87.5]
  },
  {
    noMold: "Q57",
    part: "PANEL INSTRUMENT LHD",
    model: "D55L",
    customer: "ADM",
    tonase: "1600T",
    coreStd: "18.2",
    cavStd: "21",
    heaterStd: [19.5, 19.1, 18.2, 13.6, 13.6, 21.1, 47, 40.9, 83.2, 41.9, 85.1, 82.6, 87.3, 82, 81.4, 86.1]
  },
  {
    noMold: "Q58",
    part: "COVER RR SPOILER",
    model: "D03B",
    customer: "TMMIN",
    tonase: "1300T",
    coreStd: "27",
    cavStd: "10.8",
    heaterStd: [82.9, 37.2, 39.7, 46.5, 81.7, 92.5, 81.9, 93.8, 81.7, 93.1, 80.5, 85.2, 82.2, 86.4]
  },
  {
    noMold: "Q60",
    part: "DOOR GLOVE COMPARTMENT INNER RHD",
    model: "D03B",
    customer: "TMMIN",
    tonase: "1300T",
    coreStd: "10.9",
    cavStd: "7.8",
    heaterStd: [88.9, 39.3, 43.1, 41.2, 81.7, 99.7, 80.1, 142]
  },
  {
    noMold: "T37",
    part: "GRILLE RADIATOR T-BRAND",
    model: "D79L",
    customer: "ADM",
    tonase: "650T",
    coreStd: "16.2",
    cavStd: "16.3",
    heaterStd: [91.5, 22.4, 31.2, 21.8, 82.9, 208, 55.1, 87.9, 101, 82.7, 106]
  },
  {
    noMold: "T38",
    part: "GRILLE RADIATOR D-BRAND",
    model: "D79L",
    customer: "ADM",
    tonase: "650T",
    coreStd: "16",
    cavStd: "19.2",
    heaterStd: [92, 21.3, 22.8, 30.8, 20.8, 80, 210, 54.6, 87.6, 122, 85.9, 116]
  },
  {
    noMold: "T46",
    part: "GRILLE RADIATOR LOWER",
    model: "665B",
    customer: "TMMIN",
    tonase: "650T",
    coreStd: "5.6",
    cavStd: "6.1",
    heaterStd: []
  },
  {
    noMold: "T56",
    part: "GRILLE RADIATOR D-BRAND",
    model: "D26A",
    customer: "ADM",
    tonase: "650T",
    coreStd: "13.7",
    cavStd: "15.1",
    heaterStd: [97.3, 21.1, 21.4, 81.4, 203, 81.8, 137]
  }
]

async function main() {
  console.log('🔄 Starting Batch 1 Sync for Mold Standards...')

  // 1. Update molds_v3.json
  const jsonPath = path.join(__dirname, '../src/data/molds_v3.json')
  const molds: any[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  const updateMap = new Map<string, MoldUpdateData>()
  for (const item of batch1Data) {
    updateMap.set(item.noMold, item)
  }

  let updatedInJson = 0
  for (let i = 0; i < molds.length; i++) {
    const m = molds[i]
    if (updateMap.has(m.noMold)) {
      const u = updateMap.get(m.noMold)!
      m.part = u.part || m.part
      if (u.model) m.model = u.model
      if (u.customer) m.customer = u.customer
      if (u.tonase) m.tonase = u.tonase
      m.coreStd = u.coreStd !== undefined ? u.coreStd : m.coreStd
      m.cavStd = u.cavStd !== undefined ? u.cavStd : m.cavStd
      m.heaterStd = u.heaterStd !== undefined ? u.heaterStd : m.heaterStd
      updatedInJson++
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(molds, null, 2), 'utf-8')
  console.log(`✅ Successfully updated ${updatedInJson} molds in src/data/molds_v3.json!`)

  // 2. Sync to live TiDB Cloud database via Prisma
  console.log('☁️ Syncing to TiDB Cloud database...')
  let updatedInDb = 0
  for (const item of batch1Data) {
    const dataToUpdate: any = {
      part: item.part,
    }
    if (item.model) dataToUpdate.model = item.model
    if (item.customer) dataToUpdate.customer = item.customer
    if (item.tonase) dataToUpdate.tonase = item.tonase
    if (item.coreStd !== undefined) dataToUpdate.coreStd = item.coreStd
    if (item.cavStd !== undefined) dataToUpdate.cavStd = item.cavStd
    if (item.heaterStd !== undefined) dataToUpdate.heaterStd = item.heaterStd

    const result = await prisma.moldBook.updateMany({
      where: { noMold: item.noMold },
      data: dataToUpdate,
    })
    if (result.count > 0) {
      updatedInDb++
    }
  }
  console.log(`✅ Successfully synced ${updatedInDb} molds in live TiDB Cloud Database!`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
