import type { Metadata } from "next";
import { getStaticPageMetadata } from "@/features/seo/seo.api";
import { getAllBrands } from "@/features/brands/brand.api";
import ScrapCarLeadForm from "@/components/scrap/ScrapCarLeadForm";

export async function generateMetadata(): Promise<Metadata> {
  return getStaticPageMetadata(
    "scrap-car",
    {
      title: "Scrap Your Car | Free Pick-up & Certificate of Deposit | TimesAuto",
      description:
        "Scrap your old car through a registered facility. Get a quote, free pick-up, and the Certificate of Deposit that earns you a road-tax rebate on your next car.",
    },
    "/scrap-car",
  );
}

export default async function ScrapCarPage() {
  const brands = await getAllBrands().catch(() => []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">End-of-life vehicles</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Scrap your car the official way</h1>
        <p className="mt-3 text-gray-600">
          Vehicles over 15 years old can be scrapped at a registered facility. You get paid for the
          vehicle, and a Certificate of Deposit worth a rebate on the road tax of your next car.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border border-gray-200 p-5">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Tell us about your car</h2>
          <ScrapCarLeadForm brands={brands.map((b) => ({ id: b.id, name: b.name }))} />
        </section>

        <aside className="space-y-4">
          <Step n={1} title="Share your details" body="Takes a minute. Only your number and city are required." />
          <Step n={2} title="Get a quote" body="Our registered partner calls you with a price for the vehicle." />
          <Step n={3} title="Free pick-up" body="They collect the car and handle the paperwork." />
          <Step n={4} title="Certificate of Deposit" body="Issued after scrapping — use it for a road-tax rebate." />

          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="text-sm font-bold text-gray-900">What to keep ready</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>Original RC</li>
              <li>Your ID proof</li>
              <li>Loan closure (NOC), if the car was financed</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
        {n}
      </span>
      <div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{body}</p>
      </div>
    </div>
  );
}
