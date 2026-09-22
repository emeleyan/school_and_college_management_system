import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentFeeInvoice, ClassItem, SectionItem, Student } from '../../types';
import { putItem } from '../../db/indexedDB';
import {
  AlertTriangle,
  Send,
  MessageSquare,
  Printer,
  Download,
  Phone,
  Filter,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface DuesDefaultersTabProps {
  invoices: StudentFeeInvoice[];
  classes: ClassItem[];
  sections: SectionItem[];
  students: Student[];
  onRefresh: () => void;
}

interface DefaulterSummary {
  studentId: string;
  studentName: string;
  rollNumber: number;
  classId: string;
  className: string;
  sectionName: string;
  guardianMobile: string;
  overdueInvoices: StudentFeeInvoice[];
  totalDue: number;
  totalLateFine: number;
  totalPayable: number;
  monthsList: string[];
}

export const DuesDefaultersTab: React.FC<DuesDefaultersTabProps> = ({
  invoices,
  classes,
  sections,
  students,
  onRefresh,
}) => {
  const { activeInstitute, currentUser, logAudit } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [minDueThreshold, setMinDueThreshold] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  // SMS Modal States
  const [selectedDefaulterForSMS, setSelectedDefaulterForSMS] = useState<DefaulterSummary | null>(
    null
  );
  const [smsText, setSmsText] = useState('');
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [smsSuccessMsg, setSmsSuccessMsg] = useState('');

  // Group unpaid & partial invoices by student
  const defaulterMap = new Map<string, DefaulterSummary>();

  invoices
    .filter((inv) => inv.status === 'unpaid' || inv.status === 'partial')
    .forEach((inv) => {
      const student = students.find((s) => s.id === inv.studentId);
      const existing = defaulterMap.get(inv.studentId);

      if (existing) {
        existing.overdueInvoices.push(inv);
        existing.totalDue += inv.dueAmount;
        existing.totalLateFine += inv.lateFine || 0;
        existing.totalPayable += inv.dueAmount + (inv.lateFine || 0);
        if (!existing.monthsList.includes(inv.month)) {
          existing.monthsList.push(inv.month);
        }
      } else {
        defaulterMap.set(inv.studentId, {
          studentId: inv.studentId,
          studentName: inv.studentName,
          rollNumber: inv.rollNumber,
          classId: inv.classId,
          className: inv.className,
          sectionName: inv.sectionName,
          guardianMobile:
            student?.guardian?.emergencyContactPhone ||
            student?.guardian?.fatherPhone ||
            student?.phone ||
            (student as any)?.guardianMobile ||
            'N/A',
          overdueInvoices: [inv],
          totalDue: inv.dueAmount,
          totalLateFine: inv.lateFine || 0,
          totalPayable: inv.dueAmount + (inv.lateFine || 0),
          monthsList: [inv.month],
        });
      }
    });

  const defaultersList = Array.from(defaulterMap.values())
    .filter((d) => {
      if (selectedClassId !== 'all' && d.classId !== selectedClassId) return false;
      if (minDueThreshold > 0 && d.totalPayable < minDueThreshold) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = d.studentName.toLowerCase().includes(q);
        const matchRoll = d.rollNumber.toString().includes(q);
        const matchPhone = d.guardianMobile.includes(q);
        if (!matchName && !matchRoll && !matchPhone) return false;
      }
      return true;
    })
    .sort((a, b) => b.totalPayable - a.totalPayable);

  const aggregateTotalDue = defaultersList.reduce((acc, d) => acc + d.totalPayable, 0);

  const handleOpenSMSModal = (defaulter: DefaulterSummary) => {
    setSelectedDefaulterForSMS(defaulter);
    const template = `শ্রদ্ধেয় অভিভাবক, আপনার সন্তান ${defaulter.studentName} (রোল ${defaulter.rollNumber}, ${defaulter.className}) এর ${defaulter.monthsList.join(', ')} মাসের মোট বকেয়া ফি ৳${defaulter.totalPayable}। অতিসত্বর পরিশোধ করার জন্য অনুরোধ করা হলো। - ${activeInstitute?.name || 'স্কুল কতৃপক্ষ'}`;
    setSmsText(template);
    setSmsSuccessMsg('');
  };

  const handleSendSingleSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDefaulterForSMS || !activeInstitute) return;
    setIsSendingSMS(true);

    try {
      const smsRecord = {
        id: `sms-${Date.now()}`,
        instituteId: activeInstitute.id,
        recipientType: 'guardian',
        recipientName: selectedDefaulterForSMS.studentName,
        recipientPhone: selectedDefaulterForSMS.guardianMobile,
        message: smsText,
        purpose: 'fee_due_reminder',
        status: 'sent',
        sentBy: currentUser?.fullName || 'Fee Officer',
        sentAt: new Date().toISOString(),
      };

      await putItem('smsLogs', smsRecord);
      await logAudit(
        'send_sms_due',
        'fees',
        `Sent fee due SMS alert to ${selectedDefaulterForSMS.studentName}'s guardian (${selectedDefaulterForSMS.guardianMobile}) for ৳${selectedDefaulterForSMS.totalPayable}`
      );

      setSmsSuccessMsg('SMS notification successfully logged and dispatched!');
      setTimeout(() => {
        setSelectedDefaulterForSMS(null);
        setSmsSuccessMsg('');
      }, 1400);
    } catch (err) {
      console.error('Failed to send SMS:', err);
      alert('Failed to send SMS.');
    } finally {
      setIsSendingSMS(false);
    }
  };

  const handleBroadcastDefaulterSMS = async () => {
    if (defaultersList.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to broadcast due reminder SMS to all ${defaultersList.length} filtered students' parents?`
      )
    )
      return;

    try {
      let count = 0;
      for (const d of defaultersList) {
        if (!d.guardianMobile || d.guardianMobile === 'N/A') continue;

        const msg = `শ্রদ্ধেয় অভিভাবক, আপনার সন্তান ${d.studentName} (রোল ${d.rollNumber}, ${d.className}) এর মোট বকেয়া ফি ৳${d.totalPayable}। অবিলম্বে পরিশোধের অনুরোধ রইল। - ${activeInstitute?.name || 'স্কুল'}`;

        await putItem('smsLogs', {
          id: `sms-${Date.now()}-${count}`,
          instituteId: activeInstitute?.id || '',
          recipientType: 'guardian',
          recipientName: d.studentName,
          recipientPhone: d.guardianMobile,
          message: msg,
          purpose: 'fee_due_reminder_batch',
          status: 'sent',
          sentBy: currentUser?.fullName || 'Fee Officer',
          sentAt: new Date().toISOString(),
        });
        count++;
      }

      await logAudit('batch_sms_due', 'fees', `Dispatched batch SMS to ${count} defaulters`);
      alert(`Successfully sent due reminders to ${count} parents!`);
    } catch (err) {
      console.error('Failed batch SMS:', err);
    }
  };

  const handleExportCSV = () => {
    if (defaultersList.length === 0) return;

    const headers = [
      'Roll',
      'Student Name',
      'Class',
      'Section',
      'Guardian Mobile',
      'Overdue Months Count',
      'Months Overdue',
      'Fee Due (BDT)',
      'Fine (BDT)',
      'Total Payable (BDT)',
    ];

    const rows = defaultersList.map((d) => [
      d.rollNumber,
      `"${d.studentName}"`,
      d.className,
      d.sectionName,
      `"${d.guardianMobile}"`,
      d.overdueInvoices.length,
      `"${d.monthsList.join('; ')}"`,
      d.totalDue,
      d.totalLateFine,
      d.totalPayable,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Defaulters_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintDues = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider block">
            Total Institution Outstanding Dues
          </span>
          <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-400 mt-1">
            ৳{aggregateTotalDue.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            Across {defaultersList.length} defaulter students
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Defaulter Students Count
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {defaultersList.length} <span className="text-sm font-normal text-slate-400">Students</span>
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            {(students.length > 0
              ? ((defaultersList.length / students.length) * 100).toFixed(1)
              : 0)}% of total enrollment
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              SMS Notifications
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              Send bulk due reminder SMS
            </span>
          </div>

          <button
            onClick={handleBroadcastDefaulterSMS}
            disabled={defaultersList.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Broadcast SMS</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Min Due (৳)
            </label>
            <select
              value={minDueThreshold}
              onChange={(e) => setMinDueThreshold(Number(e.target.value))}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
            >
              <option value={0}>All Dues (&gt; ৳0)</option>
              <option value={500}>&ge; ৳500</option>
              <option value={1000}>&ge; ৳1,000</option>
              <option value={2000}>&ge; ৳2,000</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Search Student / Roll / Phone
            </label>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrintDues}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Register</span>
          </button>
        </div>
      </div>

      {/* Printable Defaulters Header (Visible on print only) */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h2 className="text-base font-bold uppercase">{activeInstitute?.name}</h2>
        <p className="text-xs text-slate-500">
          {activeInstitute?.bengaliName} • EIIN: {activeInstitute?.eiin} • {activeInstitute?.address}
        </p>
        <h3 className="text-sm font-bold mt-2 underline">STUDENT DUES &amp; DEFAULTERS REGISTER</h3>
        <p className="text-xs text-slate-400">Generated on: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Defaulters Register Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3 text-center">Roll</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-3">Class &amp; Sec</th>
                <th className="py-3 px-3">Guardian Mobile</th>
                <th className="py-3 px-3">Overdue Months</th>
                <th className="py-3 px-3 text-right">Fee Due (৳)</th>
                <th className="py-3 px-3 text-right">Fine (৳)</th>
                <th className="py-3 px-3 text-right">Total Payable (৳)</th>
                <th className="py-3 px-3 text-center print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {defaultersList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No defaulter records found. All students are up to date!
                  </td>
                </tr>
              ) : (
                defaultersList.map((d) => (
                  <tr
                    key={d.studentId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200 font-mono">
                      #{d.rollNumber}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {d.studentName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {d.className} ({d.sectionName})
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {d.guardianMobile}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300">
                        {d.monthsList.join(', ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                      ৳{d.totalDue.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-600">
                      {d.totalLateFine > 0 ? `+৳${d.totalLateFine}` : '৳0'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600 dark:text-red-400 text-sm">
                      ৳{d.totalPayable.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center print:hidden">
                      <button
                        onClick={() => handleOpenSMSModal(d)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Send SMS Due Reminder"
                      >
                        <Send className="w-3 h-3" />
                        <span>SMS</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single SMS Reminder Modal */}
      {selectedDefaulterForSMS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 my-8">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Send Fee Reminder SMS</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              To: {selectedDefaulterForSMS.studentName}&apos;s Guardian ({selectedDefaulterForSMS.guardianMobile})
            </p>

            {smsSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{smsSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSendSingleSMS} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SMS Body (বাংলা / English)
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={smsText}
                    onChange={(e) => setSmsText(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Characters: {smsText.length}</span>
                    <span>Standard Bangladeshi Gateway Rate: 1 SMS</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setSelectedDefaulterForSMS(null)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingSMS}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isSendingSMS ? 'Dispatching...' : 'Dispatch SMS'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
