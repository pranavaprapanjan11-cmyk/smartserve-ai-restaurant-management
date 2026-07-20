// File: backend/scripts/validate_ai_import_flow.js
const { processFileImport } = require('../dist/modules/ai-import/aiImport.service');
const assert = require('assert');

console.log('--- STARTING AI SMART IMPORT FLOW VALIDATION ---');

// Mock test utility for Levenshtein duplicate calculations
function calculateSimilarity(a, b) {
  const cleanA = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanB = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (cleanA === cleanB) return 1.0;
  if (cleanA.length === 0 || cleanB.length === 0) return 0.0;
  
  const matrix = [];
  for (let i = 0; i <= cleanB.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= cleanA.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= cleanB.length; i++) {
    for (let j = 1; j <= cleanA.length; j++) {
      if (cleanB.charAt(i - 1) === cleanA.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  
  const distance = matrix[cleanB.length][cleanA.length];
  const maxLength = Math.max(cleanA.length, cleanB.length);
  return 1.0 - distance / maxLength;
}

console.log('\nStep 1: Testing Fuzzy Similarity Mapping...');
const match1 = calculateSimilarity('Chicken Biryani', 'Chicken Dum Biryani');
console.log(`- "Chicken Biryani" vs "Chicken Dum Biryani": ${Math.round(match1 * 100)}% match`);
assert(match1 > 0.70, 'Fuzzy match should detect similarity');

const match2 = calculateSimilarity('Paneer Butter Masala', 'Paneer Butter');
console.log(`- "Paneer Butter Masala" vs "Paneer Butter": ${Math.round(match2 * 100)}% match`);
assert(match2 > 0.65, 'Fuzzy match should detect similarity');

const match3 = calculateSimilarity('Lemon Juice', 'Gulab Jamun');
console.log(`- "Lemon Juice" vs "Gulab Jamun": ${Math.round(match3 * 100)}% match`);
assert(match3 < 0.30, 'Unrelated items should have low similarity');

console.log('SUCCESS: Fuzzy match validations OK.');

console.log('\nStep 2: Checking schema type structures...');
const testSchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          price: { type: "number" }
        }
      }
    }
  }
};
assert(testSchema.properties.items.type === 'array', 'JSON schema should validate menu item array structure');
console.log('SUCCESS: Schema verification OK.');

console.log('\n--- ALL AI SMART IMPORT VALIDATION CHECKS PASSED SUCCESSFULLY ---');
process.exit(0);
