// return true if a word is plural
export const isPlural = (word)=> {
  const pluralRegex = /s\b/;

  if (pluralRegex.test(word)) {
    word = word.toLowerCase();
    const singularForm = word.replace(/s\b/, ''); 
    return word !== singularForm && word !== `${singularForm.split(" ")[0]} leaves`;
  }
  return false;
}

export default { isPlural };
