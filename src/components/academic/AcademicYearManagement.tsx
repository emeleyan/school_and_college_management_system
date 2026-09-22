import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AcademicYear } from '../../types';
import { add, update, remove, getAll } from '../../db/indexedDB';
import {
  Calendar,
  Plus,
  CheckCircle2,
  Building2,
  Trash2,
  Edit2,
  AlertCircle,
  Clock,
  Save,
  X,
} from 'lucide-react';

export const AcademicYearManagement: React.FC = () => {
  const {
    activeInstitute,
    activeAcademicYear,
    academicYears,
    institutes,
    switchAcademicYear,
    refreshContext,
    logAudit,
    language,
    t,
  } = useApp();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const isCollege = activeInstitute?.type === 'college';
  const [newYear, setNewYear] = useState({
    yearName: isCollege ? '2025-26' : '2026',
    startDate: isCollege ? '2025-07-01' : '2026-01-01',
    endDate: isCollege ? '2026-06-30' : '2026-12-31',
    instituteId: activeInstitute?.id || 'both',
    setAsActive: false,
  });

  const handleSelectPresetYear = (name: string) => {
    if (name.includes('-')) {
      const parts = name.split('-');
      const startYear = parseInt(parts[0], 10);
      const endYearShort = parseInt(parts[1], 10);
      const endYearFull = Math.floor(startYear / 100) * 100 + endYearShort;
      setNewYear({
        ...newYear,
        yearName: name,
        startDate: `${startYear}-07-01`,
        endDate: `${endYearFull}-06-30`,
      });
    } else {
      setNewYear({
        ...newYear,
        yearName: name,
        startDate: `${name}-01-01`,
        endDate: `${name}-12-31`,
      });
    }
  };

  const handleQuickAddCollegeSessions = async () => {
    if (!activeInstitute) return;
    try {
      const existingNames = academicYears.map((y) => y.yearName);
      const collegeSessions = [
        { name: '2025-26', start: '2025-07-01', end: '2026-06-30', active: true },
        { name: '2026-27', start: '2026-07-01', end: '2027-06-30', active: false },
      ];

      for (const s of collegeSessions) {
        if (!existingNames.includes(s.name)) {
          const newObj: AcademicYear = {
            id: `year_${s.name.replace('-', '_')}_${Date.now()}`,
            instituteId: activeInstitute.id,
            yearName: s.name,
            startDate: s.start,
            endDate: s.end,
            isActive: s.active,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await add('academicYears', newObj);
        }
      }

      await refreshContext();
      setStatusMsg('Standard College Academic Sessions (2025-26 & 2026-27) added successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add college sessions');
    }
  };

  const [statusMsg, setStatusMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYear.yearName.trim()) {
      setErrorMsg('Year name is required');
      return;
    }

    try {
      const yearId = `year_${newYear.yearName}_${Date.now()}`;
      const yearObj: AcademicYear = {
        id: yearId,
        instituteId: newYear.instituteId,
        yearName: newYear.yearName.trim(),
        startDate: newYear.startDate,
        endDate: newYear.endDate,
        isActive: newYear.setAsActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // If set as active, deactivate other years for this institute
      if (newYear.setAsActive) {
        const allYears = await getAll<AcademicYear>('academicYears');
        for (const y of allYears) {
          if (
            (y.instituteId === newYear.instituteId || newYear.instituteId === 'both') &&
            y.isActive
          ) {
            await update('academicYears', { ...y, isActive: false });
          }
        }
      }

      await add('academicYears', yearObj);
      await logAudit(
        'ACADEMIC_YEAR_CREATE',
        'academic',
        `Created academic year "${yearObj.yearName}" (${newYear.startDate} to ${newYear.endDate})`,
        yearObj.id
      );

      await refreshContext();
      if (newYear.setAsActive) {
        await switchAcademicYear(yearObj.id);
      }

      setShowAddModal(false);
      setStatusMsg(`Academic Year ${yearObj.yearName} created successfully.`);
    } catch (err: any) {
      console.error('Error creating academic year:', err);
      setErrorMsg(err.message || 'Failed to create academic year');
    }
  };

  const handleSetActive = async (year: AcademicYear) => {
    try {
      const allYears = await getAll<AcademicYear>('academicYears');
      for (const y of allYears) {
        if (
          (y.instituteId === year.instituteId || y.instituteId === 'both' || year.instituteId === 'both') &&
          y.isActive &&
          y.id !== year.id
        ) {
          await update('academicYears', { ...y, isActive: false });
        }
      }

      await update('academicYears', { ...year, isActive: true, updatedAt: new Date().toISOString() });
      await logAudit(
        'ACADEMIC_YEAR_ACTIVATE',
        'academic',
        `Set "${year.yearName}" as the active academic year`,
        year.id
      );

      await refreshContext();
      await switchAcademicYear(year.id);
      setStatusMsg(`Set "${year.yearName}" as the active academic year.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to activate academic year');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Academic Year Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Historical academic year partitions for {activeInstitute?.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCollege && (
            <button
              onClick={handleQuickAddCollegeSessions}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors shadow-xs shrink-0 cursor-pointer"
              title="Add 2025-26 and 2026-27 standard sessions"
            >
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              <span>Add College Sessions (2025-26, 2026-27)</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Academic Year</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Active Year Card (Professional Polish Dark Highlight) */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              Currently Active Session
            </div>
            <div className="text-xl font-bold text-white tracking-tight">
              Academic Year {activeAcademicYear?.yearName || 'None'}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              Duration: {activeAcademicYear?.startDate} to {activeAcademicYear?.endDate}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 max-w-sm border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6">
          <strong className="text-slate-300">Historical Integrity Rule:</strong> Changing the active year does not delete old students, exams, or fee records. Previous academic years remain safely accessible.
        </div>
      </div>

      {/* Academic Years Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">
            Available Academic Sessions ({academicYears.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">
            Scope: {activeInstitute?.name}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3">Academic Year</th>
                <th className="px-6 py-3">Duration Period</th>
                <th className="px-6 py-3">Applies To</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {academicYears.map((year) => {
                const isActive = year.id === activeAcademicYear?.id;
                return (
                  <tr
                    key={year.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors ${
                      isActive ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>{year.yearName}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 font-mono">
                      {year.startDate} <span className="text-slate-400">to</span> {year.endDate}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        {year.instituteId === 'both'
                          ? 'Both Institutes'
                          : year.instituteId === activeInstitute?.id
                          ? activeInstitute.name
                          : 'Institute Specific'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-400 uppercase tracking-wider">
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {!isActive && (
                        <button
                          onClick={() => handleSetActive(year)}
                          className="px-3 py-1 rounded-md text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          Set Active
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Create New Academic Year</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateYear} className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Academic Year Name *
                  </label>
                  <span className="text-[10px] text-slate-400">e.g. 2025-26 or 2026</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder={isCollege ? 'e.g. 2025-26' : 'e.g. 2026'}
                  value={newYear.yearName}
                  onChange={(e) => setNewYear({ ...newYear, yearName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />

                {/* Session preset pills */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">Quick Presets:</span>
                  {['2025-26', '2026-27', '2024-25', '2026', '2025', '2027'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectPresetYear(preset)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        newYear.yearName === preset
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newYear.startDate}
                    onChange={(e) => setNewYear({ ...newYear, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newYear.endDate}
                    onChange={(e) => setNewYear({ ...newYear, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Applicable Institute
                </label>
                <select
                  value={newYear.instituteId}
                  onChange={(e) => setNewYear({ ...newYear, instituteId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="both">Both School &amp; College</option>
                  {institutes.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-set-active"
                  checked={newYear.setAsActive}
                  onChange={(e) => setNewYear({ ...newYear, setAsActive: e.target.checked })}
                  className="rounded-sm text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="chk-set-active" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Immediately set as active session
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Create Session</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
