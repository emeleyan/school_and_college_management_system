import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AcademicGroup, AcademicShift, AcademicDepartment } from '../../types';
import { getAll, add, update, remove } from '../../db/indexedDB';
import {
  Compass,
  Clock,
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Save,
  X,
  AlertCircle,
} from 'lucide-react';

export const GroupShiftDeptManagement: React.FC = () => {
  const { activeInstitute, language, logAudit } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'groups' | 'shifts' | 'departments'>('groups');

  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [shifts, setShifts] = useState<AcademicShift[]>([]);
  const [departments, setDepartments] = useState<AcademicDepartment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Group modal & form
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<AcademicGroup | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    bengaliName: '',
    code: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Shift modal & form
  const [showShiftModal, setShowShiftModal] = useState<boolean>(false);
  const [editingShift, setEditingShift] = useState<AcademicShift | null>(null);
  const [shiftForm, setShiftForm] = useState({
    name: '',
    bengaliName: '',
    startTime: '07:30 AM',
    endTime: '12:00 PM',
    status: 'active' as 'active' | 'inactive',
  });

  // Dept modal & form
  const [showDeptModal, setShowDeptModal] = useState<boolean>(false);
  const [editingDept, setEditingDept] = useState<AcademicDepartment | null>(null);
  const [deptForm, setDeptForm] = useState({
    name: '',
    bengaliName: '',
    code: '',
    headName: '',
    status: 'active' as 'active' | 'inactive',
  });

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const fetchData = async () => {
    if (!activeInstitute) return;
    setLoading(true);
    try {
      const [allGroups, allShifts, allDepts] = await Promise.all([
        getAll<AcademicGroup>('groups'),
        getAll<AcademicShift>('shifts'),
        getAll<AcademicDepartment>('departments'),
      ]);

      setGroups(allGroups.filter((g) => g.instituteId === activeInstitute.id));
      setShifts(allShifts.filter((s) => s.instituteId === activeInstitute.id));
      setDepartments(allDepts.filter((d) => d.instituteId === activeInstitute.id));
    } catch (err) {
      console.error('Error fetching academic aux data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeInstitute]);

  // Group Handlers
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute) return;
    if (!groupForm.name.trim()) return setErrorMsg('Group name is required.');

    try {
      if (editingGroup) {
        const updated: AcademicGroup = {
          ...editingGroup,
          name: groupForm.name.trim(),
          bengaliName: groupForm.bengaliName.trim() || groupForm.name.trim(),
          code: groupForm.code.trim().toUpperCase() || 'GRP',
          description: groupForm.description.trim() || undefined,
          status: groupForm.status,
          updatedAt: new Date().toISOString(),
        };
        await update('groups', updated);
        await logAudit('UPDATE_GROUP', 'academic', `Updated group: ${updated.name}`, updated.id);
        setSuccessMsg(`Group "${updated.name}" updated.`);
      } else {
        const created: AcademicGroup = {
          id: `grp_${activeInstitute.id}_${Date.now()}`,
          instituteId: activeInstitute.id,
          name: groupForm.name.trim(),
          bengaliName: groupForm.bengaliName.trim() || groupForm.name.trim(),
          code: groupForm.code.trim().toUpperCase() || 'GRP',
          description: groupForm.description.trim() || undefined,
          status: groupForm.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await add('groups', created);
        await logAudit('CREATE_GROUP', 'academic', `Created group: ${created.name}`, created.id);
        setSuccessMsg(`Group "${created.name}" created.`);
      }
      setShowGroupModal(false);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save group.');
    }
  };

  const handleDeleteGroup = async (grp: AcademicGroup) => {
    if (!window.confirm(`Delete group "${grp.name}"?`)) return;
    try {
      await remove('groups', grp.id);
      await logAudit('DELETE_GROUP', 'academic', `Deleted group: ${grp.name}`, grp.id);
      setSuccessMsg(`Group "${grp.name}" deleted.`);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete group.');
    }
  };

  // Shift Handlers
  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute) return;
    if (!shiftForm.name.trim()) return setErrorMsg('Shift name is required.');

    try {
      if (editingShift) {
        const updated: AcademicShift = {
          ...editingShift,
          name: shiftForm.name.trim(),
          bengaliName: shiftForm.bengaliName.trim() || shiftForm.name.trim(),
          startTime: shiftForm.startTime.trim(),
          endTime: shiftForm.endTime.trim(),
          status: shiftForm.status,
          updatedAt: new Date().toISOString(),
        };
        await update('shifts', updated);
        await logAudit('UPDATE_SHIFT', 'academic', `Updated shift: ${updated.name}`, updated.id);
        setSuccessMsg(`Shift "${updated.name}" updated.`);
      } else {
        const created: AcademicShift = {
          id: `shift_${activeInstitute.id}_${Date.now()}`,
          instituteId: activeInstitute.id,
          name: shiftForm.name.trim(),
          bengaliName: shiftForm.bengaliName.trim() || shiftForm.name.trim(),
          startTime: shiftForm.startTime.trim(),
          endTime: shiftForm.endTime.trim(),
          status: shiftForm.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await add('shifts', created);
        await logAudit('CREATE_SHIFT', 'academic', `Created shift: ${created.name}`, created.id);
        setSuccessMsg(`Shift "${created.name}" created.`);
      }
      setShowShiftModal(false);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save shift.');
    }
  };

  const handleDeleteShift = async (sh: AcademicShift) => {
    if (!window.confirm(`Delete shift "${sh.name}"?`)) return;
    try {
      await remove('shifts', sh.id);
      await logAudit('DELETE_SHIFT', 'academic', `Deleted shift: ${sh.name}`, sh.id);
      setSuccessMsg(`Shift "${sh.name}" deleted.`);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete shift.');
    }
  };

  // Dept Handlers
  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute) return;
    if (!deptForm.name.trim()) return setErrorMsg('Department name is required.');

    try {
      if (editingDept) {
        const updated: AcademicDepartment = {
          ...editingDept,
          name: deptForm.name.trim(),
          bengaliName: deptForm.bengaliName.trim() || deptForm.name.trim(),
          code: deptForm.code.trim().toUpperCase() || 'DEPT',
          headName: deptForm.headName.trim() || undefined,
          status: deptForm.status,
          updatedAt: new Date().toISOString(),
        };
        await update('departments', updated);
        await logAudit('UPDATE_DEPT', 'academic', `Updated department: ${updated.name}`, updated.id);
        setSuccessMsg(`Department "${updated.name}" updated.`);
      } else {
        const created: AcademicDepartment = {
          id: `dept_${activeInstitute.id}_${Date.now()}`,
          instituteId: activeInstitute.id,
          name: deptForm.name.trim(),
          bengaliName: deptForm.bengaliName.trim() || deptForm.name.trim(),
          code: deptForm.code.trim().toUpperCase() || 'DEPT',
          headName: deptForm.headName.trim() || undefined,
          status: deptForm.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await add('departments', created);
        await logAudit('CREATE_DEPT', 'academic', `Created department: ${created.name}`, created.id);
        setSuccessMsg(`Department "${created.name}" created.`);
      }
      setShowDeptModal(false);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save department.');
    }
  };

  const handleDeleteDept = async (dept: AcademicDepartment) => {
    if (!window.confirm(`Delete department "${dept.name}"?`)) return;
    try {
      await remove('departments', dept.id);
      await logAudit('DELETE_DEPT', 'academic', `Deleted department: ${dept.name}`, dept.id);
      setSuccessMsg(`Department "${dept.name}" deleted.`);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete department.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-700 hover:text-rose-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sub tabs: Groups, Shifts, Departments */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveSubTab('groups')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeSubTab === 'groups'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Groups &amp; Streams ({groups.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('shifts')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeSubTab === 'shifts'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Shifts ({shifts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('departments')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeSubTab === 'departments'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Academic Departments ({departments.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: GROUPS */}
      {activeSubTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                Academic Groups / Streams
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure Science, Humanities, Business Studies, or General streams for Secondary and Higher Secondary.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingGroup(null);
                setGroupForm({
                  name: '',
                  bengaliName: '',
                  code: '',
                  description: '',
                  status: 'active',
                });
                setShowGroupModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Group</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups.map((grp) => (
              <div
                key={grp.id}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {grp.code}
                    </span>
                    <h5 className="font-semibold text-xs text-slate-900 dark:text-white mt-1">
                      {grp.name}
                    </h5>
                    <p className="text-[11px] text-slate-500">{grp.bengaliName}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingGroup(grp);
                        setGroupForm({
                          name: grp.name,
                          bengaliName: grp.bengaliName,
                          code: grp.code,
                          description: grp.description || '',
                          status: grp.status,
                        });
                        setShowGroupModal(true);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(grp)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {grp.description && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg">
                    {grp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: SHIFTS */}
      {activeSubTab === 'shifts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                Institute Shifts
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Manage Morning, Day, or Evening shifts with operating hours.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingShift(null);
                setShiftForm({
                  name: '',
                  bengaliName: '',
                  startTime: '07:30 AM',
                  endTime: '12:00 PM',
                  status: 'active',
                });
                setShowShiftModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Shift</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shifts.map((sh) => (
              <div
                key={sh.id}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <h5 className="font-semibold text-xs text-slate-900 dark:text-white">
                      {sh.name}
                    </h5>
                    <span className="text-[11px] text-slate-500">({sh.bengaliName})</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                    Time: {sh.startTime} - {sh.endTime}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingShift(sh);
                      setShiftForm({
                        name: sh.name,
                        bengaliName: sh.bengaliName,
                        startTime: sh.startTime,
                        endTime: sh.endTime,
                        status: sh.status,
                      });
                      setShowShiftModal(true);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteShift(sh)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: DEPARTMENTS */}
      {activeSubTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                Academic Departments
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Departmental structure and Head of Departments for College &amp; School faculties.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingDept(null);
                setDeptForm({
                  name: '',
                  bengaliName: '',
                  code: '',
                  headName: '',
                  status: 'active',
                });
                setShowDeptModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Department</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {dept.code}
                    </span>
                    <h5 className="font-semibold text-xs text-slate-900 dark:text-white">
                      {dept.name}
                    </h5>
                  </div>
                  <div className="text-[11px] text-slate-500">{dept.bengaliName}</div>
                  {dept.headName && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-300">
                      Head: <strong>{dept.headName}</strong>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingDept(dept);
                      setDeptForm({
                        name: dept.name,
                        bengaliName: dept.bengaliName,
                        code: dept.code,
                        headName: dept.headName || '',
                        status: dept.status,
                      });
                      setShowDeptModal(true);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDept(dept)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingGroup ? 'Edit Group' : 'Add Group'}
              </h3>
              <button onClick={() => setShowGroupModal(false)} className="text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveGroup} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Group Name (EN) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  নাম (বাংলা)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: বিজ্ঞান"
                  value={groupForm.bengaliName}
                  onChange={(e) => setGroupForm({ ...groupForm, bengaliName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Group Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SCI"
                  value={groupForm.code}
                  onChange={(e) => setGroupForm({ ...groupForm, code: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Optional brief description"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingShift ? 'Edit Shift' : 'Add Shift'}
              </h3>
              <button onClick={() => setShowShiftModal(false)} className="text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveShift} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Shift Name (EN) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning Shift"
                  value={shiftForm.name}
                  onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">শিফটের নাম (বাংলা)</label>
                <input
                  type="text"
                  placeholder="যেমন: প্রভাতী শিফট"
                  value={shiftForm.bengaliName}
                  onChange={(e) => setShiftForm({ ...shiftForm, bengaliName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Start Time</label>
                  <input
                    type="text"
                    placeholder="07:30 AM"
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">End Time</label>
                  <input
                    type="text"
                    placeholder="12:00 PM"
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Save Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dept Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingDept ? 'Edit Department' : 'Add Department'}
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveDept} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Department Name (EN) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Department of Physics"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">বিভাগের নাম (বাংলা)</label>
                <input
                  type="text"
                  placeholder="যেমন: পদার্থবিজ্ঞান বিভাগ"
                  value={deptForm.bengaliName}
                  onChange={(e) => setDeptForm({ ...deptForm, bengaliName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Code</label>
                  <input
                    type="text"
                    placeholder="e.g. PHY"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Head of Dept</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Rafiqul"
                    value={deptForm.headName}
                    onChange={(e) => setDeptForm({ ...deptForm, headName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
