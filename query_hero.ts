import { sql, setupDb } from './src/db/setup.js';
async function run() {
  await setupDb();
  const res = await sql`SELECT image_url, mobile_image_url FROM slider_images LIMIT 1`;
  console.log(res);
  process.exit(0);
}
run();
