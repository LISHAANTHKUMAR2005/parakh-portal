import React, { useState, useEffect } from 'react';
import { Users, BookOpen, FileText, ClipboardList, Activity, Clock, Award, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardOverview = ({ user, setActiveTab, onOpenCreateAssessment }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('http://localhost:8081/api/teacher/dashboard/stats', {
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
                if (res.ok) setStats(await res.json());
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchStats();
    }, [user]);

    // Mock Data for Chart
    const performanceData = [
        { name: 'Week 1', score: 65 }, { name: 'Week 2', score: 68 }, { name: 'Week 3', score: 72 },
        { name: 'Week 4', score: 74 }, { name: 'Week 5', score: 78 }, { name: 'Week 6', score: 82 },
        { name: 'Week 7', score: 80 }, { name: 'Week 8', score: 85 }, { name: 'Week 9', score: 88 }
    ];

    if (loading) return <div className="p-8 text-center text-surface-500 animate-pulse text-sm font-bold uppercase">Loading Dashboard...</div>;

    return (
        <div className="flex-1 overflow-auto bg-surface-50 p-6">
            <div className="max-w-screen-2xl mx-auto space-y-6">

                {/* 1. Top KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6">
                    <KPICard title="Total Classes" value={stats?.totalClasses || 0} icon={BookOpen} color="blue" />
                    <KPICard title="Total Students" value={stats?.totalStudents || 0} icon={Users} color="purple" />
                    <KPICard title="Question Bank" value={stats?.totalQuestions || 0} icon={FileText} color="orange" />
                    <KPICard title="Assessments" value={stats?.totalTests || 0} icon={ClipboardList} color="emerald" />
                    <KPICard title="Active Tests" value={stats?.activeTests || 0} icon={Activity} color="red" />
                    <KPICard title="Avg Class Score" value={`${stats?.averageClassScore || 0}%`} icon={Award} color="yellow" />
                </div>

                {/* 2. Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* LEFT COLUMN: Charts (Span 2) */}
                    <div className="xl:col-span-2 bg-white border border-surface-200 shadow-sm p-6 flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-primary-900 uppercase tracking-wide flex items-center gap-2">
                                <BarChart2 size={18} className="text-primary-600" />
                                Class Performance Trends
                            </h3>
                            <select className="text-xs border-surface-300 rounded-sm p-1 text-surface-600 font-medium bg-surface-50">
                                <option>Last 30 Days</option>
                                <option>Current Semester</option>
                            </select>
                        </div>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceData}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', color: '#fff' }}
                                        itemStyle={{ color: '#fff', fontSize: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="score" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Activity & Quick Actions */}
                    <div className="space-y-6 flex flex-col">

                        {/* Quick Actions */}
                        <div className="bg-white border border-surface-200 shadow-sm p-0">
                            <div className="p-4 border-b border-surface-100 bg-surface-50">
                                <h3 className="text-xs font-bold text-surface-800 uppercase tracking-wider">Quick Actions</h3>
                            </div>
                            <div className="divide-y divide-surface-100">
                                <ActionButton label="Create Assessment" onClick={onOpenCreateAssessment} />
                                <ActionButton label="Add Question to Bank" onClick={() => setActiveTab('questions')} />
                                <ActionButton label="Manage Enrollments" onClick={() => setActiveTab('classes')} />
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white border border-surface-200 shadow-sm p-0 flex-1 flex flex-col">
                            <div className="p-4 border-b border-surface-100 bg-surface-50 flex justify-between items-center">
                                <h3 className="text-xs font-bold text-surface-800 uppercase tracking-wider flex items-center gap-2">
                                    <Clock size={14} /> Recent Activity
                                </h3>
                                <span className="text-[10px] font-bold text-surface-400 uppercase">Live Feed</span>
                            </div>
                            <div className="p-0 overflow-y-auto max-h-[300px] flex-1">
                                {stats?.recentActivities?.length > 0 ? (
                                    <div className="divide-y divide-surface-50">
                                        {stats.recentActivities.map((log, i) => (
                                            <div key={i} className="p-4 hover:bg-surface-50 transition-colors flex gap-3">
                                                <div className="pt-1">
                                                    <div className="h-2 w-2 rounded-full bg-primary-500"></div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-surface-800 uppercase tracking-tight">{log.action?.replace(/_/g, ' ')}</p>
                                                    <p className="text-[10px] text-surface-400 font-mono mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-xs text-surface-400 italic">No recent activity found.</div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub Components ---

const KPICard = ({ title, value, icon: Icon, color }) => {
    const colors = {
        blue: 'text-blue-700 bg-blue-50',
        purple: 'text-purple-700 bg-purple-50',
        orange: 'text-orange-700 bg-orange-50',
        emerald: 'text-emerald-700 bg-emerald-50',
        red: 'text-red-700 bg-red-50',
        yellow: 'text-yellow-700 bg-yellow-50',
    };
    return (
        <div className="bg-white border border-surface-200 shadow-sm p-5 flex flex-col justify-between min-h-[120px] hover:border-primary-200 transition-colors relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon size={64} className="text-surface-900" />
            </div>
            <div className="flex justify-between items-start z-10">
                <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">{title}</span>
                <div className={`p-1.5 rounded-sm ${colors[color]}`}>
                    <Icon size={14} />
                </div>
            </div>
            <div className="mt-4 z-10">
                <span className="text-3xl font-bold text-surface-900 tracking-tight">{value}</span>
            </div>
        </div>
    );
};

const ActionButton = ({ label, onClick }) => (
    <button onClick={onClick} className="w-full text-left px-5 py-3 text-xs font-bold text-surface-600 hover:text-primary-700 hover:bg-surface-50 uppercase tracking-wide flex justify-between items-center group transition-all">
        {label}
        <span className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all">→</span>
    </button>
);

export default DashboardOverview;
