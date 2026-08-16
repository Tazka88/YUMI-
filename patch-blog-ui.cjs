const fs = require('fs');

let content = fs.readFileSync('src/pages/Admin/BlogAdmin.tsx', 'utf8');

const replacements = [
  {
    field: 'image_url',
    altField: 'main_image_alt',
    ref: 'fileInputRef',
    title: 'Image principale'
  },
  {
    field: 'image_1_url',
    altField: 'image_1_alt',
    ref: 'image1Ref',
    title: 'Image 1'
  },
  {
    field: 'image_2_url',
    altField: 'image_2_alt',
    ref: 'image2Ref',
    title: 'Image 2'
  },
  {
    field: 'image_3_url',
    altField: 'image_3_alt',
    ref: 'image3Ref',
    title: 'Image 3'
  }
];

// For each block, we replace the whole div that has className="flex gap-2" and the following input and img.
for (const item of replacements) {
  // Use regex to find the block
  const regex = new RegExp(
    `<div className="flex gap-2">\\s*<input type="text" className="flex-1 [^"]+" value=\\{editingPost\\.${item.field} \\|\\| ''\\} [^>]+>\\s*<button type="button" onClick=\\{\\(\\) => ${item.ref}\\.current\\?\\.click\\(\\)\\} [^>]+>\\s*(?:\\{[^}]+\\}|<Upload size=\\{18\\} \\/>)\\s*<\\/button>\\s*<input type="file" ref=\\{${item.ref}\\} className="hidden" accept="image/\\*" onChange=\\{\\(e\\) => handleImageUpload\\(e, '${item.field}'\\)\\} \\/>\\s*<\\/div>\\s*<input type="text" [^>]+value=\\{editingPost\\.${item.altField} \\|\\| ''\\} [^>]+>\\s*(?:\\{editingPost\\.${item.field} && \\(\\s*<img src=\\{editingPost\\.${item.field}\\} alt="" [^>]+>\\s*\\)\\})?`,
    'g'
  );
  
  const replacement = `
                          <div className="flex items-center gap-4">
                            {editingPost.${item.field} && (
                              <img src={editingPost.${item.field}} alt="" className="w-16 h-16 object-cover rounded border" />
                            )}
                            <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2">
                              {uploading ? <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div> : <Upload size={18} />}
                              Télécharger une image
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, '${item.field}')} />
                            </label>
                          </div>
                          <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 border text-sm mt-2" value={editingPost.${item.altField} || ''} onChange={(e) => setEditingPost({...editingPost, ${item.altField}: e.target.value})} placeholder="Texte ALT pour l'image (SEO, Optionnel)" />
  `.trim();
  
  const oldContent = content;
  content = content.replace(regex, replacement);
  if (content !== oldContent) {
    console.log(`Successfully replaced block for ${item.field}`);
  } else {
    console.log(`Failed to match block for ${item.field}`);
  }
}

fs.writeFileSync('src/pages/Admin/BlogAdmin.tsx', content);

