const fs = require('fs');

let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// The categories currently use a "Masonry" effect which makes them different sizes based on the index:
/*
  if (index % 5 === 0) {
    spanClasses = 'col-span-2 row-span-1';
    aspectClass = 'aspect-[16/9]';
  } else if (index % 4 === 0) {
    spanClasses = 'col-span-1 row-span-2';
    aspectClass = 'aspect-[9/16]';
  } else {
    spanClasses = 'col-span-1 row-span-1';
    aspectClass = 'aspect-square';
  }
*/
// The user wants them homogeneous. So let's replace it to just be aspect-square or a consistent aspect ratio, and no row/col spanning.

const oldBlock = `  // Predictable pattern instead of dynamic loading which causes stuttering
  if (index % 5 === 0) {
    spanClasses = 'col-span-2 row-span-1';
    aspectClass = 'aspect-[16/9]';
  } else if (index % 4 === 0) {
    spanClasses = 'col-span-1 row-span-2';
    aspectClass = 'aspect-[9/16]';
  } else {
    spanClasses = 'col-span-1 row-span-1';
    aspectClass = 'aspect-square';
  }`;

const newBlock = `  // Homogeneous layout
  spanClasses = 'col-span-1 row-span-1';
  aspectClass = 'aspect-square';`;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
} else {
    console.log("old block not found in MasonryCategoryCard");
}

const oldSkeleton = `            // Skeleton loader for categories
            [...Array(6)].map((_, i) => {
              let spanClasses = '';
              let aspectClass = '';
              if (i % 5 === 0) {
                spanClasses = 'col-span-2 row-span-1';
                aspectClass = 'aspect-[16/9]';
              } else if (i % 4 === 0) {
                spanClasses = 'col-span-1 row-span-2';
                aspectClass = 'aspect-[9/16]';
              } else {
                spanClasses = 'col-span-1 row-span-1';
                aspectClass = 'aspect-square';
              }`;

const newSkeleton = `            // Skeleton loader for categories
            [...Array(6)].map((_, i) => {
              let spanClasses = 'col-span-1 row-span-1';
              let aspectClass = 'aspect-square';`;

if (content.includes(oldSkeleton)) {
    content = content.replace(oldSkeleton, newSkeleton);
} else {
    console.log("old skeleton not found");
}

// Ensure the masonry class grid-flow-row-dense isn't messing things up now that they are the same size
content = content.replace(
  '<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 px-2 sm:px-0 grid-flow-row-dense">',
  '<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 px-2 sm:px-0">'
);

fs.writeFileSync('src/pages/Home.tsx', content);
console.log('Patched Home.tsx');
