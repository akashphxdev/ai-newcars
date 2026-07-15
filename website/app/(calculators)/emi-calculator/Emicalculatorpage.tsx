"use client"
import { useState as useState2 } from "react";
import { useState, useMemo } from "react";
import Link from "next/link";

const ACCENT = "#D4300F";

const formatINR = (n: number) =>
  n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const formatLakh = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  return `₹${formatINR(n)}`;
};

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  onChange: (v: number) => void;
};

const Slider = ({ label, value, min, max, step, format, onChange }: SliderProps) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-xs font-semibold text-gray-500">{label}</label>
        <span className="text-base font-black text-gray-900">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none"
        style={{
          background: `linear-gradient(to right, ${ACCENT} ${pct}%, #e5e7eb ${pct}%)`,
        }}
      />
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 3px solid ${ACCENT};
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 3px solid ${ACCENT};
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          border-style: solid;
        }
      `}</style>
    </div>
  );
};
const faqs = [
  {
    q: "What is an EMI in a car loan?",
    a: "EMI stands for Equated Monthly Installment — a fixed amount you pay every month to repay your car loan. It includes both principal and interest, calculated so that the loan is fully repaid by the end of the tenure.",
  },
  {
    q: "How is car loan EMI calculated?",
    a: "EMI is calculated using the formula: EMI = [P × R × (1+R)^N] / [(1+R)^N − 1], where P is the loan amount, R is the monthly interest rate, and N is the number of monthly installments (tenure in months).",
  },
  {
    q: "Does a higher down payment reduce my EMI?",
    a: "Yes. A higher down payment reduces the loan amount you need to borrow, which directly lowers your EMI and the total interest paid over the loan tenure.",
  },
  {
    q: "What is a good loan tenure for a car loan?",
    a: "Most car loans range from 3 to 7 years. A shorter tenure means higher EMI but lower total interest. A longer tenure reduces your monthly EMI but increases the total interest paid.",
  },
  {
    q: "Can I prepay or foreclose my car loan early?",
    a: "Most lenders allow part-prepayment or full foreclosure after a lock-in period, often with a small prepayment charge. Paying off early can save significantly on total interest.",
  },
  {
    q: "Does my credit score affect the interest rate?",
    a: "Yes. A higher credit score (CIBIL 750+) usually qualifies you for lower interest rates, while a lower score may lead to higher rates or stricter loan terms.",
  },
];

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-none">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-bold text-gray-900">{q}</span>
        <svg
          className="size-4 shrink-0 text-gray-400 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
          viewBox="0 0 12 8"
          fill="none"
        >
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "300px" : "0px" }}
      >
        <p className="pb-4 text-sm leading-relaxed text-gray-600">{a}</p>
      </div>
    </div>
  );
};
const DonutChart = ({ principal, interest }: { principal: number; interest: number }) => {
  const total = principal + interest;
  const principalPct = total > 0 ? (principal / total) * 100 : 0;
  const r = 70;
  const circumference = 2 * Math.PI * r;
  const principalLen = (principalPct / 100) * circumference;

  return (
    <svg viewBox="0 0 180 180" className="size-44 sm:size-52">
      <circle cx="90" cy="90" r={r} fill="none" stroke="#fde8e3" strokeWidth="22" />
      <circle
        cx="90"
        cy="90"
        r={r}
        fill="none"
        stroke={ACCENT}
        strokeWidth="22"
        strokeDasharray={`${principalLen} ${circumference - principalLen}`}
        strokeLinecap="round"
        transform="rotate(-90 90 90)"
        style={{ transition: "stroke-dasharray 0.4s ease" }}
      />
      <text x="90" y="85" textAnchor="middle" className="fill-gray-900 text-[22px] font-black">
        {principalPct.toFixed(0)}%
      </text>
      <text x="90" y="104" textAnchor="middle" className="fill-gray-400 text-[10px] font-semibold uppercase tracking-wide">
        Principal
      </text>
    </svg>
  );
};

export default function EmiCalculatorPage() {
  const [price, setPrice] = useState(1200000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [rate, setRate] = useState(9.5);
  const [tenure, setTenure] = useState(5);

  const { downPayment, loanAmount, emi, totalInterest, totalPayment, schedule } = useMemo(() => {
    const downPayment = Math.round((price * downPaymentPct) / 100);
    const loanAmount = price - downPayment;
    const monthlyRate = rate / 12 / 100;
    const months = tenure * 12;

    const emi =
      monthlyRate === 0
        ? loanAmount / months
        : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
          (Math.pow(1 + monthlyRate, months) - 1);

    const totalPayment = emi * months;
    const totalInterest = totalPayment - loanAmount;

    const schedule: { year: number; principalPaid: number; interestPaid: number; balance: number }[] = [];
    let balance = loanAmount;
    for (let y = 1; y <= tenure; y++) {
      let yearPrincipal = 0;
      let yearInterest = 0;
      for (let m = 0; m < 12; m++) {
        const interestPortion = balance * monthlyRate;
        const principalPortion = emi - interestPortion;
        balance = Math.max(0, balance - principalPortion);
        yearPrincipal += principalPortion;
        yearInterest += interestPortion;
      }
      schedule.push({ year: y, principalPaid: yearPrincipal, interestPaid: yearInterest, balance });
    }

    return { downPayment, loanAmount, emi, totalInterest, totalPayment, schedule };
  }, [price, downPaymentPct, rate, tenure]);

  return (
    <main className="min-h-screen bg-[#fafafa] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-600">Plan Your Purchase</p>
          <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">Car loan EMI calculator</h1>
          <p className="mt-3 max-w-lg text-sm text-gray-500">
            Adjust the car price, down payment, interest rate, and tenure to see your monthly EMI.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          {/* Inputs */}
          <div className="flex flex-col gap-7 rounded-2xl bg-white p-6 ring-1 ring-gray-200 sm:p-8">
            <Slider
              label="On-road car price"
              value={price}
              min={300000}
              max={5000000}
              step={10000}
              format={formatLakh}
              onChange={setPrice}
            />
            <Slider
              label={`Down payment — ${downPaymentPct}%`}
              value={downPaymentPct}
              min={0}
              max={90}
              step={5}
              format={(n) => `${n}%`}
              onChange={setDownPaymentPct}
            />
            <Slider
              label="Interest rate (per year)"
              value={rate}
              min={6}
              max={16}
              step={0.1}
              format={(n) => `${n.toFixed(1)}%`}
              onChange={setRate}
            />
            <Slider
              label="Loan tenure"
              value={tenure}
              min={1}
              max={8}
              step={1}
              format={(n) => `${n} yr${n > 1 ? "s" : ""}`}
              onChange={setTenure}
            />

            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-400">Down payment</p>
                <p className="mt-0.5 text-base font-black text-gray-900">₹{formatINR(downPayment)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400">Loan amount</p>
                <p className="mt-0.5 text-base font-black text-gray-900">₹{formatINR(loanAmount)}</p>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 ring-1 ring-gray-200 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Monthly EMI</p>
              <p className="mt-1 text-3xl font-black text-red-600">₹{formatINR(Math.round(emi))}</p>
            </div>

            <div className="flex items-center justify-center py-2">
              <DonutChart principal={loanAmount} interest={totalInterest} />
            </div>

            <div className="flex flex-col gap-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold text-gray-600">
                  <span className="size-2.5 rounded-full bg-red-600" />
                  Principal amount
                </span>
                <span className="font-bold text-gray-900">₹{formatINR(loanAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold text-gray-600">
                  <span className="size-2.5 rounded-full bg-red-100" />
                  Total interest
                </span>
                <span className="font-bold text-gray-900">₹{formatINR(Math.round(totalInterest))}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                <span className="font-bold text-gray-900">Total payment</span>
                <span className="font-black text-gray-900">₹{formatINR(Math.round(totalPayment))}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className="mt-auto rounded-lg py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: ACCENT }}
            >
              Check loan offers
            </button>
          </div>
        </div>

        {/* Amortization table */}
        <div className="mt-8 overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
          <div className="border-b border-gray-100 p-6 pb-4">
            <h2 className="text-base font-black text-gray-900">Year-wise repayment breakdown</h2>
            <p className="mt-1 text-xs text-gray-400">How your loan balance reduces every year.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-bold uppercase tracking-wide text-gray-400">
                  <th className="px-6 py-3">Year</th>
                  <th className="px-6 py-3">Principal paid</th>
                  <th className="px-6 py-3">Interest paid</th>
                  <th className="px-6 py-3">Remaining balance</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr key={row.year} className="border-b border-gray-50 last:border-none">
                    <td className="px-6 py-3 font-bold text-gray-900">Year {row.year}</td>
                    <td className="px-6 py-3 text-gray-600">₹{formatINR(Math.round(row.principalPaid))}</td>
                    <td className="px-6 py-3 text-gray-600">₹{formatINR(Math.round(row.interestPaid))}</td>
                    <td className="px-6 py-3 font-semibold text-gray-900">₹{formatINR(Math.round(row.balance))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Card 1: Related calculators */}
          <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-red-50">
              <svg className="size-5 text-red-600" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 7h8M8 11h2M12.5 11h2M17 11h0M8 15h2M12.5 15h2M17 15h0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-sm font-black text-gray-900">More calculators</h3>
            <p className="mt-1 text-xs text-gray-500">Plan every cost before you buy.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/fuel-cost-calculator"
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 no-underline transition-colors hover:border-red-200 hover:text-red-600"
              >
                Fuel Cost Calculator
                <svg className="size-3" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M8 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/mileage-calculator"
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 no-underline transition-colors hover:border-red-200 hover:text-red-600"
              >
                Mileage Calculator
                <svg className="size-3" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M8 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Card 2: Tips */}
          <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-red-50">
              <svg className="size-5 text-red-600" viewBox="0 0 24 24" fill="none">
                <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.3.2.5.6.5 1v.1h6v-.1c0-.4.2-.8.5-1A6 6 0 0 0 12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-sm font-black text-gray-900">Tips to lower your EMI</h3>
            <ul className="mt-3 space-y-2 text-xs text-gray-600">
              <li className="flex gap-2">
                <span className="text-red-600">•</span> Increase your down payment to reduce loan amount
              </li>
              <li className="flex gap-2">
                <span className="text-red-600">•</span> Compare rates across 3–4 lenders before finalizing
              </li>
              <li className="flex gap-2">
                <span className="text-red-600">•</span> A longer tenure lowers EMI but raises total interest
              </li>
            </ul>
          </div>

          {/* Card 3: CTA */}
          <div className="flex flex-col rounded-2xl p-6 text-white" style={{ background: ACCENT }}>
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-white/15">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 10h18M7 15h.01M11 15h2" />
                <rect x="3" y="6" width="18" height="13" rx="2" />
              </svg>
            </div>
            <h3 className="text-sm font-black">Check your loan eligibility</h3>
            <p className="mt-1 text-xs text-white/80">
              Get pre-approved offers from top banks in under 2 minutes.
            </p>
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className="mt-4 w-fit rounded-lg bg-white px-4 py-2 text-xs font-bold text-red-600 transition-opacity hover:opacity-90"
            >
              Check Eligibility
            </button>
          </div>
        </div>
        {/* Educational content */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">

          {/* What is EMI */}
          <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200 sm:p-8">
            <h2 className="text-lg font-black text-gray-900">What is car loan EMI?</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              EMI (Equated Monthly Installment) is the fixed monthly amount you pay
              to your lender until your car loan is fully repaid. Every EMI is made
              up of two parts — principal and interest. In the early years, a larger
              portion of your EMI goes toward interest. As the loan progresses, more
              of it goes toward the principal.
            </p>

            <h3 className="mt-5 text-sm font-bold text-gray-900">EMI Formula</h3>
            <div className="mt-2 rounded-lg bg-gray-50 px-4 py-3 font-mono text-xs text-gray-700">
              EMI = [P × R × (1+R)<sup>N</sup>] / [(1+R)<sup>N</sup> − 1]
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-gray-500">
              <li><span className="font-bold text-gray-700">P</span> = Loan amount (principal)</li>
              <li><span className="font-bold text-gray-700">R</span> = Monthly interest rate (annual rate ÷ 12 ÷ 100)</li>
              <li><span className="font-bold text-gray-700">N</span> = Loan tenure in months</li>
            </ul>
          </div>

          {/* Factors affecting EMI */}
          <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200 sm:p-8">
            <h2 className="text-lg font-black text-gray-900">Factors that affect your EMI</h2>
            <div className="mt-4 flex flex-col gap-4">
              {[
                { title: "Car price & down payment", desc: "A higher down payment lowers your loan amount, directly reducing EMI." },
                { title: "Interest rate", desc: "Even a 0.5% difference in rate can change your EMI noticeably over a long tenure." },
                { title: "Loan tenure", desc: "Shorter tenure = higher EMI but less total interest. Longer tenure = lower EMI but more interest." },
                { title: "Credit score", desc: "A strong credit score helps you negotiate a lower interest rate with lenders." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-600" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ section */}
        <div className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-gray-200 sm:p-8">
          <h2 className="text-lg font-black text-gray-900">Frequently asked questions</h2>
          <p className="mt-1 text-xs text-gray-400">Everything you need to know about car loan EMIs.</p>
          <div className="mt-4">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}