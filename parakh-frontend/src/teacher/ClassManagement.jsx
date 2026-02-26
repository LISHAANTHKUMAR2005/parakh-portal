import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, BookOpen, UserPlus, Eye, ArrowLeft, MoreVertical, Edit, FileText, BarChart2 } from 'lucide-react';

const ClassManagement = ({ user }) => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewingClass, setViewingClass] = useState(null); // If set, shows Class Details

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState(null);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8081/api/teacher/classes', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) setClasses(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClass = async (data) => {
        try {
            const res = await fetch('http://localhost:8081/api/teacher/classes', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user?.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                setIsCreateModalOpen(false);
                fetchClasses();
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteClass = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this class? This action cannot be undone.")) return;
        try {
            const res = await fetch(`http://localhost:8081/api/teacher/classes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                fetchClasses();
                if (viewingClass?.id === id) setViewingClass(null);
            }
        } catch (e) { console.error(e); }
    };

    const handleRemoveStudent = async (studentId) => {
        if (!window.confirm("Remove this student from the class?")) return;
        try {
            const res = await fetch(`http://localhost:8081/api/teacher/classes/${viewingClass.id}/students/${studentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                alert("Student removed successfully");
                fetchClasses();
            } else {
                alert("Failed to remove student");
            }
        } catch (e) {
            console.error(e);
            alert("Error removing student");
        }
    };

    const handleAddStudent = async (email) => {
        try {
            const res = await fetch(`http://localhost:8081/api/teacher/classes/${selectedClassId}/add-students`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user?.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (res.ok) {
                alert("Student added successfully");
                setIsAddStudentModalOpen(false);
                if (viewingClass) {
                    // Update detail view locally implies we need full class object. 
                    // Best to re-fetch specific class or just reload all.
                    // Since viewingClass is just the map from the list, reload all is easiest.
                    fetchClasses().then(() => {
                        // After fetch, update viewingClass from new list
                        // This logic is tricky with async state.
                        // Ideally backend returns updated class.
                    });
                } else {
                    fetchClasses();
                }
            } else {
                alert("Failed to add student. Ensure email is correct and student is registered.");
            }
        } catch (e) { alert("Error adding student"); }
    };

    // Helper to refresh filtered class
    useEffect(() => {
        if (viewingClass) {
            const updated = classes.find(c => c.id === viewingClass.id);
            if (updated) setViewingClass(updated);
        }
    }, [classes]);

    const openClassDetails = (cls) => {
        setViewingClass(cls);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b border-surface-200 pb-4">
                <div className="flex items-center gap-3">
                    {viewingClass && (
                        <button onClick={() => setViewingClass(null)} className="p-2 hover:bg-surface-200 rounded-full text-surface-600 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-surface-900 uppercase tracking-tight flex items-center gap-2">
                            {viewingClass ? viewingClass.name : 'My Classes'}
                        </h2>
                        {!viewingClass && <p className="text-sm text-surface-500">Manage your classrooms, students, and curriculum.</p>}
                        {viewingClass && <p className="text-sm text-surface-500">{viewingClass.subject} • {viewingClass.students?.length || 0} Students</p>}
                    </div>
                </div>
                {!viewingClass && (
                    <button onClick={() => setIsCreateModalOpen(true)} className="bg-primary-700 text-white px-5 py-2.5 rounded-sm text-sm font-bold uppercase hover:bg-primary-800 flex items-center gap-2 shadow-sm transition-all hover:translate-y-[-1px]">
                        <Plus size={18} /> Create Class
                    </button>
                )}
                {viewingClass && (
                    <div className="flex gap-2">
                        <button className="bg-surface-100 text-surface-700 border border-surface-300 px-4 py-2 rounded-sm text-sm font-bold uppercase hover:bg-surface-200 flex items-center gap-2">
                            <Edit size={16} /> Edit
                        </button>
                        <button onClick={() => { setSelectedClassId(viewingClass.id); setIsAddStudentModalOpen(true); }} className="bg-primary-700 text-white px-4 py-2 rounded-sm text-sm font-bold uppercase hover:bg-primary-800 flex items-center gap-2">
                            <UserPlus size={16} /> Add Student
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {loading && classes.length === 0 ? (
                    <div className="flex justify-center items-center h-40 text-surface-500 font-medium">Loading academic data...</div>
                ) : (
                    <>
                        {/* CLASS LIST VIEW */}
                        {!viewingClass && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {classes.map(c => (
                                    <div key={c.id} onClick={() => openClassDetails(c)} className="bg-white border border-surface-200 shadow-sm hover:shadow-md transition-all cursor-pointer group rounded-sm overflow-hidden flex flex-col">
                                        <div className="p-6 flex-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-primary-50 rounded-full text-primary-700 flex items-center justify-center">
                                                    <BookOpen size={24} />
                                                </div>
                                                <div className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">
                                                    Active
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-surface-900 mb-1 group-hover:text-primary-700 transition-colors">{c.name}</h3>
                                            <p className="text-sm font-bold text-surface-500 uppercase tracking-wide mb-3">{c.subject}</p>
                                            <p className="text-surface-600 text-sm line-clamp-2">{c.description || 'No description provided.'}</p>
                                        </div>

                                        <div className="bg-surface-50 px-6 py-4 border-t border-surface-100 grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <p className="text-xs text-surface-500 font-bold uppercase">Students</p>
                                                <p className="text-lg font-bold text-surface-800">{c.students ? c.students.length : c.studentCount}</p>
                                            </div>
                                            <div className="border-l border-surface-200">
                                                <p className="text-xs text-surface-500 font-bold uppercase">Tests</p>
                                                <p className="text-lg font-bold text-surface-800">{c.testCount || 0}</p>
                                            </div>
                                            <div className="border-l border-surface-200">
                                                <p className="text-xs text-surface-500 font-bold uppercase">Avg Score</p>
                                                <p className={`text-lg font-bold ${c.avgPerformance >= 75 ? 'text-green-600' : c.avgPerformance >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                    {c.avgPerformance || 0}%
                                                </p>
                                            </div>
                                        </div>

                                        <div className="px-6 py-3 bg-white border-t border-surface-100 flex justify-between items-center">
                                            <span className="text-xs text-surface-400">Created {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}</span>
                                            <button onClick={(e) => handleDeleteClass(c.id, e)} className="text-surface-400 hover:text-red-600 transition-colors p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {classes.length === 0 && (
                                    <div className="col-span-full border-2 border-dashed border-surface-300 rounded-sm p-12 flex flex-col items-center justify-center text-surface-500 bg-surface-50">
                                        <BookOpen size={48} className="mb-4 text-surface-300" />
                                        <h3 className="text-lg font-bold text-surface-700 uppercase">No Classes Found</h3>
                                        <p className="text-sm">Get started by creating your first classroom.</p>
                                        <button onClick={() => setIsCreateModalOpen(true)} className="mt-4 text-primary-700 font-bold uppercase hover:underline">Create Class</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SINGLE CLASS DETAIL VIEW */}
                        {viewingClass && (
                            <div className="bg-white border border-surface-200 shadow-sm rounded-sm overflow-hidden">
                                <div className="p-6 border-b border-surface-200 flex justify-between items-center bg-surface-50">
                                    <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wide flex items-center gap-2">
                                        <Users size={16} /> Enrolled Students ({viewingClass.students?.length || 0})
                                    </h3>
                                    <div className="flex gap-2">
                                        <button className="text-primary-700 text-xs font-bold uppercase hover:underline">Export List</button>
                                    </div>
                                </div>
                                <table className="min-w-full divide-y divide-surface-200">
                                    <thead className="bg-white">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-surface-500 uppercase tracking-wider">Student Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-surface-500 uppercase tracking-wider">Email Address</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-surface-500 uppercase tracking-wider">Performance</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-surface-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-surface-100">
                                        {viewingClass.students && viewingClass.students.length > 0 ? (
                                            viewingClass.students.map(s => (
                                                <tr key={s.id} className="hover:bg-surface-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-surface-900">{s.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600 font-mono">{s.email}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-bold">N/A</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                        <button onClick={() => handleRemoveStudent(s.id)} className="text-surface-400 hover:text-red-600 transition-colors pointer-events-auto">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-12 text-center text-surface-500 italic">
                                                    No students enrolled in this class yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* MODALS */}
            <CreateClassModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={handleCreateClass} />
            <AddStudentModal isOpen={isAddStudentModalOpen} onClose={() => setIsAddStudentModalOpen(false)} onSave={handleAddStudent} />
        </div>
    );
};

// Sub-components (Kept same logic, updated style slightly)
const CreateClassModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({ name: '', subject: '', description: '' });
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-surface-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-surface-300 shadow-2xl p-6 w-full max-w-md rounded-sm">
                <div className="border-b border-surface-200 pb-4 mb-6">
                    <h3 className="text-xl font-bold text-primary-900 uppercase tracking-tight">Create New Class</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Class Name</label>
                        <input className="w-full p-2.5 border border-surface-300 focus:border-primary-600 outline-none text-sm transition-colors" placeholder="e.g. Class 10-A" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Subject</label>
                        <input className="w-full p-2.5 border border-surface-300 focus:border-primary-600 outline-none text-sm transition-colors" placeholder="e.g. Science" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Description</label>
                        <textarea className="w-full p-2.5 border border-surface-300 focus:border-primary-600 outline-none text-sm transition-colors" rows="3" placeholder="Enter class description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                </div>
                <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-surface-200">
                    <button onClick={onClose} className="px-5 py-2 border border-surface-300 text-surface-700 bg-white hover:bg-surface-50 text-sm font-bold uppercase transition-colors">Cancel</button>
                    <button onClick={() => onSave(formData)} className="px-5 py-2 bg-primary-700 text-white hover:bg-primary-800 text-sm font-bold uppercase shadow-sm transition-colors">Create Class</button>
                </div>
            </div>
        </div>
    );
};

const AddStudentModal = ({ isOpen, onClose, onSave }) => {
    const [email, setEmail] = useState('');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-surface-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-surface-300 shadow-2xl p-6 w-full max-w-md rounded-sm">
                <div className="border-b border-surface-200 pb-4 mb-6">
                    <h3 className="text-xl font-bold text-primary-900 uppercase tracking-tight">Add Student</h3>
                </div>
                <div className="mb-6">
                    <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Student Email ID</label>
                    <input className="w-full p-2.5 border border-surface-300 focus:border-primary-600 outline-none text-sm transition-colors" placeholder="student@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                    <p className="text-xs text-surface-400 mt-2">Student must already be registered in the system.</p>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-surface-200">
                    <button onClick={onClose} className="px-5 py-2 border border-surface-300 text-surface-700 bg-white hover:bg-surface-50 text-sm font-bold uppercase transition-colors">Cancel</button>
                    <button onClick={() => onSave(email)} className="px-5 py-2 bg-primary-700 text-white hover:bg-primary-800 text-sm font-bold uppercase shadow-sm transition-colors">Add Student</button>
                </div>
            </div>
        </div>
    );
};

export default ClassManagement;
