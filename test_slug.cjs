const name = 'Mi Band 10 bracelet inteligent : 150+ Modes sportifs Écran AMOLED 1,72 pouces BT5.4 Endurance 21 jours 5ATM Diffusion de fréquence cardiaque';

function generateSlug(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,'"]/g, '-') // Replace dots, commas, quotes with hyphens
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Keep letters, numbers, spaces, hyphens
    .replace(/[\s-]+/g, '-') // Collapse multiple spaces/hyphens
    .replace(/^-+|-+$/g, '');
}

console.log(generateSlug(name));
