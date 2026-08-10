import type { ReactNode } from "react";
import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/seo";
import ToolsSidebar from "./ToolsSidebar";

type Accent = "brand" | "ev";

interface CalculatorPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  breadcrumb: string;
  // The page's own URL, so the breadcrumb trail can be emitted as
  // structured data rather than only drawn on screen.
  path: string;
  children: ReactNode;
  // Explainer, FAQ and anything else that reads rather than calculates.
  // Kept separate because the calculator wants the full width and this
  // does not — it sits beside the tools rail instead.
  belowFold?: ReactNode;
  accent?: Accent;
}

export default function CalculatorPageShell({
  eyebrow,
  title,
  description,
  breadcrumb,
  path,
  children,
  belowFold,
  accent = "brand",
}: CalculatorPageShellProps) {
  const eyebrowColor = accent === "ev" ? "text-ev" : "text-brand";

  // The trail was drawn but never described. Search engines had no way to
  // read the Home > Tools > X hierarchy the page already shows.
  // "Tools" carries no href because there is no /tools landing page; a
  // ListItem without an item is valid and honest, a link to a 404 is not.
  const crumbs = breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Tools" },
    { name: breadcrumb, href: path },
  ]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfcfe] dark:bg-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-[1240px] px-4 pb-7 pt-5 sm:px-6 sm:pb-9 lg:px-8 lg:pb-10">
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

      <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {children}

        {belowFold && (
          <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1 space-y-10">{belowFold}</div>
            <div className="w-full lg:w-[300px] lg:shrink-0">
              <ToolsSidebar currentHref={path} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
