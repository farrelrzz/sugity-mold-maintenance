import mariadb from 'mariadb';

async function main() {
  console.log("Connecting to TiDB Cloud with 15s timeout...");
  const conn = await mariadb.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '2UVNBvRtUAd5zyR.root',
    password: 'vFEouGzVawSvJ0hP',
    ssl: { rejectUnauthorized: false },
    connectTimeout: 15000
  });
  console.log("Connected successfully!");
  
  const rows = await conn.query("SHOW DATABASES;");
  console.log("Databases:", rows);
  
  await conn.query("CREATE DATABASE IF NOT EXISTS sugity;");
  console.log("Database 'sugity' created or verified!");

  await conn.end();
}

main().catch(err => {
  console.error("Error connecting:", err);
  process.exit(1);
});
