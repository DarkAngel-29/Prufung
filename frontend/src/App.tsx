import React, { useMemo, useState } from "react";
import axios from "axios";
import { BookOpen, Brain, Sparkles, BarChart3, ChevronRight, Loader2, Sun, Moon } from "lucide-react";
import { AnalyticsPanel } from "./components/AnalyticsPanel";
import { useTheme } from "./hooks/useTheme";
import {
  Difficulty,
  EvaluationResponse,
  QuestionResponse,
} from "./types/api";
import Login from "./Login";
import SignUp from "./Signup";
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

type AnswerMode = "idle" | "submitting" | "evaluated";

const difficultyLabels: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const subjects = ["Mathematics", "Physics", "Biology", "Chemistry", "History", "Computer Science"];

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("loggedIn") === "true"
  );
  const [showSignup, setShowSignup] = useState(false);
  const [subject, setSubject] = useState<string>("Mathematics");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [currentQuestion, setCurrentQuestion] = useState<QuestionResponse | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState<string>("");
  const [answerMode, setAnswerMode] = useState<AnswerMode>("idle");
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(true);

  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [cumulativeScore, setCumulativeScore] = useState<number>(0);

  const [subjectStats, setSubjectStats] = useState<
    Record<string, { total: number; correct: number }>
  >(() =>
    subjects.reduce(
      (acc, subj) => ({
        ...acc,
        [subj]: { total: 0, correct: 0 },
      }),
      {} as Record<string, { total: number; correct: number }>,
    ),
  );

  const averageScore = useMemo(
    () => (totalQuestions > 0 ? cumulativeScore / totalQuestions : 0),
    [cumulativeScore, totalQuestions],
  );

  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;

    const studentAnswer =
      currentQuestion.type === "multiple-choice"
        ? selectedOption ?? ""
        : textAnswer.trim();

    if (!studentAnswer) {
      setError("Please provide an answer before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setAnswerMode("submitting");

    try {
      // Logic aligns with interface EvaluationRequest { question, correctAnswer, studentAnswer }
      const response = await axios.post<EvaluationResponse>(`${API_BASE_URL}/evaluate-answer`, {
        question: currentQuestion.question, 
        correctAnswer: currentQuestion.correctAnswer,
        studentAnswer: studentAnswer,
      });

      setEvaluation(response.data);
      setAnswerMode("evaluated");

      // Update Analytics for Performance Insights
      setTotalQuestions((prev) => prev + 1);
      if (response.data.isCorrect) setCorrectAnswers((prev) => prev + 1);
      setCumulativeScore((prev) => prev + response.data.score);

      // Track per-subject performance for graphs / radar chart
      setSubjectStats((prev) => {
        const current = prev[subject] ?? { total: 0, correct: 0 };
        const newTotal = current.total + 1;
        const newCorrect = current.correct + (response.data.isCorrect ? 1 : 0);
        return {
          ...prev,
          [subject]: {
            total: newTotal,
            correct: newCorrect,
          },
        };
      });

    } catch (err) {
      console.error(err);
      setError("Sync Error: Ensure Backend models.py matches api.ts exactly.");
      setAnswerMode("idle");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateQuestion = async () => {
    setIsGenerating(true);
    setError(null);
    setEvaluation(null);
    setSelectedOption(null);
    setTextAnswer("");
    setAnswerMode("idle");

    try {
      // FULL SOLUTION OBJECTIVE: Adaptive Difficulty Adjustment
      // If average score is > 80, automatically bump difficulty to 'hard'
      const adaptiveDifficulty = averageScore > 80 ? "hard" : difficulty;

      const response = await axios.post<QuestionResponse>(`${API_BASE_URL}/generate-question`, {
        subject: subject,
        difficulty: adaptiveDifficulty,
      });
      setCurrentQuestion(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to generate question. Check Backend logs for IndentationErrors.");
    } finally {
      setIsGenerating(false);
    }
  };
  const handleNextQuestion = () => {
    setCurrentQuestion(null);
    setSelectedOption(null);
    setTextAnswer("");
    setEvaluation(null);
    setAnswerMode("idle");
    setError(null);
    void handleGenerateQuestion();
  };

  const isMCQ = currentQuestion?.type === "multiple-choice";
  if (!isLoggedIn) {
    return showSignup ? (
      <SignUp onBack={() => setShowSignup(false)} />
    ) : (
      <Login
        onLogin={() => setIsLoggedIn(true)}
        onSignup={() => setShowSignup(true)}
      />
    );
  }
  
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <header className="mb-6 sm:mb-10">
        

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  AI Exam Prep Assistant
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                  Generate smart questions, practice actively, and get instant feedback powered by AI.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-slate-800 dark:to-slate-700 hover:from-amber-200 hover:to-orange-200 dark:hover:from-slate-700 dark:hover:to-slate-600 border border-amber-300 dark:border-slate-700 transition-all duration-200 shadow-sm"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              )}
            </button>
            <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("loggedIn");
              setIsLoggedIn(false);
            }}
            className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-slate-800 dark:to-slate-700 hover:from-amber-200 hover:to-orange-200 dark:hover:from-slate-700 dark:hover:to-slate-600 border border-amber-300 dark:border-slate-700 transition-all duration-200 shadow-sm">
            Logout
            </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 border border-purple-300 dark:border-purple-700 px-3 py-1 text-purple-800 dark:text-purple-200 font-medium shadow-sm">
              <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              Adaptive learning insights
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 border border-blue-300 dark:border-blue-700 px-3 py-1 text-blue-800 dark:text-blue-200 font-medium shadow-sm">
              <BookOpen className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              Multiple subjects & difficulties
            </span>
          </div>
        </header>

        <main className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-5">
          {/* Left: controls + question */}
          <section className="flex flex-col gap-4">
            {/* Control panel */}
            <div className="rounded-2xl bg-gradient-to-br from-white via-indigo-50/30 to-white dark:from-slate-900/90 dark:via-slate-800/50 dark:to-slate-900/90 border border-indigo-200/50 dark:border-slate-800 shadow-lg shadow-indigo-200/20 dark:shadow-slate-900/40 p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">
                    Session Controls
                  </p>
                  <p className="text-sm text-slate-800 dark:text-slate-300">
                    Choose your subject and difficulty, then generate tailored questions.
                  </p>
                </div>
                <BarChart3
                  className="w-5 h-5 text-indigo-600 dark:text-indigo-400 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition transform hover:scale-110"
                  onClick={() => setShowAnalytics((prev) => !prev)}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Subject */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                    Subject
                  </label>
                  <div className="relative">
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-slate-950/70 border-2 border-blue-200 dark:border-slate-700/80 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 transition shadow-sm"
                    >
                      {subjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Difficulty */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                    Difficulty
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["easy", "medium", "hard"] as Difficulty[]).map((level) => {
                      const isActive = difficulty === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDifficulty(level)}
                          className={[
                            "text-xs font-medium rounded-xl px-2.5 py-2 border-2 transition flex items-center justify-center",
                            isActive
                              ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-indigo-500 dark:border-indigo-400 shadow-lg shadow-indigo-500/50"
                              : "bg-white dark:bg-slate-950/60 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50 hover:to-indigo-50 dark:hover:bg-slate-900/80 hover:text-purple-700 dark:hover:text-purple-100 shadow-sm",
                          ].join(" ")}
                        >
                          {difficultyLabels[level]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-700 dark:text-slate-400">
                  Questions are generated dynamically based on your selected subject and difficulty.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateQuestion}
                  disabled={isGenerating}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-sm font-semibold px-4 py-2.5 text-white shadow-lg shadow-purple-500/50 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 hover:shadow-xl hover:shadow-purple-500/60 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Question
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Question & answer panel */}
            <div className="rounded-2xl bg-gradient-to-br from-white via-teal-50/20 to-cyan-50/20 dark:from-slate-950/90 dark:via-slate-800/50 dark:to-slate-950/90 border border-teal-200/50 dark:border-slate-800 shadow-xl shadow-teal-200/20 dark:shadow-slate-950/40 p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wide">
                    Active Question
                  </p>
                  <p className="text-sm text-slate-800 dark:text-slate-300">
                    Answer the question, then submit to see how you performed.
                  </p>
                </div>
                <span className="text-[11px] rounded-full border border-slate-300 dark:border-slate-700/80 px-2 py-1 text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/70 font-medium">
                  {currentQuestion ? (
                    <>
                      {currentQuestion.type === "multiple-choice" ? "Multiple Choice" : "Short Answer"} •{" "}
                      <span className="capitalize">{currentQuestion.difficulty}</span>
                    </>
                  ) : (
                    "No question generated"
                  )}
                </span>
              </div>

              {error && (
                <div className="rounded-xl border-2 border-red-400 dark:border-red-500/40 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40 px-3 py-2 text-xs text-red-800 dark:text-red-200 font-semibold shadow-md">
                  {error}
                </div>
              )}

              {!currentQuestion ? (
                <div className="rounded-2xl border-2 border-dashed border-cyan-300 dark:border-slate-700/80 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-slate-900/40 dark:via-slate-800/40 dark:to-slate-900/40 p-4 flex flex-col items-center justify-center text-center gap-3">
                  <BookOpen className="w-9 h-9 text-cyan-500 dark:text-slate-500" />
                  <p className="text-sm font-semibold text-cyan-800 dark:text-slate-200">
                    Ready to start practicing?
                  </p>
                  <p className="text-xs text-cyan-700 dark:text-slate-400 max-w-md">
                    Select a subject and difficulty, then click{" "}
                    <span className="font-bold text-indigo-600 dark:text-indigo-300">Generate Question</span> to begin your
                    personalized exam prep session.
                  </p>
                </div>
              ) : (
                <>
                  {/* Question */}
                  <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-900/70 dark:to-slate-800/50 border-2 border-blue-200 dark:border-slate-800 p-4 flex flex-col gap-2 shadow-sm">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                      Question
                    </p>
                    <p className="text-sm sm:text-base text-slate-900 dark:text-slate-50 leading-relaxed font-medium">
                      {currentQuestion.question}
                    </p>
                  </div>

                  {/* Answer */}
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wide">
                      Your Answer
                    </p>
                    {isMCQ ? (
                      <div className="grid sm:grid-cols-2 gap-2">
                        {currentQuestion.options.map((opt) => {
                          const isSelected = selectedOption === opt;
                          const isCorrectSelected =
                            answerMode === "evaluated" &&
                            isSelected &&
                            opt === currentQuestion.correctAnswer;
                          const isIncorrectSelected =
                            answerMode === "evaluated" &&
                            isSelected &&
                            opt !== currentQuestion.correctAnswer;

                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setSelectedOption(opt)}
                              className={[
                                "w-full text-left rounded-xl border px-3 py-2.5 text-sm transition",
                                isCorrectSelected
                                  ? "border-emerald-500 dark:border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/30 text-emerald-900 dark:text-emerald-100 shadow-lg shadow-emerald-500/30"
                                  : isIncorrectSelected
                                  ? "border-red-500 dark:border-red-400 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/30 text-red-900 dark:text-red-100 shadow-lg shadow-red-500/30"
                                  : isSelected
                                  ? "border-purple-400 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 text-purple-900 dark:text-purple-100 shadow-md shadow-purple-500/30"
                                  : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-100 hover:border-cyan-400 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 dark:hover:bg-slate-900/80 shadow-sm",
                              ].join(" ")}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <textarea
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        rows={4}
                        className="w-full rounded-xl bg-white dark:bg-slate-950/70 border-2 border-cyan-200 dark:border-slate-700/80 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 dark:focus:border-cyan-400 transition resize-none shadow-sm"
                        placeholder="Explain your answer clearly and concisely..."
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleSubmitAnswer}
                      disabled={isSubmitting || !currentQuestion}
                      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold px-4 py-2.5 text-white shadow-lg shadow-emerald-500/50 hover:from-emerald-500 hover:to-teal-500 hover:shadow-xl hover:shadow-emerald-500/60 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Evaluating...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Submit Answer
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      disabled={isGenerating || !currentQuestion}
                      className="inline-flex items-center justify-center rounded-xl border-2 border-amber-300 dark:border-slate-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900/70 dark:to-slate-800/70 text-sm font-medium px-4 py-2.5 text-amber-800 dark:text-slate-100 hover:border-amber-400 hover:text-amber-900 dark:hover:text-amber-100 hover:from-amber-100 hover:to-orange-100 dark:hover:bg-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                      Next Question
                    </button>
                  </div>

                  {/* Evaluation */}
                  {evaluation && (
                    <div className="mt-1 grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3">
                      <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-emerald-950/60 dark:to-green-950/60 border-2 border-emerald-200 dark:border-emerald-800/50 p-3 sm:p-4 flex flex-col gap-2 shadow-md">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                            Evaluation
                          </p>
                          <span
                            className={[
                              "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold border-2 shadow-sm",
                              evaluation.isCorrect
                                ? "bg-gradient-to-r from-emerald-400 to-green-400 dark:from-emerald-700 dark:to-green-700 border-emerald-500 dark:border-emerald-500 text-white dark:text-emerald-100"
                                : "bg-gradient-to-r from-red-400 to-rose-400 dark:from-red-700 dark:to-rose-700 border-red-500 dark:border-red-500 text-white dark:text-red-100",
                            ].join(" ")}
                          >
                            {evaluation.isCorrect ? "Correct" : "Incorrect"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-900 dark:text-slate-200 font-medium">{evaluation.feedback}</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          Score:{" "}
                          <span className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">
                            {evaluation.score}/100
                          </span>
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/60 dark:to-pink-950/60 border-2 border-purple-200 dark:border-purple-800/50 p-3 sm:p-4 flex flex-col gap-2 shadow-md">
                        <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wide">
                          Insights
                        </p>
                        {evaluation.strengths.length > 0 && (
                          <div className="text-xs text-slate-900 dark:text-slate-200">
                            <p className="font-bold text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Strengths
                            </p>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-800 dark:text-slate-300 ml-2">
                              {evaluation.strengths.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {evaluation.improvements.length > 0 && (
                          <div className="text-xs text-slate-900 dark:text-slate-200">
                            <p className="font-bold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Focus Areas
                            </p>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-800 dark:text-slate-300 ml-2">
                              {evaluation.improvements.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/60 dark:via-indigo-950/60 dark:to-purple-950/60 border-2 border-indigo-200 dark:border-indigo-800/50 p-3 sm:p-4 flex flex-col gap-1.5 shadow-md">
                        <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wide">
                          Correct Answer & Explanation
                        </p>
                        <p className="text-xs text-slate-900 dark:text-slate-200">
                          <span className="font-bold text-emerald-700 dark:text-emerald-300">Correct Answer:</span>{" "}
                          {currentQuestion.correctAnswer}
                        </p>
                        <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed">
                          <span className="font-bold text-indigo-700 dark:text-indigo-300">Explanation:</span>{" "}
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Right: analytics */}
          <aside className="lg:block">
            {showAnalytics && (
              <AnalyticsPanel
                totalQuestions={totalQuestions}
                correctAnswers={correctAnswers}
              averageScore={averageScore}
              subjectStats={subjectStats}
              />
            )}
          </aside>
        </main>
      </div>
    </div>
  );
};

export default App;


