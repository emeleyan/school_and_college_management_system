import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ExamTerm, ExamTermType, AcademicClass } from '../../types';
import { putItem, deleteItem, getAll } from '../../db/indexedDB';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  AlertCircle,
  FileCheck,
  Layers,
} from 'lucide-react';

interface ExamTermsTabProps {
  terms: ExamTerm[];
  onRefresh: () => void;
  selectedTermId: string;
  onSelectTermId: (id: string) => void;
}

export const ExamTermsTab: React.FC<ExamTermsTabProps> = ({
  terms,
  onRefresh,
  selectedTermId,
  onSelectTermId,
}) => {
  const { activeInstitute, activeAcademicYear, logAudit, language, hasPermission } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<ExamTerm | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    bengaliName: '',
    termType: 'half_yearly' as ExamTermType,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    status: 'upcoming' as ExamTerm['status'],
    weightPercentage: 50,
    description: '',
    classIds: [] as string[],
    isAllClasses: true,
  });

  useEffect(() => {
    const loadClasses = async () => {
      if (!activeInstitute) return;
      const allCls = await getAll<AcademicClass>('classes');
      const instCls = allCls
        .filter((c) => c.instituteId === activeInstitute.id)
        .sort((a, b) => a.numericLevel - b.numericLevel);
      setClasses(instCls);
    };
    loadClasses();
  }, [activeInstitute]);

  const openCreateModal = () => {
    setEditingTerm(null);
    setFormData({
      name: '',
      bengaliName: '',
      termType: 'half_yearly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
      status: 'upcoming',
      weightPercentage: 50,
      description: '',
      classIds: [],
      isAllClasses: true,
    });
    setShowModal(true);
  };

  const openEditModal = (term: ExamTerm) => {
    setEditingTerm(term);
    const hasSpecificClasses = Array.isArray(term.classIds) && term.classIds.length > 0;
    setFormData({
      name: term.name,
      bengaliName: term.bengaliName || '',
      termType: term.termType,
      startDate: term.startDate,
      endDate: term.endDate,
      status: term.status,
      weightPercentage: term.weightPercentage || 50,
      description: term.description || '',
      classIds: term.classIds || [],
      isAllClasses: !hasSpecificClasses,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute) return;

    try {
      const termId = editingTerm ? editingTerm.id : `exam-term-${Date.now()}`;
      const record: ExamTerm = {
        id: termId,
        instituteId: activeInstitute.id,
        academicYearId: activeAcademicYear?.id || '',
        name: formData.name.trim(),
        bengaliName: formData.bengaliName.trim(),
        termType: formData.termType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        weightPercentage: Number(formData.weightPercentage),
        description: formData.description.trim(),
        classIds: formData.isAllClasses ? undefined : formData.classIds,
        createdAt: editingTerm ? editingTerm.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await putItem('exams', record);
      await logAudit(
        editingTerm ? 'edit_exam_term' : 'create_exam_term',
        'examination',
        `${editingTerm ? 'Updated' : 'Created'} Examination Term: ${record.name}`
      );

      setShowModal(false);
      onRefresh();
      if (!selectedTermId) {
        onSelectTermId(record.id);
      }
    } catch (err) {
      console.error('Failed to save exam term:', err);
    }
  };

  const handleDelete = async (term: ExamTerm) => {
    if (!confirm(`Are you sure you want to delete the exam term "${term.name}"?`)) return;

    try {
      await deleteItem('exams', term.id);
      await logAudit('delete_exam_term', 'examination', `Deleted Exam Term: ${term.name}`);
      onRefresh();
      if (selectedTermId === term.id) {
        onSelectTermId('');
      }
    } catch (err) {
      console.error('Failed to delete exam term:', err);
    }
  };

  const filteredTerms = terms.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.bengaliName && t.bengaliName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesClass =
      selectedClassFilter === 'all' ||
      !t.classIds ||
      t.classIds.length === 0 ||
      t.classIds.includes(selectedClassFilter);
    return matchesSearch && matchesClass;
  });

  const getStatusBadge = (status: ExamTerm['status']) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            Results Published
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <FileCheck className="w-3 h-3" />
            Exam Completed
          </span>
        );
      case 'ongoing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
            <Clock className="w-3 h-3" />
            Upcoming
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search exam terms by name or বাংলা..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {classes.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-slate-500 font-medium">Class:</span>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Classes / সার্বজনীন</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {hasPermission('examination', 'add') && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Examination Term</span>
            </button>
          )}
        </div>
      </div>

      {/* Terms Grid */}
      {filteredTerms.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500">
          <Calendar className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <h4 className="font-semibold text-slate-800 dark:text-slate-200">No Examination Terms Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Create an exam term like 1st Term, Half Yearly, Annual, or Pre-Test to begin scheduling exams and entering marks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTerms.map((term) => {
            const isSelected = selectedTermId === term.id;
            return (
              <div
                key={term.id}
                className={`bg-white dark:bg-slate-800 rounded-xl border transition-all p-5 flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {term.termType.replace('_', ' ')}
                    </span>
                    {getStatusBadge(term.status)}
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2.5">
                    {term.name}
                  </h3>
                  {term.bengaliName && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {term.bengaliName}
                    </p>
                  )}

                  <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {term.startDate} to {term.endDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-400">
                      <span>Annual Weightage:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {term.weightPercentage}%
                      </span>
                    </div>

                    <div className="pt-1.5 flex items-center gap-1.5 flex-wrap">
                      <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      {!term.classIds || term.classIds.length === 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          All Classes (সার্বজনীন)
                        </span>
                      ) : (
                        term.classIds.map((cid) => {
                          const cls = classes.find((c) => c.id === cid);
                          return (
                            <span
                              key={cid}
                              className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800"
                            >
                              {cls?.name || 'Class'}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {term.description && (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic bg-slate-50 dark:bg-slate-750 p-2 rounded-lg">
                      "{term.description}"
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectTermId(term.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {isSelected ? 'Currently Selected' : 'Select Term'}
                  </button>

                  <div className="flex items-center gap-1">
                    {hasPermission('examination', 'edit') && (
                      <button
                        onClick={() => openEditModal(term)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        title="Edit Term"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {hasPermission('examination', 'delete') && (
                      <button
                        onClick={() => handleDelete(term)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        title="Delete Term"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create/Edit Term */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {editingTerm ? 'Edit Examination Term' : 'Create Examination Term'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Examination Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Half Yearly Examination 2026"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  বাংলা নাম (Bengali Name)
                </label>
                <input
                  type="text"
                  placeholder="e.g. অর্ধ-বার্ষিক পরীক্ষা ২০২৬"
                  value={formData.bengaliName}
                  onChange={(e) => setFormData({ ...formData, bengaliName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Term Category
                  </label>
                  <select
                    value={formData.termType}
                    onChange={(e) =>
                      setFormData({ ...formData, termType: e.target.value as ExamTermType })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="half_yearly">Half Yearly / 1st Term</option>
                    <option value="final">Final / Annual</option>
                    <option value="pre_test">Pre-Test (SSC/HSC)</option>
                    <option value="test">Test Exam</option>
                    <option value="model_test">Model Test</option>
                    <option value="class_test">Class Test / Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as ExamTerm['status'] })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">In Progress / Ongoing</option>
                    <option value="completed">Completed (Mark Entry)</option>
                    <option value="published">Published (Results Out)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Weightage (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.weightPercentage}
                    onChange={(e) =>
                      setFormData({ ...formData, weightPercentage: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Applicable Classes Selection */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span>Applicable Classes (কোন কোন শ্রেণির পরীক্ষা)</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAllClasses}
                      onChange={(e) => {
                        const isAll = e.target.checked;
                        setFormData({
                          ...formData,
                          isAllClasses: isAll,
                          classIds: isAll ? [] : classes.map((c) => c.id),
                        });
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>All Classes (সকল শ্রেণির জন্য)</span>
                  </label>
                </div>

                {!formData.isAllClasses && (
                  <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-[11px] text-slate-500">
                      Select individual classes this examination applies to:
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {classes.map((cls) => {
                        const isChecked = formData.classIds.includes(cls.id);
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => {
                              const updated = isChecked
                                ? formData.classIds.filter((id) => id !== cls.id)
                                : [...formData.classIds, cls.id];
                              setFormData({
                                ...formData,
                                classIds: updated,
                                isAllClasses: updated.length === 0,
                              });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {cls.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description or Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes, syllabus guidelines, or instructions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                >
                  {editingTerm ? 'Save Changes' : 'Create Term'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
