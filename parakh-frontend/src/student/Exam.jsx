import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';

const Exam = () => {
  const [examState, setExamState] = useState(null); // Stores the full DTO from backend
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [userId] = useState(1); // Mock User ID for MVP
  const [subject] = useState("Science"); // Mock Subject for MVP

  useEffect(() => {
    startExam();
  }, []);

  const startExam = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/exam/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subject }),
      });
      if (response.ok) {
        const data = await response.json();
        setExamState(data);
      } else {
        console.error('Failed to start exam');
      }
    } catch (error) {
      console.error('Error starting exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedOption || submitting) return;
    setSubmitting(true);

    try {
      const response = await fetch('http://localhost:8081/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: examState.examId,
          questionId: examState.nextQuestion.id,
          selectedOption: selectedOption
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setExamState(data);
        setSelectedOption(null); // Reset selection
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setLoading(true);
    setExamState(null);
    startExam();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Error State
  if (!examState) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center p-4">
        <div className="glass max-w-lg w-full p-8 rounded-3xl text-center">
          <h2 className="text-2xl font-bold text-surface-900 mb-2">Could Not Start Exam</h2>
          <p className="text-surface-500">Please try again later.</p>
          <Button onClick={handleRetake} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  // Completion State
  if (examState.examCompleted) {
    return (
      <div className="w-full py-10 px-4 flex items-center justify-center">
        <div className="glass max-w-2xl w-full p-10 rounded-3xl text-center animate-slide-up">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner">
            🏆
          </div>
          <h2 className="text-3xl font-bold font-display text-surface-900 mb-2">Assessment Complete!</h2>
          <p className="text-surface-600 mb-8 max-w-md mx-auto">
            You scored <span className="font-bold text-primary-600">{examState.currentScore}</span> out of <span className="font-bold text-surface-900">{examState.totalQuestionsAnswered}</span> questions.
          </p>

          <div className="w-full bg-surface-100 rounded-full h-4 mb-8 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-emerald-600 h-full rounded-full transition-all duration-1000"
              style={{ width: `${(examState.currentScore / examState.totalQuestionsAnswered) * 100}%` }}
            ></div>
          </div>

          <div className="flex justify-center gap-4">
            <Button onClick={handleRetake} variant="outline">Take Another Exam</Button>
            <Button onClick={() => window.location.href = '/student/dashboard'}>Back to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  // Active Question State
  const currentQuestion = examState.nextQuestion;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <span className="text-sm font-semibold text-primary-600">
          Question {examState.totalQuestionsAnswered + 1}
        </span>
        <span className="text-sm font-medium text-surface-500">
          {currentQuestion.subject} • {currentQuestion.topic} • <span className={`badge ${currentQuestion.difficulty === 'Hard' ? 'text-red-500' : 'text-primary-500'}`}>{currentQuestion.difficulty}</span>
        </span>
      </div>

      {/* Progress Bar (Visual only since total is dynamic, assuming max 10 for now) */}
      <div className="w-full bg-surface-200 h-2 rounded-full mb-8">
        <div
          className="bg-primary-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((examState.totalQuestionsAnswered) / 10) * 100}%` }}
        ></div>
      </div>

      {/* Question Card */}
      <div className="glass rounded-3xl p-8 sm:p-12 mb-8 animate-fade-in relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary-500/5 rounded-full blur-3xl"></div>

        <h2 className="text-2xl font-bold text-surface-900 mb-8 leading-relaxed relative z-10">
          {currentQuestion.content}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {['A', 'B', 'C', 'D'].map((optKey) => (
            <button
              key={optKey}
              onClick={() => setSelectedOption(optKey)}
              disabled={submitting}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3 group ${selectedOption === optKey
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                : 'border-surface-200 hover:border-primary-300 hover:bg-surface-50'
                }`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${selectedOption === optKey
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 text-surface-500 group-hover:bg-primary-100 group-hover:text-primary-600'
                }`}>
                {optKey}
              </span>
              <span className={`font-medium ${selectedOption === optKey ? 'text-primary-900' : 'text-surface-700'}`}>
                {currentQuestion[`option${optKey}`]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end items-center">
        <Button
          onClick={handleSubmitAnswer}
          variant="primary"
          className="shadow-xl shadow-primary-500/30 w-full sm:w-auto"
          disabled={!selectedOption || submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Answer'}
        </Button>
      </div>
    </div>
  );
};

export default Exam;