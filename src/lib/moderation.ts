export const BLOCKED_WORDS: string[] = [
  "badword",
  "spam",
  "scam",
  "fraud",
  "abuse",
  "hate",
  "kill",
  "sex",
  "porn",
  "racist",
  "nude",
  "illegal",
];

export const containsBlockedWords = (text: string): boolean => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return BLOCKED_WORDS.some(word => lowerText.includes(word));
};