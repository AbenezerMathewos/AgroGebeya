// Uploaded images come back from the API as relative paths like "/uploads/xyz.jpg".
// External/manually-pasted image URLs are already absolute (http/https).
// This resolves either case to something an <img> tag can load directly.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export function resolveImageUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url}`;
}