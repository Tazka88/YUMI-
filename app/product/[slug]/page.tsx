// This file was created based on the exact instructions provided.
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const revalidate = 300;

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const { data, error } = await supabase.rpc('get_product_page', { p_slug: params.slug });
  
  if (error || !data) {
    return <div>Product not found</div>;
  }

  // Handle your returned JSON payload:
  // const { product, reviews, categories, settings } = data as any;

  return (
    <div>
      {/* Product page content using single RPC payload */}
      <h1>{data.product?.name}</h1>
    </div>
  );
}
