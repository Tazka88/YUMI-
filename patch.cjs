const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin/BlogAdmin.tsx', 'utf8');

const t1 = `<div className="flex gap-2">
                              <input type="text" className="flex-1 border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_url || ''} onChange={(e) => setEditingPost({...editingPost, image_url: e.target.value})} placeholder="URL de l'image" />
                              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 flex items-center justify-center transition">
                                {uploading ? <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div> : <Upload size={18} />}
                              </button>
                              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'image_url')} />
                            </div>
                            <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.main_image_alt || ''} onChange={(e) => setEditingPost({...editingPost, main_image_alt: e.target.value})} placeholder="Texte ALT pour l'image principale (ex: Défroisseur vapeur ROBUSTE)" />
                            {editingPost.image_url && (
                                <img src={editingPost.image_url} alt="" className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm" />
                            )}`;

const r1 = `<div className="flex items-center gap-4">
                              {editingPost.image_url && (
                                <img src={editingPost.image_url} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                              )}
                              <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2">
                                {uploading ? <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div> : <Upload size={18} />}
                                Télécharger une image
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'image_url')} />
                              </label>
                            </div>
                            <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.main_image_alt || ''} onChange={(e) => setEditingPost({...editingPost, main_image_alt: e.target.value})} placeholder="Texte ALT pour l'image principale (ex: Défroisseur vapeur ROBUSTE)" />`;

const t2 = `<div className="flex gap-2">
                              <input type="text" className="flex-1 border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_1_url || ''} onChange={(e) => setEditingPost({...editingPost, image_1_url: e.target.value})} placeholder="URL de l'image 1" />
                              <button type="button" onClick={() => image1Ref.current?.click()} disabled={uploading} className="px-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 flex items-center justify-center transition">
                                <Upload size={18} />
                              </button>
                              <input type="file" ref={image1Ref} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'image_1_url')} />
                            </div>
                            <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_1_alt || ''} onChange={(e) => setEditingPost({...editingPost, image_1_alt: e.target.value})} placeholder="Texte ALT pour l'image 1" />
                            {editingPost.image_1_url && (
                                <img src={editingPost.image_1_url} alt="" className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm" />
                            )}`;

const r2 = `<div className="flex items-center gap-4">
                              {editingPost.image_1_url && (
                                <img src={editingPost.image_1_url} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                              )}
                              <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2">
                                <Upload size={18} />
                                Télécharger une image
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'image_1_url')} />
                              </label>
                            </div>
                            <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_1_alt || ''} onChange={(e) => setEditingPost({...editingPost, image_1_alt: e.target.value})} placeholder="Texte ALT pour l'image 1" />`;

const t3 = `<div className="flex gap-2">
                              <input type="text" className="flex-1 border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_2_url || ''} onChange={(e) => setEditingPost({...editingPost, image_2_url: e.target.value})} placeholder="URL de l'image 2" />
                              <button type="button" onClick={() => image2Ref.current?.click()} disabled={uploading} className="px-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 flex items-center justify-center transition">
                                <Upload size={18} />
                              </button>
                              <input type="file" ref={image2Ref} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'image_2_url')} />
                            </div>
                            <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_2_alt || ''} onChange={(e) => setEditingPost({...editingPost, image_2_alt: e.target.value})} placeholder="Texte ALT pour l'image 2" />
                            {editingPost.image_2_url && (
                                <img src={editingPost.image_2_url} alt="" className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm" />
                            )}`;

const r3 = `<div className="flex items-center gap-4">
                              {editingPost.image_2_url && (
                                <img src={editingPost.image_2_url} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                              )}
                              <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2">
                                <Upload size={18} />
                                Télécharger une image
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'image_2_url')} />
                              </label>
                            </div>
                            <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_2_alt || ''} onChange={(e) => setEditingPost({...editingPost, image_2_alt: e.target.value})} placeholder="Texte ALT pour l'image 2" />`;

const t4 = `<div className="flex gap-2">
                              <input type="text" className="flex-1 border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_3_url || ''} onChange={(e) => setEditingPost({...editingPost, image_3_url: e.target.value})} placeholder="URL de l'image 3" />
                              <button type="button" onClick={() => image3Ref.current?.click()} disabled={uploading} className="px-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 flex items-center justify-center transition">
                                <Upload size={18} />
                              </button>
                              <input type="file" ref={image3Ref} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'image_3_url')} />
                            </div>
                            <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_3_alt || ''} onChange={(e) => setEditingPost({...editingPost, image_3_alt: e.target.value})} placeholder="Texte ALT pour l'image 3" />
                            {editingPost.image_3_url && (
                                <img src={editingPost.image_3_url} alt="" className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm" />
                            )}`;

const r4 = `<div className="flex items-center gap-4">
                              {editingPost.image_3_url && (
                                <img src={editingPost.image_3_url} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                              )}
                              <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2">
                                <Upload size={18} />
                                Télécharger une image
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'image_3_url')} />
                              </label>
                            </div>
                            <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_3_alt || ''} onChange={(e) => setEditingPost({...editingPost, image_3_alt: e.target.value})} placeholder="Texte ALT pour l'image 3" />`;


content = content.replace(t1, r1);
content = content.replace(t2, r2);
content = content.replace(t3, r3);
content = content.replace(t4, r4);

fs.writeFileSync('src/pages/Admin/BlogAdmin.tsx', content);
