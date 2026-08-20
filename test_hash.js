function getHash(image) {
  let code = 0;
  for (let i = 0; i < image.length; i++) code = Math.imul(31, code) + image.charCodeAt(i) | 0;
  return Math.abs(code).toString(36);
}

const db = [
  { id: 21, image_url: "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/slider_images/slider-21-1781268754353-okf4vb.webp", mobile_image_url: "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/1787218104691-2vkq7k.webp" }
];

console.log("Desktop Hash:", getHash(db[0].image_url));
console.log("Mobile Hash:", getHash(db[0].mobile_image_url));
