// Emits one structured-data block. A component rather than an inline
// <script> so every page escapes the payload the same way.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        // "<" is the only character that can break out of a script block.
        __html: JSON.stringify(data).replaceAll("<", "\\u003c"),
      }}
    />
  );
}
