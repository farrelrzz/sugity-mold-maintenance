const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const mold = await prisma.moldBook.findFirst();
  console.log("DB Mold Example:", mold);
  
  // Also check existing models to see if there's a field for model and location
  // Wait, does MoldBook schema have 'model' and 'location'?
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  console.log("\nSchema snippet for MoldBook:");
  const lines = schema.split('\n');
  let inMold = false;
  for(const line of lines) {
    if(line.includes('model MoldBook')) inMold = true;
    if(inMold) {
      console.log(line);
      if(line.includes('}')) break;
    }
  }
}
check().catch(console.error).finally(() => prisma.$disconnect());
