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

    if (loading) return <div className="h-screen flex items-center justify-center text-2xl">Loading Exam...</div>;

    if (questions.length === 0) return <div className="h-screen flex items-center justify-center">No questions found for this exam.</div>;

    const q = questions[currentQuestion];

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <header className="bg-white px-8 py-4 shadow flex justify-between items-center z-10">
                <h1 className="text-xl font-bold text-gray-800">Parakh Secure Exam Browser</h1>
                <div className={`px-4 py-2 rounded font-mono font-bold text-xl ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 bg-white border-r border-gray-200 p-6 overflow-y-auto">
                    <h3 className="font-bold text-gray-500 mb-4 uppercase text-sm">Question Palette</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {questions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentQuestion(idx)}
                                className={`h-10 w-10 rounded-lg font-bold text-sm transition-colors ${currentQuestion === idx ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                                    } ${answers[questions[idx].id] ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 border-t pt-6">
                        <div className="flex items-center mb-2">
                            <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                            <span className="text-sm text-gray-600">Answered</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                            <span className="text-sm text-gray-600">Not Answered</span>
                        </div>
                    </div>
                </div>

                {/* Question Area */}
                <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
                    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8 min-h-[500px] flex flex-col">
                        <div className="flex justify-between text-gray-500 text-sm mb-4 font-mono">
                            <span>Question {currentQuestion + 1} of {questions.length}</span>
                            <span>ID: {q.id}</span>
                        </div>

                        <h2 className="text-xl font-medium text-gray-900 mb-8 leading-relaxed">
                            {q.content}
                        </h2>

                        <div className="space-y-4 flex-1">
                            {['A', 'B', 'C', 'D'].map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => handleOptionSelect(q.id, opt)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${answers[q.id] === opt
                                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="font-bold mr-4">{opt}.</span>
                                    {q[`option${opt}`]}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between mt-8 pt-6 border-t">
                            <button
                                disabled={currentQuestion === 0}
                                onClick={() => setCurrentQuestion(prev => prev - 1)}
                                className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                            >
                                Previous
                            </button>

                            {currentQuestion < questions.length - 1 ? (
                                <button
                                    onClick={() => setCurrentQuestion(prev => prev + 1)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Next Question
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
                                >
                                    Submit Exam
                                </button>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ExamInterface;
