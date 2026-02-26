import React, { useState } from 'react';
import { X, Save, User, Mail, Shield, School, CheckCircle } from 'lucide-react';

const UserEditModal = ({ user, targetUser, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: targetUser.name || '',
        email: targetUser.email || '',
        role: targetUser.role || 'STUDENT',
        status: targetUser.status || 'PENDING',
        institution: targetUser.institution || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`http://localhost:8081/api/admin/users/${targetUser.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user?.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                alert("User updated successfully");
                onUpdate();
                onClose();
            } else {
                const data = await res.json();
                setError(data.message || "Update failed");
            }
        } catch (err) {
            setError("Server error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-surface-900/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md shadow-2xl border border-surface-300 flex flex-col">
                <div className="bg-primary-900 p-4 flex justify-between items-center">
                    <h2 className="text-white font-black uppercase tracking-tighter flex items-center gap-2">
                        <Save size={18} className="text-secondary-500" /> Edit System User
                    </h2>
                    <button onClick={onClose} className="text-primary-300 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && <div className="bg-red-50 text-red-700 p-3 mb-4 text-xs font-bold border-l-4 border-red-700">{error}</div>}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-primary-900 uppercase mb-1">Full Name</label>
                            <div className="relative">
                                <User size={14} className="absolute left-3 top-3 text-surface-400" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-9 p-2 border border-surface-300 text-sm focus:border-primary-600 outline-none bg-white font-bold"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-primary-900 uppercase mb-1">Email Address</label>
                            <div className="relative">
                                <Mail size={14} className="absolute left-3 top-3 text-surface-400" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-9 p-2 border border-surface-300 text-sm focus:border-primary-600 outline-none bg-white font-bold"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-primary-900 uppercase mb-1">System Role</label>
                                <div className="relative">
                                    <Shield size={14} className="absolute left-3 top-3 text-surface-400" />
                                    <select
                                        className="w-full pl-9 p-2 border border-surface-300 text-sm focus:border-primary-600 outline-none bg-white font-bold uppercase"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="STUDENT">Student</option>
                                        <option value="TEACHER">Teacher</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-primary-900 uppercase mb-1">Account Status</label>
                                <select
                                    className="w-full p-2 border border-surface-300 text-sm focus:border-primary-600 outline-none bg-white font-bold uppercase"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="APPROVED">Approved</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="REJECTED">Rejected</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-primary-900 uppercase mb-1">Institution</label>
                            <div className="relative">
                                <School size={14} className="absolute left-3 top-3 text-surface-400" />
                                <input
                                    type="text"
                                    className="w-full pl-9 p-2 border border-surface-300 text-sm focus:border-primary-600 outline-none bg-white font-bold"
                                    placeholder="Enter School/College Name"
                                    value={formData.institution}
                                    onChange={e => setFormData({ ...formData, institution: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 p-2 border border-surface-300 text-xs font-black uppercase text-surface-600 hover:bg-surface-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-primary-900 hover:bg-black text-white p-2 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? "Saving..." : <><Save size={14} /> Update User</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserEditModal;
