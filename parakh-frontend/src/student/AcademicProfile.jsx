import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const API = 'http://localhost:8081';

const trendColor = (t) => {
    if (t === 'IMPROVING') return { bg: '#f0fdf4', border: '#16a34a', text: '#15803d', icon: '↑' };
    if (t === 'DECLINING') return { bg: '#fef2f2', border: '#dc2626', text: '#b91c1c', icon: '↓' };
    return { bg: '#f8fafc', border: '#64748b', text: '#475569', icon: '→' };
};

const MetricBar = ({ label, value, color }) => (
    <div>
        <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 mb-1">
            <span>{label}</span><span>{Math.round(value ?? 0)}%</span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, value ?? 0)}%`, background: color }} />
        </div>
    </div>
);

const AcademicProfile = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const printRef = useRef();

    useEffect(() => {
        const headers = { Authorization: `Bearer ${token}` };
        fetch(`${API}/api/student/my/profile`, { headers })
            .then(r => r.json())
            .then(setProfile)
            .catch(() => setError('Failed to load profile'))
            .finally(() => setLoading(false));
    }, [token]);

    const handleDownloadPDF = async () => {
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: html2canvas } = await import('html2canvas');
            const canvas = await html2canvas(printRef.current, { scale: 1.5, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (canvas.height * pageWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
            pdf.save(`Academic_Profile_${profile?.name?.replace(/\s+/g, '_')}.pdf`);
        } catch (e) {
            alert('PDF generation failed: ' + e.message);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Profile…</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center text-red-600"><p className="font-bold">{error}</p></div>
        </div>
    );

    const cog = profile?.cognitiveProfile || {};
    const riskHistory = profile?.riskHistory || [];
    const trend = trendColor(cog.cognitiveTrend);

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/student/dashboard')} className="text-xs font-bold text-blue-700 hover:underline uppercase">
                        ← Dashboard
                    </button>
                    <span className="text-gray-300">|</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-700">Academic Profile</span>
                </div>
                <button
                    onClick={handleDownloadPDF}
                    className="px-4 py-2 bg-blue-800 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-900 transition-colors"
                >
                    ⬇ Download Transcript (PDF)
                </button>
            </div>

            <div ref={printRef} className="max-w-5xl mx-auto p-6 space-y-6">

                {/* ── Personal Details Card ──────────────────────────────────── */}
                <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-blue-900 px-6 py-4">
                        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-[0.2em]">PARAKH Examination System · Academic Profile</p>
                        <h1 className="text-xl font-bold text-white mt-1">{profile?.name}</h1>
                        <p className="text-sm text-blue-200 mt-0.5">{profile?.email}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
                        {[
                            { label: 'Role', value: profile?.role },
                            { label: 'Enrolled', value: profile?.enrolledAt ? profile.enrolledAt.split('T')[0] : '—' },
                            { label: 'Exams Completed', value: profile?.examsCompleted ?? 0 },
                            { label: 'Avg. Integrity Score', value: `${profile?.avgIntegrityScore ?? 100}/100` },
                        ].map((item, i) => (
                            <div key={i} className="px-5 py-4">
                                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">{item.label}</p>
                                <p className="text-sm font-bold text-gray-900">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Cognitive Profile Metrics ─────────────────────────────── */}
                <div className="bg-white border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-700">Cognitive Profile Metrics</h2>
                            <p className="text-[10px] text-gray-400 mt-0.5">Longitudinal intelligence indicators computed from all sessions</p>
                        </div>
                        <div className="px-3 py-1.5 border text-xs font-bold uppercase" style={{ background: trend.bg, borderColor: trend.border, color: trend.text }}>
                            {trend.icon} {cog.cognitiveTrend || 'UNKNOWN'}
                        </div>
                    </div>

                    {Object.keys(cog).length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Complete at least 3 exams to generate cognitive metrics.</p>
                    ) : (
                        <div className="space-y-4">
                            <MetricBar label="Learning Stability Index" value={cog.stabilityIndex} color="#1d4ed8" />
                            <MetricBar label="Retention Score" value={cog.retentionScore} color="#0891b2" />
                            <MetricBar label="Acceleration Score" value={cog.accelerationScore} color="#7c3aed" />

                            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                                {[
                                    { label: 'Stability', v: cog.stabilityIndex, color: '#1d4ed8', desc: 'Performance consistency' },
                                    { label: 'Retention', v: cog.retentionScore, color: '#0891b2', desc: 'Mastery over time' },
                                    { label: 'Acceleration', v: cog.accelerationScore, color: '#7c3aed', desc: 'Learning velocity' },
                                ].map((m, i) => (
                                    <div key={i} className="bg-gray-50 border border-gray-200 p-4 text-center">
                                        <p className="text-[10px] font-bold uppercase text-gray-400">{m.label}</p>
                                        <p className="text-2xl font-bold font-mono mt-1" style={{ color: m.color }}>{Math.round(m.v ?? 0)}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{m.desc}</p>
                                    </div>
                                ))}
                            </div>

                            {cog.lastUpdated && (
                                <p className="text-[10px] text-gray-400 text-right">
                                    Last updated: {typeof cog.lastUpdated === 'string' ? cog.lastUpdated.split('T')[0] : '—'}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Risk History Timeline ─────────────────────────────────── */}
                <div className="bg-white border border-gray-200 shadow-sm p-6">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-1">Risk History Timeline</h2>
                    <p className="text-[10px] text-gray-400 mb-5">Academic score vs. risk score across assessment sessions</p>

                    {riskHistory.length === 0 ? (
                        <div className="py-10 text-center text-gray-400 border-2 border-dashed border-gray-200">
                            <p className="text-sm font-bold">No History Yet</p>
                            <p className="text-xs mt-1">Complete assessments to generate a risk timeline.</p>
                        </div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={riskHistory} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="acGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.12} />
                                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 0 }} />
                                    <Legend wrapperStyle={{ fontSize: 10 }} />
                                    <Area type="monotone" dataKey="academicScore" name="Academic Score"
                                        stroke="#1d4ed8" strokeWidth={2} fill="url(#acGrad)" dot={{ r: 3 }} />
                                    <Area type="monotone" dataKey="riskScore" name="Risk Score"
                                        stroke="#dc2626" strokeWidth={2} fill="url(#riskGrad)" dot={{ r: 3 }} />
                                </AreaChart>
                            </ResponsiveContainer>

                            {/* Risk event table */}
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            {['Date', 'Academic Score', 'Risk Score', 'Risk Level'].map(h => (
                                                <th key={h} className="px-4 py-2 text-left font-bold uppercase text-gray-500 text-[10px]">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {riskHistory.map((r, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 font-mono text-gray-700">{r.date}</td>
                                                <td className="px-4 py-2 font-bold text-blue-700">{Math.round(r.academicScore ?? 0)}</td>
                                                <td className="px-4 py-2 font-bold text-red-600">{Math.round(r.riskScore ?? 0)}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${r.riskIndicator === 'HIGH' ? 'bg-red-100 text-red-700' :
                                                            r.riskIndicator === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-green-100 text-green-700'
                                                        }`}>{r.riskIndicator || 'LOW'}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center text-[10px] text-gray-400 pb-4">
                    PARAKH Examination System · Academic Profile · Generated {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
                </div>
            </div>
        </div>
    );
};

export default AcademicProfile;
