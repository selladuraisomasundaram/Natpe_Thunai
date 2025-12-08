// src/utils/avatarGenerator.ts
export const DICEBEAR_AVATAR_STYLES = [
  "adventurer",
  "avataaars",
  "big-ears",
  "big-smile",
  "bottts",
  "croodles",
  "fun-emoji",
  "icons",
  "identicon",
  "initials",
  "lorelei",
  "micah",
  "miniavs",
  "open-peeps",
  "personas",
  "pixel-art",
  "rings",
  "shapes",
  "thumbs",
];

export const generateAvatarUrl = (
  seed: string,
  gender: "male" | "female" | "prefer-not-to-say",
  userType: "student" | "staff",
  style: string = "lorelei" // NEW: Add style parameter with a default
): string => {
  let selectedStyle = style;
  let genderParam = "";

  if (gender === "male") {
    genderParam = "&gender=male";
  } else if (gender === "female") {
    genderParam = "&gender=female";
  }

  // Override default style based on userType if a specific style isn't provided
  if (!style || style === "default") { // If no specific style is chosen, use type-based defaults
    if (userType === "student") {
      selectedStyle = "adventurer"; // Chill style for students
    } else if (userType === "staff") {
      selectedStyle = "personas"; // Professional style for staff
    }
  }

  // Ensure the selected style is one of the allowed DiceBear styles
  if (!DICEBEAR_AVATAR_STYLES.includes(selectedStyle)) {
    selectedStyle = "lorelei"; // Fallback to a safe default if invalid style is passed
  }

  return `https://api.dicebear.com/8.x/${selectedStyle}/svg?seed=${encodeURIComponent(seed)}${genderParam}`;
};