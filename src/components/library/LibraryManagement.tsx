import React, { useState, useEffect } from 'react';
import {
  BookItem,
  BookIssueRecord,
  BookCategory,
  Student,
  Teacher,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { getAll, add, update, remove } from '../../db/indexedDB';
import { SAMPLE_BOOKS, SAMPLE_BOOK_ISSUES } from '../operations/sampleOperationsData';
import {
  Library as LibraryIcon,
  BookOpen,
  BookMarked,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Tag,
  Bookmark,
  Users,
  Calendar,
  DollarSign,
  Filter,
  Layers,
  X,
  Printer,
  Sparkles,
  Barcode,
  MapPin,
  Trash2,
  Edit,
} from 'lucide-react';

export const LibraryManagement: React.FC = () => {
  const { activeInstitute, activeAcademicYear, language, logAudit } = useApp();

  // Active Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'circulation' | 'overdue'>('catalog');

  // Database state
  const [books, setBooks] = useState<BookItem[]>([]);
  const [issues, setIssues] = useState<BookIssueRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters (Catalog)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filters (Circulation)
  const [issueSearch, setIssueSearch] = useState<string>('');
  const [issueStatusFilter, setIssueStatusFilter] = useState<string>('all');

  // Modals
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState<boolean>(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(false);
  const [selectedBookForIssue, setSelectedBookForIssue] = useState<BookItem | null>(null);

  // New Book Form State
  const [newBook, setNewBook] = useState<Partial<BookItem>>({
    title: '',
    bengaliTitle: '',
    author: '',
    publisher: '',
    edition: '1st Edition',
    category: 'literature',
    shelfLocation: 'Shelf A-1',
    totalCopies: 5,
    availableCopies: 5,
    price: 300,
    language: 'bn',
    isbn: '',
    status: 'available',
  });

  // Issue Book Form State
  const [issueForm, setIssueForm] = useState({
    borrowerType: 'student' as 'student' | 'teacher',
    borrowerId: '',
    borrowerName: '',
    borrowerRollOrDesignation: '',
    borrowerClass: '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    finePerDay: 2,
    notes: '',
  });

  // Load Data from IndexedDB with fallback seeding
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bookList, issueList, studentList, teacherList] = await Promise.all([
        getAll<BookItem>('books'),
        getAll<BookIssueRecord>('bookIssues'),
        getAll<Student>('students'),
        getAll<Teacher>('teachers'),
      ]);

      if (!bookList || bookList.length === 0) {
        for (const b of SAMPLE_BOOKS) {
          await add('books', b);
        }
        setBooks(SAMPLE_BOOKS);
      } else {
        setBooks(bookList);
      }

      if (!issueList || issueList.length === 0) {
        for (const iss of SAMPLE_BOOK_ISSUES) {
          await add('bookIssues', iss);
        }
        setIssues(SAMPLE_BOOK_ISSUES);
      } else {
        setIssues(issueList);
      }

      setStudents(studentList || []);
      setTeachers(teacherList || []);
    } catch (err) {
      console.error('Error loading library data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeInstitute?.id]);

  // Handle Save / Add Book
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author) return;

    try {
      if (editingBook) {
        const updated: BookItem = {
          ...editingBook,
          ...(newBook as BookItem),
          updatedAt: new Date().toISOString(),
        };
        await update('books', updated);
        logAudit('Update Book', 'operations' as any, `Updated library book ${updated.title}`, updated.id);
        setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      } else {
        const accNumber = `ACC-${new Date().getFullYear()}-${String(books.length + 1).padStart(3, '0')}`;
        const item: BookItem = {
          id: `book-${Date.now()}`,
          instituteId: activeInstitute?.id || 'inst-01',
          accessionNumber: accNumber,
          title: newBook.title || '',
          bengaliTitle: newBook.bengaliTitle,
          author: newBook.author || '',
          publisher: newBook.publisher,
          edition: newBook.edition || '1st Edition',
          category: (newBook.category as BookCategory) || 'general',
          shelfLocation: newBook.shelfLocation || 'Shelf A-1',
          totalCopies: Number(newBook.totalCopies) || 1,
          availableCopies: Number(newBook.totalCopies) || 1,
          price: Number(newBook.price) || 200,
          language: newBook.language || 'bn',
          isbn: newBook.isbn,
          status: 'available',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await add('books', item);
        logAudit('Add Book', 'operations' as any, `Added new book ${item.title} (${item.accessionNumber})`, item.id);
        setBooks((prev) => [item, ...prev]);
      }

      setIsAddBookModalOpen(false);
      setEditingBook(null);
      setNewBook({
        title: '',
        bengaliTitle: '',
        author: '',
        publisher: '',
        edition: '1st Edition',
        category: 'literature',
        shelfLocation: 'Shelf A-1',
        totalCopies: 5,
        availableCopies: 5,
        price: 300,
        language: 'bn',
        isbn: '',
        status: 'available',
      });
    } catch (err) {
      console.error('Failed to save book:', err);
    }
  };

  // Open Issue Modal for a Book
  const handleOpenIssueModal = (book: BookItem) => {
    setSelectedBookForIssue(book);
    setIsIssueModalOpen(true);
    setIssueForm({
      borrowerType: 'student',
      borrowerId: '',
      borrowerName: '',
      borrowerRollOrDesignation: '',
      borrowerClass: '',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      finePerDay: 2,
      notes: '',
    });
  };

  // Handle Borrower Selection
  const handleSelectBorrower = (id: string, type: 'student' | 'teacher') => {
    if (type === 'student') {
      const st = students.find((s) => s.id === id);
      if (st) {
        setIssueForm((prev) => ({
          ...prev,
          borrowerId: st.id,
          borrowerName: `${st.firstName} ${st.lastName}`,
          borrowerRollOrDesignation: `Roll: ${st.rollNumber}`,
          borrowerClass: `Class ${st.classId || '10'}`,
        }));
      }
    } else {
      const tc = teachers.find((t) => t.id === id);
      if (tc) {
        setIssueForm((prev) => ({
          ...prev,
          borrowerId: tc.id,
          borrowerName: `${tc.firstName} ${tc.lastName}`,
          borrowerRollOrDesignation: tc.designation || 'Teacher',
          borrowerClass: 'Staff',
        }));
      }
    }
  };

  // Handle Confirm Issue
  const handleConfirmIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForIssue || !issueForm.borrowerName) return;

    if (selectedBookForIssue.availableCopies <= 0) {
      alert('No copies available in stock to issue!');
      return;
    }

    try {
      const issueRecord: BookIssueRecord = {
        id: `iss-${Date.now()}`,
        instituteId: activeInstitute?.id || 'inst-01',
        academicYearId: activeAcademicYear?.id || 'ay-2026',
        bookId: selectedBookForIssue.id,
        bookTitle: selectedBookForIssue.title,
        accessionNumber: selectedBookForIssue.accessionNumber,
        borrowerType: issueForm.borrowerType,
        borrowerId: issueForm.borrowerId || `BORR-${Date.now().toString().slice(-4)}`,
        borrowerName: issueForm.borrowerName,
        borrowerRollOrDesignation: issueForm.borrowerRollOrDesignation,
        borrowerClass: issueForm.borrowerClass,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: issueForm.dueDate,
        status: 'issued',
        finePerDay: Number(issueForm.finePerDay) || 2,
        notes: issueForm.notes,
        issuedBy: 'Librarian (Admin)',
        createdAt: new Date().toISOString(),
      };

      await add('bookIssues', issueRecord);

      // Decrement available copies
      const updatedBook: BookItem = {
        ...selectedBookForIssue,
        availableCopies: selectedBookForIssue.availableCopies - 1,
        status: selectedBookForIssue.availableCopies - 1 <= 0 ? 'out_of_stock' : 'available',
        updatedAt: new Date().toISOString(),
      };
      await update('books', updatedBook);

      logAudit('Issue Book', 'operations' as any, `Issued ${selectedBookForIssue.title} to ${issueForm.borrowerName}`, issueRecord.id);

      setIssues((prev) => [issueRecord, ...prev]);
      setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
      setIsIssueModalOpen(false);
      setSelectedBookForIssue(null);
    } catch (err) {
      console.error('Error issuing book:', err);
    }
  };

  // Return Book
  const handleReturnBook = async (issueRecord: BookIssueRecord) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(issueRecord.dueDate);
      const returnDate = new Date(today);
      const diffDays = Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const overdue = diffDays > 0 ? diffDays : 0;
      const fineAmount = overdue * (issueRecord.finePerDay || 2);

      const updatedRecord: BookIssueRecord = {
        ...issueRecord,
        status: 'returned',
        returnDate: today,
        overdueDays: overdue,
        fineAmount: fineAmount,
        finePaid: true,
      };

      await update('bookIssues', updatedRecord);

      // Increment available copies for book
      const targetBook = books.find((b) => b.id === issueRecord.bookId);
      if (targetBook) {
        const updatedBook: BookItem = {
          ...targetBook,
          availableCopies: Math.min(targetBook.totalCopies, targetBook.availableCopies + 1),
          status: 'available',
          updatedAt: new Date().toISOString(),
        };
        await update('books', updatedBook);
        setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
      }

      logAudit('Return Book', 'operations' as any, `Returned ${issueRecord.bookTitle} from ${issueRecord.borrowerName}`, issueRecord.id);
      setIssues((prev) => prev.map((i) => (i.id === issueRecord.id ? updatedRecord : i)));
    } catch (err) {
      console.error('Failed to return book:', err);
    }
  };

  // Delete Book
  const handleDeleteBook = async (bookId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" from the library catalog?`)) return;
    try {
      await remove('books', bookId);
      logAudit('Delete Book', 'operations' as any, `Deleted book ${title}`, bookId);
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch (err) {
      console.error('Failed to delete book:', err);
    }
  };

  // Category labels helper
  const getCategoryLabel = (cat: BookCategory) => {
    const map: Record<BookCategory, { en: string; bn: string; color: string }> = {
      textbook: { en: 'Textbook (NCTB)', bn: 'পাঠ্যবই (এনসিটিবি)', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
      literature: { en: 'Literature & Poetry', bn: 'সাহিত্য ও কবিতা', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
      science: { en: 'Science & Physics', bn: 'বিজ্ঞান ও প্রযুক্তি', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
      mathematics: { en: 'Mathematics', bn: 'উচ্চতর গণিত', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
      history_social: { en: 'History & Liberation', bn: 'ইতিহাস ও মুক্তিযুদ্ধ', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
      religion_moral: { en: 'Moral & Religion', bn: 'নৈতিক ও ধর্মীয় শিক্ষা', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300' },
      reference: { en: 'Dictionary & Ref', bn: 'অভিধান ও রেফারেন্স', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
      journal_magazine: { en: 'Periodicals', bn: 'সাময়িকী ও ম্যাগাজিন', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' },
      general: { en: 'General Knowledge', bn: 'সাধারণ জ্ঞান', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    };
    return map[cat] || { en: cat, bn: cat, color: 'bg-slate-100 text-slate-700' };
  };

  // Filtered Catalog
  const filteredBooks = books.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      (b.bengaliTitle && b.bengaliTitle.includes(q)) ||
      b.author.toLowerCase().includes(q) ||
      b.accessionNumber.toLowerCase().includes(q) ||
      (b.isbn && b.isbn.includes(q));

    const matchesCategory = selectedCategory === 'all' || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filtered Issues
  const filteredIssues = issues.filter((iss) => {
    const q = issueSearch.toLowerCase();
    const matchesSearch =
      !q ||
      iss.bookTitle.toLowerCase().includes(q) ||
      iss.borrowerName.toLowerCase().includes(q) ||
      iss.accessionNumber.toLowerCase().includes(q);

    const matchesStatus = issueStatusFilter === 'all' || iss.status === issueStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalTitles = books.length;
  const totalCopies = books.reduce((acc, b) => acc + (b.totalCopies || 0), 0);
  const currentlyIssued = issues.filter((i) => i.status === 'issued' || i.status === 'overdue').length;
  const overdueCount = issues.filter((i) => i.status === 'overdue').length;
  const totalFines = issues.reduce((acc, i) => acc + (i.fineAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <LibraryIcon className="w-6 h-6 text-indigo-600" />
              <span>
                {language === 'bn' ? 'গ্রন্থাগার ও পুস্তক ব্যবস্থাপনা' : 'Library & Book Catalog Management'}
              </span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
              Phase 12 • Smart Circulation
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn'
              ? 'বই ক্যাটালগিং, তাকের অবস্থান, বারকোড ট্র্যাকিং, শিক্ষার্থী ও শিক্ষকদের ইস্যু/ফেরত এবং বিলম্ব ফি ব্যবস্থাপনা'
              : 'Book cataloging, rack allocation, barcode circulation desk, student & teacher loans, and automated overdue fine tracking'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingBook(null);
              setIsAddBookModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন বই ক্যাটালগ' : 'Add New Book'}</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'মোট বইয়ের শিরোনাম' : 'Book Titles'}
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{totalTitles}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{totalCopies} total copies</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <BookMarked className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'বর্তমান মজুদ' : 'In Library'}
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {books.reduce((acc, b) => acc + (b.availableCopies || 0), 0)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ready for issue</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'ইস্যুকৃত বই' : 'On Loan'}
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{currentlyIssued}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Students & Teachers</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Overdue'}
            </span>
          </div>
          <div className="text-xl font-bold text-rose-600">{overdueCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Needs recall alert</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'বিলম্ব জরিমানা' : 'Fines (BDT)'}
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">৳ {totalFines}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Late fee collected</div>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'catalog'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Book Catalog & Stacks ({books.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('circulation')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'circulation'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Issue & Return Desk ({issues.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('overdue')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'overdue'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Overdue Tracking ({overdueCount})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. BOOK CATALOG SUB-TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search books by title, Bengali name, author, accession number, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="all">All Categories</option>
                <option value="textbook">Textbook (NCTB)</option>
                <option value="literature">Literature & Poetry</option>
                <option value="science">Science & Physics</option>
                <option value="mathematics">Mathematics</option>
                <option value="history_social">History & Liberation</option>
                <option value="religion_moral">Moral & Religious</option>
                <option value="reference">Reference & Dictionary</option>
                <option value="general">General Knowledge</option>
              </select>
            </div>
          </div>

          {/* Books Table */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Accession No.</th>
                    <th className="px-4 py-3">Title & Details</th>
                    <th className="px-4 py-3">Author & Publisher</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Shelf Location</th>
                    <th className="px-4 py-3 text-center">Copies</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBooks.map((book) => {
                    const catMeta = getCategoryLabel(book.category);
                    return (
                      <tr key={book.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Barcode className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{book.accessionNumber}</span>
                          </div>
                          {book.isbn && <span className="text-[10px] text-slate-400 font-normal block">{book.isbn}</span>}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {book.title}
                          </div>
                          {book.bengaliTitle && (
                            <div className="text-[11px] text-slate-500 font-serif">
                              {book.bengaliTitle}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 mt-0.5">{book.edition}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {book.author}
                          </div>
                          {book.publisher && (
                            <div className="text-[11px] text-slate-400">
                              {book.publisher}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${catMeta.color}`}>
                            {catMeta.en}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{book.shelfLocation}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              book.availableCopies > 0
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {book.availableCopies} / {book.totalCopies}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          ৳ {book.price || 0}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenIssueModal(book)}
                              disabled={book.availableCopies <= 0}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold rounded-md disabled:opacity-40 cursor-pointer transition-colors"
                              title="Issue book to student or teacher"
                            >
                              Issue
                            </button>
                            <button
                              onClick={() => {
                                setEditingBook(book);
                                setNewBook(book);
                                setIsAddBookModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="Edit book"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBook(book.id, book.title)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                              title="Delete book"
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
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ISSUE & RETURN CIRCULATION DESK */}
      {/* ======================================================== */}
      {(activeSubTab === 'circulation' || activeSubTab === 'overdue') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search issued books by title, borrower name, or accession number..."
                value={issueSearch}
                onChange={(e) => setIssueSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {activeSubTab === 'circulation' && (
              <select
                value={issueStatusFilter}
                onChange={(e) => setIssueStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="all">All Loan Statuses</option>
                <option value="issued">Currently Issued</option>
                <option value="overdue">Overdue Loans</option>
                <option value="returned">Returned History</option>
              </select>
            )}
          </div>

          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Book Title</th>
                    <th className="px-4 py-3">Accession No.</th>
                    <th className="px-4 py-3">Borrower</th>
                    <th className="px-4 py-3">Class / Designation</th>
                    <th className="px-4 py-3">Issue Date</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Late Fine</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredIssues
                    .filter((iss) => (activeSubTab === 'overdue' ? iss.status === 'overdue' : true))
                    .map((iss) => (
                      <tr key={iss.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {iss.bookTitle}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                          {iss.accessionNumber}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {iss.borrowerName}
                          </div>
                          <div className="text-[10px] text-slate-400 capitalize">
                            {iss.borrowerType}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          <div>{iss.borrowerClass || 'General'}</div>
                          {iss.borrowerRollOrDesignation && (
                            <div className="text-[10px] text-slate-400">
                              {iss.borrowerRollOrDesignation}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                          {iss.issueDate}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                          {iss.dueDate}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              iss.status === 'returned'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : iss.status === 'overdue'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {iss.status === 'returned' && <CheckCircle className="w-3 h-3" />}
                            {iss.status === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                            {iss.status === 'issued' && <Clock className="w-3 h-3" />}
                            <span className="capitalize">{iss.status}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {iss.fineAmount ? (
                            <span className="text-rose-600">৳ {iss.fineAmount}</span>
                          ) : (
                            <span className="text-slate-400 font-normal">৳ 0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {iss.status !== 'returned' ? (
                            <button
                              onClick={() => handleReturnBook(iss)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md shadow-xs transition-colors cursor-pointer"
                            >
                              Receive Return
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Returned on {iss.returnDate}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT BOOK */}
      {/* ======================================================== */}
      {isAddBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>{editingBook ? 'Edit Book Catalog Item' : 'Catalog New Book into Library'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddBookModalOpen(false);
                  setEditingBook(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Book Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBook.title}
                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                    placeholder="e.g. Higher Secondary Physics"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    বইয়ের নাম (বাংলা)
                  </label>
                  <input
                    type="text"
                    value={newBook.bengaliTitle}
                    onChange={(e) => setNewBook({ ...newBook, bengaliTitle: e.target.value })}
                    placeholder="উচ্চ মাধ্যমিক পদার্থবিজ্ঞান"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-serif"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Author / লেখক *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBook.author}
                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                    placeholder="e.g. Dr. Shahjahan Tapan"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Publisher / প্রকাশনী
                  </label>
                  <input
                    type="text"
                    value={newBook.publisher}
                    onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
                    placeholder="e.g. Hasan Book House"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newBook.category}
                    onChange={(e) => setNewBook({ ...newBook, category: e.target.value as BookCategory })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="textbook">Textbook (NCTB)</option>
                    <option value="literature">Literature & Poetry</option>
                    <option value="science">Science & Technology</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="history_social">History & Liberation</option>
                    <option value="religion_moral">Moral & Religious</option>
                    <option value="reference">Reference & Dict</option>
                    <option value="general">General Knowledge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Shelf Location
                  </label>
                  <input
                    type="text"
                    value={newBook.shelfLocation}
                    onChange={(e) => setNewBook({ ...newBook, shelfLocation: e.target.value })}
                    placeholder="e.g. Shelf S-02, Rack 1"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ISBN / Barcode
                  </label>
                  <input
                    type="text"
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                    placeholder="978-984-..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Copies in Stacks
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newBook.totalCopies}
                    onChange={(e) => setNewBook({ ...newBook, totalCopies: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Book Price (BDT ৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newBook.price}
                    onChange={(e) => setNewBook({ ...newBook, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddBookModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {editingBook ? 'Update Book' : 'Catalog Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ISSUE BOOK TO STUDENT OR TEACHER */}
      {/* ======================================================== */}
      {isIssueModalOpen && selectedBookForIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Issue Book to Borrower
                </h3>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-xs">
                  {selectedBookForIssue.title} ({selectedBookForIssue.accessionNumber})
                </p>
              </div>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmIssue} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Borrower Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIssueForm((prev) => ({
                        ...prev,
                        borrowerType: 'student',
                        borrowerId: '',
                        borrowerName: '',
                        borrowerRollOrDesignation: '',
                        borrowerClass: '',
                      }));
                    }}
                    className={`py-2 rounded-lg border font-bold cursor-pointer transition-colors ${
                      issueForm.borrowerType === 'student'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Student (শিক্ষার্থী)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIssueForm((prev) => ({
                        ...prev,
                        borrowerType: 'teacher',
                        borrowerId: '',
                        borrowerName: '',
                        borrowerRollOrDesignation: '',
                        borrowerClass: 'Staff',
                      }));
                    }}
                    className={`py-2 rounded-lg border font-bold cursor-pointer transition-colors ${
                      issueForm.borrowerType === 'teacher'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Teacher / Staff (শিক্ষক)
                  </button>
                </div>
              </div>

              {/* Quick Select from roster if available */}
              {issueForm.borrowerType === 'student' && students.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Enrolled Student
                  </label>
                  <select
                    onChange={(e) => handleSelectBorrower(e.target.value, 'student')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose from student roster --</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.firstName} {st.lastName} (Roll: {st.rollNumber} - Class {st.classId || '10'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {issueForm.borrowerType === 'teacher' && teachers.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Teacher / Staff Member
                  </label>
                  <select
                    onChange={(e) => handleSelectBorrower(e.target.value, 'teacher')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose from teacher list --</option>
                    {teachers.map((tc) => (
                      <option key={tc.id} value={tc.id}>
                        {tc.firstName} {tc.lastName} ({tc.designation || 'Teacher'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Borrower Name & Details Input */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Borrower Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={issueForm.borrowerName}
                    onChange={(e) => setIssueForm({ ...issueForm, borrowerName: e.target.value })}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Class / Designation
                  </label>
                  <input
                    type="text"
                    value={issueForm.borrowerClass}
                    onChange={(e) => setIssueForm({ ...issueForm, borrowerClass: e.target.value })}
                    placeholder="e.g. Class 10 / Asst. Teacher"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Due Return Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={issueForm.dueDate}
                    onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Late Fine per Day (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={issueForm.finePerDay}
                    onChange={(e) => setIssueForm({ ...issueForm, finePerDay: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Confirm Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
