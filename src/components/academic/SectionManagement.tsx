import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AcademicClass, AcademicSection, AcademicShift } from '../../types';
import { getAll, add, update, remove } from '../../db/indexedDB';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  Save,
  X,
  AlertCircle,
  DoorOpen,
  UserCheck,
} from 'lucide-react';

export const SectionManagement: React.FC = () => {
  const { activeInstitute, language, logAudit } = useApp();
  const [sections, setSections] = useState<AcademicSection[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [shifts, setShifts] = useState<AcademicShift[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingSection, setEditingSection] = useState<AcademicSection | null>(null);

  const [formData, setFormData] = useState({
    classId: '',
    name: '',
    bengaliName: '',
    shiftId: '',
    roomNumber: '',
    capacity: 50,
    classTeacherName: '',
    status: 'active' as 'active' | 'inactive',
  });

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const fetchData = async () => {
    if (!activeInstitute) return;
    setLoading(true);
    try {
      const [allSections, allClasses, allShifts] = await Promise.all([
        getAll<AcademicSection>('sections'),
        getAll<AcademicClass>('classes'),
        getAll<AcademicShift>('shifts'),
      ]);

      const instClasses = allClasses
        .filter((c) => c.instituteId === activeInstitute.id)
        .sort((a, b) => a.numericLevel - b.numericLevel);
      const instSections = allSections.filter((s) => s.instituteId === activeInstitute.id);
      const instShifts = allShifts.filter((sh) => sh.instituteId === activeInstitute.id);

      setClasses(instClasses);
      setSections(instSections);
      setShifts(instShifts);
    } catch (err) {
      console.error('Error fetching section data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeInstitute]);

  const openAddModal = () => {
    setEditingSection(null);
    setFormData({
      classId: classes[0]?.id || '',
      name: 'Section A (Padma)',
      bengaliName: 'শাখা ক (পদ্মা)',
      shiftId: shifts[0]?.id || '',
      roomNumber: 'Room 101',
      capacity: 50,
      classTeacherName: '',
      status: 'active',
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (sec: AcademicSection) => {
    setEditingSection(sec);
    setFormData({
      classId: sec.classId,
      name: sec.name,
      bengaliName: sec.bengaliName,
      shiftId: sec.shiftId || '',
      roomNumber: sec.roomNumber || '',
      capacity: sec.capacity || 50,
      classTeacherName: sec.classTeacherName || '',
      status: sec.status,
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute) return;
    if (!formData.name.trim()) {
      setErrorMsg('Section name is required.');
      return;
    }
    if (!formData.classId) {
      setErrorMsg('Please select a class for this section.');
      return;
    }

    try {
      if (editingSection) {
        const updated: AcademicSection = {
          ...editingSection,
          classId: formData.classId,
          name: formData.name.trim(),
          bengaliName: formData.bengaliName.trim() || formData.name.trim(),
          shiftId: formData.shiftId || undefined,
          roomNumber: formData.roomNumber.trim() || undefined,
          capacity: Number(formData.capacity) || 50,
          classTeacherName: formData.classTeacherName.trim() || undefined,
          status: formData.status,
          updatedAt: new Date().toISOString(),
        };
        await update('sections', updated);
        await logAudit(
          'UPDATE_SECTION',
          'academic',
          `Updated section: ${updated.name}`,
          updated.id
        );
        setSuccessMsg(`Section "${updated.name}" updated successfully.`);
      } else {
        const newId = `sec_${formData.classId}_${Date.now()}`;
        const created: AcademicSection = {
          id: newId,
          instituteId: activeInstitute.id,
          classId: formData.classId,
          name: formData.name.trim(),
          bengaliName: formData.bengaliName.trim() || formData.name.trim(),
          shiftId: formData.shiftId || undefined,
          roomNumber: formData.roomNumber.trim() || undefined,
          capacity: Number(formData.capacity) || 50,
          classTeacherName: formData.classTeacherName.trim() || undefined,
          status: formData.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await add('sections', created);
        await logAudit(
          'CREATE_SECTION',
          'academic',
          `Created section: ${created.name}`,
          created.id
        );
        setSuccessMsg(`Section "${created.name}" created successfully.`);
      }

      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      console.error('Error saving section:', err);
      setErrorMsg(err.message || 'Failed to save section.');
    }
  };

  const handleDelete = async (sec: AcademicSection) => {
    if (!activeInstitute) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete section "${sec.name}"?`
    );
    if (!confirmDelete) return;

    try {
      await remove('sections', sec.id);
      await logAudit(
        'DELETE_SECTION',
        'academic',
        `Deleted section: ${sec.name}`,
        sec.id
      );
      setSuccessMsg(`Section "${sec.name}" deleted.`);
      await fetchData();
    } catch (err: any) {
      console.error('Error deleting section:', err);
      setErrorMsg(err.message || 'Failed to delete section.');
    }
  };

  const filteredSections = sections.filter((s) => {
    const matchesClass = selectedClassFilter === 'all' || s.classId === selectedClassFilter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.bengaliName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.roomNumber && s.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.classTeacherName && s.classTeacherName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesClass && matchesSearch;
  });

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

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'bn' ? 'শাখা অনুসন্ধান করুন...' : 'Search sections...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Classes ({sections.length} sections)</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.bengaliName})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={openAddModal}
          disabled={classes.length === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? 'নতুন শাখা যোগ' : 'Add New Section'}</span>
        </button>
      </div>

      {/* Sections Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading sections...</div>
        ) : filteredSections.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
              <Layers className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {classes.length === 0
                ? 'Please create at least one Class first before adding sections.'
                : 'No sections found matching your filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Section Name (EN)</th>
                  <th className="px-4 py-3 font-semibold">শাখা (বাংলা)</th>
                  <th className="px-4 py-3 font-semibold">Shift</th>
                  <th className="px-4 py-3 font-semibold">Room &amp; Capacity</th>
                  <th className="px-4 py-3 font-semibold">Class Teacher</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredSections.map((sec, idx) => {
                  const parentClass = classes.find((c) => c.id === sec.classId);
                  const parentShift = shifts.find((sh) => sh.id === sec.shiftId);
                  return (
                    <tr key={sec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {parentClass?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {sec.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {sec.bengaliName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {parentShift?.name || 'General Shift'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sec.roomNumber || 'TBD'}</span>
                          <span className="text-slate-400">•</span>
                          <span>Cap: {sec.capacity}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                          <span>{sec.classTeacherName || 'Not Assigned'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {sec.status === 'active' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(sec)}
                            className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            title="Edit Section"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sec)}
                            className="p-1 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            title="Delete Section"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingSection ? 'Edit Section' : 'Add New Section'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Class *
                  </label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.bengaliName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shift
                  </label>
                  <select
                    value={formData.shiftId}
                    onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">General / None</option>
                    {shifts.map((sh) => (
                      <option key={sh.id} value={sh.id}>
                        {sh.name} ({sh.bengaliName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Section Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Section A or Padma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    শাখার নাম (বাংলা)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: শাখা ক বা পদ্মা"
                    value={formData.bengaliName}
                    onChange={(e) => setFormData({ ...formData, bengaliName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 102"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Capacity
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value) || 50 })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Class Teacher Name / Designation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Md. Kamrul Hasan (Senior Teacher)"
                  value={formData.classTeacherName}
                  onChange={(e) => setFormData({ ...formData, classTeacherName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingSection ? 'Update Section' : 'Save Section'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
