const str1 = "bab azzouar";
const str2 = "bab ezzouar";

function fuzzyMatch(c1, c2) {
  const normalizeStr = (s) => (s||'').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
  const n1 = normalizeStr(c1);
  const n2 = normalizeStr(c2);
  
  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  // also handle "bab ezzouar" vs "bab azzouar" by replacing "e" and "a" if needed, but that's too much.
  // We can calculate Levenshtein distance, or just replace 'e'/'a' and vowels?
  // Let's replace all vowels with a wildcard or remove them, except the first letter.
  const stripVowels = (s) => s.replace(/[aeiouy]/g, '');
  if (stripVowels(n1) === stripVowels(n2)) return true;
  
  return false;
}

console.log(fuzzyMatch(str1, str2));
