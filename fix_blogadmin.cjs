const fs = require('fs');

let code = fs.readFileSync('src/pages/Admin/BlogAdmin.tsx', 'utf8');

const replacement = `import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Plus, X, Search, Check, Save, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const generateSlug = (text: string) => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,'"]/g, '-')
    .trim()
    .replace(/[^a-z0-9\\s-]/g, '')
    .replace(/[\\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function BlogAdmin() {
  const [categories, setCategories] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
`;

code = code.replace(/import React[\s\S]*?const handleImageUpload/g, replacement + '\n\n  const handleImageUpload');
fs.writeFileSync('src/pages/Admin/BlogAdmin.tsx', code);
console.log('Fixed BlogAdmin.tsx');
