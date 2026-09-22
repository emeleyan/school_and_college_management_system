import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  CheckSquare,
  Square,
  Plus,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import { AcademicClass, AcademicGroup, AcademicSubject, MasterSubject, SubjectType } from '../../types';
import { getAll, add, update } from '../../db/indexedDB';
import { useApp } from '../../context/AppContext';

// Standard national curriculum master subjects library (written once!)
export const DEFAULT_MASTER_SUBJECTS: Omit<MasterSubject, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { code: '101', name: 'Bangla 1st Paper', bengaliName: 'বাংলা ১ম পত্র', type: 'compulsory', defaultType: 'compulsory', fullMarks: 100, theoryMarks: 70, mcqMarks: 30, practicalMarks: 0, hasPractical: false, category: 'general', passMarks: 33, status: 'active', instituteId: '' },
  { code: '102', name: 'Bangla 2nd Paper', bengaliName: 'বাংলা ২য় পত্র', type: 'compulsory', defaultType: 'compulsory', fullMarks: 100, theoryMarks: 70, mcqMarks: 30, practicalMarks: 0, hasPractical: false, category: 'general', passMarks: 33, status: 'active', instituteId: '' },
  { code: '107', name: 'English 1st Paper', bengaliName: 'ইংরেজি ১ম পত্র', type: 'compulsory', defaultType: 'compulsory', fullMarks: 100, theoryMarks: 100, mcqMarks: 0, practicalMarks: 0, hasPractical: false, category: 'general', passMarks: 33, status: 'active', instituteId: '' },
  { code: '108', name: 'English 2nd Paper', bengaliName: 'ইংরেজি ২য় পত্র', type: 'compulsory', defaultType: 'compulsory', fullMarks: 100, theoryMarks: 100, mcqMarks: 0, practicalMarks: 0, hasPractical: false, category: 'general', passMarks: 33, status: 'active', instituteId: '' },
  { code: '109', name: 'Mathematics', bengaliName: 'গণিত', type: 'compulsory', defaultType: 'compulsory', fullMarks: 100, theoryMarks: 70, mcqMarks: 30, practicalMarks: 0, hasPractical: false, category: 'general', passMarks: 33, status: 'active', instituteId: '' },
  { code: '127', name: 'General Science', bengaliName: 'সাধারণ বিজ্ঞান', type: 'compulsory', defaultType: 'compulsory', fullMarks: 100, theoryMarks: 70, mcqMarks: 30, practicalMarks: 0, hasPractical: false, category: 'general', passMarks: 33, status: 'active', instituteId: '' },
  { code: '150', name: 'Bangladesh & Global Studies', bengaliName: 'বাংলাদেশ ও বিশ্বপরিচয়', type: 'compulsory', defaultType: 'compulsory', fullMarks: 100, theoryMarks: 70, mcqMarks: 30, practicalMarks: 0, hasPractical: false, category: 'general', passMarks: 33, status: 'active', instituteId: '' },
  { code: '154', name: 'Information & Comm. Technology', bengaliName: 'তথ্য ও যোগাযোগ প্রযুক্তি', type: 'compulsory', defaultType: 'compulsory', fullMarks: 50, theoryMarks: 25, mcqMarks: 25, practicalMarks: 0, hasPractical: false, category: 'general', passMarks: 17, status: 'active', instituteId: '' },
  { code: '111', name: 'Islam & Moral Education', bengaliName: 'ইসলাম ও নৈতিক শিক্ষা', type: 'compulsory', defaultType: 'compulsory', fullMarks: 100, theoryMarks: 70, mcqMarks: 30, practicalMarks: 0, hasPractical: false, category: 'religion', passMarks: 33, status: 'active', instituteId: '' },
  { code: '112', name: 'Hindu Religion & Moral Education', bengaliName: 'হিন্দুধর্ম ও নৈতিক শিক্ষা', type: 'elective', defaultType: 'elective', fullMarks: 100, theoryMarks: 70, mcqMarks: 30, practicalMarks: 0, hasPractical: false, category: 'religion', passMarks: 33, status: 'active', instituteId: '' },
  { code: '136', name: 'Physics', bengaliName: 'পদার্থবিজ্ঞান', type: 'compulsory', defaultType: 'compulsory', fullMarks: 100, theoryMarks: 50, mcqMarks: 25, practicalMarks: 25, hasPractical: true, category: 'science', passMarks: 33, status: 'active', instituteId: '' },
  { code: '137', name: 'Chemistry', bengaliName: 'রসায়ন', type: 'compulsory', defaultType: 'compulsory', fullMarks: 100, theoryMarks: 50, mcqMarks: 25, practicalMarks: 25, hasPractical: true, category: 'science', passMarks: 33, status: 'active', instituteId: '' },
  { code: '138', name: 'Biology', bengaliName: 'জীববিজ্ঞান', type: 'compulsory', defaultType: 'compulsory', fullMarks: 100, theoryMarks: 50, mcqMarks: 25, practicalMarks: 25, hasPractical: true, category: 'science', passMarks: 33, status: 'active', instituteId: '' },
  { code: '126', name: 'Higher Mathematics', bengaliName: 'উচ্চতর গণিত', type: 'optional_4th', defaultType: 'optional_4th', fullMarks: 100, theoryMarks: 50, mcqMarks: 25, practicalMarks: 25, hasPractical: true, category: 'science', passMarks: 33, status: 'active', instituteId: '' },
  { code: '146', name: 'Accounting', bengaliName: 'হিসাববিজ্ঞান', type: 'compulsory', defaultType: 'compulsory', fullMarks: 100, theoryMarks: 70, mcqMarks: 30, practicalMarks: 0, hasPractical: false, category: 'commerce', passMarks: 33, status: 'active', instituteId: '' },
  { code: '147', name: 'Business Organization & Mgmt', bengaliName: 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা', type: 'compulsory', defaultType: 'compulsory', fullMarks: 100, theoryMarks: 70, mcqMarks: 30, practicalMarks: 0, hasPractical: false, category: 'commerce', passMarks: 33, status: 'active', instituteId: '' },
  { code: '148', name: 'Finance, Banking & Insurance', bengaliName: 'ফিন্যান্স ও ব্যাংকিং', type: 'elective', defaultType: 'elective', fullMarks: 100, theoryMarks: 70, mcqMarks: 30, practicalMarks: 0, hasPractical: false, category: 'commerce', passMarks: 33, status: 'active', instituteId: '' },
  { code: '141', name: 'Economics', bengaliName: 'অর্থনীতি', type: 'elective', defaultType: 'elective', fullMarks: 100, theoryMarks: 70, mcqMarks: 30, practicalMarks: 0, hasPractical: false, category: 'humanities', passMarks: 33, status: 'active', instituteId: '' },
  { code: '131', name: 'Civics & Citizenship', bengaliName: 'পৌরনীতি ও নাগরিকতা', type: 'elective', defaultType: 'elective', fullMarks: 100, theoryMarks: 70, mcqMarks: 30, practicalMarks: 0, hasPractical: false, category: 'humanities', passMarks: 33, status: 'active', instituteId: '' },
  { code: '130', name: 'Geography & Environment', bengaliName: 'ভূগোল ও পরিবেশ', type: 'elective', defaultType: 'elective', fullMarks: 100, theoryMarks: 70, mcqMarks: 30, practicalMarks: 0, hasPractical: false, category: 'humanities', passMarks: 33, status: 'active', instituteId: '' },
  { code: '134', name: 'Agriculture Studies', bengaliName: 'কৃষি শিক্ষা', type: 'optional_4th', defaultType: 'optional_4th', fullMarks: 100, theoryMarks: 50, mcqMarks: 25, practicalMarks: 25, hasPractical: true, category: 'vocational', passMarks: 33, status: 'active', instituteId: '' },
  { code: '153', name: 'Physical Education & Health', bengaliName: 'শারীরিক শিক্ষা ও স্বাস্থ্য', type: 'compulsory', defaultType: 'compulsory', fullMarks: 50, theoryMarks: 20, mcqMarks: 0, practicalMarks: 30, hasPractical: true, category: 'general', passMarks: 17, status: 'active', instituteId: '' },
];

export interface MasterSubjectAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: AcademicClass[];
  groups: AcademicGroup[];
  existingSubjects: AcademicSubject[];
  onAssignmentComplete: () => Promise<void>;
  preselectedClassId?: string;
}

export const MasterSubjectAssignModal: React.FC<MasterSubjectAssignModalProps> = ({
  isOpen,
  onClose,
  classes,
  groups,
  existingSubjects,
  onAssignmentComplete,
  preselectedClassId,
}) => {
  const { activeInstitute, logAudit } = useApp();

  const [masterSubjects, setMasterSubjects] = useState<MasterSubject[]>([]);
  const [targetClassIds, setTargetClassIds] = useState<string[]>(
    preselectedClassId ? [preselectedClassId] : classes[0]?.id ? [classes[0].id] : []
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedMasterIds, setSelectedMasterIds] = useState<string[]>([]);
  const [subjectTypesMap, setSubjectTypesMap] = useState<Record<string, SubjectType>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showAddNewMaster, setShowAddNewMaster] = useState<boolean>(false);

  // New master subject form
  const [newMaster, setNewMaster] = useState({
    code: '',
    name: '',
    bengaliName: '',
    defaultType: 'compulsory' as SubjectType,
    fullMarks: 100,
    theoryMarks: 70,
    mcqMarks: 30,
    practicalMarks: 0,
    hasPractical: false,
    category: 'general',
  });

  // Load master subjects from indexedDB or seed defaults
  const loadMasterSubjects = async () => {
    try {
      let stored = await getAll<MasterSubject>('masterSubjects');
      if (stored.length === 0) {
        // Seed default library
        const seeded: MasterSubject[] = [];
        for (const def of DEFAULT_MASTER_SUBJECTS) {
          const item: MasterSubject = {
            ...def,
            id: `mst_${def.code}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await add('masterSubjects', item);
          seeded.push(item);
        }
        stored = seeded;
      }
      setMasterSubjects(stored);

      // Pre-select default compulsory subjects
      const defaultSelected = stored
        .filter((s) => s.category === 'general' || s.defaultType === 'compulsory')
        .map((s) => s.id);
      setSelectedMasterIds(defaultSelected);

      const typeMap: Record<string, SubjectType> = {};
      stored.forEach((s) => {
        typeMap[s.id] = (s.defaultType as SubjectType) || s.type || 'compulsory';
      });
      setSubjectTypesMap(typeMap);
    } catch (err) {
      console.error('Error loading master subjects:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMasterSubjects();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleTargetClass = (classId: string) => {
    setTargetClassIds((prev) =>
      prev.includes(classId)
        ? prev.length > 1
          ? prev.filter((id) => id !== classId)
          : prev
        : [...prev, classId]
    );
  };

  const toggleMasterSelection = (id: string) => {
    setSelectedMasterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredMasterSubjects.map((s) => s.id);
    const allSelected = filteredIds.every((id) => selectedMasterIds.includes(id));
    if (allSelected) {
      setSelectedMasterIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedMasterIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleSaveNewMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaster.name.trim() || !newMaster.code.trim()) {
      alert('Subject Name and Subject Code are required.');
      return;
    }

    try {
      const item: MasterSubject = {
        id: `mst_${newMaster.code}_${Date.now()}`,
        instituteId: activeInstitute?.id || '',
        code: newMaster.code.trim(),
        name: newMaster.name.trim(),
        bengaliName: newMaster.bengaliName.trim() || newMaster.name.trim(),
        type: (newMaster.defaultType as SubjectType) || 'compulsory',
        defaultType: newMaster.defaultType,
        fullMarks: Number(newMaster.fullMarks),
        theoryMarks: Number(newMaster.theoryMarks),
        mcqMarks: Number(newMaster.mcqMarks),
        practicalMarks: Number(newMaster.practicalMarks),
        passMarks: 33,
        status: 'active',
        hasPractical: newMaster.hasPractical,
        category: newMaster.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await add('masterSubjects', item);
      setMasterSubjects((prev) => [...prev, item]);
      setSelectedMasterIds((prev) => [...prev, item.id]);
      setSubjectTypesMap((prev) => ({
        ...prev,
        [item.id]: (item.defaultType as SubjectType) || 'compulsory',
      }));

      setShowAddNewMaster(false);
      setNewMaster({
        code: '',
        name: '',
        bengaliName: '',
        defaultType: 'compulsory',
        fullMarks: 100,
        theoryMarks: 70,
        mcqMarks: 30,
        practicalMarks: 0,
        hasPractical: false,
        category: 'general',
      });
    } catch (err) {
      console.error('Error adding master subject:', err);
    }
  };

  const handleExecuteAssignment = async () => {
    if (!activeInstitute || targetClassIds.length === 0 || selectedMasterIds.length === 0) {
      alert('Please select at least one class and at least one subject.');
      return;
    }

    setIsSubmitting(true);
    try {
      let createdCount = 0;
      let updatedCount = 0;

      for (const classId of targetClassIds) {
        for (const masterId of selectedMasterIds) {
          const master = masterSubjects.find((m) => m.id === masterId);
          if (!master) continue;

          const chosenType: SubjectType = (subjectTypesMap[master.id] || master.defaultType) as SubjectType;

          // Check if already assigned to this class
          const existing = existingSubjects.find(
            (s) => s.classId === classId && (s.code === master.code || s.name.toLowerCase() === master.name.toLowerCase())
          );

          if (existing) {
            const updated: AcademicSubject = {
              ...existing,
              name: master.name,
              bengaliName: master.bengaliName,
              code: master.code,
              type: chosenType,
              groupId: selectedGroupId || existing.groupId,
              fullMarks: master.fullMarks,
              theoryMarks: master.theoryMarks,
              mcqMarks: master.mcqMarks,
              practicalMarks: master.practicalMarks,
              passMarks: Math.ceil(master.fullMarks * 0.33),
              hasPractical: master.hasPractical,
              updatedAt: new Date().toISOString(),
            };
            await update('subjects', updated);
            updatedCount++;
          } else {
            const newSubj: AcademicSubject = {
              id: `subj_${classId}_${master.code}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
              instituteId: activeInstitute.id,
              classId,
              groupId: selectedGroupId || undefined,
              name: master.name,
              bengaliName: master.bengaliName,
              code: master.code,
              type: chosenType,
              fullMarks: master.fullMarks,
              theoryMarks: master.theoryMarks,
              mcqMarks: master.mcqMarks,
              practicalMarks: master.practicalMarks,
              passMarks: Math.ceil(master.fullMarks * 0.33),
              hasPractical: master.hasPractical,
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await add('subjects', newSubj);
            createdCount++;
          }
        }
      }

      await logAudit(
        'ASSIGN_MASTER_SUBJECTS',
        'academic',
        `Assigned ${selectedMasterIds.length} subjects to ${targetClassIds.length} classes (${createdCount} added, ${updatedCount} updated)`
      );

      await onAssignmentComplete();
      onClose();
    } catch (err: any) {
      console.error('Error assigning subjects:', err);
      alert('Failed to assign subjects: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMasterSubjects = masterSubjects.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.bengaliName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.includes(searchQuery);
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Master Subject List &amp; Class-Wise Assignment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Write subjects once, and check which subjects belong to which classes effortlessly.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Step 1: Target Classes Selection */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                <span>Step 1: Select Target Class(es) (কোন কোন ক্লাসে এই বিষয়গুলো প্রযোজ্য)</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Selected: <span className="font-bold text-blue-600">{targetClassIds.length}</span> classes
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {classes.map((c) => {
                const isSelected = targetClassIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleTargetClass(c.id)}
                    className={`px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>

            {/* Optional Group Selector */}
            {groups.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">
                  Department / Group (বিভাগ/শাখা - ঐচ্ছিক):
                </span>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                >
                  <option value="">All Groups / General</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.bengaliName})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Step 2: Master Subjects Selector with Filters */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-500" />
                <span>
                  Step 2: Choose Subjects from Master List ({selectedMasterIds.length} of {masterSubjects.length} selected)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddNewMaster(!showAddNewMaster)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Master Subject</span>
                </button>

                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Toggle Filtered
                </button>
              </div>
            </div>

            {/* Quick Add Master Subject Inline Panel */}
            {showAddNewMaster && (
              <form
                onSubmit={handleSaveNewMaster}
                className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-3"
              >
                <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Define New Master Subject (একবার লিখুন, সব জায়গায় ব্যবহার করুন)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Subject Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 155"
                      value={newMaster.code}
                      onChange={(e) => setNewMaster({ ...newMaster, code: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Name (English) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Statistics"
                      value={newMaster.name}
                      onChange={(e) => setNewMaster({ ...newMaster, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Name (বাংলা)</label>
                    <input
                      type="text"
                      placeholder="e.g. পরিসংখ্যান"
                      value={newMaster.bengaliName}
                      onChange={(e) => setNewMaster({ ...newMaster, bengaliName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Category</label>
                    <select
                      value={newMaster.category}
                      onChange={(e) => setNewMaster({ ...newMaster, category: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    >
                      <option value="general">General (সাধারণ)</option>
                      <option value="science">Science (বিজ্ঞান)</option>
                      <option value="commerce">Commerce (ব্যবসায়)</option>
                      <option value="humanities">Humanities (মানবিক)</option>
                      <option value="religion">Religion (ধর্মীয়)</option>
                      <option value="vocational">Vocational / Others</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Full Marks</label>
                    <input
                      type="number"
                      value={newMaster.fullMarks}
                      onChange={(e) => setNewMaster({ ...newMaster, fullMarks: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Theory Marks</label>
                    <input
                      type="number"
                      value={newMaster.theoryMarks}
                      onChange={(e) => setNewMaster({ ...newMaster, theoryMarks: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">MCQ Marks</label>
                    <input
                      type="number"
                      value={newMaster.mcqMarks}
                      onChange={(e) => setNewMaster({ ...newMaster, mcqMarks: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddNewMaster(false)}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                  >
                    Save to Master Catalog
                  </button>
                </div>
              </form>
            )}

            {/* Filter bar for master list */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search master subjects by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Disciplines</option>
                <option value="general">General (সাধারণ)</option>
                <option value="science">Science (বিজ্ঞান)</option>
                <option value="commerce">Commerce (ব্যবসায়)</option>
                <option value="humanities">Humanities (মানবিক)</option>
                <option value="religion">Religion (ধর্ম)</option>
                <option value="vocational">Vocational</option>
              </select>
            </div>

            {/* Master Subject Checkbox Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5 text-center w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredMasterSubjects.length > 0 &&
                          filteredMasterSubjects.every((s) => selectedMasterIds.includes(s.id))
                        }
                        onChange={handleSelectAllFiltered}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-2.5">Code</th>
                    <th className="p-2.5">Subject Name</th>
                    <th className="p-2.5">Marks Breakdown</th>
                    <th className="p-2.5">Type for This Class</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMasterSubjects.map((subject) => {
                    const isSelected = selectedMasterIds.includes(subject.id);
                    const currentType = subjectTypesMap[subject.id] || subject.defaultType;

                    return (
                      <tr
                        key={subject.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-blue-50/70 dark:bg-blue-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMasterSelection(subject.id)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2.5 font-bold font-mono text-slate-600 dark:text-slate-300">
                          {subject.code}
                        </td>
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{subject.name}</div>
                          <div className="text-[11px] text-slate-400">{subject.bengaliName}</div>
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{subject.fullMarks}</span>{' '}
                          (T:{subject.theoryMarks} M:{subject.mcqMarks}
                          {subject.hasPractical ? ` P:${subject.practicalMarks}` : ''})
                        </td>
                        <td className="p-2.5">
                          <select
                            disabled={!isSelected}
                            value={currentType}
                            onChange={(e) =>
                              setSubjectTypesMap({
                                ...subjectTypesMap,
                                [subject.id]: e.target.value as SubjectType,
                              })
                            }
                            className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] text-slate-800 dark:text-slate-200 disabled:opacity-40"
                          >
                            <option value="compulsory">Compulsory (আবশ্যিক)</option>
                            <option value="elective">Elective (নৈর্বাচনিক)</option>
                            <option value="optional_4th">Optional 4th (৪র্থ বিষয়)</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Applying <span className="font-bold text-blue-600">{selectedMasterIds.length}</span> subjects to{' '}
            <span className="font-bold text-blue-600">{targetClassIds.length}</span> class(es).
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || selectedMasterIds.length === 0 || targetClassIds.length === 0}
              onClick={handleExecuteAssignment}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Applying...' : `Assign ${selectedMasterIds.length} Subjects to Class`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
