export const wetConversionFactors = {
    'tsp': 1,
    'tbsp': 3,
    'fl oz': 6,
    'cup': 48,
    'pt': 96,
    'qt': 192,
    'gal': 768
  };
export const metricWetConversionFactors = {
    'mL': 1,
    'L': 1000
};
export const getUnitSystemForWet = (unit) => {
  let unitSystem = '';
  if (unit in wetConversionFactors){
    unitSystem = 'customary';
  } else if (unit in metricWetConversionFactors) {
    unitSystem = 'metric';
  } else {
    unitSystem = 'unknown'
  }
  return unitSystem;
};
export function addWetIngredients(ingredients, conversionFactorType) {
  
    let conversionFactors;
    switch(conversionFactorType){
     case('metric'):
       conversionFactors = metricWetConversionFactors;
       break;
     case('customary'):
       conversionFactors = wetConversionFactors;
       break;
     default:
       console.log('Please enter a valid unit system, metric or customary!');
       return;
     
    }
    // Convert each ingredient to teaspoons and sum them up
     const totalAmountInSmallestUnit = ingredients.reduce((total, { amount, unit }) => {
      const conversionFactor = conversionFactors[unit] || 0;
       return total + amount * conversionFactor;
     }, 0);
  
     // Determine the largest possible unit for the result
     const units = Object.keys(conversionFactors).reverse(); // Start with the largest unit
     let resultAmount = totalAmountInSmallestUnit;
   
     for (const unit of units) {
       const conversionFactor = conversionFactors[unit];
       const unitAmount = resultAmount / conversionFactor;
   
       if (unitAmount >= 1) {
         resultAmount = unitAmount;
         return { amount: resultAmount, unit: unit };
       }
     }
   
     // If the result is less than 1, return in smallest unit
     return { amount: resultAmount, unit: Object.keys(conversionFactors)[0] };
   
   }
