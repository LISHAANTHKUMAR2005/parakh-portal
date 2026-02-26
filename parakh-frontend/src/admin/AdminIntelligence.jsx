import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie
} from 'recharts';
import { Shield, TrendingUp, AlertTriangle, BarChart3, PieChart as PieIcon, Activity, Table } from 'lucide-react';
import { Skeleton, EmptyState } from '../components/SharedUI';
import LazyRender from '../components/LazyRender';

const API = 'http://localhost:8081';

const AdminIntelligence = () => {
    const { user } = useAuth();
    const [institutionData, setInstitutionData] = useState(null);
    const [competencyData, setCompetencyData] = useState(null);
    const [trendData, setTrendData] = useState(null);
    const [benchmarkData, setBenchmarkData] = useState(null);
    const [benchmarkLoading, setBenchmarkLoading] = useState(false);
    const [integrityData, setIntegrityData] = useState(null);
    const [integrityLoading, setIntegrityLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('performance');

    useEffect(() => {
        fetchAll();
    }, []);

    useEffect(() => {
        if (activeTab === 'institutional' && !benchmarkData) {
            fetchBenchmark();
        }
        if (activeTab === 'integrity' && !integrityData) {
            fetchIntegrityStats();
        }
    }, [activeTab]);

    const fetchIntegrityStats = async () => {
        setIntegrityLoading(true);
        try {
            const res = await fetch(`${API}/api/admin/integrity-stats`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            if (res.ok) setIntegrityData(await res.json());
        } catch (e) { console.error(e); }
        finally { setIntegrityLoading(false); }
    };

    const fetchBenchmark = async () => {
        setBenchmarkLoading(true);
        try {
            const res = await fetch(`${API}/api/admin/institutional-benchmark`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            if (res.ok) setBenchmarkData(await res.json());
        } catch (e) { console.error(e); }
        finally { setBenchmarkLoading(false); }
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${user?.token}` };
            const [instRes, compRes, trendRes] = await Promise.all([
                fetch(`${API}/api/admin/intelligence/institution-performance`, { headers }),
                fetch(`${API}/api/admin/intelligence/competency-gap`, { headers }),
                fetch(`${API}/api/admin/intelligence/performance-trend`, { headers }),
            ]);
            if (instRes.ok) setInstitutionData(await instRes.json());
            if (compRes.ok) setCompetencyData(await compRes.json());
            if (trendRes.ok) setTrendData(await trendRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const institutionChartData = Object.entries(institutionData?.institutionPerformance || {})
        .map(([name, score]) => ({ name: name.length > 14 ? name.substring(0, 12) + '..' : name, score }))
        .sort((a, b) => b.score - a.score);

    const competencyGapData = Object.entries(competencyData?.competencyGap || {})
        .map(([code, gap]) => ({ code, gap }))
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 10);

    const performanceTrend = (trendData?.performanceTrend || []).map(t => ({
        date: t.date, score: t.avgScore, count: t.count
    }));

    const tabs = [
        { id: 'performance', label: 'Institution Performance' },
        { id: 'competency', label: 'Competency Gap Analysis' },
        { id: 'trend', label: 'Performance Trend' },
        { id: 'institutional', label: '🏛 Institutional Benchmark' },
        { id: 'gap-dashboard', label: '🚨 Gap Dashboard' },
        { id: 'integrity', label: '🛡 Integrity Monitoring' },
    ];

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-700 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-surface-600 font-bold uppercase text-sm">Loading National Intelligence...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="mb-6 border-b border-surface-200 pb-4">
                <h2 className="text-2xl font-bold text-surface-900 uppercase tracking-tight">
                    🧩 Educational Intelligence View
                </h2>
                <p className="text-sm text-surface-500 mt-1">
                    PARAKH NEP 2020 — National Competency Analytics Dashboard
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-surface-100 border border-surface-200 mb-6 overflow-hidden rounded-sm">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === tab.id
                            ? 'bg-primary-800 text-white'
                            : 'text-surface-600 hover:bg-surface-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Institution Performance ─────────────────────────────────── */}
            {activeTab === 'performance' && (
                <div className="space-y-6">
                    <div className="bg-white border border-surface-200 p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-surface-800 uppercase mb-1">Institution Performance Comparison</h3>
                        <p className="text-xs text-surface-500 mb-5">Average academic score per institution (based on completed PARAKH assessments)</p>
                        {institutionChartData.length > 0 ? (
                            <LazyRender height={260}>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={institutionChartData} barSize={40}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                                        <Tooltip formatter={v => `${v}%`} />
                                        <Bar dataKey="score" name="Avg Score" radius={[3, 3, 0, 0]}>
                                            {institutionChartData.map((entry, idx) => (
                                                <Cell key={idx} fill={
                                                    entry.score >= 75 ? '#16a34a' :
                                                        entry.score >= 50 ? '#0891b2' :
                                                            entry.score >= 25 ? '#d97706' : '#dc2626'
                                                } />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </LazyRender>
                        ) : (
                            <div className="h-52 flex items-center justify-center border-2 border-dashed border-surface-200">
                                <div className="text-center text-surface-400">
                                    <p className="text-3xl mb-2">🏛️</p>
                                    <p className="italic text-sm">No institution data yet. Students need to specify their institution on registration.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="bg-white border border-surface-200 p-4 shadow-sm">
                        <p className="text-xs font-bold text-surface-600 uppercase mb-3">Performance Classification</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { color: '#16a34a', bg: '#f0fdf4', label: 'Excellent', range: '≥75%' },
                                { color: '#0891b2', bg: '#f0f9ff', label: 'Good', range: '50–74%' },
                                { color: '#d97706', bg: '#fffbeb', label: 'Average', range: '25–49%' },
                                { color: '#dc2626', bg: '#fef2f2', label: 'Poor', range: '<25%' },
                            ].map(({ color, bg, label, range }) => (
                                <div key={label} className="flex items-center gap-2 p-2 rounded border border-surface-200" style={{ background: bg }}>
                                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
                                    <div>
                                        <div className="text-xs font-bold" style={{ color }}>{label}</div>
                                        <div className="text-[10px] text-surface-500">{range}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Competency Gap Analysis ─────────────────────────────────── */}
            {activeTab === 'competency' && (
                <div className="space-y-6">
                    <div className="bg-white border border-surface-200 p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-surface-800 uppercase mb-1">Competency Gap Analysis</h3>
                        <p className="text-xs text-surface-500 mb-5">Top 10 competency codes with highest failure rates (100% = never answered correctly)</p>
                        {competencyGapData.length > 0 ? (
                            <LazyRender height={280}>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={competencyGapData} layout="vertical" barSize={18}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                                        <YAxis type="category" dataKey="code" tick={{ fontSize: 10 }} width={100} />
                                        <Tooltip formatter={v => [`${v}% gap`, 'Competency Gap']} />
                                        <Bar dataKey="gap" name="Gap %" radius={[0, 3, 3, 0]}>
                                            {competencyGapData.map((entry, idx) => (
                                                <Cell key={idx} fill={entry.gap >= 75 ? '#dc2626' : entry.gap >= 50 ? '#d97706' : '#16a34a'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </LazyRender>
                        ) : (
                            <div className="h-52 flex items-center justify-center border-2 border-dashed border-surface-200">
                                <div className="text-center text-surface-400">
                                    <p className="text-3xl mb-2">🎯</p>
                                    <p className="italic text-sm">No competency data yet. Tag questions with competency codes to see gap analysis.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {competencyGapData.length > 0 && (
                        <div className="bg-white border border-surface-200 shadow-sm overflow-hidden">
                            <div className="p-4 bg-surface-50 border-b border-surface-200">
                                <p className="text-xs font-bold text-surface-700 uppercase">Competency Gap Table</p>
                            </div>
                            <table className="min-w-full divide-y divide-surface-100">
                                <thead className="bg-surface-50">
                                    <tr>
                                        {['Rank', 'Competency Code', 'Gap %', 'Status', 'Questions Tagged'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-bold text-surface-500 uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-100">
                                    {competencyGapData.map((row, i) => {
                                        const status = row.gap >= 75 ? 'Critical' : row.gap >= 50 ? 'Needs Attention' : 'Acceptable';
                                        const statusColor = row.gap >= 75 ? '#dc2626' : row.gap >= 50 ? '#d97706' : '#16a34a';
                                        const qCount = competencyData?.competencyQuestionCount?.[row.code] || 0;
                                        return (
                                            <tr key={i} className="hover:bg-surface-50">
                                                <td className="px-4 py-3 text-sm font-mono font-bold text-surface-500">#{i + 1}</td>
                                                <td className="px-4 py-3 text-sm font-mono font-bold text-surface-900">{row.code}</td>
                                                <td className="px-4 py-3 text-sm font-bold" style={{ color: statusColor }}>{row.gap}%</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: statusColor, background: row.gap >= 75 ? '#fef2f2' : row.gap >= 50 ? '#fffbeb' : '#f0fdf4' }}>{status}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono text-surface-600">{qCount}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Performance Trend ─────────────────────────────────── */}
            {activeTab === 'trend' && (
                <div className="bg-white border border-surface-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-surface-800 uppercase mb-1">National Performance Trend</h3>
                    <p className="text-xs text-surface-500 mb-5">Average score across all completed assessments over time</p>
                    {performanceTrend.length > 0 ? (
                        <>
                            <LazyRender height={280}>
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={performanceTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                                        <Tooltip formatter={(v, name) => name === 'score' ? [`${v}%`, 'Avg Score'] : [v, 'Exams']} />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        <Line type="monotone" dataKey="score" name="Avg Score %" stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 4 }} />
                                        <Line type="monotone" dataKey="count" name="Exam Count" stroke="#7c3aed" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </LazyRender>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                {[
                                    { label: 'Best Score', value: `${Math.max(...performanceTrend.map(d => d.score))}%`, color: '#16a34a' },
                                    { label: 'Avg Score', value: `${Math.round(performanceTrend.reduce((a, b) => a + b.score, 0) / performanceTrend.length)}%`, color: '#1d4ed8' },
                                    { label: 'Total Exams', value: performanceTrend.reduce((a, b) => a + b.count, 0), color: '#7c3aed' },
                                ].map((item, i) => (
                                    <div key={i} className="bg-surface-50 border border-surface-200 p-3 text-center">
                                        <div className="text-xl font-bold" style={{ color: item.color }}>{item.value}</div>
                                        <div className="text-[10px] font-bold text-surface-500 uppercase">{item.label}</div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-64 flex items-center justify-center border-2 border-dashed border-surface-200">
                            <div className="text-center text-surface-400">
                                <p className="text-3xl mb-2">📈</p>
                                <p className="italic text-sm">No performance trend data yet. Complete assessments to see trends.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* ── Competency Gap Dashboard (Phase 5) ─────────────── */}
            {activeTab === 'gap-dashboard' && (
                <div className="space-y-6">

                    {/* Summary KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(() => {
                            const all = Object.entries(competencyData?.competencyGap || {});
                            const critical = all.filter(([, v]) => v >= 75).length;
                            const attention = all.filter(([, v]) => v >= 50 && v < 75).length;
                            const acceptable = all.filter(([, v]) => v < 50).length;
                            const avgGap = all.length > 0 ? Math.round(all.reduce((s, [, v]) => s + v, 0) / all.length) : 0;
                            return [
                                { label: 'Competencies Tracked', value: all.length, color: '#1d4ed8', bg: '#eff6ff' },
                                { label: 'Critical Gaps (≥75%)', value: critical, color: '#dc2626', bg: '#fef2f2' },
                                { label: 'Needs Attention', value: attention, color: '#d97706', bg: '#fffbeb' },
                                { label: 'National Avg Gap', value: `${avgGap}%`, color: '#7c3aed', bg: '#faf5ff' },
                            ].map(({ label, value, color, bg }) => (
                                <div key={label} className="border border-surface-200 shadow-sm p-4 text-center" style={{ background: bg }}>
                                    <div className="text-2xl font-bold" style={{ color }}>{value}</div>
                                    <div className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mt-1">{label}</div>
                                </div>
                            ));
                        })()}
                    </div>

                    {/* Action Items */}
                    <div className="bg-white border border-surface-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-red-50 border-b border-red-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-red-900 uppercase">⚡ National Intervention Action Items</h3>
                                <p className="text-xs text-red-600 mt-0.5">Auto-generated based on competency gap severity tiers</p>
                            </div>
                        </div>
                        <div className="divide-y divide-surface-100">
                            {competencyGapData.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-4xl mb-2">✅</p>
                                    <p className="font-bold text-green-700 text-sm">No critical competency gaps detected nationally.</p>
                                </div>
                            ) : (
                                competencyGapData.map((row, i) => {
                                    const isCritical = row.gap >= 75;
                                    const isAttention = row.gap >= 50 && row.gap < 75;
                                    const severity = isCritical ? 'CRITICAL' : isAttention ? 'ATTENTION' : 'MONITOR';
                                    const color = isCritical ? '#dc2626' : isAttention ? '#d97706' : '#0891b2';
                                    const bg = isCritical ? '#fef2f2' : isAttention ? '#fffbeb' : '#f0f9ff';
                                    const actions = isCritical
                                        ? [
                                            `Mandate remedial sessions for all students weak in ${row.code}`,
                                            'Deploy targeted worksheet practice sets at Easy difficulty',
                                            'Flag institutions with >60% students failing this competency',
                                        ]
                                        : isAttention
                                            ? [
                                                `Schedule supplemental practice modules for ${row.code}`,
                                                'Provide teachers with extra resource packs for this competency',
                                            ]
                                            : [
                                                `Monitor ${row.code} — distribute enrichment materials`,
                                            ];
                                    return (
                                        <div key={i} className="p-4" style={{ borderLeft: `4px solid ${color}` }}>
                                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold font-mono text-surface-900">{row.code}</span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: bg, color }}>{severity}</span>
                                                    </div>
                                                    <ul className="space-y-1">
                                                        {actions.map((action, j) => (
                                                            <li key={j} className="flex items-start gap-2 text-xs text-surface-700">
                                                                <span className="text-surface-400 flex-shrink-0 mt-0.5">›</span>
                                                                {action}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="text-center flex-shrink-0">
                                                    <div className="text-2xl font-bold" style={{ color }}>{row.gap}%</div>
                                                    <div className="text-[10px] text-surface-500 font-bold uppercase">Gap Score</div>
                                                    <div className="w-16 bg-surface-100 rounded h-1.5 mt-1">
                                                        <div className="h-1.5 rounded" style={{ width: `${row.gap}%`, background: color }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Tier Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            {
                                tier: 'Critical (≥75% gap)', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5',
                                action: 'IMMEDIATE: Mandatory remedial blocks + teacher training + parent notification'
                            },
                            {
                                tier: 'Attention (50–74%)', color: '#d97706', bg: '#fffbeb', border: '#fcd34d',
                                action: 'TARGETED: Supplemental practice + extra mentoring sessions'
                            },
                            {
                                tier: 'Monitor (<50% gap)', color: '#0891b2', bg: '#f0f9ff', border: '#7dd3fc',
                                action: 'MAINTAIN: Enrichment tracks + advanced bloom-level challenges'
                            },
                        ].map(({ tier, color, bg, border, action }) => (
                            <div key={tier} className="border p-4 rounded-sm" style={{ background: bg, borderColor: border }}>
                                <p className="text-xs font-bold uppercase mb-2" style={{ color }}>{tier}</p>
                                <p className="text-xs text-surface-700 leading-relaxed">{action}</p>
                            </div>
                        ))}
                    </div>

                </div>
            )}

            {/* ── Institutional Benchmark Tab ─────────────────────────── */}
            {activeTab === 'institutional' && (
                <div className="space-y-6">
                    {benchmarkLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
                            <Skeleton className="h-64 col-span-full" />
                        </div>
                    )}

                    {!benchmarkLoading && benchmarkData && (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white border border-surface-200 p-6 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-1">Institution Intelligence Index</p>
                                        <h3 className="text-3xl font-bold text-primary-900">{benchmarkData.institutionIndex}</h3>
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <TrendingUp size={14} className="text-green-600" />
                                            <span className="text-[10px] font-bold text-green-600 uppercase">Composite Benchmark</span>
                                        </div>
                                    </div>
                                    <div className="bg-primary-50 p-4 text-primary-700 rounded-full">
                                        <Shield size={24} />
                                    </div>
                                </div>
                                <div className="bg-white border border-surface-200 p-6 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-1">Total Tracked Classes</p>
                                        <h3 className="text-3xl font-bold text-slate-800">{benchmarkData.rankedClasses?.length || 0}</h3>
                                        <p className="text-[10px] font-medium text-slate-400 mt-2 uppercase">Active Multi-Grade Classrooms</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 text-slate-700 rounded-full">
                                        <Table size={24} />
                                    </div>
                                </div>
                                <div className="bg-white border border-surface-200 p-6 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-1">Regression Alerts</p>
                                        <h3 className="text-3xl font-bold text-red-600">{benchmarkData.bloomRegressionClusters?.length || 0}</h3>
                                        <p className="text-[10px] font-bold text-red-500 mt-2 uppercase">Critical Cognitive Slips</p>
                                    </div>
                                    <div className="bg-red-50 p-4 text-red-600 rounded-full">
                                        <AlertTriangle size={24} />
                                    </div>
                                </div>
                                <div className="bg-white border border-surface-200 p-6 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-1">Learning Stability Index</p>
                                        <h3 className="text-3xl font-bold text-blue-800">{benchmarkData.learningStabilityIndex}%</h3>
                                        <p className="text-[10px] font-bold text-blue-500 mt-2 uppercase">Mean Cognitive Consistency</p>
                                    </div>
                                    <div className="bg-blue-50 p-4 text-blue-700 rounded-full">
                                        <Activity size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Ranked Class Table */}
                                <div className="bg-white border border-surface-200 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-surface-200 bg-surface-50 flex items-center gap-2">
                                        <BarChart3 size={16} className="text-primary-700" />
                                        <h3 className="text-sm font-bold text-surface-900 uppercase">Intelligence-Based Class Rankings</h3>
                                    </div>
                                    <div className="overflow-x-auto flex-1">
                                        <table className="min-w-full divide-y divide-surface-100">
                                            <thead className="bg-surface-50">
                                                <tr>
                                                    {['Rank', 'Class', 'Teacher', 'Avg Index'].map(h => (
                                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-surface-500 uppercase">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-surface-100">
                                                {benchmarkData.rankedClasses?.map((c, i) => (
                                                    <tr key={i} className="hover:bg-surface-50">
                                                        <td className="px-4 py-3 text-sm font-mono font-bold text-surface-500">#{i + 1}</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-surface-900">{c.className}</td>
                                                        <td className="px-4 py-3 text-xs text-surface-600">{c.teacherName}</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-primary-700">{c.avgScore}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Risk Distribution Pie Chart */}
                                <div className="bg-white border border-surface-200 p-6 shadow-sm flex flex-col items-center">
                                    <div className="w-full flex items-center gap-2 mb-6">
                                        <PieIcon size={16} className="text-primary-700" />
                                        <h3 className="text-sm font-bold text-surface-900 uppercase">Institutional Risk Distribution</h3>
                                    </div>
                                    <LazyRender height={240}>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <PieChart>
                                                <Pie
                                                    data={Object.entries(benchmarkData.riskDistributionMatrix || {}).map(([name, value]) => ({ name, value }))}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {Object.entries(benchmarkData.riskDistributionMatrix || {}).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry[0] === 'HIGH' ? '#dc2626' : entry[0] === 'MEDIUM' ? '#d97706' : '#16a34a'} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </LazyRender>
                                </div>
                            </div>

                            {/* Competency Gap Heatmap */}
                            <div className="bg-white border border-surface-200 p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <Activity size={16} className="text-primary-700" />
                                    <h3 className="text-sm font-bold text-surface-900 uppercase">Institutional Competency Heatmap (Top Gaps)</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {Object.entries(benchmarkData.competencyGapHeatmap || {}).map(([code, gap]) => (
                                        <div key={code} className="p-3 border rounded-sm transition-all hover:shadow-md"
                                            style={{
                                                background: gap > 70 ? '#fef2f2' : gap > 40 ? '#fffbeb' : '#f0fdf4',
                                                borderColor: gap > 70 ? '#fca5a5' : gap > 40 ? '#fcd34d' : '#86efac'
                                            }}>
                                            <p className="text-[10px] font-bold text-surface-500 uppercase mb-1">{code}</p>
                                            <p className="text-lg font-bold" style={{ color: gap > 70 ? '#dc2626' : gap > 40 ? '#d97706' : '#16a34a' }}>{gap}%</p>
                                            <div className="w-full bg-white/50 rounded-full h-1 mt-2 overflow-hidden">
                                                <div className="h-full" style={{ width: `${gap}%`, background: gap > 70 ? '#dc2626' : gap > 40 ? '#d97706' : '#16a34a' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bloom Regression Alert Panel */}
                            <div className="bg-red-900 text-white p-6 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🚨</div>
                                <div className="relative z-10">
                                    <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <AlertTriangle size={16} /> Bloom Level Regression Clusters
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {benchmarkData.bloomRegressionClusters?.map((alert, i) => (
                                            <div key={i} className="bg-white/10 p-3 border border-white/20">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-xs font-bold">{alert.className}</span>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${alert.severity === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-slate-900'}`}>
                                                        {alert.severity}
                                                    </span>
                                                </div>
                                                <p className="text-xs opacity-80">{alert.regressionRate}% of students showing cognitive depth regression.</p>
                                            </div>
                                        ))}
                                        {(!benchmarkData.bloomRegressionClusters || benchmarkData.bloomRegressionClusters.length === 0) && (
                                            <p className="text-xs italic opacity-70">No cognitive depth regressions detected in currently active classrooms.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {!benchmarkLoading && !benchmarkData && (
                        <EmptyState
                            title="Benchmarks Not Available"
                            message="Run institutional assessments across multiple classrooms to generate benchmarks."
                        />
                    )}
                </div>
            )}

            {/* ── Integrity Monitoring (Phase 9) ───────────────────────── */}
            {activeTab === 'integrity' && (
                <div className="space-y-6">
                    {integrityLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
                            <Skeleton className="h-80 col-span-full" />
                        </div>
                    )}

                    {!integrityLoading && integrityData && (
                        <>
                            {/* Integrity KPI Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Avg Integrity Score', value: `${integrityData.avgIntegrityScore}%`, color: integrityData.avgIntegrityScore >= 90 ? '#16a34a' : '#d97706', icon: <Shield size={20} /> },
                                    { label: 'Total Violations', value: integrityData.totalViolations, color: '#dc2626', icon: <AlertTriangle size={20} /> },
                                    { label: 'Tab Switches', value: integrityData.totalTabSwitches, color: '#1e40af', icon: <Activity size={20} /> },
                                    { label: 'Fullscreen Exits', value: integrityData.totalFullscreenExits, color: '#7c3aed', icon: <TrendingUp size={20} /> },
                                ].map((kpi, idx) => (
                                    <div key={idx} className="bg-white border border-surface-200 p-5 shadow-sm">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded bg-surface-50" style={{ color: kpi.color }}>{kpi.icon}</div>
                                            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">{kpi.label}</p>
                                        </div>
                                        <h3 className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</h3>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Flagged Sessions List */}
                                <div className="bg-white border border-surface-200 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-surface-200 bg-red-50 flex items-center gap-2">
                                        <AlertTriangle size={16} className="text-red-700" />
                                        <h3 className="text-sm font-bold text-red-900 uppercase">Critical Flagged Sessions (Score &lt; 80)</h3>
                                    </div>
                                    <div className="overflow-x-auto flex-1">
                                        <table className="min-w-full divide-y divide-surface-100">
                                            <thead className="bg-surface-50">
                                                <tr>
                                                    {['Exam ID', 'Student', 'Integrity', 'Violations'].map(h => (
                                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-surface-500 uppercase">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-surface-100">
                                                {integrityData.flaggedExams?.map((e, i) => (
                                                    <tr key={i} className="hover:bg-surface-50">
                                                        <td className="px-4 py-3 text-sm font-mono font-bold text-surface-500">#{e.examId}</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-surface-900">{e.studentName}</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-red-600">{e.score}%</td>
                                                        <td className="px-4 py-3 text-sm text-surface-600">{e.violations} alerts</td>
                                                    </tr>
                                                ))}
                                                {integrityData.flaggedExams?.length === 0 && (
                                                    <tr><td colSpan="4" className="p-8 text-center text-surface-400 italic">No critical integrity issues detected.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Integrity Insights Panel */}
                                <div className="bg-surface-900 text-white p-6 shadow-xl space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary-400">Proctoring Logic Signals</h3>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Tab Switch', weight: '-5 per event', desc: 'Monitors if user leaves the assessment tab environment.' },
                                            { label: 'Fullscreen Exit', weight: '-10 per event', desc: 'Detects if user leaves the locked assessment mode.' },
                                            { label: 'Copy Attempt', weight: '-2 per event', desc: 'Identifies unauthorized data extraction attempts.' },
                                            { label: 'Webcam Heartbeat', weight: '-1 per miss', desc: 'Periodic check for candidate presence via proctoring node.' },
                                        ].map((sig, idx) => (
                                            <div key={idx} className="border-l-2 border-primary-500 pl-4 py-1">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <span className="text-xs font-bold uppercase">{sig.label}</span>
                                                    <span className="text-[10px] font-mono text-primary-300">{sig.weight}</span>
                                                </div>
                                                <p className="text-[10px] opacity-70 leading-relaxed">{sig.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-sm">
                                        <p className="text-[10px] font-bold text-primary-300 uppercase mb-2">NEP 2020 Compliance</p>
                                        <p className="text-[10px] opacity-60 leading-relaxed">
                                            Academic integrity scoring is used for internal institutional oversight only and does not impact the raw academic score recorded in the national competence repository.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {!integrityLoading && !integrityData && (
                        <EmptyState
                            title="Integrity Stats Not Available"
                            message="Start proctored assessments to see integrity monitoring data."
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminIntelligence;
