import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, GripVertical, Check, X, Image as ImageIcon } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Cropper from 'react-easy-crop';

interface Category {
  id: number;
  name: string;
}

interface SliderImage {
  id: number;
  image_url: string;
  category_id: number | null;
  position: number;
  is_active: boolean;
  created_at: string;
}

export default function SliderImagesAdmin() {
  const [images, setImages] = useState<SliderImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<Partial<SliderImage>>({ is_active: true, position: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [filterCategory, setFilterCategory] = useState<number | 'global'>('global');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchImages();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchImages = async () => {
    try {
      const res = await fetch('/api/slider-images');
      const data = await res.json();
      setImages(data);
    } catch (err) {
      console.error('Failed to fetch slider images', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsCropping(true);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => { image.onload = resolve; });

    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('No 2d context');

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return canvas.toDataURL('image/jpeg');
  };

  const handleCropSave = async () => {
    if (previewUrl && croppedAreaPixels) {
      try {
        const croppedImageBase64 = await getCroppedImg(previewUrl, croppedAreaPixels);
        setCurrentImage({ ...currentImage, image_url: croppedImageBase64 });
        setIsCropping(false);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const saveImage = async () => {
    setIsLoading(true);
    try {
      let finalImageUrl = currentImage.image_url;
      const token = localStorage.getItem('adminToken');

      // If it's a new image (base64 from cropper)
      if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
        // Convert base64 to blob
        const res = await fetch(finalImageUrl);
        const blob = await res.blob();
        const file = new File([blob], 'slider-image.jpg', { type: 'image/jpeg' });
        
        const formData = new FormData();
        formData.append('image', file);

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        const data = await uploadRes.json();
        if (data.url) {
          finalImageUrl = data.url;
        } else {
          throw new Error('Upload failed');
        }
      }

      const payload = {
        ...currentImage,
        image_url: finalImageUrl,
        category_id: currentImage.category_id === 0 ? null : currentImage.category_id
      };

      const url = currentImage.id ? `/api/slider-images/${currentImage.id}` : '/api/slider-images';
      const method = currentImage.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchImages();
        setCurrentImage({ is_active: true, position: 0 });
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`/api/slider-images/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchImages();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (image: SliderImage) => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`/api/slider-images/${image.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !image.is_active })
      });
      fetchImages();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredImages = images
    .filter(img => filterCategory === 'global' ? img.category_id === null : img.category_id === filterCategory)
    .sort((a, b) => a.position - b.position);

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items: SliderImage[] = Array.from(filteredImages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    if (!reorderedItem) return;
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions locally
    const updatedItems = items.map((item: SliderImage, index: number) => {
      if (!item) return null;
      return { ...item, position: index };
    }).filter(Boolean) as SliderImage[];
    
    // Update state optimistically
    setImages(prev => {
      const newImages = [...prev];
      updatedItems.forEach(updatedItem => {
        const idx = newImages.findIndex(img => img.id === updatedItem.id);
        if (idx !== -1) newImages[idx] = updatedItem;
      });
      return newImages;
    });

    // Save to backend
    try {
      const token = localStorage.getItem('adminToken');
      await fetch('/api/slider-images/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: updatedItems.map(i => ({ id: i.id, position: i.position })) })
      });
    } catch (err) {
      console.error(err);
      fetchImages(); // Revert on error
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-bold text-gray-800">Gestion des Sliders (Global & Catégories)</h2>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value === 'global' ? 'global' : Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="global">Slider Global (Accueil)</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>Catégorie : {cat.name}</option>
            ))}
          </select>

          <button 
            onClick={() => {
              setCurrentImage({ is_active: true, position: filteredImages.length, category_id: filterCategory === 'global' ? null : filterCategory });
              setPreviewUrl(null);
              setSelectedFile(null);
              setIsModalOpen(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Plus size={18} />
            Ajouter une image
          </button>
        </div>
      </div>

      <div className="p-6">
        {filteredImages.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <ImageIcon size={48} className="mx-auto mb-3 opacity-20" />
            <p>Aucune image pour ce slider.</p>
            {filterCategory !== 'global' && (
              <p className="text-sm mt-2 text-orange-600">Le slider global sera affiché en fallback pour cette catégorie.</p>
            )}
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="slider-images">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {filteredImages.map((image, index) => (
                    // @ts-ignore
                    <Draggable key={image.id} draggableId={image.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-4 p-4 bg-white border ${snapshot.isDragging ? 'border-orange-500 shadow-lg' : 'border-gray-200'} rounded-lg`}
                        >
                          <div {...provided.dragHandleProps} className="text-gray-400 hover:text-gray-600 cursor-grab">
                            <GripVertical size={20} />
                          </div>
                          
                          <div className="w-32 h-18 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={image.image_url} alt="Slider" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          
                          <div className="flex-1 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${image.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {image.is_active ? 'Actif' : 'Inactif'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => toggleActive(image)} 
                                className={`p-2 rounded-md ${image.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                                title={image.is_active ? "Désactiver" : "Activer"}
                              >
                                {image.is_active ? <X size={18} /> : <Check size={18} />}
                              </button>
                              <button 
                                onClick={() => {
                                  setCurrentImage(image);
                                  setIsModalOpen(true);
                                }} 
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                                title="Modifier"
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                onClick={() => deleteImage(image.id)} 
                                className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                title="Supprimer"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-800">
                {currentImage.id ? 'Modifier l\'image' : 'Ajouter une image'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setIsCropping(false); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {isCropping && previewUrl ? (
                <div className="space-y-4">
                  <div className="relative h-[400px] w-full bg-gray-900 rounded-lg overflow-hidden">
                    <Cropper
                      image={previewUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={16 / 9}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Zoom</span>
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => { setIsCropping(false); setPreviewUrl(null); setSelectedFile(null); }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleCropSave}
                      className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                    >
                      Appliquer le recadrage (16:9)
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                    {currentImage.image_url ? (
                      <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 mb-3">
                        <img src={currentImage.image_url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          onClick={() => setCurrentImage({ ...currentImage, image_url: undefined })}
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-600 p-2 rounded-full shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                          <ImageIcon size={32} className="text-gray-400 mb-2" />
                          <span className="text-sm font-medium text-orange-600">Cliquez pour uploader</span>
                          <span className="text-xs text-gray-500 mt-1">PNG, JPG jusqu'à 5MB</span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigner à</label>
                    <select
                      value={currentImage.category_id === null ? 'global' : currentImage.category_id}
                      onChange={(e) => setCurrentImage({ ...currentImage, category_id: e.target.value === 'global' ? null : Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="global">Slider Global (Accueil)</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>Catégorie : {cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={currentImage.is_active}
                      onChange={(e) => setCurrentImage({ ...currentImage, is_active: e.target.checked })}
                      className="rounded text-orange-500 focus:ring-orange-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      Image active
                    </label>
                  </div>
                </>
              )}
            </div>
            
            {!isCropping && (
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-white font-medium"
                  disabled={isLoading}
                >
                  Annuler
                </button>
                <button
                  onClick={saveImage}
                  disabled={!currentImage.image_url || isLoading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
