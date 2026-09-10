export type ProfileDraft = {
  username: string;
  name: string;
  bio: string;
  website: string;
  location: string;
  photoUri?: string;
};

export function validateProfile(draft: ProfileDraft): string | null {
  if (!/^[a-zA-Z0-9_.]{3,30}$/.test(draft.username.trim())) return 'Use 3–30 letters, numbers, dots, or underscores for your username.';
  if (!draft.name.trim()) return 'Please enter a display name.';
  if (draft.name.trim().length > 60) return 'Keep your display name under 60 characters.';
  if (draft.bio.length > 150) return 'Keep your bio within 150 characters.';
  if (draft.website.trim()) {
    try {
      const url = new URL(draft.website.trim());
      if (!['https:', 'http:'].includes(url.protocol) || !url.hostname.includes('.')) return 'Enter a full website URL, such as https://example.com.';
    } catch { return 'Enter a full website URL, such as https://example.com.'; }
  }
  return null;
}
