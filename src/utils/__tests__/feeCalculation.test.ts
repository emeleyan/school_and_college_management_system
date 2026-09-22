import { describe, it, expect } from 'vitest';
import {
  calculateWaiverAmount,
  calculateLateFine,
  calculateNetPayable,
  calculateInvoiceStatus,
  calculateCashChange,
  distributePaymentAcrossInvoices,
} from '../feeCalculation';

describe('Fee Calculation Utilities', () => {
  describe('calculateWaiverAmount', () => {
    it('calculates percentage waivers correctly', () => {
      expect(calculateWaiverAmount(1000, 'percentage', 25)).toBe(250);
      expect(calculateWaiverAmount(1500, 'percentage', 100)).toBe(1500); // 100% full free scholarship
      expect(calculateWaiverAmount(2000, 'percentage', 0)).toBe(0);
    });

    it('calculates fixed discount waivers correctly', () => {
      expect(calculateWaiverAmount(1000, 'fixed', 300)).toBe(300);
      // Fixed waiver should not exceed gross amount
      expect(calculateWaiverAmount(500, 'fixed', 800)).toBe(500);
      expect(calculateWaiverAmount(1000, 'fixed', 0)).toBe(0);
    });

    it('handles negative or invalid values gracefully', () => {
      expect(calculateWaiverAmount(-500, 'percentage', 10)).toBe(0);
      expect(calculateWaiverAmount(500, 'percentage', -10)).toBe(0);
    });
  });

  describe('calculateLateFine', () => {
    it('returns 0 fine if payment is made on or before due date', () => {
      const fine = calculateLateFine({
        dueDate: '2026-05-15',
        paymentDate: '2026-05-10',
        lateFeeRule: 'fixed',
        fixedFine: 100,
      });
      expect(fine).toBe(0);
    });

    it('returns 0 fine if payment is within grace days', () => {
      const fine = calculateLateFine({
        dueDate: '2026-05-15',
        paymentDate: '2026-05-18', // 3 days overdue
        graceDays: 5,
        lateFeeRule: 'fixed',
        fixedFine: 100,
      });
      expect(fine).toBe(0);
    });

    it('calculates fixed late fine when overdue beyond grace days', () => {
      const fine = calculateLateFine({
        dueDate: '2026-05-10',
        paymentDate: '2026-05-20',
        graceDays: 2,
        lateFeeRule: 'fixed',
        fixedFine: 50,
      });
      expect(fine).toBe(50);
    });

    it('calculates daily late fine and respects maximum fine cap', () => {
      const fine = calculateLateFine({
        dueDate: '2026-05-01',
        paymentDate: '2026-05-11', // 10 days overdue
        graceDays: 0,
        lateFeeRule: 'daily',
        finePerDay: 10,
        maxFine: 200,
      });
      expect(fine).toBe(100); // 10 days * 10 = 100

      // When fine exceeds max cap
      const cappedFine = calculateLateFine({
        dueDate: '2026-01-01',
        paymentDate: '2026-05-01', // 120 days overdue
        lateFeeRule: 'daily',
        finePerDay: 10,
        maxFine: 150,
      });
      expect(cappedFine).toBe(150);
    });

    it('returns 0 when lateFeeRule is none', () => {
      const fine = calculateLateFine({
        dueDate: '2026-05-01',
        paymentDate: '2026-05-20',
        lateFeeRule: 'none',
      });
      expect(fine).toBe(0);
    });
  });

  describe('calculateNetPayable', () => {
    it('computes net payable as (Gross - Waiver) + Late Fine', () => {
      // 1200 gross, 200 waiver, 50 late fine = 1050 net
      expect(calculateNetPayable(1200, 200, 50)).toBe(1050);
      // 100% waiver with late fine = 0 base + 50 fine = 50
      expect(calculateNetPayable(500, 500, 50)).toBe(50);
      // No waiver, no fine = gross
      expect(calculateNetPayable(800, 0, 0)).toBe(800);
    });
  });

  describe('calculateInvoiceStatus', () => {
    it('returns unpaid when paid is 0', () => {
      expect(calculateInvoiceStatus(1000, 0)).toBe('unpaid');
    });

    it('returns partial when paid is between 1 and netPayable - 1', () => {
      expect(calculateInvoiceStatus(1000, 400)).toBe('partial');
    });

    it('returns paid when paid equals or exceeds netPayable', () => {
      expect(calculateInvoiceStatus(1000, 1000)).toBe('paid');
      expect(calculateInvoiceStatus(1000, 1200)).toBe('paid');
    });
  });

  describe('calculateCashChange', () => {
    it('computes change when tendered cash is greater than total payable', () => {
      const res = calculateCashChange(1500, 1200);
      expect(res.isShort).toBe(false);
      expect(res.change).toBe(300);
      expect(res.shortAmount).toBe(0);
    });

    it('computes short amount when tendered cash is less than payable', () => {
      const res = calculateCashChange(800, 1000);
      expect(res.isShort).toBe(true);
      expect(res.change).toBe(0);
      expect(res.shortAmount).toBe(200);
    });
  });

  describe('distributePaymentAcrossInvoices', () => {
    it('correctly allocates payment across multiple pending invoices sequentially', () => {
      const invoices = [
        { id: 'inv-1', netPayable: 500, currentPaid: 0 },
        { id: 'inv-2', netPayable: 800, currentPaid: 0 },
        { id: 'inv-3', netPayable: 600, currentPaid: 200 }, // 400 due
      ];

      // Paying 1000 total:
      // inv-1: gets 500 (fully paid, 0 due)
      // inv-2: gets 500 of 800 (partial, 300 due)
      // inv-3: gets 0 (partial with 400 remaining due)
      const allocated = distributePaymentAcrossInvoices(1000, invoices);

      expect(allocated[0].appliedAmount).toBe(500);
      expect(allocated[0].newStatus).toBe('paid');
      expect(allocated[0].remainingDue).toBe(0);

      expect(allocated[1].appliedAmount).toBe(500);
      expect(allocated[1].newStatus).toBe('partial');
      expect(allocated[1].remainingDue).toBe(300);

      expect(allocated[2].appliedAmount).toBe(0);
      expect(allocated[2].newStatus).toBe('partial');
      expect(allocated[2].remainingDue).toBe(400);
    });
  });
});
