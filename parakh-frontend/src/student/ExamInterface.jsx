import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ExamInterface = () => {
    const { examId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(3600); // Default 60 mins
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch(`http://localhost:8081/api/student/exam/${examId}/questions`, {
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
                const data = await res.json();

                if (data.type === 'PDF') {
                    // Handle PDF mode
                    alert("PDF Mode is a placeholder for this demo.");
                    navigate('/student/dashboard');
                    return;
                }

                setQuestions(data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load exam", err);
            }
        };
        fetchQuestions();
    }, [examId, user]);

    // Timer Logic 
    useEffect(() => {
        if (!loading && !isSubmitted) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [loading, isSubmitted]);

    const handleOptionSelect = (qId, option) => {
        setAnswers({ ...answers, [qId]: option });
    };

    const handleSubmit = async () => {
        if (!window.confirm("Are you sure you want to submit?")) return;

        setIsSubmitted(true);
        // Simple mock score calculation for demo
        // In real app, backend calculates score
        const mockScore = Math.floor(Math.random() * 100);

        try {
            await fetch(`http://localhost:8081/api/student/exam/${examId}/submit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ answers, score: mockScore })
            });
            alert(`Exam Submitted! Score: ${mockScore}`);
            navigate('/student/dashboard');
        } catch (err) {
            console.error("Submission failed", err);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center text-2xl font-bold text-primary-700">LOADING ASSESSMENT RESOURCES...</div>;

    if (questions.length === 0) return <div className="h-screen flex items-center justify-center font-bold text-surface-600">NO QUESTIONS FOUND FOR THIS ASSESSMENT.</div>;

    const q = questions[currentQuestion];

    return (
        <div className="min-h-screen bg-surface-100 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-primary-900 border-b-4 border-accent-400 px-6 py-3 flex justify-between items-center z-10 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-widest uppercase">PARAKH ASSESSMENT SYSTEM</h1>
                    <p className="text-xs text-primary-200">Candidate ID: {user?.email}</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-right">
                        <p className="text-xs text-primary-200 uppercase">Time Remaining</p>
                        <div className={`font-mono font-bold text-2xl ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Question Area */}
                <main className="flex-1 p-6 overflow-y-auto bg-surface-50 flex flex-col relative">
                    <div className="bg-white border border-surface-300 shadow-sm flex-1 flex flex-col p-8">
                        <div className="flex justify-between items-center border-b-2 border-surface-200 pb-4 mb-6">
                            <span className="text-lg font-bold text-primary-800 uppercase">Question No. {currentQuestion + 1}</span>
                            <span className="text-xs font-bold text-surface-500 bg-surface-100 px-2 py-1 border border-surface-200">marks: 1.0</span>
                        </div>

                        <h2 className="text-xl font-medium text-surface-900 mb-8 leading-relaxed">
                            {q.content}
                        </h2>

                        <div className="space-y-3 flex-1">
                            {['A', 'B', 'C', 'D'].map((opt) => (
                                <div
                                    key={opt}
                                    onClick={() => handleOptionSelect(q.id, opt)}
                                    className={`flex items-start p-4 border cursor-pointer group transition-colors ${answers[q.id] === opt
                                            ? 'bg-blue-50 border-primary-600'
                                            : 'bg-white border-surface-300 hover:bg-surface-50 hover:border-surface-400'
                                        }`}
                                >
                                    <div className={`flex items-center justify-center w-6 h-6 border rounded-full mr-4 flex-shrink-0 ${answers[q.id] === opt
                                            ? 'border-primary-600 bg-primary-600 text-white'
                                            : 'border-surface-400 text-surface-500 group-hover:border-surface-600'
                                        }`}>
                                        <div className={`w-2.5 h-2.5 rounded-full ${answers[q.id] === opt ? 'bg-white' : 'hidden'}`}></div>
                                    </div>
                                    <div>
                                        <span className="font-bold mr-2 text-surface-700">{opt}.</span>
                                        <span className="text-surface-800">{q[`option${opt}`]}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 flex justify-between items-center bg-white p-4 border border-surface-300 shadow-sm">
                        <button
                            disabled={currentQuestion === 0}
                            onClick={() => setCurrentQuestion(prev => prev - 1)}
                            className="px-6 py-2 border border-surface-300 bg-surface-100 text-surface-700 font-bold uppercase text-sm hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            &larr; Previous
                        </button>

                        <div className="space-x-4">
                            <button
                                className="px-6 py-2 border border-yellow-500 text-yellow-700 font-bold uppercase text-sm hover:bg-yellow-50"
                                onClick={() => {/* Placeholder for Mark for Review */ }}
                            >
                                Mark for Review
                            </button>
                            {currentQuestion < questions.length - 1 ? (
                                <button
                                    onClick={() => setCurrentQuestion(prev => prev + 1)}
                                    className="px-6 py-2 bg-primary-700 text-white font-bold uppercase text-sm hover:bg-primary-800 border border-transparent"
                                >
                                    Save & Next &rarr;
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-2 bg-green-700 text-white font-bold uppercase text-sm hover:bg-green-800 border border-transparent shadow-sm"
                                >
                                    Submit Final Response
                                </button>
                            )}
                        </div>
                    </div>
                </main>

                {/* Sidebar Navigation */}
                <div className="w-80 bg-white border-l border-surface-300 flex flex-col">
                    <div className="p-4 bg-surface-50 border-b border-surface-200">
                        <div className="flex items-center justify-center">
                            <div className="w-16 h-16 bg-surface-200 rounded-full flex items-center justify-center text-surface-400 font-bold text-2xl border mb-2">
                                {user?.name ? user.name.charAt(0) : 'U'}
                            </div>
                        </div>
                        <p className="text-center font-bold text-surface-800">{user?.name}</p>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto">
                        <h3 className="font-bold text-surface-700 mb-4 uppercase text-xs border-b border-surface-200 pb-2">Question Palette</h3>
                        <div className="grid grid-cols-4 gap-3">
                            {questions.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentQuestion(idx)}
                                    className={`h-10 w-10 flex items-center justify-center text-sm font-bold border transition-colors ${currentQuestion === idx
                                            ? 'border-primary-600 ring-1 ring-primary-600 z-10'
                                            : 'border-surface-300'
                                        } ${answers[questions[idx].id]
                                            ? 'bg-green-600 text-white border-green-700'
                                            : 'bg-surface-50 text-surface-700 hover:bg-surface-100'
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 space-y-3">
                            <div className="flex items-center">
                                <div className="w-6 h-6 bg-green-600 border border-green-700 flex items-center justify-center text-white text-xs font-bold mr-3">#</div>
                                <span className="text-xs font-bold text-surface-600 uppercase">Answered</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-6 h-6 bg-surface-50 border border-surface-300 flex items-center justify-center text-surface-700 text-xs font-bold mr-3">#</div>
                                <span className="text-xs font-bold text-surface-600 uppercase">Not Visited / Skipped</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-6 h-6 border-primary-600 ring-1 ring-primary-600 flex items-center justify-center text-primary-700 text-xs font-bold mr-3">#</div>
                                <span className="text-xs font-bold text-surface-600 uppercase">Current Question</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-surface-200 bg-surface-50">
                        <button onClick={handleSubmit} className="w-full py-3 bg-red-700 text-white font-bold uppercase text-sm hover:bg-red-800 shadow-sm">
                            Finish Exam
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamInterface;
