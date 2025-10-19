export function emailToUsername(email: string): string {
  const normalized = email.trim().toLowerCase();
  const slug = normalized.replace(/[^a-z0-9]/gi, "-");
  return slug.length > 0 ? slug : `user-${Date.now()}`;
}
