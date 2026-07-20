const { Pool } = require('pg');

const variations = [
  // 1. Password is Pranav@0611, URL encoded
  "postgresql://postgres.mgbcnubfijrahtrfkcyx:Pranav%400611@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  // 2. Password is [Pranav@0611], URL encoded
  "postgresql://postgres.mgbcnubfijrahtrfkcyx:%5BPranav%400611%5D@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  // 3. Password is Pranav@0611, unencoded
  "postgresql://postgres.mgbcnubfijrahtrfkcyx:Pranav@0611@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  // 4. Password is [Pranav@0611], unencoded
  "postgresql://postgres.mgbcnubfijrahtrfkcyx:[Pranav@0611]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
];

(async () => {
  for (let i = 0; i < variations.length; i++) {
    const connStr = variations[i];
    console.log(`Testing variation ${i + 1}...`);
    const pool = new Pool({ connectionString: connStr });
    try {
      const res = await pool.query('SELECT NOW()');
      console.log(`Variation ${i + 1} SUCCESS! Database time:`, res.rows[0].now);
      break;
    } catch (err) {
      console.log(`Variation ${i + 1} FAILED:`, err.message);
    } finally {
      await pool.end();
    }
  }
})();
