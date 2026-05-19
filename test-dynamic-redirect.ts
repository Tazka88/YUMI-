import { sql } from './src/db/setup.js';

async function testRedirect(id: number) {
  let [cat] = await sql`SELECT slug FROM categories WHERE id = ${id}`;
  if (cat) return `/category/${cat.slug}`;

  let [subcat] = await sql`SELECT slug FROM subcategories WHERE id = ${id}`;
  if (subcat) return `/category/${subcat.slug}?sub=true`;

  let [subsub] = await sql`SELECT slug FROM sub_subcategories WHERE id = ${id}`;
  if (subsub) return `/category/${subsub.slug}?subsub=true`;

  return null;
}

Promise.all([testRedirect(9), testRedirect(27), testRedirect(43)]).then(console.log).catch(console.error).finally(() => process.exit(0));
