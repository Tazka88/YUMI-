const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin/BlogAdmin.tsx', 'utf8');

// We need a helper handleImageUpload for specific fields
// Replace handleImageUpload to accept field name

// But we can just create inline handlers since it's easy or a custom function.
const handleImageUploadCode = `
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string = 'image_url') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('adminToken')}\` },
        body: formData
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEditingPost(prev => ({ ...prev, [fieldName]: data.url }));
      toast.success('Image téléchargée');
    } catch {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
`;

code = code.replace(
  /const handleImageUpload = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?if \(fileInputRef\.current\) fileInputRef\.current\.value = '';\n    \}\n  \};/m,
  handleImageUploadCode
);

// We need to remove fileInputRef and instead use inline file inputs with unique refs, or just pass e.target to the handler and reset it as done above.
// Wait, fileInputRef was used to trigger click. We can create separate refs or just let the user click a label wrapping the file input.
const refsCode = `
  const fileInputRef = useRef<HTMLInputElement>(null);
  const image1Ref = useRef<HTMLInputElement>(null);
  const image2Ref = useRef<HTMLInputElement>(null);
  const image3Ref = useRef<HTMLInputElement>(null);
`;
code = code.replace(/const fileInputRef = useRef<HTMLInputElement>\(null\);/, refsCode);

// Add the image inputs inside the form.
const imageFieldsCode = `
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image principale de l'article</label>
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                              <input type="text" className="flex-1 border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_url || ''} onChange={(e) => setEditingPost({...editingPost, image_url: e.target.value})} placeholder="URL de l'image" />
                              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 flex items-center justify-center transition">
                                {uploading ? <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div> : <Upload size={18} />}
                              </button>
                              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'image_url')} />
                            </div>
                            <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.main_image_alt || ''} onChange={(e) => setEditingPost({...editingPost, main_image_alt: e.target.value})} placeholder="Texte ALT pour l'image principale (ex: Défroisseur vapeur ROBUSTE)" />
                            {editingPost.image_url && (
                                <img src={editingPost.image_url} alt="" className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm" />
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image contenu 1 (Après l'introduction)</label>
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                              <input type="text" className="flex-1 border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_1_url || ''} onChange={(e) => setEditingPost({...editingPost, image_1_url: e.target.value})} placeholder="URL de l'image 1" />
                              <button type="button" onClick={() => image1Ref.current?.click()} disabled={uploading} className="px-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 flex items-center justify-center transition">
                                <Upload size={18} />
                              </button>
                              <input type="file" ref={image1Ref} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'image_1_url')} />
                            </div>
                            <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_1_alt || ''} onChange={(e) => setEditingPost({...editingPost, image_1_alt: e.target.value})} placeholder="Texte ALT pour l'image 1" />
                            {editingPost.image_1_url && (
                                <img src={editingPost.image_1_url} alt="" className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm" />
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image contenu 2 (Au milieu du contenu)</label>
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                              <input type="text" className="flex-1 border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_2_url || ''} onChange={(e) => setEditingPost({...editingPost, image_2_url: e.target.value})} placeholder="URL de l'image 2" />
                              <button type="button" onClick={() => image2Ref.current?.click()} disabled={uploading} className="px-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 flex items-center justify-center transition">
                                <Upload size={18} />
                              </button>
                              <input type="file" ref={image2Ref} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'image_2_url')} />
                            </div>
                            <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_2_alt || ''} onChange={(e) => setEditingPost({...editingPost, image_2_alt: e.target.value})} placeholder="Texte ALT pour l'image 2" />
                            {editingPost.image_2_url && (
                                <img src={editingPost.image_2_url} alt="" className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm" />
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image contenu 3 (Avant la conclusion)</label>
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                              <input type="text" className="flex-1 border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_3_url || ''} onChange={(e) => setEditingPost({...editingPost, image_3_url: e.target.value})} placeholder="URL de l'image 3" />
                              <button type="button" onClick={() => image3Ref.current?.click()} disabled={uploading} className="px-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 flex items-center justify-center transition">
                                <Upload size={18} />
                              </button>
                              <input type="file" ref={image3Ref} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'image_3_url')} />
                            </div>
                            <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_3_alt || ''} onChange={(e) => setEditingPost({...editingPost, image_3_alt: e.target.value})} placeholder="Texte ALT pour l'image 3" />
                            {editingPost.image_3_url && (
                                <img src={editingPost.image_3_url} alt="" className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm" />
                            )}
                        </div>
                    </div>
`;

code = code.replace(
  /<div>\s*<label className="block text-sm font-medium text-gray-700 mb-1">Image de l'article<\/label>[\s\S]*?<\/div>\s*<\/div>/,
  imageFieldsCode
);

fs.writeFileSync('src/pages/Admin/BlogAdmin.tsx', code);
