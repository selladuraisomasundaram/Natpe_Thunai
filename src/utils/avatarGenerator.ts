// src/utils/avatarGenerator.ts

/**
 * Generates a DiceBear avatar URL based on username, gender, user type, and custom avatar options.
 * Uses the 'personas' style for gender-specific avatars.
 *
 * @param username The public username of the user.
 * @param gender The gender of the user ('male', 'female', 'prefer-not-to-say').
 * @param userType The type of user ('student', 'staff').
 * @param avatarOptions Optional object for specific DiceBear customization parameters.
 * @returns A URL to the generated DiceBear avatar.
 */
export const generateAvatarUrl = (
  username: string,
  gender: "male" | "female" | "prefer-not-to-say",
  userType: "student" | "staff",
  avatarOptions?: {
    hair?: string;
    eyes?: string;
    mouth?: string;
    skinColor?: string;
    clothing?: string;
    accessories?: string;
  }
): string => {
  const baseUrl = "https://api.dicebear.com/8.x/personas/svg";
  
  // Use username as seed for consistent avatar generation
  const seed = encodeURIComponent(username);

  let params = [`seed=${seed}`];

  if (gender === "male") {
    params.push("gender=male");
  } else if (gender === "female") {
    params.push("gender=female");
  }
  // If 'prefer-not-to-say', no specific gender param is added, DiceBear will pick a default.

  // Add custom avatar options if provided
  if (avatarOptions) {
    for (const [key, value] of Object.entries(avatarOptions)) {
      if (value) {
        params.push(`${key}=${encodeURIComponent(value)}`);
      }
    }
  }
  
  return `${baseUrl}?${params.join('&')}`;
};