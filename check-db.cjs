const { sql } = require('./dist/server.cjs'); // Can't require from server.cjs easily because it runs the server

// Let's use postgres directly
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const res = await pool.query("SELECT id, title, left(image_url, 30) as img, left(image_1_url, 30) as img1 FROM blog_posts");
  console.log(res.rows);
  pool.end();
}
check();
