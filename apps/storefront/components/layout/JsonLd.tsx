/* Tiny server component that emits a JSON-LD <script> tag.

   Why this wrapper: Next.js 16 / React 19 flag `<script>` tags rendered
   directly inside React components with a dev console warning. A thin
   factory-style component sidesteps that warning by returning the script
   element from a dedicated component function — the exact recommended
   Next.js pattern for structured data. */
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
