import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8081';

/**
 * ReassessmentGate
 * ----------------
 * Wraps any protected page. If the student's cognitiveTrend is DECLINING,
 * it renders the "Foundation Required" enforcement banner and blocks the child.
 *
 * Usage:
 *   <ReassessmentGate>
 *     <AdvancedExamComponent />
 *   </ReassessmentGate>
 */
const ReassessmentGate = ({ children, allowRemedial = false }) => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        fetch(`${API}/api/student/my/reassessment-status`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setStatus)
            .catch(() => setStatus({ foundationRequired: false }))
            .finally(() => setLoading(false));
    }, [token]);

    const handleStartRemedial = async () => {
        setStarting(true);
        try {
            const res = await fetch(`${API}/api/student/start-remedial`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const d = await res.json();
            if (d.examId) navigate(`/student/exam/${d.examId}`);
            else alert(d.error || 'No remedial session available yet. Complete more assessments first.');
        } catch {
            alert('Failed to start remedial session.');
        } finally {
            setStarting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (status?.foundationRequired && !allowRemedial) {
        const stability = status.stabilityIndex != null ? Math.round(status.stabilityIndex) : null;
        const retention = status.retentionScore != null ? Math.round(status.retentionScore) : null;

        return (
            <div className="min-h-screen bg-gray-50 font-sans flex flex-col items-center justify-center p-6">
                {/* Enforcement Banner */}
                <div className="w-full max-w-xl bg-white border-2 border-red-600 shadow-xl overflow-hidden">

                    <div className="bg-red-700 px-6 py-5 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-200 mb-1">PARAKH Adaptive Engine · Enforcement Active</p>
                        <h1 className="text-xl font-black text-white">Foundation Reassessment Required</h1>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="bg-red-50 border border-red-200 p-4 text-sm text-red-800 font-medium leading-relaxed">
                            {status.message || 'Your cognitive trajectory is DECLINING. Advanced examinations are blocked until you complete a Foundation Reassessment.'}
                        </div>

                        {/* Cognitive metrics */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Cognitive Trend', value: status.cognitiveTrend, color: '#b91c1c' },
                                { label: 'Stability Index', value: stability != null ? `${stability}%` : '—', color: '#d97706' },
                                { label: 'Retention Score', value: retention != null ? `${retention}%` : '—', color: '#d97706' },
                                { label: 'Advanced Exams', value: 'BLOCKED', color: '#b91c1c' },
                            ].map((m, i) => (
                                <div key={i} className="border border-gray-200 p-3">
                                    <p className="text-[10px] font-bold uppercase text-gray-400">{m.label}</p>
                                    <p className="text-base font-bold font-mono mt-1" style={{ color: m.color }}>{m.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* What the student can do */}
                        <div className="border border-gray-200 p-4">
                            <p className="text-xs font-bold uppercase text-gray-600 mb-3">Permitted Actions</p>
                            <div className="space-y-2 text-xs text-gray-600">
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                                    <span>Start a <strong>Foundation Remedial Session</strong> (adaptive, targeted at weakest topic)</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                                    <span>View <strong>Progress Timeline</strong> and <strong>Competency Transcript</strong></span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                                    <span>View <strong>past results</strong> and learning roadmap</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-red-500 font-bold mt-0.5">✗</span>
                                    <span>Access advanced or new formal assessments (restricted)</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleStartRemedial}
                                disabled={starting}
                                className="flex-1 py-3 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                            >
                                {starting ? 'Starting Session…' : '→ Start Foundation Remedial Session'}
                            </button>
                            <button
                                onClick={() => navigate('/student/dashboard')}
                                className="px-4 py-3 border border-gray-300 text-xs font-bold uppercase text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Dashboard
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center">
                        <p className="text-[10px] text-gray-400">
                            This restriction will lift automatically once your cognitive stability index exceeds 60% across 3 consecutive sessions.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Not declining — render children (or show a "remedial only" notice inline)
    return (
        <>
            {status?.foundationRequired && allowRemedial && (
                <div className="bg-amber-50 border-b border-amber-300 px-6 py-2 flex items-center gap-3">
                    <span className="text-amber-700 text-xs font-bold">⚠</span>
                    <p className="text-xs font-bold text-amber-800">
                        REMEDIAL-ONLY MODE ACTIVE — Your cognitive trend is DECLINING. You are in a targeted remediation session.
                    </p>
                </div>
            )}
            {children}
        </>
    );
};

export default ReassessmentGate;
