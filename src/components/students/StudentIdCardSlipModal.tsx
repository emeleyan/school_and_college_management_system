import React from 'react';
import { Student, AcademicClass, AcademicSection, Institute } from '../../types';
import { X, Printer, CreditCard } from 'lucide-react';

interface StudentIdCardSlipModalProps {
  student: Student;
  classes: AcademicClass[];
  sections: AcademicSection[];
  institute: Institute | null;
  onClose: () => void;
}

export const StudentIdCardSlipModal: React.FC<StudentIdCardSlipModalProps> = ({
  student,
  classes,
  sections,
  institute,
  onClose,
}) => {
  const currentClass = classes.find((c) => c.id === student.classId);
  const currentSection = sections.find((s) => s.id === student.sectionId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden my-8">
        {/* Modal Topbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 print:hidden">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Student Identity Card Slip
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable ID Card Body */}
        <div className="p-6 sm:p-8 flex justify-center">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-lg overflow-hidden text-slate-900 dark:text-white">
            {/* Header */}
            <div className="bg-linear-to-r from-blue-700 to-indigo-800 text-white p-4 text-center">
              <h3 className="font-bold text-sm tracking-wide leading-tight">
                {institute?.name}
              </h3>
              <p className="text-[11px] text-blue-200 font-medium">
                {institute?.bengaliName}
              </p>
              <div className="flex items-center justify-center gap-2 text-[9px] text-blue-100 uppercase tracking-widest pt-1">
                <span>EIIN: {institute?.eiin || 'N/A'}</span>
                <span>•</span>
                <span>STUDENT ID CARD</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                {/* Photo box */}
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={`${student.firstName || ''} ${student.lastName || ''}`}
                    className="w-20 h-24 rounded-lg object-cover border border-slate-300 dark:border-slate-600 shrink-0 bg-slate-100 dark:bg-slate-800"
                  />
                ) : (
                  <div className="w-20 h-24 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center p-1 shrink-0">
                    <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                      {(student.firstName || student.bengaliName || 'S').charAt(0)}
                      {(student.lastName || '').charAt(0)}
                    </span>
                    <span className="text-[8px] text-slate-400 font-medium uppercase">
                      Photo
                    </span>
                  </div>
                )}

                {/* Name & ID */}
                <div className="space-y-1">
                  <h4 className="font-bold text-base leading-tight text-slate-900 dark:text-white">
                    {student.firstName} {student.lastName}
                  </h4>
                  {student.bengaliName && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {student.bengaliName}
                    </p>
                  )}
                  <div className="inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-bold rounded-sm">
                    ID: {student.studentId}
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Class:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {currentClass?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Section:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {currentSection?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Roll Number:</span>
                  <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                    {student.rollNumber}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 font-medium">Father / পিতা:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right">
                    {student.guardian?.fatherName || (student as any).fatherName || 'N/A'}
                    {(student.guardian?.fatherNameBn || (student as any).fatherNameBn) && (
                      <span className="block text-[10px] text-slate-500 font-normal">
                        ({student.guardian?.fatherNameBn || (student as any).fatherNameBn})
                      </span>
                    )}
                  </span>
                </div>
                {(student.guardian?.motherName || (student as any).motherName || student.guardian?.motherNameBn || (student as any).motherNameBn) && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-400 font-medium">Mother / মাতা:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-right">
                      {student.guardian?.motherName || (student as any).motherName || 'N/A'}
                      {(student.guardian?.motherNameBn || (student as any).motherNameBn) && (
                        <span className="block text-[10px] text-slate-500 font-normal">
                          ({student.guardian?.motherNameBn || (student as any).motherNameBn})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Blood Group:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {student.bloodGroup || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Emergency Phone:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {student.guardian?.emergencyContactPhone || student.guardian?.fatherPhone || student.phone || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Card Footer Signature */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-end justify-between text-[10px] text-slate-500">
                <div className="text-center flex flex-col items-center">
                  {student.studentSignatureUrl ? (
                    <img
                      src={student.studentSignatureUrl}
                      alt="Student Signature"
                      className="h-6 max-w-[80px] object-contain mb-0.5"
                    />
                  ) : (
                    <div className="w-20 border-b border-slate-400 mb-0.5"></div>
                  )}
                  <span>Student Sign</span>
                </div>
                <div className="text-center">
                  <div className="w-24 border-b border-slate-400 mb-0.5"></div>
                  <span>Principal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
