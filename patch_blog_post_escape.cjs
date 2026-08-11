const fs = require('fs');
let code = fs.readFileSync('src/pages/Blog/BlogPost.tsx', 'utf8');

code = code.replace(
  'const img1 = post.image_1_url ? `<div class="my-8"><img src="${post.image_1_url}" alt="${post.image_1_alt || post.title}" loading="lazy" class="w-full rounded-2xl shadow-lg object-cover" /></div>` : \'\';',
  'const img1 = post.image_1_url ? `<div class="my-8"><img src="${post.image_1_url.replace(/"/g, \'&quot;\')}" alt="${(post.image_1_alt || post.title).replace(/"/g, \'&quot;\')}" loading="lazy" class="w-full rounded-2xl shadow-lg object-cover" /></div>` : \'\';'
);

code = code.replace(
  'const img2 = post.image_2_url ? `<div class="my-8"><img src="${post.image_2_url}" alt="${post.image_2_alt || post.title}" loading="lazy" class="w-full rounded-2xl shadow-lg object-cover" /></div>` : \'\';',
  'const img2 = post.image_2_url ? `<div class="my-8"><img src="${post.image_2_url.replace(/"/g, \'&quot;\')}" alt="${(post.image_2_alt || post.title).replace(/"/g, \'&quot;\')}" loading="lazy" class="w-full rounded-2xl shadow-lg object-cover" /></div>` : \'\';'
);

code = code.replace(
  'const img3 = post.image_3_url ? `<div class="my-8"><img src="${post.image_3_url}" alt="${post.image_3_alt || post.title}" loading="lazy" class="w-full rounded-2xl shadow-lg object-cover" /></div>` : \'\';',
  'const img3 = post.image_3_url ? `<div class="my-8"><img src="${post.image_3_url.replace(/"/g, \'&quot;\')}" alt="${(post.image_3_alt || post.title).replace(/"/g, \'&quot;\')}" loading="lazy" class="w-full rounded-2xl shadow-lg object-cover" /></div>` : \'\';'
);

fs.writeFileSync('src/pages/Blog/BlogPost.tsx', code);
