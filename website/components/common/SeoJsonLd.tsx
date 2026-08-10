// components/common/SeoJsonLd.tsx
//
// Renders admin-managed JSON-LD structured data (SeoMeta's vehicleSchema/
// reviewSchema/articleSchema/authorSchema/breadcrumbSchema) as
// <script type="application/ld+json"> tags. The backend validates each
// field is parseable JSON on save, but this still parses defensively —
// it's raw text either way.
import { toSafeJsonLd } from "@/lib/schema";

function parseSchema(raw: string | null | undefined): object | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function SeoJsonLd({ schemas }: { schemas: (string | null | undefined)[] }) {
  const parsed = schemas.map(parseSchema).filter((s): s is object => s !== null);
  if (parsed.length === 0) return null;

  return (
    <>
      {parsed.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: toSafeJsonLd(schema) }} />
      ))}
    </>
  );
}
