import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AcademicClass } from '../../types';
import { getAll, add, update, remove } from '../../db/indexedDB';
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
  Save,
  X,
  AlertCircle,
} from 'lucide-react';

export const ClassManagement: React.FC = () => {
  const { activeInstitute, language, logAudit } = useApp();
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    bengaliName: '',
    numericLevel: 6,
    hasGroups: false,
    status: 'active' as 'active' | 'inactive',
  });

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const fetchClasses = async () => {
    if (!activeInstitute) return;
    setLoading(true);
    try {
      const all = await getAll<AcademicClass>('classes');
      const filtered = all
        .filter((c) => c.instituteId === activeInstitute.id)
        .sort((a, b) => a.numericLevel - b.numericLevel);
      setClasses(filtered);
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [activeInstitute]);

  const openAddModal = () => {
    setEditingClass(null);
    const isSchool = activeInstitute?.type === 'school';
    setFormData({
      name: isSchool ? 'Class 6' : 'Class 11 (HSC 1st Year)',
      bengaliName: isSchool ? '৬ষ্ঠ শ্রেণি' : 'একাদশ শ্রেণি',
      numericLevel: isSchool ? 6 : 11,
      hasGroups: !isSchool,
      status: 'active',
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (cls: AcademicClass) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      bengaliName: cls.bengaliName,
      numericLevel: cls.numericLevel,
      hasGroups: cls.hasGroups,
      status: cls.status,
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute) return;
    if (!formData.name.trim()) {
      setErrorMsg('Class name in English is required.');
      return;
    }

    try {
      if (editingClass) {
        const updated: AcademicClass = {
          ...editingClass,
          name: formData.name.trim(),
          bengaliName: formData.bengaliName.trim() || formData.name.trim(),
          numericLevel: Number(formData.numericLevel),
          hasGroups: formData.hasGroups,
          status: formData.status,
          updatedAt: new Date().toISOString(),
        };
        await update('classes', updated);
        await logAudit(
          'UPDATE_CLASS',
          'academic',
          `Updated class: ${updated.name}`,
          updated.id
        );
        setSuccessMsg(`Class "${updated.name}" updated successfully.`);
      } else {
        const newId = `class_${activeInstitute.id}_${Date.now()}`;
        const created: AcademicClass = {
          id: newId,
          instituteId: activeInstitute.id,
          name: formData.name.trim(),
          bengaliName: formData.bengaliName.trim() || formData.name.trim(),
          numericLevel: Number(formData.numericLevel),
          hasGroups: formData.hasGroups,
          status: formData.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await add('classes', created);
        await logAudit(
          'CREATE_CLASS',
          'academic',
          `Created class: ${created.name}`,
          created.id
        );
        setSuccessMsg(`Class "${created.name}" created successfully.`);
      }

      setShowModal(false);
      await fetchClasses();
    } catch (err: any) {
      console.error('Error saving class:', err);
      setErrorMsg(err.message || 'Failed to save class.');
    }
  };

  const handleDelete = async (cls: AcademicClass) => {
    if (!activeInstitute) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${cls.name}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await remove('classes', cls.id);
      await logAudit(
        'DELETE_CLASS',
        'academic',
        `Deleted class: ${cls.name}`,
        cls.id
      );
      setSuccessMsg(`Class "${cls.name}" deleted.`);
      await fetchClasses();
    } catch (err: any) {
      console.error('Error deleting class:', err);
      setErrorMsg(err.message || 'Failed to delete class.');
    }
  };

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.bengaliName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.numericLevel.toString().includes(searchQuery)
  );

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

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'bn' ? 'শ্রেণি অনুসন্ধান করুন...' : 'Search classes...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? 'নতুন শ্রেণি যোগ' : 'Add New Class'}</span>
        </button>
      </div>

      {/* Classes Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading classes...</div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'bn' ? 'কোনো শ্রেণি পাওয়া যায়নি।' : 'No classes configured for this institute yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Class Name (EN)</th>
                  <th className="px-4 py-3 font-semibold">নাম (বাংলা)</th>
                  <th className="px-4 py-3 font-semibold">Numeric Level</th>
                  <th className="px-4 py-3 font-semibold">Has Streams / Groups</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredClasses.map((cls, idx) => (
                  <tr key={cls.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {cls.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {cls.bengaliName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        Level {cls.numericLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {cls.hasGroups ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          Yes (Science/Arts/Commerce)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">General Only</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {cls.status === 'active' ? (
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
                          onClick={() => openEditModal(cls)}
                          className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                          title="Edit Class"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cls)}
                          className="p-1 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                          title="Delete Class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingClass ? 'Edit Class' : 'Add New Class'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Class Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 9 or HSC 1st Year"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  নাম (বাংলা)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ৯ম শ্রেণি বা একাদশ শ্রেণি"
                  value={formData.bengaliName}
                  onChange={(e) => setFormData({ ...formData, bengaliName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Numeric Level *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    required
                    value={formData.numericLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, numericLevel: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">e.g. 6 for Class 6, 11 for HSC</p>
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

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.hasGroups}
                    onChange={(e) => setFormData({ ...formData, hasGroups: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Has Academic Groups (Science, Humanities, Business Studies)
                  </span>
                </label>
                <p className="text-[10px] text-slate-400 ml-6 mt-0.5">
                  Check this for Secondary (Class 9-10) and Higher Secondary / College levels.
                </p>
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
                  <span>{editingClass ? 'Update Class' : 'Save Class'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
