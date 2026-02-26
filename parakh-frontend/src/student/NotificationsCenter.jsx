import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8081';

const TYPE_CONFIG = {
    NEW_ASSESSMENT: { label: 'New Assessment', icon: '📋', bg: '#eff6ff', border: '#2563eb', text: '#1d4ed8', pillBg: 'bg-blue-100 text-blue-700 border-blue-300' },
    RISK_ALERT: { label: 'Risk Alert', icon: '⚠️', bg: '#fef2f2', border: '#dc2626', text: '#b91c1c', pillBg: 'bg-red-100 text-red-700 border-red-300' },
    COGNITIVE_ALERT: { label: 'Cognitive Alert', icon: '🧠', bg: '#fdf4ff', border: '#9333ea', text: '#7e22ce', pillBg: 'bg-purple-100 text-purple-700 border-purple-300' },
    REMEDIAL_RECOMMENDATION: { label: 'Remedial Practice', icon: '🎯', bg: '#fffbeb', border: '#d97706', text: '#b45309', pillBg: 'bg-amber-100 text-amber-700 border-amber-300' },
    SYSTEM: { label: 'System Notice', icon: 'ℹ️', bg: '#f8fafc', border: '#94a3b8', text: '#475569', pillBg: 'bg-slate-100 text-slate-600 border-slate-300' },
};

const PRIORITY_BADGE = {
    CRITICAL: 'bg-red-600 text-white',
    HIGH: 'bg-orange-500 text-white',
    MEDIUM: 'bg-amber-400 text-gray-900',
    LOW: 'bg-gray-200 text-gray-600',
};

const NotificationsCenter = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [dismissed, setDismissed] = useState(new Set());

    useEffect(() => {
        fetch(`${API}/api/student/my/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    const handleAction = async (n) => {
        if (n.action === 'START_EXAM' && n.assessmentId) {
            try {
                const res = await fetch(`${API}/api/student/assessments/${n.assessmentId}/start`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                });
                const d = await res.json();
                if (d.examId) navigate(`/student/exam/${d.examId}`);
                else alert(d.message || 'Could not start exam');
            } catch { alert('Failed to start exam'); }
        } else if (n.action === 'START_REMEDIAL') {
            try {
                const res = await fetch(`${API}/api/student/start-remedial`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                });
                const d = await res.json();
                if (d.examId) navigate(`/student/exam/${d.examId}`);
                else alert(d.error || 'No remedial exam.');
            } catch { alert('Failed to start remedial session'); }
        } else if (n.action === 'VIEW_REMEDIATION') {
            navigate('/student/result');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Notifications…</p>
            </div>
        </div>
    );

    const all = (data?.notifications || []).filter(n => !dismissed.has(n.id));
    const types = ['ALL', ...new Set(all.map(n => n.type))];
    const visible = filter === 'ALL' ? all : all.filter(n => n.type === filter);
    const critCount = all.filter(n => n.priority === 'CRITICAL' || n.priority === 'HIGH').length;

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/student/dashboard')} className="text-xs font-bold text-blue-700 hover:underline uppercase">
                        ← Dashboard
                    </button>
                    <span className="text-gray-300">|</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-700">Notifications Centre</span>
                    {critCount > 0 && (
                        <span className="ml-1 px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full">{critCount}</span>
                    )}
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">{all.length} active · {data?.generatedAt?.split('T')[0]}</span>
            </div>

            <div className="max-w-3xl mx-auto p-6 space-y-4">

                {/* Summary Bar */}
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { label: 'Total', v: all.length, color: '#1e40af' },
                        { label: 'Critical', v: all.filter(n => n.priority === 'CRITICAL').length, color: '#dc2626' },
                        { label: 'High', v: all.filter(n => n.priority === 'HIGH').length, color: '#ea580c' },
                        { label: 'Unread', v: all.length, color: '#7c3aed' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white border border-gray-200 p-4 text-center">
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">{s.label}</p>
                            <p className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.v}</p>
                        </div>
                    ))}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1.5 flex-wrap">
                    {types.map(t => {
                        const cfg = TYPE_CONFIG[t];
                        return (
                            <button key={t} onClick={() => setFilter(t)}
                                className={`px-3 py-1.5 text-[10px] font-bold uppercase border transition-colors ${filter === t
                                    ? 'bg-blue-800 text-white border-blue-800'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                                {cfg ? `${cfg.icon} ${cfg.label}` : 'All'}
                            </button>
                        );
                    })}
                    {dismissed.size > 0 && (
                        <button onClick={() => setDismissed(new Set())}
                            className="ml-auto px-3 py-1.5 text-[10px] font-bold uppercase border border-gray-200 text-gray-500 hover:bg-gray-50">
                            Restore {dismissed.size} dismissed
                        </button>
                    )}
                </div>

                {/* Notification Cards */}
                {visible.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-gray-200 bg-white">
                        <p className="text-2xl mb-2">🎉</p>
                        <p className="text-sm font-bold text-gray-700">All clear!</p>
                        <p className="text-xs text-gray-400 mt-1">No active notifications.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visible.map((n) => {
                            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG['SYSTEM'];
                            const hasAction = n.action && n.action !== null;
                            return (
                                <div key={n.id} className="bg-white border shadow-sm flex overflow-hidden"
                                    style={{ borderColor: cfg.border, borderLeftWidth: 4 }}>
                                    <div className="flex-1 p-4">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{cfg.icon}</span>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{n.title}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${PRIORITY_BADGE[n.priority] || ''}`}>
                                                            {n.priority}
                                                        </span>
                                                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 border rounded ${cfg.pillBg}`}>
                                                            {cfg.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => setDismissed(prev => new Set([...prev, n.id]))}
                                                className="text-gray-300 hover:text-gray-600 text-lg leading-none flex-shrink-0" title="Dismiss">×</button>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed mb-3">{n.message}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono text-gray-400">{n.timestamp}</span>
                                            {hasAction && (
                                                <button onClick={() => handleAction(n)}
                                                    className="px-3 py-1.5 text-[10px] font-bold uppercase text-white transition-colors"
                                                    style={{ background: cfg.border }}>
                                                    {n.action === 'START_EXAM' ? 'Start Exam →'
                                                        : n.action === 'START_REMEDIAL' ? 'Start Remedial →'
                                                            : n.action === 'VIEW_REMEDIATION' ? 'View Remediation →'
                                                                : 'Act →'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <p className="text-[10px] text-center text-gray-400">
                    Notifications are generated dynamically from your academic profile and assessment state.
                </p>
            </div>
        </div>
    );
};

export default NotificationsCenter;
