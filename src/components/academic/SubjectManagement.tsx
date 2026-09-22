import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AcademicClass, AcademicGroup, AcademicSubject, SubjectType } from '../../types';
import { getAll, add, update, remove } from '../../db/indexedDB';
import { MasterSubjectAssignModal } from './MasterSubjectAssignModal';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Save,
  X,
  AlertCircle,
  FileSpreadsheet,
  Award,
  Layers,
} from 'lucide-react';

export const SubjectManagement: React.FC = () => {
  const { activeInstitute, language, logAudit } = useApp();
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showMasterAssignModal, setShowMasterAssignModal] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<AcademicSubject | null>(null);

  const [formData, setFormData] = useState({
    classId: '',
    groupId: '',
    name: '',
    bengaliName: '',
    code: '',
    type: 'compulsory' as SubjectType,
    fullMarks: 100,
    theoryMarks: 70,
    mcqMarks: 30,
    practicalMarks: 0,
    passMarks: 33,
    hasPractical: false,
    status: 'active' as 'active' | 'inactive',
  });

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const fetchData = async () => {
    if (!activeInstitute) return;
    setLoading(true);
    try {
      const [allSubjects, allClasses, allGroups] = await Promise.all([
        getAll<AcademicSubject>('subjects'),
        getAll<AcademicClass>('classes'),
        getAll<AcademicGroup>('groups'),
      ]);

      const instClasses = allClasses
        .filter((c) => c.instituteId === activeInstitute.id)
        .sort((a, b) => a.numericLevel - b.numericLevel);
      const instSubjects = allSubjects.filter((s) => s.instituteId === activeInstitute.id);
      const instGroups = allGroups.filter((g) => g.instituteId === activeInstitute.id);

      setClasses(instClasses);
      setSubjects(instSubjects);
      setGroups(instGroups);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeInstitute]);

  const openAddModal = () => {
    setEditingSubject(null);
    setFormData({
      classId: classes[0]?.id || '',
      groupId: '',
      name: '',
      bengaliName: '',
      code: '101',
      type: 'compulsory',
      fullMarks: 100,
      theoryMarks: 70,
      mcqMarks: 30,
      practicalMarks: 0,
      passMarks: 33,
      hasPractical: false,
      status: 'active',
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (subj: AcademicSubject) => {
    setEditingSubject(subj);
    setFormData({
      classId: subj.classId,
      groupId: subj.groupId || '',
      name: subj.name,
      bengaliName: subj.bengaliName,
      code: subj.code,
      type: subj.type,
      fullMarks: subj.fullMarks,
      theoryMarks: subj.theoryMarks,
      mcqMarks: subj.mcqMarks,
      practicalMarks: subj.practicalMarks,
      passMarks: subj.passMarks,
      hasPractical: subj.hasPractical,
      status: subj.status,
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handlePracticalToggle = (hasPrac: boolean) => {
    if (hasPrac) {
      setFormData({
        ...formData,
        hasPractical: true,
        theoryMarks: 50,
        mcqMarks: 25,
        practicalMarks: 25,
        fullMarks: 100,
      });
    } else {
      setFormData({
        ...formData,
        hasPractical: false,
        theoryMarks: 70,
        mcqMarks: 30,
        practicalMarks: 0,
        fullMarks: 100,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute) return;
    if (!formData.name.trim()) {
      setErrorMsg('Subject name is required.');
      return;
    }
    if (!formData.classId) {
      setErrorMsg('Please select a class for this subject.');
      return;
    }

    const calculatedTotal =
      Number(formData.theoryMarks) +
      Number(formData.mcqMarks) +
      Number(formData.practicalMarks);

    if (calculatedTotal !== Number(formData.fullMarks)) {
      setErrorMsg(
        `Total components (${calculatedTotal}) must match Full Marks (${formData.fullMarks}). Theory: ${formData.theoryMarks} + MCQ: ${formData.mcqMarks} + Practical: ${formData.practicalMarks} = ${calculatedTotal}`
      );
      return;
    }

    try {
      if (editingSubject) {
        const updated: AcademicSubject = {
          ...editingSubject,
          classId: formData.classId,
          groupId: formData.groupId || undefined,
          name: formData.name.trim(),
          bengaliName: formData.bengaliName.trim() || formData.name.trim(),
          code: formData.code.trim(),
          type: formData.type,
          fullMarks: Number(formData.fullMarks),
          theoryMarks: Number(formData.theoryMarks),
          mcqMarks: Number(formData.mcqMarks),
          practicalMarks: Number(formData.practicalMarks),
          passMarks: Number(formData.passMarks),
          hasPractical: formData.hasPractical,
          status: formData.status,
          updatedAt: new Date().toISOString(),
        };
        await update('subjects', updated);
        await logAudit(
          'UPDATE_SUBJECT',
          'academic',
          `Updated subject: ${updated.name} (${updated.code})`,
          updated.id
        );
        setSuccessMsg(`Subject "${updated.name}" updated successfully.`);
      } else {
        const newId = `subj_${formData.classId}_${formData.code}_${Date.now()}`;
        const created: AcademicSubject = {
          id: newId,
          instituteId: activeInstitute.id,
          classId: formData.classId,
          groupId: formData.groupId || undefined,
          name: formData.name.trim(),
          bengaliName: formData.bengaliName.trim() || formData.name.trim(),
          code: formData.code.trim(),
          type: formData.type,
          fullMarks: Number(formData.fullMarks),
          theoryMarks: Number(formData.theoryMarks),
          mcqMarks: Number(formData.mcqMarks),
          practicalMarks: Number(formData.practicalMarks),
          passMarks: Number(formData.passMarks),
          hasPractical: formData.hasPractical,
          status: formData.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await add('subjects', created);
        await logAudit(
          'CREATE_SUBJECT',
          'academic',
          `Created subject: ${created.name} (${created.code})`,
          created.id
        );
        setSuccessMsg(`Subject "${created.name}" created successfully.`);
      }

      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      console.error('Error saving subject:', err);
      setErrorMsg(err.message || 'Failed to save subject.');
    }
  };

  const handleDelete = async (subj: AcademicSubject) => {
    if (!activeInstitute) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${subj.name}" (${subj.code})?`
    );
    if (!confirmDelete) return;

    try {
      await remove('subjects', subj.id);
      await logAudit(
        'DELETE_SUBJECT',
        'academic',
        `Deleted subject: ${subj.name}`,
        subj.id
      );
      setSuccessMsg(`Subject "${subj.name}" deleted.`);
      await fetchData();
    } catch (err: any) {
      console.error('Error deleting subject:', err);
      setErrorMsg(err.message || 'Failed to delete subject.');
    }
  };

  const filteredSubjects = subjects.filter((s) => {
    const matchesClass = selectedClassFilter === 'all' || s.classId === selectedClassFilter;
    const matchesType = selectedTypeFilter === 'all' || s.type === selectedTypeFilter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.bengaliName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesType && matchesSearch;
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
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'bn' ? 'বিষয় বা কোড অনুসন্ধান...' : 'Search subjects by name or code...'}
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
            <option value="all">All Classes ({subjects.length} subjects)</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="compulsory">Compulsory (আবশ্যিক)</option>
            <option value="elective">Elective (নৈর্বাচনিক)</option>
            <option value="optional_4th">Optional 4th (৪র্থ বিষয়)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMasterAssignModal(true)}
            disabled={classes.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Choose from master subjects list and map to classes in 1 click"
          >
            <BookOpen className="w-4 h-4" />
            <span>{language === 'bn' ? 'মাস্টার তালিকা থেকে নির্বাচন' : 'Assign from Master List'}</span>
          </button>

          <button
            onClick={openAddModal}
            disabled={classes.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'কাস্টম বিষয় যোগ' : 'Add Subject'}</span>
          </button>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading curriculum subjects...</div>
        ) : filteredSubjects.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {classes.length === 0
                ? 'Please configure Classes first, or use the "Quick Seed Curriculum" button above.'
                : 'No subjects found matching your filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Subject Title</th>
                  <th className="px-4 py-3 font-semibold">বিষয় (বাংলা)</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Marks Distribution (CQ / MCQ / Practical)</th>
                  <th className="px-4 py-3 font-semibold">Pass</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredSubjects.map((subj) => {
                  const parentClass = classes.find((c) => c.id === subj.classId);
                  return (
                    <tr key={subj.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {subj.code}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                        {parentClass?.name || 'All'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {subj.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {subj.bengaliName}
                      </td>
                      <td className="px-4 py-3">
                        {subj.type === 'compulsory' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Compulsory
                          </span>
                        ) : subj.type === 'elective' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Elective
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            4th Subject
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Total: {subj.fullMarks}
                          </span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-600 dark:text-slate-300">
                            CQ: {subj.theoryMarks}
                          </span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-600 dark:text-slate-300">
                            MCQ: {subj.mcqMarks}
                          </span>
                          {subj.hasPractical && (
                            <>
                              <span className="text-slate-400">|</span>
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                Prac: {subj.practicalMarks}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                        {subj.passMarks}
                      </td>
                      <td className="px-4 py-3">
                        {subj.status === 'active' ? (
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
                            onClick={() => openEditModal(subj)}
                            className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            title="Edit Subject"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(subj)}
                            className="p-1 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            title="Delete Subject"
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
                {editingSubject ? 'Edit Subject Details' : 'Add New Subject'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
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
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101 or 174"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Physics 1st Paper"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    বিষয়ের নাম (বাংলা)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: পদার্থবিজ্ঞান ১ম পত্র"
                    value={formData.bengaliName}
                    onChange={(e) => setFormData({ ...formData, bengaliName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as SubjectType })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="compulsory">Compulsory (আবশ্যিক)</option>
                    <option value="elective">Elective (নৈর্বাচনিক)</option>
                    <option value="optional_4th">Optional 4th (৪র্থ বিষয়)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Group / Stream (Optional)
                  </label>
                  <select
                    value={formData.groupId}
                    onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">General / All Groups</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.bengaliName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Practical Checkbox */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.hasPractical}
                    onChange={(e) => handlePracticalToggle(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Includes Practical Examination (ব্যবহারিক পরীক্ষা)
                  </span>
                </label>
                <p className="text-[10px] text-slate-400 ml-6 mt-0.5">
                  Autofills distribution to CQ: 50, MCQ: 25, Practical: 25 (Total: 100).
                </p>
              </div>

              {/* Marks Distribution Grid */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Marks Distribution &amp; Passing Threshold
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Full Marks</label>
                    <input
                      type="number"
                      required
                      value={formData.fullMarks}
                      onChange={(e) =>
                        setFormData({ ...formData, fullMarks: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Theory (CQ)</label>
                    <input
                      type="number"
                      value={formData.theoryMarks}
                      onChange={(e) =>
                        setFormData({ ...formData, theoryMarks: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">MCQ</label>
                    <input
                      type="number"
                      value={formData.mcqMarks}
                      onChange={(e) =>
                        setFormData({ ...formData, mcqMarks: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Practical</label>
                    <input
                      type="number"
                      disabled={!formData.hasPractical}
                      value={formData.practicalMarks}
                      onChange={(e) =>
                        setFormData({ ...formData, practicalMarks: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 px-1">
                  <span className="text-[11px] text-slate-500">
                    Component Sum:{' '}
                    <strong
                      className={
                        Number(formData.theoryMarks) +
                          Number(formData.mcqMarks) +
                          Number(formData.practicalMarks) ===
                        Number(formData.fullMarks)
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }
                    >
                      {Number(formData.theoryMarks) +
                        Number(formData.mcqMarks) +
                        Number(formData.practicalMarks)}
                    </strong>{' '}
                    / {formData.fullMarks}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <label className="text-[11px] text-slate-500">Pass Marks:</label>
                    <input
                      type="number"
                      value={formData.passMarks}
                      onChange={(e) =>
                        setFormData({ ...formData, passMarks: parseInt(e.target.value) || 0 })
                      }
                      className="w-16 px-2 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 text-center"
                    />
                  </div>
                </div>
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
                  <span>{editingSubject ? 'Update Subject' : 'Save Subject'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Master Subject Assignment Modal */}
      {showMasterAssignModal && (
        <MasterSubjectAssignModal
          isOpen={showMasterAssignModal}
          onClose={() => setShowMasterAssignModal(false)}
          classes={classes}
          groups={groups}
          existingSubjects={subjects}
          onAssignmentComplete={fetchData}
          preselectedClassId={selectedClassFilter !== 'all' ? selectedClassFilter : undefined}
        />
      )}
    </div>
  );
};
