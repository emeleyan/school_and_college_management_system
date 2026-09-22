import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Search,
  FileText,
  UserCheck,
  AlertCircle,
  Trash2,
  Check,
  X,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAll, putItem, deleteItem } from '../../db/indexedDB';
import {
  LeaveApplication,
  LeaveType,
  LeaveStatus,
  Student,
  Teacher,
} from '../../types';

export const LeaveManagementTab: React.FC = () => {
  const { activeInstitute, currentUser, logAudit, language } = useApp();

  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | LeaveStatus>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal for new leave
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [applicantType, setApplicantType] = useState<'teacher' | 'staff' | 'student'>('teacher');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [leaveType, setLeaveType] = useState<LeaveType>('casual');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');
  const [emergencyPhone, setEmergencyPhone] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Load Leave Applications, Teachers & Students
  const fetchLeaves = async () => {
    if (!activeInstitute) return;
    setLoading(true);
    try {
      const [allLeaves, allTeachers, allStudents] = await Promise.all([
        getAll<LeaveApplication>('leaveApplications'),
        getAll<Teacher>('teachers'),
        getAll<Student>('students'),
      ]);

      const instLeaves = allLeaves.filter((l) => l.instituteId === activeInstitute.id);
      const instTeachers = allTeachers.filter((t) => t.instituteId === activeInstitute.id);
      const instStudents = allStudents.filter((s) => s.instituteId === activeInstitute.id);

      setLeaves(instLeaves.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()));
      setTeachers(instTeachers);
      setStudents(instStudents);

      if (instTeachers.length > 0 && !selectedPersonId) {
        setSelectedPersonId(instTeachers[0].id);
      }
    } catch (err) {
      console.error('Failed to load leave applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [activeInstitute]);

  // Update selected person when applicantType changes
  useEffect(() => {
    if (applicantType === 'student') {
      if (students.length > 0) setSelectedPersonId(students[0].id);
    } else {
      if (teachers.length > 0) setSelectedPersonId(teachers[0].id);
    }
  }, [applicantType, students, teachers]);

  // Calculate days difference
  const calculatedDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 1;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      const matchType = typeFilter === 'all' || l.leaveType === typeFilter;
      const matchSearch =
        !searchQuery.trim() ||
        l.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.reason.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchType && matchSearch;
    });
  }, [leaves, statusFilter, typeFilter, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = leaves.length;
    const pending = leaves.filter((l) => l.status === 'pending').length;
    const approved = leaves.filter((l) => l.status === 'approved').length;
    const rejected = leaves.filter((l) => l.status === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [leaves]);

  // Submit Leave Application
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute || !selectedPersonId) return;
    setSubmitting(true);

    try {
      let applicantName = '';
      let identifier = '';
      let groupOrDesignation = '';

      if (applicantType === 'student') {
        const stu = students.find((s) => s.id === selectedPersonId);
        if (stu) {
          applicantName = `${stu.firstName} ${stu.lastName}`;
          identifier = `Roll: ${stu.rollNumber}`;
          groupOrDesignation = `Class Roll ${stu.rollNumber}`;
        }
      } else {
        const tch = teachers.find((t) => t.id === selectedPersonId);
        if (tch) {
          applicantName = `${tch.firstName} ${tch.lastName}`;
          identifier = tch.teacherId;
          groupOrDesignation = tch.designation;
        }
      }

      const newLeave: LeaveApplication = {
        id: `leave-${Date.now()}`,
        instituteId: activeInstitute.id,
        applicantType,
        applicantId: selectedPersonId,
        applicantName: applicantName || 'Unknown Applicant',
        identifier: identifier || 'N/A',
        groupOrDesignation: groupOrDesignation || 'General',
        leaveType,
        startDate,
        endDate,
        totalDays: calculatedDays,
        reason,
        emergencyContact: emergencyPhone,
        status: 'pending',
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await putItem('leaveApplications', newLeave);
      await logAudit(
        'apply_leave',
        'attendance',
        `Submitted leave application for ${applicantName} (${calculatedDays} days, ${leaveType})`
      );

      setShowApplyModal(false);
      setReason('');
      fetchLeaves();
    } catch (err) {
      console.error('Failed to submit leave:', err);
      alert('Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  // Status Change Action (Approve / Reject)
  const handleUpdateStatus = async (leave: LeaveApplication, status: LeaveStatus) => {
    try {
      const updated: LeaveApplication = {
        ...leave,
        status,
        reviewedBy: currentUser?.fullName || 'Principal / Admin',
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await putItem('leaveApplications', updated);
      await logAudit(
        'review_leave',
        'attendance',
        `${status === 'approved' ? 'Approved' : 'Rejected'} leave application for ${leave.applicantName}`
      );

      fetchLeaves();
    } catch (err) {
      console.error('Failed to update leave status:', err);
      alert('Failed to update status.');
    }
  };

  const handleDeleteLeave = async (id: string, name: string) => {
    if (!confirm(language === 'bn' ? 'আপনি কি এই আবেদনটি মুছে ফেলতে চান?' : 'Delete this leave application?')) {
      return;
    }
    try {
      await deleteItem('leaveApplications', id);
      await logAudit('delete_leave', 'attendance', `Deleted leave application for ${name}`);
      fetchLeaves();
    } catch (err) {
      console.error('Failed to delete leave:', err);
    }
  };

  const getLeaveTypeBadge = (type: LeaveType) => {
    const labels: Record<LeaveType, { en: string; bn: string }> = {
      casual: { en: 'Casual (CL)', bn: 'নৈমিত্তিক ছুটি' },
      medical: { en: 'Medical (ML)', bn: 'চিকিৎসা ছুটি' },
      maternity: { en: 'Maternity', bn: 'মাতৃত্বকালীন ছুটি' },
      earned: { en: 'Earned Leave', bn: 'অর্জিত ছুটি' },
      duty: { en: 'Duty Leave', bn: 'দাপ্তরিক ছুটি' },
      special: { en: 'Special', bn: 'বিশেষ ছুটি' },
      other: { en: 'Other', bn: 'অন্যান্য' },
    };
    const item = labels[type] || { en: type, bn: type };
    return language === 'bn' ? item.bn : item.en;
  };

  return (
    <div className="space-y-5">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'bn' ? 'মোট আবেদন' : 'Total Applications'}
          </span>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.total}
          </div>
        </div>

        <div className="bg-amber-50/70 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              {language === 'bn' ? 'বিচারাধীন / অপেক্ষমাণ' : 'Pending Approval'}
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-800 dark:text-amber-200">
            {metrics.pending}
          </div>
        </div>

        <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              {language === 'bn' ? 'অনুমোদিত' : 'Approved'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-200">
            {metrics.approved}
          </div>
        </div>

        <div className="bg-rose-50/70 dark:bg-rose-950/40 p-4 rounded-xl border border-rose-200 dark:border-rose-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              {language === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected'}
            </span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-rose-800 dark:text-rose-200">
            {metrics.rejected}
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="inline-flex rounded-lg p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              {language === 'bn' ? 'সকল' : 'All'}
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'text-slate-500 hover:text-amber-600'
              }`}
            >
              {language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-500 hover:text-emerald-600'
              }`}
            >
              {language === 'bn' ? 'অনুমোদিত' : 'Approved'}
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              {language === 'bn' ? 'বাতিল' : 'Rejected'}
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'bn' ? 'আবেদনকারী খুঁজুন...' : 'Search applicant...'}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Apply Leave Button */}
        <button
          onClick={() => setShowApplyModal(true)}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? 'নতুন ছুটির আবেদন' : 'Apply for Leave'}</span>
        </button>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">{language === 'bn' ? 'আবেদনকারী' : 'Applicant'}</th>
                <th className="px-4 py-3">{language === 'bn' ? 'ছুটির ধরণ' : 'Leave Type'}</th>
                <th className="px-4 py-3">{language === 'bn' ? 'তারিখ ও মেয়াদ' : 'Duration'}</th>
                <th className="px-4 py-3">{language === 'bn' ? 'কারণ' : 'Reason / Note'}</th>
                <th className="px-4 py-3 text-center">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="px-4 py-3 text-right">{language === 'bn' ? 'পদক্ষেপ' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading leave applications...'}
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    {language === 'bn' ? 'কোন ছুটির আবেদন পাওয়া যায়নি।' : 'No leave applications recorded.'}
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => {
                  return (
                    <tr key={leave.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors">
                      {/* Applicant */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {leave.applicantName}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="capitalize font-medium text-slate-500">{leave.applicantType}</span>
                          <span>•</span>
                          <span>{leave.groupOrDesignation}</span>
                          <span>•</span>
                          <span className="font-mono">{leave.identifier}</span>
                        </div>
                      </td>

                      {/* Leave Type */}
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {getLeaveTypeBadge(leave.leaveType)}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{leave.startDate} → {leave.endDate}</span>
                        </div>
                        <div className="text-slate-400 mt-0.5 font-semibold text-blue-600">
                          {leave.totalDays} {language === 'bn' ? 'দিন' : 'days'}
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3 text-xs max-w-xs">
                        <div className="text-slate-700 dark:text-slate-300 line-clamp-2">
                          {leave.reason}
                        </div>
                        {leave.emergencyContact && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Phone: {leave.emergencyContact}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {leave.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {language === 'bn' ? 'অনুমোদিত' : 'Approved'}
                          </span>
                        )}
                        {leave.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            {language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}
                          </span>
                        )}
                        {leave.status === 'rejected' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            {language === 'bn' ? 'বাতিল' : 'Rejected'}
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {leave.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(leave, 'approved')}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 cursor-pointer"
                                title="Approve Leave"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(leave, 'rejected')}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900 cursor-pointer"
                                title="Reject Leave"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteLeave(leave.id, leave.applicantName)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Leave Application */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>{language === 'bn' ? 'ছুটির আবেদন ফরম' : 'Leave Application Form'}</span>
              </h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              {/* Applicant Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'আবেদনকারীর ধরণ' : 'Applicant Category'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['teacher', 'staff', 'student'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setApplicantType(cat)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border capitalize transition-all cursor-pointer ${
                        applicantType === cat
                          ? 'bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {cat === 'teacher' ? (language === 'bn' ? 'শিক্ষক' : 'Teacher') : cat === 'staff' ? (language === 'bn' ? 'কর্মী' : 'Staff') : (language === 'bn' ? 'শিক্ষার্থী' : 'Student')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Person */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {applicantType === 'student'
                    ? language === 'bn' ? 'শিক্ষার্থী নির্বাচন করুন' : 'Select Student'
                    : language === 'bn' ? 'শিক্ষক/কর্মী নির্বাচন করুন' : 'Select Faculty/Staff'}
                </label>
                <select
                  value={selectedPersonId}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  {applicantType === 'student' ? (
                    students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} (Roll: {s.rollNumber})
                      </option>
                    ))
                  ) : (
                    teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} ({t.designation}, {t.teacherId})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Leave Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'ছুটির ধরণ' : 'Leave Type'}
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  <option value="casual">{language === 'bn' ? 'নৈমিত্তিক ছুটি (Casual Leave - CL)' : 'Casual Leave (CL)'}</option>
                  <option value="medical">{language === 'bn' ? 'চিকিৎসা ছুটি (Medical / Sick Leave)' : 'Medical / Sick Leave'}</option>
                  <option value="maternity">{language === 'bn' ? 'মাতৃত্বকালীন ছুটি (Maternity Leave)' : 'Maternity Leave'}</option>
                  <option value="earned">{language === 'bn' ? 'অর্জিত ছুটি (Earned Leave)' : 'Earned Leave'}</option>
                  <option value="duty">{language === 'bn' ? 'দাপ্তরিক / ট্রেনিং ছুটি (Duty Leave)' : 'Duty / Official Leave'}</option>
                  <option value="special">{language === 'bn' ? 'বিশেষ ছুটি (Special Leave)' : 'Special Leave'}</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'শুরুর তারিখ' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'শেষের তারিখ' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="text-xs text-blue-600 font-semibold">
                {language === 'bn' ? `মোট ছুটির দিন: ${calculatedDays} দিন` : `Total Duration: ${calculatedDays} day(s)`}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'ছুটির কারণ' : 'Reason for Leave'}
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  placeholder={language === 'bn' ? 'ছুটির বিস্তারিত কারণ লিখুন...' : 'State the reason for leave...'}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'জরুরি যোগাযোগের ফোন নম্বর' : 'Emergency Contact Phone'}
                </label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{submitting ? (language === 'bn' ? 'জমা হচ্ছে...' : 'Submitting...') : (language === 'bn' ? 'আবেদন জমা দিন' : 'Submit Application')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
