import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { GraduationCap, Timer, TrendingUp, AlertTriangle, Briefcase } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AnalyticsDashboard = ({ user }) => {
    const [instStats, setInstStats] = useState({});
    const [perfStats, setPerfStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const instRes = await fetch('http://localhost:8081/api/admin/stats/institution', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const perfRes = await fetch('http://localhost:8081/api/admin/stats/performance', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });

            if (instRes.ok) setInstStats(await instRes.json());
            if (perfRes.ok) setPerfStats(await perfRes.json());
        } catch (e) {
            console.error("Failed to fetch analytics", e);
        } finally {
            setLoading(false);
        }
    };

    // Transformation for Charts
    const instData = instStats.usersPerInstitution ?
        Object.keys(instStats.usersPerInstitution).map(k => ({ name: k, users: instStats.usersPerInstitution[k], approvals: instStats.approvalsPerInstitution[k] || 0 })) : [];

    const diffData = perfStats.difficultyDistribution ?
        Object.keys(perfStats.difficultyDistribution).map((k, i) => ({ name: k, value: perfStats.difficultyDistribution[k] })) : [];

    return (
        <div className="bg-white p-6 h-full overflow-y-auto">
            <h2 className="text-xl font-bold text-surface-900 uppercase tracking-tight mb-6 border-b border-surface-200 pb-4">
                Performance & Institution Analytics
            </h2>

            {loading ? (
                <div className="flex justify-center items-center h-64 text-surface-500">Loading Analytics...</div>
            ) : (
                <div className="space-y-8">
                    {/* Key Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-surface-50 border border-surface-200 p-4 flex items-center gap-4">
                            <div className="bg-blue-100 p-3 rounded-full text-blue-700"><GraduationCap size={24} /></div>
                            <div>
                                <p className="text-xs font-bold text-surface-500 uppercase">Avg Score</p>
                                <p className="text-2xl font-bold text-surface-900">{perfStats.avgStudentScore}%</p>
                            </div>
                        </div>
                        <div className="bg-surface-50 border border-surface-200 p-4 flex items-center gap-4">
                            <div className="bg-green-100 p-3 rounded-full text-green-700"><Timer size={24} /></div>
                            <div>
                                <p className="text-xs font-bold text-surface-500 uppercase">Avg Time</p>
                                <p className="text-2xl font-bold text-surface-900">{perfStats.avgCompletionTime}m</p>
                            </div>
                        </div>
                        <div className="bg-surface-50 border border-surface-200 p-4 flex items-center gap-4">
                            <div className="bg-yellow-100 p-3 rounded-full text-yellow-700"><TrendingUp size={24} /></div>
                            <div>
                                <p className="text-xs font-bold text-surface-500 uppercase">Top Topic</p>
                                <p className="text-lg font-bold text-surface-900 truncate max-w-[120px]" title={perfStats.mostAttemptedTopic}>{perfStats.mostAttemptedTopic}</p>
                            </div>
                        </div>
                        <div className="bg-surface-50 border border-surface-200 p-4 flex items-center gap-4">
                            <div className="bg-purple-100 p-3 rounded-full text-purple-700"><Briefcase size={24} /></div>
                            <div>
                                <p className="text-xs font-bold text-surface-500 uppercase">Active Inst.</p>
                                <p className="text-2xl font-bold text-surface-900">{instData.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Institution Chart */}
                        <div className="bg-white border border-surface-200 shadow-sm p-4 h-80 flex flex-col">
                            <h3 className="text-sm font-bold text-surface-700 uppercase mb-4">Users by Institution</h3>
                            <div className="flex-1 min-h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={instData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip wrapperStyle={{ fontSize: '12px' }} />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Bar dataKey="users" fill="#1e40af" name="Total Users" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar dataKey="approvals" fill="#15803d" name="Approved" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Difficulty Distribution */}
                        <div className="bg-white border border-surface-200 shadow-sm p-4 h-80 flex flex-col">
                            <h3 className="text-sm font-bold text-surface-700 uppercase mb-4">Exam Difficulty Distribution</h3>
                            <div className="flex-1 min-h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={diffData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {diffData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;
