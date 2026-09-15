const req = { path: '/brands/electromenager-moulinex-algerie/bouilloires' };
const parts = req.path.split('/');
const slug = parts[2];
const categorySlug = parts[3];
console.log({ slug, categorySlug });
