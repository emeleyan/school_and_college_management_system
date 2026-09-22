/**
 * Financial & Fee Calculation Utilities
 * Uniform fee calculations for Bangladesh School & College ERP
 */

export interface LateFineConfig {
  dueDate: string;
  paymentDate?: string; // defaults to today
  lateFeeRule?: 'none' | 'fixed' | 'daily';
  fixedFine?: number;
  finePerDay?: number;
  maxFine?: number;
  graceDays?: number;
}

/**
 * Calculate scholarship or waiver discount amount from gross fee
 */
export function calculateWaiverAmount(
  grossAmount: number,
  waiverType: 'percentage' | 'fixed',
  waiverValue: number
): number {
  if (grossAmount <= 0 || waiverValue <= 0) return 0;

  if (waiverType === 'percentage') {
    const clampedPercent = Math.min(100, Math.max(0, waiverValue));
    return Math.round((grossAmount * clampedPercent) / 100);
  }

  // Fixed discount: cannot exceed the gross amount
  return Math.min(grossAmount, Math.max(0, Math.round(waiverValue)));
}

/**
 * Calculate late fine based on due date, payment date, grace period, and rule
 */
export function calculateLateFine(config: LateFineConfig): number {
  const {
    dueDate,
    paymentDate = new Date().toISOString().split('T')[0],
    lateFeeRule = 'fixed',
    fixedFine = 50,
    finePerDay = 5,
    maxFine = 500,
    graceDays = 0,
  } = config;

  if (lateFeeRule === 'none') return 0;

  const due = new Date(dueDate);
  const payment = new Date(paymentDate);

  // Set hours to 0 to compare full calendar days
  due.setHours(0, 0, 0, 0);
  payment.setHours(0, 0, 0, 0);

  const diffMs = payment.getTime() - due.getTime();
  const overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // If within due date or within grace days, no fine
  if (overdueDays <= graceDays) return 0;

  const chargeableDays = overdueDays - graceDays;

  if (lateFeeRule === 'fixed') {
    return Math.min(maxFine, Math.max(0, fixedFine));
  }

  if (lateFeeRule === 'daily') {
    const computed = chargeableDays * finePerDay;
    return Math.min(maxFine, Math.max(0, computed));
  }

  return 0;
}

/**
 * Calculate Net Payable: (Gross - Waiver) + Late Fine
 */
export function calculateNetPayable(
  grossAmount: number,
  waiverAmount = 0,
  lateFine = 0
): number {
  const effectiveWaiver = Math.min(grossAmount, Math.max(0, waiverAmount));
  const base = Math.max(0, grossAmount - effectiveWaiver);
  return base + Math.max(0, lateFine);
}

/**
 * Determine payment status based on total paid vs net payable
 */
export function calculateInvoiceStatus(
  netPayable: number,
  totalPaid: number
): 'paid' | 'partial' | 'unpaid' {
  if (totalPaid <= 0) return 'unpaid';
  if (totalPaid >= netPayable) return 'paid';
  return 'partial';
}

/**
 * Calculate customer cash change and check for short tenders
 */
export function calculateCashChange(
  tenderedCash: number,
  totalPayable: number
): { change: number; isShort: boolean; shortAmount: number } {
  if (tenderedCash >= totalPayable) {
    return {
      change: tenderedCash - totalPayable,
      isShort: false,
      shortAmount: 0,
    };
  }

  return {
    change: 0,
    isShort: true,
    shortAmount: totalPayable - tenderedCash,
  };
}

/**
 * Allocate a single lump-sum counter payment across multiple pending invoices
 */
export function distributePaymentAcrossInvoices(
  totalPaymentToApply: number,
  invoices: { id: string; netPayable: number; currentPaid: number }[]
): {
  invoiceId: string;
  appliedAmount: number;
  newPaidAmount: number;
  remainingDue: number;
  newStatus: 'paid' | 'partial' | 'unpaid';
}[] {
  let remainingBudget = totalPaymentToApply;

  return invoices.map((inv) => {
    const currentDue = Math.max(0, inv.netPayable - inv.currentPaid);
    const amountToApply = Math.min(remainingBudget, currentDue);

    remainingBudget -= amountToApply;
    const newPaidAmount = inv.currentPaid + amountToApply;
    const remainingDue = Math.max(0, inv.netPayable - newPaidAmount);

    return {
      invoiceId: inv.id,
      appliedAmount: amountToApply,
      newPaidAmount,
      remainingDue,
      newStatus: calculateInvoiceStatus(inv.netPayable, newPaidAmount),
    };
  });
}
