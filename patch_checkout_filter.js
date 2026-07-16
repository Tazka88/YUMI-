import fs from 'fs';
const path = 'src/pages/Checkout.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldFilter = `                  const filteredOffices = offices.filter(o => {
                    const matchWilaya = !formData.wilaya || Number(o.wilaya) === Number(formData.wilaya);
                    const matchCommune = !formData.commune || o.commune.toLowerCase() === formData.commune.toLowerCase();
                    return matchWilaya && matchCommune;
                  });`;

const newFilter = `                  const filteredOffices = offices.filter(o => {
                    const matchWilaya = !formData.wilaya || Number(o.wilaya) === Number(formData.wilaya);
                    if (!matchWilaya) return false;
                    if (!formData.commune) return true;
                    if (!o.commune) return false;
                    
                    const normalizeCommune = (s: string) => (s||'').toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z]/g, '').replace(/[aeiouy]/g, '');
                    const c1 = normalizeCommune(o.commune);
                    const c2 = normalizeCommune(formData.commune);
                    
                    const matchCommune = c1 === c2 || 
                                         o.commune.toLowerCase().includes(formData.commune.toLowerCase()) || 
                                         formData.commune.toLowerCase().includes(o.commune.toLowerCase());
                                         
                    return matchCommune;
                  });`;

content = content.replace(oldFilter, newFilter);

fs.writeFileSync(path, content);
