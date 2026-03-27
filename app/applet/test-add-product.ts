import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres';

const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

async function test() {
  try {
    const payload = {
      category_id: null,
      subcategory_id: null,
      brand_id: null,
      brand_name: "Test Brand",
      name: "Test Product",
      slug: "test-product-" + Date.now(),
      description: "Test description",
      price: 100,
      promo_price: null,
      stock: 10,
      image: "test.jpg",
      is_popular: false,
      is_best_seller: false,
      is_new: false,
      is_recommended: false,
      is_fast_delivery: false,
      features: "",
      key_points: null,
      images: []
    };

    const productId = await sql.begin(async (sql: any) => {
      const [info] = await sql`
        INSERT INTO products (category_id, subcategory_id, brand_id, brand_name, name, slug, description, price, promo_price, stock, image, is_popular, is_best_seller, is_new, is_recommended, is_fast_delivery, features, key_points)
        VALUES (${payload.category_id || null}, ${payload.subcategory_id || null}, ${payload.brand_id || null}, ${payload.brand_name || null}, ${payload.name || ''}, ${payload.slug || ''}, ${payload.description || null}, ${payload.price || 0}, ${payload.promo_price || null}, ${payload.stock || 0}, ${payload.image || null}, ${payload.is_popular ? true : false}, ${payload.is_best_seller ? true : false}, ${payload.is_new ? true : false}, ${payload.is_recommended ? true : false}, ${payload.is_fast_delivery ? true : false}, ${payload.features ? JSON.stringify(payload.features) : null}::jsonb, ${payload.key_points ? JSON.stringify(payload.key_points) : null}::jsonb)
        RETURNING id
      `;
      return info.id;
    });
    console.log("Success! Product ID:", productId);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sql.end();
  }
}

test();
