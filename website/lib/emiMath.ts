// lib/emiMath.ts
//
// Standard reducing-balance EMI formula:
//   EMI = P * r * (1+r)^n / ((1+r)^n - 1)
// where r is the MONTHLY interest rate (annual / 12 / 100) and n is the
// tenure in months. Pure functions — no fetching, safe to call on every
// keystroke from a client component.

export interface EmiResult {
  emi: number;
  totalPayable: number;
  totalInterest: number;
}

export function calculateEmi(principal: number, annualRatePercent: number, tenureYears: number): EmiResult {
  if (principal <= 0 || tenureYears <= 0) {
    return { emi: 0, totalPayable: 0, totalInterest: 0 };
  }

  const months = tenureYears * 12;

  if (annualRatePercent <= 0) {
    const emi = principal / months;
    return { emi, totalPayable: principal, totalInterest: 0 };
  }

  const monthlyRate = annualRatePercent / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, months);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  const totalPayable = emi * months;

  return { emi, totalPayable, totalInterest: totalPayable - principal };
}

export interface AmortizationYear {
  year: number;
  principalPaid: number;
  interestPaid: number;
  balance: number;
}

// Year-wise breakup for the "View Schedule" table — walks the standard
// month-by-month amortization and rolls it up into 12-month buckets.
export function buildAmortizationSchedule(
  principal: number,
  annualRatePercent: number,
  tenureYears: number,
): AmortizationYear[] {
  if (principal <= 0 || tenureYears <= 0) return [];

  const months = tenureYears * 12;
  const monthlyRate = annualRatePercent / 12 / 100;
  const { emi } = calculateEmi(principal, annualRatePercent, tenureYears);

  let balance = principal;
  let yearPrincipal = 0;
  let yearInterest = 0;
  const schedule: AmortizationYear[] = [];

  for (let month = 1; month <= months; month++) {
    const interestForMonth = monthlyRate > 0 ? balance * monthlyRate : 0;
    // Last installment absorbs any rounding drift so the balance lands
    // exactly on 0 instead of a few paise off.
    const principalForMonth = month === months ? balance : emi - interestForMonth;

    balance = Math.max(balance - principalForMonth, 0);
    yearPrincipal += principalForMonth;
    yearInterest += interestForMonth;

    if (month % 12 === 0 || month === months) {
      schedule.push({ year: schedule.length + 1, principalPaid: yearPrincipal, interestPaid: yearInterest, balance });
      yearPrincipal = 0;
      yearInterest = 0;
    }
  }

  return schedule;
}
