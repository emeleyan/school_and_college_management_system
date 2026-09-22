import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { QuestionBankItem, ClassItem, AcademicSubject } from '../../types';
import { putItem, deleteItem } from '../../db/indexedDB';
import {
  BookOpen,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  HelpCircle,
  FileText,
  Search,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface QuestionBankTabProps {
  questions: QuestionBankItem[];
  classes: ClassItem[];
  subjects: AcademicSubject[];
  onRefresh: () => void;
}

export const QuestionBankTab: React.FC<QuestionBankTabProps> = ({
  questions,
  classes,
  subjects,
  onRefresh,
}) => {
  const { activeInstitute, logAudit } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaperGenerator, setShowPaperGenerator] = useState(false);

  // New Question Form State
  const [questionForm, setQuestionForm] = useState({
    classId: classes[0]?.id || '',
    subjectId: '',
    chapter: '',
    questionType: 'creative' as QuestionBankItem['questionType'],
    difficulty: 'medium' as QuestionBankItem['difficulty'],
    stemOrQuestion: '',
    // Subquestions for creative
    subA: '',
    subB: '',
    subC: '',
    subD: '',
    // MCQ Options
    mcqOpt1: '',
    mcqOpt2: '',
    mcqOpt3: '',
    mcqOpt4: '',
    mcqCorrect: '1',
    explanation: '',
  });

  // Question Paper Generator parameters
  const [paperParams, setPaperParams] = useState({
    title: 'Half Yearly Examination 2026',
    classId: classes[0]?.id || '',
    subjectId: '',
    timeAllowed: '2 Hours 30 Minutes',
    fullMarks: 70,
    instructions: 'উত্তরপত্রে ক্রমিক নম্বর অনুযায়ী সৃজনশীল প্রশ্নের উত্তর দাও। প্রতিটি প্রশ্নের মান ১০।',
  });

  const filteredQuestions = questions.filter((q) => {
    if (selectedClassId !== 'all' && q.classId !== selectedClassId) return false;
    if (selectedSubjectId !== 'all' && q.subjectId !== selectedSubjectId) return false;
    if (filterType !== 'all' && q.questionType !== filterType) return false;
    if (
      searchTerm &&
      !q.stemOrQuestion.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !q.chapter.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute) return;

    const cls = classes.find((c) => c.id === questionForm.classId);
    const sub = subjects.find((s) => s.id === questionForm.subjectId);

    try {
      const qId = `qb-${Date.now()}`;
      const item: QuestionBankItem = {
        id: qId,
        instituteId: activeInstitute.id,
        classId: cls?.id || 'class-01',
        className: cls?.name || 'Class 10',
        subjectId: sub?.id || 'sub-01',
        subjectName: sub?.name || 'Bangla',
        chapter: questionForm.chapter.trim() || 'General',
        questionType: questionForm.questionType,
        difficulty: questionForm.difficulty,
        stemOrQuestion: questionForm.stemOrQuestion.trim(),
        subQuestions:
          questionForm.questionType === 'creative'
            ? [
                { label: 'ক', mark: 1, text: questionForm.subA.trim() },
                { label: 'খ', mark: 2, text: questionForm.subB.trim() },
                { label: 'গ', mark: 3, text: questionForm.subC.trim() },
                { label: 'ঘ', mark: 4, text: questionForm.subD.trim() },
              ]
            : undefined,
        mcqOptions:
          questionForm.questionType === 'mcq'
            ? [
                { id: '1', text: questionForm.mcqOpt1.trim(), isCorrect: questionForm.mcqCorrect === '1' },
                { id: '2', text: questionForm.mcqOpt2.trim(), isCorrect: questionForm.mcqCorrect === '2' },
                { id: '3', text: questionForm.mcqOpt3.trim(), isCorrect: questionForm.mcqCorrect === '3' },
                { id: '4', text: questionForm.mcqOpt4.trim(), isCorrect: questionForm.mcqCorrect === '4' },
              ]
            : undefined,
        explanation: questionForm.explanation.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await putItem('questionBank', item);
      await logAudit(
        'add_question',
        'examination',
        `Added ${item.questionType} question to Question Bank for ${item.subjectName}`
      );

      setShowAddModal(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to save question:', err);
    }
  };

  const handleDeleteQuestion = async (q: QuestionBankItem) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await deleteItem('questionBank', q.id);
      await logAudit('delete_question', 'examination', `Deleted question ${q.id}`);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  const selectedPaperClass = classes.find((c) => c.id === paperParams.classId);
  const selectedPaperSubject = subjects.find((s) => s.id === paperParams.subjectId);
  const paperQuestions = questions.filter(
    (q) => q.classId === paperParams.classId && (!paperParams.subjectId || q.subjectId === paperParams.subjectId)
  );

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="all">All Subjects</option>
              {subjects
                .filter((s) => selectedClassId === 'all' || s.classId === selectedClassId || !s.classId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Question Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Question Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="creative">Creative (CQ / সৃজনশীল)</option>
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="short_answer">Short Answer</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPaperParams({
                ...paperParams,
                classId: classes[0]?.id || '',
                subjectId: subjects[0]?.id || '',
              });
              setShowPaperGenerator(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Question Paper</span>
          </button>

          <button
            onClick={() => {
              setQuestionForm({
                ...questionForm,
                classId: classes[0]?.id || '',
                subjectId: subjects[0]?.id || '',
              });
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Questions Feed */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500">
          <BookOpen className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No questions match the current filter
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Build your institutional question bank with Creative (CQ) and MCQ items for automated paper generation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, index) => (
            <div
              key={q.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 uppercase tracking-wider">
                    {q.questionType === 'creative' ? 'সৃজনশীল (CQ)' : q.questionType.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {q.className} • {q.subjectName} • {q.chapter}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    Difficulty: {q.difficulty}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteQuestion(q)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                  title="Delete Question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Stem / Uddipak */}
              <div className="mt-3 text-sm text-slate-900 dark:text-slate-100 font-medium leading-relaxed bg-slate-50 dark:bg-slate-750/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                {q.stemOrQuestion}
              </div>

              {/* Creative Sub-Questions */}
              {q.questionType === 'creative' && q.subQuestions && (
                <div className="mt-4 space-y-2 text-xs">
                  {q.subQuestions.map((sub, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-start justify-between gap-2 p-2 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {sub.label}.
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">{sub.text}</span>
                      </div>
                      <span className="font-bold font-mono text-slate-400 shrink-0">
                        {sub.mark} Mark
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* MCQ Options */}
              {q.questionType === 'mcq' && q.mcqOptions && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  {q.mcqOptions.map((opt, oIdx) => (
                    <div
                      key={opt.id}
                      className={`p-2 rounded border flex items-center justify-between ${
                        opt.isCorrect
                          ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>
                        ({String.fromCharCode(65 + oIdx)}) {opt.text}
                      </span>
                      {opt.isCorrect && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Question */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 my-8">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Add New Question to Bank
            </h3>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Class
                  </label>
                  <select
                    value={questionForm.classId}
                    onChange={(e) =>
                      setQuestionForm({ ...questionForm, classId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <select
                    value={questionForm.subjectId}
                    onChange={(e) =>
                      setQuestionForm({ ...questionForm, subjectId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {subjects
                      .filter((s) => s.classId === questionForm.classId || !s.classId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chapter / Unit
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chapter 2: Cells"
                    value={questionForm.chapter}
                    onChange={(e) =>
                      setQuestionForm({ ...questionForm, chapter: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Type
                  </label>
                  <select
                    value={questionForm.questionType}
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        questionType: e.target.value as QuestionBankItem['questionType'],
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="creative">Creative (CQ / সৃজনশীল)</option>
                    <option value="mcq">Multiple Choice (MCQ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {questionForm.questionType === 'creative'
                    ? 'Stem / Uddipak (উদ্দীপক) *'
                    : 'Question Text *'}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter context, passage, or question..."
                  value={questionForm.stemOrQuestion}
                  onChange={(e) =>
                    setQuestionForm({ ...questionForm, stemOrQuestion: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              {/* CQ Subquestions */}
              {questionForm.questionType === 'creative' && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Sub-Questions (ক, খ, গ, ঘ)
                  </span>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      ক. জ্ঞানমূলক (1 Mark)
                    </label>
                    <input
                      type="text"
                      value={questionForm.subA}
                      onChange={(e) => setQuestionForm({ ...questionForm, subA: e.target.value })}
                      className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      খ. অনুধাবনমূলক (2 Marks)
                    </label>
                    <input
                      type="text"
                      value={questionForm.subB}
                      onChange={(e) => setQuestionForm({ ...questionForm, subB: e.target.value })}
                      className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      গ. প্রয়োগমূলক (3 Marks)
                    </label>
                    <input
                      type="text"
                      value={questionForm.subC}
                      onChange={(e) => setQuestionForm({ ...questionForm, subC: e.target.value })}
                      className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      ঘ. উচ্চতর দক্ষতামূলক (4 Marks)
                    </label>
                    <input
                      type="text"
                      value={questionForm.subD}
                      onChange={(e) => setQuestionForm({ ...questionForm, subD: e.target.value })}
                      className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                    />
                  </div>
                </div>
              )}

              {/* MCQ Options */}
              {questionForm.questionType === 'mcq' && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    MCQ 4 Options
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Option A"
                      value={questionForm.mcqOpt1}
                      onChange={(e) =>
                        setQuestionForm({ ...questionForm, mcqOpt1: e.target.value })
                      }
                      className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Option B"
                      value={questionForm.mcqOpt2}
                      onChange={(e) =>
                        setQuestionForm({ ...questionForm, mcqOpt2: e.target.value })
                      }
                      className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Option C"
                      value={questionForm.mcqOpt3}
                      onChange={(e) =>
                        setQuestionForm({ ...questionForm, mcqOpt3: e.target.value })
                      }
                      className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Option D"
                      value={questionForm.mcqOpt4}
                      onChange={(e) =>
                        setQuestionForm({ ...questionForm, mcqOpt4: e.target.value })
                      }
                      className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Correct Answer Option
                    </label>
                    <select
                      value={questionForm.mcqCorrect}
                      onChange={(e) =>
                        setQuestionForm({ ...questionForm, mcqCorrect: e.target.value })
                      }
                      className="w-full mt-1 px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                    >
                      <option value="1">Option A</option>
                      <option value="2">Option B</option>
                      <option value="3">Option C</option>
                      <option value="4">Option D</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Question Paper Print Generator */}
      {showPaperGenerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-700 my-8 text-slate-900 dark:text-white print:p-0 print:border-none print:shadow-none">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6 print:hidden">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Question Paper Formatter
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Paper</span>
                </button>
                <button
                  onClick={() => setShowPaperGenerator(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Paper Header */}
            <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900 dark:border-slate-100">
              <h2 className="text-xl font-bold tracking-tight uppercase">
                {activeInstitute?.name}
              </h2>
              <p className="text-sm font-semibold">{paperParams.title}</p>
              <div className="flex items-center justify-between text-xs pt-3 font-semibold">
                <span>Class: {selectedPaperClass?.name || 'Class 10'}</span>
                <span>Subject: {selectedPaperSubject?.name || 'Bangla'}</span>
                <span>Subject Code: {selectedPaperSubject?.code || '101'}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                <span>Time Allowed: {paperParams.timeAllowed}</span>
                <span>Full Marks: {paperParams.fullMarks}</span>
              </div>
            </div>

            <p className="text-xs italic text-center py-2 text-slate-500">
              [{paperParams.instructions}]
            </p>

            {/* Questions List */}
            <div className="mt-4 space-y-6 text-sm">
              {paperQuestions.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No questions found for this subject in the Question Bank. Add questions first!
                </div>
              ) : (
                paperQuestions.map((q, idx) => (
                  <div key={q.id} className="space-y-2">
                    <div className="flex items-start gap-2 font-medium leading-relaxed">
                      <span className="font-bold">{idx + 1}.</span>
                      <div className="flex-1">{q.stemOrQuestion}</div>
                    </div>

                    {q.subQuestions && (
                      <div className="pl-6 space-y-1.5 text-xs">
                        {q.subQuestions.map((sub, sIdx) => (
                          <div key={sIdx} className="flex items-start justify-between gap-4">
                            <div>
                              <span className="font-bold mr-2">({sub.label})</span>
                              <span>{sub.text}</span>
                            </div>
                            <span className="font-mono font-bold text-slate-500">
                              {sub.mark}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
