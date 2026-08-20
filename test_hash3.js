function getHash(image) {
  let hash = '';
  const vMatch = image.match(/v=([^&]+)/);
  if (vMatch && vMatch[1]) {
    hash = vMatch[1];
  } else {
    let code = 0;
    for (let i = 0; i < image.length; i++) code = Math.imul(31, code) + image.charCodeAt(i) | 0;
    hash = Math.abs(code).toString(36);
  }
  return hash;
}
console.log("Hash 24 mobile:", getHash("https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/sliders/migration/slider-24-mobile_image_url-1786805909711.webp"));
console.log("Hash 21 mobile:", getHash("https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/1787218104691-2vkq7k.webp"));
