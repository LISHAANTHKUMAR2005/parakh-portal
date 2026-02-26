import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Activity, Users, UserPlus, AlertTriangle, CheckCircle, Server,
    Shield, Bell, Clock, LogIn, FileText
} from 'lucide-react';

const COLORS = ['#1e40af', '#15803d', '#b45309', '#7e22ce']; // Primary, Green, Yellow, Purple

// --- Components ---

const HealthPanel = () => {
    const [metrics, setMetrics] = useState({ cpu: 12, memory: 45, latency: 24 });

    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics({
                cpu: Math.floor(Math.random() * 20) + 10,
                memory: Math.floor(Math.random() * 10) + 40,
                latency: Math.floor(Math.random() * 20) + 20
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white border border-surface-200 shadow-sm p-4 h-full">
            <div className="flex items-center justify-between mb-4 border-b border-surface-100 pb-2">
                <h3 className="text-sm font-bold text-surface-700 uppercase tracking-wide flex items-center gap-2">
                    <Activity size={16} className="text-green-600" /> System Health
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-bold uppercase animate-pulse">
                    Operational
                </span>
            </div>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-xs mb-1 uppercase font-semibold text-surface-500">
                        <span>Server CPU Load</span>
                        <span>{metrics.cpu}%</span>
                    </div>
                    <div className="w-full bg-surface-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${metrics.cpu}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1 uppercase font-semibold text-surface-500">
                        <span>Memory Usage</span>
                        <span>{metrics.memory}%</span>
                    </div>
                    <div className="w-full bg-surface-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 transition-all duration-500" style={{ width: `${metrics.memory}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1 uppercase font-semibold text-surface-500">
                        <span>Network Latency</span>
                        <span>{metrics.latency}ms</span>
                    </div>
                    <div className="w-full bg-surface-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-green-600 transition-all duration-500" style={{ width: `${metrics.latency}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SecurityMonitor = ({ audits }) => {
    const auditList = Array.isArray(audits) ? audits : [];
    const recentFailures = auditList.filter(l => l.action?.includes('FAIL') || l.action?.includes('DENIED')).length;

    return (
        <div className="bg-white border border-surface-200 shadow-sm p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-surface-100 pb-2">
                <h3 className="text-sm font-bold text-surface-700 uppercase tracking-wide flex items-center gap-2">
                    <Shield size={16} className="text-primary-700" /> Security Monitor
                </h3>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2">
                {recentFailures > 0 ? (
                    <>
                        <AlertTriangle size={32} className="text-red-600 mb-1" />
                        <p className="text-red-700 font-bold text-sm">Security Alert</p>
                        <p className="text-xs text-surface-500">{recentFailures} failed attempts detected</p>
                    </>
                ) : (
                    <>
                        <div className="relative">
                            <Shield size={40} className="text-green-600" />
                            <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                        </div>
                        <p className="text-green-700 font-bold text-sm mt-2">System Secure</p>
                        <p className="text-xs text-surface-500">No recent threats detected</p>
                        <p className="text-[10px] text-surface-400 mt-1 uppercase">Last Scan: Just now</p>
                    </>
                )}
            </div>
        </div>
    );
};

const NoticeBoard = () => {
    return (
        <div className="bg-white border border-surface-200 shadow-sm p-4 h-full">
            <div className="flex items-center justify-between mb-4 border-b border-surface-100 pb-2">
                <h3 className="text-sm font-bold text-surface-700 uppercase tracking-wide flex items-center gap-2">
                    <Bell size={16} className="text-yellow-600" /> Admin Notices
                </h3>
            </div>
            <div className="space-y-3">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2">
                    <p className="text-xs font-bold text-yellow-800 uppercase mb-0.5">Maintenance</p>
                    <p className="text-xs text-yellow-700">Scheduled server maintenance on Sunday at 2:00 AM.</p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-2">
                    <p className="text-xs font-bold text-blue-800 uppercase mb-0.5">Policy Update</p>
                    <p className="text-xs text-blue-700">New examination guidelines have been updated.</p>
                </div>
            </div>
        </div>
    );
}

const RecentActivityTable = ({ audits }) => (
    <div className="bg-white border border-surface-200 shadow-sm p-0 h-full overflow-hidden flex flex-col">
        <div className="p-4 border-b border-surface-200">
            <h3 className="text-sm font-bold text-surface-700 uppercase tracking-wide flex items-center gap-2">
                <Clock size={16} className="text-surface-500" /> Recent System Activity
            </h3>
        </div>
        <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-surface-100">
                <thead className="bg-surface-50 sticky top-0">
                    <tr>
                        <th className="px-4 py-2 text-left text-[10px] font-bold text-surface-500 uppercase">Time</th>
                        <th className="px-4 py-2 text-left text-[10px] font-bold text-surface-500 uppercase">Action</th>
                        <th className="px-4 py-2 text-left text-[10px] font-bold text-surface-500 uppercase">User</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                    {(Array.isArray(audits) ? audits : []).slice(0, 5).map((log, idx) => (
                        <tr key={idx} className="hover:bg-surface-50">
                            <td className="px-4 py-2 text-xs text-surface-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                            <td className="px-4 py-2 text-xs font-medium text-surface-800">{log.action}</td>
                            <td className="px-4 py-2 text-xs text-surface-500 truncate max-w-[100px]" title={log.actorEmail}>{log.actorEmail}</td>
                        </tr>
                    ))}
                    {(!Array.isArray(audits) || audits.length === 0) && (
                        <tr><td colSpan="3" className="px-4 py-4 text-center text-xs text-surface-400">No activity recorded</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const AdminOverview = ({ stats, users, pendingUsers, auditLogs }) => {
    // Prepare Data for Charts
    const usersList = Array.isArray(users) ? users : [];
    const pendingList = Array.isArray(pendingUsers) ? pendingUsers : [];
    const roleData = [
        { name: 'Students', value: usersList.filter(u => u.role === 'STUDENT').length },
        { name: 'Teachers', value: usersList.filter(u => u.role === 'TEACHER').length },
        { name: 'Admins', value: usersList.filter(u => u.role === 'ADMIN').length },
    ].filter(d => d.value > 0);

    // Mock Trend Data if no real dates available, otherwise aggregate
    // For MVP, we'll generate a "last 7 days" trend based on random distribution or mock it for visuals as requested
    const trendData = [
        { day: 'Mon', count: 12 }, { day: 'Tue', count: 19 }, { day: 'Wed', count: 15 },
        { day: 'Thu', count: 22 }, { day: 'Fri', count: 30 }, { day: 'Sat', count: 45 },
        { day: 'Sun', count: stats.totalUsers || 50 }
    ];

    return (
        <div className="flex flex-col gap-4 h-full p-2">

            {/* Top Row: Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 border-l-4 border-primary-600 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Total Users</p>
                            <p className="text-2xl font-bold text-primary-900">{stats.totalUsers}</p>
                        </div>
                        <Users size={20} className="text-primary-200" />
                    </div>
                </div>
                <div className="bg-white p-4 border-l-4 border-green-600 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Active Exams</p>
                            <p className="text-2xl font-bold text-green-900">{stats.totalQuestions > 0 ? '12' : '0'}</p>
                            {/* Mocked Active Exams for now as it's not in stats prop yet */}
                        </div>
                        <FileText size={20} className="text-green-200" />
                    </div>
                </div>
                <div className="bg-white p-4 border-l-4 border-yellow-500 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Pending</p>
                            <p className="text-2xl font-bold text-yellow-900">{pendingList.length}</p>
                        </div>
                        <UserPlus size={20} className="text-yellow-200" />
                    </div>
                </div>
                <div className="bg-white p-4 border-l-4 border-purple-600 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">System Load</p>
                            <p className="text-2xl font-bold text-purple-900">Normal</p>
                        </div>
                        <Activity size={20} className="text-purple-200" />
                    </div>
                </div>
                <div className="bg-white p-4 border-l-4 border-indigo-600 shadow-sm hidden lg:block">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Uptime</p>
                            <p className="text-2xl font-bold text-indigo-900">99.9%</p>
                        </div>
                        <Server size={20} className="text-indigo-200" />
                    </div>
                </div>
            </div>

            {/* Middle Row: Charts & Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-64 lg:h-72">
                {/* Trend Chart */}
                <div className="bg-white border border-surface-200 shadow-sm p-4 col-span-1 lg:col-span-2 flex flex-col">
                    <h3 className="text-sm font-bold text-surface-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Activity size={16} className="text-primary-600" /> Registration Trend (Last 7 Days)
                    </h3>
                    <div className="flex-1 w-full min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1e40af" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#1e40af" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="count" stroke="#1e40af" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* User Distribution */}
                <div className="bg-white border border-surface-200 shadow-sm p-4 flex flex-col">
                    <h3 className="text-sm font-bold text-surface-700 uppercase tracking-wide mb-2">User Distribution</h3>
                    <div className="flex-1 min-h-[220px] relative">
                        {roleData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={roleData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {roleData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-surface-400">No data available</div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-surface-800">{stats.totalUsers}</span>
                                <span className="block text-[10px] text-surface-500 uppercase">Total</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Activity, Health, Notices */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-64">
                <RecentActivityTable audits={auditLogs} />

                <div className="bg-white border border-surface-200 shadow-sm p-0 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-surface-200 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-surface-700 uppercase tracking-wide flex items-center gap-2">
                            <UserPlus size={16} className="text-surface-500" /> Pending Approvals
                        </h3>
                        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">{pendingList.length}</span>
                    </div>
                    <div className="flex-1 overflow-auto p-0">
                        {pendingList.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-xs text-surface-500 italic">No pending requests</div>
                        ) : (
                            <ul className="divide-y divide-surface-100">
                                {pendingList.slice(0, 4).map(u => (
                                    <li key={u.id} className="p-3 hover:bg-surface-50 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-bold text-surface-800">{u.name}</p>
                                            <p className="text-[10px] text-surface-500">{u.role}</p>
                                        </div>
                                        <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded uppercase font-bold">Pending</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="hidden lg:block">
                    <HealthPanel />
                </div>

                <div className="hidden lg:block flex flex-col gap-4">
                    <SecurityMonitor audits={auditLogs} />
                </div>
            </div>

            {/* Footer / Extra Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:hidden">
                <HealthPanel />
                <SecurityMonitor audits={auditLogs} />
                <NoticeBoard />
            </div>

            <div className="hidden lg:grid grid-cols-1 gap-4">
                <NoticeBoard />
            </div>
        </div>
    );
};

export default AdminOverview;
