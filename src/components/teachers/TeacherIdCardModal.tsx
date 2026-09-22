import React from 'react';
import { Teacher, Institute } from '../../types';
import { X, Printer, Building2, CreditCard, ShieldCheck } from 'lucide-react';

interface TeacherIdCardModalProps {
  teacher: Teacher;
  institute?: Institute | null;
  onClose: () => void;
}

export const TeacherIdCardModal: React.FC<TeacherIdCardModalProps> = ({
  teacher,
  institute,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isTeacher = teacher.employeeType === 'teacher';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isTeacher ? 'Faculty Identity Card' : 'Staff Identity Card'}
              </h3>
              <p className="text-xs text-slate-500">Official Institutional ID</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Card</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Body & Printable Area */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900/40">
          {/* FRONT OF ID CARD */}
          <div className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-xl overflow-hidden print:border-slate-800 print:shadow-none">
            {/* Header Ribbon */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-3.5 text-center relative overflow-hidden">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Building2 className="w-4 h-4 text-blue-200" />
                <h4 className="text-xs font-bold uppercase tracking-wider line-clamp-1">
                  {institute?.name || 'Academic Institution'}
                </h4>
              </div>
              {institute?.bengaliName && (
                <p className="text-[10px] text-blue-100 font-medium line-clamp-1">
                  {institute.bengaliName}
                </p>
              )}
              <div className="flex items-center justify-center gap-3 text-[9px] text-blue-200 mt-1 font-mono">
                <span>EIIN: {institute?.eiin || 'N/A'}</span>
                <span>•</span>
                <span className="uppercase font-bold tracking-widest text-emerald-300">
                  {isTeacher ? 'FACULTY CARD' : 'STAFF CARD'}
                </span>
              </div>
            </div>

            {/* Photo & Name Section */}
            <div className="p-4 flex flex-col items-center text-center space-y-3">
              {/* Photo Box */}
              <div className="relative">
                {teacher.photoUrl ? (
                  <img
                    src={teacher.photoUrl}
                    alt={teacher.firstName}
                    className="w-24 h-28 rounded-xl object-cover border-2 border-indigo-600 dark:border-indigo-400 shadow-sm"
                  />
                ) : (
                  <div className="w-24 h-28 rounded-xl bg-blue-50 dark:bg-slate-800 border-2 border-dashed border-blue-300 dark:border-blue-700 flex flex-col items-center justify-center text-blue-600 font-bold text-2xl">
                    <span>{(teacher.firstName || 'T').charAt(0)}</span>
                    <span>{(teacher.lastName || '').charAt(0)}</span>
                  </div>
                )}
                <span className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shadow-xs border-2 border-white">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Name & Title */}
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                  {teacher.firstName} {teacher.lastName}
                </h3>
                {teacher.bengaliName && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {teacher.bengaliName}
                  </p>
                )}
                <div className="mt-1 inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[11px] font-bold">
                  {teacher.designation}
                </div>
              </div>

              {/* Key Details Grid */}
              <div className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-left text-[11px] space-y-1.5 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">ID Number:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {teacher.teacherId}
                  </span>
                </div>
                {teacher.indexNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">MPO Index:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {teacher.indexNumber}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Department:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                    {teacher.departmentName || 'General'}
                  </span>
                </div>
                {(teacher.fatherName || teacher.fatherNameBn) && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-400 font-medium">Father / পিতা:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-right">
                      {teacher.fatherName || ''}
                      {teacher.fatherNameBn && (
                        <span className="block text-[10px] text-slate-500 font-normal">
                          ({teacher.fatherNameBn})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {(teacher.motherName || teacher.motherNameBn) && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-400 font-medium">Mother / মাতা:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-right">
                      {teacher.motherName || ''}
                      {teacher.motherNameBn && (
                        <span className="block text-[10px] text-slate-500 font-normal">
                          ({teacher.motherNameBn})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Blood Group:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {teacher.bloodGroup || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Mobile:</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {teacher.phone}
                  </span>
                </div>
              </div>

              {/* Signatures Row */}
              <div className="w-full pt-3 border-t border-slate-200 dark:border-slate-700 flex items-end justify-between text-[9px] text-slate-500">
                <div className="text-center flex flex-col items-center">
                  {teacher.signatureUrl ? (
                    <img
                      src={teacher.signatureUrl}
                      alt="Sign"
                      className="h-6 max-w-[75px] object-contain mb-0.5"
                    />
                  ) : (
                    <div className="w-16 border-b border-slate-400 mb-0.5"></div>
                  )}
                  <span>Cardholder</span>
                </div>

                <div className="text-center flex flex-col items-center">
                  <div className="w-20 border-b border-slate-400 mb-0.5"></div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Principal</span>
                </div>
              </div>
            </div>

            {/* Bottom Color Stripe */}
            <div className="bg-slate-900 text-slate-400 p-2 text-center text-[8px]">
              If found, please return to: {institute?.address || 'Institution Administrative Office'}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-end bg-slate-50 dark:bg-slate-800/80 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-100 border border-slate-300 dark:border-slate-600 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
