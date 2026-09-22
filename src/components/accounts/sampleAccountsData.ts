import { AccountHead, BankAccountItem, FinancialVoucher, StaffPayrollItem, Teacher } from '../../types';

// Converts number to English words
export function numberToEnglishWords(num: number): string {
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  function convert(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        ' Hundred' +
        (n % 100 !== 0 ? ' and ' + convert(n % 100) : '')
      );
    if (n < 100000)
      return (
        convert(Math.floor(n / 1000)) +
        ' Thousand' +
        (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '')
      );
    if (n < 10000000)
      return (
        convert(Math.floor(n / 100000)) +
        ' Lakh' +
        (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '')
      );
    return (
      convert(Math.floor(n / 10000000)) +
      ' Crore' +
      (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '')
    );
  }

  return convert(Math.floor(num)).trim() + ' Taka Only';
}

// Converts number to Bengali words (কথায়)
export function numberToBengaliWords(num: number): string {
  if (num === 0) return 'শূন্য টাকা মাত্র';

  const units = [
    '',
    'এক',
    'দুই',
    'তিন',
    'চার',
    'পাঁচ',
    'ছয়',
    'সাত',
    'আট',
    'নয়',
    'দশ',
    'এগারো',
    'বারো',
    'তেরো',
    'চৌদ্দ',
    'পনেরো',
    'ষোল',
    'সতেরো',
    'আঠারো',
    'উনিশ',
    'বিশ',
    'একুশ',
    'বাইশ',
    'তেইশ',
    'চব্বিশ',
    'পঁচিশ',
    'ছাব্বিশ',
    'সাতাশ',
    'আঠাশ',
    'ঊনত্রিশ',
    'ত্রিশ',
    'একত্রিশ',
    'বত্রিশ',
    'তেত্রিশ',
    'চৌত্রিশ',
    'পঁয়ত্রিশ',
    'ছত্রিশ',
    'সাঁইত্রিশ',
    'আটত্রিশ',
    'ঊনচল্লিশ',
    'চল্লিশ',
    'একচল্লিশ',
    'বিয়াল্লিশ',
    'তেতাল্লিশ',
    'চুয়াল্লিশ',
    'পঁয়তাল্লিশ',
    'ছেচল্লিশ',
    'সাতচল্লিশ',
    'আটচল্লিশ',
    'ঊনপঞ্চাশ',
    'পঞ্চাশ',
    'একান্ন',
    'বায়ান্ন',
    'তিপ্পান্ন',
    'চুয়ান্ন',
    'পঞ্চান্ন',
    'ছাপ্পান্ন',
    'সাতান্ন',
    'আটান্ন',
    'ঊনষাট',
    'ষাট',
    'একষট্টি',
    'বাষট্টি',
    'তেষট্টি',
    'চৌষট্টি',
    'পঁয়ষট্টি',
    'ছেষট্টি',
    'সাতষট্টি',
    'আটষট্টি',
    'ঊনসত্তর',
    'সত্তর',
    'একাত্তর',
    'বাহাত্তর',
    'তিয়াত্তর',
    'চুয়াত্তর',
    'পঁচাত্তর',
    'ছিয়াত্তর',
    'সাতাত্তর',
    'আটাত্তর',
    'ঊনআশি',
    'আশি',
    'একাশি',
    'বিরাশি',
    'তিরাশি',
    'চুরাশি',
    'পঁচাশি',
    'ছিয়াশি',
    'সাতাশি',
    'অষ্টআশি',
    'ঊননব্বই',
    'নব্বই',
    'একানব্বই',
    'বিরানব্বই',
    'তিরানব্বই',
    'চুরানব্বই',
    'পঁচানব্বই',
    'ছিয়ানব্বই',
    'সাতানব্বই',
    'আটানব্বই',
    'নিরানব্বই',
  ];

  function convertBengali(n: number): string {
    if (n < 100) return units[n];
    if (n < 1000) {
      const h = Math.floor(n / 100);
      const rem = n % 100;
      return units[h] + ' শত' + (rem > 0 ? ' ' + units[rem] : '');
    }
    if (n < 100000) {
      const th = Math.floor(n / 1000);
      const rem = n % 1000;
      return (
        convertBengali(th) +
        ' হাজার' +
        (rem > 0 ? ' ' + convertBengali(rem) : '')
      );
    }
    if (n < 10000000) {
      const lk = Math.floor(n / 100000);
      const rem = n % 100000;
      return (
        convertBengali(lk) +
        ' লক্ষ' +
        (rem > 0 ? ' ' + convertBengali(rem) : '')
      );
    }
    const cr = Math.floor(n / 10000000);
    const rem = n % 10000000;
    return (
      convertBengali(cr) +
      ' কোটি' +
      (rem > 0 ? ' ' + convertBengali(rem) : '')
    );
  }

  return convertBengali(Math.floor(num)).trim() + ' টাকা মাত্র';
}

export function generateSampleAccountsData(
  instituteId: string,
  academicYearId: string,
  teachers: Teacher[]
) {
  // 1. Chart of Accounts (Standard Bangladeshi Institutional Heads)
  const accountHeads: AccountHead[] = [
    // Income Heads (300-399)
    {
      id: `head-inc-01-${instituteId}`,
      instituteId,
      code: '301',
      name: 'Students Tuition Fees',
      nameBn: 'শিক্ষার্থী বেতন ও টিউশন ফি',
      type: 'income',
      category: 'Direct Academic Income',
      openingBalance: 0,
      currentBalance: 385000,
      isSystem: true,
      status: 'active',
    },
    {
      id: `head-inc-02-${instituteId}`,
      instituteId,
      code: '302',
      name: 'Admission & Session Fees',
      nameBn: 'ভর্তি ও সেশন চার্জ',
      type: 'income',
      category: 'Direct Academic Income',
      openingBalance: 0,
      currentBalance: 125000,
      isSystem: true,
      status: 'active',
    },
    {
      id: `head-inc-03-${instituteId}`,
      instituteId,
      code: '303',
      name: 'Examination Fees',
      nameBn: 'পরীক্ষা ফি আয়',
      type: 'income',
      category: 'Direct Academic Income',
      openingBalance: 0,
      currentBalance: 68000,
      isSystem: true,
      status: 'active',
    },
    {
      id: `head-inc-04-${instituteId}`,
      instituteId,
      code: '304',
      name: 'Government MPO Subsidies & Grants',
      nameBn: 'সরকারি এমপিও অনুদান ও বেতন সহায়তা',
      type: 'income',
      category: 'Government Grants',
      openingBalance: 0,
      currentBalance: 450000,
      isSystem: true,
      status: 'active',
    },
    {
      id: `head-inc-05-${instituteId}`,
      instituteId,
      code: '305',
      name: 'Donations & Waqf Welfare Fund',
      nameBn: 'অনুদান ও ওয়াকফ কল্যাণ তহবিল',
      type: 'income',
      category: 'Donations & Trusts',
      openingBalance: 0,
      currentBalance: 40000,
      status: 'active',
    },
    {
      id: `head-inc-06-${instituteId}`,
      instituteId,
      code: '306',
      name: 'Bank Interest & Profit',
      nameBn: 'ব্যাংক জমা মুনাফা/সুদ',
      type: 'income',
      category: 'Financial Income',
      openingBalance: 0,
      currentBalance: 12500,
      status: 'active',
    },

    // Expense Heads (400-499)
    {
      id: `head-exp-01-${instituteId}`,
      instituteId,
      code: '401',
      name: 'Teachers & Staff Salaries',
      nameBn: 'শিক্ষক ও কর্মচারী বেতন-ভাতা',
      type: 'expense',
      category: 'Personnel & Payroll',
      openingBalance: 0,
      currentBalance: 320000,
      isSystem: true,
      status: 'active',
    },
    {
      id: `head-exp-02-${instituteId}`,
      instituteId,
      code: '402',
      name: 'Electricity & Utility Bills',
      nameBn: 'বিদ্যুৎ, গ্যাস ও পানির বিল',
      type: 'expense',
      category: 'Utilities',
      openingBalance: 0,
      currentBalance: 18500,
      status: 'active',
    },
    {
      id: `head-exp-03-${instituteId}`,
      instituteId,
      code: '403',
      name: 'Office Stationery & Printing',
      nameBn: 'দাপ্তরিক স্টেশনারি ও খাতা-কাগজ মুদ্রণ',
      type: 'expense',
      category: 'Administration',
      openingBalance: 0,
      currentBalance: 14200,
      status: 'active',
    },
    {
      id: `head-exp-04-${instituteId}`,
      instituteId,
      code: '404',
      name: 'Question Paper Printing & Exam Expenses',
      nameBn: 'প্রশ্নপত্র মুদ্রণ ও পরীক্ষা পরিচালনা ব্যয়',
      type: 'expense',
      category: 'Academic Operations',
      openingBalance: 0,
      currentBalance: 24000,
      status: 'active',
    },
    {
      id: `head-exp-05-${instituteId}`,
      instituteId,
      code: '405',
      name: 'ICT Lab & Internet Maintenance',
      nameBn: 'কম্পিউটার ল্যাব ও ইন্টারনেট বিল',
      type: 'expense',
      category: 'Technology & Lab',
      openingBalance: 0,
      currentBalance: 9500,
      status: 'active',
    },
    {
      id: `head-exp-06-${instituteId}`,
      instituteId,
      code: '406',
      name: 'Sports, Milad & Cultural Events',
      nameBn: 'বার্ষিক ক্রীড়া, মিলাদ ও জাতীয় দিবস উদযাপন',
      type: 'expense',
      category: 'Student Welfare & Events',
      openingBalance: 0,
      currentBalance: 16000,
      status: 'active',
    },
    {
      id: `head-exp-07-${instituteId}`,
      instituteId,
      code: '407',
      name: 'Repairs & Infrastructure Maintenance',
      nameBn: 'ভবন মেরামত, চুনকাম ও আসবাব সংস্কার',
      type: 'expense',
      category: 'Maintenance',
      openingBalance: 0,
      currentBalance: 21500,
      status: 'active',
    },

    // Asset Heads (100-199)
    {
      id: `head-ast-01-${instituteId}`,
      instituteId,
      code: '101',
      name: 'Cash in Hand (Counter)',
      nameBn: 'হাতে নগদ ক্যাশ (কাউন্টার)',
      type: 'asset',
      category: 'Current Asset',
      openingBalance: 25000,
      currentBalance: 48500,
      isSystem: true,
      status: 'active',
    },
    {
      id: `head-ast-02-${instituteId}`,
      instituteId,
      code: '102',
      name: 'Bank Balances (Institutional Accounts)',
      nameBn: 'ব্যাংক হিসাবসমূহে জমা স্থিতি',
      type: 'asset',
      category: 'Current Asset',
      openingBalance: 350000,
      currentBalance: 615000,
      isSystem: true,
      status: 'active',
    },

    // Liability & Equity Heads (200-299)
    {
      id: `head-lia-01-${instituteId}`,
      instituteId,
      code: '201',
      name: 'Teachers Provident Fund (GPF/CPF)',
      nameBn: 'শিক্ষক প্রভিডেন্ট ফান্ড / ভবিষ্যত তহবিল',
      type: 'liability',
      category: 'Current Liability',
      openingBalance: 180000,
      currentBalance: 215000,
      status: 'active',
    },
  ];

  // 2. Institutional Bank Accounts
  const bankAccounts: BankAccountItem[] = [
    {
      id: `bank-01-${instituteId}`,
      instituteId,
      bankName: 'Sonali Bank PLC',
      bankNameBn: 'সোনালী ব্যাংক পিএলসি',
      branchName: 'Sadar Corporate Branch',
      accountName: 'Model School & College General Fund',
      accountNumber: '4401202005431',
      accountType: 'current',
      openingBalance: 250000,
      currentBalance: 385000,
      status: 'active',
      note: 'Primary operational bank account for government MPO and major vendor transactions',
    },
    {
      id: `bank-02-${instituteId}`,
      instituteId,
      bankName: 'Dutch-Bangla Bank PLC',
      bankNameBn: 'ডাচ-বাংলা ব্যাংক পিএলসি',
      branchName: 'City Center Branch',
      accountName: 'Model School Tuition & Fees Collection A/C',
      accountNumber: '1151200087654',
      accountType: 'savings',
      openingBalance: 80000,
      currentBalance: 195000,
      status: 'active',
      note: 'Dedicated student online banking and bKash/Rocket collection deposit',
    },
    {
      id: `bank-03-${instituteId}`,
      instituteId,
      bankName: 'Agrani Bank PLC',
      bankNameBn: 'অগ্রণী ব্যাংক পিএলসি',
      branchName: 'Upazila Branch',
      accountName: 'Staff Welfare & Development Fund',
      accountNumber: '0200010998822',
      accountType: 'sndt',
      openingBalance: 20000,
      currentBalance: 35000,
      status: 'active',
      note: 'Teachers and staff emergency loan & welfare fund deposit',
    },
  ];

  // 3. Financial Vouchers (Debit, Credit, Contra)
  const vouchers: FinancialVoucher[] = [
    {
      id: `vouch-01-${instituteId}`,
      instituteId,
      academicYearId,
      voucherNumber: 'DV-2026-0001',
      voucherType: 'debit',
      date: '2026-03-02',
      accountHeadId: `head-exp-02-${instituteId}`,
      accountHeadName: 'Electricity & Utility Bills',
      accountHeadCode: '402',
      amount: 14500,
      paymentMethod: 'bank_transfer',
      bankAccountId: `bank-01-${instituteId}`,
      bankAccountName: 'Sonali Bank PLC (4401202005431)',
      payeeRecipient: 'DESCO / Rural Electrification Board (REB)',
      description: 'Payment of institutional monthly electricity bill for school and college building',
      approvedBy: 'Principal / Headmaster',
      preparedBy: 'Accountant (হিসাবরক্ষক)',
      checkedBy: 'Vice Principal',
      status: 'posted',
      createdAt: '2026-03-02T10:30:00Z',
    },
    {
      id: `vouch-02-${instituteId}`,
      instituteId,
      academicYearId,
      voucherNumber: 'DV-2026-0002',
      voucherType: 'debit',
      date: '2026-03-05',
      accountHeadId: `head-exp-04-${instituteId}`,
      accountHeadName: 'Question Paper Printing & Exam Expenses',
      accountHeadCode: '404',
      amount: 18000,
      paymentMethod: 'cash',
      payeeRecipient: 'Al-Madina Printing Press',
      description: 'Printing of First Term Examination question papers, answer scripts and tabulation sheets',
      approvedBy: 'Principal / Headmaster',
      preparedBy: 'Accountant',
      checkedBy: 'Exam Controller',
      status: 'posted',
      createdAt: '2026-03-05T14:15:00Z',
    },
    {
      id: `vouch-03-${instituteId}`,
      instituteId,
      academicYearId,
      voucherNumber: 'CV-2026-0001',
      voucherType: 'credit',
      date: '2026-03-06',
      accountHeadId: `head-inc-01-${instituteId}`,
      accountHeadName: 'Students Tuition Fees',
      accountHeadCode: '301',
      amount: 45000,
      paymentMethod: 'cash',
      payeeRecipient: 'Fee Collection Cashier Counter',
      description: 'Cash fee collection deposited from Class 6 to 10 tuition fees counter',
      approvedBy: 'Principal / Headmaster',
      preparedBy: 'Head Cashier',
      checkedBy: 'Accountant',
      status: 'posted',
      createdAt: '2026-03-06T16:00:00Z',
    },
    {
      id: `vouch-04-${instituteId}`,
      instituteId,
      academicYearId,
      voucherNumber: 'CT-2026-0001',
      voucherType: 'contra',
      date: '2026-03-07',
      accountHeadId: `head-ast-02-${instituteId}`,
      accountHeadName: 'Bank Balances (Institutional Accounts)',
      accountHeadCode: '102',
      amount: 30000,
      paymentMethod: 'cash',
      bankAccountId: `bank-02-${instituteId}`,
      bankAccountName: 'Dutch-Bangla Bank PLC (1151200087654)',
      payeeRecipient: 'Dutch-Bangla Bank Cash Deposit',
      description: 'Transfer of cash collection surplus from institutional cash safe into Dutch-Bangla Bank Account',
      approvedBy: 'Principal / Headmaster',
      preparedBy: 'Accountant',
      status: 'posted',
      createdAt: '2026-03-07T11:45:00Z',
    },
    {
      id: `vouch-05-${instituteId}`,
      instituteId,
      academicYearId,
      voucherNumber: 'DV-2026-0003',
      voucherType: 'debit',
      date: '2026-03-08',
      accountHeadId: `head-exp-05-${instituteId}`,
      accountHeadName: 'ICT Lab & Internet Maintenance',
      accountHeadCode: '405',
      amount: 5500,
      paymentMethod: 'bkash',
      payeeRecipient: 'Link3 Technologies Ltd (Broadband ISP)',
      description: 'Dedicated fiber-optic broadband internet bill for Smart Classroom and Computer Lab',
      approvedBy: 'Principal / Headmaster',
      preparedBy: 'ICT In-Charge',
      status: 'posted',
      createdAt: '2026-03-08T09:20:00Z',
    },
  ];

  // 4. Staff Payroll Records (Generated for March 2026 and February 2026)
  const payrollItems: StaffPayrollItem[] = [];
  const activeTeachers = teachers.length > 0 ? teachers : [];

  // If no teachers yet, generate a few standard staff samples
  const staffList =
    activeTeachers.length > 0
      ? activeTeachers
      : [
          {
            id: `t-01-${instituteId}`,
            firstName: 'Mohammad',
            lastName: 'Rahman',
            designation: 'Principal',
            bengaliDesignation: 'অধ্যক্ষ / প্রধান শিক্ষক',
            basicSalary: 45000,
            bankAccountNumber: '4401202011221',
            bankName: 'Sonali Bank PLC',
            phone: '01711223344',
          } as any,
          {
            id: `t-02-${instituteId}`,
            firstName: 'Abdul',
            lastName: 'Karim',
            designation: 'Assistant Headmaster',
            bengaliDesignation: 'সহকারী প্রধান শিক্ষক',
            basicSalary: 35000,
            bankAccountNumber: '4401202011222',
            bankName: 'Sonali Bank PLC',
            phone: '01811223344',
          } as any,
          {
            id: `t-03-${instituteId}`,
            firstName: 'Fatema',
            lastName: 'Begum',
            designation: 'Senior Teacher (Mathematics)',
            bengaliDesignation: 'সিনিয়র শিক্ষক (গণিত)',
            basicSalary: 28000,
            bankAccountNumber: '1151200099881',
            bankName: 'Dutch-Bangla Bank',
            phone: '01911223344',
          } as any,
          {
            id: `t-04-${instituteId}`,
            firstName: 'Nazmul',
            lastName: 'Huda',
            designation: 'Lecturer (Physics)',
            bengaliDesignation: 'প্রভাষক (পদার্থবিজ্ঞান)',
            basicSalary: 26000,
            bankAccountNumber: '1151200099882',
            bankName: 'Dutch-Bangla Bank',
            phone: '01722334455',
          } as any,
          {
            id: `t-05-${instituteId}`,
            firstName: 'Kamal',
            lastName: 'Uddin',
            designation: 'Head Clerk / Accountant',
            bengaliDesignation: 'প্রধান সহকারী ও হিসাবরক্ষক',
            basicSalary: 20000,
            bankAccountNumber: '0200010998833',
            bankName: 'Agrani Bank PLC',
            phone: '01611223344',
          } as any,
        ];

  // Generate March 2026 and February 2026 salary sheets
  ['March 2026', 'February 2026'].forEach((month, mIdx) => {
    staffList.forEach((st, sIdx) => {
      const basic = Number(st.basicSalary) || (25000 - sIdx * 2000);
      const houseRent = 1000; // Standard Govt MPO scale house rent
      const medical = 500; // Standard Govt MPO scale medical allowance
      const special = sIdx === 0 ? 3000 : 1000; // Responsibility allowance
      const bonus = 0;
      const gross = basic + houseRent + medical + special + bonus;

      const pf = Math.round(basic * 0.06); // 6% CPF deduction
      const welfare = Math.round(basic * 0.04); // 4% Welfare fund deduction
      const advance = 0;
      const other = 0;
      const totalDed = pf + welfare + advance + other;
      const net = gross - totalDed;

      // February is already paid, March is partially paid
      const isPaid = mIdx === 1 || sIdx % 2 === 0;

      payrollItems.push({
        id: `pr-${month.replace(/\s+/g, '-').toLowerCase()}-${st.id}`,
        instituteId,
        academicYearId,
        month,
        teacherId: st.id,
        teacherName: `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.nameEn || 'Faculty Member',
        teacherPhone: st.phone || '01700000000',
        designation: st.designation || 'Teacher',
        bengaliDesignation: st.bengaliDesignation || 'শিক্ষক',
        mpoType: sIdx < 4 ? 'mpo' : 'non_mpo',
        bankAccountNumber: st.bankAccountNumber || `44012020${1000 + sIdx}`,
        bankName: st.bankName || 'Sonali Bank PLC',
        basicSalary: basic,
        houseRent,
        medicalAllowance: medical,
        specialAllowance: special,
        festivalBonus: bonus,
        grossSalary: gross,
        providentFundDeduction: pf,
        welfareDeduction: welfare,
        advanceDeduction: advance,
        otherDeductions: other,
        totalDeductions: totalDed,
        netPayable: net,
        paymentStatus: isPaid ? 'paid' : 'unpaid',
        paymentDate: isPaid ? (mIdx === 1 ? '2026-02-28' : '2026-03-05') : undefined,
        paymentMethod: isPaid ? 'bank_transfer' : undefined,
        voucherId: isPaid ? `vouch-sal-${mIdx}-${sIdx}` : undefined,
        remarks: isPaid ? 'Monthly salary disbursed via bank transfer' : 'Pending committee approval',
      });
    });
  });

  return {
    accountHeads,
    bankAccounts,
    vouchers,
    payrollItems,
  };
}
