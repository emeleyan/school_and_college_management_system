import {
  FeeHeadItem,
  FeeStructureItem,
  StudentFeeInvoice,
  FeePaymentRecord,
  StudentFeeWaiver,
  Student,
  ClassItem,
} from '../../types';

export function generateSampleFeeData(
  instituteId: string,
  academicYearId: string,
  students: Student[],
  classes: ClassItem[]
) {
  // 1. Fee Heads
  const feeHeads: FeeHeadItem[] = [
    {
      id: `fh-tuition-${instituteId}`,
      instituteId,
      name: 'Monthly Tuition Fee',
      bengaliName: 'মাসিক বেতন',
      code: 'TUITION',
      frequency: 'monthly',
      description: 'Regular monthly academic tuition fee',
      isMandatory: true,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: `fh-session-${instituteId}`,
      instituteId,
      name: 'Session Charge & Development',
      bengaliName: 'সেশন চার্জ ও উন্নয়ন ফি',
      code: 'SESSION',
      frequency: 'annually',
      description: 'Annual session charge, sports, and infrastructure development',
      isMandatory: true,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: `fh-exam-${instituteId}`,
      instituteId,
      name: 'Examination Fee',
      bengaliName: 'পরীক্ষার ফি',
      code: 'EXAM',
      frequency: 'termly',
      description: 'Term exam paper and administrative charge',
      isMandatory: true,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: `fh-ict-${instituteId}`,
      instituteId,
      name: 'ICT & Computer Lab Fee',
      bengaliName: 'আইসিটি ও কম্পিউটার ল্যাব ফি',
      code: 'ICT_LAB',
      frequency: 'monthly',
      description: 'Computer lab and digital content maintenance',
      isMandatory: false,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: `fh-science-${instituteId}`,
      instituteId,
      name: 'Science Practical Lab Fee',
      bengaliName: 'বিজ্ঞানাগার ও ব্যবহারিক ফি',
      code: 'SCIENCE_LAB',
      frequency: 'monthly',
      description: 'Physics, Chemistry, and Biology apparatus and chemicals',
      isMandatory: false,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: `fh-scout-${instituteId}`,
      instituteId,
      name: 'Scout & Red Crescent Fee',
      bengaliName: 'স্কাউট ও রেড ক্রিসেন্ট ফি',
      code: 'SCOUT',
      frequency: 'annually',
      description: 'Rover Scout, Girls Guide, and Red Crescent annual membership',
      isMandatory: true,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: `fh-fine-${instituteId}`,
      instituteId,
      name: 'Late Fine / Penalty',
      bengaliName: 'বিলম্ব ফি',
      code: 'LATE_FINE',
      frequency: 'one_time',
      description: 'Fine charged for payment after due date (after 15th)',
      isMandatory: false,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  // 2. Fee Structures (Class-wise rates)
  const feeStructures: FeeStructureItem[] = [];
  classes.forEach((cls, idx) => {
    // Base tuition scales slightly with higher classes
    const baseTuition = 800 + idx * 100;

    feeStructures.push({
      id: `fs-tui-${cls.id}`,
      instituteId,
      academicYearId,
      classId: cls.id,
      className: cls.name,
      feeHeadId: feeHeads[0].id,
      feeHeadName: feeHeads[0].name,
      amount: baseTuition,
      dueDateDayOfMonth: 15,
      lateFineAmount: 50,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    feeStructures.push({
      id: `fs-ict-${cls.id}`,
      instituteId,
      academicYearId,
      classId: cls.id,
      className: cls.name,
      feeHeadId: feeHeads[3].id,
      feeHeadName: feeHeads[3].name,
      amount: 150,
      dueDateDayOfMonth: 15,
      lateFineAmount: 0,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    feeStructures.push({
      id: `fs-exam-${cls.id}`,
      instituteId,
      academicYearId,
      classId: cls.id,
      className: cls.name,
      feeHeadId: feeHeads[2].id,
      feeHeadName: feeHeads[2].name,
      amount: 500,
      dueDateDayOfMonth: 20,
      lateFineAmount: 100,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  // 3. Waivers for 2-3 sample students
  const feeWaivers: StudentFeeWaiver[] = [];
  if (students.length > 0) {
    const st0Name = `${students[0].firstName} ${students[0].lastName}`.trim();
    const st0Class = classes.find((c) => c.id === students[0].classId)?.name || 'Class 10';
    feeWaivers.push({
      id: `waiver-${students[0].id}`,
      instituteId,
      studentId: students[0].id,
      studentName: st0Name,
      rollNumber: students[0].rollNumber || 1,
      className: st0Class,
      category: 'merit',
      percentage: 50,
      remarks: 'Top performer in previous annual exam (50% tuition waiver)',
      approvedBy: 'Principal',
      status: 'active',
      createdAt: '2026-01-05T00:00:00.000Z',
    });
  }
  if (students.length > 3) {
    const st3Name = `${students[3].firstName} ${students[3].lastName}`.trim();
    const st3Class = classes.find((c) => c.id === students[3].classId)?.name || 'Class 9';
    feeWaivers.push({
      id: `waiver-${students[3].id}`,
      instituteId,
      studentId: students[3].id,
      studentName: st3Name,
      rollNumber: students[3].rollNumber || 4,
      className: st3Class,
      category: 'poor_fund',
      percentage: 100,
      remarks: 'Special stipend from Upazila Education Poor Welfare Fund',
      approvedBy: 'Headmaster',
      status: 'active',
      createdAt: '2026-01-10T00:00:00.000Z',
    });
  }

  // 4. Invoices & Payments for sample students across recent months
  const invoices: StudentFeeInvoice[] = [];
  const payments: FeePaymentRecord[] = [];

  const months = ['January 2026', 'February 2026', 'March 2026'];

  students.slice(0, 15).forEach((st, sIdx) => {
    const stFullName = `${st.firstName} ${st.lastName}`.trim();
    const stClassName = classes.find((c) => c.id === st.classId)?.name || 'Class 10';
    const stSecName = 'A';

    months.forEach((month, mIdx) => {
      const invNum = `INV-2026-${(1000 + sIdx * 10 + mIdx).toString()}`;
      const tuiAmount = 900;
      const ictAmount = 150;

      // Check waiver
      const waiver = feeWaivers.find((w) => w.studentId === st.id);
      let waiverAmt = 0;
      if (waiver) {
        waiverAmt = Math.round((tuiAmount * waiver.percentage) / 100);
      }

      const totalAmt = tuiAmount + ictAmount;
      const payable = totalAmt - waiverAmt;

      // Simulated payment status:
      // Jan paid, Feb paid for some, Mar due for many
      let status: StudentFeeInvoice['status'] = 'unpaid';
      let paidAmt = 0;
      let dueAmt = payable;

      if (mIdx === 0) {
        // January: All paid
        status = 'paid';
        paidAmt = payable;
        dueAmt = 0;
      } else if (mIdx === 1) {
        // February: 70% paid
        if (sIdx % 3 !== 0) {
          status = 'paid';
          paidAmt = payable;
          dueAmt = 0;
        }
      } else {
        // March: 30% paid, some partial, rest unpaid
        if (sIdx % 4 === 0) {
          status = 'paid';
          paidAmt = payable;
          dueAmt = 0;
        } else if (sIdx % 5 === 0) {
          status = 'partial';
          paidAmt = 500;
          dueAmt = payable - 500;
        }
      }

      const inv: StudentFeeInvoice = {
        id: `inv-${st.id}-${mIdx}`,
        invoiceNumber: invNum,
        instituteId,
        academicYearId,
        studentId: st.id,
        studentName: stFullName,
        rollNumber: st.rollNumber || sIdx + 1,
        classId: st.classId || 'class-01',
        className: stClassName,
        sectionId: st.sectionId || 'sec-01',
        sectionName: stSecName,
        month,
        billingDate: `2026-0${mIdx + 1}-01`,
        dueDate: `2026-0${mIdx + 1}-15`,
        items: [
          {
            feeHeadId: feeHeads[0].id,
            feeHeadName: feeHeads[0].name,
            amount: tuiAmount,
            waiverDiscount: waiverAmt,
            netAmount: tuiAmount - waiverAmt,
          },
          {
            feeHeadId: feeHeads[3].id,
            feeHeadName: feeHeads[3].name,
            amount: ictAmount,
            waiverDiscount: 0,
            netAmount: ictAmount,
          },
        ],
        totalAmount: totalAmt,
        totalWaiver: waiverAmt,
        payableAmount: payable,
        paidAmount: paidAmt,
        dueAmount: dueAmt,
        lateFine: status === 'unpaid' && mIdx < 2 ? 50 : 0,
        status,
        createdAt: `2026-0${mIdx + 1}-01T08:00:00.000Z`,
        updatedAt: `2026-0${mIdx + 1}-10T12:00:00.000Z`,
      };

      invoices.push(inv);

      // Create payment record if paid or partial
      if (paidAmt > 0) {
        const payMethods: FeePaymentRecord['paymentMethod'][] = ['cash', 'bkash', 'nagad', 'bank_challan'];
        const method = payMethods[sIdx % payMethods.length];
        const rcptNum = `MR-2026-${(5000 + sIdx * 10 + mIdx).toString()}`;

        payments.push({
          id: `pay-${st.id}-${mIdx}`,
          receiptNumber: rcptNum,
          instituteId,
          academicYearId,
          studentId: st.id,
          studentName: stFullName,
          rollNumber: st.rollNumber || sIdx + 1,
          classId: st.classId || 'class-01',
          className: stClassName,
          sectionName: stSecName,
          invoiceId: inv.id,
          monthCovered: month,
          paidAmount: paidAmt,
          lateFinePaid: 0,
          totalCollected: paidAmt,
          paymentMethod: method,
          transactionRef:
            method === 'bkash'
              ? `BK${Math.floor(10000000 + Math.random() * 90000000)}`
              : method === 'nagad'
              ? `NG${Math.floor(10000000 + Math.random() * 90000000)}`
              : method === 'bank_challan'
              ? `CH-${Math.floor(1000 + Math.random() * 9000)}`
              : undefined,
          remarks: 'Standard monthly fee collection counter',
          collectedBy: 'Accountant (Md. Kabir Hossain)',
          paymentDate: `2026-0${mIdx + 1}-12`,
          createdAt: `2026-0${mIdx + 1}-12T10:30:00.000Z`,
        });
      }
    });
  });

  return {
    feeHeads,
    feeStructures,
    feeWaivers,
    invoices,
    payments,
  };
}
