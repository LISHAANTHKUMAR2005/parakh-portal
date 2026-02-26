import React, { useState, useEffect } from 'react';
import { Activity, Shield, Clock, Search, ChevronRight, User, AlertCircle, TrendingUp, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API = 'http://localhost:8081';

const LiveMonitor = ({ user }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState(null);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 10000); // 10s polling
        return () => clearInterval(interval);
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetch(`${API}/api/teacher/live-sessions`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
                if (selectedSession) {
                    const updated = data.find(s => s.examId === selectedSession.examId);
                    if (updated) setSelectedSession(updated);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = sessions.filter(s =>
        s.studentName.toLowerCase().includes(filter.toLowerCase()) ||
        s.studentEmail.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
            {/* Header Area */}
            <div className="bg-white border-b border-slate-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Real-Time Monitor</p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            <Activity size={24} className="text-blue-600 animate-pulse" />
                            Live Assessment Sessions
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search student..."
                                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-sm text-sm focus:ring-2 focus:ring-blue-500 w-64"
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xl font-bold text-blue-600">{sessions.length}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Students</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatusStat label="Avg Integrity" value={`${sessions.length ? (sessions.reduce((a, b) => a + (b.integrityScore || 100), 0) / sessions.length).toFixed(1) : 100}%`} color="indigo" />
                    <StatusStat label="Total Violations" value={sessions.reduce((a, b) => a + (b.violationCount || 0), 0)} color="red" />
                    <StatusStat label="Avg Question Progress" value={`${sessions.length ? (sessions.reduce((a, b) => a + ((b.answeredCount || 0) / (b.totalQuestions || 1) * 100), 0) / sessions.length).toFixed(1) : 0}%`} color="emerald" />
                </div>
            </div>

            {/* List and Detail Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Session List */}
                <div className="w-1/2 border-r border-slate-200 overflow-y-auto bg-white p-4 space-y-3">
                    {filtered.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                            <div className="p-6 bg-slate-50 rounded-full">💤</div>
                            <p className="font-bold text-sm uppercase tracking-wider">No active sessions found</p>
                        </div>
                    ) : (
                        filtered.map(s => (
                            <SessionCard
                                key={s.examId}
                                session={s}
                                active={selectedSession?.examId === s.examId}
                                onClick={() => setSelectedSession(s)}
                            />
                        ))
                    )}
                </div>

                {/* Vertical Drilldown */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
                    {selectedSession ? (
                        <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="bg-white border border-slate-200 p-8 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <User size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900">{selectedSession.studentName}</h2>
                                            <p className="text-sm text-slate-500 font-mono">{selectedSession.studentEmail}</p>
                                        </div>
                                        <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-sm">
                                            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">In Progress</p>
                                            <p className="text-xs font-bold text-slate-700">{selectedSession.assessmentTitle}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6 mb-8">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Progress</p>
                                            <p className="text-xl font-bold text-slate-800">{selectedSession.answeredCount} / {selectedSession.totalQuestions}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time/Question</p>
                                            <p className="text-xl font-bold text-slate-800">{selectedSession.avgTimePerQuestion || 0}s</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Integrity</p>
                                            <p className={`text-xl font-bold ${selectedSession.integrityScore < 80 ? 'text-red-600' : 'text-emerald-600'}`}>{selectedSession.integrityScore.toFixed(1)}%</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-sm border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <AdaptiveLabel label="Difficulty" value={selectedSession.currentDifficulty} color="#1d4ed8" />
                                            <AdaptiveLabel label="Bloom Level" value={selectedSession.currentBloom} color="#6366f1" />
                                            <AdaptiveLabel label="Current Topic" value={selectedSession.currentTopic} color="#0891b2" />
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400">SESSION START: {new Date(selectedSession.startTime).toLocaleTimeString()}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white border border-slate-200 p-6 shadow-sm">
                                    <h3 className="text-xs font-bold text-slate-800 uppercase mb-4 tracking-wider flex items-center gap-2">
                                        <TrendingUp size={14} className="text-blue-500" /> Adaptive Trajectory
                                    </h3>
                                    <div className="h-[200px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={(selectedSession.difficultyHistory || []).map((d, i) => ({
                                                index: i + 1,
                                                val: d === 'HARD' ? 3 : d === 'MEDIUM' ? 2 : 1
                                            }))}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="index" tick={{ fontSize: 10 }} />
                                                <YAxis domain={[0, 4]} ticks={[1, 2, 3]} tick={{ fontSize: 10 }} />
                                                <Tooltip />
                                                <Line type="stepAfter" dataKey="val" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 p-6 shadow-sm">
                                    <h3 className="text-xs font-bold text-slate-800 uppercase mb-4 tracking-wider flex items-center gap-2">
                                        <Shield size={14} className="text-red-500" /> Violation Timeline
                                    </h3>
                                    <div className="space-y-3 max-h-[200px] overflow-y-auto">
                                        {selectedSession.violationTimeline?.length > 0 ? (
                                            selectedSession.violationTimeline.map((evt, i) => (
                                                <div key={i} className="flex gap-2 text-[11px] p-2 bg-red-50 text-red-700 border-l-2 border-red-500 rounded-sm">
                                                    <span className="font-bold">⚠️</span>
                                                    <span>{evt}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10 italic text-xs">
                                                No violations detected
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button className="w-full py-4 bg-red-600 text-white font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-red-700 transition-colors shadow-lg">
                                Terminate Session
                            </button>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                            <div className="text-6xl">🔍</div>
                            <p className="font-bold text-xs uppercase tracking-widest">Select a student to drill down</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SessionCard = ({ session, active, onClick }) => {
    const progress = (session.answeredCount / session.totalQuestions) * 100;
    return (
        <div
            onClick={onClick}
            className={`p-4 border border-slate-200 cursor-pointer transition-all hover:border-blue-400 group ${active ? 'bg-blue-50 border-blue-600 shadow-md ring-1 ring-blue-600' : 'bg-white'}`}
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700">{session.studentName}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">{session.assessmentTitle}</p>
                </div>
                <div className={`p-1 rounded-full ${session.violationCount > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {session.violationCount > 0 ? <AlertCircle size={14} /> : <Shield size={14} />}
                </div>
            </div>

            <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">{Math.round(progress)}%</span>
            </div>

            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="flex gap-3">
                    <span className="flex items-center gap-1"><Clock size={10} /> {session.avgTimePerQuestion}s/Q</span>
                    <span className="flex items-center gap-1"><Activity size={10} /> {session.currentDifficulty}</span>
                </div>
                <ChevronRight size={14} className={`${active ? 'text-blue-600 translate-x-0' : 'text-slate-300 -translate-x-2'} transition-all`} />
            </div>
        </div>
    );
};

const StatusStat = ({ label, value, color }) => {
    const colors = {
        indigo: 'text-indigo-600 bg-indigo-50',
        red: 'text-red-600 bg-red-50',
        emerald: 'text-emerald-600 bg-emerald-50'
    };
    return (
        <div className={`p-4 rounded-sm border border-slate-100 flex justify-between items-center ${colors[color]}`}>
            <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            <span className="text-lg font-bold">{value}</span>
        </div>
    );
};

const AdaptiveLabel = ({ label, value, color }) => (
    <div>
        <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">{label}</p>
        <p className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border" style={{ borderColor: `${color}30`, background: `${color}10`, color }}>
            {value}
        </p>
    </div>
);

export default LiveMonitor;
