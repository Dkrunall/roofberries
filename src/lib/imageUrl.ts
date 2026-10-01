/**
 * Whether a string is safe to hand to `next/image` as `src`.
 *
 * `image_url` columns are free-text, admin-editable fields — someone can
 * (and did) type a placeholder like "NA" instead of leaving it blank.
 * `next/image` doesn't degrade gracefully for that: it throws
 * `Failed to parse src "NA"` and crashes the page. Anywhere an image URL
 * comes from menu/category data, gate the <Image> render on this instead
 * of a plain truthiness check.
 */
export function isValidImageSrc(url: string | null | undefined): url is string {
  if (!url) return false;
  return url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:');
}
