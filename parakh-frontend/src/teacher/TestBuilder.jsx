import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Search, Filter, FileText, ArrowLeft, ArrowRight, Upload } from 'lucide-react';

const TestBuilder = ({ isOpen, onClose, onSave, classes, user }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: '', classroomId: '', durationMinutes: 60, type: 'MANUAL',
        subject: 'Science', topic: '', difficulty: 'Medium', questionCount: 10,
        questionIds: [], pdfUrl: ''
    });

    // Bank Data
    const [questions, setQuestions] = useState([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [filters, setFilters] = useState({ subject: '', difficulty: '' });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isOpen && step === 3 && formData.type === 'MANUAL') {
            fetchQuestions();
        }
    }, [step, isOpen, formData.type, filters]);

    const fetchQuestions = async () => {
        setLoadingQuestions(true);
        let url = 'http://localhost:8081/api/teacher/questions';
        const params = new URLSearchParams();
        if (filters.subject) params.append('subject', filters.subject);
        if (filters.difficulty) params.append('difficulty', filters.difficulty);
        if (params.toString()) url += `?${params.toString()}`;

        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${user?.token}` } });
            if (res.ok) setQuestions(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoadingQuestions(false); }
    };

    const handleSelectQuestion = (id) => {
        if (formData.questionIds.includes(id)) {
            setFormData({ ...formData, questionIds: formData.questionIds.filter(qId => qId !== id) });
        } else {
            setFormData({ ...formData, questionIds: [...formData.questionIds, id] });
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const data = new FormData();
        data.append('file', file);

        try {
            setUploading(true);
            const res = await fetch('http://localhost:8081/api/teacher/upload-pdf', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user?.token}` },
                body: data
            });
            if (res.ok) {
                const filename = await res.text();
                setFormData({ ...formData, pdfUrl: filename });
            } else {
                alert('Upload failed');
            }
        } catch (err) { console.error(err); alert('Upload error'); }
        finally { setUploading(false); }
    };

    const handleSubmit = () => {
        onSave(formData);
        setStep(1);
        setFormData({ title: '', classroomId: '', durationMinutes: 60, type: 'MANUAL', subject: 'Science', topic: '', difficulty: 'Medium', questionCount: 10, questionIds: [], pdfUrl: '' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-surface-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl border border-surface-300 rounded-sm">
                {/* Header */}
                <div className="bg-primary-900 p-6 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight">Create Assessment</h2>
                        <p className="text-xs text-primary-300 uppercase tracking-widest">Step {step} of 4</p>
                    </div>
                    <button onClick={onClose} className="text-primary-300 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-surface-50 p-8">
                    {step === 1 && (
                        <div className="max-w-xl mx-auto bg-white p-8 shadow-sm border border-surface-200">
                            <h3 className="text-lg font-bold text-surface-800 uppercase mb-6 border-b border-surface-200 pb-2">Basic Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Assessment Title</label>
                                    <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" placeholder="e.g. Unit Test 1" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Target Class</label>
                                    <select className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm bg-white" value={formData.classroomId} onChange={e => setFormData({ ...formData, classroomId: e.target.value })}>
                                        <option value="">Select Class</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.subject})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Duration (Minutes)</label>
                                    <input type="number" className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" value={formData.durationMinutes} onChange={e => setFormData({ ...formData, durationMinutes: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="max-w-3xl mx-auto">
                            <h3 className="text-lg font-bold text-surface-800 uppercase mb-6 text-center">Select Assessment Mode</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <button onClick={() => setFormData({ ...formData, type: 'TOPIC' })} className={`p-6 border-2 flex flex-col items-center gap-4 hover:border-primary-500 transition-all ${formData.type === 'TOPIC' ? 'border-primary-600 bg-primary-50' : 'border-surface-200 bg-white'}`}>
                                    <div className="bg-blue-100 p-4 rounded-full text-blue-700"><CheckCircle size={32} /></div>
                                    <div className="text-center">
                                        <h4 className="font-bold text-surface-900 uppercase">Auto-Generate</h4>
                                        <p className="text-xs text-surface-500 mt-2">Randomly selects questions based on topic and difficulty.</p>
                                    </div>
                                </button>
                                <button onClick={() => setFormData({ ...formData, type: 'MANUAL' })} className={`p-6 border-2 flex flex-col items-center gap-4 hover:border-primary-500 transition-all ${formData.type === 'MANUAL' ? 'border-primary-600 bg-primary-50' : 'border-surface-200 bg-white'}`}>
                                    <div className="bg-purple-100 p-4 rounded-full text-purple-700"><FileText size={32} /></div>
                                    <div className="text-center">
                                        <h4 className="font-bold text-surface-900 uppercase">Question Bank</h4>
                                        <p className="text-xs text-surface-500 mt-2">Manually select specific questions from your repository.</p>
                                    </div>
                                </button>
                                <button onClick={() => setFormData({ ...formData, type: 'PDF' })} className={`p-6 border-2 flex flex-col items-center gap-4 hover:border-primary-500 transition-all ${formData.type === 'PDF' ? 'border-primary-600 bg-primary-50' : 'border-surface-200 bg-white'}`}>
                                    <div className="bg-orange-100 p-4 rounded-full text-orange-700"><Upload size={32} /></div>
                                    <div className="text-center">
                                        <h4 className="font-bold text-surface-900 uppercase">Upload PDF</h4>
                                        <p className="text-xs text-surface-500 mt-2">Upload an existing question paper file.</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="h-full flex flex-col">
                            {formData.type === 'TOPIC' && (
                                <div className="max-w-xl mx-auto bg-white p-8 shadow-sm border border-surface-200 w-full">
                                    <h3 className="text-lg font-bold text-surface-800 uppercase mb-6 border-b border-surface-200 pb-2">Topic Configuration</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Subject</label>
                                            <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Topic</label>
                                            <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })} placeholder="e.g. Algebra" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Difficulty</label>
                                                <select className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm bg-white" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                                                    <option>Easy</option><option>Medium</option><option>Hard</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Question Count</label>
                                                <input type="number" className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" value={formData.questionCount} onChange={e => setFormData({ ...formData, questionCount: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {formData.type === 'MANUAL' && (
                                <div className="flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-surface-800 uppercase">Select Questions</h3>
                                        <div className="flex gap-2">
                                            <select className="p-2 border border-surface-300 text-sm" onChange={e => setFilters({ ...filters, subject: e.target.value })}>
                                                <option value="">All Subjects</option>
                                                <option>Mathematics</option><option>Science</option>
                                            </select>
                                            <span className="bg-primary-100 text-primary-800 px-3 py-2 text-xs font-bold uppercase rounded">{formData.questionIds.length} Selected</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-auto border border-surface-200 bg-white">
                                        <table className="min-w-full divide-y divide-surface-200">
                                            <thead className="bg-surface-50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3 w-10"><input type="checkbox" /></th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Question</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider w-24">Diff</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider w-24">Topic</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-surface-200">
                                                {questions.map(q => (
                                                    <tr key={q.id} className={formData.questionIds.includes(q.id) ? 'bg-primary-50' : 'hover:bg-surface-50'}>
                                                        <td className="px-4 py-3"><input type="checkbox" checked={formData.questionIds.includes(q.id)} onChange={() => handleSelectQuestion(q.id)} /></td>
                                                        <td className="px-4 py-3 text-sm text-surface-900">{q.content}</td>
                                                        <td className="px-4 py-3 text-xs text-surface-600">{q.difficulty}</td>
                                                        <td className="px-4 py-3 text-xs text-surface-600">{q.topic}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {formData.type === 'PDF' && (
                                <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-surface-300 bg-surface-50 p-6">
                                    <Upload size={48} className="text-surface-400 mb-4" />
                                    <p className="font-bold text-surface-600">Upload Assessment PDF</p>

                                    <div className="mt-4 w-full flex flex-col items-center justify-center">
                                        {uploading ? <p className="text-primary-600 font-bold animate-pulse">Uploading...</p> :
                                            formData.pdfUrl ? (
                                                <div className="flex flex-col items-center bg-green-50 p-4 border border-green-200 rounded-sm w-full max-w-sm">
                                                    <p className="text-green-700 font-bold flex items-center gap-2"><CheckCircle size={16} /> File Uploaded</p>
                                                    <p className="text-xs text-surface-500 mt-1 break-all">{formData.pdfUrl}</p>
                                                    <button onClick={() => setFormData({ ...formData, pdfUrl: '' })} className="text-xs text-red-500 mt-2 underline hover:text-red-700">Remove</button>
                                                </div>
                                            ) : (
                                                <label className="bg-primary-700 text-white px-6 py-2 rounded-sm text-sm font-bold uppercase hover:bg-primary-800 cursor-pointer block transition-colors">
                                                    <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                                                    Choose File
                                                </label>
                                            )
                                        }
                                    </div>
                                    <p className="text-xs text-surface-500 mt-6 italic">AI parsing will be integrated later</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="max-w-xl mx-auto bg-white p-8 shadow-sm border border-surface-200 text-center">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-surface-900 uppercase mb-2">Ready to Publish?</h3>
                            <p className="text-surface-600 mb-6">
                                You are about to create <strong>{formData.title}</strong> for class <strong>{classes.find(c => c.id == formData.classroomId)?.name}</strong>.
                                {formData.type === 'MANUAL' && <span className="block mt-1">Total Questions: {formData.questionIds.length}</span>}
                            </p>
                            <div className="bg-surface-50 p-4 border border-surface-200 text-left text-sm text-surface-600 mb-6">
                                <p><strong>Duration:</strong> {formData.durationMinutes} Minutes</p>
                                <p><strong>Mode:</strong> {formData.type}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-white p-4 border-t border-surface-200 flex justify-end gap-3">
                    {step > 1 && <button onClick={() => setStep(step - 1)} className="px-6 py-2 border border-surface-300 text-surface-700 hover:bg-surface-50 text-sm font-bold uppercase flex items-center gap-2"><ArrowLeft size={16} /> Back</button>}
                    {step < 4 && <button onClick={() => setStep(step + 1)} disabled={step === 1 && (!formData.title || !formData.classroomId)} className="px-6 py-2 bg-primary-700 text-white hover:bg-primary-800 text-sm font-bold uppercase flex items-center gap-2">Next <ArrowRight size={16} /></button>}
                    {step === 4 && <button onClick={handleSubmit} className="px-8 py-2 bg-green-700 text-white hover:bg-green-800 text-sm font-bold uppercase shadow-sm">Publish Assessment</button>}
                </div>
            </div>
        </div>
    );
};

export default TestBuilder;
