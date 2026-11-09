const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";
const NUMBER_WORDS = new Map([
  ["one", 1], ["a", 1], ["an", 1], ["ek", 1], ["ekta", 1], ["ekti", 1],
  ["এক", 1], ["একটা", 1], ["একটি", 1],
  ["two", 2], ["dui", 2], ["duita", 2], ["duto", 2], ["দুই", 2], ["দুইটা", 2], ["দুইটি", 2], ["দুটি", 2], ["দুটো", 2],
  ["three", 3], ["tin", 3], ["tinta", 3], ["tinti", 3], ["তিন", 3], ["তিনটা", 3], ["তিনটি", 3],
  ["four", 4], ["char", 4], ["chaar", 4], ["চার", 4], ["চারটা", 4],
  ["five", 5], ["pach", 5], ["panch", 5], ["পাঁচ", 5], ["পাঁচটা", 5],
  ["six", 6], ["choy", 6], ["ছয়", 6], ["ছয়", 6],
  ["seven", 7], ["sat", 7], ["সাত", 7],
  ["eight", 8], ["aat", 8], ["আট", 8],
  ["nine", 9], ["noy", 9], ["নয়", 9], ["নয়", 9],
  ["ten", 10], ["dosh", 10], ["দশ", 10],
]);

export const ASSISTANT_FILLER_WORDS = new Set([
  "a", "about", "actually", "all", "an", "and", "any", "around", "are", "at", "available",
  "best", "can", "choose", "could", "cost", "costs", "craving", "delicious", "delivery",
  "dish", "dishes", "do", "does", "eat", "eating", "else", "food", "foods", "for",
  "find", "get", "give", "good", "have", "hello", "hey", "hi", "how", "i", "id", "ill",
  "im", "in", "is", "it", "just", "like", "list", "looking", "meal", "meals", "me",
  "menu", "menus", "much", "near", "nearby", "nearest", "need", "of", "on", "option",
  "options", "order", "place", "places", "please", "popular", "price", "prices",
  "recommend", "recommendation", "recommendations", "restaurant", "restaurants", "show",
  "some", "spot", "spots", "suggest", "suggestions", "tasty", "the", "there", "to",
  "want", "wanted", "what", "whats", "where", "which", "with", "would", "you",
  "ami", "amake", "ache", "ase", "assalamu", "bhalo", "valo", "chai", "dakho", "dao",
  "dekhte", "dekhao", "diben", "din", "ektu", "khabar", "khabo", "khete", "ki",
  "kisu", "kichu", "kono", "koren", "korbe", "koro", "korun", "kothay", "lagbe",
  "nibo", "nite", "paben", "pabo", "pawa", "parbo", "please", "ta", "te", "theke",
  "tumi", "আপনি", "আমাকে", "আমার", "আমি",
  "আছে", "একটু", "একটা", "একটি", "কিছু", "কোথায়", "কোথায়", "খাবার",
  "খাবো", "খেতে", "চাই", "দেখাও", "দিন", "দিবেন", "দাও", "না", "পাবো",
  "পারবো", "প্লিজ", "ভালো", "মেনু", "আমাদের", "রেস্টুরেন্ট", "রেস্টুরেন্টে",
  "হ্যালো", "আসসালামু", "আলাইকুম",
]);

const COMMON_DESCRIPTORS = new Set([
  "affordable", "cheap", "favorite", "fresh", "halal", "healthy", "popular", "spicy",
  "tasty", "vegetarian", "vegan", "জাল", "ঝাল", "মজার", "সুস্বাদু",
]);
const TOKEN_ALIASES = new Map([
  ["biriyani", "biryani"], ["biriani", "biryani"],
  ["বার্গার", "burger"], ["বার্গারটা", "burger"], ["বাগার", "burger"],
  ["পিজ্জা", "pizza"], ["পিজা", "pizza"],
  ["বিরিয়ানি", "biryani"], ["বিরিয়ানি", "biryani"],
  ["চিকেন", "chicken"], ["মুরগি", "chicken"],
  ["ফ্রাই", "fries"], ["ফ্রেঞ্চ", "french"],
  ["পাস্তা", "pasta"], ["ভাত", "rice"], ["পোলাও", "pulao"],
]);

export function normalizeAssistantText(value) {
  if (typeof value !== "string") return "";
  const asciiDigits = [...value].map((character) => {
    const digit = BENGALI_DIGITS.indexOf(character);
    return digit < 0 ? character : String(digit);
  }).join("");
  return asciiDigits
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singularizeToken(token) {
  if (token.length > 5 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 5 && /(?:ches|shes|xes|zes)$/.test(token)) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

function tokensMatch(left, right) {
  const a = singularizeToken(TOKEN_ALIASES.get(left) || left);
  const b = singularizeToken(TOKEN_ALIASES.get(right) || right);
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1 || Math.min(a.length, b.length) < 5) return false;
  if (a.length === b.length) {
    const differences = [];
    for (let index = 0; index < a.length; index += 1) {
      if (a[index] !== b[index]) differences.push(index);
    }
    if (differences.length === 2) {
      const [first, second] = differences;
      if (second === first + 1 && a[first] === b[second] && a[second] === b[first]) return true;
    }
  }
  let mismatches = 0;
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    mismatches += 1;
    if (mismatches > 1) return false;
    if (a.length > b.length) i += 1;
    else if (b.length > a.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  if (i < a.length || j < b.length) mismatches += 1;
  return mismatches <= 1;
}

export function getAssistantQueryTokens(value, extraStopWords = []) {
  const excluded = new Set([...ASSISTANT_FILLER_WORDS, ...COMMON_DESCRIPTORS, ...extraStopWords]);
  return normalizeAssistantText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !excluded.has(token) && !NUMBER_WORDS.has(token) && !/^\d+$/.test(token));
}

export function isOrderIntent(value) {
  const text = normalizeAssistantText(value);
  return /\b(order|checkout|buy|purchase|place an order|place (?:my )?order|order for me|order this|i will have|ill have|kinbo|kinte chai|order korte chai|order diben|order den|order dao|nibo|nite chai|cart e dao)\b/.test(text) ||
    /অর্ডার|কিনতে চাই|কিনবো|খেতে চাই|অর্ডার দিন|অর্ডার দেন|অর্ডার দাও|অর্ডার করবো|অর্ডার করব|অর্ডার করতে চাই/.test(text);
}

export function isDoneIntent(value) {
  const text = normalizeAssistantText(value);
  return /^(?:(?:im|i am)\s+)?(?:done|finished|finish|complete|checkout|continue)(?:\s+(?:please|now|thanks|thank you))?$/.test(text) ||
    /^(?:no|no more|nothing else|thats all|that is all)(?:\s+(?:for now|please|thanks|thank you))?$/.test(text) ||
    /^(?:bas|shesh|shesh kori|ar kichu na|ar kichu lagbe na|ar lagbe na|ei porjonto|hoye geche|শেষ|শেষ করি|আর কিছু না|আর কিছু লাগবে না|আর লাগবে না|এই পর্যন্ত|হয়ে গেছে|হয়েছে|আর না)$/.test(text);
}

export function isYesIntent(value) {
  const text = normalizeAssistantText(value);
  if (/\b(no|not|cancel)\b|না/.test(text)) return false;
  return /^(?:yes|yeah|yep|yup|ok|okay|sure|confirm|confirmed|go ahead|ha|haa|hya|ji|thik ache|thik ase|korun|den)(?:\s|$)/.test(text) ||
    /^(?:হ্যাঁ|হা|জি|ঠিক আছে|নিশ্চিত|দিন)(?:\s|$)/.test(text);
}

export function isCancelIntent(value) {
  const text = normalizeAssistantText(value);
  return /^(?:no|cancel|stop|na|nah|batal|batil|বাদ|বাতিল|না)(?:\s|$)/.test(text) ||
    /^(?:i changed my mind|dont place (?:the )?order|i dont want (?:it|the order))$/.test(text);
}

function quantityAt(tokens, start, end) {
  const candidates = [
    { token: tokens[start - 1], distance: 1 },
    { token: tokens[start - 2], distance: 2 },
    { token: tokens[end + 1], distance: 1 },
  ].filter((candidate) => candidate.token);
  candidates.sort((a, b) => a.distance - b.distance);
  for (const { token } of candidates) {
    if (/^\d{1,2}$/.test(token)) return Number(token);
    const compactQuantity = token.match(/^(?:x)?(\d{1,3})(?:x|ta|ti|pcs?|টা|টি)?$/);
    if (compactQuantity) return Number(compactQuantity[1]);
    if (NUMBER_WORDS.has(token)) return NUMBER_WORDS.get(token);
  }
  return 1;
}

function findFoodNameInText(textTokens, foodTokens) {
  let best = null;
  for (let start = 0; start < textTokens.length; start += 1) {
    let textIndex = start;
    let matched = 0;
    let lastIndex = start;
    for (const foodToken of foodTokens) {
      while (textIndex < textTokens.length && textIndex - lastIndex <= 4 &&
          !tokensMatch(textTokens[textIndex], foodToken)) {
        textIndex += 1;
      }
      if (textIndex >= textTokens.length || textIndex - lastIndex > 4) break;
      matched += 1;
      lastIndex = textIndex;
      textIndex += 1;
    }
    if (matched === foodTokens.length) {
      const span = lastIndex - start;
      const score = foodTokens.length * 100 - span * 10;
      if (!best || score > best.score) best = { start, end: lastIndex, score, matched: foodTokens.length };
    }
  }
  return best;
}

export function findMenuItems(value, menu) {
  const tokens = normalizeAssistantText(value).split(" ").filter(Boolean);
  const matches = [];
  for (const food of menu || []) {
    const nameTokens = getAssistantQueryTokens(food.name);
    if (!nameTokens.length) continue;
    const occurrence = findFoodNameInText(tokens, nameTokens);
    if (!occurrence) continue;
    matches.push({
      food,
      quantity: quantityAt(tokens, occurrence.start, occurrence.end),
      score: occurrence.score,
      start: occurrence.start,
      end: occurrence.end,
    });
  }
  matches.sort((a, b) => b.score - a.score || a.start - b.start);
  return matches.filter((match) => !matches.some((other) =>
    other.score > match.score && match.start <= other.end && other.start <= match.end
  ));
}

export function matchNamedOption(value, options) {
  const text = normalizeAssistantText(value);
  const ordinal = text.match(/\b(first|1st|prothom)\b|প্রথম/);
  if (ordinal) return options[0] || null;
  const second = text.match(/\b(second|2nd|ditiyo)\b|দ্বিতীয়|দ্বিতীয়/);
  if (second) return options[1] || null;
  const third = text.match(/\b(third|3rd|tritiyo)\b|তৃতীয়|তৃতীয়/);
  if (third) return options[2] || null;
  const numbered = text.match(/\b(?:number|option|choice)?\s*(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (numbered) {
    const index = Number(numbered[1]) - 1;
    if (index >= 0 && index < options.length) return options[index];
  }

  const queryTokens = getAssistantQueryTokens(text);
  if (!queryTokens.length) return null;
  const ranked = options.map((option) => {
    const nameTokens = getAssistantQueryTokens(option.name);
    const matchedTokens = nameTokens.filter((nameToken) => queryTokens.some((token) => tokensMatch(token, nameToken)));
    return { option, score: matchedTokens.length / Math.max(nameTokens.length, queryTokens.length) };
  }).filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!ranked.length || (ranked.length > 1 && ranked[0].score === ranked[1].score)) return null;
  return ranked[0].option;
}

export function scoreFoodMatch(queryTokens, foodName) {
  const nameTokens = normalizeAssistantText(foodName).split(" ").filter(Boolean);
  if (!queryTokens.length || !nameTokens.length) return 0;
  return queryTokens.reduce((score, token) =>
    score + (nameTokens.some((nameToken) => tokensMatch(token, nameToken)) ? 1 : 0), 0);
}
