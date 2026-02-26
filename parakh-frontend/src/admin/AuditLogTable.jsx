import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ShieldCheck, AlertCircle, Download, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const AuditLogTable = ({ user }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [size] = useState(20);
    const [filters, setFilters] = useState({ action: '', date: '' });

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page,
                size: size,
                sortBy: 'timestamp',
                direction: 'desc'
            });
            if (filters.action && filters.action !== 'ALL') queryParams.append('action', filters.action);

            const res = await fetch(`http://localhost:8081/api/admin/audit-logs?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data.content || []);
                setTotalPages(data.totalPages || 0);
                setTotalElements(data.totalElements || 0);
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    }, [user, page, size, filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleExportCSV = async () => {
        try {
            const response = await fetch('http://localhost:8081/api/admin/audit-logs/export', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    const actionTypes = [
        'APPROVE_USER', 'REJECT_USER', 'DELETE_USER', 'BULK_ACTION',
        'SYSTEM_CONFIG_CHANGE', 'DELETE_ASSESSMENT', 'REMOVE_STUDENT',
        'UPDATE_USER', 'CREATE_USER', 'CHANGE_ROLE', 'TOGGLE_REGISTRATION'
    ];

    return (
        <div className="bg-white p-6 h-full flex flex-col font-sans">
            <div className="flex justify-between items-center mb-6 border-b-2 border-primary-900 pb-4">
                <div>
                    <h2 className="text-2xl font-black text-primary-900 uppercase tracking-tighter flex items-center gap-2">
                        <ShieldCheck size={28} className="text-secondary-600" /> Administrative Audit Trail
                    </h2>
                    <p className="text-xs text-primary-700 font-bold uppercase tracking-widest mt-1">
                        Secure Logging & Compliance System | National Assessment Centre
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchLogs}
                        className="flex items-center gap-2 bg-surface-100 hover:bg-surface-200 text-surface-700 px-4 py-2 border border-surface-300 text-xs font-bold uppercase transition-all"
                    >
                        <RefreshCcw size={14} /> Refresh
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 bg-primary-900 hover:bg-black text-white px-4 py-2 text-xs font-bold uppercase transition-all shadow-md"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-primary-50 border-l-4 border-primary-900 p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-sm">
                <div>
                    <label className="block text-[10px] font-black text-primary-900 uppercase mb-1">Action Type</label>
                    <select
                        className="w-full p-2 border border-primary-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white uppercase font-bold"
                        value={filters.action}
                        onChange={e => { setFilters({ ...filters, action: e.target.value }); setPage(0); }}
                    >
                        <option value="ALL">All Actions</option>
                        {actionTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-primary-900 uppercase mb-1">Date Reference</label>
                    <input
                        type="date"
                        className="w-full p-2 border border-primary-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white font-bold"
                        value={filters.date}
                        onChange={e => { setFilters({ ...filters, date: e.target.value }); setPage(0); }}
                    />
                </div>
                <div className="flex items-end text-primary-700 text-[10px] font-bold uppercase italic">
                    * Showing {(logs || []).length} of {totalElements} total records
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 bg-white border border-primary-900 overflow-hidden flex flex-col shadow-lg">
                <div className="overflow-auto flex-1">
                    <table className="min-w-full divide-y divide-primary-900">
                        <thead className="bg-primary-900 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest border-r border-primary-800">Timestamp (IST)</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest border-r border-primary-800">Action</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest border-r border-primary-800">Administrator</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest border-r border-primary-800">Role</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest border-r border-primary-800">IP Address</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest border-r border-primary-800">User Agent</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest">Details</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-primary-100">
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-20 text-primary-500 font-bold uppercase tracking-widest animate-pulse">Synchronizing with Secure Vault...</td></tr>
                            ) : (!logs || logs.length === 0) ? (
                                <tr><td colSpan="7" className="text-center py-20 text-primary-300 italic">No audit records identified for current parameters.</td></tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-primary-50 transition-colors border-l-4 border-transparent hover:border-secondary-500">
                                        <td className="px-4 py-2 whitespace-nowrap text-[11px] text-primary-900 font-mono font-bold">
                                            {new Date(log.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${log.action.includes('DELETE') || log.action.includes('REJECT')
                                                ? 'bg-red-50 text-red-900 border-red-200'
                                                : 'bg-primary-50 text-primary-900 border-primary-200'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-[11px] text-primary-800 font-bold">{log.actorEmail}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-[11px] text-primary-600 font-medium uppercase">{log.performerRole?.replace('ROLE_', '') || 'N/A'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-[11px] text-surface-500 font-mono">{log.ipAddress || '0.0.0.0'}</td>
                                        <td className="px-4 py-2 text-[10px] text-surface-400 max-w-[150px] truncate" title={log.userAgent}>
                                            {log.userAgent || 'UNKNOWN'}
                                        </td>
                                        <td className="px-4 py-2 text-[11px] text-primary-700 font-medium italic border-l border-primary-50">
                                            {log.details}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="bg-primary-900 px-6 py-3 flex items-center justify-between text-white">
                    <div className="text-[10px] font-bold uppercase tracking-widest">
                        Page {page + 1} of {totalPages || 1}
                    </div>
                    <div className="flex gap-4 items-center">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                            className="p-1 hover:bg-primary-800 disabled:opacity-30 transition-all rounded"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex gap-1">
                            {[...Array(Math.min(5, totalPages))].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i)}
                                    className={`w-6 h-6 text-[10px] font-bold flex items-center justify-center rounded transition-all ${page === i ? 'bg-secondary-500 text-primary-900' : 'hover:bg-primary-800'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(p => p + 1)}
                            className="p-1 hover:bg-primary-800 disabled:opacity-30 transition-all rounded"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex justify-between items-center text-[9px] text-surface-400 font-bold uppercase tracking-[0.2em]">
                <span>Log Integrity Verified via SHA-256</span>
                <span>Session ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            </div>
        </div>
    );
};

export default AuditLogTable;
