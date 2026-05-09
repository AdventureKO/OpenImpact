import { addDryIngredients } from './addDryIngredients';
import { addWetIngredients } from './addWetIngredients';

// small numeric parser to handle fractions like "1 1/2" or "1/2"
function numericQuantity(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const s = String(val).trim();
  // mixed number e.g. "1 1/2"
  if (/^\d+\s+\d+\/\d+$/.test(s)) {
    const [whole, frac] = s.split(' ');
    const [num, den] = frac.split('/').map(Number);
    return Number(whole) + (num/den);
  }
  if (/^\d+\/\d+$/.test(s)) {
    const [num, den] = s.split('/').map(Number);
    return num/den;
  }
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

const metricDryConversionFactors = {
    'tsp': { unit: 'g', factor: 5.69 },
    'tbsp': { unit: 'g', factor: 14.175 },
    'oz': { unit: 'g', factor: 28.3495 },
    'cup': { unit: 'g', factor:  200 },
    'lb': { unit: 'g', factor: 453.592 },
};
const metricWetConversionFactors = {
    'tsp': { unit: 'mL', factor: 4.929 },
    'tbsp': { unit: 'mL', factor: 14.7868 },
    'fl oz': { unit: 'mL', factor: 29.5735 },
    'cup': { unit: 'mL', factor: 236.588 },
    'pt': { unit: 'mL', factor: 568.261 },
    'qt': { unit: 'mL', factor: 946.353 },
    'gal': { unit: 'L', factor: 3.78541 },
};

const customaryDryConversionFactors = {
    'mg': { unit: 'tsp', factor: 0.000202},
    'g': { unit: 'tsp', factor: 0.202 },
    'kg': { unit: 'lb', factor: 2.205 },
};
const customaryWetConversionFactors = {
    'mL': { unit: 'tsp', factor: 0.203 },
    'L': { unit: 'qt', factor: 1.057 },
};
const convertUnitHelper = (amount, unit, conversionFactors)=> {
    if (unit in conversionFactors) {
        const conversionInfo = conversionFactors[unit];
        const convertedValue = amount * conversionInfo.factor;
        return {
            amount: convertedValue,
            unit: conversionInfo.unit,
        };
    } else {
        return {
            amount: amount,
            unit: unit,
        };
    }
}

export const convertCustomaryToMetric = (ingredients)=> {
   return ingredients.map(ingredient => {
    let ingredientType = ingredient.type;
    let conversionFactors;
    switch(ingredientType){
     case('dry'):
       conversionFactors = metricDryConversionFactors;
       break;
     case('wet'):
       conversionFactors = metricWetConversionFactors;
       break;
     default:
       console.log('Please enter ingredient type, wet or dry!', ingredients);
       return;
     
    }
    let result = convertUnitHelper(parseFloat(numericQuantity(ingredient.amount)), ingredient.unit, conversionFactors);
    const addIngredients = ingredient.type === 'dry'? addDryIngredients: addWetIngredients
    let updatedResult = addIngredients([result], 'metric');
   
    if (updatedResult.amount !== 0) {
        result.amount = updatedResult.amount;
        result.unit = updatedResult.unit;
    }
    ingredient.amount = result.amount.toFixed(2);
    ingredient.unit = result.unit;
    return ingredient; 
   })
};

export const findUnitSystem = (item) => {
    let count = 0;
    let found = true;
    let unitSystem;
    const ingredients = item && item.ingredients ? item.ingredients : [];
    while (found && count < ingredients.length) {
       if (ingredients[count].unit in metricDryConversionFactors || ingredients[count].unit in metricWetConversionFactors) {
         unitSystem = 'customary';
         found = false;
       } else if (ingredients[count].unit in customaryDryConversionFactors || ingredients[count].unit in customaryWetConversionFactors) {
         unitSystem = 'metric';
         found = false;
       } else {
         count++;
       }
    }
    return unitSystem ? unitSystem : 'customary';
}

export const convertMetricToCustomary = (ingredients)=> {
    return ingredients.map(ingredient => {
     let ingredientType = ingredient.type;
     let conversionFactors;
     switch(ingredientType){
      case('dry'):
        conversionFactors = customaryDryConversionFactors;
        break;
      case('wet'):
        conversionFactors = customaryWetConversionFactors;
        break;
      default:
        console.log('Please enter ingredient type, wet or dry!', ingredients);
        return;
      
     }
    let result = convertUnitHelper(parseFloat(numericQuantity(ingredient.amount)), ingredient.unit, conversionFactors);
    const addIngredients = ingredient.type === 'dry'? addDryIngredients: addWetIngredients
    let updatedResult = addIngredients([result], 'customary');
    if (updatedResult.amount !== 0) {
        result.amount = updatedResult.amount;
        result.unit = updatedResult.unit;
    }
    ingredient.amount = (result.amount).toFixed(2);
    ingredient.unit = result.unit;
    return ingredient; 
    })
 }
