import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const API = 'http://localhost:8081';

const masteryColor = (m) => m >= 80 ? '#16a34a' : m >= 60 ? '#2563eb' : m >= 40 ? '#d97706' : '#dc2626';
const masteryLabel = (m) => m >= 80 ? 'Expert' : m >= 60 ? 'Proficient' : m >= 40 ? 'Developing' : 'Foundational';
const trendIcon = (t) => t === 'UP' ? { icon: '▲', cls: 'text-green-600 bg-green-50 border-green-200' }
    : t === 'DOWN' ? { icon: '▼', cls: 'text-red-600 bg-red-50 border-red-200' }
        : { icon: '━', cls: 'text-blue-600 bg-blue-50 border-blue-200' };

const CompetencyTranscript = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState('mastery');
    const [sortDir, setSortDir] = useState('asc');
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        fetch(`${API}/api/student/my/competency-transcript`, {
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
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Transcript…</p>
            </div>
        </div>
    );

    const transcript = data?.transcript || [];
    const filtered = transcript
        .filter(t => t.topic.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            const av = a[sortKey] ?? 0; const bv = b[sortKey] ?? 0;
            return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
        });

    const topChart = [...transcript].sort((a, b) => b.mastery - a.mastery).slice(0, 10);

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const SortBtn = ({ k, label }) => (
        <button onClick={() => handleSort(k)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase border transition-colors ${sortKey === k ? 'bg-blue-800 text-white border-blue-800' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
            {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/student/dashboard')} className="text-xs font-bold text-blue-700 hover:underline uppercase">
                        ← Dashboard
                    </button>
                    <span className="text-gray-300">|</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-700">Competency Transcript</span>
                </div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">
                    {transcript.length} Topics · Generated {data?.generatedAt}
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6 space-y-6">

                {/* Mastery Overview Chart */}
                {topChart.length > 0 && (
                    <div className="bg-white border border-gray-200 shadow-sm p-6">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-1">Mastery Overview — Top Topics</h2>
                        <p className="text-[10px] text-gray-400 mb-4">Red &#60;40% · Amber 40·60% · Blue 60·80% · Green &gt;80%</p>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={topChart} margin={{ left: 0, right: 16 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="topic" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={40} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                <Tooltip formatter={(v) => [`${v}%`, 'Mastery']} contentStyle={{ fontSize: 11 }} />
                                <Bar dataKey="mastery" radius={[2, 2, 0, 0]}>
                                    {topChart.map((entry, i) => <Cell key={i} fill={masteryColor(entry.mastery)} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search topic…"
                        className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 outline-none focus:border-blue-400 w-52"
                    />
                    <div className="flex gap-1">
                        <SortBtn k="mastery" label="Mastery" />
                        <SortBtn k="attempts" label="Attempts" />
                        <SortBtn k="topic" label="Topic A–Z" />
                    </div>
                    <span className="text-[10px] text-gray-400 ml-auto">{filtered.length} results</span>
                </div>

                {/* Transcript Table */}
                <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700">Competency Breakdown</h3>
                    </div>
                    {filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 italic">No competency data yet. Complete an examination to generate your transcript.</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-100 text-xs">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['#', 'Topic / Competency Code', 'Mastery', 'Level', 'Attempts', 'Correct', 'Bloom Exposure', 'Trend'].map(h => (
                                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase text-gray-500">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((row, i) => {
                                    const mc = masteryColor(row.mastery);
                                    const tr = trendIcon(row.trend);
                                    return (
                                        <tr key={i}
                                            onClick={() => setSelected(selected === i ? null : i)}
                                            className="hover:bg-blue-50/30 cursor-pointer transition-colors">
                                            <td className="px-4 py-3 text-gray-400 font-mono">{i + 1}</td>
                                            <td className="px-4 py-3 font-semibold text-gray-900">{row.topic}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden w-16">
                                                        <div className="h-full rounded-full" style={{ width: `${row.mastery}%`, background: mc }} />
                                                    </div>
                                                    <span className="font-bold font-mono" style={{ color: mc }}>{row.mastery}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded border"
                                                    style={{ background: mc + '18', color: mc, borderColor: mc + '55' }}>
                                                    {masteryLabel(row.mastery)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-gray-700">{row.attempts}</td>
                                            <td className="px-4 py-3 font-mono text-green-700">{row.correct}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {(row.bloomExposure || []).map((b, j) => (
                                                        <span key={j} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold border border-indigo-200 rounded">{b}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold border rounded ${tr.cls}`}>
                                                    {tr.icon} {row.trend}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Legend */}
                <div className="bg-gray-50 border border-gray-200 p-4">
                    <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">Mastery Scale</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                        {[
                            { color: '#dc2626', label: '< 40% · Foundational' },
                            { color: '#d97706', label: '40–60% · Developing' },
                            { color: '#2563eb', label: '60–80% · Proficient' },
                            { color: '#16a34a', label: '≥ 80% · Expert' },
                        ].map((l, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                                <span>{l.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CompetencyTranscript;
