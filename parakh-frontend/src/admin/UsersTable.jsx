import React, { useState, useEffect } from 'react';
import { User, Shield, GraduationCap, XOctagon, CheckSquare, Search, Trash2 } from 'lucide-react';
import UserDetailModal from './UserDetailModal';
import UserEditModal from './UserEditModal';

const UsersTable = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ search: '', role: '', status: '' });
    const [pagination, setPagination] = useState({ page: 0, size: 10, totalPages: 0, totalElements: 0 });

    const [detailUser, setDetailUser] = useState(null);
    const [editUser, setEditUser] = useState(null);

    // Bulk Selection
    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedUsers(users.map(u => u.id));
        else setSelectedUsers([]);
    };

    const handleSelectOne = (id) => {
        if (selectedUsers.includes(id)) setSelectedUsers(selectedUsers.filter(uid => uid !== id));
        else setSelectedUsers([...selectedUsers, id]);
    };

    useEffect(() => {
        fetchUsers();
    }, [filters, pagination.page]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let url = `http://localhost:8081/api/admin/users?page=${pagination.page}&size=${pagination.size}`;
            if (filters.role && filters.status) url += `&role=${filters.role}&status=${filters.status}`;
            else if (filters.role) url += `&role=${filters.role}`;
            else if (filters.status) url += `&status=${filters.status}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const pageData = await res.json();
                let content = pageData.content || [];

                if (filters.search) {
                    content = content.filter(u =>
                        u.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                        u.email.toLowerCase().includes(filters.search.toLowerCase())
                    );
                }
                setUsers(content);
                setPagination(prev => ({
                    ...prev,
                    totalPages: pageData.totalPages,
                    totalElements: pageData.totalElements
                }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const performBulkAction = async (actionType) => {
        if (!window.confirm(`Are you sure you want to ${actionType} ${selectedUsers.length} users?`)) return;

        let endpoint = '';
        switch (actionType) {
            case 'APPROVE': endpoint = 'approve'; break;
            case 'REJECT': endpoint = 'reject'; break;
            case 'DELETE': endpoint = 'delete'; break;
            default: return;
        }

        try {
            await fetch(`http://localhost:8081/api/admin/users/bulk/${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user?.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(selectedUsers)
            });
            alert(`Bulk ${actionType} successful`);
            fetchUsers();
            setSelectedUsers([]);
        } catch (e) {
            alert("Action failed");
        }
    };

    return (
        <div className="flex flex-col h-full bg-white p-6 relative">
            {detailUser && <UserDetailModal targetUser={detailUser} user={{ token: user.token }} onClose={() => setDetailUser(null)} />}
            {editUser && <UserEditModal targetUser={editUser} user={{ token: user.token }} onClose={() => setEditUser(null)} onUpdate={fetchUsers} />}

            <div className="flex justify-between items-center mb-6 border-b border-surface-200 pb-4">
                <h2 className="text-xl font-bold text-surface-900 uppercase tracking-tight flex items-center gap-2">
                    <User className="text-primary-700" /> User Directory
                </h2>
                <div className="flex gap-2">
                    {selectedUsers.length > 0 && (
                        <div className="flex bg-surface-100 rounded px-2 py-1 items-center gap-2">
                            <span className="text-xs font-bold text-surface-600 uppercase">{selectedUsers.length} Selected</span>
                            <button onClick={() => performBulkAction('APPROVE')} className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 uppercase hover:bg-green-200">Approve</button>
                            <button onClick={() => performBulkAction('REJECT')} className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 uppercase hover:bg-yellow-200">Reject</button>
                            <button onClick={() => performBulkAction('DELETE')} className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 uppercase hover:bg-red-200">Delete</button>
                        </div>
                    )}
                    <button onClick={fetchUsers} className="text-primary-600 hover:text-primary-800 p-2 rounded hover:bg-surface-50">
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-surface-50 border border-surface-200 p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                    type="text"
                    placeholder="Search name or email..."
                    className="w-full p-2 border border-surface-300 text-sm focus:border-primary-600 outline-none bg-white"
                    value={filters.search}
                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                />
                <select className="p-2 border border-surface-300 text-sm focus:border-primary-600 bg-white" onChange={e => setFilters({ ...filters, role: e.target.value })}>
                    <option value="">All Roles</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Admin</option>
                </select>
                <select className="p-2 border border-surface-300 text-sm focus:border-primary-600 bg-white" onChange={e => setFilters({ ...filters, status: e.target.value })}>
                    <option value="">All Statuses</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            {/* Table */}
            <div className="flex-1 bg-white border border-surface-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="min-w-full divide-y divide-surface-200">
                        <thead className="bg-surface-50 sticky top-0 shadow-sm z-10">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <input type="checkbox" onChange={handleSelectAll} checked={selectedUsers.length === users.length && users.length > 0} className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Institution</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-surface-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-surface-200">
                            {users.map(u => (
                                <tr key={u.id} className={selectedUsers.includes(u.id) ? 'bg-primary-50' : 'hover:bg-surface-50'}>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => handleSelectOne(u.id)} className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-surface-500">#{u.id}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-sm font-bold text-surface-900">{u.name}</p>
                                        <p className="text-xs text-surface-500">{u.email}</p>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`flex items-center gap-1 w-max px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : u.role === 'TEACHER' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                            {u.role === 'ADMIN' ? <Shield size={10} /> : u.role === 'TEACHER' ? <CheckSquare size={10} /> : <GraduationCap size={10} />}
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-surface-600">{u.institution || '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${u.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' : u.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-mono">
                                        <button onClick={() => setDetailUser(u)} className="text-primary-700 hover:text-primary-900 font-bold uppercase mr-3">Detail</button>
                                        <button onClick={() => setEditUser(u)} className="text-red-700 hover:text-red-900 font-bold uppercase">Edit</button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && <tr><td colSpan="7" className="text-center py-8 text-surface-500">No users found</td></tr>}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Controls */}
                <div className="bg-surface-50 border-t border-surface-200 p-4 flex justify-between items-center text-xs text-surface-600 font-medium">
                    <div>
                        Showing <span className="text-surface-900">{users.length}</span> of <span className="text-surface-900">{pagination.totalElements}</span> users
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={pagination.page === 0}
                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            className="px-3 py-1 border border-surface-300 bg-white rounded hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <div className="flex items-center px-3 bg-white border border-surface-300 rounded font-bold text-primary-700">
                            Page {pagination.page + 1} of {Math.max(1, pagination.totalPages)}
                        </div>
                        <button
                            disabled={pagination.page >= pagination.totalPages - 1}
                            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            className="px-3 py-1 border border-surface-300 bg-white rounded hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsersTable;
