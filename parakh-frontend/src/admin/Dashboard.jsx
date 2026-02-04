import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// --- Reusable Components (Government Style) ---

const StatsCard = ({ label, value, color }) => (
  <div className="bg-white border border-surface-200 p-4 shadow-card">
    <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-3xl font-bold text-${color}-700`}>{value}</p>
  </div>
);

const QuestionModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    content: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', subject: 'Science', difficulty: 'Easy', topic: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        content: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', subject: 'Science', difficulty: 'Easy', topic: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-surface-900/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg border border-surface-300">
        <div className="border-b border-surface-200 pb-2 mb-4">
          <h3 className="text-lg font-bold text-primary-900">{initialData ? 'EDIT QUESTION' : 'ADD NEW QUESTION'}</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-surface-700 mb-1">Question Content</label>
            <textarea className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none rounded-none text-sm" rows="3" placeholder="Enter question text here..." value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {['A', 'B', 'C', 'D'].map((opt) => (
              <div key={opt}>
                <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Option {opt}</label>
                <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" placeholder={`Option ${opt}`} value={formData[`option${opt}`]} onChange={e => setFormData({ ...formData, [`option${opt}`]: e.target.value })} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Correct Answer</label>
              <select className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm bg-white" value={formData.correctOption} onChange={e => setFormData({ ...formData, correctOption: e.target.value })}>
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Difficulty</label>
              <select className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm bg-white" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Subject</label>
              <select className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm bg-white" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}>
                <option value="Science">Science</option>
                <option value="Mathematics">Mathematics</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Topic</label>
              <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" placeholder="e.g. Geometry" value={formData.topic || ''} onChange={e => setFormData({ ...formData, topic: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-surface-200">
          <button onClick={onClose} className="px-4 py-2 border border-surface-300 text-surface-700 bg-surface-50 hover:bg-surface-100 text-sm font-medium">CANCEL</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-primary-700 text-white hover:bg-primary-800 text-sm font-medium uppercase">{initialData ? 'Update Question' : 'Save Question'}</button>
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Data State
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalQuestions: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Fetch Data
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${user?.token}`, 'Content-Type': 'application/json' };
    const baseUrl = 'http://localhost:8081/api/admin';

    try {
      if (activeTab === 'overview') {
        const res = await fetch(`${baseUrl}/stats`, { headers });
        if (res.ok) setStats(await res.json());
      } else if (activeTab === 'users') {
        const res = await fetch(`${baseUrl}/users?status=APPROVED`, { headers });
        if (res.ok) setUsers(await res.json());
      } else if (activeTab === 'approvals') {
        const res = await fetch(`${baseUrl}/users?status=PENDING`, { headers });
        if (res.ok) setPendingUsers(await res.json());
      } else if (activeTab === 'questions') {
        const res = await fetch(`${baseUrl}/questions`, { headers });
        if (res.ok) setQuestions(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (id) => {
    await fetch(`http://localhost:8081/api/admin/users/${id}/approve`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${user?.token}` }
    });
    fetchData();
  };

  const handleRejectUser = async (id) => {
    if (!window.confirm("Reject this user account?")) return;
    await fetch(`http://localhost:8081/api/admin/users/${id}/reject`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${user?.token}` }
    });
    fetchData();
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    await fetch(`http://localhost:8081/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${user?.token}` }
    });
    fetchData();
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    await fetch(`http://localhost:8081/api/admin/questions/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${user?.token}` }
    });
    fetchData();
  };

  const handleSaveQuestion = async (data) => {
    const headers = { 'Authorization': `Bearer ${user?.token}`, 'Content-Type': 'application/json' };

    if (editingQuestion) {
      await fetch(`http://localhost:8081/api/admin/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
    } else {
      await fetch(`http://localhost:8081/api/admin/questions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
    }

    setIsModalOpen(false);
    setEditingQuestion(null);
    fetchData();
  };

  const openCreateModal = () => {
    setEditingQuestion(null);
    setIsModalOpen(true);
  };

  const openEditModal = (question) => {
    setEditingQuestion(question);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full bg-accent-100 flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-primary-900 text-white flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-primary-800 bg-primary-950">
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">PARAKH</h2>
          <p className="text-xs text-primary-200 uppercase tracking-widest">Admin Portal</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-4 py-2.5 text-sm font-medium border-l-4 ${activeTab === 'overview' ? 'bg-primary-800 border-white text-white' : 'border-transparent text-primary-100 hover:bg-primary-800 hover:text-white'}`}>Overview</button>
          <button onClick={() => setActiveTab('approvals')} className={`w-full text-left px-4 py-2.5 text-sm font-medium border-l-4 ${activeTab === 'approvals' ? 'bg-primary-800 border-white text-white' : 'border-transparent text-primary-100 hover:bg-primary-800 hover:text-white'}`}>Approvals</button>
          <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-2.5 text-sm font-medium border-l-4 ${activeTab === 'users' ? 'bg-primary-800 border-white text-white' : 'border-transparent text-primary-100 hover:bg-primary-800 hover:text-white'}`}>User Management</button>
          <button onClick={() => setActiveTab('questions')} className={`w-full text-left px-4 py-2.5 text-sm font-medium border-l-4 ${activeTab === 'questions' ? 'bg-primary-800 border-white text-white' : 'border-transparent text-primary-100 hover:bg-primary-800 hover:text-white'}`}>Question Bank</button>
        </nav>
        <div className="p-4 border-t border-primary-800 bg-primary-950">
          <div className="mb-3">
            <p className="text-sm font-semibold text-white">{user?.name || 'Administrator'}</p>
            <p className="text-xs text-primary-300">System Admin</p>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full px-3 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wide rounded-sm transition-colors text-center">Sign Out</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b border-surface-200 py-5 px-8">
          <h1 className="text-2xl font-bold text-primary-900 uppercase tracking-tight">{activeTab === 'users' ? 'User Management' : activeTab === 'questions' ? 'Question Bank' : activeTab}</h1>
        </header>

        <main className="p-8">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <span className="text-primary-600 font-medium">Loading data...</span>
            </div>
          ) : (
            <>
              {/* --- OVERVIEW TAB --- */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatsCard label="Total Registered Users" value={stats.totalUsers} color="primary" />
                  <StatsCard label="Questions in Bank" value={stats.totalQuestions} color="primary" />
                  <StatsCard label="System Status" value="Active" color="green" />
                </div>
              )}

              {/* --- APPROVALS TAB --- */}
              {activeTab === 'approvals' && (
                <div className="space-y-8">
                  {/* Teachers Section */}
                  <div>
                    <h3 className="text-lg font-bold text-surface-800 mb-3 border-l-4 border-primary-600 pl-3">Pending Teacher Requests</h3>
                    {pendingUsers.filter(u => u.role === 'TEACHER').length === 0 ? (
                      <div className="bg-white p-4 border border-surface-200 text-surface-500 text-sm">No pending requests found.</div>
                    ) : (
                      <div className="bg-white border border-surface-200 shadow-sm">
                        <table className="min-w-full divide-y divide-surface-200">
                          <thead className="bg-surface-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Applicant Name</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Email ID</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Institution</th>
                              <th className="px-6 py-3 text-right text-xs font-bold text-surface-600 uppercase tracking-wider">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-surface-200">
                            {pendingUsers.filter(u => u.role === 'TEACHER').map(u => (
                              <tr key={u.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900">{u.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600">{u.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600">{u.institution || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                  <button onClick={() => handleApproveUser(u.id)} className="text-green-700 hover:text-green-900 font-bold uppercase text-xs mr-4">Approve</button>
                                  <button onClick={() => handleRejectUser(u.id)} className="text-red-700 hover:text-red-900 font-bold uppercase text-xs">Reject</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Students Section */}
                  <div>
                    <h3 className="text-lg font-bold text-surface-800 mb-3 border-l-4 border-primary-600 pl-3">Pending Student Requests</h3>
                    {pendingUsers.filter(u => u.role === 'STUDENT').length === 0 ? (
                      <div className="bg-white p-4 border border-surface-200 text-surface-500 text-sm">No pending requests found.</div>
                    ) : (
                      <div className="bg-white border border-surface-200 shadow-sm">
                        <table className="min-w-full divide-y divide-surface-200">
                          <thead className="bg-surface-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Applicant Name</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Email ID</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Institution</th>
                              <th className="px-6 py-3 text-right text-xs font-bold text-surface-600 uppercase tracking-wider">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-surface-200">
                            {pendingUsers.filter(u => u.role === 'STUDENT').map(u => (
                              <tr key={u.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900">{u.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600">{u.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600">{u.institution || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                  <button onClick={() => handleApproveUser(u.id)} className="text-green-700 hover:text-green-900 font-bold uppercase text-xs mr-4">Approve</button>
                                  <button onClick={() => handleRejectUser(u.id)} className="text-red-700 hover:text-red-900 font-bold uppercase text-xs">Reject</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- USERS TAB --- */}
              {activeTab === 'users' && (
                <div className="bg-white border border-surface-200 shadow-sm">
                  <table className="min-w-full divide-y divide-surface-200">
                    <thead className="bg-surface-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Full Name</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Email Address</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Institution</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-surface-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-surface-200">
                      {users.map(u => (
                        <tr key={u.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">#{u.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900">{u.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600">{u.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wide border ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              u.role === 'TEACHER' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'
                              }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600">{u.institution || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <button onClick={() => handleDeleteUser(u.id)} className="text-red-700 hover:text-red-900 font-bold uppercase text-xs">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* --- QUESTIONS TAB --- */}
              {activeTab === 'questions' && (
                <div>
                  <div className="flex justify-end mb-4">
                    <button onClick={openCreateModal} className="px-4 py-2 bg-primary-700 text-white rounded-sm hover:bg-primary-800 text-sm font-bold uppercase tracking-wide shadow-sm">
                      + Add New Question
                    </button>
                  </div>
                  <div className="bg-white border border-surface-200 shadow-sm">
                    <table className="min-w-full divide-y divide-surface-200">
                      <thead className="bg-surface-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Subject</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Topic</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Difficulty</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Question Text</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-surface-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-surface-200">
                        {questions.map(q => (
                          <tr key={q.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">#{q.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-900">{q.subject}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600">{q.topic || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wide ${q.difficulty === 'Hard' ? 'text-red-700 bg-red-50 border border-red-200' :
                                q.difficulty === 'Medium' ? 'text-yellow-700 bg-yellow-50 border border-yellow-200' : 'text-green-700 bg-green-50 border border-green-200'
                                }`}>
                                {q.difficulty}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-surface-600 max-w-md truncate">{q.content}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <button onClick={() => openEditModal(q)} className="text-primary-700 hover:text-primary-900 font-bold uppercase text-xs mr-3">Edit</button>
                              <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-700 hover:text-red-900 font-bold uppercase text-xs">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <QuestionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveQuestion} initialData={editingQuestion} />
    </div>
  );
};

export default AdminDashboard;