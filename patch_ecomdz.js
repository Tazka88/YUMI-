import fs from 'fs';
const path = 'src/api/ecomdz.ts';
let content = fs.readFileSync(path, 'utf8');

content += `
export const fetchEcomdzStopdesks = async () => {
  try {
    const response = await ecomdzApi.get('/Stopdesk');
    return response.data;
  } catch (err) {
    console.error('Error fetching EcomDZ stopdesks internally:', err);
    return null;
  }
};
`;

fs.writeFileSync(path, content);
