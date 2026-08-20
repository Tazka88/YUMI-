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

const db = [
  { id: 21, image_url: "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/slider_images/slider-21-1781268754353-okf4vb.webp", mobile_image_url: "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/1787218104691-2vkq7k.webp" },
  { id: 24, mobile_image_url: "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/1788734267431-c4n692.webp" }
];

console.log("Desktop Hash 21:", getHash(db[0].image_url));
console.log("Mobile Hash 21:", getHash(db[0].mobile_image_url));
console.log("Mobile Hash 24:", getHash(db[1].mobile_image_url));
