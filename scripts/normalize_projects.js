const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', '..', 'fundraisers.json');
// in this workspace recipes.json appears at repo root; adapt if needed
const altFile = path.join(__dirname, '..', '..', '..', 'fundraisers.json');
const target = fs.existsSync(file) ? file : (fs.existsSync(altFile) ? altFile : null);
if (!target) {
  console.error('fundraisers.json not found in expected paths');
  process.exit(1);
}

const raw = fs.readFileSync(target, 'utf8');
let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.error('Failed to parse fundraisers.json', err);
  process.exit(1);
}

const projects = (data.projects || data.recipes || []);

function normalizeIngredient(ing) {
  if (!ing) return { name: '', amount: '', unit: '', category: 'Uncategorized', type: 'dry' };
  if (typeof ing === 'string') {
    const trimmed = ing.trim();
    const m = trimmed.match(/^([\d\/\.]+)\s*(\S+)?\s*(.*)$/);
    if (m) {
      return { amount: m[1] || '', unit: m[2] || '', name: (m[3] || '').trim() || (m[2] || '').trim() || trimmed, category: 'Uncategorized', type: 'dry' };
    }
    return { name: trimmed, amount: '', unit: '', category: 'Uncategorized', type: 'dry' };
  }
  // object
  return {
    name: ing.name || ing.item || ing.ingredient || ing.title || '',
    amount: (ing.amount !== undefined && ing.amount !== null) ? String(ing.amount) : (ing.qty || ing.quantity || ''),
    unit: ing.unit || ing.u || '',
    category: ing.category || ing.cat || 'Uncategorized',
    type: ing.type || 'dry',
  };
}

const normalized = projects.map(r => {
  const nr = { ...r };
  nr.name = r.name || r.title || r.recipeName || r.displayName || 'Untitled Cause';
  nr.ingredients = (r.ingredients || []).map(normalizeIngredient);
  return nr;
});

const out = { ...data, projects: normalized };
fs.writeFileSync(target, JSON.stringify(out, null, 2), 'utf8');
console.log('Wrote normalized fundraisers.json to', target);
