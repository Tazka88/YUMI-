const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

const regexOffers = /"itemCondition": "https:\/\/schema\.org\/NewCondition",/;
if(regexOffers.test(code)) {
    code = code.replace(regexOffers, '"itemCondition": "https://schema.org/NewCondition",\n                  "priceValidUntil": "2027-12-31",');
    console.log("priceValidUntil added to api/index.ts.");
}

fs.writeFileSync('api/index.ts', code);
