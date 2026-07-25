import Link from "next/link";

export default function CompareHero() {
  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <nav className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold" aria-label="Breadcrumb">
          <Link href="/" className="text-ink">
            Home
          </Link>
          <span className="text-muted">{">"}</span>
          <span className="text-brand">Compare Cars</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">All Car Comparisons</h1>
        <p className="mt-2 max-w-2xl text-[14.5px] font-medium text-muted">
          Explore and compare cars side-by-side to find the perfect match for your needs.
        </p>
      </div>
    </div>
  );
}
