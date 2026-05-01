/**
 * Renders product description.
 * - If the source contains HTML tags, renders as HTML (Medusa admin is trusted).
 * - If plain text, splits on newlines and renders as paragraphs (preserves visual breaks).
 *
 * Backend gap (flagged in PDP redesign notes): Medusa's default product.description
 * is a plain text field. To author rich content, an admin extension (rich-text editor)
 * or a separate `rich_description` metadata field is required. This component is ready
 * for either.
 */

interface ProductDescriptionProps {
  html: string;
}

const HTML_TAG_RE = /<[a-z][\s\S]*?>/i;

export default function ProductDescription({ html }: ProductDescriptionProps) {
  const looksLikeHtml = HTML_TAG_RE.test(html);
  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  // Always render through HTML so backend-authored HTML appears exactly as entered.
  // For plain text, we generate safe paragraph markup to preserve line breaks.
  const contentHtml = looksLikeHtml
    ? html
    : html
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block) => `<p>${escapeHtml(block).replaceAll("\n", "<br />")}</p>`)
        .join("");

  return (
    <div
      className="
        text-text-secondary leading-relaxed
        [&>p]:mb-4 [&>p:last-child]:mb-0
        [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-text-primary [&>h1]:mt-6 [&>h1]:mb-3
        [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-text-primary [&>h2]:mt-6 [&>h2]:mb-3
        [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-text-primary [&>h3]:mt-5 [&>h3]:mb-2
        [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul]:space-y-1
        [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol]:space-y-1
        [&_li]:text-text-secondary
        [&>a]:text-brand [&>a]:underline [&>a]:underline-offset-2 hover:[&>a]:text-brand-hover
        [&_strong]:font-semibold [&_strong]:text-text-primary
        [&_em]:italic
        [&>blockquote]:border-l-4 [&>blockquote]:border-border [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-text-muted [&>blockquote]:my-4
        [&>hr]:my-6 [&>hr]:border-border
        [&>img]:rounded-lg [&>img]:my-4
      "
      dangerouslySetInnerHTML={{ __html: contentHtml }}
    />
  );
}
