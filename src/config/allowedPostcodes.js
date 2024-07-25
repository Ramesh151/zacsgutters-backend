// config/allowedPostcodes.js

export const allowedPostcodes = [
    'AB10', 'AB11', 'AB12', 'AB13', 'AB14',
    // ... add all your allowed postcodes here
  ];


//   // utils/postcodeValidator.js
// import fs from 'fs/promises';
// import path from 'path';

// const validPostcodes = new Set();

// async function loadPostcodes() {
//   try {
//     const data = await fs.readFile(path.join(__dirname, '../data/validPostcodes.json'), 'utf8');
//     const postcodes = JSON.parse(data);
//     postcodes.forEach(postcode => validPostcodes.add(postcode.toUpperCase()));
//   } catch (error) {
//     console.error('Error loading postcodes:', error);
//   }
// }

// loadPostcodes();

// export function isValidPostcode(postcode) {
//   return validPostcodes.has(postcode.toUpperCase());
// }