import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const API = 'http://localhost:8081';

const BADGE_MAP = {
    IMPROVING: { label: 'Improving', bg: '#f0fdf4', border: '#16a34a', text: '#15803d', icon: '↑', desc: 'Performance is on an upward trajectory. Keep up consistent practice.' },
    DECLINING: { label: 'Declining', bg: '#fef2f2', border: '#dc2626', text: '#b91c1c', icon: '↓', desc: 'Performance is declining. Foundational reassessment has been initiated.' },
    STABLE: { label: 'Stable', bg: '#eff6ff', border: '#2563eb', text: '#1d4ed8', icon: '→', desc: 'Performance is stable. Increasing challenge level is recommended.' },
    INSUFFICIENT_DATA: { label: 'Insufficient Data', bg: '#f8fafc', border: '#94a3b8', text: '#64748b', icon: '○', desc: 'Complete at least 3 assessments to generate your cognitive trajectory.' },
};

const ChartPanel = ({ title, sub, data, dataKey, color, domain, refLine, refColor }) => (
    <div className="bg-white border border-gray-200 shadow-sm p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-800 mb-0.5">{title}</h3>
        <p className="text-[10px] text-gray-400 mb-4">{sub}</p>
        {data.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 text-xs italic">
                No data yet
            </div>
        ) : (
            <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis domain={domain || [0, 100]} tick={{ fontSize: 10 }} width={28} />
                    <Tooltip contentStyle={{ fontSize: 10, borderRadius: 0 }} />
                    {refLine && <ReferenceLine y={refLine} stroke={refColor || '#94a3b8'} strokeDasharray="4 4" label={{ value: `${refLine}`, fontSize: 9, fill: refColor }} />}
                    <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5}
                        fill={`url(#grad-${dataKey})`} dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
            </ResponsiveContainer>
        )}
    </div>
);

const ProgressTimeline = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API}/api/student/my/progress-timeline`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Timeline…</p>
            </div>
        </div>
    );

    const timeline = data?.timeline || [];
    const intTimeline = data?.integrityTimeline || [];
    const badge = BADGE_MAP[data?.trajectoryBadge] || BADGE_MAP['INSUFFICIENT_DATA'];

    // Summary stats
    const last = timeline[timeline.length - 1] || {};
    const first = timeline[0] || {};
    const acDelta = ((last.academicScore ?? 0) - (first.academicScore ?? 0)).toFixed(1);
    const confDelta = ((last.confidenceScore ?? 0) - (first.confidenceScore ?? 0)).toFixed(1);

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/student/dashboard')} className="text-xs font-bold text-blue-700 hover:underline uppercase">
                        ← Dashboard
                    </button>
                    <span className="text-gray-300">|</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-700">Progress Timeline</span>
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">{data?.totalDataPoints ?? 0} data points</span>
            </div>

            <div className="max-w-5xl mx-auto p-6 space-y-5">

                {/* Cognitive Trajectory Badge */}
                <div className="border p-5 flex items-center justify-between flex-wrap gap-4"
                    style={{ background: badge.bg, borderColor: badge.border }}>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: badge.text }}>
                            Cognitive Trajectory
                        </p>
                        <div className="flex items-center gap-3">
                            <span className="text-4xl font-black font-mono" style={{ color: badge.text }}>{badge.icon}</span>
                            <div>
                                <p className="text-xl font-bold" style={{ color: badge.text }}>{badge.label}</p>
                                <p className="text-xs mt-0.5 max-w-sm" style={{ color: badge.text + 'cc' }}>{badge.desc}</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-right">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-500">Academic Δ</p>
                            <p className={`text-lg font-bold font-mono ${parseFloat(acDelta) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {parseFloat(acDelta) >= 0 ? '+' : ''}{acDelta}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-500">Confidence Δ</p>
                            <p className={`text-lg font-bold font-mono ${parseFloat(confDelta) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {parseFloat(confDelta) >= 0 ? '+' : ''}{confDelta}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4 Charts grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ChartPanel
                        title="Academic Score"
                        sub="Overall academic performance across sessions"
                        data={timeline}
                        dataKey="academicScore"
                        color="#1d4ed8"
                        refLine={60}
                        refColor="#dc2626"
                    />
                    <ChartPanel
                        title="Risk Score"
                        sub="Composite academic risk level (lower = safer)"
                        data={timeline}
                        dataKey="riskScore"
                        color="#dc2626"
                        refLine={60}
                        refColor="#dc2626"
                    />
                    <ChartPanel
                        title="Confidence Score"
                        sub="Answer confidence calibration index"
                        data={timeline}
                        dataKey="confidenceScore"
                        color="#059669"
                    />
                    <ChartPanel
                        title="Integrity Score"
                        sub="Exam integrity per session (higher = more secure)"
                        data={intTimeline.map(d => ({ date: d.date, integrityScore: d.integrityScore }))}
                        dataKey="integrityScore"
                        color="#7c3aed"
                        refLine={70}
                        refColor="#d97706"
                    />
                </div>

                {/* Combined Table */}
                {timeline.length > 0 && (
                    <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700">Session Data Table</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-100 text-xs">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Date', 'Academic', 'Risk', 'Confidence', 'Risk Level'].map(h => (
                                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase text-gray-500">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[...timeline].reverse().map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 font-mono text-gray-700">{row.date}</td>
                                        <td className="px-4 py-2 font-bold text-blue-700">{Math.round(row.academicScore ?? 0)}</td>
                                        <td className="px-4 py-2 font-bold text-red-600">{Math.round(row.riskScore ?? 0)}</td>
                                        <td className="px-4 py-2 font-bold text-green-700">{Math.round(row.confidenceScore ?? 0)}</td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${row.riskIndicator === 'HIGH' ? 'bg-red-100 text-red-700' :
                                                    row.riskIndicator === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-green-100 text-green-700'
                                                }`}>{row.riskIndicator || 'LOW'}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Integrity timeline if separate */}
                {intTimeline.length > 0 && (
                    <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700">Integrity History</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-100 text-xs">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Date', 'Assessment', 'Integrity Score', 'Status'].map(h => (
                                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase text-gray-500">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[...intTimeline].reverse().map((row, i) => {
                                    const s = row.integrityScore;
                                    return (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 font-mono text-gray-700">{row.date}</td>
                                            <td className="px-4 py-2 text-gray-700">{row.examTitle}</td>
                                            <td className="px-4 py-2 font-bold font-mono" style={{ color: s >= 90 ? '#16a34a' : s >= 70 ? '#d97706' : '#dc2626' }}>
                                                {Math.round(s)}/100
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${s >= 90 ? 'bg-green-100 text-green-700 border-green-300' :
                                                        s >= 70 ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                                            'bg-red-100 text-red-700 border-red-300'
                                                    }`}>{s >= 90 ? 'Secure' : s >= 70 ? 'Under Review' : 'Flagged'}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressTimeline;
