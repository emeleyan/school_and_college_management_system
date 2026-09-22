import React, { useState, useEffect } from 'react';
import {
  CalendarEventItem,
  CalendarEventType,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { getAll, add, update, remove } from '../../db/indexedDB';
import { SAMPLE_CALENDAR_EVENTS } from '../operations/sampleOperationsData';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Filter,
  Trash2,
  Edit,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Award,
  BookOpen,
  Users,
  Flag,
  Sparkles,
} from 'lucide-react';

export const CalendarManagement: React.FC = () => {
  const { activeInstitute, activeAcademicYear, language, logAudit } = useApp();

  // Active Sub-view
  const [activeView, setActiveView] = useState<'month' | 'year_list'>('month');

  // Database State
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected Month (0 = Jan, 11 = Dec)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventItem | null>(null);

  // New Event Form State
  const [eventForm, setEventForm] = useState<Partial<CalendarEventItem>>({
    title: '',
    bengaliTitle: '',
    eventType: 'government_holiday',
    startDate: '2026-03-26',
    endDate: '2026-03-26',
    isGovernmentHoliday: true,
    description: '',
    targetAudience: 'all',
    colorTag: 'bg-rose-500',
  });

  // Load from IndexedDB with fallback seeding
  const loadData = async () => {
    setIsLoading(true);
    try {
      const eventList = await getAll<CalendarEventItem>('calendarEvents');
      if (!eventList || eventList.length === 0) {
        for (const ev of SAMPLE_CALENDAR_EVENTS) {
          await add('calendarEvents', ev);
        }
        setEvents(SAMPLE_CALENDAR_EVENTS);
      } else {
        setEvents(eventList);
      }
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeInstitute?.id]);

  // Handle Save Event
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.startDate) return;

    try {
      const start = new Date(eventForm.startDate);
      const end = eventForm.endDate ? new Date(eventForm.endDate) : start;
      const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      if (editingEvent) {
        const updated: CalendarEventItem = {
          ...editingEvent,
          ...(eventForm as CalendarEventItem),
          durationDays: duration,
          updatedAt: new Date().toISOString(),
        };
        await update('calendarEvents', updated);
        logAudit('Update Event', 'operations' as any, `Updated calendar event ${updated.title}`, updated.id);
        setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
      } else {
        const newEv: CalendarEventItem = {
          id: `cal-${Date.now()}`,
          instituteId: activeInstitute?.id || 'inst-01',
          academicYearId: activeAcademicYear?.id || 'ay-2026',
          title: eventForm.title || '',
          bengaliTitle: eventForm.bengaliTitle,
          eventType: (eventForm.eventType as CalendarEventType) || 'general',
          startDate: eventForm.startDate,
          endDate: eventForm.endDate || eventForm.startDate,
          durationDays: duration,
          isGovernmentHoliday: !!eventForm.isGovernmentHoliday,
          description: eventForm.description,
          targetAudience: eventForm.targetAudience || 'all',
          colorTag: eventForm.colorTag || 'bg-indigo-600',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await add('calendarEvents', newEv);
        logAudit('Add Calendar Event', 'operations' as any, `Added calendar event ${newEv.title}`, newEv.id);
        setEvents((prev) => [newEv, ...prev]);
      }

      setIsAddModalOpen(false);
      setEditingEvent(null);
    } catch (err) {
      console.error('Failed to save calendar event:', err);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from the calendar?`)) return;
    try {
      await remove('calendarEvents', eventId);
      logAudit('Delete Event', 'operations' as any, `Deleted calendar event ${title}`, eventId);
      setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  // Event Type Labels & Icons
  const getEventTypeMeta = (type: CalendarEventType) => {
    const map: Record<CalendarEventType, { en: string; bn: string; color: string; badgeColor: string }> = {
      government_holiday: { en: 'Government Holiday', bn: 'সরকারি ছুটি', color: 'bg-rose-500', badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
      national_observance: { en: 'National Observance', bn: 'জাতীয় দিবস', color: 'bg-red-600', badgeColor: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' },
      academic_exam: { en: 'Examination Period', bn: 'পরীক্ষা সময়সূচি', color: 'bg-purple-600', badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
      vacation: { en: 'Institutional Recess', bn: 'অবকাশ ও ছুটি', color: 'bg-teal-600', badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300' },
      cultural_event: { en: 'Cultural Festival', bn: 'সাংস্কৃতিক অনুষ্ঠান', color: 'bg-amber-500', badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
      sports_competition: { en: 'Sports Meet', bn: 'ক্রীড়া ও প্রতিযোগিতা', color: 'bg-indigo-600', badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' },
      meeting_ptm: { en: 'PTM / Conference', bn: 'অভিভাবক সমাবেশ', color: 'bg-blue-600', badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
      general: { en: 'Campus Event', bn: 'সাধারণ অনুষ্ঠান', color: 'bg-slate-600', badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
    };
    return map[type] || { en: type, bn: type, color: 'bg-slate-600', badgeColor: 'bg-slate-100 text-slate-800' };
  };

  const months = [
    { num: 0, en: 'January', bn: 'জানুয়ারি' },
    { num: 1, en: 'February', bn: 'ফেব্রুয়ারি' },
    { num: 2, en: 'March', bn: 'মার্চ' },
    { num: 3, en: 'April', bn: 'এপ্রিল' },
    { num: 4, en: 'May', bn: 'মে' },
    { num: 5, en: 'June', bn: 'জুন' },
    { num: 6, en: 'July', bn: 'জুলাই' },
    { num: 7, en: 'August', bn: 'আগস্ট' },
    { num: 8, en: 'September', bn: 'সেপ্টেম্বর' },
    { num: 9, en: 'October', bn: 'অক্টোবর' },
    { num: 10, en: 'November', bn: 'নভেম্বর' },
    { num: 11, en: 'December', bn: 'ডিসেম্বর' },
  ];

  // Events filtered by month in Month View
  const eventsInSelectedMonth = events.filter((ev) => {
    const sDate = new Date(ev.startDate);
    const eDate = new Date(ev.endDate);
    const sMonth = sDate.getMonth();
    const eMonth = eDate.getMonth();
    return sMonth === selectedMonth || eMonth === selectedMonth;
  });

  // KPIs
  const totalEvents = events.length;
  const govtHolidaysCount = events
    .filter((e) => e.isGovernmentHoliday)
    .reduce((acc, e) => acc + (e.durationDays || 1), 0);
  const examDaysCount = events
    .filter((e) => e.eventType === 'academic_exam')
    .reduce((acc, e) => acc + (e.durationDays || 1), 0);
  const vacationDaysCount = events
    .filter((e) => e.eventType === 'vacation')
    .reduce((acc, e) => acc + (e.durationDays || 1), 0);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-purple-600" />
              <span>
                {language === 'bn' ? 'শিক্ষাবর্ষ ক্যালেন্ডার ও ছুটির তালিকা' : 'Academic Calendar & Holidays (2026)'}
              </span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
              Phase 12 • Gazetted Calendar
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn'
              ? 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের গেজেটেড ছুটি, জাতীয় দিবস, পরীক্ষা সময়কাল, অবকাশ ও প্রাতিষ্ঠানিক অনুষ্ঠানসূচি'
              : 'Government gazetted holidays, national observances, mid-term & final examinations, vacations, and institutional events'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingEvent(null);
              setEventForm({
                title: '',
                bengaliTitle: '',
                eventType: 'government_holiday',
                startDate: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-15`,
                endDate: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-15`,
                isGovernmentHoliday: true,
                description: '',
                targetAudience: 'all',
                colorTag: 'bg-rose-500',
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন ইভেন্ট / ছুটি' : 'Add Event / Holiday'}</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
            <CalendarIcon className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'মোট ইভেন্ট' : 'Total Events'}
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{totalEvents}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">2026 Academic Year</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
            <Flag className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'সরকারি ছুটি' : 'Govt Holidays'}
            </span>
          </div>
          <div className="text-xl font-bold text-rose-600">{govtHolidaysCount} Days</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Gazetted official days</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'পরীক্ষা দিবস' : 'Exam Schedule'}
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{examDaysCount} Days</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Evaluation & Terms</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 mb-1">
            <Sun className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'ছুটি ও অবকাশ' : 'Vacations'}
            </span>
          </div>
          <div className="text-xl font-bold text-teal-600">{vacationDaysCount} Days</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Eid & Winter recess</div>
        </div>
      </div>

      {/* VIEW SWITCHER & MONTH SELECTOR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Month Selector Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {months.map((m) => (
            <button
              key={m.num}
              onClick={() => setSelectedMonth(m.num)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                selectedMonth === m.num
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {language === 'bn' ? m.bn : m.en.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setActiveView('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              activeView === 'month'
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                : 'text-slate-500'
            }`}
          >
            Month View
          </button>
          <button
            onClick={() => setActiveView('year_list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              activeView === 'year_list'
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                : 'text-slate-500'
            }`}
          >
            Year Overview
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. MONTH VIEW */}
      {/* ======================================================== */}
      {activeView === 'month' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{months[selectedMonth].en} 2026</span>
              <span className="text-slate-400 font-serif font-normal">
                ({months[selectedMonth].bn})
              </span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {eventsInSelectedMonth.length} scheduled event(s)
            </span>
          </div>

          {eventsInSelectedMonth.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
              <CalendarIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No holidays or events scheduled in {months[selectedMonth].en} 2026
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click "+ Add Event / Holiday" above to add calendar entries for this month.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {eventsInSelectedMonth.map((ev) => {
                const typeMeta = getEventTypeMeta(ev.eventType);
                return (
                  <div
                    key={ev.id}
                    className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-800 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${typeMeta.badgeColor}`}>
                          {typeMeta.en}
                        </span>

                        {ev.isGovernmentHoliday && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                            সরকারি ছুটি
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {ev.title}
                      </h3>

                      {ev.bengaliTitle && (
                        <h4 className="text-xs text-slate-500 font-serif mt-0.5">
                          {ev.bengaliTitle}
                        </h4>
                      )}

                      {ev.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                          {ev.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-purple-700 dark:text-purple-300 font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {ev.startDate === ev.endDate ? ev.startDate : `${ev.startDate} to ${ev.endDate}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({ev.durationDays} day{ev.durationDays > 1 ? 's' : ''})
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingEvent(ev);
                            setEventForm(ev);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(ev.id, ev.title)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. YEAR OVERVIEW TABLE */}
      {/* ======================================================== */}
      {activeView === 'year_list' && (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Event / Holiday Name</th>
                  <th className="px-4 py-3">বাংলা নাম</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">End Date</th>
                  <th className="px-4 py-3 text-center">Duration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {events
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map((ev) => {
                    const typeMeta = getEventTypeMeta(ev.eventType);
                    return (
                      <tr key={ev.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {ev.title}
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-serif">
                          {ev.bengaliTitle || '—'}
                        </td>

                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${typeMeta.badgeColor}`}>
                            {typeMeta.en}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                          {ev.startDate}
                        </td>

                        <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                          {ev.endDate}
                        </td>

                        <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white font-mono">
                          {ev.durationDays} {ev.durationDays === 1 ? 'day' : 'days'}
                        </td>

                        <td className="px-4 py-3">
                          {ev.isGovernmentHoliday ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              Govt Gazetted
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Institutional</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingEvent(ev);
                                setEventForm(ev);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(ev.id, ev.title)}
                              className="p-1 text-slate-400 hover:text-rose-600"
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
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT CALENDAR EVENT */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-purple-600" />
                <span>{editingEvent ? 'Edit Calendar Event' : 'Add Academic Event / Holiday'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Event Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    placeholder="e.g. Independence & National Day"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ইভেন্টের নাম (বাংলা)
                  </label>
                  <input
                    type="text"
                    value={eventForm.bengaliTitle}
                    onChange={(e) => setEventForm({ ...eventForm, bengaliTitle: e.target.value })}
                    placeholder="স্বাধীনতা ও জাতীয় দিবস"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-serif"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Category
                </label>
                <select
                  value={eventForm.eventType}
                  onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="government_holiday">Government Holiday (সরকারি ছুটি)</option>
                  <option value="national_observance">National Observance (জাতীয় দিবস)</option>
                  <option value="academic_exam">Academic Examination (পরীক্ষা)</option>
                  <option value="vacation">Vacation / Recess (অবকাশ)</option>
                  <option value="cultural_event">Cultural Event (সাংস্কৃতিক)</option>
                  <option value="sports_competition">Sports Meet (ক্রীড়া)</option>
                  <option value="meeting_ptm">Parents Meeting / PTM</option>
                  <option value="general">General Event</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Remarks
                </label>
                <textarea
                  rows={2}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Details about program, march-past, or holiday notice"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isGovtHoliday"
                  checked={eventForm.isGovernmentHoliday}
                  onChange={(e) => setEventForm({ ...eventForm, isGovernmentHoliday: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                />
                <label htmlFor="isGovtHoliday" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Government Gazetted Holiday (সরকারি গেজেটেড ছুটি)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {editingEvent ? 'Update Event' : 'Save to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
