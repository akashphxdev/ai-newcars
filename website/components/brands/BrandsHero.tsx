import Link from "next/link";

export default function BrandsHero() {
  return (
    <div className="relative w-full overflow-hidden bg-surface" style={{ minHeight: 220 }}>
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:py-10" style={{ minHeight: 220 }}>
        <nav className="flex items-center gap-1.5 text-[13px] font-semibold" aria-label="Breadcrumb">
          <Link href="/" className="text-ink">
            Home
          </Link>
          <span className="text-muted">{">"}</span>
          <span className="text-brand">Brands</span>
        </nav>

        <h1 className="mt-4 font-head text-4xl font-bold leading-tight text-ink sm:text-5xl">
          All Car <span className="text-brand">Brands</span>
        </h1>
        <p className="mt-2 text-lg font-medium text-ink">Find your perfect manufacturer, all in one place</p>
      </div>
    </div>
  );
}
