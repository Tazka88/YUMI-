const fs = require('fs');
let code = fs.readFileSync('src/pages/Blog/BlogPost.tsx', 'utf8');

const processContentLogic = `
  const getProcessedContent = (content: string, post: any) => {
    if (!content) return '';
    
    let cleanContent = DOMPurify.sanitize(content);
    
    const img1 = post.image_1_url ? \`<div class="my-8"><img src="\${post.image_1_url}" alt="\${post.image_1_alt || post.title}" loading="lazy" class="w-full rounded-2xl shadow-lg object-cover" /></div>\` : '';
    const img2 = post.image_2_url ? \`<div class="my-8"><img src="\${post.image_2_url}" alt="\${post.image_2_alt || post.title}" loading="lazy" class="w-full rounded-2xl shadow-lg object-cover" /></div>\` : '';
    const img3 = post.image_3_url ? \`<div class="my-8"><img src="\${post.image_3_url}" alt="\${post.image_3_alt || post.title}" loading="lazy" class="w-full rounded-2xl shadow-lg object-cover" /></div>\` : '';
    
    if (!img1 && !img2 && !img3) return cleanContent;

    const pTags = cleanContent.split('</p>');
    if (pTags.length <= 2) {
      return cleanContent + img1 + img2 + img3;
    }

    const pos1 = 1;
    const pos2 = Math.max(2, Math.floor(pTags.length / 2));
    const pos3 = Math.max(pos2 + 1, pTags.length - 2);
    
    let result = '';
    for (let i = 0; i < pTags.length; i++) {
      result += pTags[i] + (i < pTags.length - 1 ? '</p>' : '');
      
      if (i === pos1 - 1 && img1) result += img1;
      if (i === pos2 - 1 && img2) result += img2;
      if (i === pos3 - 1 && img3) result += img3;
    }
    
    return result;
  };
`;

code = code.replace(
  "const dateStr = post.published_at ? new Date(post.published_at).toLocaleDateString('fr-FR', {\n    day: 'numeric', month: 'long', year: 'numeric'\n  }) : '';",
  "const dateStr = post.published_at ? new Date(post.published_at).toLocaleDateString('fr-FR', {\n    day: 'numeric', month: 'long', year: 'numeric'\n  }) : '';\n" + processContentLogic
);

code = code.replace(
  "<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || '') }} />",
  "<div dangerouslySetInnerHTML={{ __html: getProcessedContent(post.content, post) }} />"
);

// We should also replace the main image alt
code = code.replace(
  /alt=\{post\.title\}/g,
  "alt={post.main_image_alt || post.title}"
);

fs.writeFileSync('src/pages/Blog/BlogPost.tsx', code);
