import type { ReactNode } from "react";
import Link from "next/link";

type Accent = "brand" | "ev";

interface CalculatorPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  breadcrumb: string;
  children: ReactNode;
  accent?: Accent;
}

export default function CalculatorPageShell({
  eyebrow,
  title,
  description,
  breadcrumb,
  children,
  accent = "brand",
}: CalculatorPageShellProps) {
  const eyebrowColor = accent === "ev" ? "text-ev" : "text-brand";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfcfe] dark:bg-page">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-[1480px] px-4 pb-7 pt-5 sm:px-6 sm:pb-9 lg:px-8 lg:pb-10">
          <nav className="mb-7 flex min-w-0 items-center gap-2 overflow-hidden text-[12px] font-medium text-muted" aria-label="Breadcrumb">
            <Link href="/" className="shrink-0 transition-colors hover:text-brand">
              Home
            </Link>
            <span aria-hidden="true" className="text-faint">/</span>
            <span className="shrink-0">Tools</span>
            <span aria-hidden="true" className="text-faint">/</span>
            <span className="truncate text-ink">{breadcrumb}</span>
          </nav>

          <p className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${eyebrowColor}`}>{eyebrow}</p>
          <h1 className="mt-2 max-w-5xl text-balance font-head text-[30px] font-extrabold leading-[1.08] text-ink sm:text-[40px] lg:text-[48px]">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-[14px] font-medium leading-6 text-muted sm:text-[15px]">{description}</p>
        </div>
      </section>

      <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">{children}</div>
    </main>
  );
}
