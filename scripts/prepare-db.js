const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

let dbUrl = process.env.DATABASE_URL;
let directUrl = process.env.DIRECT_URL;

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  if (!dbUrl) {
    const match = content.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
    if (match) dbUrl = match[1];
  }
  if (!directUrl) {
    const matchDirect = content.match(/^DIRECT_URL=["']?([^"'\r\n]+)["']?/m);
    if (matchDirect) directUrl = matchDirect[1];
  }
}

const isSqlite = dbUrl && dbUrl.startsWith('file:');
const targetProvider = isSqlite ? 'sqlite' : 'postgresql';

if (fs.existsSync(schemaPath)) {
  let schema = fs.readFileSync(schemaPath, 'utf8');

  // Sync datasource block
  if (isSqlite) {
    schema = schema.replace(
      /datasource\s+db\s*\{[\s\S]*?\}/,
      `datasource db {\n  provider = "sqlite"\n  url      = env("DATABASE_URL")\n}`
    );
  } else if (directUrl) {
    schema = schema.replace(
      /datasource\s+db\s*\{[\s\S]*?\}/,
      `datasource db {\n  provider  = "postgresql"\n  url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")\n}`
    );
  } else {
    schema = schema.replace(
      /datasource\s+db\s*\{[\s\S]*?\}/,
      `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}`
    );
  }

  fs.writeFileSync(schemaPath, schema, 'utf8');
  console.log(`[prepare-db] Prisma provider synced to: ${targetProvider} (DirectURL: ${Boolean(directUrl && !isSqlite)})`);
}
