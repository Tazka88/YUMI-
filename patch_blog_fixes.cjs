const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin/BlogAdmin.tsx', 'utf8');

const target = `const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');`;

const replacement = `const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(false);`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/Admin/BlogAdmin.tsx', code);
console.log('Patched BlogAdmin.tsx');

let pageSettingsCode = fs.readFileSync('src/pages/Admin/PageSettings.tsx', 'utf8');
pageSettingsCode = pageSettingsCode.replace('onChange={handleTitleChange}', 'onChange={e => setPageForm({...pageForm, title: e.target.value})}');
fs.writeFileSync('src/pages/Admin/PageSettings.tsx', pageSettingsCode);
console.log('Patched PageSettings.tsx');
