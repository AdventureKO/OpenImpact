// Simple unit conversion utility for mass and volume and aggregation
// Supports: g, kg, mg, lb, oz  (mass)
//           mL, L, tsp, tbsp, fl oz, cup, pt, qt, gal (volume)

const MASS = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

const VOLUME = {
  mL: 1,
  ml: 1,
  L: 1000,
  l: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  'fl oz': 29.5735,
  cup: 236.588,
  pt: 473.176,
  qt: 946.353,
  gal: 3785.41,
};

function roundFriendly(n) {
  if (!isFinite(n)) return n;
  const abs = Math.abs(n);
  if (abs >= 10) return Math.round(n);
  if (abs >= 1) return Math.round(n * 10) / 10;
  return Math.round(n * 100) / 100;
}

function chooseDisplayUnitForVolume(amountMl, targetSystem = 'metric') {
  // choose a display unit so numbers are easy to read (prefer >=1 when possible)
  const unitsOrder = targetSystem === 'metric'
    ? [ ['L', VOLUME.L], ['qt', VOLUME.qt], ['cup', VOLUME.cup], ['fl oz', VOLUME['fl oz']], ['tbsp', VOLUME.tbsp], ['tsp', VOLUME.tsp], ['mL', VOLUME.mL] ]
    : [ ['gal', VOLUME.gal], ['qt', VOLUME.qt], ['pt', VOLUME.pt], ['cup', VOLUME.cup], ['fl oz', VOLUME['fl oz']], ['tbsp', VOLUME.tbsp], ['tsp', VOLUME.tsp] ];

  for (const [u, factor] of unitsOrder) {
    const val = amountMl / factor;
    if (val >= 1) {
      const display = roundFriendly(val);
      // for metric prefer L over qt when appropriate
      if (targetSystem === 'metric' && u === 'qt') continue;
      return { amount: display, unit: u };
    }
  }
  // nothing >=1, pick smallest sensible (tsp) for tiny volumes, otherwise mL
  if (amountMl < VOLUME.tbsp) {
    const val = amountMl / VOLUME.tsp;
    return { amount: roundFriendly(val), unit: 'tsp' };
  }
  if (amountMl < VOLUME['fl oz']) {
    const val = amountMl / VOLUME.tbsp;
    return { amount: roundFriendly(val), unit: 'tbsp' };
  }
  return { amount: Math.round(amountMl), unit: 'mL' };
}

function chooseDisplayUnitForMass(amountG, targetSystem = 'metric') {
  const unitsOrder = targetSystem === 'metric'
    ? [ ['kg', MASS.kg], ['g', MASS.g] ]
    : [ ['lb', MASS.lb], ['oz', MASS.oz] ];
  for (const [u, factor] of unitsOrder) {
    const val = amountG / factor;
    if (val >= 1) return { amount: roundFriendly(val), unit: u };
  }
  // fallback to grams
  return { amount: Math.round(amountG), unit: 'g' };
}

function normalizeUnit(u) {
  if (!u) return '';
  const s = String(u).trim().toLowerCase();
  if (s === 'g' || s === 'gram' || s === 'grams') return 'g';
  if (s === 'kg' || s === 'kilogram' || s === 'kilograms') return 'kg';
  if (s === 'mg' || s === 'milligram' || s === 'milligrams') return 'mg';
  if (s === 'lb' || s === 'lbs' || s === 'pound' || s === 'pounds') return 'lb';
  if (s === 'oz' || s === 'ounce' || s === 'ounces') return 'oz';
  if (s === 'ml' || s === 'milliliter' || s === 'milliliters') return 'mL';
  if (s === 'l' || s === 'liter' || s === 'liters') return 'L';
  if (s === 'tsp' || s === 'teaspoon' || s === 'teaspoons') return 'tsp';
  if (s === 'tbsp' || s === 'tablespoon' || s === 'tablespoons') return 'tbsp';
  if (s === 'fl oz' || s === 'floz' || s === 'flozs') return 'fl oz';
  if (s === 'cup' || s === 'cups') return 'cup';
  if (s === 'pt' ) return 'pt';
  if (s === 'qt') return 'qt';
  if (s === 'gal') return 'gal';
  return u;
}

function unitType(u) {
  const n = normalizeUnit(u);
  if (n in MASS) return 'mass';
  if (n in VOLUME) return 'volume';
  return 'count';
}

function toBase(amount, unit) {
  const n = normalizeUnit(unit);
  const t = unitType(n);
  const a = Number(amount) || 0;
  if (t === 'mass') {
    const factor = MASS[n] || 1;
    return { amount: a * factor, unit: 'g', type: 'mass' };
  }
  if (t === 'volume') {
    const factor = VOLUME[n] || 1;
    return { amount: a * factor, unit: 'mL', type: 'volume' };
  }
  return { amount: a, unit: '', type: 'count' };
}

function fromBase(amount, targetUnit) {
  const n = normalizeUnit(targetUnit);
  const t = unitType(n);
  if (t === 'mass') {
    const factor = MASS[n] || 1;
    return { amount: amount / factor, unit: n };
  }
  if (t === 'volume') {
    const factor = VOLUME[n] || 1;
    return { amount: amount / factor, unit: n };
  }
  return { amount, unit: '' };
}

function convert(amount, fromUnit, toUnit) {
  const base = toBase(amount, fromUnit);
  if (base.type === 'count') return { amount, unit: fromUnit };
  return fromBase(base.amount, toUnit);
}

function sumIngredients(groups, targetSystem = 'metric') {
  // groups: object or array of ingredient entries { name, amount, unit }
  // returns map by name -> { amount, unit, type }
  const map = new Map();
  const targetMassUnit = targetSystem === 'metric' ? 'kg' : 'lb';
  const targetVolumeUnit = targetSystem === 'metric' ? 'L' : 'qt';

  // preserve source items (including category when groups is an object)
  const entries = [];
  if (Array.isArray(groups)) {
    for (const it of groups) entries.push({ ...(it || {}), category: it.category || '' });
  } else {
    for (const [cat, arr] of Object.entries(groups || {})) {
      for (const it of arr || []) entries.push({ ...(it || {}), category: cat });
    }
  }

  for (const it of entries) {
    const name = (it.name || '').trim().toLowerCase();
    if (!name) continue;
    const unit = it.unit || '';
    const t = unitType(unit);
    if (t === 'count') {
      const key = `${name}::count`;
      const cur = map.get(key) || { name, amount: 0, unit: '', sources: [] };
      cur.amount += Number(it.amount) || 0;
      cur.sources.push({ amount: Number(it.amount) || 0, unit: unit || '', category: it.category || '', projectName: it.projectName || it.recipeName || '', projectId: it.projectId || it.recipeId || null, ingredientLabel: it.ingredientLabel || it.name || '' });
      map.set(key, cur);
    } else if (t === 'mass') {
      const base = toBase(it.amount, unit);
      const cur = map.get(name + '::mass') || { name, amountBase: 0, type: 'mass', sources: [] };
      cur.amountBase += base.amount;
      cur.sources.push({ amount: Number(it.amount) || 0, unit: unit || '', category: it.category || '', projectName: it.projectName || it.recipeName || '', projectId: it.projectId || it.recipeId || null, ingredientLabel: it.ingredientLabel || it.name || '' });
      map.set(name + '::mass', cur);
    } else if (t === 'volume') {
      const base = toBase(it.amount, unit);
      const cur = map.get(name + '::volume') || { name, amountBase: 0, type: 'volume', sources: [] };
      cur.amountBase += base.amount;
      cur.sources.push({ amount: Number(it.amount) || 0, unit: unit || '', category: it.category || '', projectName: it.projectName || it.recipeName || '', projectId: it.projectId || it.recipeId || null, ingredientLabel: it.ingredientLabel || it.name || '' });
      map.set(name + '::volume', cur);
    }
  }

  // convert bases back to target units
  const out = [];
  for (const [k, v] of map.entries()) {
    const firstSourceCategory = v.sources && v.sources.length > 0 ? v.sources[0].category : 'Uncategorized';
    if (k.endsWith('::mass')) {
      // amountBase is in grams
      const display = chooseDisplayUnitForMass(v.amountBase, targetSystem);
      out.push({ name: v.name, amount: display.amount, unit: display.unit, type: 'mass', category: firstSourceCategory, sources: v.sources || [] });
    } else if (k.endsWith('::volume')) {
      // amountBase is in mL
      const display = chooseDisplayUnitForVolume(v.amountBase, targetSystem);
      out.push({ name: v.name, amount: display.amount, unit: display.unit, type: 'volume', category: firstSourceCategory, sources: v.sources || [] });
    } else {
      out.push({ name: v.name, amount: Number((v.amount || 0).toFixed(2)), unit: v.unit || '', type: 'count', category: firstSourceCategory, sources: v.sources || [] });
    }
  }

  return out;
}

module.exports = { normalizeUnit, unitType, toBase, fromBase, convert, sumIngredients };
