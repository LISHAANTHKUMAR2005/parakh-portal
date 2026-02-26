import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
    LineChart, Line, Cell
} from 'recharts';
import { Download, FileSpreadsheet, Brain, Users, TrendingUp, Calendar } from 'lucide-react';
import { LoadingOverlay } from '../components/SharedUI';

const API = 'http://localhost:8081';

const COLORS = ['#1d4ed8', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];
const riskBadge = {
    HIGH: { bg: '#fef2f2', text: '#dc2626', label: 'HIGH RISK' },
    MEDIUM: { bg: '#fffbeb', text: '#d97706', label: 'MODERATE' },
    LOW: { bg: '#f0fdf4', text: '#16a34a', label: 'ON TRACK' },
};

const TeacherAnalytics = () => {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [intelligence, setIntelligence] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [aiEnchancement, setAiEnchancement] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        if (intelligence?.classRemediationPlan) {
            enhancePlan(intelligence.classRemediationPlan);
        } else {
            setAiEnchancement('');
        }
    }, [intelligence?.classRemediationPlan]);

    const enhancePlan = async (plan) => {
        setAiLoading(true);
        try {
            const res = await fetch(`${API}/api/ai/enhance-remediation`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(plan)
            });
            if (res.ok) {
                const data = await res.json();
                setAiEnchancement(data.enhancedPlan);
            }
        } catch (e) { console.error(e); }
        finally { setAiLoading(false); }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await fetch(`${API}/api/teacher/classes`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setClasses(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchAnalytics = useCallback(async (classId) => {
        if (!classId) return;
        setLoading(true);
        try {
            const [analyticsRes, intelligenceRes] = await Promise.all([
                fetch(`${API}/api/teacher/class/${classId}/analytics`, {
                    headers: { Authorization: `Bearer ${user?.token}` }
                }),
                fetch(`${API}/api/teacher/class/${classId}/intelligence-summary`, {
                    headers: { Authorization: `Bearer ${user?.token}` }
                })
            ]);
            if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
            if (intelligenceRes.ok) setIntelligence(await intelligenceRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const handleClassChange = (e) => {
        const id = e.target.value;
        setSelectedClass(id);
        setAnalytics(null);
        setIntelligence(null);
        fetchAnalytics(id);
    };

    const handleDownloadCSV = () => {
        if (!intelligence?.studentResults) return;
        const headers = ["Student Name", "Score", "Total Questions", "Academic %", "Risk Indicator", "Confidence Score"];
        const rows = intelligence.studentResults.map(r => [
            r.studentName,
            r.score,
            r.total,
            ((r.score / r.total) * 100).toFixed(1) + "%",
            r.riskIndicator || "N/A",
            (r.confidenceScore || 0).toFixed(1) + "%"
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Class_Analytics_${selectedClass}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const topicHeatmapData = Object.entries(intelligence?.topicHeatmap || analytics?.topicStrength || {})
        .map(([topic, score]) => ({ topic: topic.length > 14 ? topic.substring(0, 12) + '..' : topic, score }))
        .sort((a, b) => a.score - b.score);

    const bloomData = Object.entries(intelligence?.bloomLevelDistribution || {})
        .map(([name, value]) => ({ name, value }));

    const diffData = Object.entries(analytics?.difficultySuccessRate || intelligence?.difficultySuccessRate || {})
        .map(([name, value]) => ({ name, value }));

    const growthTrend = (intelligence?.classGrowthTrend || []).map(g => ({
        date: g.date, score: g.avgScore
    }));

    const studentResults = analytics?.studentResults || intelligence?.studentResults || [];
    const riskStudents = intelligence?.riskStudents || [];
    const confidenceRanking = intelligence?.confidenceRanking || [];
    const weakestTopicSummary = intelligence?.weakestTopicSummary || {};

    // Phase 5 Intervention
    const interventionStudents = intelligence?.interventionNeededStudents || [];
    const interventionType = intelligence?.suggestedInterventionType || '';
    const classRemediationPlan = intelligence?.classRemediationPlan || {};

    const interventionMeta = {
        IMMEDIATE_GROUP_REVIEW: { label: 'Immediate Group Review', color: '#dc2626', bg: '#fef2f2', icon: '🚨' },
        TARGETED_REMEDIATION: { label: 'Targeted Remediation', color: '#d97706', bg: '#fffbeb', icon: '🎯' },
        FOUNDATIONAL_REVIEW: { label: 'Foundational Review', color: '#d97706', bg: '#fffbeb', icon: '🎯' },
        SUPPLEMENTAL_PRACTICE: { label: 'Supplemental Practice', color: '#0891b2', bg: '#f0f9ff', icon: '📚' },
        ENRICHMENT: { label: 'Enrichment', color: '#16a34a', bg: '#f0fdf4', icon: '🌟' },
    };
    const intMeta = interventionMeta[interventionType] || interventionMeta.SUPPLEMENTAL_PRACTICE;

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'intelligence', label: '🔮 Intelligence' },
        { id: 'intervention', label: `🚨 Intervention (${interventionStudents.length})` },
        { id: 'heatmap', label: 'Topic Heatmap' },
        { id: 'bloom', label: 'Bloom Analysis' },
        { id: 'students', label: 'Student Results' },
        { id: 'risk', label: `At-Risk (${riskStudents.length})` },
    ];

    return (
        <div className="min-h-screen bg-surface-50 p-6 font-sans">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="bg-white border border-surface-300 p-6 mb-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold text-surface-500 uppercase tracking-widest">PARAKH – Teacher Intelligence Dashboard</p>
                            <h1 className="text-2xl font-bold text-primary-900 uppercase tracking-tight mt-1">Class Analytics</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            {intelligence?.studentResults && (
                                <button
                                    onClick={handleDownloadCSV}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white text-[10px] font-bold uppercase rounded-sm hover:bg-emerald-800 transition-colors shadow-sm"
                                >
                                    <FileSpreadsheet size={16} /> Export CSV
                                </button>
                            )}
                            <select
                                value={selectedClass}
                                onChange={handleClassChange}
                                className="border border-surface-300 px-4 py-2 text-sm font-medium bg-white focus:outline-none focus:border-primary-700 min-w-48"
                            >
                                <option value="">— Select Class —</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    {(analytics || intelligence) && !loading && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                            {[
                                { label: 'Avg Score', value: `${analytics?.averageScore ?? intelligence?.averageScore ?? 0}%`, color: '#1e40af' },
                                { label: 'Total Attempts', value: intelligence?.totalAttempts ?? studentResults.length, color: '#7c3aed' },
                                { label: 'Weakest Topic', value: intelligence?.weakestTopic ?? '—', color: '#dc2626', small: true },
                                { label: 'At-Risk Students', value: riskStudents.length, color: riskStudents.length > 0 ? '#dc2626' : '#16a34a' },
                            ].map((item, i) => (
                                <div key={i} className="bg-surface-50 border border-surface-200 p-3 text-center">
                                    <div className={`font-bold mb-1 ${item.small ? 'text-sm' : 'text-xl'}`} style={{ color: item.color }}>
                                        {item.value}
                                    </div>
                                    <div className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">{item.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {!selectedClass && (
                    <div className="bg-white border border-surface-200 p-16 text-center shadow-sm">
                        <p className="text-4xl mb-4">📊</p>
                        <p className="text-surface-600 font-medium">Select a class above to view intelligence analytics.</p>
                    </div>
                )}

                {loading && <LoadingOverlay message="Analyzing Class Intelligence..." />}

                {(analytics || intelligence) && !loading && (
                    <>
                        {/* Tab Nav */}
                        <div className="flex bg-white border border-surface-200 mb-6 overflow-hidden shadow-sm overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-shrink-0 px-5 py-3 text-xs font-bold uppercase tracking-wide transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-primary-800 text-white'
                                        : 'text-surface-600 hover:bg-surface-50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* ── Overview Tab ─────────────────────────────────────── */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* NEW: Class Insight Panel */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <InsightCard title="Top Performer" value={analytics?.insights?.topPerformer || '—'} icon="🏆" color="emerald" />
                                    <InsightCard title="Most Improved" value={analytics?.insights?.mostImproved || '—'} icon="📈" color="blue" />
                                    <InsightCard title="Most At-Risk" value={analytics?.insights?.mostAtRisk || '—'} icon="⚠️" color="red" />
                                    <InsightCard title="Avg Integrity" value={`${analytics?.insights?.averageIntegrity || 100}%`} icon="🛡️" color="indigo" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Difficulty Success Rate */}
                                    <div className="bg-white border border-surface-200 p-5 shadow-sm">
                                        <h3 className="text-sm font-bold text-surface-800 uppercase mb-4">Difficulty Success Rate</h3>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={diffData} barSize={45}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                                <Tooltip formatter={v => `${v}%`} />
                                                <Bar dataKey="value" name="Success Rate" radius={[3, 3, 0, 0]}>
                                                    {diffData.map((_, idx) => (
                                                        <Cell key={idx} fill={['#16a34a', '#d97706', '#dc2626'][idx % 3]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Class Growth Trend */}
                                    <div className="bg-white border border-surface-200 p-5 shadow-sm">
                                        <h3 className="text-sm font-bold text-surface-800 uppercase mb-4">Class Growth Trend</h3>
                                        {growthTrend.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={220}>
                                                <LineChart data={growthTrend}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                                    <Tooltip formatter={v => `${v}%`} />
                                                    <Line type="monotone" dataKey="score" name="Avg Score" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-52 flex items-center justify-center text-surface-400 italic text-sm">
                                                Complete exams to see growth trend
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Intelligence Signals Tab ─────────────────────────── */}
                        {activeTab === 'intelligence' && (
                            <div className="space-y-5">
                                {/* NEW: Class Learning Strategy Section */}
                                <div className="bg-white border border-surface-200 p-6 shadow-sm border-t-4 border-t-indigo-600">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-indigo-100 p-2 rounded-full text-indigo-700">
                                            <Calendar size={20} />
                                        </div>
                                        <h3 className="text-sm font-bold text-surface-800 uppercase">📅 Class Learning Strategy</h3>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Strategy Groups */}
                                        <div className="col-span-2 space-y-4">
                                            {[
                                                {
                                                    id: 'intensive',
                                                    title: 'Intensive Reinforcement',
                                                    desc: 'Daily intervention, foundational drills, 1:1 support.',
                                                    students: interventionStudents.filter(s => s.riskIndicator === 'HIGH'),
                                                    color: '#dc2626'
                                                },
                                                {
                                                    id: 'stability',
                                                    title: 'Stability & Confidence Recovery',
                                                    desc: 'Momentum building, pattern recognition, scaffolded tasks.',
                                                    students: interventionStudents.filter(s => s.riskIndicator === 'MEDIUM'),
                                                    color: '#d97706'
                                                },
                                                {
                                                    id: 'progressive',
                                                    title: 'Progressive Skill Advancement',
                                                    desc: 'Analytical challenges, bloom L4+ tasks, peer teaching.',
                                                    students: studentResults.filter(s => s.riskIndicator === 'LOW' || !s.riskIndicator),
                                                    color: '#16a34a'
                                                }
                                            ].map(group => (
                                                <div key={group.id} className="flex border border-slate-100 rounded-sm hover:border-slate-300 transition-colors">
                                                    <div className="w-1" style={{ background: group.color }} />
                                                    <div className="p-4 flex-1">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="text-sm font-bold text-slate-800">{group.title}</h4>
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${group.color}15`, color: group.color }}>
                                                                {group.students.length} Students
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mb-2">{group.desc}</p>
                                                        <div className="flex gap-1 flex-wrap">
                                                            {group.students.slice(0, 5).map((s, idx) => (
                                                                <span key={idx} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm">{s.studentName || 'Student'}</span>
                                                            ))}
                                                            {group.students.length > 5 && <span className="text-[9px] text-slate-400">+{group.students.length - 5} more</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Suggested Weekly Focus */}
                                        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-sm">
                                            <h4 className="text-xs font-bold text-indigo-900 uppercase mb-4">Weekly Intervention Focus</h4>
                                            <div className="space-y-4">
                                                <div className="flex gap-3">
                                                    <div className="text-lg">🎯</div>
                                                    <div>
                                                        <p className="text-xs font-bold text-indigo-950">Current Goal</p>
                                                        <p className="text-[11px] text-indigo-800">Bridge the {weakestTopicSummary.topic || 'fundamental'} gap through adaptive practice.</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="text-lg">📊</div>
                                                    <div>
                                                        <p className="text-xs font-bold text-indigo-950">Next Milestone</p>
                                                        <p className="text-[11px] text-indigo-800">Transition at least 30% of 'High Risk' students to 'Moderate'.</p>
                                                    </div>
                                                </div>
                                                <div className="mt-6">
                                                    <button className="w-full py-2 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-sm hover:bg-indigo-700 transition-colors shadow-sm">
                                                        Generate Intervention Tasks
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Weakest Topic Summary */}
                                <div className="bg-white border border-surface-200 p-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-surface-800 uppercase mb-4">Weakest Topic — Class Signal</h3>
                                    {weakestTopicSummary.topic && weakestTopicSummary.topic !== 'N/A' ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div>
                                                    <p className="text-lg font-bold text-surface-900">{weakestTopicSummary.topic}</p>
                                                    <p className="text-xs text-surface-500 mt-0.5">
                                                        Class-wide mastery rate: <strong style={{ color: (weakestTopicSummary.mastery || 0) < 50 ? '#dc2626' : '#d97706' }}>
                                                            {(weakestTopicSummary.mastery || 0).toFixed(1)}%
                                                        </strong>
                                                    </p>
                                                </div>
                                                <div className="flex gap-4 text-center">
                                                    <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-sm">
                                                        <div className="text-xl font-bold text-red-700">{weakestTopicSummary.studentsStruggling || 0}</div>
                                                        <div className="text-[10px] text-red-600 uppercase font-bold">Students At-Risk</div>
                                                    </div>
                                                    <div className="bg-surface-50 border border-surface-200 px-4 py-2 rounded-sm">
                                                        <div className="text-xl font-bold text-surface-700">{riskStudents.length}</div>
                                                        <div className="text-[10px] text-surface-500 uppercase font-bold">Total Flagged</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-full bg-surface-100 rounded h-3 overflow-hidden">
                                                <div
                                                    className="h-3 rounded transition-all duration-700"
                                                    style={{
                                                        width: `${weakestTopicSummary.mastery || 0}%`,
                                                        background: (weakestTopicSummary.mastery || 0) < 50 ? '#dc2626' : '#d97706'
                                                    }}
                                                />
                                            </div>
                                            <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm text-xs text-amber-800">
                                                <strong>📌 Recommendation:</strong> Schedule focused revision sessions on <em>{weakestTopicSummary.topic}</em>.
                                                Consider providing additional practice materials targeting this topic at Easy–Medium difficulty
                                                before advancing to Higher-Order Thinking questions.
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-surface-400 italic text-sm">No topic data yet. Tag questions with topics to enable this analysis.</p>
                                    )}
                                </div>

                                {/* Confidence Ranking */}
                                <div className="bg-white border border-surface-200 shadow-sm overflow-hidden">
                                    <div className="p-4 border-b border-surface-200 bg-surface-50 flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-surface-900 uppercase">Student Confidence Ranking</h3>
                                        <span className="text-[10px] text-surface-500 font-bold uppercase">
                                            Fast+Correct · Hard Accuracy · Bloom Advancement
                                        </span>
                                    </div>
                                    {confidenceRanking.length === 0 ? (
                                        <div className="p-12 text-center text-surface-400 italic text-sm">
                                            No data yet. Students must complete exams to generate confidence scores.
                                        </div>
                                    ) : (
                                        <table className="min-w-full divide-y divide-surface-100">
                                            <thead className="bg-surface-50">
                                                <tr>
                                                    {['Rank', 'Student', 'Confidence', 'Academic', 'Risk'].map(h => (
                                                        <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase text-surface-500">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-surface-100">
                                                {confidenceRanking.map((s, i) => {
                                                    const conf = s.confidenceScore || 0;
                                                    const confColor = conf >= 70 ? '#16a34a' : conf >= 40 ? '#d97706' : '#dc2626';
                                                    const rb = riskBadge[s.riskIndicator] || {};
                                                    return (
                                                        <tr key={i} className={`hover:bg-surface-50 ${i === 0 ? 'bg-green-50' : ''}`}>
                                                            <td className="px-4 py-3 text-sm font-bold text-surface-500 font-mono">
                                                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-bold text-surface-900">{s.studentName}</td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex-1 bg-surface-100 rounded h-2" style={{ minWidth: 80 }}>
                                                                        <div className="h-2 rounded transition-all" style={{ width: `${conf}%`, background: confColor }} />
                                                                    </div>
                                                                    <span className="text-xs font-bold font-mono" style={{ color: confColor }}>{conf.toFixed(1)}%</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-mono text-surface-700">{s.academicScore?.toFixed(1)}%</td>
                                                            <td className="px-4 py-3">
                                                                {rb.label
                                                                    ? <span className="px-2 py-0.5 text-xs font-bold rounded" style={{ background: rb.bg, color: rb.text }}>{rb.label}</span>
                                                                    : <span className="text-surface-400 text-xs">—</span>
                                                                }
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Intervention Panel ────────────────────────────────── */}
                        {activeTab === 'intervention' && (
                            <div className="space-y-5">

                                <div className="p-4 border-l-4 flex items-start gap-4"
                                    style={{ borderColor: intMeta.color, background: intMeta.bg }}>
                                    <span className="text-3xl flex-shrink-0">{intMeta.icon}</span>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: intMeta.color }}>
                                            Recommended Class Intervention Strategy
                                        </p>
                                        <p className="text-lg font-bold" style={{ color: intMeta.color }}>{intMeta.label}</p>
                                        <div className="flex gap-6 mt-2 flex-wrap">
                                            {[
                                                { val: classRemediationPlan.highRiskStudents || 0, label: 'High Risk' },
                                                { val: classRemediationPlan.mediumRiskStudents || 0, label: 'Medium Risk' },
                                                { val: classRemediationPlan.recommendedSessions || 1, label: 'Sessions' },
                                                { val: `${classRemediationPlan.sessionDurationMins || 45}m`, label: 'Per Session' },
                                            ].map(({ val, label }) => (
                                                <div key={label} className="text-center">
                                                    <div className="text-2xl font-bold" style={{ color: intMeta.color }}>{val}</div>
                                                    <div className="text-[10px] font-bold uppercase text-slate-500">{label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="bg-white border border-slate-200 p-5 shadow-sm">
                                        <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">📋 Action Steps</h3>
                                        {classRemediationPlan.weakestTopic && (
                                            <div className="mb-4">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-600">Weakest Class Topic</span>
                                                    <strong className="text-red-600">{classRemediationPlan.weakestTopic}</strong>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded h-2">
                                                    <div className="h-2 rounded" style={{ width: `${classRemediationPlan.topicMastery || 0}%`, background: '#dc2626' }} />
                                                </div>
                                                <div className="text-right text-[10px] text-slate-500 mt-0.5">{(classRemediationPlan.topicMastery || 0).toFixed(1)}% mastery</div>
                                            </div>
                                        )}
                                        <ul className="space-y-2">
                                            {(classRemediationPlan.interventionActions || []).map((action, i) => (
                                                <li key={i} className="flex items-start gap-2 text-xs">
                                                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: intMeta.color }}>{i + 1}</span>
                                                    <span className="text-slate-700 leading-relaxed">{action}</span>
                                                </li>
                                            ))}
                                            {!classRemediationPlan.interventionActions?.length && (
                                                <li className="text-slate-400 italic text-xs">Select a class with exam data to generate actions.</li>
                                            )}
                                        </ul>
                                    </div>
                                    <div className="bg-white border border-slate-200 p-5 shadow-sm">
                                        <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">📅 Intervention Timeline</h3>
                                        {Object.entries(classRemediationPlan.timeline || {}).length > 0 ? (
                                            <div className="space-y-3">
                                                {Object.entries(classRemediationPlan.timeline).map(([week, action]) => (
                                                    <div key={week} className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded" style={{ background: intMeta.bg, color: intMeta.color }}>{week}</div>
                                                        <div className="text-xs text-slate-700 mt-0.5">{action}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-slate-400 italic text-sm">Timeline appears after class data loads.</p>
                                        )}
                                    </div>
                                </div>

                                {/* AI Strategy Enhancement */}
                                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🧠</div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300 mb-2">AI Strategy Enhancement</p>
                                        {aiLoading ? (
                                            <div className="animate-pulse space-y-2">
                                                <div className="h-2 bg-indigo-800 rounded w-3/4"></div>
                                                <div className="h-2 bg-indigo-800 rounded w-1/2"></div>
                                            </div>
                                        ) : (
                                            <p className="text-sm font-medium italic opacity-90 leading-relaxed md:max-w-3xl">
                                                "{aiEnchancement || "Select a class to generate AI-driven pedagogical enhancements for your remediation strategy."}"
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-4 border-b border-slate-200 flex items-center justify-between" style={{ background: intMeta.bg }}>
                                        <h3 className="text-sm font-bold uppercase" style={{ color: intMeta.color }}>Students Requiring Intervention</h3>
                                        <span className="text-[10px] font-bold px-2 py-1 rounded text-white" style={{ background: intMeta.color }}>
                                            {interventionStudents.length} flagged
                                        </span>
                                    </div>
                                    {interventionStudents.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <p className="text-4xl mb-2">✅</p>
                                            <p className="font-bold text-green-700 text-sm">No immediate intervention needed.</p>
                                        </div>
                                    ) : (
                                        <table className="min-w-full divide-y divide-slate-100">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    {['Student', 'Risk Level', 'Risk Score', 'Academic', 'Confidence', 'Priority'].map(h => (
                                                        <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {([...interventionStudents])
                                                    .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
                                                    .map((s, i) => {
                                                        const rb = riskBadge[s.riskIndicator] || {};
                                                        const conf = s.confidenceScore || 0;
                                                        const priority = s.riskIndicator === 'HIGH'
                                                            ? { label: 'IMMEDIATE', color: '#dc2626' }
                                                            : { label: 'MODERATE', color: '#d97706' };
                                                        return (
                                                            <tr key={i} className={`hover:bg-slate-50 ${s.riskIndicator === 'HIGH' ? 'bg-red-50' : ''}`}>
                                                                <td className="px-4 py-3 text-sm font-bold text-slate-900">{s.studentName}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className="px-2 py-0.5 text-xs font-bold rounded" style={{ background: rb.bg, color: rb.text }}>{rb.label}</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm font-mono font-bold" style={{ color: rb.text }}>{s.riskScore || '—'}/100</td>
                                                                <td className="px-4 py-3 text-sm font-mono text-slate-700">{s.academicScore ? `${s.academicScore.toFixed(1)}%` : '—'}</td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-16 bg-slate-100 rounded h-1.5">
                                                                            <div className="h-1.5 rounded" style={{ width: `${conf}%`, background: conf >= 50 ? '#0891b2' : '#dc2626' }} />
                                                                        </div>
                                                                        <span className="text-xs font-mono text-slate-600">{conf.toFixed(0)}%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-xs font-bold" style={{ color: priority.color }}>{priority.label}</td>
                                                            </tr>
                                                        );
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                            </div>
                        )}

                        {/* ── Topic Heatmap ─────────────────────────────────────── */}
                        {activeTab === 'heatmap' && (
                            <div className="bg-white border border-surface-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-sm font-bold text-surface-800 uppercase">Topic Mastery Heatmap</h3>
                                    {intelligence?.weakestTopic && (
                                        <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-300">
                                            🔴 Weakest: {intelligence.weakestTopic}
                                        </span>
                                    )}
                                </div>
                                {topicHeatmapData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={topicHeatmapData} layout="vertical" barSize={20}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                                                <YAxis type="category" dataKey="topic" tick={{ fontSize: 11 }} width={100} />
                                                <Tooltip formatter={v => `${v}%`} />
                                                <Bar dataKey="score" name="Class Accuracy" radius={[0, 3, 3, 0]}>
                                                    {topicHeatmapData.map((entry, idx) => (
                                                        <Cell key={idx} fill={
                                                            entry.score >= 75 ? '#16a34a' :
                                                                entry.score >= 50 ? '#0891b2' :
                                                                    entry.score >= 25 ? '#d97706' : '#dc2626'
                                                        } />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                        <div className="flex gap-4 mt-4 text-xs font-bold justify-center">
                                            {[['#16a34a', '≥75% Mastered'], ['#0891b2', '≥50% Proficient'], ['#d97706', '≥25% Developing'], ['#dc2626', '<25% Needs Work']].map(([color, label]) => (
                                                <div key={label} className="flex items-center gap-1.5">
                                                    <div className="w-3 h-3 rounded-sm" style={{ background: color }} />{label}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-surface-400 italic">
                                        No topic data yet. Students need to complete exams with topic-tagged questions.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Bloom Analysis ─────────────────────────────────────── */}
                        {activeTab === 'bloom' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white border border-surface-200 p-6 shadow-sm">
                                    <h3 className="text-sm font-bold text-surface-800 uppercase mb-5">Bloom's Taxonomy Radar</h3>
                                    {bloomData.some(d => d.value > 0) ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <RadarChart data={bloomData}>
                                                <PolarGrid stroke="#e2e8f0" />
                                                <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                <Radar name="Class Accuracy" dataKey="value" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.2} />
                                                <Tooltip formatter={v => `${v}%`} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-64 flex items-center justify-center text-surface-400 italic text-sm">
                                            No bloom data yet. Tag questions with bloom levels.
                                        </div>
                                    )}
                                </div>
                                <div className="bg-white border border-surface-200 p-6 shadow-sm">
                                    <h3 className="text-sm font-bold text-surface-800 uppercase mb-5">Higher-Order Thinking Gap</h3>
                                    <div className="space-y-4">
                                        {[
                                            { bloom: 'Remember', weight: 'L1 — Foundational', icon: '🧠' },
                                            { bloom: 'Understand', weight: 'L2 — Comprehension', icon: '📘' },
                                            { bloom: 'Apply', weight: 'L3 — Application', icon: '🔧' },
                                            { bloom: 'Analyze', weight: 'L4 — Higher-Order', icon: '🔬' },
                                        ].map(({ bloom, weight, icon }) => {
                                            const val = intelligence?.bloomLevelDistribution?.[bloom] || 0;
                                            const color = val >= 75 ? '#16a34a' : val >= 50 ? '#0891b2' : val >= 25 ? '#d97706' : '#dc2626';
                                            return (
                                                <div key={bloom}>
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <span className="text-sm font-bold text-surface-900">{icon} {bloom}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-surface-500">{weight}</span>
                                                            <span className="text-sm font-bold" style={{ color }}>{val}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-surface-100 rounded h-3">
                                                        <div className="h-3 rounded transition-all" style={{ width: `${val}%`, background: color }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Student Results ─────────────────────────────────────── */}
                        {activeTab === 'students' && (
                            <div className="bg-white border border-surface-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-surface-200 bg-surface-50">
                                    <h3 className="text-sm font-bold text-surface-900 uppercase">Student Performance Table</h3>
                                </div>
                                <table className="min-w-full divide-y divide-surface-100">
                                    <thead className="bg-surface-50">
                                        <tr>
                                            {['Student', 'Score', 'Out Of', 'Percentage', 'Risk', 'Competency', 'Date'].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase text-surface-500">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-100">
                                        {studentResults.length === 0 ? (
                                            <tr><td colSpan="7" className="p-12 text-center text-surface-400 italic">No results yet.</td></tr>
                                        ) : (
                                            studentResults.map((r, i) => {
                                                const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                                                const risk = r.riskIndicator || 'N/A';
                                                const rb = riskBadge[risk] || {};
                                                return (
                                                    <tr key={i} className="hover:bg-surface-50">
                                                        <td className="px-4 py-3 text-sm font-bold text-surface-900">{r.studentName}</td>
                                                        <td className="px-4 py-3 text-sm text-surface-700 font-mono">{r.score}</td>
                                                        <td className="px-4 py-3 text-sm text-surface-500 font-mono">{r.total}</td>
                                                        <td className="px-4 py-3">
                                                            <span className="font-bold text-sm" style={{ color: pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626' }}>{pct}%</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {rb.label ? (
                                                                <span className="px-2 py-0.5 text-xs font-bold rounded" style={{ background: rb.bg, color: rb.text }}>{rb.label}</span>
                                                            ) : <span className="text-surface-400 text-xs">—</span>}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-mono text-surface-700">{r.competencyIndex ? `${r.competencyIndex}%` : '—'}</td>
                                                        <td className="px-4 py-3 text-xs text-surface-500">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── At-Risk Students ─────────────────────────────────────── */}
                        {activeTab === 'risk' && (
                            <div className="bg-white border border-surface-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-surface-200 bg-red-50">
                                    <h3 className="text-sm font-bold text-red-900 uppercase">⚠ At-Risk Student Detection</h3>
                                    <p className="text-xs text-red-700 mt-0.5">Students requiring immediate attention based on AI risk analysis</p>
                                </div>
                                {riskStudents.length === 0 ? (
                                    <div className="p-16 text-center">
                                        <p className="text-4xl mb-3">✅</p>
                                        <p className="font-bold text-green-700">All students are performing within acceptable ranges.</p>
                                    </div>
                                ) : (
                                    <table className="min-w-full divide-y divide-surface-100">
                                        <thead className="bg-surface-50">
                                            <tr>
                                                {['Student', 'Risk Level', 'Risk Score', 'Academic Score', 'Action'].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase text-surface-500">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-100">
                                            {riskStudents.map((s, i) => {
                                                const rb = riskBadge[s.riskIndicator] || {};
                                                return (
                                                    <tr key={i} className="hover:bg-surface-50">
                                                        <td className="px-4 py-3 text-sm font-bold text-surface-900">{s.studentName}</td>
                                                        <td className="px-4 py-3">
                                                            <span className="px-2 py-0.5 text-xs font-bold rounded" style={{ background: rb.bg, color: rb.text }}>{rb.label}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-mono font-bold" style={{ color: rb.text }}>{s.riskScore}/100</td>
                                                        <td className="px-4 py-3 text-sm font-mono">{s.academicScore}%</td>
                                                        <td className="px-4 py-3">
                                                            <button className="px-3 py-1 text-xs font-bold bg-primary-800 text-white rounded hover:bg-primary-900 transition-colors">
                                                                Review Profile
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const InsightCard = ({ title, value, icon, color }) => {
    const colors = {
        emerald: 'text-emerald-700 bg-emerald-50 border-emerald-100',
        blue: 'text-blue-700 bg-blue-50 border-blue-100',
        red: 'text-red-700 bg-red-50 border-red-100',
        indigo: 'text-indigo-700 bg-indigo-50 border-indigo-100',
    };
    return (
        <div className={`bg-white border p-4 shadow-sm flex flex-col items-center text-center gap-2 ${colors[color]}`}>
            <span className="text-2xl">{icon}</span>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5">{title}</p>
                <p className="text-sm font-bold truncate max-w-[150px]">{value}</p>
            </div>
        </div>
    );
};

export default TeacherAnalytics;
