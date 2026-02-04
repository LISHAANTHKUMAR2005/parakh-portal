import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// --- Reusable Components ---

const StatsCard = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
    <div className={`w-12 h-12 bg-${color}-100 rounded-full flex items-center justify-center text-${color}-600 text-xl`}>
      {icon}
    </div>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">{initialData ? 'Edit Question' : 'Add New Question'}</h3>
        <div className="space-y-3">
          <input className="w-full p-2 border rounded" placeholder="Question Text" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <input className="p-2 border rounded" placeholder="Option A" value={formData.optionA} onChange={e => setFormData({ ...formData, optionA: e.target.value })} />
            <input className="p-2 border rounded" placeholder="Option B" value={formData.optionB} onChange={e => setFormData({ ...formData, optionB: e.target.value })} />
            <input className="p-2 border rounded" placeholder="Option C" value={formData.optionC} onChange={e => setFormData({ ...formData, optionC: e.target.value })} />
            <input className="p-2 border rounded" placeholder="Option D" value={formData.optionD} onChange={e => setFormData({ ...formData, optionD: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select className="p-2 border rounded" value={formData.correctOption} onChange={e => setFormData({ ...formData, correctOption: e.target.value })}>
              <option value="A">Correct: Option A</option>
              <option value="B">Correct: Option B</option>
              <option value="C">Correct: Option C</option>
              <option value="D">Correct: Option D</option>
            </select>
            <select className="p-2 border rounded" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <select className="p-2 border rounded" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}>
              <option value="Science">Science</option>
              <option value="Mathematics">Mathematics</option>
            </select>
            <input className="p-2 border rounded" placeholder="Topic (e.g. Geometry)" value={formData.topic || ''} onChange={e => setFormData({ ...formData, topic: e.target.value })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">{initialData ? 'Update' : 'Save'} Question</button>
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
      // Update
      await fetch(`http://localhost:8081/api/admin/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
    } else {
      // Create
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
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">PARAKH ADMIN</h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-4 py-3 rounded-lg ${activeTab === 'overview' ? 'bg-purple-600' : 'hover:bg-slate-800'}`}>📊 Overview</button>
          <button onClick={() => setActiveTab('approvals')} className={`w-full text-left px-4 py-3 rounded-lg ${activeTab === 'approvals' ? 'bg-purple-600' : 'hover:bg-slate-800'}`}>🔔 Approvals</button>
          <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-3 rounded-lg ${activeTab === 'users' ? 'bg-purple-600' : 'hover:bg-slate-800'}`}>👥 Users</button>
          <button onClick={() => setActiveTab('questions')} className={`w-full text-left px-4 py-3 rounded-lg ${activeTab === 'questions' ? 'bg-purple-600' : 'hover:bg-slate-800'}`}>📚 Question Bank</button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold">A</div>
            <div>
              <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors">Sign Out</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b border-gray-200 py-4 px-8">
          <h1 className="text-2xl font-bold text-gray-800 capitalize">{activeTab}</h1>
        </header>

        <main className="p-8">
          {loading ? (
            <div className="flex justify-center items-center h-64"><div className="animate-spin text-purple-600 text-4xl">🌀</div></div>
          ) : (
            <>
              {/* --- OVERVIEW TAB --- */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatsCard label="Total Users" value={stats.totalUsers} icon="👥" color="purple" />
                  <StatsCard label="Questions in Bank" value={stats.totalQuestions} icon="📚" color="blue" />
                  <StatsCard label="System Status" value="Online" icon="🟢" color="green" />
                </div>
              )}

              {/* --- APPROVALS TAB --- */}
              {activeTab === 'approvals' && (
                <div className="space-y-8">
                  {/* Teachers Section */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Pending Teacher Approvals</h3>
                    {pendingUsers.filter(u => u.role === 'TEACHER').length === 0 ? (
                      <p className="text-gray-500 italic">No pending teacher requests.</p>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {pendingUsers.filter(u => u.role === 'TEACHER').map(u => (
                          <div key={u.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500 flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-lg">{u.name}</h4>
                              <p className="text-sm text-gray-600">{u.email}</p>
                              <p className="text-sm text-blue-600 mt-1">{u.institution || 'No Institution'}</p>
                            </div>
                            <div className="space-x-2">
                              <button onClick={() => handleApproveUser(u.id)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                              <button onClick={() => handleRejectUser(u.id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Reject</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Students Section */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Pending Student Approvals</h3>
                    {pendingUsers.filter(u => u.role === 'STUDENT').length === 0 ? (
                      <p className="text-gray-500 italic">No pending student requests.</p>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {pendingUsers.filter(u => u.role === 'STUDENT').map(u => (
                          <div key={u.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500 flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-lg">{u.name}</h4>
                              <p className="text-sm text-gray-600">{u.email}</p>
                              <p className="text-sm text-blue-600 mt-1">{u.institution || 'No Institution'}</p>
                            </div>
                            <div className="space-x-2">
                              <button onClick={() => handleApproveUser(u.id)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                              <button onClick={() => handleRejectUser(u.id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Reject</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- USERS TAB --- */}
              {activeTab === 'users' && (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-gray-700 font-bold">Approved Users Directory</h3>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Institution</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map(u => (
                        <tr key={u.id}>
                          <td className="px-6 py-4 text-sm text-gray-500">#{u.id}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                          <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : u.role === 'TEACHER' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{u.role}</span></td>
                          <td className="px-6 py-4 text-sm text-gray-500">{u.institution || '-'}</td>
                          <td className="px-6 py-4 text-right text-sm">
                            <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-900">Delete</button>
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
                    <button onClick={openCreateModal} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow">+ Add Question</button>
                  </div>
                  <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {questions.map(q => (
                          <tr key={q.id}>
                            <td className="px-6 py-4 text-sm text-gray-500">#{q.id}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{q.subject}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{q.topic || '-'}</td>
                            <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded full text-xs ${q.difficulty === 'Hard' ? 'bg-red-100 text-red-800' : q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{q.difficulty}</span></td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">{q.content}</td>
                            <td className="px-6 py-4 text-right text-sm space-x-2">
                              <button onClick={() => openEditModal(q)} className="text-blue-600 hover:text-blue-900">Edit</button>
                              <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-600 hover:text-red-900">Delete</button>
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