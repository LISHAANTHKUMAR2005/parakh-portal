import React, { useState, useEffect } from 'react';

const UserModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'STUDENT',
        institution: '',
        status: 'APPROVED'
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                password: '' // Don't show existing hash, allow overwrite
            });
        } else {
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'STUDENT',
                institution: '',
                status: 'APPROVED'
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-surface-900/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 w-full max-w-lg shadow-lg border border-surface-300">
                <div className="border-b border-surface-200 pb-2 mb-4">
                    <h3 className="text-lg font-bold text-primary-900 uppercase">
                        {initialData ? 'Edit User' : 'Add New User'}
                    </h3>
                </div>
                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Full Name</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Email Address</label>
                        <input
                            type="email"
                            className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm"
                            value={formData.email}
                            /* Email is usually immutable or handled carefully, but CRUD allows edit */
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            disabled={!!initialData} // Disable email edit for now to avoid ID confusion or require backend logic
                        />
                        {initialData && <p className="text-xs text-surface-400 mt-1">Email cannot be changed.</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">
                            {initialData ? 'Password (Leave blank to keep current)' : 'Password'}
                        </label>
                        <input
                            type="password"
                            className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    {/* Role & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Role</label>
                            <select
                                className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm bg-white"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="STUDENT">Student</option>
                                <option value="TEACHER">Teacher</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Status</label>
                            <select
                                className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm bg-white"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {/* Institution */}
                    <div>
                        <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Institution</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm"
                            value={formData.institution}
                            onChange={e => setFormData({ ...formData, institution: e.target.value })}
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-surface-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-surface-300 text-surface-700 bg-surface-50 hover:bg-surface-100 text-sm font-medium uppercase"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-primary-700 text-white hover:bg-primary-800 text-sm font-medium uppercase shadow-sm"
                    >
                        {initialData ? 'Update User' : 'Create User'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserModal;
