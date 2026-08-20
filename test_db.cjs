const { sql, setupDb } = require('./dist/server.cjs');
async function run() {
  await setupDb();
  const res = await sql`SELECT id, image_url, mobile_image_url FROM slider_images WHERE id IN (24, 20, 22)`;
  console.log(res);
  process.exit(0);
}
run();
