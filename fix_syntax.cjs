const fs = require('fs');

let content = fs.readFileSync('src/pages/BrandProducts.tsx', 'utf8');

const bad = `  return (
    <div className="container mx-auto px-4 py-8">
        let schemaData = [];`;

const good = `  let schemaData = [];`;

content = content.replace(bad, good);

const addReturn = `    schemaData = [breadcrumbSchema, ...productSchemas];
  }`;

const addReturnFixed = `    schemaData = [breadcrumbSchema, ...productSchemas];
  }

  return (
    <div className="container mx-auto px-4 py-8">`;

content = content.replace(addReturn, addReturnFixed);

fs.writeFileSync('src/pages/BrandProducts.tsx', content);
console.log('Fixed syntax');
