/** Plain text for previews (strips HTML from catalog/PDP descriptions). */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export const DESCRIPTION_PREVIEW_WORDS = 40;

export function buildDescriptionPreview(
  plain: string,
  maxWords: number = DESCRIPTION_PREVIEW_WORDS,
): { preview: string; hasMore: boolean } {
  const words = plain.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return { preview: plain, hasMore: false };
  }
  return {
    preview: words.slice(0, maxWords).join(" "),
    hasMore: true,
  };
}
