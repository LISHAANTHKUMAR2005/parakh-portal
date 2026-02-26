import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Clock, GraduationCap, School } from 'lucide-react';

const UserDetailModal = ({ user, targetUser, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (targetUser) {
            fetchHistory();
        }
    }, [targetUser]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Fetch audit logs related to this user (actor or target)
            const res = await fetch(`http://localhost:8081/api/admin/audit-logs`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const allLogs = data.content || [];
                // Filter logs where this user is the actor OR the target
                const relevant = allLogs.filter(l =>
                    l.actorEmail === targetUser.email ||
                    l.targetId === targetUser.id.toString() ||
                    (l.details && l.details.includes(targetUser.email))
                );
                setLogs(relevant);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!targetUser) return null;

    return (
        <div className="fixed inset-0 bg-surface-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl border border-surface-300 rounded-sm">
                {/* Header */}
                <div className="bg-primary-900 p-6 flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                        <div className="bg-primary-700 p-4 rounded-full text-white">
                            <User size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{targetUser.name}</h2>
                            <div className="flex gap-4 text-primary-200 text-sm mt-1">
                                <span className="flex items-center gap-1"><Mail size={14} /> {targetUser.email}</span>
                                <span className="flex items-center gap-1"><School size={14} /> {targetUser.institution || 'No Institution'}</span>
                                <span className="flex items-center gap-1 uppercase font-bold border border-primary-500 px-2 rounded-sm text-xs">{targetUser.role}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-primary-300 hover:text-white transition-colors"><X size={28} /></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 bg-surface-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-4 border border-surface-200 shadow-sm">
                            <p className="text-xs font-bold text-surface-500 uppercase">Account Status</p>
                            <p className={`text-lg font-bold ${targetUser.status === 'APPROVED' ? 'text-green-700' : 'text-yellow-700'}`}>{targetUser.status}</p>
                        </div>
                        <div className="bg-white p-4 border border-surface-200 shadow-sm">
                            <p className="text-xs font-bold text-surface-500 uppercase">User ID</p>
                            <p className="text-lg font-bold text-surface-800">#{targetUser.id}</p>
                        </div>
                        <div className="bg-white p-4 border border-surface-200 shadow-sm">
                            <p className="text-xs font-bold text-surface-500 uppercase">Total Activity Records</p>
                            <p className="text-lg font-bold text-primary-700">{logs.length}</p>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-surface-800 mb-4 border-b border-surface-200 pb-2 flex items-center gap-2">
                        <Clock size={20} className="text-surface-600" /> Activity History (Audit Trail)
                    </h3>

                    <div className="bg-white border border-surface-200 shadow-sm">
                        <table className="min-w-full divide-y divide-surface-200">
                            <thead className="bg-surface-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-surface-600 uppercase">Time</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-surface-600 uppercase">Action</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-surface-600 uppercase">Actor</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-surface-600 uppercase">IP Addr</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-200">
                                {loading ? <tr><td colSpan="4" className="p-4 text-center">Loading...</td></tr> :
                                    logs.length === 0 ? <tr><td colSpan="4" className="p-4 text-center text-surface-500">No activity logged for this user.</td></tr> :
                                        logs.map(log => (
                                            <tr key={log.id} className="hover:bg-surface-50">
                                                <td className="px-4 py-2 text-xs font-mono text-surface-500">{new Date(log.timestamp).toLocaleString()}</td>
                                                <td className="px-4 py-2 text-xs font-bold text-surface-800">{log.action}</td>
                                                <td className="px-4 py-2 text-xs text-surface-600">{log.actorEmail}</td>
                                                <td className="px-4 py-2 text-xs font-mono text-surface-400">{log.ipAddress || '-'}</td>
                                            </tr>
                                        ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8">
                        <h3 className="text-lg font-bold text-surface-800 mb-4 border-b border-surface-200 pb-2 flex items-center gap-2">
                            <GraduationCap size={20} className="text-surface-600" /> Exam Performance
                        </h3>
                        <div className="bg-white p-6 border border-surface-200 text-center text-surface-500 italic">
                            Performance data will appear here once the user attempts exams.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailModal;
